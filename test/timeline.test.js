import { beforeEach, expect, test, vi } from "vitest"

let timeline

// A fresh module per test: `heal` remembers which rows it still waits for.
beforeEach(async () => {
  vi.resetModules()
  timeline = await import("../src/timeline.js")
  document.body.innerHTML = ""
})

// A conversation row as the app renders it (OpenCode Desktop 2.2.5, session-timeline-row.tsx), in its virtualizer
// wrapper. Each entry is [kind, turn, spacing]; a "text" or "tool" entry is an assistant part.
const frame = ([kind, turn, spacing]) => {
  if (kind === "TurnGap") return `<div data-timeline-row="TurnGap" aria-hidden="true" style="height: 16px"></div>`

  const tag = kind === "text" || kind === "tool" ? "AssistantPart" : kind
  const body =
    kind === "text"
      ? `<div data-slot="session-turn-assistant-content"><div data-component="text-part">Reply</div></div>`
      : kind === "tool"
        ? `<div data-component="tool-part-wrapper">bash</div>`
        : `<div data-slot="session-turn-message-content">Prompt</div>`

  return (
    `<div data-message-id="${turn}" data-timeline-row="${tag}"${spacing ? ` data-timeline-spacing="${spacing}"` : ""}>` +
    `<div data-component="session-turn"><div data-slot="session-turn-message-container">${body}</div></div></div>`
  )
}

const wrap = (entry, index) =>
  `<div data-timeline-key="row-${index}" style="position: absolute; top: ${index * 40}px; height: 40px">` +
  `<div data-index="${index}">${frame(entry)}</div></div>`

const render = (entries) => {
  document.body.innerHTML =
    `<div data-timeline-virtual-content><div class="absolute inset-y-0">${entries.map(wrap).join("")}</div>` +
    `<div data-timeline-row="bottom-spacer"></div></div>`
}

const append = (entries, from) =>
  document
    .querySelector("[data-timeline-virtual-content] > div")
    .insertAdjacentHTML("beforeend", entries.map((entry, index) => wrap(entry, from + index)).join(""))

// The indexes of the rows that show a divider.
const marked = () =>
  Array.from(document.querySelectorAll("[data-plus-final]"), (element) => Number(element.parentElement.dataset.index))

// Catches a divider in the wrong place: it goes above the first text of the final reply, after the tool calls.
test("marks where a finished turn's final reply starts", () => {
  render([
    ["UserMessage", "u1"],
    ["text", "u1"],
    ["tool", "u1", "content"],
    ["text", "u1", "content"],
    ["text", "u1", "content"],
  ])

  timeline.divide(false)

  expect(marked()).toEqual([3])
})

// Catches a divider on a reply where nothing comes before the text, so nothing blends with it.
test("leaves a reply that is only text alone", () => {
  render([
    ["UserMessage", "u1"],
    ["text", "u1"],
  ])

  timeline.divide(false)

  expect(marked()).toEqual([])
})

// Catches a divider that jumps while the agent works: more tool calls can follow the text.
test("leaves the reply of a turn in progress alone", () => {
  render([
    ["UserMessage", "u1"],
    ["tool", "u1"],
    ["text", "u1", "content"],
  ])

  timeline.divide(true)

  expect(marked()).toEqual([])
})

// Catches the regression where a sent prompt removed the last reply's divider for a moment. The timeline drops the
// height change during its scroll to the prompt, and the reply stays clipped.
test("keeps the last reply's divider after a prompt is sent", () => {
  render([
    ["UserMessage", "u1"],
    ["tool", "u1"],
    ["text", "u1", "content"],
  ])
  const steps = []

  timeline.divide(false)
  steps.push(marked())
  timeline.divide(true)
  steps.push(marked())
  append(
    [
      ["TurnGap", "u2"],
      ["UserMessage", "u2"],
    ],
    3,
  )
  timeline.divide(true)
  steps.push(marked())

  expect(steps).toEqual([[2], [2], [2]])
})

// Catches a row left clipped: after its divider changes, a row whose box the timeline did not take gets a 1px nudge
// until the timeline has its new height.
test("nudges a row until the timeline has its new height", () => {
  render([
    ["UserMessage", "u1"],
    ["tool", "u1"],
    ["text", "u1", "content"],
  ])
  timeline.divide(false)
  const box = document.querySelector("[data-plus-final]").parentElement
  Object.defineProperty(box, "offsetHeight", { configurable: true, get: () => 80 })

  timeline.heal()
  const nudged = box.style.paddingBottom
  box.style.removeProperty("padding-bottom")
  box.parentElement.style.height = "80px"
  timeline.heal()

  expect([nudged, box.style.paddingBottom, timeline.pending()]).toEqual(["1px", "", false])
})
