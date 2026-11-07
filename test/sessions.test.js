import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { sessions } from "../src/sessions.js"

const session = (title, project, directory) => ({ title, project, location: { directory } })

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

  expect(find("Fix the badge", "opencode-plus")).toEqual({ directory: "/Users/ephraim/dev/opencode-plus" })
  expect(find("Fix the badge", "roadmap-sync")).toEqual({ directory: "/Users/ephraim/dev/roadmap-sync" })
  expect(find("Review", "opencode-plus")).toEqual({ directory: "/Users/ephraim/dev/opencode-plus" })
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
