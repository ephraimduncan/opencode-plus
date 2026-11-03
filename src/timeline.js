import { mark } from "./dom.js"

// The conversation's rows are virtualized, absolutely placed `[data-timeline-key]` wrappers, and only a window of them
// is in the page (OpenCode Desktop 2.2.5). Each holds a frame naming its turn (`data-message-id`) and kind
// (`data-timeline-row`); an assistant part that follows another part in its turn also has `data-timeline-spacing`.

const VIRTUAL = "[data-timeline-virtual-content]"
const CONTAINER = '[data-slot="session-turn-message-container"]'
const FINAL = "data-plus-final"
const REPLY = `[${FINAL}] > [data-component="session-turn"] > ${CONTAINER}`

// Half the label's width, measured by `fit`, sets the break in the divider's line.
const HALF = "--plus-label-half"

// The app's timeline separator, as on a model switch: a 32px band whose hairlines fade in from each edge to the strong
// border color, broken in the middle for a faint label, 12px clear on each side. Without a label, the line is whole.
export function css(label) {
  return `
${REPLY} {
  --plus-gap: calc(var(${HALF}, ${label.length * 3.75}px) + 12px);
  position: relative;
}
${REPLY}::before {
  content: "";
  display: block;
  /* The reply container is a column that aligns items to the start, which would shrink an empty line to nothing. */
  align-self: stretch;
  height: 32px;
  margin-bottom: 8px;
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    var(--v2-border-border-strong) 35%,
    var(--v2-border-border-strong) 65%,
    transparent 100%
  );
  background-size: 100% 1px;
  background-position: center;
  background-repeat: no-repeat;
${
  label
    ? `  mask-image: linear-gradient(
    90deg,
    #000 calc(50% - var(--plus-gap)),
    transparent calc(50% - var(--plus-gap)),
    transparent calc(50% + var(--plus-gap)),
    #000 calc(50% + var(--plus-gap))
  );
}
${REPLY}::after {
  content: ${JSON.stringify(label)};
  position: absolute;
  top: 0;
  left: 50%;
  translate: -50% 0;
  font-size: 13px;
  font-weight: 440;
  line-height: 32px;
  letter-spacing: -0.04px;
  white-space: nowrap;
  color: var(--color-v2-text-text-faint);
  pointer-events: none;
}`
    : "}"
}
`
}

// Measures the label in the conversation's type, once its font has loaded.
let fitted = false

export function fit(label) {
  const container = document.querySelector(CONTAINER)

  if (fitted || !label || !container || document.fonts?.status === "loading") return

  const probe = document.createElement("span")
  probe.textContent = label
  probe.style.cssText =
    "position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px"
  container.append(probe)
  const width = probe.getBoundingClientRect().width
  probe.remove()

  if (!width) return
  document.documentElement.style.setProperty(HALF, `${width / 2}px`)
  fitted = true
}

const kind = (row) => row?.frame?.getAttribute("data-timeline-row")
const turn = (row) => row?.frame?.getAttribute("data-message-id")
const text = (row) =>
  kind(row) === "AssistantPart" &&
  !!row.frame.querySelector('[data-component="text-part"]') &&
  !row.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]')

// Marks where each finished turn's final reply starts: its last run of text rows, when something came before it in the
// turn. A row is only judged when the row after it is in the page, or it is the last row; the rest keep their mark.
// `running` is whether the open session still works.
export function divide(running) {
  document.querySelectorAll(VIRTUAL).forEach((content) => {
    const rows = Array.from(content.querySelectorAll(":scope > div > [data-timeline-key]"), (wrapper) => ({
      wrapper,
      frame: wrapper.querySelector(":scope > [data-index] > [data-timeline-row]"),
      top: parseFloat(wrapper.style.top),
      height: parseFloat(wrapper.style.height),
    })).sort((a, b) => a.top - b.top)
    const spacer = content.querySelector(':scope > [data-timeline-row="bottom-spacer"]')

    // Neighbours count only when adjacent: rows outside the window leave a gap.
    const next = (i) =>
      rows[i + 1] && Math.abs(rows[i + 1].top - (rows[i].top + rows[i].height)) < 2 ? rows[i + 1] : undefined
    const previous = (i) =>
      rows[i - 1] && Math.abs(rows[i].top - (rows[i - 1].top + rows[i - 1].height)) < 2 ? rows[i - 1] : undefined
    const last = (i) =>
      i === rows.length - 1 &&
      !!spacer &&
      Math.abs(rows[i].wrapper.getBoundingClientRect().bottom - spacer.getBoundingClientRect().top) < 2

    // Past the last row, a turn ends once the session is idle. While it runs, the end is not known yet: a prompt just
    // sent shows a moment after the session starts.
    const idle = running ? undefined : true

    // Whether the turn ends after row i: true, false, or undefined when that is not known yet.
    const ends = (i) => {
      const after = next(i)

      if (!after) return rows[i + 1] || !last(i) ? undefined : idle

      // The live status slot renders no frame.
      if (!after.frame) return idle

      if (kind(after) === "TurnGap" || kind(after) === "UserMessage" || (turn(after) && turn(after) !== turn(rows[i])))
        return true

      // A turn's changed files show once it finishes, and an "Interrupted" separator ends it.
      if (kind(after) === "TurnDiff" || kind(after) === "TurnDivider") return true

      if (kind(after) === "AssistantPart" || kind(after) === "Thinking") return false

      return idle
    }

    rows.forEach((row, i) => {
      if (!text(row)) return divider(row, false)

      const end = ends(i)

      if (end === undefined) return

      if (!end) {
        const after = next(i)

        if (!(text(after) && turn(after) === turn(row))) divider(row, false)

        return
      }

      let start = i

      while (text(previous(start)) && turn(previous(start)) === turn(row)) start -= 1

      for (let k = start; k <= i; k += 1)
        divider(rows[k], k === start && rows[k].frame.hasAttribute("data-timeline-spacing"))
    })
  })
}

// Rows whose divider changed, until the timeline has their new height: each row's `[data-index]` box, with the checks
// it has left.
const unmeasured = new Map()

const divider = (row, on) => {
  if (!row.frame || row.frame.hasAttribute(FINAL) === on) return
  mark(row.frame, FINAL, on ? "" : undefined)
  unmeasured.set(row.frame.parentElement, 10)
}

// The timeline measures each row with a ResizeObserver, but drops sizes that arrive during a smooth scroll and never
// measures again, which leaves the row clipped at its old height. A row whose divider changed is checked until the
// timeline has its new height; a 1px nudge makes the observer report it again.
export function heal() {
  unmeasured.forEach((checks, box) => {
    const stale = box.isConnected && Math.abs(box.offsetHeight - parseFloat(box.parentElement.style.height)) >= 1

    if (!stale || checks === 0) return unmeasured.delete(box)
    unmeasured.set(box, checks - 1)
    box.style.paddingBottom = "1px"
    requestAnimationFrame(() => box.style.removeProperty("padding-bottom"))
  })
}

// Whether a row still waits for the timeline to measure it, so `heal` must run again.
export const pending = () => unmeasured.size > 0

// Removes every divider, as when the plugin stops.
export function clean() {
  document.querySelectorAll(`[${FINAL}]`).forEach((frame) => frame.removeAttribute(FINAL))
  document.documentElement.style.removeProperty(HALF)
}
