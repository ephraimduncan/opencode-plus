---
name: workflow-authoring
description: The reference for writing dynamic workflow scripts for the workflow tool. Load it before you write or edit a workflow script, and when ultracode is on.
---

# Workflow authoring reference

A workflow structures work across many agents: to be comprehensive (decompose and cover in parallel), to be confident (independent perspectives and adversarial checks before you commit), or to take on a scale that one context cannot hold (migrations, audits, broad sweeps). The script is where you encode that structure: what fans out, what verifies, what synthesizes.

When you call the workflow tool, the right move is often **hybrid**: scout inline first (list the files, find the call sites, scope the diff) to discover the work list, then call the workflow tool to pipeline over it. You do not need to know the shape before the *task*, only before the *orchestration step*.

Common single-phase workflows that you can chain across turns:

- **Understand**: parallel readers over the relevant subsystems, then one structured map.
- **Design**: a judge panel of N independent approaches, then a scored synthesis.
- **Review**: dimensions, then find, then adversarially verify (the review-changes example).
- **Research**: a multi-modal sweep, then a deep read, then a synthesis.
- **Migrate**: discover the sites, transform each one (worktree isolation), then verify.

For larger work, run several workflows in sequence, and read each result before you decide the next phase. You stay in the loop: each workflow is one well-scoped fan-out.

**Ultracode.** When a system reminder confirms that ultracode is on, that opt-in is standing: author and run a workflow for every substantive task by default. The goal is the most exhaustive, correct answer that you can produce. Token cost is not a constraint. For multi-phase work (understand, design, implement, review), that often means several workflows in sequence, one for each phase, so that you stay in the loop between them. The quality patterns below (adversarial verify, multi-modal sweep, completeness critic, loop-until-dry) are the tools. Pick what fits the task. Lean toward orchestration with workflows and adversarial verification of your findings, unless the work is trivial or already verified. Work solo only on conversational turns or trivial mechanical edits. When a reminder says that ultracode is off, go back to the opt-in rule in the workflow tool description.

## The script

Pass the script inline through `script`. Do not write it to a file first. Each run saves its script to a file and returns the path in the tool result. To iterate on a workflow, edit that file and call the workflow tool again with `{ scriptPath: "<path>" }` instead of sending the full script again.

Every script must begin with `export const meta = {...}`:

```js
export const meta = {
  name: 'find-flaky-tests',
  description: 'Find flaky tests and propose fixes', // one line, shown in the approval
  phases: [
    // one entry for each phase() call
    { title: 'Scan', detail: 'grep test logs for retries' },
    { title: 'Fix', detail: 'one agent per flaky test' },
  ],
}

// The script body starts here. Use agent(), parallel(), pipeline(), phase(), and log().
phase('Scan')
const flaky = await agent('grep CI logs for retry markers', { schema: FLAKY_SCHEMA })
```

The `meta` object must be a PURE LITERAL: no variables, function calls, spreads, or template interpolation. The required fields are `name` and `description`. The optional fields are `whenToUse` (shown in the list of saved workflows) and `phases`. Use the SAME phase titles in `meta.phases` as in the phase() calls. The titles must match exactly. A phase() call with no matching entry gets a progress group of its own.

## The script API

- `agent(prompt: string, opts?: { label?, phase?, schema?, model?, effort?, isolation?, agentType? }): Promise<any>` starts one subagent in an OpenCode child session. Without `schema`, it returns the agent's final text as a string. With `schema` (a JSON Schema), the agent must call the `workflow_output` tool, and agent() returns the validated object: no parsing is necessary. It returns null if the user stops the agent during the run, or if the agent dies on an API error (filter with `.filter(Boolean)`).
  - `opts.label` sets the label in the Workflows panel.
  - `opts.phase` puts the agent in a progress group. Use it inside pipeline() and parallel() stages, because the global phase() state can change while stages run. The same phase string gives the same group.
  - `opts.model` sets the model as `"providerID/modelID"` or `"providerID/modelID#variant"`. Omit it by default: the agent then uses the model of this session, which is almost always correct. Set it only when you are highly confident that a different model fits the stage.
  - `opts.effort` selects a variant of the agent's model, such as `'low'`, `'medium'`, `'high'`, or `'xhigh'`, when the model has that variant. Use `'low'` for cheap mechanical stages, and the higher tiers only for the hardest verify and judge stages.
  - `opts.isolation: 'worktree'` runs the agent in a new git worktree. It is EXPENSIVE (setup time and disk for each agent). Use it ONLY when agents change files in parallel and would otherwise conflict. The worktree is removed if the agent made no changes. Otherwise it stays for review, and the agent's result names its path.
  - `opts.agentType` runs the agent as a different OpenCode agent, such as `'explore'` (read-only and fast) or a custom subagent of this project. The default is `'general'`. It works with `schema`.
- `pipeline(items, stage1, stage2, ...): Promise<any[]>` runs each item through all stages independently, with NO barrier between stages. Item A can be in stage 3 while item B is still in stage 1. This is the DEFAULT for multi-stage work. The wall-clock time is that of the slowest single-item chain, not the sum of the slowest of each stage. Each stage callback receives `(previousResult, originalItem, index)`. Use `originalItem` and `index` in later stages to label work without threading context through the return value of stage 1. A stage that throws drops its item to `null` and skips the remaining stages of that item.
- `parallel(thunks: Array<() => Promise<any>>): Promise<any[]>` runs tasks at the same time. This is a BARRIER: it waits for all thunks before it returns. A thunk that throws (or whose agent fails) resolves to `null` in the result. The call itself never rejects, so use `.filter(Boolean)` before you use the results. Use it ONLY when you need all results together.
- `log(message: string): void` shows a progress message above the phases in the Workflows panel.
- `phase(title: string): void` starts a new phase. The agent() calls after it go under this title in the Workflows panel.
- `args: any` is the value of the tool's `args` input, as given (undefined when there is none). Pass arrays and objects as JSON values in the tool call, not as a JSON-encoded string: `args: ["a.ts", "b.ts"]`, not `args: "[\"a.ts\"]"`.
- `budget: { total: number | null, spent(): number, remaining(): number }` is the token target of the run, from the tool's `budget` input (use it when the user gives a target such as "use 500k tokens"). `budget.total` is null when there is no target. `spent()` returns the output tokens of the run so far. `remaining()` returns `max(0, total - spent())`, or `Infinity` when there is no target. The target is a HARD ceiling: when `spent()` reaches `total`, more agent() calls throw. Use it for dynamic loops: `while (budget.total && budget.remaining() > 50_000) { ... }`, or for static scaling: `const FLEET = budget.total ? Math.floor(budget.total / 100_000) : 5`.
- `workflow(nameOrRef: string | { scriptPath: string }, args?: any): Promise<any>` runs a different workflow inside this run as one step, and returns its return value. Pass the name of a saved workflow, or `{ scriptPath }` for a script file. The child shares the run's agent slots, agent count, stop, and token budget, and its agents show under a group of their own. Nesting is one level only: workflow() inside a child throws.

Agents get an instruction that their final text IS the return value (not a message to a person), so they return raw data. For structured output, use the `schema` option: the tool layer validates the output, and the agent tries again when it does not match.

Schemas need `{ type: 'object', properties: {...} }` at the root, and `required` must be a subset of `properties`. agent() throws before the agent starts when a schema contradicts itself.

Agents get the same project instructions (AGENTS.md and configured instructions) that you get. Do not tell them to read those files again, or paste their rules into the prompt. Name the specific rule that a stage needs, if any. Agents cannot ask the user questions, and cannot start subagents or workflows.

Scripts are plain JavaScript, NOT TypeScript: type annotations, interfaces, and generics do not parse. The script body runs in an async context, so use `await` directly. The standard built-ins (JSON, Math, Array, RegExp) are available, EXCEPT `Date.now()`, `Math.random()`, and `new Date()` without arguments, which throw (they would break resume). Pass timestamps in through `args`, add them to results after the workflow returns, and for variety vary the agent prompt or label by index. The script has no file system, network, Node.js API, or timer access: agents read, write, and run commands, and the script coordinates them.

## Pipeline or barrier

DEFAULT TO pipeline(). Use a barrier (parallel() between stages) only when you need ALL results of the earlier stage together.

A barrier is correct ONLY when stage N needs cross-item context from all of stage N-1:

- Deduplicate or merge across the full result set before expensive downstream work.
- Exit early if the total count is zero ("0 bugs found, skip verification").
- The prompt of stage N refers to "the other findings" for comparison.

These do NOT justify a barrier:

- "I must flatten, map, or filter first": do it inside a pipeline stage: `pipeline(items, stageA, r => transform([r]).flat(), stageB)`.
- "The stages are different concepts": that is what pipeline() models. Separate stages are not synchronized stages.
- "The code is cleaner": barrier latency is real. If 5 finders run and the slowest takes 3 times as long as the fastest, a barrier wastes two thirds of the time of the fast finders.

Smell test: if you wrote this, the middle transform does not need the barrier. Write it as a pipeline with the transform inside a stage. When in doubt, use pipeline().

```js
const a = await parallel(...)
const b = transform(a) // flatten, map, filter: no cross-item dependency
const c = await parallel(b.map(...))
```

At most 16 agents run at the same time in one run (fewer on machines with fewer CPUs). More calls wait in a queue and start as slots become free. You can still pass 100 items to parallel() or pipeline(), and they all complete. A run can start at most 1000 agents in total: a stop for runaway loops, far above any real workflow. One parallel() or pipeline() call accepts at most 4096 items, and a longer list is an error, not a silent cut.

## Patterns

The canonical multi-stage pattern: pipeline by default, and each dimension verifies as soon as its review completes.

```js
export const meta = {
  name: 'review-changes',
  description: 'Review changed files across dimensions, verify each finding',
  phases: [{ title: 'Review' }, { title: 'Verify' }],
}

const DIMENSIONS = [{ key: 'bugs', prompt: '...' }, { key: 'perf', prompt: '...' }]
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
  review => parallel(review.findings.map(f => () =>
    agent(`Adversarially verify: ${f.title}`, { label: `verify:${f.file}`, phase: 'Verify', schema: VERDICT_SCHEMA })
      .then(v => ({ ...f, verdict: v })),
  )),
)
const confirmed = results.flat().filter(Boolean).filter(f => f.verdict?.isReal)
return { confirmed }
// The findings of 'bugs' verify while 'perf' still reviews: no wasted wall-clock time.
```

When a barrier IS correct: deduplicate across all findings before expensive verification.

```js
const all = await parallel(DIMENSIONS.map(d => () => agent(d.prompt, { schema: FINDINGS_SCHEMA })))
const deduped = dedupeByFileAndLine(all.filter(Boolean).flatMap(r => r.findings)) // needs ALL at once
const verified = await parallel(deduped.map(f => () => agent(verifyPrompt(f), { schema: VERDICT_SCHEMA })))
```

Loop until a count: accumulate to a target.

```js
const bugs = []
while (bugs.length < 10) {
  const result = await agent('Find bugs in this codebase.', { schema: BUGS_SCHEMA })
  bugs.push(...result.bugs)
  log(`${bugs.length}/10 found`)
}
```

Loop until the budget is spent: scale depth to a token target. Guard on `budget.total`: with no target, `remaining()` is `Infinity`, and the loop would run to the cap of 1000 agents.

```js
const bugs = []
while (budget.total && budget.remaining() > 50_000) {
  const result = await agent('Find bugs in this codebase.', { schema: BUGS_SCHEMA })
  bugs.push(...result.bugs)
  log(`${bugs.length} found, ${Math.round(budget.remaining() / 1000)}k remaining`)
}
```

Compose patterns: exhaustive review (find, deduplicate against all seen, a panel of diverse lenses, loop until dry).

```js
const seen = new Set(), confirmed = []
let dry = 0
while (dry < 2) { // loop until dry
  const found = (await parallel(FINDERS.map(f => () => // barrier: collect all finders of this round
    agent(f.prompt, { phase: 'Find', schema: BUGS })))).filter(Boolean).flatMap(r => r.bugs)
  const fresh = found.filter(b => !seen.has(key(b))) // deduplicate against ALL seen, in plain code
  if (!fresh.length) { dry++; continue }
  dry = 0; fresh.forEach(b => seen.add(key(b)))
  const judged = await parallel(fresh.map(b => () => // each fresh bug is judged at the same time...
    parallel(['correctness', 'security', 'repro'].map(lens => () => // ...by 3 different lenses
      agent(`Judge "${b.desc}" through the ${lens} lens. Is it real?`, { phase: 'Verify', schema: VERDICT })))
      .then(vs => ({ b, real: vs.filter(Boolean).filter(v => v.real).length >= 2 }))))
  confirmed.push(...judged.filter(v => v.real).map(v => v.b))
}
return confirmed
// Deduplicate against `seen`, NOT `confirmed`: else rejected findings come back each round and the loop never ends.
```

Quality patterns: common shapes. Pick by task and compose them freely.

- **Adversarial verify**: start N independent skeptics for each finding, each prompted to REFUTE it. Kill the finding if a majority refutes it. This stops plausible but wrong findings.

  ```js
  const votes = await parallel(Array.from({ length: 3 }, () => () =>
    agent(`Try to refute: ${claim}. Default to refuted=true if uncertain.`, { schema: VERDICT })))
  const survives = votes.filter(Boolean).filter(v => !v.refuted).length >= 2
  ```

- **Perspective-diverse verify**: when a finding can be wrong in more than one way, give each verifier a different lens (correctness, security, performance, does it reproduce) instead of N identical refuters. Diversity catches failure modes that redundancy cannot.
- **Judge panel**: generate N independent attempts from different angles (for example MVP-first, risk-first, user-first), score them with parallel judges, and synthesize from the winner with the best ideas of the others. This is better than one attempt with iterations when the solution space is wide.
- **Loop until dry**: for discovery of unknown size (bugs, issues, edge cases), keep starting finders until K rounds in sequence find nothing new. Simple counters (`while count < N`) miss the tail.
- **Multi-modal sweep**: parallel agents that each search in a different way (by container, by content, by entity, by time). Each one is blind to what the others find. Use it when one search angle does not find everything.
- **Completeness critic**: a final agent that asks "what is missing: a modality that did not run, a claim that is not verified, a source that nobody read?" What it finds becomes the next round of work.
- **Classify and act**: a classifier agent decides the type of the task, and the script routes to different agents for each type.
- **Tournament**: agents compete on the same task with different approaches, and judge agents compare the results in pairs until one wins.
- **No silent caps**: if a workflow limits coverage (top N, no retry, sampling), log() what it dropped. A silent cut reads as "covered everything" when it did not.

Scale to what the user asked for. "Find any bugs" gets a few finders and a single-vote verify. "Audit this thoroughly" or "be comprehensive" gets a larger pool of finders, a 3 to 5 vote adversarial pass, and a synthesis stage. When you are not sure, lean toward thoroughness for research, review, and audit requests, and toward brevity for quick checks.

These patterns are not all the patterns. Compose new harnesses when the task calls for it (tournament brackets, self-repair loops, staged escalation, whatever fits). Use the workflow tool for multi-step orchestration where the control flow must be deterministic (loops, conditions, fan-out) and not decided by the model.

## Resume

The tool result includes a run ID. To resume after a stop or a script edit, call the workflow tool again with `{ scriptPath, resumeFromRunId }`: agent() calls with an unchanged prompt and options return their earlier results at once, and new or edited calls run live. The same script with the same args gives a 100% cache hit. Agents that failed or were stopped run again. Resume works only in the session that started the run. Before you diagnose why a completed workflow returned an empty or unexpected result, read `journal.jsonl` in the run directory: it records the actual return value of each agent. Do not assume that cached results are not empty.
