import { beforeEach, expect, test, vi } from "vitest"
import { button, clean, layout, menu, plus } from "../src/sidebar.js"

// A session row as the app's sidebar renders it (OpenCode Desktop 2.2.6, inbox.tsx): the badge and title, then the
// project, the branch icon, and the status and time.
const row = (project, title, status = "ready") =>
  `<button type="button" id="cl-${title}" data-slot="sidebar-inbox-item" data-status="${status}" class="group flex h-[54px] flex-col">` +
  `<span class="flex h-4 w-full min-w-0 shrink-0 items-center gap-2"><span class="flex size-4 shrink-0">${project[0].toUpperCase()}</span>` +
  `<span dir="auto" class="min-w-0 flex-1 truncate">${title}</span></span>` +
  `<span class="relative flex h-4 w-full min-w-0 shrink-0 items-center gap-2 ps-6">` +
  `<span class="flex min-w-0 flex-1 items-center gap-2"><span dir="auto" class="min-w-0 truncate">${project}</span>` +
  `<div data-component="tooltip-v2-trigger" class="flex shrink-0"><svg data-slot="icon-svg"><use href="#opencode-v2-icon-branch"></use></svg></div></span>` +
  `<span class="ms-auto flex shrink-0 items-center gap-1.5"><span class="text-v2-text-text-faint">2h</span></span></span></button>`

// A section of the session list: its heading, then its rows.
const section = (name, rows, more = "") =>
  rows.length === 0
    ? ""
    : `<div role="group" aria-labelledby="cl-1-${name}" class="flex shrink-0 flex-col gap-2 pb-2.5">` +
      `<div id="cl-1-${name}" class="flex h-6 shrink-0 items-center"><span class="min-w-0 truncate">${name}</span></div>` +
      `<div class="flex flex-col gap-0.5">${rows.map((r) => row(...r)).join("")}</div>${more}</div>`

const render = ({ needs = [], unread = [], recent = [], working = [], expanded = true }) => {
  document.body.innerHTML =
    `<div data-slot="sidebar-inbox" class="flex min-h-0 flex-1 flex-col"><span class="sr-only" role="status"></span>` +
    `<div data-slot="sidebar-inbox-scroll" data-scrollable class="flex min-h-0 flex-1 flex-col gap-0.5">` +
    section("needs", needs) +
    section("unread", unread) +
    section("recent", recent, `<button type="button">Show more</button>`) +
    `<div class="shrink-0 pt-3"><button type="button">Archived</button></div></div>` +
    `<div data-slot="sidebar-inbox-working" role="group" aria-labelledby="cl-1-working" class="relative flex flex-col">` +
    `<span aria-hidden="true" class="absolute top-0 h-px"></span>` +
    `<button id="cl-1-working" type="button" aria-expanded="${expanded}">Working</button>` +
    (expanded ? `<div data-scrollable class="flex min-h-0 flex-col">${working.map((r) => row(...r)).join("")}</div>` : "") +
    `</div></div>`
}

const title = (element) => element.querySelector(":scope > span > span[dir]").textContent

// The rows of the elements that `selector` names, in the order the page shows them, each with its group heading, or
// "-" for none.
const shown = (selector) =>
  Array.from(document.querySelectorAll(selector))
    .flatMap((list) => Array.from(list.querySelectorAll('[data-slot="sidebar-inbox-item"]')))
    .map((element, index) => ({ element, index, order: Number(element.style.order || 0) }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ element }) => `${title(element)} ${element.getAttribute("data-plus-group") ?? "-"}`)

const LIST = '[aria-labelledby$="-unread"], [aria-labelledby$="-recent"]'

const titled = (name) =>
  Array.from(document.querySelectorAll('[data-slot="sidebar-inbox-item"]')).find((element) => title(element) === name)

beforeEach(() => {
  clean()
  document.body.innerHTML = ""
})

// Catches a group that stops at a section's edge: a project's unread and read sessions form one group, a project's
// only session stays a plain row, and the most recently active project comes first.
test("groups a project's unread and read sessions under one heading and leaves a single session alone", () => {
  render({
    unread: [["telemetry.dev", "T1", "done"]],
    recent: [
      ["roadmap-sync", "R1"],
      ["telemetry.dev", "T2"],
      ["dev", "D1"],
      ["roadmap-sync", "R2"],
    ],
  })

  layout(true, false)

  expect(shown(LIST)).toEqual(["T1 telemetry.dev", "T2 -", "R1 roadmap-sync", "R2 -", "D1 -"])
})

// Catches a session that waits for an answer moving down into its project's group: Needs attention stays a list of its
// own, above the others.
test("keeps the Needs attention list apart from the project groups", () => {
  render({
    needs: [["roadmap-sync", "R0", "approval"]],
    recent: [
      ["roadmap-sync", "R1"],
      ["roadmap-sync", "R2"],
    ],
  })

  layout(true, false)

  expect(shown('[aria-labelledby$="-needs"]')).toEqual(["R0 -"])
  expect(shown(LIST)).toEqual(["R1 roadmap-sync", "R2 -"])
})

// Catches a project that moves away when the person opens one of its sessions: to read a session is no activity.
test("opening a session leaves its project in place", () => {
  render({
    unread: [
      ["roadmap-sync", "R0", "done"],
      ["opencode-plus", "P1", "done"],
    ],
    recent: [
      ["telemetry.dev", "T1"],
      ["opencode-plus", "P2"],
    ],
  })
  layout(true, false)
  // The app moves the opened session from Unread to Recent, after T1, which finished later.
  render({
    unread: [["roadmap-sync", "R0", "done"]],
    recent: [
      ["telemetry.dev", "T1"],
      ["opencode-plus", "P1"],
      ["opencode-plus", "P2"],
    ],
  })
  layout(true, false)

  expect(shown(LIST)).toEqual(["R0 -", "P1 opencode-plus", "P2 -", "T1 -"])
})

// Catches a project that stays down when one of its sessions starts to work again.
test("a project with a session that starts to work moves first", () => {
  render({
    recent: [
      ["roadmap-sync", "R1"],
      ["opencode-plus", "P1"],
    ],
  })
  layout(true, true)
  render({ recent: [["roadmap-sync", "R1"]], working: [["opencode-plus", "P1", "working"]] })
  layout(true, true)

  expect(shown(`${LIST}, [data-slot="sidebar-inbox-working"]`)).toEqual(["P1 -", "R1 -"])
})

// Catches a heading that sticks to the row above it: every project after the first starts with the same gap.
test("starts each project after the first with a gap", () => {
  render({
    recent: [
      ["roadmap-sync", "R1"],
      ["dev", "D1"],
      ["roadmap-sync", "R2"],
      ["telemetry.dev", "T1"],
    ],
  })

  layout(true, false)

  const gaps = ["R1", "R2", "D1", "T1"].map((name) => titled(name).hasAttribute("data-plus-gap"))
  expect(gaps).toEqual([false, false, true, true])
})

// Catches working sessions left in their own section: with `inline`, a working session leads its project, and its
// project comes first. A collapsed Working section renders no rows, so it opens.
test("puts a working session first, in its project's group", () => {
  render({
    recent: [
      ["roadmap-sync", "R1"],
      ["telemetry.dev", "T1"],
      ["telemetry.dev", "T2"],
    ],
    expanded: false,
  })
  const shelf = document.querySelector('[data-slot="sidebar-inbox-working"]')
  // The app renders the rows as the click opens the section.
  const opened = vi.fn(() => {
    shelf.querySelector("button").setAttribute("aria-expanded", "true")
    shelf.insertAdjacentHTML("beforeend", `<div data-scrollable>${row("telemetry.dev", "T0", "working")}</div>`)
  })
  shelf.querySelector("button").addEventListener("click", opened)

  layout(true, true)
  layout(true, true)

  expect(opened).toHaveBeenCalledOnce()
  expect(shown(`${LIST}, [data-slot="sidebar-inbox-working"]`)).toEqual([
    "T0 telemetry.dev",
    "T1 -",
    "T2 -",
    "R1 -",
  ])
})

// Catches a stuck layout: with grouping and working rows in the list off, the app's own sections come back.
test("gives the app back its sections when both options are off", () => {
  render({
    recent: [
      ["roadmap-sync", "R1"],
      ["roadmap-sync", "R2"],
    ],
    working: [["roadmap-sync", "R0", "working"]],
  })

  layout(true, true)
  layout(false, false)

  const marked = document.querySelectorAll("[data-plus-join], [data-plus-inline], [data-plus-group], [data-plus-member]")
  expect(marked.length).toBe(0)
  expect(Array.from(document.querySelectorAll("[style]"), (element) => element.getAttribute("style"))).toEqual([])
})

// Catches a stale button: when a project drops to one session, it has no heading, so its + button must go.
test("keeps a + button on each current group heading only", () => {
  render({
    recent: [
      ["roadmap-sync", "R1"],
      ["roadmap-sync", "R2"],
      ["telemetry.dev", "T1"],
      ["telemetry.dev", "T2"],
    ],
  })
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
    title(element.parentElement),
    element.getAttribute("data-plus-add"),
  ])
  expect(buttons).toEqual([["R1", "roadmap-sync"]])
})

// Catches a click that also opens the session below the button: the button sits inside that session's row.
test("a click on the + button starts a session without opening the row", () => {
  render({ recent: [["roadmap-sync", "R1"]] })
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

// Catches an item in the wrong menu, for the wrong project, or added again on each pass: only the context menu of a
// session row gets the item, first, once. A row with a menu open has `data-expanded`.
test("puts one item first in the context menu of a session row only", () => {
  render({
    recent: [
      ["roadmap-sync", "R1"],
      ["telemetry.dev", "T1"],
    ],
  })
  titled("T1").setAttribute("data-expanded", "")
  const content = (id, items) =>
    `<div data-component="menu-v2-content" role="menu" id="${id}">` +
    items.map((label) => `<div role="menuitem" data-component="menu-v2-item">${label}</div>`).join("") +
    `</div>`
  document.body.insertAdjacentHTML(
    "beforeend",
    `<button type="button" id="dropdownmenu-cl-2-trigger" data-expanded="">main</button>` +
      content("contextmenu-cl-4-content-cl-9", ["Archive", "Delete…"]) +
      content("dropdownmenu-cl-2-content-cl-3", ["main", "dev"]),
  )
  const create = (name) => {
    const element = document.createElement("div")
    element.textContent = `New session in ${name}`
    return element
  }

  menu(create)
  menu(create)

  const items = Array.from(document.querySelectorAll('[role="menu"]'), (element) =>
    Array.from(element.children, (child) => child.textContent),
  )
  expect(items).toEqual([
    ["New session in telemetry.dev", "Archive", "Delete…"],
    ["main", "dev"],
  ])
})
