import { createStore } from "solid-js/store"
import { Command, ComposerPill, MenuItem, Panel } from "@opencode/plugin/gui"
import { counts } from "./format.js"
import { createWorkflows } from "./model.js"
import { root, Status, WorkflowsView } from "./panel.jsx"

const TAB = "workflows"

// The Workflows panel in the side region of each session, its launcher in the panel's "+" menu, the pill above the
// composer while runs work, and the commands. A new run of the routed session opens the panel on that run.
export function workflows(ctx) {
  const key = `${ctx.id}:${TAB}`
  const [places, setPlaces] = createStore({})
  const nav = {
    get: (sessionID) => places[sessionID] ?? {},
    // A store setter merges objects, so the keys that `place` leaves out must be cleared by name.
    go: (sessionID, place) => setPlaces(sessionID, { runID: undefined, agentID: undefined, ...place }),
  }

  const model = createWorkflows(ctx, {
    onStart: (run) => {
      const session = ctx.sessions.current()

      if (!session || root(session) !== run.sessionID) return
      nav.go(run.sessionID, { runID: run.id })
      ctx.layout.open(key, session, { tab: "select", background: true })
    },
  })

  // Opens the panel on `place` in the routed session.
  const show = (place) => {
    const session = ctx.sessions.current()

    if (!session) return
    if (place) nav.go(root(session), place)
    ctx.layout.open(key, session, { tab: "select" })
  }

  const working = (session) => model.active(root(session))

  const tab = {
    id: TAB,
    get title() {
      return ctx.t("wf.title")
    },
    closable: "hover",
    label: (state) => {
      const live = () => working(state.session)

      return (
        <div class="flex min-w-0 items-center gap-1.5">
          <ctx.ui.Icon name="fork" class="shrink-0" />
          <span class="truncate">{ctx.t("wf.title")}</span>
          {live().length > 0 && <Status status="running" />}
        </div>
      )
    },
  }

  ctx.add(Panel, {
    id: TAB,
    region: "side",
    mobile: {
      get title() {
        return ctx.t("wf.title")
      },
      order: 46,
      kind: "menu",
      icon: "fork",
    },
    list: (input) => (input.open.includes(TAB) ? [tab] : []),
    render: (props) => <WorkflowsView session={props.session} model={model} nav={nav} />,
  })

  ctx.add(MenuItem, () => {
    const session = ctx.sessions.current()
    const live = session ? working(session).length : 0

    return {
      menu: "session.panel",
      id: TAB,
      title: ctx.t("wf.title"),
      icon: "fork",
      keybind: `${ctx.id}.workflows`,
      order: 40,
      ...(live > 0 && { description: ctx.t("wf.running", { count: live }) }),
      opened: !!session && ctx.layout.state(key, session) !== "closed",
      run: () => show(),
    }
  })

  ctx.add(ComposerPill, {
    id: TAB,
    order: 10,
    show: (input) => {
      const sessionID = root(input.session)
      const live = model.active(sessionID)
      const ultracode = model.ultracode(sessionID)

      if (live.length === 0 && !ultracode) return undefined

      const rows = live.map((run) => {
        const tally = counts(Object.values(model.state.agents[run.id] ?? {}))
        const total = Math.max(tally.total, run.counts?.total ?? 0)
        const done = Math.max(tally.finished, (run.counts?.done ?? 0) + (run.counts?.failed ?? 0) + (run.counts?.stopped ?? 0))

        return {
          id: run.id,
          label: run.name,
          icon: "fork",
          tone: run.status === "pending" ? "warning" : run.counts?.failed ? "danger" : undefined,
          detail:
            run.status === "pending" || run.status === "paused"
              ? ctx.t(`wf.status.${run.status}`)
              : ctx.t("wf.agents", { done, total }),
          run: () => show({ runID: run.id }),
        }
      })

      if (ultracode)
        rows.push({
          id: "ultracode",
          label: ctx.t("wf.ultracode.off"),
          icon: "close-small",
          run: () => void model.setUltracode(input.session, sessionID, false),
        })

      const label =
        live.length === 1
          ? `${live[0].name} · ${rows[0].detail}`
          : live.length > 1
            ? ctx.t("wf.pill.many", { count: live.length })
            : ctx.t("wf.ultracode")

      return {
        icon: "fork",
        label,
        title: ctx.t("wf.title"),
        tone: live.some((run) => run.status === "pending") ? "warning" : undefined,
        rows,
      }
    },
  })

  ctx.add(
    Command,
    () => ({
      id: "workflows",
      title: ctx.t("wf.command.show"),
      keywords: "workflow workflows ultracode agents runs fan out orchestration",
      enabled: !!ctx.sessions.current(),
      run: () => {
        const session = ctx.sessions.current()

        if (session) ctx.layout.toggle(key, session)
      },
    }),
  )

  ctx.add(Command, () => {
    const session = ctx.sessions.current()
    const on = !!session && model.ultracode(root(session))

    return {
      id: "ultracode",
      title: ctx.t(on ? "wf.command.ultracode.off" : "wf.command.ultracode.on"),
      keywords: "ultracode workflow workflows effort orchestration agents",
      enabled: !!session,
      run: () => {
        if (session) void model.setUltracode(session, root(session), !on)
      },
    }
  })
}

export const strings = {
  "wf.title": "Workflows",
  "wf.ultracode": "Ultracode",
  "wf.ultracode.hint": "Run each substantive task as a workflow",
  "wf.ultracode.off": "Turn off ultracode",
  "wf.empty.title": "No workflows in this session",
  "wf.empty.body":
    "Ask for one in your own words, or put the keyword ultracode in a prompt. Agents of each run show here while they work.",
  "wf.status.pending": "Waiting for approval",
  "wf.status.paused": "Paused",
  "wf.status.denied": "Denied",
  "wf.status.queued": "Queued",
  "wf.agents": "{{done}} of {{total}} agents",
  "wf.running": "{{count}} running",
  "wf.queued": "{{count}} queued",
  "wf.failed": "{{count}} failed",
  "wf.tokens": "{{count}} tokens",
  "wf.budget": "budget {{count}}",
  "wf.tools.one": "{{count}} tool call",
  "wf.tools.other": "{{count}} tool calls",
  "wf.cached": "cached",
  "wf.back.runs": "All workflows",
  "wf.back.run": "Back to {{name}}",
  "wf.pause": "Pause",
  "wf.resume": "Resume",
  "wf.stop": "Stop",
  "wf.more": "More actions",
  "wf.save.project": "Save as a command for this project",
  "wf.save.personal": "Save as a command for me",
  "wf.saved": "Saved as {{name}}",
  "wf.copy.script": "Copy the script path",
  "wf.copy.id": "Copy the run ID",
  "wf.reveal": "Show the script in the file manager",
  "wf.error": "The workflow action did not complete",
  "wf.logs.all": "Show all {{count}} messages",
  "wf.logs.less": "Show fewer messages",
  "wf.phase.none": "Other agents",
  "wf.result": "Result",
  "wf.output": "Returned output",
  "wf.agent.queued": "Waits for a free slot",
  "wf.agent.open": "Open session",
  "wf.agent.stop": "Stop agent",
  "wf.approve.title": "Run this workflow?",
  "wf.approve.note":
    "A workflow can start many agents, and it can use far more tokens than a normal turn. Its agents use your permission rules.",
  "wf.pill.many": "{{count}} workflows",
  "wf.command.show": "Show workflows",
  "wf.command.ultracode.on": "Turn on ultracode for this session",
  "wf.command.ultracode.off": "Turn off ultracode for this session",
}
