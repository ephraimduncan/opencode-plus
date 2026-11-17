import { lastAssistantWithUsage } from "@opencode/client/solid"
import * as card from "./card.js"

// The session header's usage button: the ring, the token count and the cost, which toggles the Context panel (OpenCode
// Desktop 2.2.5, the app's `context` plugin). On hover it shows only a tooltip. A narrow header shows the ring alone as
// a menu button that opens the app's own usage summary; it has `aria-haspopup`, so it keeps its behavior.
const BUTTON =
  '[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])'

const CARD = "data-plus-usage"

// Like Cursor's context window card: a heading with the window's use, a bar of the step's tokens by kind on the track
// of the app's usage meters, a legend, then the cost.
export const css = `
[${CARD}] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 280px;
  padding: 12px;
  font-variant-numeric: tabular-nums;
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
`

// Shows a card under the usage button while the pointer rests on it, as `card.listen` does. `fill` renders the card's
// content and returns its cleanup. Returns the cleanup.
export const listen = (fill) =>
  card.listen(
    BUTTON,
    (element) => {
      element.setAttribute(CARD, "")

      return fill(element)
    },
    "end",
  )

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
