import { quote } from "./branch.js"
import { set } from "./dom.js"
import { ROW, control } from "./sidebar.js"

// When the folder of a session has a branch, the second line of its row shows a branch icon after the project's name
// (OpenCode Desktop 2.2.6). The icon is a tooltip, which names the branch only while the pointer rests on it. The badge
// of the branch's pull request follows the icon, like T3 Code's badge.

const ICON = ':scope > span:nth-of-type(2) > span:first-of-type > [data-component="tooltip-v2-trigger"] use[href$="-branch"]'

const BADGE = "data-plus-pr"
const LINK = "data-plus-pr-url"

// Look up a branch's pull request again after this time, or when a session on the branch stops working.
const STALE = 2 * 60 * 1000

// Lucide's icons, as T3 Code uses them for each state.
const icon = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
export const icons = {
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
export const colors = {
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
  padding-inline: 2px;
  border-radius: 4px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
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

// The pull request in the output of `command`. Only pull requests from the owner of `origin` count, so a fork's pull
// request from its own `main` does not show on `main`. Undefined when the branch has none.
export function latest(output) {
  const [remote, ...json] = output.trim().split(/\r?\n/)
  const origin = owner(remote)?.toLowerCase()

  return pick(
    JSON.parse(json.join("\n"))
      .filter((pull) => pull.headRepositoryOwner?.login.toLowerCase() === origin)
      .map((pull) => ({
        number: pull.number,
        title: pull.title,
        url: pull.url,
        state: pull.state === "OPEN" && pull.isDraft ? "draft" : pull.state.toLowerCase(),
        updatedAt: pull.updatedAt,
      })),
  )
}

// The owner of the repository at `remote`, the URL of a git remote.
export const owner = (remote) => remote.trim().match(/[:/]([^/:]+)\/[^/]+$/)?.[1]

// The shell command that asks GitHub's REST API for the pull requests whose head is the branch `branch` of `login`,
// as `command` finds them. With the ETag of an earlier answer, GitHub answers 304 when nothing changed, and does not
// count the request against the rate limit. Thus, the archive can ask every few seconds.
export const ask = (login, branch, etag) =>
  "GH_NO_UPDATE_NOTIFIER=1 gh api --include " +
  (etag ? `--header ${quote(`If-None-Match: ${etag}`)} ` : "") +
  quote(`repos/{owner}/{repo}/pulls?state=all&per_page=20&head=${login}:${encodeURIComponent(branch)}`) +
  " 2>/dev/null"

// GitHub's answer to `ask`: its ETag, and the pull request as `latest` gives it, with `closedAt`, GitHub's time of its
// merge or close, or null. Undefined when nothing changed, or when the request was not successful.
export function answer(output) {
  const [head, ...body] = output.split(/\r?\n\r?\n/)

  if (!/^HTTP\/\S+ 200\b/.test(head)) return

  const pull = pick(
    JSON.parse(body.join("\n\n")).map((pull) => ({
      number: pull.number,
      title: pull.title,
      url: pull.html_url,
      state: pull.merged_at ? "merged" : pull.state === "open" && pull.draft ? "draft" : pull.state,
      closedAt: pull.closed_at,
      updatedAt: pull.updated_at,
    })),
  )

  return { etag: head.match(/^etag: *(.*?)\s*$/im)?.[1], pull }
}

// The pull request of a branch: the most recently updated open one, else the most recently updated. Its state is
// "open", "draft", "merged", or "closed".
const pick = (list) => {
  const sorted = list.toSorted((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))

  return sorted.find((pull) => pull.state === "open" || pull.state === "draft") ?? sorted[0]
}

// Each folder and branch's pull request: when its lookup ended, and what it found. A lookup under way has no `time`.
const found = new Map()

// The branches that a working session was on at the last pass.
let working = new Set()

// Lookups run one at a time.
let queue = Promise.resolve()

// Shows a badge after the branch icon of each session row whose branch has a pull request. `locate(row)` gives the
// row's folder and branch as `{ directory, branch }`, or undefined when it cannot tell. `lookup(place)` resolves to the
// pull request of that branch, as `latest` gives it, and the next pass shows what it found. A click on a badge runs
// `open(url)`, and `label(pull)` gives the badge its tooltip.
export function show({ locate, lookup, open, label }) {
  const now = Date.now()
  const rows = Array.from(document.querySelectorAll(ROW), (row) => {
    const icon = row.querySelector(ICON)?.closest('[data-component="tooltip-v2-trigger"]')
    const place = icon && locate(row)

    return { row, icon, place, key: place && `${place.directory}\n${place.branch}` }
  })
  const busy = new Set(
    rows.filter(({ row, key }) => key && row.getAttribute("data-status") === "working").map(({ key }) => key),
  )

  // A session that stops working may have made a pull request.
  working.forEach((key) => {
    const entry = found.get(key)

    if (!busy.has(key) && entry?.time !== undefined) entry.time = 0
  })
  working = busy

  rows.forEach(({ row, icon, place, key }) => {
    const entry = key && found.get(key)
    let badge = row.querySelector(`[${BADGE}]`)

    if (key && (!entry || (entry.time !== undefined && now - entry.time >= STALE))) load(key, () => lookup(place))

    const pull = entry?.pull

    if (!pull) return badge?.remove()

    if (!badge) {
      badge = document.createElement("span")
      badge.setAttribute("role", "link")
      control(badge, () => open(badge.getAttribute(LINK)))
    }

    const text = label(pull)

    if (badge.previousElementSibling !== icon) icon.after(badge)
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
