import { mark, set } from "./dom.js"

// The chat input's controls bar holds the agent dropdown, the model button, then the reasoning dropdown, each in a
// tooltip wrapper (OpenCode Desktop 2.2.5). The reasoning dropdown's menu opens elsewhere in the page, named by its
// trigger's `aria-controls`.

const CONTROLS = '[data-slot="composer-controls"]'
const TIP = `${CONTROLS} > div > [data-component="tooltip-v2-trigger"]`
const MODEL = '[data-action="composer-model"]'
const AGENT = `${TIP}:has(~ [data-component="tooltip-v2-trigger"] ${MODEL})`
const VARIANT = `${TIP}:has(${MODEL}) ~ [data-component="tooltip-v2-trigger"]`

const HIDDEN = "data-plus-hidden-agent"
const MENU = "data-plus-variant-menu"

// The app writes reasoning levels in lowercase and capitalizes them with CSS.
export function css({ lowercaseVariants }) {
  return `
${AGENT}[${HIDDEN}] {
  display: none;
}
${
  lowercaseVariants
    ? `${VARIANT} .capitalize,
[${MENU}] .capitalize {
  text-transform: lowercase;
}`
    : ""
}
`
}

// Hides the agent dropdown while it shows `hiddenAgent`, so it comes back if another agent is chosen, and marks the
// open reasoning menu.
export function compose(hiddenAgent) {
  document.querySelectorAll(AGENT).forEach((agent) => {
    const hide = hiddenAgent !== false && agent.textContent.trim().toLowerCase() === hiddenAgent.toLowerCase()

    mark(agent, HIDDEN, hide ? "" : undefined)
  })

  document.querySelectorAll(`${VARIANT} [aria-controls]`).forEach((trigger) => {
    const menu = document.getElementById(trigger.getAttribute("aria-controls"))

    if (menu) set(menu, MENU, "")
  })
}

// The app swaps a control's label text in place, which a child-list observer does not report. Has `observer` watch the
// text of each controls bar once.
const watched = new WeakSet()

export function observe(observer) {
  document.querySelectorAll(CONTROLS).forEach((controls) => {
    if (watched.has(controls)) return
    watched.add(controls)
    observer.observe(controls, { subtree: true, characterData: true })
  })
}

// Removes every change `compose` made, as when the plugin stops.
export function clean() {
  document.querySelectorAll(`[${HIDDEN}]`).forEach((agent) => agent.removeAttribute(HIDDEN))
  document.querySelectorAll(`[${MENU}]`).forEach((menu) => menu.removeAttribute(MENU))
}
