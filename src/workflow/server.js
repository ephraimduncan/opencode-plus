import { execFile } from "node:child_process"
import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { Skill } from "@opencode/plugin"
import { Workflows } from "../rpc.js"
import {
  agentNote,
  description,
  INPUT,
  KEYWORD,
  NUDGE,
  OUTPUT,
  OUTPUT_DESCRIPTION,
  SKILL,
  TOOL,
  ULTRACODE,
} from "./prompts.js"
import { Run, shorten, summary } from "./run.js"
import { validate } from "./schema.js"
import { parse } from "./script.js"
import {
  appendJournal,
  readJournal,
  readRecord,
  runDirectory,
  saveWorkflow,
  savedWorkflows,
  sessionRecords,
  slug,
  writeRecord,
  writeScript,
} from "./store.js"
import { brief, summarize } from "./tools.js"

const git = promisify(execFile)

const SKILL_FILE = fileURLToPath(new URL("../../skills/workflow-authoring/SKILL.md", import.meta.url))
const REFERENCE = readFileSync(SKILL_FILE, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").trim()

// Tools that a workflow agent does not get: no nested workflows, no subagents, and no questions to the user.
const WITHHELD = [TOOL, "subagent", "question"]

const ACTIVE = ["pending", "running", "paused"]
const NUDGES = 2
const OUTPUT_RETRIES = 5
const RESULT_LIMIT = 40_000
const FLUSH = 250
const SAVE = 2000

// Plugins load once for each location (directory) on the server, but a run belongs to the session that started it, and
// its agents can run in other locations, such as a worktree. The state lives on the process, so that every instance
// sees the same runs and agents.
const shared = (globalThis[Symbol.for("opencode-plus.workflows")] ??= {
  // runID: the run's entry.
  runs: new Map(),
  // Child session ID: the agent that runs in it.
  agents: new Map(),
  // Session ID: the model of its last request, which agents inherit.
  models: new Map(),
  // Session IDs whose latest prompt holds the keyword "ultracode".
  keyword: new Set(),
  // Session ID: whether ultracode is on.
  ultracode: new Map(),
})

// Adds dynamic workflows to one plugin instance: the workflow tool and its output tool, the notes for workflow agents,
// ultracode, saved workflows as commands, and the methods of the Workflows panel. Returns the cleanup.
export async function workflows(ctx, options) {
  const owner = Symbol(ctx.location.directory)
  const controller = new AbortController()

  const rpc = await ctx.rpc.register(Workflows, {
    list: async (input) => ({ runs: list(input.sessionID) }),
    get: async (input) => ({ run: overview(entry(input.runID, input.sessionID)) }),
    agent: async (input) => ({ agent: detail(entry(input.runID, input.sessionID), input.agentID) }),
    stop: async (input) => (live(input.runID).stop(), {}),
    pause: async (input) => (live(input.runID).pause(), {}),
    resume: async (input) => (live(input.runID).resume(), {}),
    stopAgent: async (input) => (live(input.runID).stopAgent(input.agentID), {}),
    save: async (input) => ({ path: await save(input) }),
    ultracode: async (input) => ({ on: await ultracode(input.sessionID, input.on) }),
  })

  await ctx.tool.transform((editor) => {
    editor.add({
      name: TOOL,
      description: description(options.workflowSize),
      input: INPUT,
      options: { codemode: false },
      execute: (input, context) => launch(input, context),
    })
    editor.add({
      name: OUTPUT,
      description: OUTPUT_DESCRIPTION,
      input: { type: "object", additionalProperties: true },
      options: { codemode: false },
      execute: async (input, context) => output(input, context),
    })
  })

  await ctx.skill.transform((editor) =>
    editor.add({
      id: Skill.ID.make(SKILL),
      name: Skill.Name.make(SKILL),
      description:
        "The reference for writing dynamic workflow scripts for the workflow tool. Load it before you write or edit a workflow script, and when ultracode is on.",
      path: SKILL_FILE,
      content: REFERENCE,
    }),
  )

  await ctx.command.transform((editor) => {
    for (const saved of savedWorkflows(ctx.location.directory).values())
      editor.add({
        name: saved.name,
        description: saved.description,
        execute: ({ sessionID, prompt, delivery }) =>
          ctx.session.prompt({ ...prompt, sessionID, delivery, text: invocation(saved.name, prompt.text) }),
      })
    editor.add({
      name: "ultracode",
      description: "Turn on ultracode for this session: every substantive task runs as a workflow. `/ultracode off` turns it off.",
      execute: async ({ sessionID, prompt, delivery }) => {
        const text = prompt.text.trim()
        const on = !/^off$/i.test(text)

        await ultracode(sessionID, on)
        if (on && text && !/^on$/i.test(text)) await ctx.session.prompt({ ...prompt, sessionID, delivery, text })
      },
    })
  })

  await ctx.session.hook("prompt", (event) => {
    if (/\bultracode\b/i.test(event.prompt.text)) shared.keyword.add(event.sessionID)
    else shared.keyword.delete(event.sessionID)
  })

  await ctx.session.hook("context", async (event) => {
    const agent = shared.agents.get(event.sessionID)

    if (agent) {
      event.system.push({ type: "text", text: agentNote(agent) })
      for (const name of WITHHELD) delete event.tools[name]
      if (!agent.schema) delete event.tools[OUTPUT]
      else if (event.tools[OUTPUT]) event.tools[OUTPUT].input = agent.schema
      else {
        // A policy can still deny the tool. Without it the agent cannot return its result, so it stops before it works.
        agent.fatal ??= `agent({ schema }): the agent does not have the ${OUTPUT} tool, so it cannot return a result. A permission rule or policy denies it.`
        void ctx.session.interrupt({ sessionID: event.sessionID }).catch(() => undefined)
      }

      return
    }

    shared.models.set(event.sessionID, event.model)
    delete event.tools[OUTPUT]
    if (!event.tools[TOOL]) return

    const on = await ultracode(event.sessionID)

    if (on || shared.keyword.has(event.sessionID))
      event.system.push({ type: "text", text: `${on ? ULTRACODE : KEYWORD}\n\n${REFERENCE}` })
  })

  void follow(controller.signal)

  async function launch(input, context) {
    const sessionID = context.sessionID

    if (shared.agents.has(sessionID)) throw new Error("A workflow agent cannot start a workflow.")

    const session = await ctx.session.get({ sessionID })
    const directory = session.location.directory
    const { source, cached } = await script(input, sessionID, directory)
    const { meta, code } = parse(source)
    const id = `wf_${randomBytes(6).toString("hex")}`
    const folder = runDirectory(sessionID, id)
    const scriptPath = writeScript(folder, source)
    const item = {
      id,
      sessionID,
      projectID: session.projectID,
      directory,
      folder,
      scriptPath,
      meta,
      toolCall: context.id,
      status: "pending",
      created: Date.now(),
      owner,
      dirty: new Set(),
    }

    shared.runs.set(id, item)
    shared.keyword.delete(sessionID)
    changed(item)

    try {
      await ctx.permission.assert({
        sessionID,
        agent: context.agent,
        source: { type: "tool", messageID: context.messageID, id: context.id },
        action: TOOL,
        resources: [meta.name],
        save: [meta.name],
        metadata: { name: meta.name, description: meta.description, phases: meta.phases.map((phase) => phase.title) },
      })
    } catch (error) {
      item.status = "denied"
      item.ended = Date.now()
      changed(item, true)
      shared.runs.delete(id)
      throw error
    }

    // The cleanup of the plugin dropped the run while it waited, so nothing could stop or pause it.
    if (controller.signal.aborted) throw new Error("OpenCode stopped the workflow plugin before the run could start.")

    item.run = new Run({
      id,
      meta,
      code,
      args: input.args,
      total: typeof input.budget === "number" && input.budget > 0 ? input.budget : null,
      cached,
      concurrency: options.workflowConcurrency,
      spawn: (agent, tools) => spawn(item, agent, tools),
      resolve: (ref) => reference(ref, directory),
      journal: (entry) => appendJournal(folder, entry),
      onChange: (agent) => {
        if (agent) item.dirty.add(agent.id)
        changed(item)
      },
    })
    void item.run
      .start()
      .then(() => finished(item))
      .catch((error) => console.error("opencode-plus: the end of a workflow run", error))

    const phases = meta.phases.length ? ` Phases: ${meta.phases.map((phase) => phase.title).join(" → ")}.` : ""

    return {
      content: [
        `Workflow "${meta.name}" started in the background (run ID: ${id}).${phases}`,
        `Script: ${scriptPath}`,
        `Run directory: ${folder}`,
        cached.length ? `Resumed from ${input.resumeFromRunId}: ${cached.length} earlier agent results are cached.` : "",
        "A <workflow-notification> with the result arrives in this session when the run ends. Do NOT poll, wait, or duplicate its work. Tell the user that it runs (they can watch it in the Workflows panel), then continue with work that does not overlap, or end your response.",
      ]
        .filter(Boolean)
        .join("\n"),
      metadata: { runID: id, name: meta.name, scriptPath },
    }
  }

  // The source of the script to run, and the cached agent results when the call resumes an earlier run.
  async function script(input, sessionID, directory) {
    const earlier = input.resumeFromRunId
    let cached = []

    if (earlier) {
      const item = shared.runs.get(earlier)

      if (item && ACTIVE.includes(status(item)))
        throw new Error(`Run ${earlier} is still running. Stop it in the Workflows panel first, or wait for it to end.`)
      if (!existsSync(runDirectory(sessionID, earlier)))
        throw new Error(`nothing to resume: this session has no run ${earlier}. Start the workflow over as a new run.`)
      cached = readJournal(runDirectory(sessionID, earlier))
    }

    if (input.scriptPath) {
      const path = isAbsolute(input.scriptPath) ? input.scriptPath : resolve(directory, input.scriptPath)

      if (!existsSync(path)) throw new Error(`The script file ${path} does not exist.`)

      return { source: readFileSync(path, "utf8"), cached }
    }

    if (input.script) return { source: input.script, cached }

    if (input.name) {
      const saved = savedWorkflows(directory).get(input.name)

      if (!saved)
        throw new Error(
          `There is no saved workflow named "${input.name}". Saved workflows: ${[...savedWorkflows(directory).keys()].join(", ")}.`,
        )

      return { source: saved.source, cached }
    }

    if (earlier) return { source: readFileSync(join(runDirectory(sessionID, earlier), "script.js"), "utf8"), cached }

    throw new Error("Provide script, name, scriptPath, or resumeFromRunId.")
  }

  // The source of a workflow() step: a saved workflow's name or `{ scriptPath }`.
  async function reference(ref, directory) {
    if (typeof ref === "string") {
      const saved = savedWorkflows(directory).get(ref)

      if (!saved) throw new Error(`workflow(): there is no saved workflow named "${ref}".`)

      return { source: saved.source }
    }

    const path = isAbsolute(ref.scriptPath) ? ref.scriptPath : resolve(directory, ref.scriptPath)

    if (!existsSync(path)) throw new Error(`workflow(): the script file ${path} does not exist.`)

    return { source: readFileSync(path, "utf8") }
  }

  // Runs one agent in a child session of the run's session, and resolves its result.
  async function spawn(item, agent, { signal, update }) {
    const options = agent.options
    const kind = options.agentType ?? "general"
    const profile = await ctx.agent
      .get({ agentID: kind, location: { directory: item.directory } })
      .then((result) => result.data)
      .catch(() => undefined)

    if (!profile) throw new Error(`agent(): there is no agent type "${kind}". Use 'general', 'explore', or a subagent of this project.`)
    if (profile.mode === "primary") throw new Error(`agent(): "${kind}" is a primary agent and cannot run as a subagent.`)

    const model = await choose(item, profile, options, agent)

    if (signal.aborted) return null

    const worktree = options.isolation === "worktree" ? await isolate(item, agent) : undefined
    let child
    const interrupt = () => void ctx.session.interrupt({ sessionID: child.id }).catch(() => undefined)

    try {
      child = await ctx.session.create({
        parentID: item.sessionID,
        title: agent.label,
        agent: profile.id ?? kind,
        ...(model && { model }),
        ...(worktree && { location: { directory: worktree.directory } }),
        ...(options.schema !== undefined && { permissions: await allowOutput(item.sessionID) }),
        metadata: { "opencode-plus.workflow": { runID: item.id, agentID: agent.id } },
      })

      const binding = {
        schema: options.schema,
        worktree: worktree?.directory,
        directory: item.directory,
        update,
        tools: new Map(),
        failures: 0,
      }

      shared.agents.set(child.id, binding)
      update({
        sessionID: child.id,
        ...(model && { model: `${model.providerID}/${model.id}${model.variant ? `#${model.variant}` : ""}` }),
        ...(worktree && { directory: worktree.directory }),
      })
      // A stop that came while the session started has already fired, so its listener would never run.
      signal.addEventListener("abort", interrupt, { once: true })
      if (signal.aborted) return null

      await ctx.session.prompt({ sessionID: child.id, text: agent.prompt })
      await ctx.session.wait({ sessionID: child.id })

      for (let nudge = 0; binding.schema && binding.output === undefined && !binding.fatal && nudge < NUDGES; nudge++) {
        if (signal.aborted) break
        await ctx.session.prompt({ sessionID: child.id, text: NUDGE })
        await ctx.session.wait({ sessionID: child.id })
      }

      const info = await ctx.session.get({ sessionID: child.id })

      update({ tokens: info.tokens, cost: info.cost })
      if (signal.aborted) return null
      if (binding.fatal) throw new Error(binding.fatal)

      const messages = await ctx.session.context({ sessionID: child.id })
      const last = messages.findLast((message) => message.type === "assistant")

      // A terminal API error resolves to null, as in Claude Code, so a fan-out continues.
      if (info.outcome === "failed" || last?.error) {
        const error = last?.error?.message ?? "the agent failed"

        update({ error })
        item.run.log(`[${agent.label}] ${error}`)

        return null
      }

      if (binding.schema) {
        if (binding.output === undefined)
          throw new Error(`agent({ schema }): the agent completed without a call to ${OUTPUT}, after ${NUDGES} reminders.`)

        return binding.output
      }

      const text = final(last)

      return worktree ? `${text}\n\n(Worktree kept for review: ${worktree.directory})` : text
    } finally {
      signal.removeEventListener("abort", interrupt)
      if (child) shared.agents.delete(child.id)
      if (worktree) await release(item, worktree)
    }
  }

  // The model of an agent: the one in its options, else the one its agent type sets, else the one of the session that
  // started the run. Its effort selects a variant when the model has one by that name.
  async function choose(item, profile, options, agent) {
    let model = options.model ? modelReference(options.model) : (profile.model ?? shared.models.get(item.sessionID))

    if (!options.model && !options.effort) return model
    if (!model) model = (await ctx.session.get({ sessionID: item.sessionID })).model
    if (!model) return undefined

    const available = await ctx.model.list({ location: { directory: item.directory } }).then((result) => result.data)
    const info = available.find(
      (entry) => entry.providerID === model.providerID && (entry.id === model.id || entry.modelID === model.id),
    )

    if (options.model && !info)
      throw new Error(`agent(): the model "${options.model}" is not available. Omit \`model\` to use the session's model.`)
    if (options.effort) {
      if (info?.variants?.some((variant) => variant.id === options.effort)) model = { ...model, variant: options.effort }
      else
        item.run.log(
          `[${agent.label}] effort "${options.effort}" is not a variant of ${model.providerID}/${model.id}, so the agent uses the model's default`,
        )
    }

    return model
  }

  // The rules of a structured agent's session: the parent's, which a session inherits only when it sets none, and an
  // allow for the output tool. OpenCode checks a session's rules after its agent's, and the last match wins, so the
  // allow holds for agents that deny every tool they do not list, such as explore.
  async function allowOutput(sessionID) {
    const parent = await ctx.session.get({ sessionID })

    return [...(parent.permissions ?? []), { action: OUTPUT, resource: "*", effect: "allow" }]
  }

  async function isolate(item, agent) {
    const created = await ctx.worktree.create({
      projectID: item.projectID,
      name: `${slug(item.meta.name)}-${agent.id}-${randomBytes(2).toString("hex")}`,
    })
    const head = await git("git", ["-C", created.directory, "rev-parse", "HEAD"]).then((result) => result.stdout.trim())

    return { directory: created.directory, head }
  }

  // Removes the agent's worktree when the agent left it as it found it.
  async function release(item, worktree) {
    try {
      const [status, head] = await Promise.all([
        git("git", ["-C", worktree.directory, "status", "--porcelain"]).then((result) => result.stdout.trim()),
        git("git", ["-C", worktree.directory, "rev-parse", "HEAD"]).then((result) => result.stdout.trim()),
      ])

      if (!status && head === worktree.head)
        await ctx.worktree.remove({ projectID: item.projectID, directory: worktree.directory, force: false })
    } catch {
      // A worktree that cannot be checked stays, as a changed one does.
    }
  }

  // The structured output of a workflow agent: validated against the agent's schema, so the agent tries again on a
  // mismatch, and failed after five mismatches.
  function output(input, context) {
    const agent = shared.agents.get(context.sessionID)

    if (!agent?.schema) throw new Error(`${OUTPUT} is only for workflow agents that must return structured output.`)

    const errors = validate(agent.schema, input)

    if (errors.length === 0) {
      agent.output = input

      return { content: "Recorded. End your turn now." }
    }

    agent.failures++
    if (agent.failures >= OUTPUT_RETRIES) {
      agent.fatal = `agent({ schema }): ${agent.failures} calls of ${OUTPUT} did not match the schema. The last mismatch: ${errors[0]}`
      void ctx.session.interrupt({ sessionID: context.sessionID }).catch(() => undefined)
    }

    throw new Error(`The output does not match the required shape:\n${errors.slice(0, 20).join("\n")}\nCall ${OUTPUT} again with a corrected shape.`)
  }

  // Delivers the end of a run to its session, which wakes the session's agent for a completed or failed run. The ended
  // run leaves memory: its record on disk serves the panel from now on.
  async function finished(item) {
    changed(item, true)
    shared.runs.delete(item.id)

    const run = item.run
    const status = run.status
    const result = run.result === undefined ? undefined : JSON.parse(run.result)
    const text = result === undefined ? "" : typeof result === "string" ? result : JSON.stringify(result, null, 2)
    let body = text

    if (text.length > RESULT_LIMIT) {
      const path = join(item.folder, "result.json")

      writeFileSync(path, run.result)
      body = `${text.slice(0, RESULT_LIMIT)}\n… (cut at ${RESULT_LIMIT} characters: the full result is in ${path})`
    }

    const agents = run.agents.length
    const failed = run.agents.filter((agent) => agent.status === "failed").length
    const logs = run.logs.slice(-20).map((log) => `- ${log.message}`)
    const notice = [
      `<workflow-notification runID="${item.id}" name="${item.meta.name}" status="${status}" agents="${agents}"${failed ? ` failed="${failed}"` : ""} duration="${duration(run.ended - run.started)}" outputTokens="${run.spent}">`,
      status === "completed" ? `Result:\n${body || "(the script returned nothing)"}` : "",
      run.error ? `Error: ${run.error}` : "",
      status === "stopped"
        ? `The user stopped the run. Completed agent results are cached: to continue, call ${TOOL} with { scriptPath, resumeFromRunId: "${item.id}" } when the user asks.`
        : "",
      logs.length ? `Log:\n${logs.join("\n")}` : "",
      `Script: ${item.scriptPath}`,
      `Journal: ${join(item.folder, "journal.jsonl")}`,
      "</workflow-notification>",
    ]
      .filter(Boolean)
      .join("\n")

    await ctx.session
      .synthetic({
        sessionID: item.sessionID,
        text: notice,
        description: `Workflow ${item.meta.name} ${status}`,
        metadata: { source: "workflow", runID: item.id, status },
        // A stop came from the user, who does not need a reply to it; the notice waits for the next turn.
        ...(status === "stopped" && { resume: false }),
      })
      .catch(() => undefined)
  }

  // Publishes the run's change to the panel, at most every FLUSH ms, and saves it to disk at most every SAVE ms. An ended
  // run saves each change, such as the last tokens of its stopped agents.
  function changed(item, now = false) {
    const flush = () => {
      clearTimeout(item.flushTimer)
      item.flushTimer = undefined

      const run = item.run
      const agents = run ? [...item.dirty].flatMap((id) => run.agents.filter((agent) => agent.id === id).map(summary)) : []

      item.dirty.clear()
      publish("changed", { sessionID: item.sessionID, run: header(snapshot(item)), agents })

      if (now || run?.ended || Date.now() - (item.savedAt ?? 0) >= SAVE) {
        item.savedAt = Date.now()
        // An ended run keeps the full prompts and results of its agents, for the panel after a restart.
        const record = snapshot(item)

        if (run?.ended) record.agents = run.agents.map((agent) => detail(item, agent.id))
        writeRecord(item.folder, record)
      }
    }

    if (now) return flush()
    item.flushTimer ??= setTimeout(flush, FLUSH)
  }

  // The runs of a session, newest first. A stored run that was still active when OpenCode closed shows as stopped.
  function list(sessionID) {
    const current = [...shared.runs.values()].filter((item) => item.sessionID === sessionID)
    const ids = new Set(current.map((item) => item.id))
    const stored = sessionRecords(sessionID)
      .filter((record) => !ids.has(record.id))
      .map((record) => (ACTIVE.includes(record.status) ? { ...record, status: "stopped" } : record))

    return [...current.map(snapshot), ...stored].map(header).sort((a, b) => b.created - a.created)
  }

  // A live run, or the stored record of an ended one in `sessionID`.
  function entry(runID, sessionID) {
    const item = shared.runs.get(runID)

    if (item) return item

    const record = sessionID && readRecord(runDirectory(sessionID, runID))

    if (record) return { record, sessionID, scriptPath: record.scriptPath }

    throw new Error(`There is no run ${runID}.`)
  }

  function live(runID) {
    const run = shared.runs.get(runID)?.run

    if (!run) throw new Error(`Run ${runID} is not running.`)

    return run
  }

  function status(item) {
    return item.run?.status ?? item.status
  }

  function snapshot(item) {
    if (item.record) return item.record

    const base = {
      id: item.id,
      sessionID: item.sessionID,
      name: item.meta.name,
      description: item.meta.description,
      created: item.created,
      scriptPath: item.scriptPath,
      folder: item.folder,
      toolCall: item.toolCall,
    }

    if (!item.run)
      return { ...base, status: item.status, phases: item.meta.phases, agents: [], logs: [], spent: 0, ...(item.ended && { ended: item.ended }) }

    return { ...base, ...item.run.snapshot() }
  }

  // The run for the panel's run view, with the rows of its agents.
  function overview(item) {
    const run = snapshot(item)

    return item.record ? { ...run, agents: run.agents.map(shorten) } : run
  }

  // An agent with its full prompt and result.
  function detail(item, agentID) {
    const agent = item.run?.agents.find((candidate) => candidate.id === agentID)

    if (agent)
      return {
        ...summary(agent),
        prompt: agent.prompt,
        ...(agent.result != null && { result: agent.result }),
        ...(agent.options.schema && { schema: agent.options.schema }),
      }

    const stored = snapshot(item).agents.find((candidate) => candidate.id === agentID)

    if (!stored) throw new Error(`There is no agent ${agentID} in this run.`)

    return stored
  }

  async function save({ runID, sessionID, scope }) {
    const item = entry(runID, sessionID)
    const record = snapshot(item)
    const source = readFileSync(item.scriptPath, "utf8")
    const saved = saveWorkflow({ source, name: record.name, scope, directory: item.directory ?? ctx.location.directory })

    await ctx.command.reload()

    return saved
  }

  async function ultracode(sessionID, on) {
    const key = `ultracode/${sessionID}`

    if (on !== undefined) {
      shared.ultracode.set(sessionID, on)
      await ctx.storage.set(key, on)
      publish("ultracode", { sessionID, on })

      return on
    }

    if (!shared.ultracode.has(sessionID)) shared.ultracode.set(sessionID, (await ctx.storage.get(key)) === true)

    return shared.ultracode.get(sessionID)
  }

  // Follows the events of workflow agents' sessions, for the tool calls and tokens that the panel shows.
  async function follow(signal) {
    try {
      for await (const event of ctx.event.subscribe({
        signal,
        types: ["session.tool.input.started", "session.tool.called", "session.usage.updated"],
      })) {
        const agent = shared.agents.get(event.data.sessionID)

        if (!agent) continue
        if (event.type === "session.tool.input.started") agent.tools.set(event.data.id, { name: event.data.name })
        if (event.type === "session.tool.called") {
          const tool = agent.tools.get(event.data.id) ?? { name: "tool" }

          tool.called = true
          agent.update({
            toolCalls: [...agent.tools.values()].filter((item) => item.called).length,
            lastTool: { name: tool.name, summary: summarize(event.data.input, agent.worktree ?? agent.directory) },
          })
        }
        if (event.type === "session.usage.updated") agent.update({ tokens: event.data.tokens, cost: event.data.cost })
      }
    } catch (error) {
      if (!signal.aborted) console.error("opencode-plus: workflow events stopped", error)
    }
  }

  // Sends an event to the panels. An event that a panel misses is not fatal: the next change carries the whole run.
  function publish(name, data) {
    void rpc.events.emit(name, data).catch((error) => {
      if (!controller.signal.aborted) console.error(`opencode-plus: the workflow event ${name}`, error)
    })
  }

  return async () => {
    controller.abort()
    for (const item of shared.runs.values()) {
      if (item.owner !== owner) continue
      item.run?.stop()
      clearTimeout(item.flushTimer)
      shared.runs.delete(item.id)
    }
    await rpc.dispose()
  }
}

// A run without its agents, with the count of its agents in each state and its result on one line: what a list of
// runs and each change carry.
function header(run) {
  const { agents = [], result, ...rest } = run
  const counts = { total: agents.length }

  for (const agent of agents) counts[agent.status] = (counts[agent.status] ?? 0) + 1

  return { ...rest, logs: (run.logs ?? []).slice(-50), counts, ...(result !== undefined && { brief: brief(result, 300) }) }
}

// The prompt of a saved workflow's command: the user's text becomes the run's args.
function invocation(name, text) {
  const input = text.trim()

  return [
    `The user ran the saved workflow command /${name}. Call the ${TOOL} tool now with name: "${name}".`,
    input
      ? `Pass the user's input as \`args\`, as the string below, or as the structure that the script expects if it reads a list or an object:\n${input}`
      : "The user gave no input, so omit `args` unless the script needs it.",
  ].join("\n")
}

// `providerID/modelID#variant` as a model reference.
function modelReference(text) {
  const [path, variant] = text.split("#")
  const at = path.indexOf("/")

  if (at <= 0) throw new Error(`agent(): the model "${text}" must be "providerID/modelID" or "providerID/modelID#variant".`)

  return { providerID: path.slice(0, at), id: path.slice(at + 1), ...(variant && { variant }) }
}

// The final text of an agent's last message, as the built-in subagent tool reads it.
function final(message) {
  const text = (message?.content ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n\n")

  return text || "(The agent completed without a text response.)"
}

function duration(ms) {
  const seconds = Math.round(ms / 1000)

  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
