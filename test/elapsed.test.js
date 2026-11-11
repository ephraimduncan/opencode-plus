import { beforeEach, expect, test } from "vitest"
import { clean, origin, show, since, text } from "../src/elapsed.js"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

beforeEach(() => {
  clean()
  document.body.innerHTML = ""
})

// Catches a time that stays at "1h" for an hour, or that drops its smaller unit.
test("writes a time in its two largest units", () => {
  expect(text(59 * SECOND)).toBe("59s")
  expect(text(MINUTE + 5 * SECOND)).toBe("1m 05s")
  expect(text(HOUR + 23 * MINUTE + 45 * SECOND)).toBe("1h 23m")
  expect(text(26 * HOUR + 59 * MINUTE)).toBe("1d 2h")
  expect(text(-SECOND)).toBe("0s")
})

// Catches a row with no time while a workflow runs: the run of the session ended, and its subagents work.
test("takes the start of the last run while only the subagents work", () => {
  expect(origin({ busy: 100, idle: 150 }, false, true)).toBe(100)
})

// Catches the time of an earlier run on a session that starts a new one: the start of the new run comes a moment
// after the session starts to work.
test("does not take the start of a run that ended when the session itself works", () => {
  expect(origin({ busy: 100, idle: 150 }, true, false)).toBeUndefined()
  expect(origin({ busy: 100, idle: 150 }, true, true)).toBeUndefined()
  expect(origin({ busy: 200, idle: 150 }, true, false)).toBe(200)
  expect(origin({ busy: 100 }, true, false)).toBe(100)
  expect(origin({}, true, false)).toBeUndefined()
})

// Catches a time that starts from zero when a session continues after its subagents: its new run starts later than
// the work did.
test("keeps the start of the work through a new run", () => {
  expect(since("ses_1", 1 * SECOND, 60 * SECOND)).toBe(1 * SECOND)
  // The new run started, and its time did not come yet.
  expect(since("ses_1", undefined, 61 * SECOND)).toBe(1 * SECOND)
  expect(since("ses_1", 61 * SECOND, 62 * SECOND)).toBe(1 * SECOND)
})

// Catches a time that never starts again: work after a stop of more than 5 seconds is new work.
test("starts again after the session stopped", () => {
  since("ses_1", 1 * SECOND, 60 * SECOND)

  expect(since("ses_1", 70 * SECOND, 71 * SECOND)).toBe(70 * SECOND)
})

// Catches a time that stays at the moment the plugin first found the session: the start of the run comes later, and
// it is earlier.
test("counts from the first pass until the start of the run comes", () => {
  expect(since("ses_2", undefined, 40 * SECOND)).toBe(40 * SECOND)
  expect(since("ses_2", 38 * SECOND, 41 * SECOND)).toBe(38 * SECOND)
})

// A session row as the app's sidebar renders it (OpenCode Desktop 2.2.7, inbox.tsx), with the app's own time.
const row = (title, status) =>
  `<button type="button" data-slot="sidebar-inbox-item" data-status="${status}">` +
  `<span class="flex h-4"><span class="flex size-4">O</span><span dir="auto">${title}</span></span>` +
  `<span class="relative flex h-4"><span class="flex min-w-0 flex-1"><span dir="auto">opencode-plus</span></span>` +
  `<span class="ms-auto flex shrink-0 items-center gap-1.5"><span class="sr-only">Working</span>` +
  `<span data-component="activity-ring" aria-hidden="true"></span>` +
  `<span aria-hidden="true" class="text-v2-text-text-faint">1h</span></span></span></button>`

const times = () =>
  Array.from(document.querySelectorAll('[data-slot="sidebar-inbox-item"]'), (element) =>
    Array.from(element.querySelectorAll("[data-plus-time]"), (time) => time.textContent),
  )

// Catches a time on a row whose session the plugin cannot tell, and a time that stays after the session stopped.
test("shows the time on working rows of known sessions only", () => {
  document.body.innerHTML = row("Known", "working") + row("Unknown", "working") + row("Read", "ready")
  const find = (element) =>
    element.textContent.includes("Unknown") ? undefined : { id: element.textContent, from: 10 * SECOND }

  show(find, 10 * SECOND + 2 * HOUR + 5 * MINUTE)
  expect(times()).toEqual([["2h 05m"], [], []])

  document.querySelector('[data-slot="sidebar-inbox-item"]').setAttribute("data-status", "ready")
  show(find, 10 * SECOND + 3 * HOUR)
  expect(times()).toEqual([[], [], []])
})
