// A card on the app's floating surface (OpenCode Desktop 2.2.5), which shows while the pointer rests on an element.

const CARD = "data-plus-card"
const ID = "plus-card"

// On the root while the pointer or focus rests on an element with a card, so the app's tooltip there does not cover the
// card.
const HOVER = "data-plus-card-hover"

// Under 100ms, which reads as at once. The wait keeps a pointer that sweeps across the element from opening the card.
const OPEN = 50

// Time to cross the gap between the element and the card, so the pointer can rest on the card too.
const CLOSE = 100
const GAP = 4

export const css = `
:root[${HOVER}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${CARD}] {
  position: fixed;
  z-index: 1000;
  box-sizing: border-box;
  max-width: calc(100vw - 16px);
  border-radius: 8px;
  background: var(--v2-background-bg-layer-01);
  box-shadow: var(--v2-elevation-floating);
  font-size: 13px;
  font-weight: 440;
  line-height: var(--line-height-compact);
  letter-spacing: -0.04px;
  color: var(--v2-text-text-muted);
  -webkit-font-smoothing: antialiased;
  animation: plus-card-in 120ms ease-out;
}
@keyframes plus-card-in {
  from {
    opacity: 0;
    scale: 0.96;
  }
}
@media (prefers-reduced-motion: reduce) {
  [${CARD}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${CARD}] {
  animation: none;
}
`

// Shows a card at each element that matches `selector` while the pointer rests on it or it has keyboard focus, until
// the pointer leaves both. A click or Escape closes the card until the pointer leaves the element.
// `fill(card, element, close)` renders the card's content, and can return its cleanup. The start edges of the card and
// the element line up, or their end edges when `align` is "end". Returns the cleanup.
export function listen(selector, fill, align = "start") {
  // The element the pointer or focus rests on, kept after a click or Escape hides the card.
  let anchor
  let shown
  let timer = 0

  const root = document.documentElement
  const wait = (run, ms) => {
    clearTimeout(timer)
    timer = setTimeout(run, ms)
  }
  const target = (event) => (event.target instanceof Element ? event.target.closest(selector) : null)
  const zone = (node) => node instanceof Node && !!(anchor?.contains(node) || shown?.card.contains(node))

  const show = () => {
    if (!anchor.isConnected) return

    const card = document.createElement("div")
    const theme = anchor.closest("[data-theme]")?.getAttribute("data-theme")

    card.id = ID
    card.setAttribute(CARD, "")
    card.setAttribute("role", "tooltip")
    // The card lives at the end of the page, outside the themed part.
    if (theme) card.setAttribute("data-theme", theme)
    shown = { card, stop: fill(card, anchor, hide) }
    document.body.append(card)
    place(card, anchor, align === "end")
    anchor.setAttribute("aria-describedby", ID)
  }

  const hide = () => {
    clearTimeout(timer)
    shown?.stop?.()
    shown?.card.remove()
    shown = undefined
    anchor?.removeAttribute("aria-describedby")
  }

  const enter = (element) => {
    if (element === anchor) {
      // Back from the gap or the card.
      if (shown) clearTimeout(timer)
      return
    }

    leave()
    anchor = element
    root.setAttribute(HOVER, "")
    wait(show, OPEN)
  }

  const leave = () => {
    hide()
    anchor = undefined
    root.removeAttribute(HOVER)
  }

  const over = (event) => {
    if (event.pointerType === "touch") return

    const element = target(event)

    if (element) return enter(element)
    if (shown?.card.contains(event.target)) return clearTimeout(timer)
    // The app drew the element again under the pointer.
    if (anchor && !anchor.isConnected) leave()
  }

  const out = (event) => {
    if (!anchor || zone(event.relatedTarget) || !zone(event.target)) return
    if (shown) wait(leave, CLOSE)
    else leave()
  }

  const press = (event) => {
    if (anchor?.contains(event.target)) hide()
  }

  const key = (event) => {
    if (event.key === "Escape") hide()
  }

  const focus = (event) => {
    const element = target(event)

    if (element?.matches(":focus-visible")) enter(element)
  }

  const blur = (event) => {
    if (anchor?.contains(event.target) && !zone(event.relatedTarget)) leave()
  }

  document.addEventListener("pointerover", over)
  document.addEventListener("pointerout", out)
  document.addEventListener("pointerdown", press, true)
  document.addEventListener("keydown", key)
  document.addEventListener("focusin", focus)
  document.addEventListener("focusout", blur)

  return () => {
    document.removeEventListener("pointerover", over)
    document.removeEventListener("pointerout", out)
    document.removeEventListener("pointerdown", press, true)
    document.removeEventListener("keydown", key)
    document.removeEventListener("focusin", focus)
    document.removeEventListener("focusout", blur)
    leave()
  }
}

// Under the element like the app's menus, or over it when the window has no room under it, and 8px inside the window.
// With `end`, the end edges of the two line up, else their start edges.
const place = (card, element, end) => {
  const anchor = element.getBoundingClientRect()
  const { offsetWidth: width, offsetHeight: height } = card
  const right = end !== (getComputedStyle(element).direction === "rtl")
  const over = anchor.bottom + GAP + height > innerHeight - 8

  card.style.top = `${over ? anchor.top - GAP - height : anchor.bottom + GAP}px`
  card.style.left = `${Math.max(8, Math.min(right ? anchor.right - width : anchor.left, innerWidth - width - 8))}px`
  card.style.transformOrigin = `${over ? "bottom" : "top"} ${right ? "right" : "left"}`
}
