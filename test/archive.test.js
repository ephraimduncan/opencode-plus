import { OpenCode } from "@opencode/client"
import { describe, expect, test, vi } from "vitest"
import { archive, due } from "../src/archive.js"

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 10, 3, 12)
const AFTER = 12 * HOUR
const KEY = "opencode-plus.keptAt"

// A root session as GET /api/session returns it, its times in hours before NOW.
const session = ({ created = 30, updated = 10, busy, idle, archived, parentID, kept } = {}) => ({
  id: "ses_e5e91886cffet0erRANhoVOfMJ",
  projectID: "64a466343ad6303c885c50bd8e949ee8a944a5af",
  ...(parentID && { parentID }),
  title: "Push readiness check",
  cost: 0,
  tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  outcome: "succeeded",
  time: {
    created: NOW - created * HOUR,
    updated: NOW - updated * HOUR,
    ...(busy !== undefined && { busy: NOW - busy * HOUR }),
    ...(idle !== undefined && { idle: NOW - idle * HOUR }),
    ...(archived !== undefined && { archived: NOW - archived * HOUR }),
  },
  metadata: kept === undefined ? {} : { [KEY]: NOW - kept * HOUR },
  location: { directory: "/Users/ephraim/dev/roadmap-sync" },
})

describe("due", () => {
  test.each([
    // Catches a wrong unit or comparison for the 12 hours.
    ["finished 13 hours ago", session({ busy: 14, idle: 13 }), true],
    ["finished 11 hours ago", session({ busy: 12, idle: 11 }), false],
    // Catches archive of a session that still works: a run that waits for a permission has busy after idle.
    ["a new run started after the last one ended", session({ busy: 13, idle: 14 }), false],
    ["the first run has not ended", session({ busy: 13 }), false],
    // Catches a keep mark that the sweep ignores: an unarchived session must stay until it has new activity.
    ["unarchived by hand after its last run", session({ busy: 20, idle: 19, kept: 13 }), false],
    ["unarchived by hand, then ran again", session({ busy: 14, idle: 13, kept: 15 }), true],
    // Catches a race: a session unarchived a moment ago has no keep mark yet.
    ["changed 10 seconds ago", session({ busy: 14, idle: 13, updated: 10 / 3600 }), false],
    ["a subagent session", session({ busy: 14, idle: 13, parentID: "ses_e5ec87753ffd9GaGacQL0ZRhT0" }), false],
    ["already archived", session({ busy: 14, idle: 13, archived: 5 }), false],
    ["never ran, made 13 hours ago", session({ created: 13 }), true],
  ])("%s: %s", (_, value, want) => {
    expect(due(value, NOW, { after: AFTER, key: KEY })).toBe(want)
  })
})

// The pull request closed `closed` hours before NOW, and the user last sent a message `asked` hours before NOW.
describe("due after the pull request of its branch merged or closed", () => {
  test.each([
    // Catches a merge that waits for the 12 hours.
    ["merged an hour after the last message", session({ busy: 3, idle: 2 }), 1, 3, true],
    // Catches a comparison with the end of the run: the agent can merge in its own run.
    ["merged by its last run", session({ busy: 3, idle: 1 }), 2, 3, true],
    // Catches a wait after that run: the end of the run also changes the session, and T3 Code settles at once.
    ["merged by its last run, which ended a second ago", session({ busy: 0.5, idle: 1 / 3600, updated: 1 / 3600 }), 0.25, 0.5, true],
    // Catches a follow-up session that the old merge archives again after each run.
    ["the user sent a message after the merge", session({ busy: 1, idle: 0.5 }), 2, 1, false],
    // Catches a run that keeps the session although the user did not ask for it, as after a workflow.
    ["the agent ran on its own after the merge", session({ busy: 1, idle: 0.5 }), 2, 3, true],
    ["made after the merge, never ran", session({ created: 1 }), 2, 1, false],
    // Catches an unarchive by hand that a merge overrides: like un-settle in T3 Code, it holds until new activity.
    ["unarchived by hand after the merge", session({ busy: 3, idle: 2, kept: 0.5 }), 1, 3, false],
    ["unarchived by hand, then merged", session({ busy: 3, idle: 2, kept: 1.5 }), 1, 3, false],
    ["unarchived by hand, ran again, then merged", session({ busy: 1.4, idle: 1.2, kept: 1.5 }), 1, 1.4, true],
    // Catches a merge that archives a session while it works or before its keep mark is written.
    ["still runs", session({ busy: 2 }), 1, 2, false],
    ["changed 10 seconds ago", session({ busy: 3, idle: 2, updated: 10 / 3600 }), 1, 3, false],
    ["a subagent session", session({ busy: 3, idle: 2, parentID: "ses_e5ec87753ffd9GaGacQL0ZRhT0" }), 1, 3, false],
  ])("%s: %s", (_, value, closed, asked, want) => {
    expect(due(value, NOW, { after: AFTER, key: KEY, closed: NOW - closed * HOUR, asked: NOW - asked * HOUR })).toBe(
      want,
    )
  })
})

// A server for the client: an event stream that `send` writes to, the root sessions `listed`, a session that each GET
// of a session returns, and folders on their default branch. `reads` counts the GETs of a session, and `archived` holds
// the ids that a PATCH archived.
const server = (listed = []) => {
  const encoder = new TextEncoder()
  const streams = []
  const state = { reads: 0, archived: [] }

  const fetch = async (url, init) => {
    const { pathname } = new URL(url)

    if (pathname === "/api/event") {
      const body = new ReadableStream({
        start(controller) {
          const stream = { controller, signal: init.signal }
          streams.push(stream)
          init.signal?.addEventListener("abort", () => controller.error(init.signal.reason))
        },
      })

      return new Response(body, { headers: { "content-type": "text/event-stream" } })
    }

    if (pathname === "/api/session") return Response.json({ data: listed, cursor: {} })

    if (pathname === "/api/vcs")
      return Response.json({ location: {}, data: { branch: { current: "main", default: "main" } } })

    if (init.method === "PATCH") {
      if (JSON.parse(init.body).archived) state.archived.push(pathname.split("/").pop())

      return new Response(null, { status: 204 })
    }

    state.reads += 1

    return Response.json({ data: session({ busy: 2, idle: 1 }) })
  }

  const send = (event) =>
    streams
      .filter(({ signal }) => !signal?.aborted)
      .forEach(({ controller }) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)))

  return { fetch, send, state }
}

const enqueued = (id) => ({
  id,
  created: Date.now(),
  type: "session.inbox.enqueued",
  durable: { aggregateID: "ses_e5e91886cffet0erRANhoVOfMJ", seq: 1, version: 1 },
  data: { sessionID: "ses_e5e91886cffet0erRANhoVOfMJ", inboxID: "msg_1", item: { type: "user" } },
})

const settle = () => new Promise((resolve) => setTimeout(resolve, 10))

// Catches an archive that keeps its event stream after it stops: each reload of the plugin then leaves one more copy
// that handles every event.
test("a stopped archive stops reacting to events", async () => {
  const { fetch, send, state } = server()
  const ctx = {
    id: "opencode-plus",
    client: OpenCode.make({ baseUrl: "http://127.0.0.1:4096", fetch }),
    signal: new AbortController().signal,
    log: { write: () => {} },
  }
  const { stop } = archive(ctx, AFTER)

  await settle()
  send(enqueued("evt_1"))
  await settle()
  stop()
  await settle()
  send(enqueued("evt_2"))
  await settle()

  expect(state.reads).toBe(1)
})

const context = (fetch) => ({
  id: "opencode-plus",
  client: OpenCode.make({ baseUrl: "http://127.0.0.1:4096", fetch }),
  signal: new AbortController().signal,
  log: { write: () => {} },
})

// Catches an archive of the session that a window shows: the session leaves the list while the person reads it.
test("a session that a window shows stays until the window shows a different one", async () => {
  const due = session({ busy: 14, idle: 13 })
  const { fetch, state } = server([due])
  const { open, stop, sweep } = archive(context(fetch), AFTER)

  open([due.id], 1)
  await sweep()
  const shown = [...state.archived]
  open([], 1)
  await settle()
  stop()

  expect(shown).toEqual([])
  expect(state.archived).toEqual([due.id])
})

// Catches a session that stays forever after its window closes: a closed window does not report again.
test("a session of a window that stopped its reports can go after three minutes", async () => {
  const due = session({ busy: 14, idle: 13 })
  const { fetch, state } = server([due])
  const { open, stop, sweep } = archive(context(fetch), AFTER)

  vi.useFakeTimers({ toFake: ["Date"] })
  open([due.id], 1)
  vi.setSystemTime(Date.now() + 3 * 60 * 1000)
  await sweep()
  vi.useRealTimers()
  stop()

  expect(state.archived).toEqual([due.id])
})
