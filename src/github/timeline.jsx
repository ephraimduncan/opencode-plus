import { For, Match, Show, Switch } from "solid-js"
import { usePlugin } from "@opencode/plugin/gui"
import { Ago, Avatar, Comment, Glyph, State } from "./parts.jsx"

// The Timeline view, as T3 Code draws it: every event hangs on one line by its marker, the picture of who did it or a
// glyph of what happened. Comments and reviews with text show as cards; a commit opens its page.
export function Timeline(props) {
  const ctx = usePlugin()
  const events = () => (props.newest ? props.item.events.toReversed() : props.item.events)

  return (
    <ol data-slot="timeline" class="pt-4">
      <For each={events()}>
        {(event) => (
          <li data-slot="event">
            <span data-slot="marker">
              <Switch fallback={<Avatar login={event.user} origin={props.origin} size={26} verdict={event.verdict} />}>
                <Match when={event.kind === "merged" || event.kind === "closed" || event.kind === "opened"}>
                  <span data-slot="ring">
                    <State kind={props.item.kind} state={stateOf(event, props.item)} size="small" />
                  </span>
                </Match>
                <Match when={event.kind === "commit"}>
                  <span data-slot="ring">
                    <Glyph name="commit" />
                  </span>
                </Match>
              </Switch>
            </span>
            <Switch>
              <Match when={event.kind === "commit"}>
                <button
                  type="button"
                  data-slot="commit"
                  onClick={() => props.browse(`${props.item.url}/commits/${event.oid}`)}
                >
                  <span class="flex min-w-0 flex-1 flex-col gap-0.5 py-1">
                    <span data-slot="headline" class="truncate text-12-medium text-v2-text-text-base">
                      {event.headline}
                    </span>
                    <span class="flex items-center gap-1.5 text-[11px] text-v2-text-text-muted">
                      <Avatar login={event.user} origin={props.origin} size={14} />
                      <span class="truncate">{event.user}</span>
                      <span aria-hidden="true">·</span>
                      <code class="font-mono">{event.oid.slice(0, 7)}</code>
                      <span aria-hidden="true">·</span>
                      <Ago time={event.time} />
                    </span>
                  </span>
                </button>
              </Match>
              <Match when={(event.kind === "comment" || event.kind === "review") && event.body}>
                <Comment event={event} origin={props.origin} browse={props.browse} />
              </Match>
              <Match when={true}>
                <div data-slot="line">
                  <Show when={event.user}>
                    <strong>{event.user}</strong>
                  </Show>
                  <span
                    data-slot={event.kind === "review" ? "verdict" : undefined}
                    data-verdict={event.verdict}
                    classList={{ "font-[530]": event.kind !== "review" && !event.user }}
                  >
                    {sentence(ctx, event, props.item)}
                  </span>
                  <span aria-hidden="true" class="text-v2-text-text-faint">
                    ·
                  </span>
                  <span class="text-v2-text-text-faint">
                    <Ago time={event.time} />
                  </span>
                </div>
              </Match>
            </Switch>
          </li>
        )}
      </For>
    </ol>
  )
}

// What the right side of the tab bar shows for the timeline: how many comments, commits and approvals, and the order.
export function TimelineNote(props) {
  const ctx = usePlugin()
  const count = (test) => props.item.events.filter(test).length

  return (
    <span class="flex shrink-0 items-center gap-3 text-12-regular tabular-nums text-v2-text-text-muted">
      <span class="flex items-center gap-1" title={ctx.t("github.comments")}>
        <Glyph name="comment" size="small" />
        {count((event) => event.kind === "comment")}
      </span>
      <Show when={props.item.kind === "pull"}>
        <span class="flex items-center gap-1" title={ctx.t("github.commits")}>
          <Glyph name="commit" size="small" />
          {count((event) => event.kind === "commit")}
        </span>
        <span class="flex items-center gap-1 text-v2-state-fg-success" title={ctx.t("github.approvals")}>
          <Glyph name="check" size="small" />
          {props.item.reviewers.filter((reviewer) => reviewer.verdict === "approved").length}
        </span>
      </Show>
      <button
        type="button"
        class="flex h-6 items-center gap-1 rounded-[6px] px-1.5 hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base"
        onClick={() => props.onSort(!props.newest)}
      >
        <Glyph name="sort" size="small" />
        {ctx.t(props.newest ? "github.order.newest" : "github.order.oldest")}
      </button>
    </span>
  )
}

// The state glyph of an event that opens or ends the item.
const stateOf = (event, item) => {
  if (event.kind === "opened") return "open"

  return item.kind === "pull" ? event.kind : item.state
}

// The verb of an event, after the name of the person who did it.
function sentence(ctx, event, item) {
  if (event.kind === "review") return ctx.t(`github.event.review.${event.verdict}`)
  if (event.kind === "merged") return ctx.t("github.event.merged", { base: item.base })
  if (event.kind === "opened") return ctx.t(`github.event.opened.${item.kind}`)
  if (event.kind === "closed") return ctx.t(`github.event.closed.${item.kind === "pull" ? "pull" : item.state}`)

  return ctx.t(`github.event.${event.kind}`)
}
