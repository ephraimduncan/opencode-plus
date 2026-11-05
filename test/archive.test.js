import { describe, expect, test } from "vitest"
import { due } from "../src/archive.js"

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
    ["changed a minute ago", session({ busy: 14, idle: 13, updated: 1 / 60 }), false],
    ["a subagent session", session({ busy: 14, idle: 13, parentID: "ses_e5ec87753ffd9GaGacQL0ZRhT0" }), false],
    ["already archived", session({ busy: 14, idle: 13, archived: 5 }), false],
    ["never ran, made 13 hours ago", session({ created: 13 }), true],
  ])("%s: %s", (_, value, want) => {
    expect(due(value, NOW, AFTER, KEY)).toBe(want)
  })
})

describe("due after the pull request of its branch merged", () => {
  test.each([
    // Catches a merge that waits for the 12 hours.
    ["merged an hour after its last run", session({ busy: 3, idle: 2 }), 1, true],
    // Catches a comparison with the end of the run: the agent can merge in its own run.
    ["merged by its last run", session({ busy: 3, idle: 1 }), 2, true],
    // Catches a follow-up session that the old merge archives again after each run.
    ["ran again after the merge", session({ busy: 1, idle: 0.5 }), 2, false],
    ["made after the merge, never ran", session({ created: 1 }), 2, false],
    ["unarchived by hand after the merge", session({ busy: 3, idle: 2, kept: 0.5 }), 1, false],
    ["unarchived by hand, then merged", session({ busy: 3, idle: 2, kept: 1.5 }), 1, true],
    // Catches a merge that archives a session while it works or before its keep mark is written.
    ["still runs", session({ busy: 2 }), 1, false],
    ["changed a minute ago", session({ busy: 3, idle: 2, updated: 1 / 60 }), 1, false],
    ["a subagent session", session({ busy: 3, idle: 2, parentID: "ses_e5ec87753ffd9GaGacQL0ZRhT0" }), 1, false],
  ])("%s: %s", (_, value, merged, want) => {
    expect(due(value, NOW, AFTER, KEY, NOW - merged * HOUR)).toBe(want)
  })
})
