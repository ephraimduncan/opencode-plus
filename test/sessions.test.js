import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { sessions } from "../src/sessions.js"

let count = 0
const session = (title, project, directory) => ({ id: `ses_${++count}`, title, project, location: { directory } })

const LIST = [
  session("Fix the badge", "opencode-plus", "/Users/ephraim/dev/opencode-plus"),
  session("Fix the badge", "roadmap-sync", "/Users/ephraim/dev/roadmap-sync"),
  session("New branch", "opencode-plus", "/Users/ephraim/.local/share/opencode/worktree/opencode-plus/calm-fox"),
  session("New branch", "opencode-plus", "/Users/ephraim/.local/share/opencode/worktree/opencode-plus/bold-owl"),
  session("Review", "opencode-plus", "/Users/ephraim/dev/opencode-plus"),
  session("Review", "opencode-plus", "/Users/ephraim/dev/opencode-plus"),
]

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// Catches a badge on the wrong row: a title alone can name sessions of other projects or other folders.
test("finds the folder of the session that a row names, and none when two folders fit", async () => {
  const find = sessions(async () => LIST, () => {})

  find("Fix the badge", "opencode-plus")
  await vi.runAllTimersAsync()

  expect(find("Fix the badge", "opencode-plus")).toEqual({
    id: "ses_1",
    location: { directory: "/Users/ephraim/dev/opencode-plus" },
  })
  expect(find("Fix the badge", "roadmap-sync")).toEqual({
    id: "ses_2",
    location: { directory: "/Users/ephraim/dev/roadmap-sync" },
  })
  // Two sessions in one folder share the folder, but the two names do not tell which session a row shows.
  expect(find("Review", "opencode-plus")).toEqual({
    id: undefined,
    location: { directory: "/Users/ephraim/dev/opencode-plus" },
  })
  expect(find("New branch", "opencode-plus")).toBeUndefined()
})

// Catches a request to the server on each pass: a row that names no session, such as a session of another server,
// loads the list again only after 30 seconds.
test("loads the list again for an unknown session at most every 30 seconds", async () => {
  const load = vi.fn(async () => LIST)
  const changed = vi.fn()
  const find = sessions(load, changed)

  find("Other server", "opencode-plus")
  find("Other server", "opencode-plus")
  await vi.advanceTimersByTimeAsync(29_000)
  find("Other server", "opencode-plus")
  find("Fix the badge", "opencode-plus")
  await vi.advanceTimersByTimeAsync(1_000)
  find("Other server", "opencode-plus")
  await vi.runAllTimersAsync()

  expect(load).toHaveBeenCalledTimes(2)
  expect(changed).toHaveBeenCalledTimes(2)
})
