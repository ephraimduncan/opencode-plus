import { beforeEach, expect, test, vi } from "vitest"
import { button, layout, plus } from "../src/sidebar.js"

// A session row as the app's sidebar renders it (OpenCode Desktop 2.2.5, inbox.tsx).
const row = (project, title, status = "ready") =>
  `<button type="button" data-slot="sidebar-inbox-item" data-status="${status}" class="group flex w-full flex-col">` +
  `<span class="flex h-4 w-full min-w-0 items-center"><span class="flex size-4 shrink-0">${project[0].toUpperCase()}</span>` +
  `<span class="min-w-0 truncate">${project}</span><span class="ms-auto shrink-0 tabular-nums">2h</span></span>` +
  `<span dir="auto" class="w-full min-w-0 truncate">${title}</span>` +
  `<span class="flex h-4 w-full min-w-0 items-center">main</span></button>`

const render = (finished, working = []) => {
  document.body.innerHTML =
    `<div data-slot="sidebar-inbox" class="flex min-h-0 flex-1 flex-col">` +
    `<div data-slot="sidebar-inbox-scroll" class="flex min-h-0 flex-1 flex-col">${finished.map((r) => row(...r)).join("")}</div>` +
    `<div data-slot="sidebar-inbox-working"><button type="button" aria-expanded="true">Working</button>` +
    `<div class="flex min-h-0 flex-col">${working.map((r) => row(...r)).join("")}</div></div></div>`
}

// The rows in the order the page shows them, each with its group heading, or "-" for none.
const shown = () =>
  Array.from(document.querySelectorAll('[data-slot="sidebar-inbox-item"]'))
    .map((element, index) => ({ element, index, order: Number(element.style.order || 0) }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ element }) => `${element.children[1].textContent} ${element.getAttribute("data-plus-group") ?? "-"}`)

const titled = (title) =>
  Array.from(document.querySelectorAll('[data-slot="sidebar-inbox-item"]')).find(
    (element) => element.children[1].textContent === title,
  )

beforeEach(() => {
  document.body.innerHTML = ""
})

// Catches a wrong group threshold or order: a project with two or more sessions gets one heading and its sessions
// together; a project's only session stays a plain row.
test("groups a project's sessions under one heading and leaves a single session alone", () => {
  render([
    ["roadmap-sync", "R1"],
    ["telemetry.dev", "T1"],
    ["roadmap-sync", "R2"],
    ["dev", "D1"],
    ["telemetry.dev", "T2"],
  ])

  layout(true, false)

  expect(shown()).toEqual(["R1 roadmap-sync", "R2 -", "T1 telemetry.dev", "T2 -", "D1 -"])
})

// Catches a heading that sticks to the row above it: every project after the first starts with the same gap.
test("starts each project after the first with a gap", () => {
  render([
    ["roadmap-sync", "R1"],
    ["dev", "D1"],
    ["roadmap-sync", "R2"],
    ["telemetry.dev", "T1"],
  ])

  layout(true, false)

  const gaps = ["R1", "R2", "D1", "T1"].map((title) => titled(title).hasAttribute("data-plus-gap"))
  expect(gaps).toEqual([false, false, true, true])
})

// Catches working sessions left at the bottom: with `inline`, a working session leads its project, and its project
// comes first.
test("puts a working session first, in its project's group", () => {
  render(
    [
      ["roadmap-sync", "R1"],
      ["telemetry.dev", "T1"],
      ["telemetry.dev", "T2"],
    ],
    [["telemetry.dev", "T0", "working"]],
  )

  layout(true, true)

  expect(shown()).toEqual(["T0 telemetry.dev", "T1 -", "T2 -", "R1 -"])
})

// Catches a stale button: when a project drops to one session, it has no heading, so its + button must go.
test("keeps a + button on each current group heading only", () => {
  render([
    ["roadmap-sync", "R1"],
    ["roadmap-sync", "R2"],
    ["telemetry.dev", "T1"],
    ["telemetry.dev", "T2"],
  ])
  const create = (name) => {
    const element = document.createElement("div")
    element.setAttribute("data-plus-add", name)
    return element
  }

  layout(true, false)
  plus(create)
  titled("T2").remove()
  layout(true, false)
  plus(create)

  const buttons = Array.from(document.querySelectorAll("[data-plus-add]"), (element) => [
    element.parentElement.children[1].textContent,
    element.getAttribute("data-plus-add"),
  ])
  expect(buttons).toEqual([["R1", "roadmap-sync"]])
})

// Catches a click that also opens the session below the button: the button sits inside that session's row.
test("a click on the + button starts a session without opening the row", () => {
  render([["roadmap-sync", "R1"]])
  const opened = vi.fn()
  const started = vi.fn()
  const element = titled("R1")
  element.addEventListener("click", opened)
  element.append(button({ name: "roadmap-sync", label: "New session in roadmap-sync", icon: () => {}, onSelect: started }))

  element.querySelector("[data-plus-add]").click()
  element.querySelector("[data-plus-add]").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))

  expect(started).toHaveBeenCalledTimes(2)
  expect(opened).not.toHaveBeenCalled()
})
