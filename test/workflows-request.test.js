// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { request } from "../src/workflows/request.js"

// A session whose server answers each call of `list` with the next of `answers`: an error to throw, or an output.
const session = (answers) => {
  const list = vi.fn(async () => {
    const answer = answers.shift()

    if (answer.type) throw answer
    return answer
  })

  return { list, directory: "/project", server: { client: { rpc: () => ({ list }) } } }
}

// The error of a call that the server gets before the server part runs in the folder (OpenCode 2.2.7, rpc.ts).
const early = () => ({ type: "rpc.unavailable", message: "RPC is unavailable: opencode-plus" })

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

// Catches a panel that stays empty in a folder that the server did not use before: the first call there comes before
// the server part runs.
test("runs a call again when it came before the server part ran", async () => {
  const target = session([early(), early(), { runs: ["r1"] }])
  const result = request(target, "list", { sessionID: "ses_1" })

  await vi.runAllTimersAsync()

  expect(await result).toEqual({ runs: ["r1"] })
  expect(target.list).toHaveBeenCalledTimes(3)
  expect(target.list).toHaveBeenLastCalledWith({ sessionID: "ses_1" }, { location: { directory: "/project" } })
})

// Catches an action that the server part refused and that runs again: only a call that came too early has a second
// try.
test("does not repeat a call that the server part refused", async () => {
  const refused = { type: "workflow.unknown", message: "No run r9" }
  const target = session([refused, { runs: [] }])

  await expect(request(target, "list", { sessionID: "ses_1" })).rejects.toBe(refused)
  expect(target.list).toHaveBeenCalledOnce()
})

// Catches a call that waits without end when the server part does not start.
test("gives the error when the server part does not start", async () => {
  const target = session(Array.from({ length: 50 }, early))
  const failed = expect(request(target, "list", { sessionID: "ses_1" })).rejects.toEqual(early())

  await vi.runAllTimersAsync()
  await failed
})
