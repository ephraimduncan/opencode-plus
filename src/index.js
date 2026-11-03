import { Command, Plugin, Slot, Store, Style, createKeyed } from "@opencode/plugin/gui"
import { Schema } from "effect"
import { createComponent, createRoot, createSignal } from "solid-js"
import { insert } from "solid-js/web"
import { archive } from "./archive.js"
import * as branch from "./branch.js"
import * as composer from "./composer.js"
import { newSessionRow } from "./location-menu.js"
import { settings } from "./settings.js"
import * as sidebar from "./sidebar.js"
import * as timeline from "./timeline.js"
import * as usage from "./usage.js"

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// The app's command that opens a new session in the open session's folder (⌘T). App command ids can change between
// releases; when it is gone, the project menu row falls back to the plugin API.
const NEW_TAB = "tab.new"

// The desktop app's own server.
const SIDECAR = "sidecar"

// Each window: restyles the sidebar, the chat input, and the conversation. The app has no plugin API for these, so a
// pass over the page applies every change after each change to the page.
function setup(ctx) {
  const options = settings(ctx.options)
  const { shelf, groups, working } = ctx.stores

  // Fills `parent` with the app's icon `name`.
  const icon = (name, props) => (parent) => insert(parent, () => createComponent(ctx.ui.Icon, { name, ...props }))

  // Whether the open session still works, as the app's sidebar decides it. The plugin docs do not describe this part of
  // `server.data`; if a release changes it, the divider treats the session as idle instead of stopping every pass.
  const running = () => {
    const session = ctx.sessions.current()

    try {
      const data = session?.server.data.session

      return (
        !!session &&
        (data.status(session.id) === "running" ||
          data.pending.list(session.id).some((item) => item.type !== "synthetic"))
      )
    } catch {
      return false
    }
  }

  const toggle = () =>
    shelf.update((draft) => {
      draft.archivedOpen = !draft.archivedOpen
    })

  // Opens a new session in the project the sidebar names `name`, the way it names projects: the project's name, else
  // its folder's. Without a match, the app's project picker opens instead.
  const start = async (name) => {
    const projects = (await ctx.client.project.list()).filter(
      (project) => (project.name || project.canonical.split("/").pop()) === name,
    )
    const project = projects.toSorted((a, b) => b.time.active - a.time.active)[0]

    if (!project) return ctx.layout.project(SIDECAR, ctx.t("session.new"))
    ctx.layout.draft({ server: SIDECAR, directory: project.canonical, prompt: "" })
  }

  const add = (name) =>
    sidebar.button({
      name,
      label: ctx.t("session.newIn", { project: name }),
      icon: icon("plus", { size: "small" }),
      onSelect: () =>
        void start(name).catch(() => ctx.toast.show({ title: ctx.t("session.failed", { project: name }) })),
    })

  // Runs `command` with the user's shell in `directory`, on the app's server. Returns whether it exited with 0, and its
  // output.
  const run = async (directory, command) => {
    const location = { directory }
    let { data: shell } = await ctx.client.shell.create({ location, command, timeout: MINUTE })

    try {
      while (shell.status === "running") {
        await new Promise((resolve) => setTimeout(resolve, 100))
        shell = (await ctx.client.shell.get({ id: shell.id, location })).data
      }

      const { data } = await ctx.client.shell.output({ id: shell.id, location })

      return { ok: shell.exit === 0, output: data.output }
    } finally {
      void ctx.client.shell.remove({ id: shell.id, location }).catch(() => undefined)
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

  // Puts in `container` the dropdown of the branches of the folder that `label` names, and returns its cleanup. The
  // list loads again each time the pointer or the focus comes to the label, so it is ready when the dropdown opens.
  const dropdown = (container, label) =>
    createRoot((dispose) => {
      // Undefined until the list loads, null when it cannot load.
      const [branches, setBranches] = createSignal()
      const [busy, setBusy] = createSignal(false)
      let loading = false

      const load = () => {
        if (loading) return
        loading = true
        list(label)
          .catch(() => undefined)
          .then((value) => setBranches(value ?? null))
          .finally(() => {
            loading = false
          })
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

      container.addEventListener("pointerenter", load)
      container.addEventListener("focusin", load)
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

      return dispose
    })

  const sync = () => {
    sidebar.shelve(shelf.value.archivedOpen)
    sidebar.layout(groups.value.enabled, working.value.inline)
    sidebar.plus(add)
    branch.mount(dropdown)
    branch.check()
    composer.compose(options.hideAgent)
    composer.observe(labels)
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
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      sync()
    })
  }

  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true })
  const labels = new MutationObserver(schedule)
  // `scrollend` does not bubble, so only a capturing listener on the document sees it.
  document.addEventListener("scrollend", schedule, true)
  const unlisten = sidebar.listen(toggle)
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

  createKeyed(
    () => `${shelf.value.archivedOpen}:${groups.value.enabled}:${working.value.inline}:${running()}`,
    sync,
  )

  ctx.add(Style, sidebar.css)
  ctx.add(Style, branch.css)
  ctx.add(Style, composer.css(options))
  ctx.add(Style, timeline.css(options.responseLabel))
  ctx.add(Style, usage.css)
  // After the app's own rows in the slot, such as the changes summary.
  ctx.add(Slot, {
    at: "session.location.menu",
    order: 100,
    render: (input) =>
      newSessionRow({
        label: ctx.t("session.new"),
        icon: icon("edit", { class: "shrink-0 text-v2-icon-icon-muted" }),
        shortcut: ctx.keybinds.keybind(NEW_TAB).join(""),
        onSelect: () => {
          if (ctx.commands.run(NEW_TAB)) return
          ctx.layout.draft({ server: input.session.server.id, directory: input.session.directory, prompt: "" })
        },
      }),
  })
  ctx.add(Command, () => ({
    id: "toggle-archived",
    title: ctx.t(shelf.value.archivedOpen ? "archived.hide" : "archived.show"),
    keywords: "archive archived settled sessions sidebar inbox",
    run: toggle,
  }))
  ctx.add(Command, () => ({
    id: "toggle-groups",
    title: ctx.t(groups.value.enabled ? "groups.off" : "groups.on"),
    keywords: "group project projects folders sessions sidebar inbox",
    run: () =>
      groups.update((draft) => {
        draft.enabled = !draft.enabled
      }),
  }))
  ctx.add(Command, () => ({
    id: "toggle-working",
    title: ctx.t(working.value.inline ? "working.section" : "working.inline"),
    keywords: "working running busy section shelf sessions sidebar inbox",
    run: () =>
      working.update((draft) => {
        draft.inline = !draft.inline
      }),
  }))

  return () => {
    observer.disconnect()
    labels.disconnect()
    cancelAnimationFrame(frame)
    clearTimeout(retry)
    document.removeEventListener("scrollend", schedule, true)
    unlisten()
    unlistenUsage()
    sidebar.clean()
    branch.clean()
    composer.clean()
    timeline.clean()
  }
}

// The desktop app's main process: archives finished sessions.
function main(ctx) {
  const { archiveAfterHours } = settings(ctx.options)

  if (archiveAfterHours > 0) return archive(ctx, archiveAfterHours * HOUR)
}

export default Plugin.define({
  stores: {
    shelf: Store.global(Schema.Struct({ archivedOpen: Schema.Boolean }), { archivedOpen: false }),
    groups: Store.global(Schema.Struct({ enabled: Schema.Boolean }), { enabled: true }),
    working: Store.global(Schema.Struct({ inline: Schema.Boolean }), { inline: true }),
  },
  i18n: {
    en: {
      "archived.show": "Show archived sessions",
      "archived.hide": "Hide archived sessions",
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
    },
  },
  setup,
  main,
})
