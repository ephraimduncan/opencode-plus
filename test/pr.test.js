import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { answer, clean, listen, read, scan, show } from "../src/pr.js"

// A session row as the app's sidebar renders it (OpenCode Desktop 2.2.6, inbox.tsx): the worktree and branch icons
// follow the project's name, and the branch name shows only in the tooltip of its icon.
const row = (project, title, status = "ready") =>
  `<button type="button" data-slot="sidebar-inbox-item" data-status="${status}" class="group flex h-[54px] flex-col">` +
  `<span class="flex h-4 w-full min-w-0 items-center gap-2"><span class="flex size-4 shrink-0">${project[0].toUpperCase()}</span>` +
  `<span dir="auto" class="min-w-0 flex-1 truncate">${title}</span></span>` +
  `<span class="relative flex h-4 w-full min-w-0 items-center gap-2 ps-6">` +
  `<span class="flex min-w-0 flex-1 items-center gap-2"><span dir="auto" class="min-w-0 truncate">${project}</span>` +
  `<div data-component="tooltip-v2-trigger" class="flex shrink-0"><svg data-slot="icon-svg"><use href="#opencode-v2-icon-outline-worktree"></use></svg></div>` +
  `<div data-component="tooltip-v2-trigger" class="flex shrink-0"><svg data-slot="icon-svg"><use href="#opencode-v2-icon-branch"></use></svg></div>` +
  `</span><span class="ms-auto flex shrink-0 items-center gap-1.5"><span class="text-v2-text-text-faint">2h</span></span></span></button>`

const titled = (title) =>
  Array.from(document.querySelectorAll('[data-slot="sidebar-inbox-item"]')).find(
    (element) => element.querySelector("span[dir]").textContent === title,
  )

const badge = (title) => titled(title).querySelector("[data-plus-pr]")

const FOLDER = "/Users/ephraim/dev/opencode-plus"

// The session of each row, by its title. A and B share a folder, and thus its branch.
const sessions = {
  A: { id: "ses_a", directory: FOLDER },
  B: { id: "ses_b", directory: FOLDER },
  C: { id: "ses_c", directory: `${FOLDER}/worktree` },
}

const identify = (element) => sessions[element.querySelector("span[dir]").textContent]

const url = (number) => `https://github.com/ephraimduncan/opencode-plus/pull/${number}`

// An assistant message with one call of the shell tool, as the server lists it (OpenCode 2.3.0). A call that still
// runs, or that the app stopped, has no output.
const shell = (id, command, text, status = "completed") => ({
  id,
  type: "assistant",
  time: { created: 1, ...(status === "running" ? {} : { completed: 2 }) },
  content: [
    {
      type: "tool",
      id: `toolu_${id}`,
      name: "shell",
      state: {
        status,
        input: { command },
        ...(status === "completed" ? { content: [{ type: "text", text }], metadata: { exit: 0 } } : {}),
      },
    },
  ],
})

const CREATE = "gh pr create --base main --body-file pr.md"

// A message whose command made pull request `number`, with what `git push` and `gh` print for it.
const make = (id, number) =>
  shell(
    id,
    `git push -q -u origin feat/pr; ${CREATE}`,
    "remote: Create a pull request for 'feat/pr' on GitHub by visiting:\n" +
      `remote:      https://github.com/ephraimduncan/opencode-plus/pull/new/feat/pr\n${url(number)}\n`,
  )

// Pages of two of `list`, as `message.list` gives them. The page after the last one is empty.
const pages = (list) => async (cursor) => {
  const start = Number(cursor ?? 0)

  return { data: list.slice(start, start + 2), cursor: { next: String(start + 2) } }
}

// The assistant messages of each session, the newest first.
let messages

const page = vi.fn((id, cursor) => pages(messages[id])(cursor))

// The state of each pull request on GitHub.
let states

// What `gh pr view --json number,title,url,state,isDraft` prints for pull request `number`.
const printed = (number, state, isDraft = false) =>
  JSON.stringify({ isDraft, number, state, title: `PR ${number}`, url: url(number) })

const numbers = (command) => Array.from(command.matchAll(/pull\/(\d+)/g), ([, number]) => Number(number))

const run = vi.fn(async (_, command) => ({
  ok: true,
  output: numbers(command)
    .map((number) => printed(number, states[number]))
    .join("\n"),
}))

const settle = () => new Promise((resolve) => setTimeout(resolve))

const options = (open = () => {}) => ({
  identify,
  page,
  run,
  changed: () => {},
  open,
  label: ({ number, state }) => `#${number} ${state}`,
})

beforeEach(() => {
  clean()
  vi.clearAllMocks()
  document.body.innerHTML = ""
  messages = { ses_a: [make("msg_a1", 5)], ses_b: [make("msg_b2", 7), make("msg_b1", 6)], ses_c: [] }
  states = { 5: "MERGED", 6: "MERGED", 7: "OPEN" }
})

afterEach(() => {
  vi.useRealTimers()
})

// Catches a pull request that the session did not make: one that `gh` found for the branch, or one that the agent only
// read. Also catches a pull request lost because its command still ran at the scan.
test("finds the pull requests that the commands of a session made, the oldest first", async () => {
  const list = [
    shell("msg_6", CREATE, "", "running"),
    make("msg_5", 9),
    shell("msg_4", "gh pr view --json url --jq .url", `${url(3)}\n`),
    shell("msg_3", CREATE, `a pull request for branch "feat/pr" into branch "main" already exists:\n${url(4)}\n`),
    shell("msg_2", CREATE, "", "error"),
    make("msg_1", 8),
  ]

  expect(await scan(pages(list))).toEqual({ seen: "msg_5", urls: [url(8), url(9)] })
  expect(await scan(pages(list), "msg_5")).toEqual({ seen: "msg_5", urls: [] })

  list[0] = make("msg_6", 10)
  expect(await scan(pages(list), "msg_5")).toEqual({ seen: "msg_6", urls: [url(10)] })
})

// Catches a draft read as open, and one pull request that `gh` could not read, which prints nothing, read as a failure
// of all of them.
test("reads the pull requests that `gh pr view` prints", () => {
  expect(read(`${printed(7, "OPEN", true)}\n\n${printed(5, "MERGED")}\n`)).toEqual([
    { number: 7, title: "PR 7", url: url(7), state: "draft" },
    { number: 5, title: "PR 5", url: url(5), state: "merged" },
  ])
  expect(read("")).toEqual([])
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

// Catches the pull request of a branch on every session of its folder, and a lookup on every pass. The badge of a
// session that made two names the open one.
test("shows each session the pull requests that it made, after the branch icon", async () => {
  document.body.innerHTML = row("opencode-plus", "A") + row("opencode-plus", "B") + row("opencode-plus", "C")

  show(options())
  await settle()
  show(options())
  await settle()

  expect(run.mock.calls.map(([directory, command]) => [directory, numbers(command)])).toEqual([
    [FOLDER, [5]],
    [FOLDER, [6, 7]],
  ])
  const badges = ["A", "B", "C"].map((title) => {
    const element = badge(title)

    return (
      element && [
        element.previousElementSibling.querySelector("use").getAttribute("href"),
        element.textContent,
        element.getAttribute("data-plus-pr"),
        element.getAttribute("data-plus-pr-more"),
      ]
    )
  })
  expect(badges).toEqual([
    ["#opencode-v2-icon-branch", "#5", "merged", null],
    ["#opencode-v2-icon-branch", "#7", "open", "1"],
    null,
  ])
})

// Catches a badge that keeps the state of a pull request after it merges, and a request to GitHub every two minutes
// for a pull request that cannot change.
test("reads a pull request again after two minutes, until it is merged", async () => {
  vi.useFakeTimers({ toFake: ["Date"] })
  document.body.innerHTML = row("opencode-plus", "A") + row("opencode-plus", "B")
  show(options())
  await settle()
  vi.clearAllMocks()

  states[7] = "MERGED"
  vi.setSystemTime(Date.now() + 2 * 60 * 1000)
  show(options())
  await settle()
  vi.setSystemTime(Date.now() + 2 * 60 * 1000)
  show(options())
  await settle()

  expect(run.mock.calls.map(([, command]) => numbers(command))).toEqual([[6, 7]])
  expect(page).not.toHaveBeenCalled()
  expect([badge("B").textContent, badge("B").getAttribute("data-plus-pr")]).toEqual(["#7", "merged"])
})

// Catches a badge that only shows a pull request made before the plugin started: the agent makes one in a run.
test("looks for new pull requests when the session stops working", async () => {
  document.body.innerHTML = row("opencode-plus", "C", "working")

  show(options())
  await settle()
  show(options())
  expect(badge("C")).toBeNull()

  messages.ses_c = [make("msg_c1", 5)]
  titled("C").setAttribute("data-status", "done")
  show(options())
  await settle()
  show(options())

  expect(badge("C").textContent).toBe("#5")
})

// Catches a click that also opens the session: the badge sits inside the session's row.
test("a click on the badge opens the pull request without opening the row", async () => {
  document.body.innerHTML = row("opencode-plus", "A")
  const opened = vi.fn()
  const open = vi.fn()
  titled("A").addEventListener("click", opened)

  show(options(open))
  await settle()
  show(options(open))
  badge("A").click()

  expect(open).toHaveBeenCalledWith(url(5))
  expect(opened).not.toHaveBeenCalled()
})

// Catches a badge of several pull requests that can open only the one that it names.
test("lists the pull requests of a session that made several, and opens the one that a click selects", async () => {
  document.body.innerHTML = row("opencode-plus", "B")
  const open = vi.fn()
  const stop = listen(open)

  show(options())
  await settle()
  show(options())
  badge("B").dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }))
  await new Promise((resolve) => setTimeout(resolve, 100))

  const items = Array.from(document.querySelectorAll('[data-plus-pr-list] > [role="link"]'))
  expect(items.map((item) => Array.from(item.children, (part) => part.textContent))).toEqual([
    ["#7", "PR 7"],
    ["#6", "PR 6"],
  ])

  items[1].click()
  stop()

  expect(open).toHaveBeenCalledWith(url(6))
  expect(document.querySelector("[data-plus-pr-list]")).toBeNull()
})
