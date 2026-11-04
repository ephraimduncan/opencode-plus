import { Command, LinkHandler, Panel, Style } from "@opencode/plugin/gui"
import { createStore } from "solid-js/store"
import { address, current, parts } from "./format.js"
import { css } from "./css.js"
import { createItems } from "./model.js"
import { FRESH, ItemView } from "./panel.jsx"
import { State } from "./parts.jsx"

// The GitHub panel: a tab in the side region of the session for each pull request or issue that the user opens, the
// command that opens the pull request of the session's branch, and the chips that the panel attaches to the prompt.
// `run(directory, command)` runs a shell command, and `browse(url)` opens a page. Returns `open(href, session)`, which
// opens the pull request or issue that `href` links to in the session, by default the routed one, and returns whether
// it did: on a narrow window, the side region cannot show.
export function github(ctx, { run, browse }) {
  const model = createItems(run)
  // The view that each item's panel shows: its summary, its timeline, or its files.
  const [views, setViews] = createStore({})
  const key = (id) => `${ctx.id}:${id}`

  const open = (href, session = ctx.sessions.current()) => {
    const id = address(href)

    if (!id || !session || ctx.layout.narrow()) return false
    if (section(href)) setViews(id, section(href))
    ctx.layout.open(key(id), session, { tab: "select" })
    if (session.directory) void model.load(id, session.directory, FRESH)

    return true
  }

  // Stable tab objects, so a new read of the item does not mount their labels again.
  const tabs = new Map()
  const tab = (id) => {
    if (tabs.has(id)) return tabs.get(id)
    const { owner, repo, kind, number } = parts(id)
    const item = () => model.state.items[id]?.item
    const created = {
      id,
      get title() {
        return `${owner}/${repo}#${number}${item()?.title ? `: ${item().title}` : ""}`
      },
      closable: "hover",
      label: () => (
        <div class="flex min-w-0 items-center gap-1.5">
          <State kind={kind} state={item()?.state} size="small" />
          <span class="truncate tabular-nums">{`#${number}`}</span>
        </div>
      ),
    }

    tabs.set(id, created)

    return created
  }

  ctx.add(Style, css)
  ctx.add(Panel, {
    id: "github",
    region: "side",
    // A tab that the strip restores reads its item, so its label shows the item's state.
    list: (input) => {
      const ids = input.open.filter((id) => address(id) === id)
      const directory = input.session.directory

      queueMicrotask(() => ids.forEach((id) => void model.load(id, directory, Infinity)))

      return ids.map(tab)
    },
    render: (props) => (
      <ItemView
        address={props.tab.id}
        session={props.session}
        screen={props.screen}
        model={model}
        view={() => views[props.tab.id]}
        setView={(view) => setViews(props.tab.id, view)}
        browse={browse}
        visible={() => ctx.layout.state(key(props.tab.id), props.session) === "visible"}
        open={(href) => open(href, props.session) || browse(href)}
        replace={(href) => {
          open(href, props.session)
          ctx.layout.close(key(props.tab.id), props.session)
        }}
      />
    ),
    closed: (input) => {
      const { owner, repo, number } = parts(input.tab.id)
      const title = model.state.items[input.tab.id]?.item?.title

      return { title: title ? `#${number} ${title}` : `#${number}`, icon: "github", detail: `${owner}/${repo}` }
    },
  })

  // A chip that the panel attached to the prompt opens its item again.
  ctx.add(LinkHandler, {
    priority: 10,
    match: (link) => link.origin === ctx.id && !!address(link.href),
    open: (link) => {
      const session = ctx.sessions.current()

      open(link.href, session && (!link.session || link.session.id === session.id) ? session : link.session)
    },
  })

  // Opens the pull request of the routed session's branch, as `gh` finds it in the session's folder.
  const show = async () => {
    const session = ctx.sessions.current()

    if (!session) return
    const found = await run(session.directory, current).catch(() => undefined)
    const url = found?.ok ? found.output.trim() : ""

    if (!address(url)) return ctx.toast.show({ title: ctx.t("github.command.none") })
    if (!open(url, session)) browse(url)
  }

  ctx.add(Command, () => ({
    id: "pull-request",
    title: ctx.t("github.command"),
    keywords: "pull request pr github branch checks reviews merge",
    enabled: !!ctx.sessions.current(),
    run: () => void show(),
  }))

  return open
}

// The view that a link to a page under an item names: its files, its commits, or one of its comments.
function section(href) {
  const url = new URL(href)

  if (/\/pull\/\d+\/(files|changes)\b/.test(url.pathname)) return "files"
  if (/\/pull\/\d+\/commits\b/.test(url.pathname) || /^#(issuecomment|discussion|pullrequestreview)/.test(url.hash))
    return "timeline"
}

export const strings = {
  "github.command": "Show the pull request of this branch",
  "github.command.none": "This branch has no pull request",
  "github.loading.pull": "Loading the pull request…",
  "github.loading.issue": "Loading the issue…",
  "github.refresh": "Refresh",
  "github.open": "Open on GitHub",
  "github.external": "Open in your browser",
  "github.more": "More actions",
  "github.copy.link": "Copy link",
  "github.copy.branch": "Copy branch name",
  "github.copy.checkout": "Copy checkout command",
  "github.copied": "Copied",
  "github.copyFailed": "Could not copy",
  "github.context": "Add to the prompt",
  "github.kind.pull": "Pull request",
  "github.kind.issue": "Issue",
  "github.retry": "Try again",
  "github.state.pull.open": "Open",
  "github.state.pull.draft": "Draft",
  "github.state.pull.merged": "Merged",
  "github.state.pull.closed": "Closed",
  "github.state.issue.open": "Open",
  "github.state.issue.done": "Closed",
  "github.state.issue.skipped": "Not planned",
  "github.files.one": "{{count}} file",
  "github.files.other": "{{count}} files",
  "github.changed.one": "{{count}} file changed",
  "github.changed.other": "{{count}} files changed",
  "github.files.rest": "Show the other {{count}} files on GitHub",
  "github.tab.summary": "Summary",
  "github.tab.timeline": "Timeline",
  "github.tab.files": "Files",
  "github.meta.opened": "opened",
  "github.meta.merged": "merged",
  "github.meta.closed": "closed",
  "github.none": "None",
  "github.branch": "Branch",
  "github.sync.current": "Up to date with {{base}}",
  "github.sync.behind": "Behind {{base}}",
  "github.sync.conflicts": "Conflicts with {{base}}",
  "github.result.pass": "Passed",
  "github.result.fail": "Failed",
  "github.result.pending": "Running",
  "github.result.skip": "Skipped",
  "github.fix": "Fix",
  "github.address": "Address",
  "github.comments": "Comments",
  "github.comments.none": "No comments yet.",
  "github.commits": "Commits",
  "github.commits.count.one": "{{count}} commit",
  "github.commits.count.other": "{{count}} commits",
  "github.approvals": "Approvals",
  "github.order.newest": "Newest first",
  "github.order.oldest": "Oldest first",
  "github.files.expand": "Expand all",
  "github.files.collapse": "Collapse all",
  "github.files.filter": "Filter files",
  "github.gate.merged": "Merged",
  "github.gate.merged.detail": "{{user}} merged it into {{base}}.",
  "github.gate.merged.anonymous.detail": "It is merged into {{base}}.",
  "github.gate.closed": "Closed",
  "github.gate.closed.detail": "It was closed without a merge.",
  "github.gate.draft": "Draft",
  "github.gate.draft.detail": "Mark it ready for review before you merge it.",
  "github.gate.conflicts": "Merge conflicts",
  "github.gate.conflicts.detail": "The branch has conflicts with {{base}}. The agent can resolve them.",
  "github.gate.changes": "Changes requested",
  "github.gate.changes.detail": "A reviewer asked for changes. The agent can address the review.",
  "github.gate.failing": "Checks failed",
  "github.gate.failing.detail": "Some checks did not pass. The agent can fix them.",
  "github.gate.review": "Review required",
  "github.gate.review.detail": "It needs an approval before it can merge.",
  "github.gate.pending": "Checks are running",
  "github.gate.pending.detail": "It can merge when the required checks pass.",
  "github.gate.behind": "Branch is out of date",
  "github.gate.behind.detail": "Update the branch with {{base}} before you merge.",
  "github.gate.blocked": "Merge is blocked",
  "github.gate.blocked.detail": "A rule of the repository stops the merge.",
  "github.gate.unknown": "Checking for conflicts",
  "github.gate.unknown.detail": "GitHub has not finished its check of the branch.",
  "github.gate.ready": "Ready to merge",
  "github.gate.ready.detail": "All requirements are met.",
  "github.auto.merge": "Auto-merge is on, with a merge commit.",
  "github.auto.squash": "Auto-merge is on, with squash.",
  "github.auto.rebase": "Auto-merge is on, with rebase.",
  "github.method.merge": "Merge",
  "github.method.squash": "Squash and merge",
  "github.method.rebase": "Rebase and merge",
  "github.method.merge.detail": "GitHub adds the commits to {{base}} with a merge commit.",
  "github.method.squash.detail": "GitHub adds the changes to {{base}} as one commit.",
  "github.method.rebase.detail": "GitHub adds each commit to {{base}} again, with no merge commit.",
  "github.merge.title": "Merge pull request #{{number}}?",
  "github.merge.auto.title": "Merge pull request #{{number}} when it is ready?",
  "github.merge.auto": "Merge when ready",
  "github.merge.manual": "Turn off auto-merge",
  "github.merge.other": "Other merge methods",
  "github.hand.conflicts": "Resolve conflicts",
  "github.hand.review": "Address the review",
  "github.hand.checks": "Fix the checks",
  "github.hand.issue": "Fix with the agent",
  "github.ask.conflicts": "Resolve the merge conflicts of this pull request with {{base}}, then push the branch.",
  "github.ask.review": "Address the review feedback on this pull request, then push the branch.",
  "github.ask.checks": "Find why the checks of this pull request failed, fix the cause, then push the branch.",
  "github.ask.check": "Find why the check {{check}} failed, fix the cause, then push the branch.",
  "github.ask.issue": "Fix this issue.",
  "github.ready": "Ready for review",
  "github.draft": "Convert to draft",
  "github.update": "Update branch",
  "github.reopen": "Reopen",
  "github.close.pull": "Close pull request",
  "github.close.pull.title": "Close pull request #{{number}}?",
  "github.close.issue": "Close issue",
  "github.close.issue.title": "Close issue #{{number}}?",
  "github.action.failed": "GitHub did not make the change",
  "github.checks": "Checks",
  "github.checks.failing": "{{count}} of {{total}} failed",
  "github.checks.running": "{{count}} of {{total}} running",
  "github.checks.passed": "All passed",
  "github.checks.some": "{{count}} of {{total}} passed",
  "github.checks.more.one": "Show {{count}} more check",
  "github.checks.more.other": "Show {{count}} more checks",
  "github.checks.less": "Show fewer checks",
  "github.reviewers": "Reviewers",
  "github.reviews.approved": "Approved",
  "github.reviews.changes": "Changes requested",
  "github.reviews.required": "Review required",
  "github.reviews.waiting": "Waiting for review",
  "github.reviews.commented": "Reviewed",
  "github.verdict.approved": "Approved",
  "github.verdict.changes": "Changes requested",
  "github.verdict.commented": "Commented",
  "github.verdict.dismissed": "Dismissed",
  "github.verdict.requested": "Requested",
  "github.type": "Type",
  "github.labels": "Labels",
  "github.assignees": "Assignees",
  "github.milestone": "Milestone",
  "github.parent": "Parent issue",
  "github.subIssues": "Sub-issues",
  "github.subIssues.value": "{{done}} of {{total}} done",
  "github.pulls": "Pull requests",
  "github.issue.open": "Open",
  "github.issue.open.detail": "No pull request closes it yet. The agent can work on it.",
  "github.issue.done": "Closed as completed",
  "github.issue.done.detail": "It is done.",
  "github.issue.skipped": "Closed as not planned",
  "github.issue.skipped.detail": "No work is planned for it.",
  "github.issue.pulls.one": "{{count}} pull request closes it when it merges.",
  "github.issue.pulls.other": "{{count}} pull requests close it when they merge.",
  "github.description": "Description",
  "github.description.none": "No description.",
  "github.event.opened.pull": "opened this pull request",
  "github.event.opened.issue": "opened this issue",
  "github.event.comment": "commented",
  "github.event.review.approved": "approved these changes",
  "github.event.review.changes": "requested changes",
  "github.event.review.commented": "reviewed",
  "github.event.review.dismissed": "reviewed (dismissed)",
  "github.event.merged": "merged into {{base}}",
  "github.event.closed.pull": "Closed without a merge",
  "github.event.closed.done": "Closed as completed",
  "github.event.closed.skipped": "Closed as not planned",
  "github.event.closed.open": "Closed",
  "github.diff.none": "GitHub shows no diff for this file.",
  "github.diff.skipped.one": "{{count}} unchanged line",
  "github.diff.skipped.other": "{{count}} unchanged lines",
  "github.error.cli": "The GitHub CLI is not installed",
  "github.error.cli.detail":
    "The panel reads GitHub with the gh command. Install it from cli.github.com, then run gh auth login.",
  "github.error.auth": "The GitHub CLI is not logged in",
  "github.error.auth.detail": "Run gh auth login in a terminal, then try again.",
  "github.error.gone": "Not found",
  "github.error.gone.detail": "It does not exist, or your GitHub account cannot see it.",
  "github.error.other": "Could not load it from GitHub",
  "github.error.other.detail": "The gh command did not complete.",
}
