import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { listen, render, stats } from "../src/usage.js"

const sonnet = { providerID: "anthropic", id: "claude-sonnet-4-5" }

// A model as the server lists it (OpenCode 2.2.5, ModelInfo), at `rate` dollars per million input tokens.
const model = (rate) => ({
  id: "claude-sonnet-4-5",
  modelID: "claude-sonnet-4-5",
  providerID: "anthropic",
  name: "Claude Sonnet 4.5",
  capabilities: {},
  variants: [],
  time: { released: 0 },
  cost: [{ input: rate, output: rate * 5, cache: { read: rate / 10, write: rate * 1.25 } }],
  status: "active",
  enabled: true,
  limit: { context: 200_000, output: 64_000 },
})

const user = (id) => ({ id, type: "user", text: "Fix the bug", time: { created: 1 } })

const assistant = (id, tokens) => ({
  id,
  type: "assistant",
  agent: "build",
  model: sonnet,
  content: [],
  time: { created: 2, completed: 3 },
  finish: "stop",
  cost: 0.01,
  tokens,
})

// Two turns: the first step used 5,500 tokens, the second 34,123.
const messages = [
  user("u1"),
  assistant("a1", { input: 5_000, output: 500, reasoning: 0, cache: { read: 0, write: 0 } }),
  user("u2"),
  assistant("a2", { input: 30_000, output: 2_000, reasoning: 1_000, cache: { read: 1_000, write: 123 } }),
]

// A mounted session with the parts of its server's data that the usage button reads.
const session = ({ revert, cost = 0.19, models = [model(3)] } = {}) => ({
  id: "ses_1",
  directory: "/repo",
  server: {
    data: {
      session: {
        get: () => ({ id: "ses_1", model: sonnet, cost, revert, time: { created: 1, updated: 3 } }),
        cost: () => cost,
        message: { list: () => messages },
      },
      location: {
        provider: { list: () => [{ id: "anthropic", name: "Anthropic", activation: "auto", package: "@ai-sdk/anthropic" }] },
        model: { list: () => models },
      },
    },
  },
})

test.each([
  // Catches cache tokens left out: the card must agree with the button's count.
  ["the latest step", undefined, 34_123, 17],
  // Catches a revert left out: an undone step no longer fills the context window.
  ["the last step before a revert", { messageID: "u2" }, 5_500, 3],
])("counts %s against the model's context limit", (_, revert, total, percent) => {
  expect(stats(session({ revert }))).toMatchObject({ total, percent })
})

// Catches a card that disagrees with the button, which shows no cost for a free model until the session costs
// something, and a cost whenever it cannot tell.
test.each([
  ["a free model", [model(0)], 0, undefined],
  ["a free model that cost something", [model(0)], 0.5, 0.5],
  ["a priced model", [model(3)], 0, 0],
  ["a model the server does not list", [], 0, 0],
])("cost of %s", (_, models, cost, want) => {
  expect(stats(session({ models, cost })).cost).toBe(want)
})

// Catches a bar scaled to the step's own tokens, which shows a full context window for every session.
test("fills the bar to the share of the context window that the step uses", () => {
  const card = document.createElement("div")

  card.append(...render(stats(session()), (key) => key, "en-US"))

  const widths = Array.from(card.querySelectorAll('[data-part="bar"] > *'), (segment) => parseFloat(segment.style.width))

  // 34,123 of 200,000 tokens.
  expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(17.0615, 3)
})

// The header's usage button, and the menu button that a narrow header shows instead (OpenCode Desktop 2.2.5, the
// context plugin).
const header = () => {
  document.body.innerHTML =
    `<div data-theme="dark">` +
    `<div data-component="tooltip-v2-trigger"><button id="usage" data-component="button-v2" aria-expanded="false" aria-label="Toggle session context">` +
    `<span><div><svg data-component="progress-circle" data-appearance="compact"><circle id="ring"></circle></svg></div><span id="count">34k</span></span>` +
    `</button></div>` +
    `<div data-component="tooltip-v2-trigger"><button data-component="button-v2" aria-haspopup="true" aria-expanded="false" aria-label="View context usage">` +
    `<div><svg data-component="progress-circle" data-appearance="compact"><circle id="menu"></circle></svg></div>` +
    `</button></div>` +
    `<span id="title">Fix the bug</span>` +
    `</div>`
}

const element = (id) => document.getElementById(id)
const card = () => document.querySelector("[data-plus-usage]")

// Moves the pointer from one element to another, as the browser reports it.
const move = (from, to, pointerType = "mouse") => {
  from.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: to, pointerType }))
  to.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, relatedTarget: from, pointerType }))
}

let stop

beforeEach(() => {
  vi.useFakeTimers()
  header()
  stop = listen((element) => {
    element.textContent = "34,123 tokens"
    return () => {}
  })
})

afterEach(() => {
  stop()
  vi.useRealTimers()
})

// Catches a card that flashes as the pointer passes over the header, and one that never goes away.
test("opens once the pointer rests on the usage button, and closes once it leaves", () => {
  move(element("title"), element("ring"))
  expect(card()).toBeNull()

  vi.advanceTimersByTime(500)
  expect(card()?.textContent).toBe("34,123 tokens")

  move(element("ring"), element("title"))
  vi.advanceTimersByTime(500)
  expect(card()).toBeNull()
})

// Catches a card that closes before the pointer reaches it, so it cannot be read up close or have its text selected.
test("stays open while the pointer moves onto the card", () => {
  move(element("title"), element("ring"))
  vi.advanceTimersByTime(500)

  move(element("ring"), element("title"))
  move(element("title"), card())
  vi.advanceTimersByTime(500)

  expect(card()).not.toBeNull()
})

// Catches a card over the Context panel the click opens, and a card that never comes back after a click.
test("a click hides the card until the pointer leaves the button", () => {
  move(element("title"), element("ring"))
  vi.advanceTimersByTime(500)

  element("ring").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }))
  expect(card()).toBeNull()

  move(element("ring"), element("count"))
  vi.advanceTimersByTime(500)
  expect(card()).toBeNull()

  move(element("count"), element("title"))
  move(element("title"), element("ring"))
  vi.advanceTimersByTime(500)
  expect(card()).not.toBeNull()
})

// Catches a second popover on the narrow header's menu button, and a card that flashes on a tap.
test.each([
  ["the narrow header's menu button", "menu", "mouse"],
  ["a tap on the usage button", "ring", "touch"],
])("stays closed for %s", (_, id, pointerType) => {
  move(element("title"), element(id), pointerType)
  vi.advanceTimersByTime(500)

  expect(card()).toBeNull()
})
