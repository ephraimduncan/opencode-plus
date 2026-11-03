import { mark, set } from "./dom.js"

// The session sidebar has no plugin API, so this works on its markup (OpenCode Desktop 2.2.5). Rows are
// `[data-slot="sidebar-inbox-item"]`, and each row's first line holds the project's badge, name, and time or status.
// The session list holds the Needs attention section, the finished rows, and the Archived section: its only direct
// child with `pt-3`, headed by its first child. Working rows sit in their own section below the list, behind a toggle
// button.

const INBOX = '[data-slot="sidebar-inbox"]'
const SCROLL = '[data-slot="sidebar-inbox-scroll"]'
const WORKING = '[data-slot="sidebar-inbox-working"]'
const SECTION = `${SCROLL} > div.pt-3`
const ROW = '[data-slot="sidebar-inbox-item"]'

const SHELF = "data-plus-shelf"
const TOGGLE = "data-plus-toggle"
const COUNT = "data-plus-count"
const GROUP = "data-plus-group"
const GAP = "data-plus-gap"
const MEMBER = "data-plus-member"
const INLINE = "data-plus-inline"

// A group heading's + button. It sits in the group's first row, so hovering it must not count as hovering the row.
const ADD = "data-plus-add"

// Rows that recede: finished and already seen (`ready`), and not open, hovered, focused, or archived. Unseen results
// (`done`, `failed`) stay bright until opened.
const DIM = `${INBOX} ${ROW}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${ADD}]:hover)), :focus-visible, [${SHELF}] > *)`

// The app's chevron-down icon.
const chevron =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>'

// With working rows in the list, the session list and the Working section dissolve into the sidebar, which scrolls
// instead, so `order` can place working rows among the finished ones.
export const css = `
${SECTION} {
  order: 100000;
  margin-top: auto;
}
${INBOX}[${INLINE}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${INLINE}] > ${SCROLL},
[${INLINE}] > ${WORKING},
[${INLINE}] > ${WORKING} > div {
  display: contents;
}
[${INLINE}] > ${WORKING} > button {
  display: none;
}
[${SHELF}] > [${TOGGLE}] {
  border-radius: 6px;
}
[${SHELF}] > [${TOGGLE}]:hover {
  color: var(--color-v2-text-text-base);
}
[${SHELF}] > [${TOGGLE}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${SHELF}] > [${TOGGLE}]::before {
  content: attr(${COUNT});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${SHELF}] > [${TOGGLE}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(chevron)}") center / 16px no-repeat;
}
[${SHELF}="closed"] > [${TOGGLE}]::after {
  rotate: -90deg;
}
[${SHELF}="closed"] > [${TOGGLE}]:dir(rtl)::after {
  rotate: 90deg;
}
[${SHELF}="closed"] > ${ROW}:not([data-state="active"]) {
  display: none;
}
${INBOX} ${ROW}[data-status="working"] {
  opacity: 1;
}
${INBOX} ${ROW}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${INBOX} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${INBOX} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${INBOX} ${ROW}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${INBOX} ${ROW}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${INBOX} ${ROW}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${INBOX} ${ROW}[data-status="working"] > span:first-child > span:last-child::before {
  content: "";
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background-color: var(--plus-working-dot);
  animation: plus-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes plus-pulse {
  50% {
    opacity: 0.5;
  }
}
@media (prefers-reduced-motion: reduce) {
  ${INBOX} ${ROW}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${INBOX} ${ROW} > span,
${INBOX} ${ROW} > span:first-child > span {
  transition: opacity 150ms;
}
${DIM}:not([${MEMBER}]) > span,
${DIM}[${MEMBER}] > span:not(:first-child),
${DIM}[${MEMBER}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${ROW}[${MEMBER}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${ROW}[${MEMBER}] > span:first-child {
  display: contents;
}
${ROW}[${MEMBER}] > span:first-child > span:not(:last-child) {
  display: none;
}
${ROW}[${MEMBER}] > span:first-child > span:last-child {
  grid-area: status;
}
${ROW}[${MEMBER}] > span:nth-of-type(2) {
  grid-area: title;
}
${ROW}[${MEMBER}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${ROW}[${GAP}] {
  margin-top: 16px;
}
${ROW}[${GROUP}] {
  position: relative;
  margin-top: 28px;
}
${ROW}[${GROUP}][${GAP}] {
  margin-top: 44px;
}
${ROW}[${GROUP}]::before {
  content: attr(${GROUP});
  position: absolute;
  inset-inline: 0;
  bottom: 100%;
  margin-bottom: 4px;
  padding-inline: 28px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-v2-text-text-muted);
  pointer-events: none;
}
/* The heading's project badge is the group's first row's own, moved up before the name. It lines up with the badges
   of single-session rows: 6px in, centered on the heading's 24px line. */
${ROW}[${GROUP}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${ROW}[${GROUP}] > [${ADD}] {
  position: absolute;
  inset-inline-end: 4px;
  bottom: calc(100% + 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: var(--color-v2-text-text-faint);
}
${ROW}[${GROUP}] > [${ADD}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${ROW}[${GROUP}]:not([data-state="active"]):has(> [${ADD}]:hover) {
  background-color: transparent;
}
`

const rows = (list) => (list ? Array.from(list.children).filter((child) => child.matches(ROW)) : [])

const project = (row) => row.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim()

const ungroup = (row) => {
  row.style.removeProperty("order")
  if (row.style.length === 0) row.removeAttribute("style")
  row.removeAttribute(GROUP)
  row.removeAttribute(GAP)
  row.removeAttribute(MEMBER)
}

// Marks up the Archived section as a collapsible shelf.
export function shelve(open) {
  const state = open ? "open" : "closed"

  document.querySelectorAll(SECTION).forEach((section) => {
    const header = section.firstElementChild

    if (!header || header.matches(ROW)) return

    set(section, SHELF, state)
    set(header, TOGGLE, "")
    set(header, COUNT, String(rows(section).length))
    set(header, "role", "button")
    set(header, "tabindex", "0")
    set(header, "aria-expanded", String(open))
  })
}

// Runs `toggle` when the Archived heading is clicked, or pressed with Enter or Space. Returns the cleanup.
export function listen(toggle) {
  const header = (event) =>
    event.target instanceof Element ? event.target.closest(`${SECTION} > [${TOGGLE}]`) : null

  const click = (event) => {
    if (header(event)) toggle()
  }

  const key = (event) => {
    if ((event.key !== "Enter" && event.key !== " ") || !header(event)) return
    event.preventDefault()
    toggle()
  }

  document.addEventListener("click", click)
  document.addEventListener("keydown", key)

  return () => {
    document.removeEventListener("click", click)
    document.removeEventListener("keydown", key)
  }
}

// Orders rows by project, most recently active project first, with the same space before each project. A project with
// more than one session gets a heading; a project's only session keeps the app's row, which names the project. Working
// rows lead: their projects come first, and they come first within their project.
const arrange = (finished, grouped, working = []) => {
  const all = [...working, ...finished]

  if (!grouped && working.length === 0) return all.forEach(ungroup)

  // Rows keyed by project; a row without one is its own unit.
  const units = new Map()

  all.forEach((row) => {
    const key = (grouped && project(row)) || row

    units.set(key, [...(units.get(key) ?? []), row])
  })

  let order = 0

  Array.from(units).forEach(([key, list], unit) => {
    const group = grouped && typeof key === "string" && list.length > 1

    list.forEach((row, index) => {
      order += 1

      if (row.style.order !== String(order)) row.style.order = String(order)

      mark(row, GROUP, group && index === 0 ? key : undefined)
      mark(row, MEMBER, group ? "" : undefined)
      mark(row, GAP, grouped && unit > 0 && index === 0 ? "" : undefined)
    })
  })
}

// Groups each list by project when `grouped`, and with `inline`, shows working sessions in the session list instead
// of in their own section.
export function layout(grouped, inline) {
  document.querySelectorAll(INBOX).forEach((inbox) => {
    const scroll = inbox.querySelector(`:scope > ${SCROLL}`)
    const working = inbox.querySelector(`:scope > ${WORKING} > div`)
    const merged = new Set()

    if (inline) {
      set(inbox, INLINE, "")
      // A collapsed Working section renders only the open session.
      inbox.querySelector(`:scope > ${WORKING} > button[aria-expanded="false"]`)?.click()
      arrange(rows(scroll), grouped, rows(working))
      merged.add(scroll).add(working)
    } else {
      inbox.removeAttribute(INLINE)
    }

    new Set(Array.from(inbox.querySelectorAll(ROW), (row) => row.parentElement)).forEach((list) => {
      if (merged.has(list)) return

      // A collapsed Archived section shows only the open session.
      const closed = list.getAttribute(SHELF) === "closed"
      const shown = rows(list).filter((row) => !closed || row.getAttribute("data-state") === "active")

      rows(list)
        .filter((row) => !shown.includes(row))
        .forEach(ungroup)
      arrange(shown, grouped)
    })
  })
}

// Gives each group heading a + button, made by `create` for the project's name. The button lives in the group's first
// row, which changes as sessions come and go, so it moves with the heading.
export function plus(create) {
  document.querySelectorAll(`${ROW} > [${ADD}]`).forEach((button) => {
    if (button.parentElement.getAttribute(GROUP) !== button.getAttribute(ADD)) button.remove()
  })

  document.querySelectorAll(`${ROW}[${GROUP}]`).forEach((row) => {
    if (!row.querySelector(`:scope > [${ADD}]`)) row.append(create(row.getAttribute(GROUP)))
  })
}

// A + button for the heading of project `name`. It sits inside the group's first row, so it keeps clicks and keys
// from reaching that row. `icon` fills in its icon.
export function button({ name, label, icon, onSelect }) {
  const element = document.createElement("div")
  const run = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect()
  }

  element.setAttribute(ADD, name)
  element.setAttribute("role", "button")
  element.setAttribute("tabindex", "0")
  element.setAttribute("aria-label", label)
  element.setAttribute("title", label)
  icon(element)
  element.addEventListener("pointerdown", (event) => event.stopPropagation())
  element.addEventListener("click", run)
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") run(event)
  })

  return element
}

// Removes every change the sidebar functions made, as when the plugin stops.
export function clean() {
  layout(false, false)
  document.querySelectorAll(`[${ADD}]`).forEach((element) => element.remove())
  document.querySelectorAll(`[${SHELF}]`).forEach((section) => section.removeAttribute(SHELF))
  document.querySelectorAll(`[${TOGGLE}]`).forEach((header) => {
    ;[TOGGLE, COUNT, "role", "tabindex", "aria-expanded"].forEach((name) => header.removeAttribute(name))
  })
}
