import { createHash } from "node:crypto"
import { availableParallelism } from "node:os"
import { Worker } from "node:worker_threads"
import { check } from "./schema.js"
import { brief } from "./tools.js"

// Most agents one run can start, a stop for loops that never end.
const MAX_AGENTS = 1000

// Agents that run at the same time, unless the plugin options set another count.
const CONCURRENCY = Math.max(1, Math.min(16, availableParallelism() - 2))

const PREVIEW = 300

// One run of a workflow script. The script runs in a worker thread; each agent() call comes here, waits for a free
// slot, and runs through `spawn`. Every change calls `onChange`, so the caller can publish the run's state.
//
// `spawn(agent, { signal, update })` runs one agent and resolves its result, or null when the agent stopped or died on
// an API error. `update(patch)` reports progress such as tokens and tool calls. `resolve(ref)` resolves `{ source }`
// for workflow(). `journal(entry)` records each finished agent, and `cached` holds the entries of an earlier run: an
// agent() call with the same prompt and options returns its earlier result instead of running again.
export class Run {
  constructor(options) {
    this.id = options.id
    this.meta = options.meta
    this.code = options.code
    this.args = options.args
    this.total = options.total ?? null
    this.spawn = options.spawn
    this.resolve = options.resolve
    this.journal = options.journal ?? (() => {})
    this.onChange = options.onChange ?? (() => {})
    this.concurrency = options.concurrency ?? CONCURRENCY
    this.maxAgents = options.maxAgents ?? MAX_AGENTS
    this.cache = new Map()
    for (const entry of options.cached ?? []) this.cache.set(entry.key, [...(this.cache.get(entry.key) ?? []), entry.result])

    this.status = "running"
    this.phases = this.meta.phases.map((phase) => ({ ...phase }))
    this.agents = []
    this.logs = []
    this.spent = 0
    this.result = undefined
    this.error = undefined
    this.started = Date.now()
    this.ended = undefined
    this.controller = new AbortController()
    this.running = 0
    this.waiting = []
  }

  // Runs the script to its end. Resolves when the run completes, fails, or stops; never rejects.
  start() {
    this.done ??= new Promise((resolve) => {
      this.finish = resolve
      this.worker = new Worker(new URL("./sandbox.js", import.meta.url), {
        workerData: { workflow: { code: this.code, name: this.meta.name, args: this.args ?? null, total: this.total } },
        // Node calls the sandbox's import() handler only with this flag, and otherwise rejects with an error of its own
        // realm. Bun calls the handler without it.
        execArgv: ["--experimental-vm-modules"],
      })
      this.worker.on("message", (message) => this.receive(message))
      this.worker.on("error", (error) => this.end("failed", { error: error?.message ?? String(error) }))
      this.worker.on("exit", (code) => {
        if (this.status === "running" || this.status === "paused")
          this.end("failed", { error: `The workflow runtime stopped with exit code ${code}.` })
      })
    })

    return this.done
  }

  pause() {
    if (this.status !== "running") return
    this.status = "paused"
    this.onChange()
  }

  resume() {
    if (this.status !== "paused") return
    this.status = "running"
    this.wake()
    this.onChange()
  }

  // Stops the run: running agents stop, queued ones never start, and the script ends where it waits.
  stop() {
    if (this.status !== "running" && this.status !== "paused") return
    this.end("stopped")
  }

  // Stops one agent. Its agent() call resolves to null, as in Claude Code, and the script continues.
  stopAgent(id) {
    const agent = this.agents.find((item) => item.id === id)

    if (agent?.status === "queued" || agent?.status === "running") agent.controller.abort("stopped")
  }

  receive(message) {
    switch (message.type) {
      case "agent":
        return this.reply(message.call, () => this.agent(JSON.parse(message.payload)))
      case "resolve":
        return this.reply(message.call, () => this.resolve(message.payload))
      case "log":
        return this.log(message.message)
      case "phase":
        this.addPhase(message.title)
        return this.onChange()
      case "done":
        return this.end("completed", { result: message.value })
      case "failed":
        return this.end("failed", { error: describe(message.error, this.meta.name) })
    }
  }

  reply(call, work) {
    Promise.resolve()
      .then(work)
      .then(
        (value) => this.worker?.postMessage({ call, value }),
        (error) => this.worker?.postMessage({ call, error: { name: error?.name, message: error?.message ?? String(error) } }),
      )
  }

  async agent({ prompt, opts }) {
    if (this.controller.signal.aborted) throw new Error("The workflow stopped.")
    if (this.agents.length >= this.maxAgents)
      throw new Error(
        `The workflow reached its cap of ${this.maxAgents} agent() calls. A loop that never ends causes this: add a hard iteration cap to the loop, or pass a token budget.`,
      )
    if (this.total !== null && this.spent >= this.total) {
      const error = new Error(`The token budget of ${this.total} is spent (${this.spent} output tokens).`)

      error.name = "WorkflowBudgetExceededError"
      throw error
    }

    const options = sanitize(opts)

    if (options.schema !== undefined) check(options.schema)

    const key = hash({ prompt, ...options, label: undefined, phase: undefined })
    const agent = {
      id: `a${this.agents.length + 1}`,
      label: options.label ?? preview(prompt.trim().split("\n")[0], 60),
      phase: options.phase,
      prompt,
      options,
      key,
      status: "queued",
      queued: Date.now(),
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      cost: 0,
      toolCalls: 0,
      controller: new AbortController(),
    }

    if (options.phase) this.addPhase(options.phase)
    this.agents.push(agent)

    const cached = this.cache.get(key)?.shift()

    if (cached !== undefined) {
      Object.assign(agent, { status: "done", cached: true, result: cached, ended: Date.now() })
      this.journal({ key, result: cached })
      this.onChange(agent)

      return cached
    }

    this.onChange(agent)

    const signal = AbortSignal.any([this.controller.signal, agent.controller.signal])

    try {
      await this.slot(signal)
    } catch {
      return this.settle(agent, "stopped", { result: null })
    }

    agent.status = "running"
    agent.started = Date.now()
    this.onChange(agent)

    try {
      const value = await this.spawn(agent, {
        signal,
        update: (patch) => {
          if (patch.tokens) this.spent += patch.tokens.output - agent.tokens.output
          Object.assign(agent, patch)
          this.worker?.postMessage({ type: "spent", spent: this.spent })
          this.onChange(agent)
        },
      })
      const result = value === null || value === undefined ? null : JSON.stringify(value)

      if (result !== null) this.journal({ key, result })

      // Besides a stop, spawn resolves null for an agent that died on an API error. Its agent() call still gets null.
      return this.settle(agent, signal.aborted ? "stopped" : result === null ? "failed" : "done", { result })
    } catch (error) {
      if (signal.aborted) return this.settle(agent, "stopped", { result: null })
      this.settle(agent, "failed", { error: error?.message ?? String(error) })
      throw error
    } finally {
      this.running--
      this.wake()
    }
  }

  settle(agent, status, { result, error }) {
    Object.assign(agent, { status, ended: Date.now(), ...(result !== undefined && { result }), ...(error && { error }) })
    this.onChange(agent)

    return result ?? null
  }

  // Waits for a free agent slot while the run is not paused. Rejects when `signal` aborts first.
  slot(signal) {
    if (this.status === "running" && this.running < this.concurrency) {
      this.running++

      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const entry = {
        resolve: () => {
          signal.removeEventListener("abort", abort)
          this.running++
          resolve()
        },
      }
      const abort = () => {
        this.waiting = this.waiting.filter((item) => item !== entry)
        reject(signal.reason)
      }

      if (signal.aborted) return abort()
      signal.addEventListener("abort", abort, { once: true })
      this.waiting.push(entry)
    })
  }

  wake() {
    while (this.status === "running" && this.running < this.concurrency && this.waiting.length > 0)
      this.waiting.shift().resolve()
  }

  addPhase(title) {
    if (!this.phases.some((phase) => phase.title === title)) this.phases.push({ title })
  }

  log(message) {
    this.logs.push({ time: Date.now(), message })
    this.onChange()
  }

  end(status, { result, error } = {}) {
    if (this.ended) return
    this.status = status
    this.result = result
    this.error = error
    this.ended = Date.now()
    for (const agent of this.agents)
      if (agent.status === "queued" || agent.status === "running") Object.assign(agent, { status: "stopped", ended: this.ended })
    this.controller.abort(status)
    void this.worker?.terminate()
    this.worker = undefined
    this.onChange()
    this.finish?.()
  }

  // The run as the panel shows it: counts, phases, and agents without their full prompts and results.
  snapshot() {
    return {
      id: this.id,
      name: this.meta.name,
      description: this.meta.description,
      status: this.status,
      phases: this.phases,
      agents: this.agents.map(summary),
      logs: this.logs.slice(-200),
      spent: this.spent,
      total: this.total,
      started: this.started,
      ...(this.ended && { ended: this.ended }),
      ...(this.error && { error: this.error }),
      ...(this.result !== undefined && { result: this.result }),
    }
  }
}

// The agent as a row of the panel shows it.
export function summary(agent) {
  return {
    id: agent.id,
    label: agent.label,
    ...(agent.phase && { phase: agent.phase }),
    status: agent.status,
    ...(agent.cached && { cached: true }),
    prompt: preview(agent.prompt, PREVIEW),
    ...(agent.options.agentType && { agentType: agent.options.agentType }),
    ...(agent.options.isolation && { isolation: agent.options.isolation }),
    ...(agent.options.schema && { structured: true }),
    ...(agent.model && { model: agent.model }),
    ...(agent.sessionID && { sessionID: agent.sessionID }),
    ...(agent.directory && { directory: agent.directory }),
    queued: agent.queued,
    ...(agent.started && { started: agent.started }),
    ...(agent.ended && { ended: agent.ended }),
    tokens: agent.tokens,
    cost: agent.cost,
    toolCalls: agent.toolCalls,
    ...(agent.lastTool && { lastTool: agent.lastTool }),
    ...(agent.error && { error: agent.error }),
    ...(agent.result !== undefined && agent.result !== null && { result: brief(agent.result, PREVIEW) }),
  }
}

// A stored agent, which keeps its full prompt and result for the agent view, as a row of the panel shows it.
export function shorten({ schema, ...agent }) {
  return {
    ...agent,
    prompt: preview(agent.prompt, PREVIEW),
    ...(agent.result != null && { result: brief(agent.result, PREVIEW) }),
  }
}

// The options the host acts on. The script's other keys are dropped, so they cannot change the journal key.
function sanitize(opts = {}) {
  const text = (value, name) => {
    if (value === undefined || value === null) return undefined
    if (typeof value !== "string") throw new TypeError(`agent() option \`${name}\` must be a string`)

    return value
  }
  const isolation = text(opts.isolation, "isolation")

  if (isolation !== undefined && isolation !== "worktree")
    throw new TypeError("agent() option `isolation` accepts only 'worktree'")

  const options = {
    label: text(opts.label, "label"),
    phase: text(opts.phase, "phase"),
    model: text(opts.model, "model"),
    effort: text(opts.effort, "effort"),
    agentType: text(opts.agentType, "agentType"),
    isolation,
    schema: opts.schema ?? undefined,
  }

  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
}

function preview(value, length) {
  if (typeof value !== "string") return value

  return value.length > length ? `${value.slice(0, length - 1)}…` : value
}

function hash(value) {
  return createHash("sha256").update(stable(value)).digest("hex")
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(",")}}`

  return JSON.stringify(value) ?? "null"
}

// An error of the script as one line, with the script line it came from when the stack names one.
function describe(error, name) {
  const text = error?.message ?? String(error)
  const first = text.split("\n")[0]
  const line = new RegExp(`${escape(name)}\\.js:(\\d+)`).exec(text)?.[1]

  return line ? `${first} (script line ${line})` : first
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
