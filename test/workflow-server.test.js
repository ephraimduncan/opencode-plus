// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { TOOL } from "../src/workflow/prompts.js"
import { workflows } from "../src/workflow/server.js"

const SCRIPT = "export const meta = { name: 'audit', description: 'A test workflow' }\nreturn 1"

// One plugin instance on a fake host. `session` and `permission` answer the host calls that a launch waits for, so a
// test can stop the plugin at a chosen point. `events` holds what the panel hears.
async function plugin({ sessionID, session, permission }) {
  const tools = new Map()
  const events = []
  let methods
  const ctx = {
    location: { directory: "/project" },
    rpc: {
      register: async (_, handlers) => {
        methods = handlers

        return { events: { emit: async (name, data) => void events.push({ name, data }) }, dispose: async () => {} }
      },
    },
    tool: { transform: async (edit) => edit({ add: (tool) => tools.set(tool.name, tool) }) },
    skill: { transform: async () => {} },
    command: { transform: async () => {} },
    session: { hook: async () => {}, get: session },
    permission: { assert: permission },
    event: {
      subscribe: ({ signal }) =>
        (async function* () {
          await new Promise((resolve) => signal.addEventListener("abort", resolve))
        })(),
    },
  }
  const cleanup = await workflows(ctx, {})

  return {
    cleanup,
    events,
    launch: () => tools.get(TOOL).execute({ script: SCRIPT }, { sessionID, id: "call_1", messageID: "msg_1", agent: "build" }),
    statuses: async () => (await methods.list({ sessionID })).runs.map((run) => run.status),
  }
}

const info = { location: { directory: "/project" }, projectID: "prj_1" }

describe("a run that the plugin stops before it starts", () => {
  let data
  let saved

  beforeEach(() => {
    saved = process.env.XDG_DATA_HOME
    data = mkdtempSync(join(tmpdir(), "ocp-server-"))
    process.env.XDG_DATA_HOME = data
  })

  afterEach(() => {
    if (saved === undefined) delete process.env.XDG_DATA_HOME
    else process.env.XDG_DATA_HOME = saved
    rmSync(data, { recursive: true, force: true })
  })

  // Catches the stuck approval card. The plugin stopped as the call began, as a session move does, and permission
  // passed at once. The run then stayed pending, but the user had no permission request to answer.
  test("lists as stopped when the plugin stopped as the call began", async () => {
    let release
    const host = await plugin({
      sessionID: "ses_began",
      session: () => new Promise((resolve) => (release = () => resolve(info))),
      permission: async () => {},
    })
    const call = host.launch()

    await host.cleanup()
    release()

    await expect(call).rejects.toThrow("OpenCode stopped the workflow plugin before the run could start.")
    expect(await host.statuses()).toEqual(["stopped"])
  })

  // Catches a cleanup that removes a run but does not tell the panel. The run waits for approval, so the panel shows it
  // as pending forever.
  test("tells the panel that it stopped when the plugin stops during the approval", async () => {
    const permission = vi.fn(() => new Promise(() => {}))
    const host = await plugin({ sessionID: "ses_waiting", session: async () => info, permission })

    void host.launch()
    await vi.waitFor(() => expect(permission).toHaveBeenCalled())
    await host.cleanup()

    expect(host.events.at(-1)).toMatchObject({ name: "changed", data: { run: { status: "stopped" } } })
    expect(await host.statuses()).toEqual(["stopped"])
  })
})
