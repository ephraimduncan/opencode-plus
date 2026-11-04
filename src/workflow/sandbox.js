import vm from "node:vm"
import { isMainThread, parentPort, workerData } from "node:worker_threads"
import { compile, parse } from "./script.js"

// Runs a workflow script in a context of its own: the script sees only the workflow API and the standard JavaScript
// built-ins, not Node, the file system, or the clock. The host runs this file in a worker thread, so that a script that
// loops forever cannot stop the OpenCode server, and so that a stop can end the thread.

// Most items that one parallel() or pipeline() call accepts.
const MAX_ITEMS = 4096

// Runs `code` (from `parse`) and resolves the JSON of its return value. `bridge` connects the script to the host:
// `agent(requestJSON)` resolves the JSON of the agent's result, or null; `log(message)` and `phase(title)` report
// progress; `spent()` returns the output tokens of the run so far; `resolve(ref)` returns the source of a saved workflow.
export async function execute(code, options, bridge) {
  const context = vm.createContext({}, { codeGeneration: { strings: false, wasm: false } })
  const api = vm.runInContext(BOOT, context, { filename: "workflow-runtime.js" })

  api(
    {
      agent: (request) => bridge.agent(request),
      log: (message) => bridge.log(message),
      phase: (title) => bridge.phase(title),
      spent: () => bridge.spent(),
      workflow: (request) => nested(JSON.parse(request), options, bridge),
    },
    JSON.stringify({
      args: options.args ?? null,
      total: options.total ?? null,
      phase: options.phase ?? null,
      prefix: options.prefix ?? "",
      nested: !!options.nested,
      max: MAX_ITEMS,
    }),
  )

  // An error of the host's realm would reach the host's Function through its constructor, so the refusal is the
  // context's own Error.
  const LocalError = vm.runInContext("Error", context)
  const refuse = () => {
    throw new LocalError("Workflow scripts cannot load modules. Put work that needs a library in an agent's task.")
  }
  const value = await compile(code, options.name, refuse).runInContext(context)

  return json(value)
}

// Runs a saved workflow, or a script file, inside the run as one step. Its agents count toward the same limits and show
// under a group of their own. A nested workflow cannot nest again.
async function nested({ ref, args }, options, bridge) {
  if (options.nested) throw new Error("workflow() cannot run inside a nested workflow: nesting is one level only.")

  const { source } = await bridge.resolve(ref)
  const { meta, code } = parse(source)

  return execute(
    code,
    { name: meta.name, args, total: options.total, nested: true, phase: `workflow: ${meta.name}`, prefix: `${meta.name}: ` },
    bridge,
  )
}

function json(value) {
  if (value === undefined) return "null"

  try {
    return JSON.stringify(value) ?? "null"
  } catch (error) {
    throw new Error(`The workflow returned a value that is not JSON: ${error.message}`)
  }
}

// Evaluated inside the context, so that every value the script gets is of the context's own realm: arrays from
// parallel() pass `instanceof Array`, and errors are the context's Error.
const BOOT = `(function boot(bridge, configJSON) {
  "use strict"
  const config = JSON.parse(configJSON)
  const RealDate = Date
  const unstable = (what) => {
    throw new Error(what + " is not available in a workflow script, because a resumed run must make the same agent() calls. Pass a timestamp in through args, or vary prompts by index.")
  }
  function WorkflowDate(...values) {
    if (!new.target) unstable("Date()")
    if (values.length === 0) unstable("new Date() without arguments")
    return new RealDate(...values)
  }
  WorkflowDate.prototype = RealDate.prototype
  WorkflowDate.parse = RealDate.parse
  WorkflowDate.UTC = RealDate.UTC
  WorkflowDate.now = () => unstable("Date.now()")
  Object.defineProperty(globalThis, "Date", { value: WorkflowDate, writable: false, configurable: false })
  // Without this, new Date(0).constructor is the real Date again.
  Object.defineProperty(RealDate.prototype, "constructor", { value: WorkflowDate, writable: false, configurable: false })
  Math.random = () => unstable("Math.random()")
  if ("Temporal" in globalThis)
    Object.defineProperty(globalThis, "Temporal", { get: () => unstable("Temporal"), configurable: false })
  // A date format with no date formats the current time.
  const formats = Intl.DateTimeFormat.prototype
  const format = Object.getOwnPropertyDescriptor(formats, "format").get
  const formatToParts = formats.formatToParts
  Object.defineProperty(formats, "format", {
    get() {
      const bound = format.call(this)
      return (date) => (date === undefined ? unstable("Intl.DateTimeFormat format() without a date") : bound(date))
    },
  })
  formats.formatToParts = function (date) {
    return date === undefined ? unstable("Intl.DateTimeFormat formatToParts() without a date") : formatToParts.call(this, date)
  }

  // A call that fails without a handler would otherwise end the process as an unhandled rejection.
  const quiet = (promise) => {
    promise.catch(() => {})
    return promise
  }
  const message = (error) => String(error?.message ?? error)
  const budgetError = (error) => error?.name === "WorkflowBudgetExceededError"
  const fromHost = (promise) =>
    new Promise((resolve, reject) =>
      promise.then(
        (json) => resolve(json === null || json === undefined ? null : JSON.parse(json)),
        (error) => {
          const local = new Error(message(error))
          if (error?.name) local.name = error.name
          reject(local)
        },
      ),
    )

  let phase = config.phase ?? undefined

  const agent = (prompt, opts) =>
    quiet(
      new Promise((resolve, reject) => {
        if (typeof prompt !== "string" || !prompt.trim()) throw new TypeError("agent() needs a prompt string as its first argument")
        if (opts !== undefined && opts !== null && (typeof opts !== "object" || Array.isArray(opts)))
          throw new TypeError("agent() options must be an object")
        const options = { ...(opts ?? {}) }
        if (options.phase !== undefined) options.phase = config.prefix + String(options.phase)
        else if (phase !== undefined) options.phase = phase
        fromHost(bridge.agent(JSON.stringify({ prompt, opts: options }))).then(resolve, reject)
      }),
    )

  const settle = (kind, settled) => {
    let dropped = 0
    const results = settled.map((entry, index) => {
      if (entry.status === "fulfilled") return entry.value
      if (budgetError(entry.reason)) {
        dropped++
        return null
      }
      bridge.log(kind + "[" + index + "] failed: " + message(entry.reason))
      return null
    })
    if (dropped > 0) bridge.log(kind + ": " + dropped + " " + (dropped === 1 ? "slot" : "slots") + " dropped, token budget exceeded")
    return results
  }

  const items = (kind, list) => {
    if (list.length > config.max)
      throw new RangeError(kind + "() accepts at most " + config.max + " items; got " + list.length + ". Split the list.")
  }

  const parallel = (thunks) =>
    quiet(
      (async () => {
        await null
        if (!Array.isArray(thunks)) throw new TypeError("parallel() expects an array of functions")
        items("parallel", thunks)
        for (const thunk of thunks)
          if (typeof thunk !== "function")
            throw new TypeError("parallel() expects an array of functions, not promises. Wrap each call: () => agent(...)")
        const settled = await Promise.allSettled(thunks.map(async (thunk) => thunk()))
        return settle("parallel", settled)
      })(),
    )

  const pipeline = (list, ...stages) =>
    quiet(
      (async () => {
        await null
        if (!Array.isArray(list)) throw new TypeError("pipeline() expects an array as the first argument")
        items("pipeline", list)
        for (const stage of stages)
          if (typeof stage !== "function") throw new TypeError("pipeline() stages must be functions: pipeline(items, item => ..., result => ...)")
        const settled = await Promise.allSettled(
          list.map(async (item, index) => {
            let value = await item
            for (const stage of stages) {
              if (value === null) break
              value = await stage(value, item, index)
            }
            return value
          }),
        )
        return settle("pipeline", settled)
      })(),
    )

  const workflow = (ref, args) =>
    quiet(
      new Promise((resolve, reject) => {
        if (config.nested) throw new Error("workflow() cannot run inside a nested workflow: nesting is one level only.")
        const valid = typeof ref === "string" ? ref.trim() : typeof ref?.scriptPath === "string"
        if (!valid) throw new TypeError("workflow() takes a saved workflow's name or { scriptPath }")
        fromHost(bridge.workflow(JSON.stringify({ ref, args: args ?? null }))).then(resolve, reject)
      }),
    )

  const define = (name, value) => Object.defineProperty(globalThis, name, { value, writable: false, configurable: false })
  define("agent", agent)
  define("parallel", parallel)
  define("pipeline", pipeline)
  define("workflow", workflow)
  define("phase", (title) => {
    phase = config.prefix + String(title)
    bridge.phase(phase)
  })
  define("log", (value) => bridge.log(typeof value === "string" ? value : JSON.stringify(value)))
  define("args", config.args)
  define("budget", Object.freeze({
    total: config.total,
    spent: () => bridge.spent(),
    remaining: () => (config.total === null ? Infinity : Math.max(0, config.total - bridge.spent())),
  }))
  const print = (...values) => bridge.log(values.map((value) => (typeof value === "string" ? value : JSON.stringify(value))).join(" "))
  define("console", Object.freeze({ log: print, info: print, warn: print, error: print, debug: print }))
})`

// The worker side of the host's sandbox: requests go to the host as messages, and replies come back by call number.
if (!isMainThread && workerData?.workflow) {
  const pending = new Map()
  let spent = 0
  let next = 0

  const request = (type, payload) =>
    new Promise((resolve, reject) => {
      const call = next++

      pending.set(call, { resolve, reject })
      parentPort.postMessage({ type, call, payload })
    })

  parentPort.on("message", (message) => {
    if (message.type === "spent") return void (spent = message.spent)

    const waiting = pending.get(message.call)

    if (!waiting) return
    pending.delete(message.call)
    if (message.error) {
      const error = new Error(message.error.message)

      error.name = message.error.name ?? "Error"
      waiting.reject(error)
    } else waiting.resolve(message.value)
  })

  const { code, name, args, total } = workerData.workflow

  execute(
    code,
    { name, args, total },
    {
      agent: (body) => request("agent", body),
      resolve: (ref) => request("resolve", ref),
      log: (text) => parentPort.postMessage({ type: "log", message: text }),
      phase: (title) => parentPort.postMessage({ type: "phase", title }),
      spent: () => spent,
    },
  ).then(
    (value) => parentPort.postMessage({ type: "done", value }),
    (error) => parentPort.postMessage({ type: "failed", error: { name: error?.name, message: error?.stack ?? String(error) } }),
  )
}
