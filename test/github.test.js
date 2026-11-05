import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, test, vi } from "vitest"
import { act, address, hunks, methods, patch, picture, read, subject } from "../src/github/format.js"
import { highlight } from "../src/github/highlight.js"
import { createItems } from "../src/github/model.js"

// What `gh pr view` and `gh issue view` print with the fields the panel asks for: a merged pull request of T3 Code, an
// open pull request of the GitHub CLI from a fork, and the issue that it closes.
const fixture = (name) => JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/github", `${name}.json`), "utf8"))

const MERGED = "https://github.com/pingdotgg/t3code/pull/2000"
const OPEN = "https://github.com/cli/cli/pull/14914"
const ISSUE = "https://github.com/cli/cli/issues/14856"

// Catches a link to another GitHub page that opens the panel, a pull request that opens in the browser because of a
// page under it or its case, and two tabs for one pull request.
test.each([
  ["https://github.com/cli/cli/pull/13899", "https://github.com/cli/cli/pull/13899"],
  ["https://github.com/Cli/CLI/pull/13899/files#diff-1a2b", "https://github.com/cli/cli/pull/13899"],
  ["https://www.github.com/cli/cli/issues/14856#issuecomment-1", "https://github.com/cli/cli/issues/14856"],
  ["https://github.example.com/team/app/pull/4", "https://github.example.com/team/app/pull/4"],
  ["https://github.com/cli/cli", undefined],
  ["https://github.com/cli/cli/pulls", undefined],
  ["https://github.com/cli/cli/pull/new/feature", undefined],
  ["https://cli.github.io/docs/app/pull/1", undefined],
  ["https://gitlab.com/team/app/pull/1", undefined],
  ["mailto:someone@github.com", undefined],
])("the address of %s is %s", (href, want) => {
  expect(address(href)).toBe(want)
})

// Catches a merged pull request shown as closed, a lost check, and activity out of order: a commit made before the pull
// request opened, and a bot's comment that is only a marker.
test("reads a merged pull request", () => {
  const item = read(MERGED, fixture("pull-merged"))

  expect(item).toMatchObject({
    kind: "pull",
    state: "merged",
    gate: "merged",
    mergedBy: "juliusmarminge",
    fork: undefined,
  })
  expect(item.checks.map((check) => check.result)).toEqual([...Array(11).fill("pass"), "skip"])
  expect(item.events.map((event) => [event.kind, event.user, !!event.body])).toEqual([
    ["opened", "juliusmarminge", false],
    ["commit", "juliusmarminge", false],
    ["comment", "coderabbitai", true],
    ["review", "macroscopeapp", false],
    ["comment", "macroscopeapp", true],
    ["merged", "juliusmarminge", false],
  ])
})

// Catches a branch of a fork shown as a branch of the repository, a reviewer who was asked but has not reviewed, and a
// commit made before the pull request opened that shows before it.
test("reads an open pull request from a fork", () => {
  const item = read(OPEN, fixture("pull-open"))

  expect(item).toMatchObject({ state: "open", gate: "review", fork: "goransh-walia", branch: "fix/issue-14856-549" })
  expect(item.reviewers).toEqual([{ login: "williammartin", verdict: "requested" }])
  expect(item).toMatchObject({ sync: "current", commits: 2 })
  expect(item.events.map((event) => event.kind)).toEqual(["opened", "commit", "comment", "commit"])
})

// Catches a card that asks for a review while the branch has conflicts, or reports running checks while some failed:
// the reason that needs the most work comes first.
test.each([
  [{ isDraft: true, mergeable: "CONFLICTING" }, "draft"],
  [{ mergeable: "CONFLICTING", reviewDecision: "CHANGES_REQUESTED" }, "conflicts"],
  [{ reviewDecision: "CHANGES_REQUESTED", statusCheckRollup: [run("test", "FAILURE")] }, "changes"],
  [{ statusCheckRollup: [run("test", "FAILURE"), run("lint", null, "IN_PROGRESS")] }, "failing"],
  [{ statusCheckRollup: [run("lint", null, "QUEUED")], reviewDecision: "" }, "pending"],
  [{ reviewDecision: "", mergeStateStatus: "BEHIND" }, "behind"],
  [{ reviewDecision: "APPROVED", mergeStateStatus: "CLEAN" }, "ready"],
])("a pull request with %o is %s", (fields, want) => {
  expect(read(OPEN, { ...fixture("pull-open"), ...fields }).gate).toBe(want)
})

// Catches a check that ran again and counts twice, or that shows its earlier result while it runs again.
test("counts a check that ran again once, by its latest run", () => {
  const rollup = [
    run("test", "FAILURE", "COMPLETED", "2026-11-03T10:00:00Z"),
    run("test", null, "IN_PROGRESS", "2026-11-03T11:00:00Z"),
    run("lint", "FAILURE", "COMPLETED", "2026-11-03T10:00:00Z"),
    run("lint", "SUCCESS", "COMPLETED", "2026-11-03T11:00:00Z"),
    {
      __typename: "StatusContext",
      context: "Vercel",
      state: "ERROR",
      targetUrl: "https://vercel.com/x",
      startedAt: "2026-11-03T10:00:00Z",
    },
  ]
  const { checks } = read(OPEN, { ...fixture("pull-open"), statusCheckRollup: rollup })

  expect(checks.map((check) => [check.name, check.result])).toEqual([
    ["Vercel", "fail"],
    ["test", "pending"],
    ["lint", "pass"],
  ])
})

// Catches an issue that shows no pull request that closes it, and an issue link to a pull request that shows it as an
// issue: GitHub answers `/issues/<number>` of a pull request with the pull request.
test("reads an issue, and moves an issue link of a pull request to the pull request", () => {
  expect(read(ISSUE, fixture("issue"))).toMatchObject({
    kind: "issue",
    state: "open",
    pulls: [{ number: 14914, url: "https://github.com/cli/cli/pull/14914" }],
  })
  expect(read(ISSUE, { ...fixture("issue"), state: "CLOSED", stateReason: "NOT_PLANNED" }).state).toBe("skipped")
  expect(read("https://github.com/cli/cli/issues/14914", fixture("pull-open"))).toEqual({ moved: OPEN })
})

// Catches a merge with a method that the repository does not allow, or a merge button for a user who cannot merge.
test("lists the allowed merge methods, the user's usual one first", () => {
  const settings = { squashMergeAllowed: true, mergeCommitAllowed: false, rebaseMergeAllowed: true }

  expect(methods({ ...settings, viewerDefaultMergeMethod: "REBASE", viewerPermission: "WRITE" })).toEqual({
    methods: ["rebase", "squash"],
    write: true,
  })
  expect(methods({ ...settings, viewerDefaultMergeMethod: "MERGE", viewerPermission: "READ" })).toEqual({
    methods: ["squash", "rebase"],
    write: false,
  })
})

// Catches a change made with the command of the other kind of item, or a merge that ignores the chosen method.
test.each([
  [OPEN, "merge", "squash", `pr merge '${OPEN}' --squash`],
  [OPEN, "auto", "rebase", `pr merge '${OPEN}' --rebase --auto`],
  [OPEN, "ready", undefined, `pr ready '${OPEN}'`],
  [OPEN, "update", undefined, `pr update-branch '${OPEN}'`],
  [ISSUE, "close", undefined, `issue close '${ISSUE}'`],
  [OPEN, "reopen", undefined, `pr reopen '${OPEN}'`],
])("%s: %s %s", (item, action, method, want) => {
  expect(act(item, action, method)).toBe(`GH_NO_UPDATE_NOTIFIER=1 GH_PROMPT_DISABLED=1 gh ${want} 2>&1`)
})

// Catches the diff of another file, a path that breaks out of the shell's quotes, and a GitHub Enterprise pull request
// that `gh` looks for on github.com.
test("asks GitHub for the diff of one file", () => {
  expect(patch(OPEN, "docs/it's here.md")).toBe(
    "GH_NO_UPDATE_NOTIFIER=1 GH_PROMPT_DISABLED=1 gh api 'repos/cli/cli/pulls/14914/files?per_page=100' --paginate " +
      `--jq '.[] | select(.filename == "docs/it'\\''s here.md") | .patch // empty' 2>&1`,
  )
  expect(patch("https://github.example.com/team/app/pull/4", "a.js")).toContain(
    "gh api --hostname github.example.com 'repos/team/app/pulls/4/files?per_page=100'",
  )
})

// Catches the headers of GitHub's response left at the start of the image, the output of GNU `base64`, which breaks its
// lines, read as no image, and an error page shown as an image: the 404 of an attachment that the login cannot see, or
// a sign-in page.
test.each([
  ["HTTP/1.1 200 OK\nContent-Type: image/png\r\nContent-Length: 8\r\n\r\n", { type: "image/png" }],
  ["HTTP/2.0 404 Not Found\r\nContent-Type: image/png\r\n\r\n", undefined],
  ["HTTP/2.0 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n", undefined],
])("reads the image that gh downloads: %j", (head, want) => {
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const output = Buffer.concat([Buffer.from(head), Buffer.from(png)])
    .toString("base64")
    .replace(/.{76}/g, "$&\n")

  expect(picture(output)).toEqual(want && { ...want, bytes: new Uint8Array(png) })
})

// Catches line numbers that drift after a removed or an added line, a lost count of the lines between two hunks, and the
// note that a file has no newline at its end shown as a line of code.
test("reads the hunks of a diff, with the numbers of each line", () => {
  const text = [
    "@@ -3,3 +3,3 @@ function a() {",
    " keep",
    "-old",
    "+new",
    " keep",
    "@@ -20,2 +20,3 @@",
    " end",
    "+more",
    "\\ No newline at end of file",
    " last",
    "",
  ].join("\n")

  expect(hunks(text)).toEqual([
    {
      skipped: 2,
      heading: "function a() {",
      lines: [
        { type: "same", before: 3, after: 3, text: "keep" },
        { type: "del", before: 4, text: "old" },
        { type: "add", after: 4, text: "new" },
        { type: "same", before: 5, after: 5, text: "keep" },
      ],
    },
    {
      skipped: 14,
      heading: "",
      lines: [
        { type: "same", before: 20, after: 20, text: "end" },
        { type: "add", after: 21, text: "more" },
        { type: "same", before: 21, after: 22, text: "last" },
      ],
    },
  ])
})

// Catches runs given to the wrong line, an added line that a removed line turns into a comment because the two files
// are highlighted as one, and colors that name no variable of the app's theme.
test("highlights the file before and the file after a change apart", () => {
  const list = hunks(["@@ -1,3 +1,3 @@", " const a = 1", "-/* old", '+let b = "x"', " */", ""].join("\n"))
  const runs = highlight(list, "src/a.ts")
  const [, removed, added] = list[0].lines
  const text = (line) => runs.get(line).map((run) => run.text)
  const style = (line, text) => runs.get(line).find((run) => run.text.trim() === text)?.style

  expect(text(added).join("")).toBe('let b = "x"')
  expect(style(added, "let")).toBe("color:var(--syntax-keyword)")
  expect(style(added, '"x"')).toBe("color:var(--syntax-string)")
  expect(style(removed, "/* old")).toBe("color:var(--syntax-comment)")
})

// Catches a file with no extension that is not highlighted by its name, and a file of an unknown language that breaks
// the diff instead of showing plain text.
test.each([
  ["Dockerfile", true],
  ["docs/LICENSE", false],
  ["data.unknown", false],
])("highlights %s: %s", (path, want) => {
  expect(highlight(hunks("@@ -0,0 +1 @@\n+FROM node\n"), path).size > 0).toBe(want)
})

// Catches a prompt that sends the agent to fix checks that passed, or that leaves out where the pull request is.
test("tells the agent which checks failed", () => {
  const rollup = [run("test", "FAILURE"), run("lint", "SUCCESS")]
  const item = read(OPEN, { ...fixture("pull-open"), statusCheckRollup: rollup })

  expect(subject(item, "checks").split("\n")).toEqual([
    "the pull request cli/cli#14914",
    `Title: ${item.title}`,
    `URL: ${OPEN}`,
    "Branch: goransh-walia:fix/issue-14856-549, into trunk",
    "Checks that failed on the last commit:",
    "- CI / test: https://github.com/cli/cli/actions/runs/1/job/test",
  ])
})

// Catches a change that leaves the panel on the state before it, and a diff from before a new commit.
test("reads the item again after a change, and drops the diff of an older commit", async () => {
  const json = fixture("pull-open")
  const run = vi.fn(async (directory, command) => {
    if (command.includes(" pr view ")) return { ok: true, output: JSON.stringify(json) }
    if (command.includes(" api ")) return { ok: true, output: "@@ -1 +1 @@\n-x\n+y\n" }

    return { ok: true, output: "" }
  })
  const items = createItems(run)

  await items.load(OPEN, "/repo")
  items.loadPatch(OPEN, "/repo", "a.js")
  await vi.waitFor(() => expect(items.state.items[OPEN].patches["a.js"].text).toBe("@@ -1 +1 @@\n-x\n+y"))

  json.isDraft = true
  json.headRefOid = "0000000"
  expect(await items.change(OPEN, "/repo", "draft")).toBeUndefined()

  expect(run.mock.calls.map(([, command]) => command.split(" ").slice(3, 5).join(" "))).toEqual([
    "pr view",
    "api 'repos/cli/cli/pulls/14914/files?per_page=100'",
    "pr ready",
    "pr view",
  ])
  expect(items.state.items[OPEN].item.state).toBe("draft")
  expect(items.state.items[OPEN].patches).toBeUndefined()
})

// Catches a failed read that shows as a pull request with no data, and a missing `gh` shown as a GitHub error.
test("explains why gh could not read the item", async () => {
  const outputs = {
    "zsh:1: command not found: gh": "cli",
    "To get started with GitHub CLI, please run:  gh auth login": "auth",
    "GraphQL: Could not resolve to a PullRequest with the number of 99999. (repository.pullRequest)": "gone",
  }

  for (const [output, reason] of Object.entries(outputs)) {
    const items = createItems(async () => ({ ok: false, output }))

    await items.load(OPEN, "/repo")
    expect(items.state.items[OPEN]).toMatchObject({ error: { reason }, busy: false })
    expect(items.state.items[OPEN].item).toBeUndefined()
  }
})

function run(name, conclusion, status = "COMPLETED", startedAt = "2026-11-03T10:00:00Z") {
  return {
    __typename: "CheckRun",
    name,
    workflowName: "CI",
    status,
    conclusion,
    startedAt,
    completedAt: status === "COMPLETED" ? startedAt : "0001-01-01T00:00:00Z",
    detailsUrl: `https://github.com/cli/cli/actions/runs/1/job/${name}`,
  }
}
