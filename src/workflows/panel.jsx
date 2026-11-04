import { createMemo, createSignal, For, Match, onCleanup, Show, Switch } from "solid-js"
import { createKeyed, usePlugin } from "@opencode/plugin/gui"
import { summarize } from "../workflow/tools.js"
import { active, counts, elapsed as time, groups, spent, tokens } from "./format.js"
import { Spinner } from "./spinner.jsx"

// The Workflows panel: the runs of the session, one run's phases and agents, and one agent's prompt, live activity,
// and result. `nav` holds where the panel is for each session; the back buttons walk up.
//
// The markup and classes come from the app's own components, so the panel looks like the rest of the app: the frame
// and toolbar of the browser panel, the rows of the running-subagents menu and of the new tab view, the tool rows and
// text parts of the timeline, and the permission dock. Each comment names the component that a block follows.
export function WorkflowsView(props) {
  const id = () => root(props.session)
  const view = () => props.nav.get(id())

  createKeyed(id, (sessionID) => void props.model.load(props.session, sessionID))

  return (
    // The browser panel's frame.
    <div class="relative size-full min-w-0 overflow-hidden bg-v2-background-bg-base flex flex-col outline-none">
      <Switch fallback={<RunList {...props} sessionID={id()} />}>
        <Match when={view().agentID && props.model.run(view().runID)}>
          <AgentView {...props} sessionID={id()} runID={view().runID} agentID={view().agentID} />
        </Match>
        <Match when={view().runID && props.model.run(view().runID)}>
          <RunView {...props} sessionID={id()} runID={view().runID} />
        </Match>
      </Switch>
    </div>
  )
}

// The session that started the routed session's runs: the routed session, or the root above a workflow agent's
// session.
export function root(session) {
  const data = session.server.data
  let id = session.id

  for (let depth = 0; depth < 8; depth++) {
    const parent = data.session.get(id)?.parentID

    if (!parent) return id
    id = parent
  }

  return id
}

function RunList(props) {
  const ctx = usePlugin()
  const runs = () => props.model.runs(props.sessionID)

  return (
    <>
      <Bar>
        <span class="min-w-0 flex-1 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">
          {ctx.t("wf.title")}
        </span>
        <ctx.ui.Tooltip value={ctx.t("wf.ultracode.hint")} placement="top">
          <span class="flex shrink-0 items-center gap-2 text-[13px] font-[440] leading-[var(--line-height-compact)] tracking-[-0.04px] text-v2-text-text-muted">
            {ctx.t("wf.ultracode")}
            <ctx.ui.Switch
              label={ctx.t("wf.ultracode")}
              hideLabel
              checked={props.model.ultracode(props.sessionID)}
              onChange={(on) => void props.model.setUltracode(props.session, props.sessionID, on)}
            />
          </span>
        </ctx.ui.Tooltip>
      </Bar>
      <Scroll>
        <Show
          when={runs().length > 0}
          fallback={
            // The browser panel's empty state.
            <div class="mx-auto flex max-w-[360px] flex-col items-center gap-4 px-6 pt-20 text-center">
              <ctx.ui.Icon name="fork" size="large" class="text-v2-icon-icon-muted" />
              <div class="flex flex-col gap-2">
                <div class="text-[13px] font-[530] leading-[var(--line-height-compact)] text-v2-text-text-base">
                  {ctx.t("wf.empty.title")}
                </div>
                <div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">
                  {ctx.t("wf.empty.body")}
                </div>
              </div>
            </div>
          }
        >
          {/* The new tab view's list of launchers. */}
          <div class="mx-auto flex w-full max-w-[608px] flex-col gap-3 px-6 pt-6 pb-10">
            <For each={runs()}>
              {(run) => <RunRow run={run} onOpen={() => props.nav.go(props.sessionID, { runID: run.id })} />}
            </For>
          </div>
        </Show>
      </Scroll>
    </>
  )
}

// A run as a row of the new tab view's launchers.
function RunRow(props) {
  const ctx = usePlugin()
  const now = clock(() => active(props.run.status))
  const done = () => finished(props.run.counts ?? {})

  return (
    <button
      type="button"
      class="flex h-[41px] w-full items-center justify-between gap-4 rounded-[8px] border-[0.5px] border-v2-border-border-base bg-v2-background-bg-layer-01 px-3.5 text-start hover:bg-v2-background-bg-layer-02"
      onClick={() => props.onOpen()}
    >
      <span class="flex min-w-0 items-center gap-2 text-[13px] font-[440] leading-[var(--line-height-compact)] tracking-[-0.04px]">
        <Status status={props.run.status} />
        <span class="shrink-0 text-v2-text-text-base">{props.run.name}</span>
        <span class="truncate text-v2-text-text-muted">{props.run.description}</span>
      </span>
      <span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">
        <Show when={props.run.counts?.total > 0}>{`${done()}/${props.run.counts.total} · `}</Show>
        {elapsed(ctx, (props.run.ended ?? now()) - (props.run.started ?? props.run.created))}
      </span>
    </button>
  )
}

function RunView(props) {
  const ctx = usePlugin()
  const run = () => props.model.run(props.runID)
  const agents = () => props.model.agents(props.runID)
  const live = () => active(run().status)
  const now = clock(live)
  const tally = createMemo(() => counts(agents()))
  const [logs, setLogs] = createSignal(false)

  // Loads the run again when it ends, for its full result.
  createKeyed(
    () => `${props.runID}/${live()}`,
    () => void props.model.open(props.session, props.runID).catch(() => undefined),
  )

  const act = (work) => () =>
    void work().catch((error) => ctx.toast.show({ variant: "error", title: ctx.t("wf.error"), description: message(error) }))

  const save = (scope) =>
    act(async () => {
      const { path } = await props.model.save(props.session, props.runID, scope)

      ctx.toast.show({ variant: "success", title: ctx.t("wf.saved", { name: `/${run().name}` }), description: path })
    })

  const menu = () => [
    { label: ctx.t("wf.save.project"), icon: "folder", onSelect: save("project") },
    { label: ctx.t("wf.save.personal"), icon: "download", onSelect: save("personal") },
    { type: "separator" },
    { label: ctx.t("wf.copy.script"), icon: "outline-copy", onSelect: () => void ctx.system.copy(run().scriptPath) },
    { label: ctx.t("wf.copy.id"), icon: "outline-copy", onSelect: () => void ctx.system.copy(run().id) },
    ...(ctx.desktop
      ? [{ label: ctx.t("wf.reveal"), icon: "folder", onSelect: () => void ctx.desktop.reveal(run().scriptPath) }]
      : []),
  ]

  return (
    <>
      <Bar>
        <Back label={ctx.t("wf.back.runs")} onClick={() => props.nav.go(props.sessionID, {})} />
        <span class="min-w-0 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">
          {run().name}
        </span>
        <span class="min-w-0 flex-1" />
        {/* No glyph means pause in the app's icon set, so these are the subagent bar's small text buttons. */}
        <Show when={run().status === "running"}>
          <ctx.ui.Button variant="ghost-muted" size="small" onClick={act(() => props.model.pause(props.session, props.runID))}>
            {ctx.t("wf.pause")}
          </ctx.ui.Button>
        </Show>
        <Show when={run().status === "paused"}>
          <ctx.ui.Button variant="ghost-muted" size="small" onClick={act(() => props.model.resume(props.session, props.runID))}>
            {ctx.t("wf.resume")}
          </ctx.ui.Button>
        </Show>
        <Show when={run().status === "running" || run().status === "paused"}>
          <Action icon="stop" label={ctx.t("wf.stop")} onClick={act(() => props.model.stop(props.session, props.runID))} />
        </Show>
        <ctx.ui.Menu label={ctx.t("wf.more")} icon="outline-dots" placement="bottom-end" items={menu()} />
      </Bar>
      <Show when={run().error}>
        {/* The browser panel's load error. */}
        <div class="shrink-0 px-3 py-1.5 text-12-regular text-v2-state-fg-danger border-b border-v2-border-border-muted">
          {run().error}
        </div>
      </Show>
      <Scroll>
        <div class="mx-auto flex w-full max-w-[608px] flex-col gap-4 px-6 pt-6 pb-10">
          <div class="flex flex-col gap-2">
            <Meta
              parts={[
                <StatusLabel status={run().status} />,
                elapsed(ctx, (run().ended ?? now()) - (run().started ?? run().created)),
                tally().total > 0 && ctx.t("wf.agents", { done: tally().finished, total: tally().total }),
                tally().running > 0 && ctx.t("wf.running", { count: tally().running }),
                tally().queued > 0 && ctx.t("wf.queued", { count: tally().queued }),
                tally().failed > 0 && ctx.t("wf.failed", { count: tally().failed }),
                run().spent > 0 && ctx.t("wf.tokens", { count: tokens(run().spent) }),
                run().total && ctx.t("wf.budget", { count: tokens(run().total) }),
              ]}
            />
            <div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">
              {run().description}
            </div>
          </div>

          <Show when={run().status === "pending"}>
            <Approval {...props} run={run()} />
          </Show>

          <Show when={run().logs?.length > 0}>
            {/* The script's log in a card of the new tab view's launchers, so that it does not read as the description. */}
            <div class="flex flex-col gap-1 rounded-[8px] border-[0.5px] border-v2-border-border-base bg-v2-background-bg-layer-01 px-3.5 py-2.5">
              <For each={logs() ? run().logs : run().logs.slice(-3)}>
                {(log) => (
                  <div class="break-words text-[12px] font-[440] leading-4 tracking-[-0.04px] text-v2-text-text-muted">
                    {log.message}
                  </div>
                )}
              </For>
              <Show when={run().logs.length > 3}>
                <button
                  type="button"
                  class="w-fit pt-1 text-[12px] font-[440] leading-4 tracking-[-0.04px] text-v2-text-text-faint hover:text-v2-text-text-base"
                  onClick={() => setLogs(!logs())}
                >
                  {logs() ? ctx.t("wf.logs.less") : ctx.t("wf.logs.all", { count: run().logs.length })}
                </button>
              </Show>
            </div>
          </Show>

          <For each={run().status === "pending" ? [] : groups(run().phases ?? [], agents())}>
            {(group) => (
              <Show when={group.agents.length > 0}>
                {/* The new tab view's "Recently closed" section. */}
                <section class="flex flex-col gap-1">
                  <h2 class="flex items-center justify-between gap-4 px-2 pb-1 text-[13px] font-[440] text-v2-text-text-muted">
                    <span class="min-w-0 truncate">{group.title ?? ctx.t("wf.phase.none")}</span>
                    <span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">
                      {`${counts(group.agents).finished}/${group.agents.length}`}
                    </span>
                  </h2>
                  <For each={group.agents}>
                    {(agent) => (
                      <AgentRow
                        agent={agent}
                        now={now}
                        onOpen={() => props.nav.go(props.sessionID, { runID: props.runID, agentID: agent.id })}
                      />
                    )}
                  </For>
                </section>
              </Show>
            )}
          </For>

          <Show when={run().status === "completed" && props.model.result(props.runID) !== undefined}>
            <section class="flex flex-col gap-1">
              <h2 class="pb-1 text-[13px] font-[440] text-v2-text-text-muted">{ctx.t("wf.result")}</h2>
              <Value text={props.model.result(props.runID)} />
            </section>
          </Show>
        </div>
      </Scroll>
    </>
  )
}

// An agent as a row of the running-subagents menu: its state, its label, what it does, and its tokens and time.
function AgentRow(props) {
  const ctx = usePlugin()
  const line = () => {
    const agent = props.agent

    if (agent.status === "queued") return ctx.t("wf.agent.queued")
    if (agent.error) return agent.error
    if (agent.status === "running" && agent.lastTool) return `${toolTitle(ctx, agent.lastTool.name)} ${agent.lastTool.summary}`
    if (agent.status === "running") return ctx.t("session.timeline.working")
    if (agent.result) return agent.result

    return ""
  }

  return (
    <button
      type="button"
      class="flex h-8 w-full shrink-0 items-center gap-2 rounded-[6px] px-2 text-start text-[13px] font-[440] hover:bg-v2-background-bg-layer-02"
      onClick={() => props.onOpen()}
    >
      <Status status={props.agent.status} />
      <span class="max-w-[45%] shrink-0 truncate text-v2-text-text-base">{props.agent.label}</span>
      <span
        class="min-w-0 flex-1 truncate text-v2-text-text-muted"
        classList={{ "text-v2-state-fg-danger": props.agent.status === "failed" }}
      >
        {line()}
      </span>
      <span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">
        {[
          props.agent.cached && ctx.t("wf.cached"),
          spent(props.agent) > 0 && tokens(spent(props.agent)),
          props.agent.started && elapsed(ctx, (props.agent.ended ?? props.now()) - props.agent.started),
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </button>
  )
}

function AgentView(props) {
  const ctx = usePlugin()
  const agent = () => props.model.state.agents[props.runID]?.[props.agentID]
  const detail = () => props.model.detail(props.runID, props.agentID)
  const now = clock(() => agent()?.status === "running")

  // Loads the full prompt and result, again when the agent ends.
  createKeyed(
    () => `${props.runID}/${props.agentID}/${agent()?.status}`,
    () => void props.model.describe(props.session, props.runID, props.agentID).catch(() => undefined),
  )

  const open = () => {
    const sessionID = agent()?.sessionID

    if (sessionID) ctx.tabs.open({ server: props.session.server.id, id: sessionID }, { focus: true })
  }

  const stop = () =>
    void props.model
      .stopAgent(props.session, props.runID, props.agentID)
      .catch((error) => ctx.toast.show({ variant: "error", title: ctx.t("wf.error"), description: message(error) }))

  const result = () => detail()?.result ?? agent()?.result

  return (
    <Show when={agent()}>
      <Bar>
        <Back
          label={ctx.t("wf.back.run", { name: props.model.run(props.runID)?.name })}
          onClick={() => props.nav.go(props.sessionID, { runID: props.runID })}
        />
        <span class="min-w-0 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">
          {agent().label}
        </span>
        <span class="min-w-0 flex-1" />
        <Show when={agent().status === "running" || agent().status === "queued"}>
          <Action icon="stop" label={ctx.t("wf.agent.stop")} onClick={stop} />
        </Show>
        <Show when={agent().sessionID}>
          <Action icon="square-arrow-top-right" label={ctx.t("wf.agent.open")} onClick={open} />
        </Show>
      </Bar>
      <Show when={agent().error}>
        <div class="shrink-0 px-3 py-1.5 text-12-regular text-v2-state-fg-danger border-b border-v2-border-border-muted">
          {agent().error}
        </div>
      </Show>
      <Scroll>
        <div class="mx-auto flex w-full max-w-[608px] flex-col gap-4 px-6 pt-6 pb-10">
          {/* The subagent bar's status line. */}
          <Meta
            parts={[
              <StatusLabel status={agent().status} />,
              agent().started && elapsed(ctx, (agent().ended ?? now()) - agent().started),
              <span class="capitalize">{agent().agentType ?? "general"}</span>,
              agent().model && agent().model.split("/").pop(),
              agent().phase,
              spent(agent()) > 0 && ctx.t("wf.tokens", { count: tokens(spent(agent())) }),
              agent().toolCalls > 0 && ctx.plural("wf.tools", agent().toolCalls),
              agent().cached && ctx.t("wf.cached"),
            ]}
          />
          <Show when={agent().directory}>
            <div class="truncate text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted" title={agent().directory}>
              {agent().directory}
            </div>
          </Show>

          {/* The prompt as the agent's session shows it: a user message. */}
          <div data-component="user-message">
            <div data-slot="user-message-body">
              <div data-slot="user-message-text" dir="auto">
                {detail()?.prompt ?? agent().prompt}
              </div>
            </div>
          </div>

          <Show when={agent().sessionID}>
            <Activity
              session={props.session}
              sessionID={agent().sessionID}
              directory={agent().directory ?? props.session.directory}
            />
          </Show>

          <Show when={result() !== undefined}>
            <section class="flex flex-col gap-1">
              <h2 class="pb-1 text-[13px] font-[440] text-v2-text-text-muted">{ctx.t("wf.result")}</h2>
              <Value text={result()} />
            </section>
          </Show>
        </div>
      </Scroll>
    </Show>
  )
}

// What the agent did, from its session's messages as they arrive, as the timeline's grouped tool list shows it: a
// row for each tool call, and each text part.
function Activity(props) {
  const ctx = usePlugin()
  const data = () => props.session.server.data

  createKeyed(
    () => props.sessionID,
    (sessionID) => {
      void data().session.sync(sessionID).catch(() => undefined)
      void data().session.message.sync(sessionID).catch(() => undefined)
    },
  )

  const items = createMemo(() =>
    data()
      .session.message.list(props.sessionID)
      .flatMap((message) =>
        message.type !== "assistant"
          ? []
          : message.content.flatMap((part, index) => {
              if (part.type === "tool")
                return [
                  {
                    key: part.id,
                    kind: "tool",
                    title: toolTitle(ctx, part.name),
                    running: part.state.status === "running" || part.state.status === "streaming",
                    subtitle: summarize(part.state.input, props.directory),
                    error: part.state.status === "error" ? part.state.error?.message : undefined,
                  },
                ]
              if (part.type === "text" && part.text.trim()) return [{ key: `${message.id}:${index}`, kind: "text", text: part.text }]

              return []
            }),
      ),
  )

  return (
    <Show when={items().length > 0}>
      <div data-component="context-tool-group-list">
        <For each={items()}>
          {(item) => (
            <div data-slot="context-tool-group-item">
              {item.kind === "tool" ? (
                <div data-component="tool-trigger">
                  <div data-slot="basic-tool-tool-trigger-content">
                    <div data-slot="basic-tool-tool-info">
                      <div data-slot="basic-tool-tool-info-structured">
                        <div data-slot="basic-tool-tool-info-main">
                          <span data-slot="basic-tool-tool-title">
                            <Shimmer text={item.title} active={item.running} />
                          </span>
                          <Show when={item.subtitle}>
                            <span data-slot="basic-tool-tool-subtitle">{item.subtitle}</span>
                          </Show>
                          <Show when={item.error}>
                            <span data-slot="basic-tool-tool-arg" class="text-v2-state-fg-danger">
                              {item.error}
                            </span>
                          </Show>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div data-component="text-part">
                  <div data-slot="text-part-body">
                    <ctx.ui.Markdown text={item.text} />
                  </div>
                </div>
              )}
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}

// A run that waits for permission, in the permission dock's card. It answers the same request as the dock.
function Approval(props) {
  const ctx = usePlugin()
  const data = () => props.session.server.data
  const [busy, setBusy] = createSignal(false)

  createKeyed(
    () => props.run.sessionID,
    (sessionID) => void data().session.permission.sync(sessionID).catch(() => undefined),
  )

  const request = () =>
    (data().session.permission.list(props.run.sessionID) ?? []).find(
      (item) => item.source?.id === props.run.toolCall || (item.action === "workflow" && item.resources[0] === props.run.name),
    )

  const reply = (decision) => {
    const item = request()

    if (!item) return
    setBusy(true)
    void data()
      .session.permission.reply({ sessionID: item.sessionID, requestID: item.id, decision })
      .catch((error) => ctx.toast.show({ variant: "error", title: ctx.t("wf.error"), description: message(error) }))
      .finally(() => setBusy(false))
  }

  return (
    <div data-component="dock-prompt" data-kind="permission">
      <div data-slot="permission-body">
        <div data-slot="permission-header">
          <div data-slot="permission-row" data-variant="header">
            <span data-slot="permission-icon">
              <ctx.ui.Icon name="warning" />
            </span>
            <div data-slot="permission-header-title">{ctx.t("wf.approve.title")}</div>
          </div>
        </div>
        <div data-slot="permission-content">
          <div data-slot="permission-row">
            <span data-slot="permission-spacer" aria-hidden="true" />
            <div data-slot="permission-hint">{ctx.t("wf.approve.note")}</div>
          </div>
          <Show when={props.run.phases?.length > 0}>
            <div data-slot="permission-row">
              <span data-slot="permission-spacer" aria-hidden="true" />
              <div data-slot="permission-patterns">
                <For each={props.run.phases}>
                  {(phase) => (
                    <code class="text-text-base break-all">
                      {phase.detail ? `${phase.title}: ${phase.detail}` : phase.title}
                    </code>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
      <div data-slot="permission-footer">
        <div />
        <div data-slot="permission-footer-actions">
          <ctx.ui.Button variant="ghost" disabled={busy() || !request()} onClick={() => reply("reject")}>
            {ctx.t("ui.permission.deny")}
          </ctx.ui.Button>
          <ctx.ui.Button variant="neutral" disabled={busy() || !request()} onClick={() => reply("always")}>
            {ctx.t("ui.permission.allowAlways")}
          </ctx.ui.Button>
          <ctx.ui.Button variant="submit" disabled={busy() || !request()} onClick={() => reply("once")}>
            {ctx.t("ui.permission.allowOnce")}
          </ctx.ui.Button>
        </div>
      </div>
    </div>
  )
}

// A result: a text part for text, a code block for structured data.
function Value(props) {
  const ctx = usePlugin()
  const parsed = createMemo(() => {
    try {
      return { value: JSON.parse(props.text) }
    } catch {
      return { value: props.text }
    }
  })

  return (
    <Show
      when={typeof parsed().value === "string"}
      fallback={<ctx.ui.Code content={JSON.stringify(parsed().value, null, 2)} language="json" />}
    >
      <div data-component="text-part">
        <div data-slot="text-part-body">
          <ctx.ui.Markdown text={parsed().value} />
        </div>
      </div>
    </Show>
  )
}

// The browser panel's toolbar.
function Bar(props) {
  return <div class="h-11 shrink-0 flex items-center gap-2 px-3 border-b-[0.5px] border-v2-border-border-muted">{props.children}</div>
}

function Scroll(props) {
  return (
    <div class="min-h-0 flex-1 overflow-y-auto" data-scrollable>
      {props.children}
    </div>
  )
}

// The browser panel's back button.
function Back(props) {
  return <Action icon="outline-arrow-left" label={props.label} onClick={props.onClick} />
}

function Action(props) {
  const ctx = usePlugin()

  return (
    <ctx.ui.Tooltip value={props.label} placement="top">
      <ctx.ui.IconButton variant="ghost-muted" size="large" icon={props.icon} label={props.label} onClick={props.onClick} />
    </ctx.ui.Tooltip>
  )
}

// The subagent bar's line: the parts that are known, with one separator between neighbours.
function Meta(props) {
  const parts = () => props.parts.filter(Boolean)

  return (
    <div class="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] font-[440] leading-4 tracking-[-0.04px] tabular-nums text-v2-text-text-faint">
      <For each={parts()}>
        {(part, index) => (
          <>
            <Show when={index() > 0}>
              <span aria-hidden="true">·</span>
            </Show>
            <span class="shrink-0">{part}</span>
          </>
        )}
      </For>
    </div>
  )
}

// The state of a run or an agent, with the subagent bar's glyphs: the spinner while it works, the same spinner at
// rest while it waits, then a check, a cross, or an outlined cross.
export function Status(props) {
  const ctx = usePlugin()

  return (
    <span class="flex size-4 shrink-0 items-center justify-center text-v2-icon-icon-faint">
      <Switch fallback={<Spinner still />}>
        <Match when={props.status === "running"}>
          <Spinner />
        </Match>
        <Match when={props.status === "done" || props.status === "completed"}>
          <ctx.ui.Icon name="check" size="small" />
        </Match>
        <Match when={props.status === "failed"}>
          <ctx.ui.Icon name="circle-xmark" size="small" class="text-v2-state-fg-danger" />
        </Match>
        <Match when={props.status === "stopped"}>
          <ctx.ui.Icon name="outline-xmark" size="small" />
        </Match>
        <Match when={props.status === "denied"}>
          <ctx.ui.Icon name="circle-ban-sign" size="small" />
        </Match>
        <Match when={props.status === "pending"}>
          <ctx.ui.Icon name="warning" size="small" />
        </Match>
      </Switch>
    </span>
  )
}

function StatusLabel(props) {
  const ctx = usePlugin()

  return (
    <span class="flex items-center gap-1.5">
      <Status status={props.status} />
      {statusText(ctx, props.status)}
    </span>
  )
}

// The app's words for the states it shows for subagents, and the panel's own for the rest.
function statusText(ctx, status) {
  switch (status) {
    case "running":
      return ctx.t("session.child.status.running")
    case "done":
    case "completed":
      return ctx.t("session.child.status.succeeded")
    case "failed":
      return ctx.t("session.child.status.failed")
    case "stopped":
      return ctx.t("session.child.status.interrupted")
    default:
      return ctx.t(`wf.status.${status}`)
  }
}

// The timeline's title of a tool call.
const TITLES = {
  read: "ui.tool.read",
  list: "ui.tool.list",
  glob: "ui.tool.glob",
  grep: "ui.tool.grep",
  webfetch: "ui.tool.webfetch",
  websearch: "ui.tool.websearch",
  shell: "ui.tool.shell",
  skill: "ui.tool.skill",
  execute: "ui.tool.execute",
  edit: "ui.messagePart.title.edit",
  write: "ui.messagePart.title.write",
  patch: "ui.tool.patch",
}

function toolTitle(ctx, name) {
  if (name === "workflow_output") return ctx.t("wf.output")

  return TITLES[name] ? ctx.t(TITLES[name]) : ctx.t("ui.basicTool.called", { tool: name })
}

// The app's text shimmer, which runs over a tool's title while the tool runs.
function Shimmer(props) {
  return (
    <span
      data-component="text-shimmer"
      data-active={props.active ? "true" : "false"}
      aria-label={props.text}
      style={{ "--text-shimmer-swap": "220ms", "--text-shimmer-index": "0" }}
    >
      <span data-slot="text-shimmer-char">
        <span data-slot="text-shimmer-char-base" aria-hidden="true">
          {props.text}
        </span>
        <span data-slot="text-shimmer-char-shimmer" data-run={props.active ? "true" : "false"} aria-hidden="true">
          {props.text}
        </span>
      </span>
    </span>
  )
}

const elapsed = (ctx, ms) => time(ms, (key, params) => ctx.t(key, params))

const finished = (counts) => (counts.done ?? 0) + (counts.failed ?? 0) + (counts.stopped ?? 0)

const message = (error) => error?.message ?? String(error)

// The time each second while `ticking()` holds, for the run times of running work.
function clock(ticking) {
  const [now, setNow] = createSignal(Date.now())
  const timer = setInterval(() => {
    if (ticking()) setNow(Date.now())
  }, 1000)

  onCleanup(() => clearInterval(timer))

  return now
}
