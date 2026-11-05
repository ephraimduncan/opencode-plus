import { createSignal, Match, onCleanup, Show, Switch } from "solid-js"
import { createKeyed, usePlugin } from "@opencode/plugin/gui"
import { Action, Bar, Scroll } from "../ui.jsx"
import { Files } from "./files.jsx"
import { parts, subject } from "./format.js"
import { Ago, Copy, Glyph, Label, Lines, Person, State } from "./parts.jsx"
import { CheckSummary, IssueSummary, PullSummary } from "./summary.jsx"
import { Timeline, TimelineNote } from "./timeline.jsx"

const SECOND = 1000
const MINUTE = 60 * SECOND

// A read younger than this stands when the panel shows again.
export const FRESH = 15 * SECOND

// The panel of one pull request or issue, with T3 Code's structure in the app's components: the browser panel's
// toolbar, a header with the title, the author and the branches, a tab bar with the app's segmented control, then the
// Summary, Timeline or Files view. While it shows, the panel reads an open item again each minute.
//
// The status card of the summary leads to the next step: merge, mark ready, update the branch, or hand the item to the
// agent, which attaches it to the prompt with an instruction that the user can change before they send it.
export function ItemView(props) {
  const ctx = usePlugin()
  const ref = parts(props.address)
  const entry = () => props.model.state.items[props.address]
  const item = () => entry()?.item
  const pull = () => item()?.kind === "pull"
  const open = () => ["open", "draft"].includes(item()?.state)
  const view = () => (props.view() === "files" && !pull() ? "summary" : (props.view() ?? "summary"))
  const [acting, setActing] = createSignal()
  const [newest, setNewest] = createSignal(false)

  const load = (age) => void props.model.load(props.address, props.session.directory, age)

  createKeyed(props.visible, () => {
    load(FRESH)
    const timer = setInterval(() => {
      if (open()) load(MINUTE)
    }, 10 * SECOND)

    onCleanup(() => clearInterval(timer))
  })

  createKeyed(
    () => item()?.moved,
    (address) => props.replace(address),
  )
  createKeyed(
    () => pull() && open(),
    () => props.model.loadRepo(props.address, props.session.directory),
  )

  const url = () => item()?.url ?? props.address
  const name = `${ref.owner}/${ref.repo}#${ref.number}`

  const copy = (text) =>
    void ctx.system.copy(text).then(
      () => ctx.toast.show({ variant: "success", title: ctx.t("github.copied") }),
      () => ctx.toast.show({ variant: "error", title: ctx.t("github.copyFailed") }),
    )

  // Makes a change on GitHub, then reads the item again.
  const change = async (action, method) => {
    setActing(action)
    const error = await props.model.change(props.address, props.session.directory, action, method)

    setActing()
    if (error)
      ctx.toast.show({ variant: "error", title: ctx.t("github.action.failed"), description: problem(ctx, error).body })
  }

  // Merges with `method` after the user agrees. `when` is "auto" to merge when the pull request is ready, or "now" to
  // merge before the checks end: as an admin when a rule of the repository requires them.
  const merge = async (method, when) => {
    const admin = when === "now" && item().blocked
    const notes = [
      ctx.t(`github.method.${method}.detail`, { base: item().base }),
      when === "now" && ctx.t(admin ? "github.merge.now.admin" : "github.merge.now.detail"),
    ]
    const yes = await ctx.dialogs.confirm({
      title: ctx.t(when ? `github.merge.${when}.title` : "github.merge.title", { number: ref.number }),
      description: notes.filter(Boolean).join(" "),
      confirm: ctx.t(when === "auto" ? "github.merge.auto" : `github.method.${method}`),
      danger: admin,
    })

    if (yes) await change(when === "auto" ? "auto" : admin ? "admin" : "merge", method)
  }

  const close = async () => {
    const yes = await ctx.dialogs.confirm({
      title: ctx.t(`github.close.${item().kind}.title`, { number: ref.number }),
      confirm: ctx.t(`github.close.${item().kind}`),
      danger: true,
    })

    if (yes) await change("close")
  }

  // Attaches the item to the prompt, about the part that `focus` names, and puts its instruction in an empty prompt.
  // `check` narrows a fix of the checks to one check.
  const hand = (focus, check) => {
    const composer = props.screen.composer

    composer.attach({
      type: "note",
      origin: ctx.id,
      commentID: `${ctx.id}:${props.address}:${focus}:${Date.now()}`,
      label: name,
      title: item().title,
      subtitle: check ? check.name : ctx.t(`github.kind.${item().kind}`),
      icon: "github",
      subject: subject(item(), focus, check),
      comment: "",
      href: props.address,
    })
    if (focus !== "context" && composer.text().trim() === "")
      composer.setText(
        ctx.t(check ? "github.ask.check" : `github.ask.${focus}`, { base: item().base, check: check?.name }),
      )
    composer.focus()
  }

  const menu = () => {
    const value = item()
    const top = [{ label: ctx.t("github.copy.link"), icon: "link", onSelect: () => copy(url()) }]

    if (!value?.title) return [...top, { type: "separator" }, external()]
    if (value.kind === "pull")
      top.push(
        { label: ctx.t("github.copy.branch"), icon: "branch", onSelect: () => copy(value.branch) },
        { label: ctx.t("github.copy.checkout"), icon: "console", onSelect: () => copy(`gh pr checkout ${ref.number}`) },
      )

    const changes = [
      value.state === "open" &&
        value.kind === "pull" && { label: ctx.t("github.draft"), icon: "edit", onSelect: () => void change("draft") },
      value.state === "draft" && { label: ctx.t("github.ready"), icon: "check", onSelect: () => void change("ready") },
      value.autoMerge && {
        label: ctx.t("github.merge.manual"),
        icon: "close-small",
        onSelect: () => void change("manual"),
      },
      open()
        ? { label: ctx.t(`github.close.${value.kind}`), icon: "outline-xmark", onSelect: () => void close() }
        : value.state !== "merged" && {
            label: ctx.t("github.reopen"),
            icon: "outline-undo",
            onSelect: () => void change("reopen"),
          },
    ].filter(Boolean)

    return [
      ...top,
      { type: "separator" },
      { label: ctx.t("github.context"), icon: "prompt", onSelect: () => hand("context") },
      { type: "separator" },
      ...changes,
      { type: "separator" },
      external(),
    ]
  }

  const external = () => ({
    label: ctx.t("github.external"),
    icon: "square-arrow-top-right",
    onSelect: () => void ctx.system.openExternal(url()),
  })

  return (
    // The browser panel's frame.
    <div
      data-plus-github
      class="relative size-full min-w-0 overflow-hidden bg-v2-background-bg-base flex flex-col outline-none"
    >
      <Bar>
        <State kind={ref.kind} state={item()?.state} />
        <span class="min-w-0 truncate text-[13px] font-[440] leading-4 tracking-[-0.04px] text-v2-text-text-muted">
          {`${ref.owner}/${ref.repo}`}
        </span>
        <span class="shrink-0 text-[13px] font-[530] leading-4 tracking-[-0.04px] tabular-nums text-v2-text-text-base">
          {`#${ref.number}`}
        </span>
        <span class="min-w-0 flex-1" />
        <Action
          icon="outline-rotate-clockwise"
          label={ctx.t("github.refresh")}
          busy={!!entry()?.busy && !!item()}
          onClick={() => load(0)}
        />
        <Action icon="square-arrow-top-right" label={ctx.t("github.open")} onClick={() => props.browse(url())} />
        <ctx.ui.Menu label={ctx.t("github.more")} icon="outline-dots" placement="bottom-end" items={menu()} />
      </Bar>
      <Show when={item() && entry().error}>
        {/* The browser panel's load error. */}
        <div class="shrink-0 px-3 py-1.5 text-12-regular text-v2-state-fg-danger border-b border-v2-border-border-muted">
          {problem(ctx, entry().error).title}
        </div>
      </Show>
      <Switch>
        <Match when={item()?.title !== undefined}>
          <Scroll>
            <div class="flex w-full min-w-0 flex-col px-4 pt-4 pb-8">
              <Header item={item()} kind={ref.kind} number={ref.number} origin={ref.origin} />
              <div data-slot="tabbar" class="mt-4">
                <div data-slot="segmented-control-v2" role="tablist">
                  <Tab value="summary" view={view()} onSelect={props.setView}>
                    {ctx.t("github.tab.summary")}
                  </Tab>
                  <Tab value="timeline" view={view()} onSelect={props.setView} count={item().events.length}>
                    {ctx.t("github.tab.timeline")}
                  </Tab>
                  <Show when={pull()}>
                    <Tab value="files" view={view()} onSelect={props.setView} count={item().changed}>
                      {ctx.t("github.tab.files")}
                    </Tab>
                  </Show>
                </div>
                <span class="min-w-0 flex-1" />
                <Switch>
                  <Match when={view() === "summary" && pull()}>
                    <CheckSummary checks={item().checks} />
                  </Match>
                  <Match when={view() === "timeline"}>
                    <TimelineNote item={item()} newest={newest()} onSort={setNewest} />
                  </Match>
                  <Match when={view() === "files"}>
                    <Lines additions={item().additions} deletions={item().deletions} />
                  </Match>
                </Switch>
              </div>
              <Switch>
                <Match when={view() === "summary"}>
                  <div class="flex flex-col pt-4">
                    <Show
                      when={pull()}
                      fallback={
                        <IssueSummary
                          item={item()}
                          origin={ref.origin}
                          acting={acting()}
                          browse={props.browse}
                          hand={hand}
                          change={change}
                          open={props.open}
                        />
                      }
                    >
                      <PullSummary
                        item={item()}
                        origin={ref.origin}
                        repo={props.model.state.repos[props.model.repo(props.address)]}
                        acting={acting()}
                        browse={props.browse}
                        hand={hand}
                        change={change}
                        merge={merge}
                      />
                    </Show>
                  </div>
                </Match>
                <Match when={view() === "timeline"}>
                  <Timeline item={item()} origin={ref.origin} newest={newest()} browse={props.browse} />
                </Match>
                <Match when={view() === "files"}>
                  <Files
                    item={item()}
                    patches={entry().patches}
                    browse={props.browse}
                    load={(path) => props.model.loadPatch(props.address, props.session.directory, path)}
                  />
                </Match>
              </Switch>
            </div>
          </Scroll>
        </Match>
        <Match when={entry()?.error}>
          <Failure error={entry().error} busy={entry().busy} retry={() => load(0)} open={() => props.browse(url())} />
        </Match>
        <Match when={true}>
          <Ghost />
        </Match>
      </Switch>
    </div>
  )
}

// T3 Code's header: the title; the state, the author and when, with the checkout command at the end; then the base and
// head branches, with the size of the change at the end.
function Header(props) {
  const ctx = usePlugin()
  const since = () => props.item.merged ?? props.item.closed ?? props.item.created
  const verb = () => (props.item.merged ? "merged" : props.item.closed ? "closed" : "opened")

  return (
    <header class="flex flex-col gap-2.5">
      <h1 data-slot="title" class="select-text">
        {props.item.title}
      </h1>
      <div class="flex min-w-0 flex-wrap items-center gap-2 text-12-regular text-v2-text-text-muted">
        <span class="flex shrink-0 items-center gap-1.5 text-12-medium text-v2-text-text-base">
          <State kind={props.kind} state={props.item.state} size="small" />
          {ctx.t(`github.state.${props.kind}.${props.item.state}`)}
        </span>
        <span aria-hidden="true" class="text-v2-text-text-faint">
          ·
        </span>
        <Person login={props.item.author} origin={props.origin} />
        <span class="flex shrink-0 items-center gap-1">
          {ctx.t(`github.meta.${verb()}`)}
          <Ago time={since()} />
        </span>
        <Show when={props.kind === "pull"}>
          <span class="min-w-0 flex-1" />
          <Copy
            slot="chip"
            glyph="terminal"
            value={`gh pr checkout ${props.number}`}
            title={ctx.t("github.copy.checkout")}
          />
        </Show>
      </div>
      <Show when={props.kind === "pull"}>
        <div class="flex min-w-0 items-center gap-3 text-12-regular text-v2-text-text-muted">
          <span class="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[12px]">
            <Glyph name="branch" size="small" class="text-v2-icon-icon-faint" />
            <span class="max-w-[45%] shrink-0 truncate">{props.item.base}</span>
            <Show when={props.item.sync === "behind" || props.item.sync === "conflicts"}>
              <ctx.ui.Tooltip
                value={ctx.t(`github.sync.${props.item.sync}`, { base: props.item.base })}
                placement="top"
              >
                <span
                  class="flex"
                  classList={{
                    "text-v2-state-fg-warning": props.item.sync === "behind",
                    "text-v2-state-fg-danger": props.item.sync === "conflicts",
                  }}
                >
                  <Glyph name="warning" size="small" />
                </span>
              </ctx.ui.Tooltip>
            </Show>
            <ctx.ui.Icon name="arrow-left" size="small" class="shrink-0 text-v2-icon-icon-faint" />
            <Copy
              class="min-w-0 truncate text-start hover:text-v2-text-text-base"
              value={props.item.branch}
              title={ctx.t("github.copy.branch")}
            >
              {props.item.fork ? `${props.item.fork}:${props.item.branch}` : props.item.branch}
            </Copy>
          </span>
          <span class="flex shrink-0 items-center gap-1 tabular-nums">
            <Glyph name="file" size="small" />
            {ctx.plural("github.files", props.item.changed)}
          </span>
          <Lines additions={props.item.additions} deletions={props.item.deletions} />
        </div>
      </Show>
    </header>
  )
}

// An item of the app's segmented control.
function Tab(props) {
  const pressed = () => props.view === props.value

  return (
    <button
      type="button"
      role="tab"
      data-slot="segmented-control-v2-item"
      data-pressed={pressed() ? "" : undefined}
      aria-selected={pressed()}
      onClick={() => props.onSelect(props.value)}
    >
      {props.children}
      <Show when={props.count > 0}>
        <span data-slot="count">{props.count}</span>
      </Show>
    </button>
  )
}

// T3 Code's ghost while the item loads: bars in the shape of the header and the tab bar.
function Ghost() {
  return (
    <div class="flex flex-col gap-3 px-4 pt-4" aria-busy="true">
      <span data-slot="ghost" style={{ width: "66%", height: "16px" }} />
      <span data-slot="ghost" style={{ width: "33%" }} />
      <span data-slot="ghost" style={{ width: "50%" }} />
      <span data-slot="ghost" class="mt-3" style={{ width: "224px", height: "28px" }} />
      <span data-slot="ghost" class="mt-3" style={{ width: "100%", height: "64px" }} />
    </div>
  )
}

// Why the panel could not read the item, as the browser panel's empty state, with a way to try again.
function Failure(props) {
  const ctx = usePlugin()
  const text = () => problem(ctx, props.error)

  return (
    <div class="mx-auto flex max-w-[360px] flex-col items-center gap-4 px-6 pt-20 text-center">
      <ctx.ui.Icon name="github" size="large" class="text-v2-icon-icon-muted" />
      <div class="flex flex-col gap-2">
        <div class="text-[13px] font-[530] leading-[var(--line-height-compact)] text-v2-text-text-base">
          {text().title}
        </div>
        <div class="whitespace-pre-wrap text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">
          {text().body}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <ctx.ui.Button variant="neutral" busy={props.busy} onClick={props.retry}>
          <Label glyph="sync">{ctx.t("github.retry")}</Label>
        </ctx.ui.Button>
        <ctx.ui.Button variant="ghost" onClick={props.open}>
          <Label glyph="external">{ctx.t("github.open")}</Label>
        </ctx.ui.Button>
      </div>
    </div>
  )
}

const problem = (ctx, error) => ({
  title: ctx.t(`github.error.${error.reason}`),
  body: error.detail ?? ctx.t(`github.error.${error.reason}.detail`),
})
