import { quote } from "../branch.js"

// Which links name a GitHub pull request or issue, the `gh` commands that read and change one, and what the panel
// shows from their output.

// The page of a pull request or an issue, or a page under it, such as the files of a pull request or a comment.
const PAGE = /^\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)(?:\/|$)/

// The address of the pull request or issue that `href` links to, `https://<host>/<owner>/<repo>/pull/<number>` or
// `…/issues/<number>`, else undefined. The owner and the repository are in lowercase, as GitHub ignores their case.
// GitHub Enterprise Server runs on any host, so a host with a "github" label also counts, as in T3 Code; a GitHub
// Pages site does not.
export function address(href) {
  if (!URL.canParse(href)) return
  const url = new URL(href)
  const host = url.host.toLowerCase().replace(/^www\./, "")
  const match = url.pathname.match(PAGE)
  const github = host === "github.com" || host.endsWith(".ghe.com") || host.split(/[.:]/).includes("github")

  if (!match || !github || !/^https?:$/.test(url.protocol) || host.endsWith(".github.io")) return

  return `${url.protocol}//${host}/${match[1].toLowerCase()}/${match[2].toLowerCase()}/${match[3]}/${match[4]}`
}

// The parts of an address that `address` gives. `kind` is "pull" or "issue".
export function parts(address) {
  const url = new URL(address)
  const [owner, repo, kind, number] = url.pathname.slice(1).split("/")

  return { origin: url.origin, owner, repo, kind: kind === "pull" ? "pull" : "issue", number: Number(number) }
}

const GH = "GH_NO_UPDATE_NOTIFIER=1 GH_PROMPT_DISABLED=1 gh"

const PULL = [
  "number",
  "title",
  "url",
  "state",
  "isDraft",
  "author",
  "body",
  "baseRefName",
  "headRefName",
  "headRefOid",
  "isCrossRepository",
  "headRepositoryOwner",
  "additions",
  "deletions",
  "changedFiles",
  "createdAt",
  "mergedAt",
  "closedAt",
  "mergedBy",
  "mergeable",
  "mergeStateStatus",
  "reviewDecision",
  "autoMergeRequest",
  "labels",
  "assignees",
  "milestone",
  "reviewRequests",
  "latestReviews",
  "reviews",
  "comments",
  "commits",
  "files",
  "statusCheckRollup",
]

const ISSUE = [
  "number",
  "title",
  "url",
  "state",
  "stateReason",
  "author",
  "body",
  "createdAt",
  "closedAt",
  "labels",
  "assignees",
  "milestone",
  "issueType",
  "parent",
  "subIssuesSummary",
  "comments",
  "closedByPullRequestsReferences",
]

// The shell command that prints the pull request or the issue at `address` as JSON, or why `gh` cannot.
export function view(address) {
  const pull = parts(address).kind === "pull"

  return `${GH} ${pull ? "pr" : "issue"} view ${quote(address)} --json ${(pull ? PULL : ISSUE).join(",")} 2>&1`
}

// The shell command that prints the diff of the file at `path` in the pull request at `address`, from its first hunk
// on. It prints nothing when GitHub has no diff for the file, as for a binary file or a very large one.
export function patch(address, path) {
  const { origin, owner, repo, number } = parts(address)
  const host = new URL(origin).host === "github.com" ? "" : ` --hostname ${quote(new URL(origin).host)}`
  const filter = `.[] | select(.filename == ${JSON.stringify(path)}) | .patch // empty`

  return `${GH} api${host} ${quote(`repos/${owner}/${repo}/pulls/${number}/files?per_page=100`)} --paginate --jq ${quote(filter)} 2>&1`
}

// The shell command that prints which merge methods the repository of `address` allows, and the user's rights there.
export function settings(address) {
  const { origin, owner, repo } = parts(address)
  const fields = "viewerDefaultMergeMethod,squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,viewerPermission"

  return `${GH} repo view ${quote(`${origin}/${owner}/${repo}`)} --json ${fields} 2>&1`
}

// The shell command that prints the address of the pull request of the folder's branch.
export const current = `${GH} pr view --json url --jq .url 2>&1`

// The shell command that prints in base64 what `gh` downloads from `url` with the user's login: the status line and the
// headers of GitHub's last response, then its body. An attachment of a private repository loads only with a login.
export function download(url) {
  return `${GH} api --include ${quote(url)} 2>/dev/null | base64`
}

// The image in the output of `download`: its type and its bytes. Undefined unless GitHub answered with an image.
export function picture(output) {
  const text = atob(output)
  const end = text.match(/\r?\n\r?\n/)

  if (!end) return
  const head = text.slice(0, end.index)
  const type = head.match(/^content-type:\s*(image\/[^;\s]+)/im)?.[1]

  if (!/^HTTP\/\S+ 200\b/.test(head) || !type) return

  return { type, bytes: Uint8Array.from(text.slice(end.index + end[0].length), (char) => char.charCodeAt(0)) }
}

// The `gh` arguments of each change the panel makes, after the address. `method` is a merge method.
const ACTIONS = {
  merge: (method) => ["pr merge", `--${method}`],
  auto: (method) => ["pr merge", `--${method} --auto`],
  admin: (method) => ["pr merge", `--${method} --admin`],
  manual: () => ["pr merge", "--disable-auto"],
  ready: () => ["pr ready", ""],
  draft: () => ["pr ready", "--undo"],
  update: () => ["pr update-branch", ""],
  close: (_, kind) => [`${kind === "pull" ? "pr" : "issue"} close`, ""],
  reopen: (_, kind) => [`${kind === "pull" ? "pr" : "issue"} reopen`, ""],
}

// The shell command that makes the change `action` to the pull request or the issue at `address`.
export function act(address, action, method) {
  const [command, flags] = ACTIONS[action](method, parts(address).kind)

  return [GH, command, quote(address), flags, "2>&1"].filter(Boolean).join(" ")
}

// What `gh` printed when it failed, as the panel explains it: `cli` when the command is missing, `auth` when it has no
// login, `gone` when GitHub has no such pull request or issue, else `other` with the last lines of the output.
export function failure(output) {
  if (/command not found|not recognized as/i.test(output)) return { reason: "cli" }
  if (/gh auth login|GH_TOKEN|authentication/i.test(output)) return { reason: "auth" }
  if (/Could not resolve to an? (PullRequest|Issue)|HTTP 404/i.test(output)) return { reason: "gone" }

  return { reason: "other", detail: output.trim().split(/\r?\n/).slice(-4).join("\n") }
}

// What the panel shows of the JSON that `view` prints for `address`. Times are in milliseconds. An issue address that
// GitHub answers with a pull request, as it does for `/issues/<number>` of a pull request, gives only `moved`, the
// address of the pull request.
export function read(target, json) {
  if (parts(target).kind === "pull") return pull(json)
  if (/\/pull\/\d+$/.test(json.url)) return { moved: address(json.url) }

  return issue(json)
}

// The merge methods that the repository allows, the user's usual one first, whether the user can merge there, and
// whether they can merge as an admin past the rules of the repository, from the JSON that `settings` prints.
export function methods(json) {
  const allowed = [
    json.squashMergeAllowed && "squash",
    json.mergeCommitAllowed && "merge",
    json.rebaseMergeAllowed && "rebase",
  ].filter(Boolean)
  const usual = json.viewerDefaultMergeMethod?.toLowerCase()

  return {
    methods: allowed.includes(usual) ? [usual, ...allowed.filter((method) => method !== usual)] : allowed,
    write: ["ADMIN", "MAINTAIN", "WRITE"].includes(json.viewerPermission),
    admin: json.viewerPermission === "ADMIN",
  }
}

// GitHub's results of a check in four kinds. A check that waits for someone, such as a workflow that needs approval,
// counts as running.
const RESULTS = {
  SUCCESS: "pass",
  FAILURE: "fail",
  ERROR: "fail",
  TIMED_OUT: "fail",
  STARTUP_FAILURE: "fail",
  CANCELLED: "fail",
  ACTION_REQUIRED: "pending",
  PENDING: "pending",
  EXPECTED: "pending",
  SKIPPED: "skip",
  NEUTRAL: "skip",
  STALE: "skip",
}

const ORDER = ["fail", "pending", "pass", "skip"]

const VERDICTS = { APPROVED: "approved", CHANGES_REQUESTED: "changes", COMMENTED: "commented", DISMISSED: "dismissed" }

function pull(json) {
  const checks = rollup(json.statusCheckRollup ?? [])

  return {
    kind: "pull",
    number: json.number,
    title: json.title,
    url: json.url,
    body: text(json.body),
    state: json.state === "OPEN" && json.isDraft ? "draft" : json.state.toLowerCase(),
    gate: gate(json, checks),
    // GitHub merges at once only in these states. In the others, such as when a rule of the repository requires the
    // checks, it waits, and only an admin can merge before then.
    blocked: !["CLEAN", "HAS_HOOKS", "UNSTABLE"].includes(json.mergeStateStatus),
    author: login(json.author),
    base: json.baseRefName,
    branch: json.headRefName,
    sha: json.headRefOid,
    fork: json.isCrossRepository ? json.headRepositoryOwner?.login : undefined,
    sync: sync(json),
    commits: (json.commits ?? []).length,
    additions: json.additions,
    deletions: json.deletions,
    changed: json.changedFiles,
    created: time(json.createdAt),
    merged: time(json.mergedAt),
    closed: time(json.closedAt),
    mergedBy: login(json.mergedBy),
    autoMerge: json.autoMergeRequest?.mergeMethod?.toLowerCase(),
    labels: labels(json),
    assignees: (json.assignees ?? []).map(login),
    milestone: json.milestone?.title,
    decision: json.reviewDecision || undefined,
    checks,
    reviewers: reviewers(json),
    files: (json.files ?? []).map((file) => ({
      path: file.path,
      additions: file.additions,
      deletions: file.deletions,
      change: file.changeType.toLowerCase(),
    })),
    events: events(json),
  }
}

// An issue's state is "open", "done" when it was closed as completed, or "skipped" when it was closed as not planned.
function issue(json) {
  return {
    kind: "issue",
    number: json.number,
    title: json.title,
    url: json.url,
    body: text(json.body),
    state: json.state === "OPEN" ? "open" : json.stateReason === "NOT_PLANNED" ? "skipped" : "done",
    author: login(json.author),
    created: time(json.createdAt),
    closed: time(json.closedAt),
    labels: labels(json),
    assignees: (json.assignees ?? []).map(login),
    milestone: json.milestone?.title,
    type: json.issueType?.name,
    parent: json.parent?.url && { number: json.parent.number, title: json.parent.title, url: json.parent.url },
    subIssues: json.subIssuesSummary?.total > 0 ? json.subIssuesSummary : undefined,
    pulls: (json.closedByPullRequestsReferences ?? []).map((reference) => ({
      number: reference.number,
      url: reference.url,
    })),
    events: events(json),
  }
}

// How many checks have each result.
export function tally(checks) {
  const count = { pass: 0, fail: 0, pending: 0, skip: 0 }

  for (const check of checks) count[check.result] += 1

  return count
}

// The hunks of a file's diff as `patch` prints it: how many lines it skips before it, the heading that GitHub gives it,
// and its lines, each added, removed or the same, with its numbers in the file before and after.
export function hunks(text) {
  const list = []
  let before = 0
  let after = 0
  let next = 1

  for (const line of text.split("\n")) {
    const head = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,\d+)? @@ ?(.*)$/)

    if (head) {
      before = Number(head[1])
      after = Number(head[3])
      list.push({ skipped: Math.max(0, before - next), heading: head[4], lines: [] })
      next = before + Number(head[2] ?? 1)
      continue
    }

    const hunk = list.at(-1)

    if (!hunk || line === "" || line.startsWith("\\")) continue
    if (line[0] === "+") hunk.lines.push({ type: "add", after: after++, text: line.slice(1) })
    else if (line[0] === "-") hunk.lines.push({ type: "del", before: before++, text: line.slice(1) })
    else hunk.lines.push({ type: "same", before: before++, after: after++, text: line.slice(1) })
  }

  return list
}

// The time since `then` as the app writes it in the timeline, with its strings through `t`: "Just now", "5m ago",
// "3h ago", "12d ago". After 30 days, the date.
export function ago(then, now, t, locale) {
  const minutes = Math.floor((now - then) / 60000)

  if (minutes < 1) return t("ui.message.time.justNow")
  if (minutes < 60) return t("ui.message.time.minutesAgo", { count: String(minutes) })
  if (minutes < 24 * 60) return t("ui.message.time.hoursAgo", { count: String(Math.floor(minutes / 60)) })
  if (minutes < 30 * 24 * 60) return t("ui.message.time.daysAgo", { count: String(Math.floor(minutes / 60 / 24)) })

  const year = new Date(then).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric"

  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year }).format(then)
}

// What the agent reads about `item` when the user hands it over: what it is and where, and the part that `focus`
// names: `conflicts`, `checks` or `review` of a pull request, or the text of an issue. With `check`, only that failed
// check counts. Not localized: the model reads it.
export function subject(item, focus, check) {
  const { owner, repo } = parts(address(item.url))
  const lines = [`the ${item.kind === "pull" ? "pull request" : "issue"} ${owner}/${repo}#${item.number}`]

  lines.push(`Title: ${item.title}`, `URL: ${item.url}`)
  if (item.kind === "pull") lines.push(`Branch: ${item.fork ? `${item.fork}:` : ""}${item.branch}, into ${item.base}`)

  if (focus === "conflicts") lines.push(`The branch has merge conflicts with ${item.base}.`)

  if (focus === "checks")
    lines.push(
      "Checks that failed on the last commit:",
      ...item.checks
        .filter((failed) => failed.result === "fail" && (!check || failed === check))
        .map(
          (failed) =>
            `- ${[failed.workflow, failed.name].filter(Boolean).join(" / ")}${failed.url ? `: ${failed.url}` : ""}`,
        ),
    )

  if (focus === "review")
    lines.push(
      "Reviews that request changes:",
      ...item.events
        .filter((event) => event.kind === "review" && event.verdict === "changes")
        .map((event) => `@${event.user}: ${event.body ? event.body.slice(0, 2000) : "(no summary)"}`),
    )

  if (focus === "issue" && item.body) lines.push("", item.body.slice(0, 6000))

  return lines.join("\n")
}

// Whether the pull request can merge, as one state: when it cannot, the reason that needs the most work.
function gate(json, checks) {
  const count = tally(checks)

  if (json.mergedAt) return "merged"
  if (json.state === "CLOSED") return "closed"
  if (json.isDraft) return "draft"
  if (json.mergeable === "CONFLICTING" || json.mergeStateStatus === "DIRTY") return "conflicts"
  if (json.reviewDecision === "CHANGES_REQUESTED") return "changes"
  if (count.fail > 0) return "failing"
  if (json.reviewDecision === "REVIEW_REQUIRED") return "review"
  if (count.pending > 0) return "pending"
  if (json.mergeStateStatus === "BEHIND") return "behind"
  if (json.mergeStateStatus === "BLOCKED") return "blocked"
  if (json.mergeStateStatus === "UNKNOWN") return "unknown"

  return "ready"
}

// How the branch of an open pull request stands against its base: `conflicts`, `behind`, or `current`. Undefined while
// GitHub has not checked it, and for a pull request that is closed.
function sync(json) {
  if (json.state !== "OPEN" || json.mergeStateStatus === "UNKNOWN") return
  if (json.mergeable === "CONFLICTING" || json.mergeStateStatus === "DIRTY") return "conflicts"
  if (json.mergeStateStatus === "BEHIND") return "behind"

  return "current"
}

// The checks of the last commit, failed ones first. A check that ran more than once counts once: the run that is still
// under way, else the latest.
function rollup(items) {
  const latest = new Map()

  for (const item of items) {
    const run = item.__typename === "CheckRun"
    const check = {
      name: run ? item.name : item.context,
      workflow: (run && item.workflowName) || undefined,
      result: run && item.status !== "COMPLETED" ? "pending" : (RESULTS[run ? item.conclusion : item.state] ?? "skip"),
      url: (run ? item.detailsUrl : item.targetUrl) || undefined,
      started: time(item.startedAt),
      ended: run ? time(item.completedAt) : undefined,
    }
    const key = `${check.workflow}\n${check.name}`
    const seen = latest.get(key)

    if (!seen || (seen.result !== "pending" && (check.result === "pending" || check.started > seen.started)))
      latest.set(key, check)
  }

  return [...latest.values()].sort(
    (a, b) => ORDER.indexOf(a.result) - ORDER.indexOf(b.result) || a.name.localeCompare(b.name),
  )
}

// The reviewers other than the author, with the verdict of each one's latest review, or `requested` while a review is
// asked of them. A team that is asked has its name for a login.
function reviewers(json) {
  const author = login(json.author)
  const list = new Map()

  for (const review of json.latestReviews ?? []) {
    const name = login(review.author)

    if (name && name !== author && VERDICTS[review.state])
      list.set(name, { login: name, verdict: VERDICTS[review.state] })
  }

  for (const request of json.reviewRequests ?? []) {
    const name = login(request) ?? request.slug ?? request.name

    if (name) list.set(name, { login: name, verdict: "requested" })
  }

  return [...list.values()]
}

// What happened, oldest first: it opened, its commits, comments and reviews, and its merge or close. A commit made
// before the pull request opened counts as made when it opened.
function events(json) {
  const opened = time(json.createdAt)
  const items = [
    { kind: "opened", user: login(json.author), time: opened },
    ...(json.comments ?? [])
      .filter((comment) => !comment.isMinimized)
      .map((comment) => ({
        kind: "comment",
        user: login(comment.author),
        time: time(comment.createdAt),
        body: text(comment.body),
        url: comment.url,
        reactions: reactions(comment.reactionGroups),
      })),
    ...(json.reviews ?? [])
      .filter((review) => VERDICTS[review.state])
      .map((review) => ({
        kind: "review",
        user: login(review.author),
        time: time(review.submittedAt),
        verdict: VERDICTS[review.state],
        body: text(review.body),
        reactions: reactions(review.reactionGroups),
      })),
    ...(json.commits ?? []).map((commit) => ({
      kind: "commit",
      user: login(commit.authors?.[0]) || commit.authors?.[0]?.name,
      time: Math.max(time(commit.committedDate), opened),
      oid: commit.oid,
      headline: commit.messageHeadline,
    })),
  ]

  if (json.mergedAt) items.push({ kind: "merged", user: login(json.mergedBy), time: time(json.mergedAt) })
  else if (json.state === "CLOSED") items.push({ kind: "closed", time: time(json.closedAt) })

  return items.toSorted((a, b) => a.time - b.time)
}

const EMOJI = {
  THUMBS_UP: "👍",
  THUMBS_DOWN: "👎",
  LAUGH: "😄",
  HOORAY: "🎉",
  CONFUSED: "😕",
  HEART: "❤️",
  ROCKET: "🚀",
  EYES: "👀",
}

// The reactions that a comment or a review got, as emoji and counts.
const reactions = (groups) =>
  (groups ?? [])
    .filter((group) => EMOJI[group.content] && group.users?.totalCount > 0)
    .map((group) => ({ emoji: EMOJI[group.content], count: group.users.totalCount }))

const labels = (json) => (json.labels ?? []).map(({ name, color }) => ({ name, color }))

const time = (value) => (value ? Date.parse(value) : undefined)

// The login of a person or an app. `gh` names an app `app/<slug>`, whose profile and picture are at `<slug>`.
const login = (actor) => actor?.login?.replace(/^app\//, "")

// Markdown without its HTML comments, which bots use to mark their comments, and empty when nothing else is left.
const text = (value) => (value ?? "").replace(/<!--[\s\S]*?-->/g, "").trim()
