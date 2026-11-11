import { Command, Ipc, Plugin, SettingsPage, Slot, Store, Style, createKeyed } from "@opencode/plugin/gui"
import { Browser } from "@opencode/plugin/gui/browser"
import { Schema } from "effect"
// A window gets an inert module. Only the main process uses it.
import { app, safeStorage, webContents } from "electron"
import { createComponent, createEffect, createRoot, createSignal, onCleanup } from "solid-js"
import { insert } from "solid-js/web"
import { archive } from "./archive.js"
import * as branch from "./branch.js"
import * as composer from "./composer.js"
import * as cookies from "./cookies.js"
import * as elapsed from "./elapsed.js"
import { github, strings as githubStrings } from "./github/index.jsx"
import * as links from "./links.js"
import * as menu from "./menu.js"
import * as pr from "./pr.js"
import { sessions } from "./sessions.js"
import { settings } from "./settings.js"
import * as shell from "./shell.js"
import * as sidebar from "./sidebar.js"
import * as timeline from "./timeline.js"
import * as usage from "./usage.js"
import * as userMessage from "./user-message.js"
import { strings as workflowStrings, workflows } from "./workflows/index.jsx"

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// The app's command that opens a new session in the open session's folder (⌘T). App command ids can change between
// releases; when it is gone, the project menu row falls back to the plugin API.
const NEW_TAB = "tab.new"

// The desktop app's own server.
const SIDECAR = "sidecar"

// The settings row of the switch of the sidebar changes.
const SIDEBAR = "opencode-plus-sidebar"

// The automatic archive in the main process, for the windows: `sweep` archives the due sessions at once, and `open`
// tells which sessions the window shows.
const Archive = (id) =>
  Ipc.define({ id: `${id}.archive`, methods: { sweep: {}, open: { input: Schema.Array(Schema.String) } } })

// Each window: restyles the sidebar, the chat input, and the conversation. The app has no plugin API for these, so a
// pass over the page applies every change after each change to the page.
function setup(ctx) {
  const options = settings(ctx.options)
  const { groups, working, inbox } = ctx.stores

  // Fills `parent` with the app's icon `name`.
  const icon = (name, props) => (parent) => insert(parent, () => createComponent(ctx.ui.Icon, { name, ...props }))

  // Whether session `id` itself works, as the app's sidebar decides it from `data`, the sessions of a server.
  const busy = (data, id) =>
    data.status(id) === "running" || data.pending.list(id).some((item) => item.type !== "synthetic")

  // Whether the open session still works. The plugin docs do not describe this part of `server.data`; if a release
  // changes it, the divider treats the session as idle instead of stopping every pass.
  const running = () => {
    const session = ctx.sessions.current()

    try {
      return !!session && busy(session.server.data.session, session.id)
    } catch {
      return false
    }
  }

  // The name of `project` in the sidebar: its name, else its folder's.
  const named = (project) => project.name || project.canonical.split("/").pop()

  // The most recently active project that the sidebar names `name`.
  const find = async (name) => {
    const projects = (await ctx.client.project.list()).filter((project) => named(project) === name)

    return projects.toSorted((a, b) => b.time.active - a.time.active)[0]
  }

  // Opens a new session in the project the sidebar names `name`. Without a match, the app's project picker opens
  // instead.
  const start = async (name) => {
    try {
      const project = await find(name)

      if (!project) return ctx.layout.project(SIDECAR, ctx.t("session.new"))
      ctx.layout.draft({ server: SIDECAR, directory: project.canonical, prompt: "" })
    } catch {
      ctx.toast.show({ title: ctx.t("session.failed", { project: name }) })
    }
  }

  const add = (name) =>
    sidebar.button({
      name,
      label: ctx.t("session.newIn", { project: name }),
      icon: icon("plus", { size: "small" }),
      onSelect: () => void start(name),
    })

  // The context menu of a session row has no icons.
  const newSession = (name) => menu.item({ label: ctx.t("session.new"), onSelect: () => void start(name) })

  const run = (directory, command) => shell.run(ctx.client, directory, command)

  // The pull request of `branch` in `directory`, as GitHub's `gh` command finds it. Undefined when the branch has none,
  // or when `gh` cannot tell. A pass follows, to show what it finds.
  const pull = async ({ directory, branch }) => {
    try {
      const listed = await run(directory, pr.command(branch))

      return listed.ok ? pr.latest(listed.output) : undefined
    } finally {
      schedule()
    }
  }

  // The location of the session that a sidebar row names, among the newest root sessions, as many as the app lists.
  const where = sessions(async () => {
    const [page, projects] = await Promise.all([
      ctx.client.session.list({ parentID: null, limit: 50, order: "desc" }),
      ctx.client.project.list(),
    ])
    const names = new Map(projects.map((project) => [project.id, named(project)]))

    return page.data.map((item) => ({
      id: item.id,
      title: item.title,
      project: names.get(item.projectID),
      location: item.location,
    }))
  }, () => schedule())

  // The folder and branch of the session that `row` shows, as the app knows them. Undefined when it cannot tell.
  const locate = (row) => {
    const location = where(sidebar.title(row), sidebar.project(row))?.location
    const branch = location && ctx.servers.get(SIDECAR)?.data.location.vcs.info(location)?.branch.current

    return branch ? { directory: location.directory, branch } : undefined
  }

  // The session that `row` shows, and when its work started, as the app's data tells. Undefined when it cannot tell
  // the session. The plugin docs do not describe this part of `server.data`; if a release changes it, the row keeps
  // the app's time.
  const work = (row) => {
    const id = where(sidebar.title(row), sidebar.project(row))?.id
    const data = ctx.servers.get(SIDECAR)?.data.session

    if (!id || !data) return

    try {
      const agents = data.active().some((agent) => agent !== id && data.root(agent) === id)

      return { id, from: elapsed.origin(data.get(id)?.time ?? {}, busy(data, id), agents) }
    } catch {
      return
    }
  }

  // The branches of the folder that `label` names, or undefined when git cannot list them there.
  const list = async (label) => {
    const directory = await branch.directory(label, () => ctx.client.project.list())
    const listed = directory && (await run(directory, branch.LIST))

    return listed?.ok ? { directory, ...branch.branches(listed.output) } : undefined
  }

  // Runs `git switch` with `args` in `directory`, then reads the folder's branch again, so the tray shows the new one
  // at once. When git refuses, a toast titled `failed` shows its output.
  const change = async (directory, args, failed) => {
    const fail = (description) =>
      ctx.toast.show({ variant: "error", title: failed, description: description.trim() })

    try {
      const switched = await run(directory, branch.command(...args))

      if (!switched.ok) return fail(switched.output)
      const data = ctx.servers.get(SIDECAR)?.data
      data?.location.vcs.invalidate({ directory })
      await data?.location.vcs.sync({ directory })
    } catch (error) {
      fail(String(error?.message ?? error))
    }
  }

  // Puts in `container` the dropdown of the branches of the folder that `label` names, and returns its `update` and
  // cleanup. The list loads at once, and the label shows the folder's current branch from it. The list loads again
  // each time the pointer or the focus comes to the label, so it is ready when the dropdown opens. A pass that finds a
  // changed tray empties the list and loads it again.
  const dropdown = (container, label) =>
    createRoot((dispose) => {
      // Undefined until the list loads, null when it cannot load.
      const [branches, setBranches] = createSignal()
      const [busy, setBusy] = createSignal(false)
      let loading = false
      // The state of the tray when the list started to load.
      let loaded

      const load = () => {
        if (loading) return
        loading = true
        loaded = branch.state(label)
        list(label)
          .catch(() => undefined)
          .then((value) => {
            loading = false
            // The list is of the folder that the tray named when it started.
            if (branch.state(label) !== loaded) return update()
            setBranches(value ?? null)
          })
      }

      const update = () => {
        if (branch.state(label) === loaded) return
        setBranches(undefined)
        load()
      }

      const apply = async (args, failed) => {
        setBusy(true)
        await change(branches().directory, args, failed)
        setBusy(false)
        load()
      }

      const select = (name) => {
        if (name !== branches().current) void apply([name], ctx.t("branch.failed", { branch: name }))
      }

      // Asks for the new branch's name, then makes the branch from the current one and switches to it. Spaces in the
      // name become hyphens, as a branch name cannot hold them.
      const create = async () => {
        const current = branches().current
        const typed = await ctx.dialogs.prompt({
          title: ctx.t("branch.create"),
          description: current && ctx.t("branch.from", { branch: current }),
          placeholder: ctx.t("branch.name"),
          submit: ctx.t("branch.submit"),
        })
        const name = typed?.trim().replace(/\s+/g, "-")

        if (name) await apply(["-c", name], ctx.t("branch.uncreated", { branch: name }))
      }

      const item = (name, text = name) => ({ label: text, onSelect: () => select(name) })

      const items = () => {
        const value = branches()

        if (value === undefined) return [{ label: ctx.t("branch.loading"), disabled: true }]

        if (value === null) return [{ label: ctx.t("branch.unlisted"), disabled: true }]
        // First, so a long list that scrolls cannot hide it.
        const top = [
          { label: ctx.t("branch.new"), icon: "plus", onSelect: () => void create() },
          { type: "separator" },
        ]
        const local = value.local.map((name) => item(name))

        if (value.remote.length === 0) return [...top, ...local]

        const remote = value.remote.map(({ name, ref }) => item(name, ref))

        const group = { type: "group", label: ctx.t("branch.remote"), items: remote }

        return [...top, ...local, { type: "separator" }, group]
      }

      createEffect(() => branch.show(label, branches()?.current))
      container.addEventListener("pointerenter", load)
      container.addEventListener("focusin", load)
      // The app changes its branch text in place, which the page-wide observer does not report.
      labels.observe(label, { subtree: true, characterData: true })
      insert(container, () =>
        createComponent(ctx.ui.Menu, {
          label: ctx.t("branch.switch"),
          trigger: "button",
          placement: "bottom-start",
          get disabled() {
            return busy()
          },
          get items() {
            return items()
          },
        }),
      )
      load()

      return { update, dispose }
    })

  const copyButton = userMessage.button({
    ui: ctx.ui,
    label: ctx.t("message.copy"),
    copied: ctx.t("message.copied"),
    write: (text) =>
      ctx.system.copy(text).then(
        () => true,
        () => {
          ctx.toast.show({ title: ctx.t("message.copyFailed") })
          return false
        },
      ),
  })

  const browser = ctx.use(Browser)

  // Opens `url` in a new tab of the open session's browser pane. Returns false when the pane cannot open it, as on the
  // web, on a narrow window, or before the pane is ready.
  const browse = (url) => {
    const pane = browser()
    const session = ctx.sessions.current()

    if (pane.status !== "active" || !session || !pane.value.canOpen(session)) return false
    pane.value.open(session, url)
    return true
  }

  // Opens `url` in the browser pane, else in the system browser.
  const visit = (url) => browse(url) || void ctx.system.openExternal(url)

  // A merge or a close in the GitHub panel can end the work of sessions. Like T3 Code, they do not wait for the next
  // sweep.
  const archiver = options.archiveAfterHours > 0 ? ctx.main(Archive(ctx.id)) : undefined
  const changed = () => void archiver?.sweep().catch(() => undefined)

  // Opens the pull request or issue that a link names in the side region of the session, and returns whether it did.
  const openGitHub = options.github ? github(ctx, { run, browse: visit, changed }) : () => false

  // Makes the plugin's changes to the sidebar while its switch is on, and takes them away once when it turns off.
  let applied = false
  const arrange = () => {
    if (!inbox.value.enabled) {
      if (applied) {
        sidebar.clean()
        pr.clean()
        elapsed.clean()
      }
      applied = false

      return
    }

    applied = true
    sidebar.observe(rows)
    sidebar.layout(groups.value.enabled, working.value.inline)
    sidebar.plus(add)
    sidebar.menu(newSession)
    elapsed.show(work)
    pr.show({
      locate,
      lookup: pull,
      open: (url) => openGitHub(url) || ctx.system.openExternal(url),
      label: ({ number, state, title }) => ctx.t("pr.label", { number, state: ctx.t(`pr.${state}`), title }),
    })
  }

  const sync = () => {
    arrange()
    branch.mount(dropdown)
    branch.check()
    composer.compose(options.hideAgent)
    composer.observe(labels)
    userMessage.copy(copyButton)
    timeline.fit(options.responseLabel)
    timeline.heal()
    timeline.divide(running())

    // Check again once a smooth scroll is surely over, in case no other change brings a pass.
    if (timeline.pending() && !retry)
      retry = setTimeout(() => {
        retry = 0
        schedule()
      }, 300)
  }

  let frame = 0
  let retry = 0
  let stopped = false
  const schedule = () => {
    // A pull request lookup can end after the plugin stops.
    if (frame || stopped) return
    frame = requestAnimationFrame(() => {
      frame = 0
      sync()
    })
  }

  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true })
  const labels = new MutationObserver(schedule)
  // A change to the sidebar gets its pass at once, not in the next frame, so a row that the app moved does not show in
  // the wrong place for a frame.
  const rows = new MutationObserver(arrange)

  // The root of the session that this window shows. The archive leaves it until the window shows a different one.
  const showing = () => {
    const session = ctx.sessions.current()

    return session && session.server.data.session.root(session.id)
  }
  const tell = (id) => void archiver?.open(id ? [id] : []).catch(() => undefined)

  createKeyed(showing, tell, { otherwise: () => tell() })

  // The sidebar follows an archive or an unarchive only for a session that the window holds; for the others, it keeps
  // the list that it read when it started (OpenCode Desktop 2.2.7). The archive changes sessions that no window holds,
  // so the window reads each of them, and then the sidebar shows the change.
  createKeyed(
    () => ctx.servers.get(SIDECAR)?.data,
    (data) => {
      const read = (event) => {
        const id = event.data.sessionID

        if (!data.session.get(id)) void data.session.sync(id).catch(() => undefined)
      }

      onCleanup(data.on("session.archived", read))
      onCleanup(data.on("session.unarchived", read))
    },
  )

  // A pass looks up the pull requests that are due again, even when the page does not change. The archive forgets the
  // session of a window that stops telling it, as a closed window does.
  const refresh = setInterval(() => {
    schedule()
    tell(showing())
  }, MINUTE)
  // The times of the working sessions go on while the page does not change.
  const tick = setInterval(() => applied && elapsed.show(work), 1000)
  // `scrollend` does not bubble, so only a capturing listener on the document sees it.
  document.addEventListener("scrollend", schedule, true)
  // The usage card follows the open session while it shows.
  const unlistenUsage = usage.listen((card) =>
    createRoot((dispose) => {
      insert(card, () => {
        const session = ctx.sessions.current()

        return session ? usage.render(usage.stats(session), ctx.t, ctx.locale.locale()) : []
      })

      return dispose
    }),
  )
  const unlistenLinks = links.listen((url) => openGitHub(url) || browse(url))

  createKeyed(() => `${inbox.value.enabled}:${groups.value.enabled}:${working.value.inline}:${running()}`, sync)

  if (options.workflows) workflows(ctx)

  ctx.add(Style, () => (inbox.value.enabled ? sidebar.css : undefined))
  ctx.add(Style, () => (inbox.value.enabled ? pr.css : undefined))
  ctx.add(Style, () => (inbox.value.enabled ? elapsed.css : undefined))
  ctx.add(Style, branch.css)
  ctx.add(Style, composer.css(options))
  ctx.add(Style, timeline.css(options.responseLabel))
  ctx.add(Style, usage.css)
  ctx.add(Style, userMessage.css)
  // After the app's own rows in the slot, such as the changes summary.
  ctx.add(Slot, {
    at: "session.location.menu",
    order: 100,
    render: (input) => [
      menu.separator(),
      menu.item({
        label: ctx.t("session.new"),
        icon: icon("edit", { class: "shrink-0 text-v2-icon-icon-muted" }),
        shortcut: ctx.keybinds.keybind(NEW_TAB).join(""),
        onSelect: () => {
          if (ctx.commands.run(NEW_TAB)) return
          ctx.layout.draft({ server: input.session.server.id, directory: input.session.directory, prompt: "" })
        },
      }),
    ],
  })
  const turn = (enabled) =>
    inbox.update((draft) => {
      draft.enabled = enabled
    })

  // A section of the General page of Settings, with the switch of the sidebar changes.
  ctx.add(SettingsPage, {
    id: ctx.id,
    page: "general",
    title: "opencode-plus",
    entries: [
      {
        id: SIDEBAR,
        title: ctx.t("sidebar.title"),
        description: ctx.t("sidebar.description"),
        keywords: "opencode-plus sidebar inbox group project pull request badge",
      },
    ],
    render: () =>
      createComponent(ctx.ui.SettingsSection, {
        title: "opencode-plus",
        get children() {
          return createComponent(ctx.ui.SettingsRow, {
            id: SIDEBAR,
            get title() {
              return ctx.t("sidebar.title")
            },
            get description() {
              return ctx.t("sidebar.description")
            },
            get children() {
              return createComponent(ctx.ui.Switch, {
                get label() {
                  return ctx.t("sidebar.title")
                },
                hideLabel: true,
                get checked() {
                  return inbox.value.enabled
                },
                onChange: turn,
              })
            },
          })
        },
      }),
  })
  ctx.add(Command, () => ({
    id: "toggle-sidebar",
    title: ctx.t(inbox.value.enabled ? "sidebar.off" : "sidebar.on"),
    keywords: "opencode-plus sidebar inbox group project pull request badge",
    run: () => turn(!inbox.value.enabled),
  }))
  ctx.add(Command, () =>
    inbox.value.enabled
      ? {
          id: "toggle-groups",
          title: ctx.t(groups.value.enabled ? "groups.off" : "groups.on"),
          keywords: "group project projects folders sessions sidebar inbox",
          run: () =>
            groups.update((draft) => {
              draft.enabled = !draft.enabled
            }),
        }
      : undefined,
  )
  ctx.add(Command, () =>
    inbox.value.enabled
      ? {
          id: "toggle-working",
          title: ctx.t(working.value.inline ? "working.section" : "working.inline"),
          keywords: "working running busy section shelf sessions sidebar inbox",
          run: () =>
            working.update((draft) => {
              draft.inline = !draft.inline
            }),
        }
      : undefined,
  )

  return () => {
    stopped = true
    observer.disconnect()
    labels.disconnect()
    rows.disconnect()
    cancelAnimationFrame(frame)
    clearTimeout(retry)
    clearInterval(refresh)
    clearInterval(tick)
    document.removeEventListener("scrollend", schedule, true)
    unlistenUsage()
    unlistenLinks()
    sidebar.clean()
    pr.clean()
    elapsed.clean()
    branch.clean()
    composer.clean()
    timeline.clean()
    userMessage.clean()
  }
}

// The desktop app's main process: keeps the logins of the browser pane, and archives finished sessions.
function main(ctx) {
  const { archiveAfterHours } = settings(ctx.options)

  ctx.onCleanup(cookies.keep(ctx, { app, safeStorage, webContents }))

  if (archiveAfterHours <= 0) return

  const archiver = archive(ctx, archiveAfterHours * HOUR)

  ctx.provide(Archive(ctx.id), { sweep: archiver.sweep, open: (ids, caller) => archiver.open(ids, caller.window) })

  return archiver.stop
}

export default Plugin.define({
  stores: {
    inbox: Store.global(Schema.Struct({ enabled: Schema.Boolean }), { enabled: true }),
    groups: Store.global(Schema.Struct({ enabled: Schema.Boolean }), { enabled: true }),
    working: Store.global(Schema.Struct({ inline: Schema.Boolean }), { inline: true }),
  },
  i18n: {
    en: {
      "sidebar.title": "Sidebar changes",
      "sidebar.description":
        "Groups sessions by project, shows pull request badges, and adds \"New session\" to the menu of a session.",
      "sidebar.on": "Turn on the sidebar changes of opencode-plus",
      "sidebar.off": "Turn off the sidebar changes of opencode-plus",
      "groups.on": "Group sessions by project",
      "groups.off": "Stop grouping sessions by project",
      "working.inline": "Show working sessions in the list",
      "working.section": "Show working sessions in their own section",
      "session.new": "New session",
      "session.newIn": "New session in {{project}}",
      "session.failed": "Could not start a session in {{project}}",
      "usage.window": "Context window",
      "usage.cacheRead": "Cache read",
      "usage.cacheWrite": "Cache write",
      "usage.input": "Input",
      "usage.reasoning": "Reasoning",
      "usage.output": "Output",
      "usage.cost": "Cost",
      "branch.switch": "Switch branch",
      "branch.loading": "Loading…",
      "branch.unlisted": "Could not list the branches",
      "branch.remote": "Remote",
      "branch.failed": "Could not switch to {{branch}}",
      "branch.new": "New branch…",
      "branch.create": "Create branch",
      "branch.from": "The new branch starts from {{branch}}, with your changes.",
      "branch.name": "Branch name",
      "branch.submit": "Create",
      "branch.uncreated": "Could not create {{branch}}",
      "pr.label": "PR #{{number}}, {{state}}: {{title}}",
      "pr.open": "open",
      "pr.draft": "draft",
      "pr.merged": "merged",
      "pr.closed": "closed",
      "message.copy": "Copy message",
      "message.copied": "Copied",
      "message.copyFailed": "Could not copy the message",
      ...workflowStrings,
      ...githubStrings,
    },
  },
  setup,
  main,
})
