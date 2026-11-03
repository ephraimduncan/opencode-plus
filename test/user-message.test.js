import { createRenderEffect } from "solid-js"
import { beforeEach, expect, test, vi } from "vitest"
import { button, clean, copy } from "../src/user-message.js"

beforeEach(() => {
  clean()
  document.body.innerHTML = ""
})

// A message as the app renders it (OpenCode Desktop 2.2.5, message-content.tsx): its text, then its actions row with
// the Revert button and the `⋯` menu's trigger.
const message = (text) =>
  `<div data-component="user-message">` +
  (text ? `<div data-slot="user-message-body"><div data-slot="user-message-text" dir="auto">${text}</div></div>` : "") +
  `<div data-slot="user-message-copy-wrapper"><span data-slot="user-message-actions">` +
  `<span data-slot="user-message-transition" data-active="true"><span data-slot="user-message-transition-inner">` +
  `<div data-component="tooltip-v2-trigger"><button aria-label="Revert message"></button></div>` +
  `</span></span>` +
  `<div data-component="tooltip-v2-trigger"><button aria-haspopup="true" aria-label="More actions"></button></div>` +
  `</span></div></div>`

// Stand-ins for the app's components, which only the app provides: a tooltip that shows its child, and a button that
// keeps its accessible name in step with its `label`, as the app's does.
const ui = {
  Tooltip: (props) => props.children,
  IconButton: (props) => {
    const element = document.createElement("button")
    createRenderEffect(() => element.setAttribute("aria-label", props.label))
    element.addEventListener("click", props.onClick)
    return element
  },
}

const fill = (write = async () => true) => button({ ui, label: "Copy message", copied: "Copied", write })

const labels = (actions) => Array.from(actions.querySelectorAll("button"), (element) => element.getAttribute("aria-label"))

// Clicks the Copy button and waits for its copy to finish.
const click = async () => {
  document.querySelector('[aria-label="Copy message"]').click()
  await new Promise((resolve) => setTimeout(resolve))
}

// Catches a button in the wrong place or added again on each pass, which would also wake the page observer forever.
test("puts one Copy button before the menu of each message with text", () => {
  document.body.innerHTML = message("Fix the tests") + message("")

  copy(fill())
  copy(fill())

  const [withText, withoutText] = document.querySelectorAll('[data-slot="user-message-actions"]')
  expect(labels(withText)).toEqual(["Revert message", "Copy message", "More actions"])
  expect(labels(withoutText)).toEqual(["Revert message", "More actions"])
})

// Catches a copy that differs from what was sent: a session's title instead of its reference, the fold's toggle text,
// or the text of an attached comment.
test("copies the text that the message holds", async () => {
  document.body.innerHTML = message(
    `<div id="msg-text" data-slot="user-message-fold" data-folded="" style="max-height: 8lh"><div>` +
      `<span><span data-highlight="file"><span data-slot="user-message-mention-prefix">@</span>src/index.js</span></span>` +
      `<span> compare with </span>` +
      `<span><button class="markdown-session-link" data-session-id="ses_0123456789abcdefghijklmnop" data-session-reference="@session:ses_0123456789abcdefghijklmnop">Sidebar work</button></span>` +
      `<span>\nsee </span><a data-slot="user-message-link" href="https://opencode.ai">https://opencode.ai</a>` +
      `</div></div>` +
      `<button data-slot="user-message-fold-toggle" aria-expanded="false"><span>Read more</span></button>` +
      `<div data-slot="user-message-comments"><div>Rename this</div></div>`,
  )
  const write = vi.fn(async () => true)

  copy(fill(write))
  await click()

  expect(write).toHaveBeenCalledWith(
    "@src/index.js compare with @session:ses_0123456789abcdefghijklmnop\nsee https://opencode.ai",
  )
})

// Catches a check mark after a copy that failed: the person would trust a clipboard that holds something else.
test.each([
  [true, "Copied"],
  [false, "Copy message"],
])("a copy that succeeds %s shows %s", async (copied, want) => {
  document.body.innerHTML = message("Fix the tests")

  copy(fill(async () => copied))
  await click()

  expect(document.querySelector("[data-plus-copy] button").getAttribute("aria-label")).toBe(want)
})
