import { quote } from "./branch.js"
import * as card from "./card.js"
import { mark, set } from "./dom.js"
import { address } from "./github/format.js"
import { ROW, control } from "./sidebar.js"

// The second line of a session row starts with the project's name, then the worktree and branch icons of the session's
// folder (OpenCode Desktop 2.2.6). The badge of the pull requests that the session made follows them, like T3 Code's
// badge. The sessions of a folder share its branch, so the pull request of the branch does not tell which session made
// it.

const LINE = ":scope > span:nth-of-type(2) > span:first-of-type"

const BADGE = "data-plus-pr"
const LINK = "data-plus-pr-url"
// On the badge of a session that made more than one pull request: how many the badge does not name.
const MORE = "data-plus-pr-more"
const LIST = "data-plus-pr-list"

// Look up the pull requests of a session again after this time, or when the session stops working.
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
${ROW} [${BADGE}]:is(:hover, :focus-visible) {
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
[${MORE}]::after {
  content: "+" attr(${MORE});
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
/* The card of a badge with more than one pull request: a line for each, like the items of the app's menus. */
[${LIST}] {
  display: flex;
  flex-direction: column;
  width: max-content;
  padding: 4px;
}
[${LIST}] > [role="link"] {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding-inline: 6px;
  border-radius: 4px;
  white-space: nowrap;
  color: var(--v2-text-text-base);
}
[${LIST}] > [role="link"]:is(:hover, :focus-visible) {
  outline: none;
  background-color: var(--v2-overlay-simple-overlay-hover);
}
[${LIST}] [${BADGE}] {
  padding: 0;
  font-size: inherit;
  color: var(--v2-text-text-muted);
}
[${LIST}] [${BADGE}] + span {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}
`

// The pull requests that a session made after its message `seen`, as their addresses, the oldest first, and the id of
// its newest complete message, which the next scan takes as `seen`. `page(cursor)` resolves to a page of the session's
// assistant messages, the newest first. A message that the model still writes can get a pull request later, so it is
// not `seen`.
export async function scan(page, seen) {
  const urls = []
  let newest
  let cursor

  do {
    const { data, cursor: { next } } = await page(cursor)

    for (const message of data) {
      if (message.id === seen) return { seen: newest ?? seen, urls }
      if (message.time.completed !== undefined) newest ??= message.id
      urls.unshift(...made(message))
    }

    // The page after the last one is empty.
    cursor = data.length > 0 ? next : undefined
  } while (cursor)

  return { seen: newest ?? seen, urls }
}

const CREATE = /\bgh\s+pr\s+create\b/

// The addresses of the pull requests that the shell commands of an assistant message made with `gh pr create`. `gh`
// prints the address of the new pull request on a line of its own. When the branch has a pull request, `gh` makes none
// and prints the address of that one after "already exists:".
const made = (message) =>
  message.content
    .filter((part) => part.type === "tool" && part.state.status === "completed")
    .filter((part) => CREATE.test(part.state.input.command ?? ""))
    .flatMap((part) => part.state.content)
    .flatMap((output) => (output.type === "text" ? output.text.split(/\r?\n/) : []))
    .flatMap((line, index, lines) => {
      const url = address(line.trim())

      return url && /\/pull\/\d+$/.test(url) && !/already exists:\s*$/.test(lines[index - 1] ?? "") ? [url] : []
    })

// The shell command that prints each of the pull requests at `urls` as a line of JSON. A pull request that `gh` cannot
// read prints nothing.
export const view = (urls) =>
  urls
    .map((url) => `GH_NO_UPDATE_NOTIFIER=1 gh pr view ${quote(url)} --json number,title,url,state,isDraft 2>/dev/null`)
    .join("; ")

// The pull requests in the output of `view`. The state of each is "open", "draft", "merged", or "closed".
export const read = (output) =>
  output
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const pull = JSON.parse(line)

      return {
        number: pull.number,
        title: pull.title,
        url: pull.url,
        state: pull.state === "OPEN" && pull.isDraft ? "draft" : pull.state.toLowerCase(),
      }
    })

// The owner of the repository at `remote`, the URL of a git remote.
export const owner = (remote) => remote.trim().match(/[:/]([^/:]+)\/[^/]+$/)?.[1]

// The shell command that asks GitHub's REST API for the pull requests whose head is the branch `branch` of `login`.
// With the ETag of an earlier answer, GitHub answers 304 when nothing changed, and does not
// count the request against the rate limit. Thus, the archive can ask every few seconds.
export const ask = (login, branch, etag) =>
  "GH_NO_UPDATE_NOTIFIER=1 gh api --include " +
  (etag ? `--header ${quote(`If-None-Match: ${etag}`)} ` : "") +
  quote(`repos/{owner}/{repo}/pulls?state=all&per_page=20&head=${login}:${encodeURIComponent(branch)}`) +
  " 2>/dev/null"

// GitHub's answer to `ask`: its ETag, and the pull request of the branch, with `closedAt`, GitHub's time of its merge
// or close, or null. Undefined when nothing changed, or when the request was not successful.
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

// Each session's pull requests: the addresses of those that it made up to its message `seen`, what GitHub last told of
// them, and when that lookup ended. A lookup under way has no `time`. `scan` tells that the session can have a pull
// request that the last scan of its messages did not find.
const found = new Map()

// The sessions that worked at the last pass.
let working = new Set()

// Lookups run one at a time.
let queue = Promise.resolve()

// Shows a badge after the icons of each session row whose session made a pull request. `identify(row)` gives the row's
// session and its folder as `{ id, directory }`, or undefined when it cannot tell. `page(id, cursor)` resolves to a
// page of the assistant messages of session `id`, the newest first, and `run(directory, command)` runs a shell
// command. `changed()` runs after each lookup, and the next pass shows what the lookup found. A badge names the open
// pull request that the session made last, else the last one, and counts the others. A click on it runs `open(url)`,
// and `label(pull)` gives a pull request its text for the tooltip.
export function show({ identify, page, run, changed, open, label }) {
  const now = Date.now()
  const rows = Array.from(document.querySelectorAll(ROW), (row) => {
    const line = row.querySelector(LINE)

    return { row, line, session: line && identify(row) }
  })
  const busy = new Set(
    rows
      .filter(({ row, session }) => session && row.getAttribute("data-status") === "working")
      .map(({ session }) => session.id),
  )

  // A session that stops working may have made a pull request.
  working.forEach((id) => {
    if (!busy.has(id) && found.has(id)) found.get(id).scan = true
  })
  working = busy

  rows.forEach(({ row, line, session }) => {
    let badge = row.querySelector(`[${BADGE}]`)

    if (!session) return badge?.remove()

    if (!found.has(session.id)) found.set(session.id, { scan: true, time: 0, urls: [], pulls: [] })
    const entry = found.get(session.id)

    if (entry.time !== undefined) {
      const stale = now - entry.time >= STALE

      // A session that works can make a pull request before its run stops.
      if (stale && busy.has(session.id)) entry.scan = true
      if (entry.scan || (stale && unsettled(entry))) load(session, entry, { page, run, changed })
    }

    const pull = entry.pulls.findLast(({ state }) => state === "open" || state === "draft") ?? entry.pulls.at(-1)

    if (!pull) return badge?.remove()

    if (!badge) {
      badge = document.createElement("span")
      badge.setAttribute("role", "link")
      control(badge, () => open(badge.getAttribute(LINK)))
    }

    const text = entry.pulls.map(label).join("\n")

    if (line.lastElementChild !== badge) line.append(badge)
    lists.set(badge, entry.pulls)
    set(badge, BADGE, pull.state)
    set(badge, LINK, pull.url)
    mark(badge, MORE, entry.pulls.length > 1 ? String(entry.pulls.length - 1) : undefined)
    // The card takes the place of the tooltip.
    mark(badge, "title", entry.pulls.length > 1 ? undefined : text)
    set(badge, "aria-label", text)
    if (badge.textContent !== `#${pull.number}`) badge.textContent = `#${pull.number}`
  })
}

// Whether GitHub can tell something new of the pull requests of a session: it did not tell of each of them, or one is
// not merged. A merged pull request does not change.
const unsettled = ({ urls, pulls }) => pulls.length < urls.length || pulls.some((pull) => pull.state !== "merged")

// Scans the messages of a session when it can have a new pull request, then reads its pull requests from GitHub. A
// session that stops working during the lookup gets one more.
const load = ({ id, directory }, entry, { page, run, changed }) => {
  entry.time = undefined
  queue = queue
    .then(async () => {
      if (entry.scan) {
        entry.scan = false
        const { seen, urls } = await scan((cursor) => page(id, cursor), entry.seen)

        entry.seen = seen
        entry.urls = [...new Set([...entry.urls, ...urls])]
      }

      if (entry.urls.length > 0) entry.pulls = read((await run(directory, view(entry.urls))).output)
    })
    .catch(() => undefined)
    .finally(() => {
      entry.time = Date.now()
      changed()
    })
}

// The pull requests of each badge, for its card.
const lists = new WeakMap()

// Shows the pull requests of a badge that names one of several in a card, the newest first, while the pointer rests on
// the badge. A click on one runs `open(url)`. Returns the cleanup.
export const listen = (open) =>
  card.listen(`[${MORE}]`, (element, badge, close) => {
    element.setAttribute(LIST, "")
    element.append(
      ...lists.get(badge).toReversed().map((pull) => {
        const item = document.createElement("div")
        const number = document.createElement("span")
        const title = document.createElement("span")

        item.setAttribute("role", "link")
        number.setAttribute(BADGE, pull.state)
        number.textContent = `#${pull.number}`
        title.textContent = pull.title
        item.append(number, title)
        control(item, () => {
          close()
          open(pull.url)
        })

        return item
      }),
    )
  })

// Removes every badge, as when the plugin stops.
export function clean() {
  found.clear()
  working = new Set()
  document.querySelectorAll(`[${BADGE}]`).forEach((badge) => badge.remove())
}
