// Numbers, times, and groups for the Workflows panel.

// `1234` as "1.2k", `1_500_000` as "1.5M".
export function tokens(count) {
  if (!count) return "0"
  if (count < 1000) return String(count)
  if (count < 1_000_000) return `${trim(count / 1000)}k`

  return `${trim(count / 1_000_000)}M`
}

const trim = (value) => (value >= 100 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, ""))

// Run time as the app's activity menu writes it, with the app's strings through `t`: 12s, 1m 05s, 1h 02m. The trailing
// unit is padded, so a ticking time keeps its width.
export function elapsed(ms, t) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (value) => String(value).padStart(2, "0")

  if (total < 60) return t("ui.message.duration.seconds", { count: String(total) })
  if (total < 3600)
    return t("ui.message.duration.minutesSeconds", { minutes: String(Math.floor(total / 60)), seconds: pad(total % 60) })

  return t("ui.message.duration.hoursMinutes", {
    hours: String(Math.floor(total / 3600)),
    minutes: pad(Math.floor(total / 60) % 60),
  })
}

// The output and reasoning tokens of an agent: the work it did, not the context it read.
export const spent = (agent) => (agent.tokens?.output ?? 0) + (agent.tokens?.reasoning ?? 0)

// The agents of a run in groups by phase, in the order of the run's phases, then in the order that other phases first
// show up. Agents without a phase come last, in a group with no title.
export function groups(phases, agents) {
  const titles = phases.map((phase) => phase.title)
  const byTitle = new Map(titles.map((title) => [title, []]))
  const loose = []

  for (const agent of agents) {
    if (agent.phase === undefined) loose.push(agent)
    else {
      if (!byTitle.has(agent.phase)) byTitle.set(agent.phase, [])
      byTitle.get(agent.phase).push(agent)
    }
  }

  const list = [...byTitle].map(([title, items]) => ({
    title,
    detail: phases.find((phase) => phase.title === title)?.detail,
    agents: items,
  }))

  return loose.length ? [...list, { title: undefined, agents: loose }] : list
}

// The order of agents in a run: a2 before a10.
export const order = (a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1))

// How many agents of `agents` are in each state, and how many are finished.
export function counts(agents) {
  const result = { total: agents.length, done: 0, running: 0, queued: 0, failed: 0, stopped: 0 }

  for (const agent of agents) result[agent.status] = (result[agent.status] ?? 0) + 1

  return { ...result, finished: result.done + result.failed + result.stopped }
}

export const active = (status) => status === "pending" || status === "running" || status === "paused"
