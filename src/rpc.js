import { Rpc } from "@opencode/plugin/rpc"

// The workflow methods that the server part serves to the desktop app. Runs, agents, and their counts are plain JSON
// objects; `src/workflow/run.js` builds them.

const object = { type: "object" }
const text = { type: "string" }
// A run is live in the server's memory, or stored under the session that started it.
const run = { type: "object", properties: { runID: text, sessionID: text }, required: ["runID"] }
const agent = { type: "object", properties: { runID: text, sessionID: text, agentID: text }, required: ["runID", "agentID"] }

export const Workflows = Rpc.define({
  id: "opencode-plus",
  methods: {
    // The runs that the session started, newest first, without their agents.
    list: { input: { type: "object", properties: { sessionID: text }, required: ["sessionID"] }, output: object },
    // One run, with every agent.
    get: { input: run, output: object },
    // One agent, with its full prompt and result.
    agent: { input: agent, output: object },
    stop: { input: run, output: object },
    pause: { input: run, output: object },
    resume: { input: run, output: object },
    stopAgent: { input: agent, output: object },
    // Saves the run's script as a command, for the project or for the user.
    save: {
      input: {
        type: "object",
        properties: { runID: text, sessionID: text, scope: { enum: ["project", "personal"] } },
        required: ["runID", "scope"],
      },
      output: object,
    },
    // Reads ultracode for a session, or sets it when `on` is given.
    ultracode: {
      input: { type: "object", properties: { sessionID: { type: "string" }, on: { type: "boolean" } }, required: ["sessionID"] },
      output: object,
    },
  },
  events: {
    // A run changed: `run` holds the run without agents, and `agents` the agents that changed.
    changed: { schema: object },
    ultracode: { schema: object },
  },
})
