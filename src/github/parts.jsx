import { createSignal, For, onCleanup, Show } from "solid-js"
import { usePlugin } from "@opencode/plugin/gui"
import { clock } from "../ui.jsx"
import { ago } from "./format.js"

// The small parts that the views of the GitHub panel share.

const MINUTE = 60 * 1000

// A glyph of `css.js` in the color of the text around it.
export function Glyph(props) {
  return <span data-plus-glyph={props.name} data-size={props.size} aria-hidden="true" class={props.class} />
}

// The glyph of a pull request's or an issue's state, in its color. GitHub's mark while the state is not known yet.
export function State(props) {
  const ctx = usePlugin()

  return (
    <Show when={props.state} fallback={<ctx.ui.Icon name="github" class="shrink-0 text-v2-icon-icon-muted" />}>
      <span data-plus-github-state={`${props.kind}:${props.state}`} data-size={props.size} aria-hidden="true" />
    </Show>
  )
}

// The text of a button, after its glyph.
export function Label(props) {
  return (
    <span class="flex items-center gap-1.5">
      <Glyph name={props.glyph} />
      {props.children}
    </span>
  )
}

// The GitHub picture of `login`, else its first letter. A reviewer's verdict shows as a ring and a badge.
export function Avatar(props) {
  const [failed, setFailed] = createSignal(false)

  return (
    <span data-slot="avatar" data-verdict={props.verdict} style={{ "--plus-avatar": `${props.size ?? 16}px` }}>
      <Show
        when={props.login && !failed()}
        fallback={<span data-slot="initial">{(props.login ?? "?").slice(0, 1)}</span>}
      >
        <img src={`${props.origin}/${props.login}.png?size=64`} alt="" onError={() => setFailed(true)} />
      </Show>
      <Show when={props.verdict === "approved" || props.verdict === "changes"}>
        <span data-slot="badge">
          <Glyph name={props.verdict === "approved" ? "check" : "cross"} />
        </span>
      </Show>
    </span>
  )
}

export function Person(props) {
  return (
    <span class="flex min-w-0 items-center gap-1.5">
      <Avatar login={props.login} origin={props.origin} />
      <span class="min-w-0 truncate text-12-medium text-v2-text-text-base">{props.login ?? "ghost"}</span>
    </span>
  )
}

// The time since `then`, as the timeline writes it, with the full date on hover.
export function Ago(props) {
  const ctx = usePlugin()
  const now = clock(() => true, MINUTE)

  return (
    <span class="shrink-0 tabular-nums" title={new Date(props.time).toLocaleString(ctx.locale.locale())}>
      {ago(props.time, now(), ctx.t, ctx.locale.locale())}
    </span>
  )
}

// Added and removed lines, as the app's diff count.
export function Lines(props) {
  return (
    <span
      data-component="diff-changes"
      data-appearance="compact"
      class="flex shrink-0 items-center gap-1.5 font-mono text-[11px] tabular-nums"
    >
      <span data-slot="diff-changes-additions" class="text-v2-state-fg-success">{`+${props.additions}`}</span>
      <span data-slot="diff-changes-deletions" class="text-v2-state-fg-danger">{`-${props.deletions}`}</span>
    </span>
  )
}

// A label in its GitHub color.
export function Tag(props) {
  return (
    <span data-slot="label" style={{ "--plus-label": `#${props.color}` }} title={props.name}>
      <span class="truncate">{props.name}</span>
    </span>
  )
}

// Markdown from GitHub, as the timeline renders a message.
export function Markdown(props) {
  const ctx = usePlugin()

  return (
    <div data-component="text-part" class="min-w-0">
      <div data-slot="text-part-body">
        <ctx.ui.Markdown text={props.text} class="text-[13px]" />
      </div>
    </div>
  )
}

// A comment or a review as T3 Code's card: who wrote it, its verdict and when, its text, and its reactions. `action`
// adds a button to the header.
export function Comment(props) {
  const ctx = usePlugin()

  return (
    <article data-slot="comment">
      <header>
        <Person login={props.event.user} origin={props.origin} />
        <Show when={props.event.verdict}>
          <span data-slot="verdict" data-verdict={props.event.verdict}>
            {ctx.t(`github.verdict.${props.event.verdict}`)}
          </span>
        </Show>
        <Ago time={props.event.time} />
        <span class="min-w-0 flex-1" />
        {props.action}
        <Show when={props.event.url}>
          <ctx.ui.Tooltip value={ctx.t("github.open")} placement="top">
            <button
              type="button"
              class="flex size-6 items-center justify-center rounded-[6px] text-v2-icon-icon-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base"
              aria-label={ctx.t("github.open")}
              onClick={() => props.browse(props.event.url)}
            >
              <Glyph name="external" size="small" />
            </button>
          </ctx.ui.Tooltip>
        </Show>
      </header>
      <Show when={props.event.body}>
        <div data-slot="body">
          <Markdown text={props.event.body} />
        </div>
      </Show>
      <Show when={props.event.reactions?.length > 0}>
        <div data-slot="reactions">
          <For each={props.event.reactions}>
            {(reaction) => (
              <span data-slot="reaction">
                <span>{reaction.emoji}</span>
                {reaction.count}
              </span>
            )}
          </For>
        </div>
      </Show>
    </article>
  )
}

// T3 Code's collapsible section: a heading with a chevron that stays at the top while the section scrolls, a note at
// its end, then the content.
export function Section(props) {
  const [open, setOpen] = createSignal(props.open ?? true)

  return (
    <section data-slot="section" data-open={open() ? "" : undefined}>
      <div data-slot="heading">
        <button type="button" aria-expanded={open()} onClick={() => setOpen(!open())}>
          <span class="truncate">{props.title}</span>
          <Show when={props.count !== undefined}>
            <span class="tabular-nums text-v2-text-text-faint">{props.count}</span>
          </Show>
          <Glyph name="chevron" size="small" />
        </button>
        {props.note}
      </div>
      <Show when={open()}>
        <div class="pb-4">{props.children}</div>
      </Show>
    </section>
  )
}

// A text that copies `value` on a click, and says so for a moment.
export function Copy(props) {
  const ctx = usePlugin()
  const [copied, setCopied] = createSignal(false)
  let timer

  onCleanup(() => clearTimeout(timer))

  const copy = () =>
    void ctx.system.copy(props.value).then(() => {
      setCopied(true)
      clearTimeout(timer)
      timer = setTimeout(() => setCopied(false), 1600)
    })

  return (
    <button type="button" class={props.class} data-slot={props.slot} title={props.title} onClick={copy}>
      {props.glyph && <Glyph name={copied() ? "check" : props.glyph} size="small" />}
      <span class="min-w-0 truncate">{copied() ? ctx.t("github.copied") : (props.children ?? props.value)}</span>
    </button>
  )
}
