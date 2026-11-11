import { ROW } from "./sidebar.js"

// The row of a working session ends with the app's spinner, then the time since the session's run started (OpenCode
// Desktop 2.2.7, inbox.tsx). The app shows no time while only the subagents of the session work, as in a workflow,
// and it starts from zero when the session continues after them. It shows one unit, so "1h" stays for an hour. The
// plugin's own time takes the place of the app's.

const STATUS = ":scope > span:nth-of-type(2) > span:last-of-type"
const TIME = "data-plus-time"

// The time shows last, also after the app puts its spinner in the row again.
export const css = `
[${TIME}] {
  order: 1;
}
${ROW}[data-status="working"] > span:nth-of-type(2) > span:last-of-type:has(> [${TIME}]) > [aria-hidden="true"]:not([data-component="activity-ring"], [${TIME}]) {
  display: none;
}
`

// How long `ms` is, in its two largest units: "59s", "1m 05s", "1h 23m", "1d 4h".
export function text(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const pad = (value) => String(value).padStart(2, "0")

  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`

  if (hours > 0) return `${hours}h ${pad(minutes % 60)}m`

  if (minutes > 0) return `${minutes}m ${pad(seconds % 60)}s`

  return `${seconds}s`
}

// When the work of a session started, as its times tell: `busy` is the start of its last run, and `idle` the end.
// `own` tells that the session itself works, and `agents` that one of its subagents does. Undefined when the times do
// not tell.
export function origin({ busy, idle }, own, agents) {
  if (busy === undefined) return

  if (idle === undefined || busy > idle) return busy

  // The last run ended. Its subagents can continue the work. But when the session itself works, it started a new run,
  // and the time of that run did not come yet.
  return agents && !own ? busy : undefined
}

// A session whose work stops for less than this time continues the same work, as when it gets the result of its
// subagents.
const PAUSE = 5000

// When the work of each session started, and when a pass last found the session at work.
const works = new Map()

// When the work of session `id` started. `from` is the start as `origin` gives it; without it, the work starts at
// `now`. A new run of a session that did not stop continues the work, so the earliest start stays.
export function since(id, from, now) {
  const last = works.get(id)
  const start = Math.min(last && now - last.seen <= PAUSE ? last.start : Infinity, from ?? now)

  works.set(id, { start, seen: now })

  return start
}

// Shows in each working row how long its session works. `find(row)` gives the session of the row as `{ id, from }`,
// with `from` as `origin` gives it, or undefined when it cannot tell the session; that row keeps the app's time.
export function show(find, now = Date.now()) {
  document.querySelectorAll(ROW).forEach((row) => {
    const session = row.getAttribute("data-status") === "working" ? find(row) : undefined
    let time = row.querySelector(`[${TIME}]`)

    if (!session) return time?.remove()

    if (!time) {
      time = document.createElement("span")
      time.setAttribute(TIME, "")
      time.setAttribute("aria-hidden", "true")
      time.append("")
      row.querySelector(STATUS).append(time)
    }

    const value = text(now - since(session.id, session.from, now))

    // A change to the text node does not wake the page-wide observer, as a new node does.
    if (time.firstChild.data !== value) time.firstChild.data = value
  })
}

// Removes every time, as when the plugin stops.
export function clean() {
  works.clear()
  document.querySelectorAll(`[${TIME}]`).forEach((time) => time.remove())
}
