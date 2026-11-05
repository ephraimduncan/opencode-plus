import { createSignal, For, Match, Show, Switch } from "solid-js"
import { usePlugin } from "@opencode/plugin/gui"
import { clock, More } from "../ui.jsx"
import { elapsed } from "../workflows/format.js"
import { Spinner } from "../workflows/spinner.jsx"
import { tally } from "./format.js"
import { Avatar, Comment, Glyph, Label, Markdown, Person, Section, State, Tag } from "./parts.jsx"

// The Summary view: the status card with the next step, T3 Code's meta rows, then the description, the checks and the
// conversation in collapsible sections.

// Each merge state: the color of the card, and what it offers.
const GATES = {
  merged: { variant: "normal" },
  closed: { variant: "normal", reopen: true },
  draft: { variant: "normal", ready: true },
  conflicts: { variant: "error", hand: "conflicts", glyph: "warning" },
  changes: { variant: "error", hand: "review", glyph: "reply" },
  failing: { variant: "error", hand: "checks", glyph: "hammer" },
  review: { variant: "warning", auto: true },
  pending: { variant: "warning", auto: true, now: true },
  behind: { variant: "warning", auto: true, update: true },
  blocked: { variant: "warning", auto: true },
  unknown: { variant: "normal", auto: true },
  ready: { variant: "success", merge: true },
}

const ACCENTS = {
  error: "var(--v2-state-fg-danger)",
  warning: "var(--icon-warning-active)",
  success: "var(--icon-success-active)",
}

export function PullSummary(props) {
  const ctx = usePlugin()
  const gate = () => GATES[props.item.gate]
  const methods = () => props.repo?.methods ?? []
  const merger = () => !!props.repo?.write && methods().length > 0
  const busy = (action) => props.acting === action
  const offers = () =>
    [
      gate().merge && merger() && "merge",
      gate().hand && "hand",
      gate().ready && "ready",
      gate().update && "update",
      gate().auto && merger() && !props.item.autoMerge && "auto",
      // Before the required checks pass, GitHub merges only for an admin.
      gate().now && merger() && (!props.item.blocked || props.repo.admin) && "now",
      gate().reopen && "reopen",
    ].filter(Boolean)

  const icon = () => {
    if (["merged", "closed", "draft"].includes(props.item.gate))
      return <State kind="pull" state={props.item.gate} size="small" />
    if (props.item.gate === "pending" || props.item.gate === "unknown")
      return <Spinner class="text-v2-state-fg-warning" still={props.item.gate === "unknown"} />

    return <ctx.ui.Icon name={ICONS[gate().variant]} size="small" />
  }

  const description = () => {
    const key = props.item.gate === "merged" && !props.item.mergedBy ? "merged.anonymous" : props.item.gate
    const text = ctx.t(`github.gate.${key}.detail`, { base: props.item.base, user: props.item.mergedBy ?? "" })

    return props.item.autoMerge ? `${text} ${ctx.t(`github.auto.${props.item.autoMerge}`)}` : text
  }

  return (
    <>
      <Card
        variant={gate().variant}
        icon={icon()}
        title={ctx.t(`github.gate.${props.item.gate}`)}
        description={description()}
      >
        <Show when={offers().length > 0}>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <Show when={offers().includes("merge")}>
              <span class="flex items-center">
                <ctx.ui.Button
                  variant="contrast"
                  size="small"
                  busy={busy("merge")}
                  onClick={() => void props.merge(methods()[0])}
                >
                  <Label glyph="merge">{ctx.t(`github.method.${methods()[0]}`)}</Label>
                </ctx.ui.Button>
                <Show when={methods().length > 1}>
                  <ctx.ui.Menu
                    label={ctx.t("github.merge.other")}
                    icon="chevron-down"
                    placement="bottom-start"
                    items={methods()
                      .slice(1)
                      .map((method) => ({
                        label: ctx.t(`github.method.${method}`),
                        onSelect: () => void props.merge(method),
                      }))}
                  />
                </Show>
              </span>
            </Show>
            <Show when={offers().includes("hand")}>
              <ctx.ui.Button variant="contrast" size="small" onClick={() => props.hand(gate().hand)}>
                <Label glyph={gate().glyph}>{ctx.t(`github.hand.${gate().hand}`)}</Label>
              </ctx.ui.Button>
            </Show>
            <Show when={offers().includes("ready")}>
              <ctx.ui.Button
                variant="contrast"
                size="small"
                busy={busy("ready")}
                onClick={() => void props.change("ready")}
              >
                <Label glyph="eye">{ctx.t("github.ready")}</Label>
              </ctx.ui.Button>
            </Show>
            <Show when={offers().includes("update")}>
              <ctx.ui.Button
                variant="neutral"
                size="small"
                busy={busy("update")}
                onClick={() => void props.change("update")}
              >
                <Label glyph="sync">{ctx.t("github.update")}</Label>
              </ctx.ui.Button>
            </Show>
            <Show when={offers().includes("auto") || offers().includes("now")}>
              <span class="flex items-center">
                <Show when={offers().includes("auto")}>
                  <ctx.ui.Button
                    variant="neutral"
                    size="small"
                    busy={busy("auto")}
                    onClick={() => void props.merge(methods()[0], "auto")}
                  >
                    <Label glyph="clock">{ctx.t("github.merge.auto")}</Label>
                  </ctx.ui.Button>
                </Show>
                <Show when={offers().includes("now")}>
                  <ctx.ui.Menu
                    label={ctx.t("github.merge.now")}
                    trigger={offers().includes("auto") ? "icon" : "button"}
                    icon="chevron-down"
                    placement="bottom-start"
                    items={[
                      {
                        type: "group",
                        label: ctx.t("github.merge.now"),
                        items: methods().map((method) => ({
                          label: ctx.t(`github.method.${method}`),
                          onSelect: () => void props.merge(method, "now"),
                        })),
                      },
                    ]}
                  />
                </Show>
              </span>
            </Show>
            <Show when={offers().includes("reopen")}>
              <ctx.ui.Button
                variant="neutral"
                size="small"
                busy={busy("reopen")}
                onClick={() => void props.change("reopen")}
              >
                <Label glyph="reopen">{ctx.t("github.reopen")}</Label>
              </ctx.ui.Button>
            </Show>
          </div>
        </Show>
      </Card>

      <div class="flex flex-col py-3">
        <Reviewers item={props.item} origin={props.origin} />
        <Meta glyph="user" label={ctx.t("github.assignees")}>
          <People logins={props.item.assignees} origin={props.origin} />
        </Meta>
        <Meta glyph="tag" label={ctx.t("github.labels")}>
          <Labels labels={props.item.labels} />
        </Meta>
        <Show when={props.item.sync}>
          <Meta glyph="branch" label={ctx.t("github.branch")}>
            <span
              class="flex items-center gap-1.5"
              classList={{
                "text-v2-state-fg-success": props.item.sync === "current",
                "text-v2-state-fg-warning": props.item.sync === "behind",
                "text-v2-state-fg-danger": props.item.sync === "conflicts",
              }}
            >
              <Glyph name={props.item.sync === "current" ? "check" : "warning"} size="small" />
              <span class="text-v2-text-text-base">
                {ctx.t(`github.sync.${props.item.sync}`, { base: props.item.base })}
              </span>
            </span>
          </Meta>
        </Show>
        <Show when={props.item.milestone}>
          <Meta glyph="milestone" label={ctx.t("github.milestone")}>
            {props.item.milestone}
          </Meta>
        </Show>
        <Show when={props.item.autoMerge}>
          <Meta glyph="zap" label={ctx.t("github.autoMerge")}>
            {ctx.t(`github.method.${props.item.autoMerge}`)}
          </Meta>
        </Show>
      </div>

      <Description body={props.item.body} />
      <Checks checks={props.item.checks} browse={props.browse} hand={props.hand} />
      <Conversation item={props.item} origin={props.origin} browse={props.browse} hand={props.hand} />
    </>
  )
}

export function IssueSummary(props) {
  const ctx = usePlugin()
  const done = () => props.item.state !== "open"

  return (
    <>
      <Card
        variant={done() ? "normal" : "success"}
        icon={<State kind="issue" state={props.item.state} size="small" />}
        title={ctx.t(`github.issue.${props.item.state}`)}
        description={
          props.item.pulls.length > 0
            ? ctx.plural("github.issue.pulls", props.item.pulls.length)
            : ctx.t(`github.issue.${props.item.state}.detail`)
        }
      >
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <Show
            when={done()}
            fallback={
              <ctx.ui.Button variant="contrast" size="small" onClick={() => props.hand("issue")}>
                <Label glyph="hammer">{ctx.t("github.hand.issue")}</Label>
              </ctx.ui.Button>
            }
          >
            <ctx.ui.Button
              variant="neutral"
              size="small"
              busy={props.acting === "reopen"}
              onClick={() => void props.change("reopen")}
            >
              <Label glyph="reopen">{ctx.t("github.reopen")}</Label>
            </ctx.ui.Button>
          </Show>
        </div>
      </Card>

      <div class="flex flex-col py-3">
        <Meta glyph="user" label={ctx.t("github.assignees")}>
          <People logins={props.item.assignees} origin={props.origin} />
        </Meta>
        <Meta glyph="tag" label={ctx.t("github.labels")}>
          <Labels labels={props.item.labels} />
        </Meta>
        <Show when={props.item.type}>
          <Meta glyph="box" label={ctx.t("github.type")}>
            {props.item.type}
          </Meta>
        </Show>
        <Show when={props.item.milestone}>
          <Meta glyph="milestone" label={ctx.t("github.milestone")}>
            {props.item.milestone}
          </Meta>
        </Show>
        <Show when={props.item.parent}>
          {(parent) => (
            <Meta glyph="parent" label={ctx.t("github.parent")}>
              <Link onClick={() => props.open(parent().url)}>{`#${parent().number} ${parent().title}`}</Link>
            </Meta>
          )}
        </Show>
        <Show when={props.item.subIssues}>
          {(sub) => (
            <Meta glyph="tree" label={ctx.t("github.subIssues")}>
              {ctx.t("github.subIssues.value", { done: sub().completed, total: sub().total })}
            </Meta>
          )}
        </Show>
        <Meta glyph="pull" label={ctx.t("github.pulls")}>
          <Show when={props.item.pulls.length > 0} fallback={<None />}>
            <span class="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
              <For each={props.item.pulls}>
                {(pull) => (
                  <Link onClick={() => props.open(pull.url)}>
                    <span class="flex items-center gap-1">
                      <Glyph name="pull" size="small" />
                      {`#${pull.number}`}
                    </span>
                  </Link>
                )}
              </For>
            </span>
          </Show>
        </Meta>
      </div>

      <Description body={props.item.body} />
      <Conversation item={props.item} origin={props.origin} browse={props.browse} hand={props.hand} />
    </>
  )
}

const ICONS = { error: "circle-x", warning: "warning", success: "circle-check", normal: "dash" }

// The app's status card: a line in the card's color, an icon and a title, a description, then its actions.
function Card(props) {
  return (
    <div data-component="card" data-variant={props.variant} style={{ "--card-accent": ACCENTS[props.variant] }}>
      <div data-slot="card-title">
        <span data-slot="card-title-icon">{props.icon}</span>
        <span class="min-w-0">{props.title}</span>
      </div>
      <div data-slot="card-description">{props.description}</div>
      {props.children}
    </div>
  )
}

// A meta row of T3 Code's summary: a glyph and a label, then the value.
function Meta(props) {
  return (
    <div data-slot="meta">
      <span>
        <Glyph name={props.glyph} />
        {props.label}
      </span>
      <div>{props.children}</div>
    </div>
  )
}

function None() {
  const ctx = usePlugin()

  return <span class="text-v2-text-text-faint">{ctx.t("github.none")}</span>
}

function People(props) {
  return (
    <Show when={props.logins.length > 0} fallback={<None />}>
      <span class="flex min-w-0 flex-wrap gap-x-3 gap-y-1.5">
        <For each={props.logins}>{(login) => <Person login={login} origin={props.origin} />}</For>
      </span>
    </Show>
  )
}

function Labels(props) {
  return (
    <Show when={props.labels.length > 0} fallback={<None />}>
      <span class="flex min-w-0 flex-wrap gap-1">
        <For each={props.labels}>{(label) => <Tag name={label.name} color={label.color} />}</For>
      </span>
    </Show>
  )
}

function Link(props) {
  return (
    <button
      type="button"
      class="min-w-0 truncate text-start text-v2-text-text-accent hover:underline"
      onClick={() => props.onClick()}
    >
      {props.children}
    </button>
  )
}

// The reviewers as T3 Code shows them: their pictures, each ringed in the color of its verdict, then what they decided.
function Reviewers(props) {
  const ctx = usePlugin()
  const reviewers = () => props.item.reviewers
  const who = (verdict) => reviewers().flatMap((reviewer) => (reviewer.verdict === verdict ? [reviewer.login] : []))
  const summary = () => {
    if (props.item.decision === "CHANGES_REQUESTED") return "changes"
    if (props.item.decision === "APPROVED" || (!props.item.decision && who("approved").length > 0)) return "approved"
    if (props.item.decision === "REVIEW_REQUIRED") return "required"
    if (who("requested").length > 0) return "waiting"

    return "commented"
  }

  return (
    <Meta glyph="users" label={ctx.t("github.reviewers")}>
      <Show when={reviewers().length > 0} fallback={<None />}>
        <span class="flex min-w-0 items-center gap-2.5">
          <span data-slot="avatars">
            <For each={reviewers()}>
              {(reviewer) => (
                <ctx.ui.Tooltip
                  value={`${reviewer.login}: ${ctx.t(`github.verdict.${reviewer.verdict}`)}`}
                  placement="top"
                >
                  <Avatar login={reviewer.login} origin={props.origin} verdict={reviewer.verdict} size={20} />
                </ctx.ui.Tooltip>
              )}
            </For>
          </span>
          <span class="min-w-0 truncate text-v2-text-text-muted">{ctx.t(`github.reviews.${summary()}`)}</span>
        </span>
      </Show>
    </Meta>
  )
}

function Description(props) {
  const ctx = usePlugin()

  return (
    <Section title={ctx.t("github.description")}>
      <Show
        when={props.body}
        fallback={<div class="text-12-regular text-v2-text-text-faint">{ctx.t("github.description.none")}</div>}
      >
        <Markdown text={props.body} />
      </Show>
    </Section>
  )
}

// The checks of the last commit: those that failed or run first, then the rest after a click. A failed check can go to
// the agent.
function Checks(props) {
  const ctx = usePlugin()
  const [all, setAll] = createSignal(false)
  const count = () => tally(props.checks)
  const urgent = () => props.checks.filter((check) => check.result === "fail" || check.result === "pending")
  const shown = () => (all() || urgent().length === 0 ? props.checks : urgent())

  return (
    <Show when={props.checks.length > 0}>
      <Section
        title={ctx.t("github.checks")}
        count={`${count().pass}/${props.checks.length}`}
        open={urgent().length > 0}
        note={<CheckSummary checks={props.checks} />}
      >
        <div class="flex flex-col">
          <For each={shown()}>{(check) => <Check check={check} browse={props.browse} hand={props.hand} />}</For>
          <Show when={urgent().length > 0 && props.checks.length > urgent().length}>
            <div class="-mx-2">
              <More onClick={() => setAll(!all())}>
                {all()
                  ? ctx.t("github.checks.less")
                  : ctx.plural("github.checks.more", props.checks.length - urgent().length)}
              </More>
            </div>
          </Show>
        </div>
      </Section>
    </Show>
  )
}

// The checks in one line: an icon of the worst result, and how many have it.
export function CheckSummary(props) {
  const ctx = usePlugin()
  const count = () => tally(props.checks)
  const result = () => (count().fail > 0 ? "fail" : count().pending > 0 ? "pending" : "pass")
  const text = () => {
    const { pass, fail, pending } = count()
    const total = props.checks.length

    if (fail > 0) return ctx.t("github.checks.failing", { count: fail, total })
    if (pending > 0) return ctx.t("github.checks.running", { count: pending, total })
    if (pass === total) return ctx.t("github.checks.passed")

    return ctx.t("github.checks.some", { count: pass, total })
  }

  return (
    <Show when={props.checks.length > 0}>
      <span class="flex shrink-0 items-center gap-1.5 text-12-regular text-v2-text-text-muted">
        <Result result={result()} />
        {text()}
      </span>
    </Show>
  )
}

// A check: its result, its name and workflow, and how long it ran. The row opens the check's page; a failed check has a
// button that hands it to the agent.
function Check(props) {
  const ctx = usePlugin()
  const now = clock(() => props.check.result === "pending")
  const time = () =>
    props.check.started && (props.check.ended || props.check.result === "pending")
      ? elapsed((props.check.ended ?? now()) - props.check.started, (key, params) => ctx.t(key, params))
      : ""

  return (
    <div data-slot="row">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-start"
        disabled={!props.check.url}
        onClick={() => props.browse(props.check.url)}
      >
        <Result result={props.check.result} />
        <span class="min-w-0 shrink truncate text-v2-text-text-base">{props.check.name}</span>
        <span class="min-w-0 flex-1 truncate text-v2-text-text-muted">{props.check.workflow}</span>
        <span class="shrink-0 text-[11px] tabular-nums text-v2-text-text-muted">
          {time() || ctx.t(`github.result.${props.check.result}`)}
        </span>
      </button>
      <Show when={props.check.result === "fail"}>
        <ctx.ui.Button variant="ghost" size="small" onClick={() => props.hand("checks", props.check)}>
          <Label glyph="hammer">{ctx.t("github.fix")}</Label>
        </ctx.ui.Button>
      </Show>
    </div>
  )
}

export function Result(props) {
  const ctx = usePlugin()

  return (
    <span class="flex size-4 shrink-0 items-center justify-center">
      <Switch fallback={<ctx.ui.Icon name="circle-ban-sign" size="small" class="text-v2-icon-icon-faint" />}>
        <Match when={props.result === "pass"}>
          <ctx.ui.Icon name="circle-check" size="small" class="text-v2-state-fg-success" />
        </Match>
        <Match when={props.result === "fail"}>
          <ctx.ui.Icon name="circle-x" size="small" class="text-v2-state-fg-danger" />
        </Match>
        <Match when={props.result === "pending"}>
          <Spinner class="text-v2-state-fg-warning" />
        </Match>
      </Switch>
    </span>
  )
}

// The comments and the reviews that say something, oldest first, as cards. A review that requests changes can go to the
// agent.
function Conversation(props) {
  const ctx = usePlugin()
  const said = () =>
    props.item.events.filter((event) => (event.kind === "comment" || event.kind === "review") && event.body)

  return (
    <Section title={ctx.t("github.comments")} count={said().length}>
      <Show
        when={said().length > 0}
        fallback={<div class="text-12-regular text-v2-text-text-faint">{ctx.t("github.comments.none")}</div>}
      >
        <div class="flex flex-col gap-3">
          <For each={said()}>
            {(event) => (
              <Comment
                event={event}
                origin={props.origin}
                browse={props.browse}
                action={
                  event.verdict === "changes" && props.item.state === "open" ? (
                    <ctx.ui.Button variant="ghost" size="small" onClick={() => props.hand("review")}>
                      <Label glyph="reply">{ctx.t("github.address")}</Label>
                    </ctx.ui.Button>
                  ) : undefined
                }
              />
            )}
          </For>
        </div>
      </Show>
    </Section>
  )
}
