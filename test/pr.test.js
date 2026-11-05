import { readFileSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, expect, test, vi } from "vitest"
import { answer, clean, latest, show } from "../src/pr.js"

// A session row as the app's sidebar renders it, with its branch line (OpenCode Desktop 2.2.5, inbox.tsx).
const row = (project, title, branch, status = "ready") =>
  `<button type="button" data-slot="sidebar-inbox-item" data-status="${status}" class="group flex w-full flex-col">` +
  `<span class="flex h-4 w-full min-w-0 items-center"><span class="flex size-4 shrink-0">${project[0].toUpperCase()}</span>` +
  `<span class="min-w-0 truncate">${project}</span><span class="ms-auto shrink-0 tabular-nums">2h</span></span>` +
  `<span dir="auto" class="w-full min-w-0 truncate">${title}</span>` +
  `<span class="flex h-4 w-full min-w-0 items-center gap-1"><span class="flex min-w-0 items-center gap-1">` +
  `<svg data-slot="icon-svg"></svg><span dir="ltr" class="min-w-0 truncate">${branch}</span></span></span></button>`

const titled = (title) =>
  Array.from(document.querySelectorAll('[data-slot="sidebar-inbox-item"]')).find(
    (element) => element.children[1].textContent === title,
  )

// What `gh pr list --json …` prints, after the URL of `origin`.
const output = (remote, pulls) => `${remote}\n${JSON.stringify(pulls)}\n`

const pull = (number, state, updatedAt, login = "ephraimduncan", isDraft = false) => ({
  headRepositoryOwner: { id: "MDQ6VXNlcjU1MTQzNzk5", name: "Ephraim Duncan", login },
  isDraft,
  number,
  state,
  title: `PR ${number}`,
  updatedAt,
  url: `https://github.com/ephraimduncan/opencode-plus/pull/${number}`,
})

const settle = () => new Promise((resolve) => setTimeout(resolve))

const options = (lookup, open = () => {}) => ({ lookup, open, label: ({ number, state }) => `#${number} ${state}` })

beforeEach(() => {
  clean()
  document.body.innerHTML = ""
})

// Catches a closed or merged pull request that hides a reopened one, and a fork's pull request from its own `main`
// that shows on the `main` of every session.
test("picks the open pull request of the remote's owner", () => {
  const remote = "git@github.com:ephraimduncan/opencode-plus.git"

  expect(
    latest(
      output(remote, [
        pull(9, "MERGED", "2026-11-03T10:00:00Z"),
        pull(7, "OPEN", "2026-11-01T10:00:00Z"),
        pull(12, "OPEN", "2026-11-03T12:00:00Z", "someone-else"),
      ]),
    ),
  ).toEqual({
    number: 7,
    title: "PR 7",
    url: "https://github.com/ephraimduncan/opencode-plus/pull/7",
    state: "open",
    updatedAt: "2026-11-01T10:00:00Z",
  })
  const draft = pull(3, "OPEN", "2026-11-01T10:00:00Z", "ephraimduncan", true)
  expect(latest(output("https://github.com/EphraimDuncan/opencode-plus", [draft])).state).toBe("draft")
  expect(latest(output(remote, [pull(12, "OPEN", "2026-11-03T12:00:00Z", "someone-else")]))).toBeUndefined()
})

// What `gh api --include` printed for the pull requests of a branch (2026-11-05), without the headers of the token.
const included = (name) => readFileSync(join(import.meta.dirname, "fixtures/github", `${name}.txt`), "utf8")

// Catches an answer that loses the merge, its time, or the ETag: without the ETag, each request counts against the rate
// limit.
test("reads the merged pull request and the ETag from GitHub's answer", () => {
  expect(answer(included("pulls-merged"))).toEqual({
    etag: 'W/"ce976e923f5356df840b0e52c3e19dec7630c66f392b25a121ec6766363e3760"',
    pull: {
      number: 17,
      title: "feat: archive a session when its pull request merges",
      url: "https://github.com/ephraimduncan/opencode-plus/pull/17",
      state: "merged",
      closedAt: "2026-11-05T11:40:25Z",
      updatedAt: "2026-11-05T11:40:25Z",
    },
  })
})

// Catches a closed pull request read as open or merged: a close also ends the work of its sessions.
test("reads a pull request that closed without a merge", () => {
  const [head, body] = included("pulls-merged").split("\r\n\r\n")
  const [merged] = JSON.parse(body)
  const closed = { ...merged, merged_at: null, merge_commit_sha: null }

  expect(answer(`${head}\r\n\r\n${JSON.stringify([closed])}`).pull).toMatchObject({
    state: "closed",
    closedAt: "2026-11-05T11:40:25Z",
  })
})

// Catches a 304 read as a branch with no pull request, which forgets the pull request and the ETag.
test("an answer of 304 changes nothing", () => {
  expect(answer(included("pulls-unchanged"))).toBeUndefined()
})

// Catches the merge of an earlier pull request that archives the sessions of a reused branch with an open one.
test("an open pull request of the branch hides an older merged one in GitHub's answer", () => {
  const output = included("pulls-merged")
  const [head, body] = output.split("\r\n\r\n")
  const [merged] = JSON.parse(body)
  const open = { ...merged, number: 18, state: "open", merged_at: null, updated_at: "2026-11-05T10:00:00Z" }

  expect(answer(`${head}\r\n\r\n${JSON.stringify([merged, open])}`).pull).toMatchObject({ number: 18, state: "open" })
})

// Catches a lookup for every row and every pass: rows of one project and branch share a lookup, and the badge shows
// after the branch name.
test("looks up each project and branch once, and shows the pull request after the branch", async () => {
  document.body.innerHTML =
    row("opencode-plus", "A", "feat/pr") + row("opencode-plus", "B", "feat/pr") + row("opencode-plus", "C", "main")
  const lookup = vi.fn(async (project, branch) =>
    branch === "feat/pr" ? { number: 5, title: "PR 5", url: "https://example.com/5", state: "merged" } : undefined,
  )

  show(options(lookup))
  await settle()
  show(options(lookup))

  expect(lookup.mock.calls).toEqual([
    ["opencode-plus", "feat/pr"],
    ["opencode-plus", "main"],
  ])
  const badges = ["A", "B", "C"].map((title) => {
    const badge = titled(title).querySelector("[data-plus-pr]")

    return badge && [badge.previousElementSibling.textContent, badge.textContent, badge.getAttribute("data-plus-pr")]
  })
  expect(badges).toEqual([["feat/pr", "#5", "merged"], ["feat/pr", "#5", "merged"], null])
})

// Catches a badge that only shows a pull request made before the session ran: the agent can make one in the run.
test("looks up the branch again when a session on it stops working", async () => {
  document.body.innerHTML = row("opencode-plus", "A", "feat/pr", "working")
  const lookup = vi.fn(async () => undefined)

  show(options(lookup))
  await settle()
  show(options(lookup))
  titled("A").setAttribute("data-status", "done")
  show(options(lookup))
  await settle()

  expect(lookup).toHaveBeenCalledTimes(2)
})

// Catches a click that also opens the session: the badge sits inside the session's row.
test("a click on the badge opens the pull request without opening the row", async () => {
  document.body.innerHTML = row("opencode-plus", "A", "feat/pr")
  const opened = vi.fn()
  const open = vi.fn()
  const lookup = async () => ({ number: 5, title: "PR 5", url: "https://example.com/5", state: "open" })
  titled("A").addEventListener("click", opened)

  show(options(lookup, open))
  await settle()
  show(options(lookup, open))
  titled("A").querySelector("[data-plus-pr]").click()

  expect(open).toHaveBeenCalledWith("https://example.com/5")
  expect(opened).not.toHaveBeenCalled()
})
