import { mark } from "./dom.js"

// The session sidebar has no plugin API, so this works on its markup (OpenCode Desktop 2.2.6, the Inbox layout). A row
// `[data-slot="sidebar-inbox-item"]` has two lines: the project's badge and the session's title, then the project's
// name, its worktree and branch icons, and the status and time. The scrolling list holds the open session when no
// section shows it, the Needs attention, Unread, and Recent sections, then the Archived button. Working rows sit in
// their own section below the list, behind a toggle button. Each section is a `role="group"` that holds its heading,
// then a div with its rows; the id of the heading ends in the section's name.

const INBOX = '[data-slot="sidebar-inbox"]'
const SCROLL = '[data-slot="sidebar-inbox-scroll"]'
const WORKING = '[data-slot="sidebar-inbox-working"]'
export const ROW = '[data-slot="sidebar-inbox-item"]'

const section = (name) => `[role="group"][aria-labelledby$="-${name}"]`
const NEEDS = section("needs")
// The Unread and Recent sections, whose rows the plugin puts in one list.
const FINISHED = `:is(${section("unread")}, ${section("recent")})`

const TITLE = ":scope > span:first-child > span[dir]"
const NAME = ":scope > span:nth-of-type(2) > span:first-of-type > span[dir]"

// On the sidebar while the Unread and Recent rows form one list, and while working rows join it.
const JOIN = "data-plus-join"
const INLINE = "data-plus-inline"

const GROUP = "data-plus-group"
const GAP = "data-plus-gap"
const MEMBER = "data-plus-member"

// A group heading's + button. It sits in the group's first row, so hovering it must not count as hovering the row.
const ADD = "data-plus-add"

// The item that `menu` adds to the context menu of a row.
const ITEM = "data-plus-item"

// Rows that recede: finished and already seen (`ready`), and not open, hovered, or focused. Unseen results (`done`,
// `failed`) stay bright until opened.
const DIM = `${INBOX} ${ROW}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${ADD}]:hover)), :focus-visible)`

// In one list, the rows of the Unread and Recent sections become rows of the scrolling list, so `order` can place them,
// and the Show more and Archived buttons follow them. With working rows in the list, the scrolling list and the Working
// section dissolve into the sidebar, which scrolls instead.
export const css = `
${INBOX}[${JOIN}] ${FINISHED},
${INBOX}[${JOIN}] ${FINISHED} > div:not([id]) {
  display: contents;
}
${INBOX}[${JOIN}] ${FINISHED} > div[id] {
  display: none;
}
${INBOX}[${JOIN}] ${FINISHED} > button {
  order: 100000;
}
${INBOX}[${JOIN}] ${SCROLL} > div.pt-3 {
  order: 100001;
}
${INBOX}[${INLINE}] {
  overflow-y: auto;
  gap: 2px;
  padding-bottom: 4px;
}
[${INLINE}] > ${SCROLL},
[${INLINE}] > ${WORKING},
[${INLINE}] > ${WORKING} > div {
  display: contents;
}
[${INLINE}] > ${WORKING} > :not(div) {
  display: none;
}
/* T3 Code's Working color: sky-600, or sky-300 at 80% in dark mode. */
${INBOX} {
  --plus-working: oklch(58.8% 0.158 241.966);
}
[data-color-scheme="dark"] ${INBOX} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
}
${INBOX} ${ROW}[data-status="working"] > span:nth-of-type(2) > span:last-of-type > * {
  color: var(--plus-working);
}
${INBOX} ${ROW} > span,
${INBOX} ${ROW} > span > * {
  transition: opacity 150ms;
}
${DIM}:not([${MEMBER}]) > span,
${DIM}[${MEMBER}] > span:first-child > span[dir],
${DIM}[${MEMBER}] > span:nth-of-type(2) {
  opacity: 0.6;
}
/* In a project group the heading names the project, so a row drops the project's badge and name, and shows its title
   on one line with the worktree icon, the status, and the time at its end. The branch icon goes too: every session in
   a repository has one, and it names the branch only in its tooltip. */
${ROW}[${MEMBER}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  align-items: center;
  column-gap: 8px;
  height: auto;
}
${ROW}[${MEMBER}] > span:first-child,
${ROW}[${MEMBER}] > span:nth-of-type(2) > span:first-of-type {
  display: contents;
}
${ROW}[${MEMBER}]:not([${GROUP}]) > span:first-child > span:first-child,
${ROW}[${MEMBER}] > span:nth-of-type(2) > span:first-of-type > span[dir],
${ROW}[${MEMBER}] > span:nth-of-type(2) > span:first-of-type > div:has(use[href$="-branch"]),
${ROW}[${MEMBER}] > span:nth-of-type(2) > div {
  display: none;
}
${ROW}[${MEMBER}] > span:first-child > span[dir] {
  grid-area: title;
}
${ROW}[${MEMBER}] > span:nth-of-type(2) {
  grid-area: status;
  width: auto;
  padding-inline-start: 0;
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
  padding-inline: 32px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-v2-text-text-muted);
  pointer-events: none;
}
/* The heading's project badge is the group's first row's own, moved up before the name. It lines up with the badges
   of single-session rows: 8px in, centered on the heading's 24px line. */
${ROW}[${GROUP}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 8px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${ROW}[${GROUP}] > [${ADD}] {
  position: absolute;
  inset-inline-end: 6px;
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

// The session's title, as its row shows it.
export const title = (row) => row.querySelector(TITLE)?.textContent.trim()

// The name of the session's project, as its row shows it.
export const project = (row) => row.querySelector(NAME)?.textContent.trim()

// Groups the rows of each section by project when `grouped`. The Unread and Recent rows then form one list, and with
// `inline`, working rows join it instead of their own section.
export function layout(grouped, inline) {
  document.querySelectorAll(INBOX).forEach((inbox) => {
    const rows = (selector) => Array.from(inbox.querySelectorAll(`${selector} > div > ${ROW}`))
    const finished = rows(FINISHED)
    const needs = rows(NEEDS)
    const working = rows(WORKING)

    mark(inbox, JOIN, grouped || inline ? "" : undefined)
    mark(inbox, INLINE, inline ? "" : undefined)
    // A collapsed Working section renders no rows.
    if (inline) inbox.querySelector(`:scope > ${WORKING} > button[aria-expanded="false"]`)?.click()

    arrange(finished, grouped, inline ? working : [])
    arrange(needs, grouped)
    if (!inline) arrange(working, grouped)

    // The open session, when no section shows it.
    const placed = new Set([...finished, ...needs, ...working])
    inbox.querySelectorAll(ROW).forEach((row) => placed.has(row) || ungroup(row))
  })
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

const ungroup = (row) => {
  row.style.removeProperty("order")
  if (row.style.length === 0) row.removeAttribute("style")
  row.removeAttribute(GROUP)
  row.removeAttribute(GAP)
  row.removeAttribute(MEMBER)
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

// A + button for the heading of project `name`. `icon` fills in its icon.
export function button({ name, label, icon, onSelect }) {
  const element = document.createElement("div")

  element.setAttribute(ADD, name)
  element.setAttribute("role", "button")
  element.setAttribute("aria-label", label)
  element.setAttribute("title", label)
  icon(element)
  control(element, onSelect)

  return element
}

// Makes `element`, which sits inside a session row, run `onSelect` when it is clicked, or pressed with Enter or Space.
// The row is a button that opens its session, so the click and keys stop at `element`.
export function control(element, onSelect) {
  const run = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect()
  }

  element.setAttribute("tabindex", "0")
  element.addEventListener("pointerdown", (event) => event.stopPropagation())
  element.addEventListener("click", run)
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") run(event)
  })
}

// Puts an item, made by `create` for the project's name, first in the context menu of the row whose menu is open. The
// menu is the app's own, in a portal. Kobalte marks the row of an open context menu with `data-expanded`, and gives the
// menu an id that starts with `contextmenu-`.
export function menu(create) {
  const row = document.querySelector(`${INBOX} ${ROW}[data-expanded]`)

  if (!row) return

  document.querySelectorAll('[data-component="menu-v2-content"][id^="contextmenu-"]').forEach((content) => {
    if (content.querySelector(`:scope > [${ITEM}]`)) return
    const item = create(project(row))
    item.setAttribute(ITEM, "")
    content.prepend(item)
  })
}

// Removes every change the sidebar functions made, as when the plugin stops.
export function clean() {
  layout(false, false)
  document.querySelectorAll(`[${ADD}], [${ITEM}]`).forEach((element) => element.remove())
}
