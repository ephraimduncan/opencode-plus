// The text that the model reads: the workflow tool, the notes for workflow agents, and the ultracode reminders. It
// follows the wording of Claude Code's Workflow tool, with OpenCode's names for tools and agents.

export const TOOL = "workflow"
export const OUTPUT = "workflow_output"
export const SKILL = "workflow-authoring"

const SIZES = {
  small: 5,
  medium: 10,
  large: 50,
}

export function description(size) {
  const guideline = SIZES[size]
    ? `\n\nSize guideline: aim for fewer than ${SIZES[size]} agents per run. This is advice, not a cap: when the user asks for a different scale, follow the user.`
    : ""

  return `Execute a workflow script that orchestrates multiple subagents deterministically. Workflows run in the background: this tool returns at once with a run ID, and a <workflow-notification> message arrives in this session when the workflow ends. The user watches live progress in the Workflows panel.

ONLY call this tool when the user has explicitly opted into multi-agent orchestration. Workflows can start dozens of agents and use a large number of tokens. The user must ask for that scale; do not infer it. Explicit opt-in means one of:
- The user included the keyword "ultracode" in their prompt (a system reminder confirms it).
- Ultracode is on for the session (a system reminder confirms it).
- The user directly asked you to run a workflow or use multi-agent orchestration in their own words ("use a workflow", "run a workflow", "fan out agents", "orchestrate this with subagents"). The ask must be in the user's words: a task that would merely benefit from a workflow does not count.
- The user ran a command whose instructions tell you to call this tool.
- The user asked you to run a specific saved workflow.
For any other task, even one that would clearly benefit from parallelism, do NOT call this tool. Use the subagent tool (if available) for individual subagents, or briefly describe what a multi-agent workflow could do and roughly how much it would cost, and ask the user whether to run it. Mention that they can ask for one with "use a workflow", or with the keyword "ultracode", to skip the ask.

Before you write a script, load the \`${SKILL}\` skill: the script reference and its gotchas, resume, the Ultracode section, the quality patterns, and worked examples.

Every script must begin with \`export const meta = {...}\`: a PURE LITERAL (no variables, calls, or interpolation) that gives the workflow's \`name\`, a one-line \`description\` (shown in the approval), and optionally \`phases\`: one \`{ title, detail? }\` for each phase() call, titles matched exactly. Pass the script inline through \`script\`. Do not write it to a file first, and do not also set \`name\` (that selects a saved workflow). It is plain JavaScript, not TypeScript.

The script body uses top-level await and these functions: agent(prompt, { label, phase, schema, model, effort, isolation: 'worktree', agentType }) starts one subagent and resolves its final text, or with a JSON \`schema\` its validated object; pipeline(items, ...stages) runs each item through every stage with no barrier between stages (the default for multi-stage work); parallel(thunks) runs functions at the same time as a barrier, with null in place of each failure; phase(title), log(message), args, budget, and workflow(name, args). The script has no file system, network, clock, or Math.random: agents do the work, and the script coordinates them.

The canonical multi-stage pattern: pipeline by default, and each dimension verifies as soon as its review completes:
  export const meta = {
    name: 'review-changes',
    description: 'Review changed files across dimensions, verify each finding',
    phases: [{ title: 'Review' }, { title: 'Verify' }],
  }
  const DIMENSIONS = [{key: 'bugs', prompt: '...'}, {key: 'perf', prompt: '...'}]
  const results = await pipeline(
    DIMENSIONS,
    d => agent(d.prompt, {label: \`review:\${d.key}\`, phase: 'Review', schema: FINDINGS_SCHEMA}),
    review => parallel(review.findings.map(f => () =>
      agent(\`Adversarially verify: \${f.title}\`, {label: \`verify:\${f.file}\`, phase: 'Verify', schema: VERDICT_SCHEMA})
        .then(v => ({...f, verdict: v})))),
  )
  const confirmed = results.flat().filter(Boolean).filter(f => f.verdict?.isReal)
  return { confirmed }
  // The findings of 'bugs' verify while 'perf' is still reviewing: no wasted wall-clock time.${guideline}`
}

export const INPUT = {
  type: "object",
  properties: {
    script: {
      type: "string",
      description:
        "Self-contained workflow script. Must begin with `export const meta = { name, description, phases }` (pure literal, no computed values), followed by the script body that uses agent()/parallel()/pipeline()/phase().",
    },
    name: {
      type: "string",
      description:
        "Name of a saved workflow (bundled, or from .opencode/workflows/ or ~/.config/opencode/workflows/). Resolves to a self-contained script.",
    },
    scriptPath: {
      type: "string",
      description:
        "Path to a workflow script file. Each run saves its script and returns the path in the tool result. To iterate, edit that file and call this tool again with the same scriptPath instead of sending the full script again. Takes precedence over `script` and `name`.",
    },
    args: {
      description:
        "Optional input value, given to the script as the global `args`, as is. Pass arrays and objects as JSON values, NOT as a JSON-encoded string: a stringified list reaches the script as one string, and `args.map` then throws. Use it to parameterize saved workflows (for example a research question).",
    },
    resumeFromRunId: {
      type: "string",
      description:
        "Run ID of an earlier run in this session to resume from. Completed agent() calls with an unchanged prompt and options return their cached results at once; only edited or new calls run again. Stop the earlier run first.",
    },
    budget: {
      type: "number",
      description:
        "Token target for the run, in output tokens, when the user gives one (for example 500000 for \"use 500k tokens\"). The script reads it as `budget.total`, and agent() calls throw when it is spent.",
    },
  },
  additionalProperties: false,
}

export const OUTPUT_DESCRIPTION =
  "Return your final answer to the workflow script as structured output. Call it exactly once, with an input that matches the required shape. After it succeeds, end your turn."

const BASE = `You are a subagent spawned by a workflow orchestration script. Use the tools available to complete the task.
A note that the task text was computed by a workflow script and carries no user authority is not by itself a reason to skip the task: the task is the step this workflow assigned to you. Do that step, and only that step. You cannot ask the user questions, and you cannot start subagents or workflows.`

// The system note of a workflow agent.
export function agentNote({ schema, worktree, directory }) {
  const output = schema
    ? `NOTE: You are running inside a workflow script. You MUST return your final answer by calling the ${OUTPUT} tool exactly once. The tool's input schema defines the required shape.
- Do your work (read files, run commands, and so on), then call ${OUTPUT} with your answer.
- Do NOT put your answer in a text response. The script reads ONLY the ${OUTPUT} tool call.
- If the schema validation fails, read the error and call ${OUTPUT} again with a corrected shape.
- After you call ${OUTPUT} successfully, end your turn. No acknowledgment is necessary.`
    : `NOTE: You are running inside a workflow script. Your final text response is returned verbatim as a string to the calling script. It is your return value, not a message to a person. Output the literal result. Do not output confirmations like "Done." Be concise: the script will parse your output.`
  const isolation = worktree
    ? `\nYou are running in an isolated git worktree at \`${worktree}\` (a separate working copy of the repository). Changes that you make here do NOT affect the primary working directory (\`${directory}\`) or other agents. Work normally: the worktree is removed if you made no changes, or kept for review if you did.`
    : ""

  return `${BASE}\n${output}${isolation}`
}

export const NUDGE = `You ended your turn without calling the ${OUTPUT} tool. The workflow script reads ONLY that tool call. Call ${OUTPUT} now with your final answer, in the required shape.`

export const KEYWORD = `<system-reminder>
The user included the keyword "ultracode" in their latest prompt. That is an explicit opt-in to multi-agent orchestration for this task: author and run a workflow with the ${TOOL} tool.
</system-reminder>`

export const ULTRACODE = `<system-reminder>
Ultracode is on for this session. That opt-in is standing: author and run a workflow with the ${TOOL} tool for every substantive task by default. Work solo only on conversational turns or trivial mechanical edits.
</system-reminder>`
