import { quote } from "./branch.js"
import { set } from "./dom.js"
import { ROW, control, project } from "./sidebar.js"

// A session row's third line names the branch of its folder (OpenCode Desktop 2.2.5): one span holds the branch icon,
// then the name. A row of a session on another server ends the line with a server icon, which `ms-auto` pushes to the
// end. The badge of the branch's pull request follows the branch, like T3 Code's badge.

const LINE = `${ROW} > span:nth-of-type(3)`
const NAME = ':scope > span > span[dir="ltr"]'

const BADGE = "data-plus-pr"
const LINK = "data-plus-pr-url"

// Look up a branch's pull request again after this time, or when a session on the branch stops working.
const STALE = 2 * 60 * 1000

// Lucide's icons, as T3 Code uses them for each state.
const icon = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
const icons = {
  open: icon(
    '<circle cx="5" cy="6" r="3"/><path d="M5 9v12"/><circle cx="19" cy="18" r="3"/><path d="m15 9-3-3 3-3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/>',
  ),
  draft: icon(
    '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><path d="M6 9v12"/>',
  ),
  merged: icon('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),
  closed: icon(
    '<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>',
  ),
}

// T3 Code's colors: emerald, zinc, violet, and red at 600, or at 300 and 90% in dark mode (zinc at 400 and 80%).
const colors = {
  open: ["oklch(59.6% 0.145 163.225)", "oklch(84.5% 0.143 164.978 / 0.9)"],
  draft: ["oklch(55.2% 0.016 285.938)", "oklch(70.5% 0.015 286.067 / 0.8)"],
  merged: ["oklch(54.1% 0.281 293.009)", "oklch(81.1% 0.111 293.571 / 0.9)"],
  closed: ["oklch(57.7% 0.245 27.325)", "oklch(80.8% 0.114 19.571 / 0.9)"],
}

export const css = `
[${BADGE}] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
  padding-inline: 2px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
[${BADGE}] ~ .ms-auto {
  margin-inline-start: 0;
}
[${BADGE}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${BADGE}]::before {
  content: "";
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  background-color: var(--plus-pr);
}
${Object.keys(icons)
  .map(
    (state) => `[${BADGE}="${state}"] {
  --plus-pr: ${colors[state][0]};
}
[data-color-scheme="dark"] [${BADGE}="${state}"] {
  --plus-pr: ${colors[state][1]};
}
[${BADGE}="${state}"]::before {
  mask: url("data:image/svg+xml,${encodeURIComponent(icons[state])}") center / 12px no-repeat;
}`,
  )
  .join("\n")}
`

// The shell command that prints the URL of the folder's `origin` remote, then, as JSON, the pull requests whose head
// is a branch named `branch`.
export const command = (branch) =>
  "git remote get-url origin && GH_NO_UPDATE_NOTIFIER=1 gh pr list --state all --limit 20 " +
  `--json number,title,url,state,isDraft,updatedAt,headRepositoryOwner --head ${quote(branch)} 2>/dev/null`

// The pull request in the output of `command`: the most recently updated open one, else the most recently updated.
// Only pull requests from the owner of `origin` count, so a fork's pull request from its own `main` does not show on
// `main`. Its state is "open", "draft", "merged", or "closed". Undefined when the branch has none.
export function latest(output) {
  const [remote, ...json] = output.trim().split(/\r?\n/)
  const owner = remote.match(/[:/]([^/:]+)\/[^/]+$/)?.[1].toLowerCase()
  const list = JSON.parse(json.join("\n"))
    .filter((pull) => pull.headRepositoryOwner?.login.toLowerCase() === owner)
    .toSorted((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  const pull = list.find((item) => item.state === "OPEN") ?? list[0]

  if (!pull) return
  const state = pull.state === "OPEN" && pull.isDraft ? "draft" : pull.state.toLowerCase()

  return { number: pull.number, title: pull.title, url: pull.url, state }
}

// Each project and branch's pull request: when its lookup ended, and what it found. A lookup under way has no `time`.
const found = new Map()

// The branches that a working session was on at the last pass.
let working = new Set()

// Lookups run one at a time.
let queue = Promise.resolve()

// Shows a badge after the branch of each session row whose branch has a pull request. `lookup(project, branch)`
// resolves to the pull request, as `latest` gives it, and the next pass shows what it found. A click on a badge runs
// `open(url)`, and `label(pull)` gives the badge its tooltip.
export function show({ lookup, open, label }) {
  const now = Date.now()
  const lines = Array.from(document.querySelectorAll(LINE), (line) => {
    const name = line.querySelector(NAME)
    const branch = name?.textContent.trim()
    const row = line.parentElement

    return { line, row, branch, key: branch && `${project(row)}\n${branch}`, holder: name?.parentElement }
  })
  const busy = new Set(
    lines.filter(({ row, key }) => key && row.getAttribute("data-status") === "working").map(({ key }) => key),
  )

  // A session that stops working may have made a pull request.
  working.forEach((key) => {
    const entry = found.get(key)

    if (!busy.has(key) && entry?.time !== undefined) entry.time = 0
  })
  working = busy

  lines.forEach(({ line, row, branch, key, holder }) => {
    const entry = key && found.get(key)
    let badge = line.querySelector(`:scope > [${BADGE}]`)

    if (key && (!entry || (entry.time !== undefined && now - entry.time >= STALE)))
      load(key, () => lookup(project(row), branch))

    const pull = entry?.pull

    if (!pull) return badge?.remove()

    if (!badge) {
      badge = document.createElement("span")
      badge.setAttribute("role", "link")
      control(badge, () => open(badge.getAttribute(LINK)))
    }

    const text = label(pull)

    if (badge.previousElementSibling !== holder) holder.after(badge)
    set(badge, BADGE, pull.state)
    set(badge, LINK, pull.url)
    set(badge, "title", text)
    set(badge, "aria-label", text)
    if (badge.textContent !== `#${pull.number}`) badge.textContent = `#${pull.number}`
  })
}

const load = (key, lookup) => {
  const task = queue.then(lookup).catch(() => undefined)

  found.set(key, { pull: found.get(key)?.pull })
  queue = task
  task.then((pull) => found.set(key, { time: Date.now(), pull }))
}

// Removes every badge, as when the plugin stops.
export function clean() {
  found.clear()
  working = new Set()
  document.querySelectorAll(`[${BADGE}]`).forEach((badge) => badge.remove())
}
