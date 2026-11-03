import { lastAssistantWithUsage } from "@opencode/client/solid"

// The session header's usage button: the ring, the token count and the cost, which toggles the Context panel (OpenCode
// Desktop 2.2.5, the app's `context` plugin). On hover it shows only a tooltip. A narrow header shows the ring alone as
// a menu button that opens the app's own usage summary; it has `aria-haspopup`, so it keeps its behavior.
const BUTTON =
  '[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])'

const CARD = "data-plus-usage"
const ID = "plus-usage-card"

// On the root while the pointer or focus rests on the button, so the app's tooltip there does not cover the card.
const HOVER = "data-plus-usage-hover"

// Under 100ms, which reads as at once. The wait keeps a pointer that sweeps across the header from opening the card.
const OPEN = 50

// Time to cross the gap between the button and the card, so the pointer can rest on the card too.
const CLOSE = 100
const GAP = 4

// Like Cursor's context window card, on the app's floating surface (OpenCode Desktop 2.2.5): a heading with the
// window's use, a bar of the step's tokens by kind on the track of the app's usage meters, a legend, then the cost.
export const css = `
:root[${HOVER}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${CARD}] {
  position: fixed;
  z-index: 1000;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 280px;
  max-width: calc(100vw - 16px);
  padding: 12px;
  border-radius: 8px;
  background: var(--v2-background-bg-layer-01);
  box-shadow: var(--v2-elevation-floating);
  font-size: 13px;
  font-weight: 440;
  line-height: var(--line-height-compact);
  letter-spacing: -0.04px;
  font-variant-numeric: tabular-nums;
  color: var(--v2-text-text-muted);
  -webkit-font-smoothing: antialiased;
  transform-origin: top right;
  animation: plus-usage-in 120ms ease-out;
}
[${CARD}]:dir(rtl) {
  transform-origin: top left;
}
[${CARD}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${CARD}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${CARD}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${CARD}] [data-part="percent"] {
  font-weight: 530;
}
[${CARD}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${CARD}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${CARD}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${CARD}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${CARD}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${CARD}] hr {
  height: 1px;
  margin: 0 -12px;
  border: none;
  background: var(--v2-border-border-muted);
}
@keyframes plus-usage-in {
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

// Shows a card under the usage button while the pointer rests on it or it has keyboard focus, until the pointer leaves
// both. A click or Escape closes the card until the pointer leaves the button. `fill` renders the card's content and
// returns its cleanup. Returns the cleanup.
export function listen(fill) {
  // The button the pointer or focus rests on, kept after a click or Escape hides the card.
  let anchor
  let shown
  let timer = 0

  const root = document.documentElement
  const wait = (run, ms) => {
    clearTimeout(timer)
    timer = setTimeout(run, ms)
  }
  const target = (event) => (event.target instanceof Element ? event.target.closest(BUTTON) : null)
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
    shown = { card, stop: fill(card) }
    document.body.append(card)
    place(card, anchor)
    anchor.setAttribute("aria-describedby", ID)
  }

  const hide = () => {
    clearTimeout(timer)
    shown?.stop()
    shown?.card.remove()
    shown = undefined
    anchor?.removeAttribute("aria-describedby")
  }

  const enter = (button) => {
    if (button === anchor) {
      // Back from the gap or the card.
      if (shown) clearTimeout(timer)
      return
    }

    leave()
    anchor = button
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

    const button = target(event)

    if (button) return enter(button)
    if (shown?.card.contains(event.target)) return clearTimeout(timer)
    // The app drew the header again under the pointer.
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
    const button = target(event)

    if (button?.matches(":focus-visible")) enter(button)
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

// What the usage button counts, worked out as the app does: the tokens of the step that fills the context window now,
// their share of the model's context limit, and the session's cost. The cost is undefined where the button shows none:
// for a free model, until the session costs something. Reactive.
export function stats(session) {
  const data = session.server.data
  const ref = session.directory ? { directory: session.directory } : undefined
  const info = data.session.get(session.id)
  const messages = data.session.message.list(session.id)
  const step = lastAssistantWithUsage(messages, info?.revert?.messageID)
  const tokens = step?.tokens
  const total = tokens ? tokens.input + tokens.output + tokens.reasoning + tokens.cache.read + tokens.cache.write : 0
  const limit = step ? model(data, ref, step.model)?.limit.context : undefined
  const cost = data.session.cost(session.id)
  const current = info?.model ?? messages.findLast((message) => message.type === "assistant")?.model
  const priced = current ? model(data, ref, current) : undefined
  const free =
    !!priced &&
    priced.cost.every((rate) => !rate.input && !rate.output && !rate.cache.read && !rate.cache.write)

  return {
    total,
    tokens,
    limit: limit || undefined,
    percent: limit ? Math.round((total / limit) * 100) : undefined,
    cost: cost > 0 || !free ? cost : undefined,
  }
}

// The card's content for `stats`: the heading, the bar and its legend, then the cost. `t` translates the plugin's
// messages.
export function render({ total, tokens, limit, percent, cost }, t, locale) {
  const short = (value) =>
    new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 0 })
      .format(value)
      .toLocaleLowerCase(locale)
  const kinds = tokens ? KINDS.map((kind) => ({ ...kind, value: kind.value(tokens) })).filter((kind) => kind.value > 0) : []
  // The whole bar is the model's context window, or the step's tokens when the limit is not known.
  const scale = Math.max(limit ?? 0, total)
  const used = element("span", undefined, limit ? `${short(total)} / ${short(limit)} ` : short(total))

  if (limit) used.append(element("span", "percent", `(${percent}%)`))

  const content = [row([element("span", undefined, t("usage.window")), used])]

  if (scale > 0) {
    const bar = element("div", "bar")

    bar.setAttribute("aria-hidden", "true")
    kinds.forEach((kind) => {
      const segment = element("span")

      segment.style.width = `${(kind.value / scale) * 100}%`
      segment.style.background = kind.color
      bar.append(segment)
    })
    content.push(bar)
  }

  if (kinds.length) {
    const legend = element("div", "legend")

    kinds.forEach((kind) => {
      const dot = element("span", "dot")

      dot.style.background = kind.color
      legend.append(
        row([dot, element("span", undefined, t(kind.label)), element("span", "value", kind.value.toLocaleString(locale))]),
      )
    })
    content.push(legend)
  }

  if (cost !== undefined) {
    const money = new Intl.NumberFormat(locale, { style: "currency", currency: "USD" })

    content.push(
      element("hr"),
      row([element("span", undefined, t("usage.cost")), element("span", "value", money.format(cost))]),
    )
  }

  return content
}

// The step's tokens by kind, in the order they fill the context window: what the cache held, what it newly stored, the
// rest of the input, then what the model wrote. The colors are the app's avatar colors, which follow the theme.
const KINDS = [
  { label: "usage.cacheRead", color: "var(--v2-avatar-border-blue)", value: (tokens) => tokens.cache.read },
  { label: "usage.cacheWrite", color: "var(--v2-avatar-border-purple)", value: (tokens) => tokens.cache.write },
  { label: "usage.input", color: "var(--v2-avatar-border-pink)", value: (tokens) => tokens.input },
  { label: "usage.reasoning", color: "var(--v2-avatar-border-yellow)", value: (tokens) => tokens.reasoning },
  { label: "usage.output", color: "var(--v2-avatar-border-green)", value: (tokens) => tokens.output },
]

// The model `wanted` names, as the app finds it: only on a provider the server lists, and not deprecated.
const model = (data, ref, wanted) => {
  const providers = data.location.provider.list(ref)
  const models = data.location.model.list(ref)

  if (!providers?.some((provider) => provider.id === wanted.providerID)) return

  return models?.findLast(
    (model) => model.providerID === wanted.providerID && model.id === wanted.id && model.status !== "deprecated",
  )
}

// An element of the card: `part` names it for the card's styles, and `text` fills it.
const element = (tag, part, text) => {
  const node = document.createElement(tag)

  if (part) node.setAttribute("data-part", part)
  if (text !== undefined) node.textContent = text

  return node
}

// A line of the card: its children in a row, the last one at the end.
const row = (children) => {
  const node = element("div", "row")

  node.append(...children)

  return node
}

// Under the button, its end edge in line with the button's like the app's menus, and 8px inside the window.
const place = (card, button) => {
  const anchor = button.getBoundingClientRect()
  const width = card.offsetWidth
  const start = getComputedStyle(button).direction === "rtl" ? anchor.left : anchor.right - width

  card.style.top = `${anchor.bottom + GAP}px`
  card.style.left = `${Math.max(8, Math.min(start, innerWidth - width - 8))}px`
}
