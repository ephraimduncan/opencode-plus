import { createComponent, createSignal } from "solid-js"
import { render } from "solid-js/web"

// Each message the user sent has a row of actions: Move to queue and Delete while it waits, Revert, then the `⋯` menu,
// which holds Fork and Copy (OpenCode Desktop 2.2.5). The row shows below the bubble, or beside it when the next
// message of a run follows. Each answer from the agent has its own Copy button, so each message gets one too, before
// the menu.

const MESSAGE = '[data-component="user-message"]'
const ACTIONS = `${MESSAGE} [data-slot="user-message-actions"]`
const TEXT = '[data-slot="user-message-text"]'
// The other buttons sit in transition wrappers, so the menu's tooltip is the row's only direct one.
const MENU = '[data-component="tooltip-v2-trigger"]'
const COPY = "data-plus-copy"

// The app's small icons are 14px, and the plugin API's icon button draws 16px.
export const css = `
[${COPY}] {
  display: contents;
}
[${COPY}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
`

// Each Copy button's host element, with the dispose of what renders in it.
const roots = new Map()

// Puts a Copy button before the `⋯` menu of each message that has text. `fill` renders the button into the element it
// gets and returns its dispose.
export function copy(fill) {
  roots.forEach((dispose, element) => {
    if (element.isConnected) return
    dispose()
    element.remove()
    roots.delete(element)
  })

  document.querySelectorAll(ACTIONS).forEach((actions) => {
    const menu = actions.querySelector(`:scope > ${MENU}`)

    if (!menu || actions.querySelector(`:scope > [${COPY}]`) || !actions.closest(MESSAGE).querySelector(TEXT)) return

    const element = document.createElement("span")
    element.setAttribute(COPY, "")
    // As with the app's own message buttons, a click leaves the focus where it was, such as in the chat input.
    element.addEventListener("mousedown", (event) => event.preventDefault())
    roots.set(element, fill(element))
    actions.insertBefore(element, menu)
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
    .querySelectorAll('[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"]')
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
