import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { listen } from "../src/links.js"

const HREF = "https://example.com/docs"

// A link in an answer, as the app renders Markdown (OpenCode Desktop 2.2.5, marked-base.tsx and markdown.tsx), with
// the favicon in front of the text.
const link = (href = HREF) =>
  `<a href="${href}" class="external-link" target="_blank" rel="noopener noreferrer">` +
  `<span class="markdown-link-favicon" aria-hidden="true"></span><span>docs</span></a>`

const click = (keys = {}) => {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...keys })
  document.querySelector("a span:last-child").dispatchEvent(event)
  return event
}

let open
let cleanups

beforeEach(() => {
  open = vi.fn(() => true)
  cleanups = []
})

afterEach(() => {
  cleanups.forEach((cleanup) => cleanup())
  document.body.innerHTML = ""
})

const start = () => cleanups.push(listen(open))

// Stands in for the app's click handlers, which Solid runs from a listener on the document that it adds first.
const app = (handler) => {
  document.addEventListener("click", handler)
  cleanups.push(() => document.removeEventListener("click", handler))
}

// Catches a ⌘-click taken from the system browser, or a plain click that opens the link in the pane and in the system
// browser.
test.each([
  [{}, true],
  [{ metaKey: true }, false],
  [{ ctrlKey: true }, false],
  [{ shiftKey: true }, false],
  [{ altKey: true }, false],
])("click with %o opens in the pane: %s", (keys, want) => {
  document.body.innerHTML = `<p>See ${link()}.</p>`
  start()

  const event = click(keys)

  expect(open.mock.calls).toEqual(want ? [[HREF]] : [])
  expect(event.defaultPrevented).toBe(want)
})

// Catches a click that does nothing while the pane cannot open the link: the system browser must open it.
test("keeps the system browser when the pane cannot open the link", () => {
  open = vi.fn(() => false)
  document.body.innerHTML = link()
  start()

  expect(click().defaultPrevented).toBe(false)
})

// Catches a mail link sent to the pane, or a link in Settings that opens behind the dialog.
test.each([
  ["a mail link", link("mailto:someone@example.com")],
  ["a link in a dialog", `<div role="dialog">${link()}</div>`],
])("does not take %s", (_, html) => {
  document.body.innerHTML = html
  start()

  expect(click().defaultPrevented).toBe(false)
  expect(open).not.toHaveBeenCalled()
})

// Catches a listener on the capture phase, which opens a link again that the app opens itself (the Sources panel), or
// on the window, which a link that stops the event (the URL of a webfetch tool) never reaches.
test.each([
  ["opens the link itself", (event) => event.preventDefault(), []],
  ["stops the event", (event) => event.stopPropagation(), [[HREF]]],
])("when the app's handler %s", (_, handler, want) => {
  document.body.innerHTML = link()
  app(handler)
  start()

  click()

  expect(open.mock.calls).toEqual(want)
})
