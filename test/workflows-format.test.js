import { describe, expect, test } from "vitest"
import { brief, summarize } from "../src/workflow/tools.js"
import { elapsed, groups, tokens } from "../src/workflows/format.js"

describe("tokens", () => {
  test.each([
    [0, "0"],
    [999, "999"],
    [1000, "1k"],
    [1234, "1.2k"],
    [181_900, "182k"],
    [1_500_000, "1.5M"],
  ])("%d is %s", (count, want) => {
    expect(tokens(count)).toBe(want)
  })
})

describe("elapsed", () => {
  // The app's English strings for these keys.
  const STRINGS = {
    "ui.message.duration.seconds": "{{count}}s",
    "ui.message.duration.minutesSeconds": "{{minutes}}m {{seconds}}s",
    "ui.message.duration.hoursMinutes": "{{hours}}h {{minutes}}m",
  }
  const t = (key, params) => STRINGS[key].replace(/\{\{(\w+)\}\}/g, (_, name) => params[name])

  // Catches unpadded seconds or minutes, which make a ticking time change width, and a wrong unit cutoff.
  test.each([
    [59_999, "59s"],
    [60_000, "1m 00s"],
    [65_000, "1m 05s"],
    [3_600_000, "1h 00m"],
    [3_780_000, "1h 03m"],
  ])("%d ms is %s", (ms, want) => {
    expect(elapsed(ms, t)).toBe(want)
  })
})

describe("brief", () => {
  test.each([
    ["text", JSON.stringify("Paris is\nthe capital."), 100, "Paris is the capital."],
    ["an object", JSON.stringify({ isReal: true, findings: [{}, {}], note: { a: 1 } }), 100, "isReal: true · findings: 2 items · note: {…}"],
    ["a list", JSON.stringify([1]), 100, "1 item"],
    ["a long text", JSON.stringify("x".repeat(20)), 10, `${"x".repeat(9)}…`],
  ])("shows %s", (_, json, length, want) => {
    expect(brief(json, length)).toBe(want)
  })
})

describe("summarize", () => {
  // Catches absolute paths in the panel: a path inside the agent's directory shows relative to it.
  test.each([
    [{ filePath: "/repo/src/cart.js" }, "src/cart.js"],
    [{ path: "/repo" }, "."],
    [{ command: "cd /repo/src && bun test" }, "cd src && bun test"],
    [{ pattern: "TODO", path: "/repo/src" }, "TODO"],
    [{ filePath: "/elsewhere/x" }, "/elsewhere/x"],
    [{ other: 1 }, ""],
  ])("%o is %s", (input, want) => {
    expect(summarize(input, "/repo")).toBe(want)
  })
})

describe("groups", () => {
  const agent = (id, phase) => ({ id, ...(phase && { phase }) })

  // Catches a group order that follows the agents instead of the meta: Verify comes after Review even when a Verify
  // agent starts first, and a phase that only phase() named comes after the declared ones.
  test("orders groups by the declared phases, then by first use, with loose agents last", () => {
    const result = groups(
      [{ title: "Review", detail: "one per file" }, { title: "Verify" }],
      [agent("a1", "Verify"), agent("a2"), agent("a3", "Extra"), agent("a4", "Review")],
    )

    expect(result).toEqual([
      { title: "Review", detail: "one per file", agents: [agent("a4", "Review")] },
      { title: "Verify", detail: undefined, agents: [agent("a1", "Verify")] },
      { title: "Extra", detail: undefined, agents: [agent("a3", "Extra")] },
      { title: undefined, agents: [agent("a2")] },
    ])
  })
})
