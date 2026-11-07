import { createComponent, createSignal } from "solid-js"
import { render } from "solid-js/web"

// The text of each message that the user sent ends with the trigger of its menu: a chevron at the top end of the
// bubble, which shows while the pointer rests on the text (OpenCode Desktop 2.2.6). The menu holds Copy, Fork, and
// Revert. Each answer from the agent has its own Copy button, so each message with text gets one too, before the
// chevron.

const MESSAGE = '[data-component="user-message"]'
const TEXT = '[data-slot="user-message-text"]'
const MENU = `${MESSAGE} ${TEXT} > [data-slot="user-message-menu"]`
const COPY = "data-plus-copy"

// The app's small icons are 14px, and the plugin API's icon button draws 16px. Without hover the chevron always shows,
// and the first line of the text keeps 20px of room for it. The Copy button needs 20px more.
export const css = `
[${COPY}] {
  display: contents;
}
[${COPY}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
@media not (hover: hover) {
  ${TEXT}:has(> [data-slot="user-message-menu"] > [${COPY}])::before {
    width: 40px;
  }
}
`

// Each Copy button's host element, with the dispose of what renders in it.
const roots = new Map()

// Puts a Copy button before the menu's chevron of each message that has text. `fill` renders the button into the
// element it gets and returns its dispose.
export function copy(fill) {
  roots.forEach((dispose, element) => {
    if (element.isConnected) return
    dispose()
    element.remove()
    roots.delete(element)
  })

  document.querySelectorAll(MENU).forEach((menu) => {
    if (menu.querySelector(`:scope > [${COPY}]`)) return

    const element = document.createElement("span")
    element.setAttribute(COPY, "")
    // As with the app's own message buttons, a click leaves the focus where it was, such as in the chat input.
    element.addEventListener("mousedown", (event) => event.preventDefault())
    roots.set(element, fill(element))
    menu.prepend(element)
  })
}

// Fills `parent` with a Copy button for the message it sits in, like the one under each answer: for 2 seconds after a
// copy, its icon is a check and its label is `copied`. `ui` is the app's components; `write` copies text and resolves
// to whether it did.
export const button =
  ({ ui, label, copied, write }) =>
  (parent) =>
    render(() => {
      const [done, setDone] = createSignal(false)
      const name = () => (done() ? copied : label)

      const run = async (event) => {
        event.stopPropagation()

        if (!(await write(text(parent.closest(MESSAGE))))) return
        setDone(true)
        setTimeout(() => setDone(false), 2000)
      }

      return createComponent(ui.Tooltip, {
        get value() {
          return name()
        },
        get children() {
          return createComponent(ui.IconButton, {
            get icon() {
              return done() ? "check" : "outline-copy"
            },
            get label() {
              return name()
            },
            size: "small",
            onClick: run,
          })
        },
      })
    }, parent)

// The text the bubble shows, which is what the menu's Copy copies. A folded message keeps all of its text in the page.
// The bubble shows a session reference as the session's title, so each one gets back the text it stands for.
const text = (message) => {
  const shown = message.querySelector(TEXT).cloneNode(true)

  shown
    .querySelectorAll(
      '[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"], [data-slot="user-message-menu"]',
    )
    .forEach((element) => element.remove())
  shown
    .querySelectorAll("[data-session-reference]")
    .forEach((element) => element.replaceWith(element.dataset.sessionReference))

  return shown.textContent
}

// Removes every Copy button, as when the plugin stops.
export function clean() {
  roots.forEach((dispose, element) => {
    dispose()
    element.remove()
  })
  roots.clear()
}
