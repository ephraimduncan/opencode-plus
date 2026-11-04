import { batch, onCleanup } from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import { createKeyed } from "@opencode/plugin/gui"
import { Workflows } from "../rpc.js"
import { active, order } from "./format.js"

// A run is new when it starts less than this long before the panel hears of it, so that a reload does not open the
// panel for old runs.
const FRESH = 60 * 1000

// The workflow runs that the panel shows, kept in step with the server part through its RPC events.
//
// `runs` holds the header of each run that the panel knows (counts, logs, status), `sessions` the run IDs of each
// session, newest first, and `agents` the agents of each run, by ID. A run's agents load when the panel first shows
// the run; after that, the events keep them current.
export function createWorkflows(ctx, { onStart }) {
  const [state, setState] = createStore({ runs: {}, sessions: {}, agents: {}, results: {}, details: {}, ultracode: {} })
  const loaded = new Set()

  const rpc = (session) => session.server.client.rpc(Workflows)
  const call = (session) => ({ location: { directory: session.directory } })

  const remember = (run) => {
    const known = state.runs[run.id]

    batch(() => {
      setState("runs", run.id, reconcile(run))
      if (!state.sessions[run.sessionID]?.includes(run.id))
        setState("sessions", run.sessionID, (list = []) => [run.id, ...list])
    })

    return !known
  }

  const merge = (runID, agents) =>
    batch(() => {
      if (!state.agents[runID]) setState("agents", runID, {})
      for (const agent of agents) setState("agents", runID, agent.id, reconcile(agent))
    })

  createKeyed(
    () => ctx.servers.get("sidecar")?.client,
    (client) =>
      onCleanup(
        client.rpc(Workflows).events.on("changed", (event) => {
          const { run, agents } = event.data
          const fresh = remember(run)

          merge(run.id, agents)
          if (fresh && Date.now() - run.created < FRESH) onStart(run)
        }),
      ),
  )

  createKeyed(
    () => ctx.servers.get("sidecar")?.client,
    (client) =>
      onCleanup(
        client.rpc(Workflows).events.on("ultracode", (event) => setState("ultracode", event.data.sessionID, event.data.on)),
      ),
  )

  return {
    state,

    // The runs of `sessionID`, newest first.
    runs: (sessionID) => (state.sessions[sessionID] ?? []).map((id) => state.runs[id]).filter(Boolean),

    run: (runID) => state.runs[runID],

    // The agents of a run in their order.
    agents: (runID) => Object.values(state.agents[runID] ?? {}).toSorted(order),

    detail: (runID, agentID) => state.details[`${runID}/${agentID}`],

    active: (sessionID) =>
      (state.sessions[sessionID] ?? []).map((id) => state.runs[id]).filter((run) => run && active(run.status)),

    // Loads the runs of the session that `session` routes to, once for each session.
    async load(session, sessionID) {
      if (loaded.has(sessionID)) return
      loaded.add(sessionID)

      try {
        const [{ runs }, { on }] = await Promise.all([
          rpc(session).list({ sessionID }, call(session)),
          rpc(session).ultracode({ sessionID }, call(session)),
        ])

        batch(() => {
          for (const run of runs.toReversed()) remember(run)
          setState("ultracode", sessionID, on)
        })
      } catch {
        loaded.delete(sessionID)
      }
    },

    // The full result of a run, once the panel has loaded the run.
    result: (runID) => state.results[runID],

    // Loads every agent of a run, and its full result.
    async open(session, runID) {
      const { run } = await rpc(session).get({ runID, sessionID: state.runs[runID]?.sessionID }, call(session))

      batch(() => {
        merge(run.id, run.agents ?? [])
        if (run.result !== undefined) setState("results", run.id, run.result)
      })
    },

    // Loads an agent's full prompt and result.
    async describe(session, runID, agentID) {
      const { agent } = await rpc(session).agent({ runID, agentID, sessionID: state.runs[runID]?.sessionID }, call(session))

      setState("details", `${runID}/${agentID}`, agent)
    },

    stop: (session, runID) => rpc(session).stop({ runID }, call(session)),
    pause: (session, runID) => rpc(session).pause({ runID }, call(session)),
    resume: (session, runID) => rpc(session).resume({ runID }, call(session)),
    stopAgent: (session, runID, agentID) => rpc(session).stopAgent({ runID, agentID }, call(session)),
    save: (session, runID, scope) =>
      rpc(session).save({ runID, scope, sessionID: state.runs[runID]?.sessionID }, call(session)),

    ultracode: (sessionID) => state.ultracode[sessionID] === true,
    setUltracode: async (session, sessionID, on) => {
      setState("ultracode", sessionID, on)
      await rpc(session).ultracode({ sessionID, on }, call(session))
    },
  }
}
