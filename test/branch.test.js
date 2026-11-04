import { beforeEach, expect, test } from "vitest"
import { branches, check, clean, command, css, directory, mount, show, state } from "../src/branch.js"

const icon = (name) => `<svg data-slot="icon-svg" width="16" height="16"><use href="#opencode-v2-icon-${name}"></use></svg>`

// The tray's branch for a project folder or an existing worktree (OpenCode Desktop 2.2.5, workspace/selector.tsx).
const label = (name) =>
  `<div data-component="tooltip-v2-trigger" class="flex min-w-0 max-w-[220px]">` +
  `<div class="flex h-7 min-w-0 max-w-[220px] items-center gap-1.5 ps-1.5 pe-2 text-v2-text-text-faint">` +
  `${icon("branch")}<span dir="auto" class="min-w-0 truncate">${name}</span></div></div>`

// The app's own branch picker, for a new worktree.
const picker =
  `<div data-component="tooltip-v2-trigger" class="flex min-w-0 max-w-[220px]">` +
  `<button aria-description="Choose branch" class="flex h-7 min-w-0 max-w-[220px] items-center gap-1.5 rounded-sm px-1.5">` +
  `${icon("branch-out")}<span dir="auto" class="min-w-0 truncate">From main</span>${icon("chevron-down")}</button></div>`

// The tray under the new session page's chat input (new-session/view.tsx), with `branch`, and `path` at its end.
const tray = (branch, path) =>
  `<div data-slot="new-session-composer" class="flex flex-col gap-1"><div class="relative z-10"></div>` +
  `<div class="relative flex min-h-9 min-w-0 items-center gap-3 ps-2 pe-1.5">` +
  `<div class="flex min-w-0 max-w-full flex-wrap items-center gap-x-0 gap-y-1 py-1.5">` +
  `<div class="flex min-w-0 max-w-full items-center"><button type="button" data-action="prompt-project">opencode-plus</button>` +
  `<button type="button" data-action="prompt-worktree">${icon("monitor")}<span class="min-w-0 truncate">Local</span></button></div>` +
  `${branch}</div>` +
  (path
    ? `<div class="flex min-w-0 flex-1 justify-end pe-1.5"><div data-component="tooltip-v2-trigger" class="flex min-w-0 flex-1">` +
      `<span class="flex min-w-0 flex-1 items-center justify-end" dir="ltr"><span data-slot="new-session-location-path">` +
      `<bdi dir="ltr">${path}</bdi></span></span></div></div>`
    : "") +
  `</div></div>`

// A project as the server lists it (`ctx.client.project.list()`).
const project = (canonical, sandboxes) => ({
  id: `prj_${canonical.split("/").pop()}`,
  canonical,
  vcs: "git",
  name: undefined,
  time: { created: 1, updated: 2, active: 3 },
  sandboxes,
})

beforeEach(() => {
  clean()
  document.head.innerHTML = ""
  document.body.innerHTML = ""
})

// Catches a dropdown on the wrong branch icon, a second dropdown on every pass over the page, a dropdown that a later
// pass does not update, and a dropdown that outlives its label: the app's own picker for a new worktree and a branch
// icon outside the tray stay as they are.
test("gives the tray's branch label one dropdown, updates it on each later pass, and ends it with the label", () => {
  document.body.innerHTML =
    tray(label("main"), "/Users/ephraim/dev/opencode-plus") +
    tray(picker) +
    `<div class="flex items-center gap-1.5">${icon("branch")}<span>main</span></div>`
  const rendered = []
  const updated = []
  const disposed = []
  const render = (container, element) => {
    const name = element.querySelector("span").textContent
    rendered.push(name)

    return { update: () => updated.push(name), dispose: () => disposed.push(name) }
  }

  mount(render)
  mount(render)

  expect(rendered).toEqual(["main"])
  expect(updated).toEqual(["main"])

  document.body.innerHTML = ""
  mount(render)

  expect(disposed).toEqual(["main"])
  expect(updated).toEqual(["main"])
})

// The app's menu button, as Kobalte marks it while its menu is open, and the open menu with a row for each of `names`.
const open = (...names) => {
  mount((container) => {
    container.innerHTML = `<button type="button" aria-haspopup="true" aria-expanded="true" aria-controls="menu-1" data-expanded="">Switch branch</button>`

    return { update: () => {}, dispose: () => {} }
  })
  const row = (name) =>
    `<div role="menuitem" data-component="menu-v2-item" data-appearance="compact">` +
    `<span data-slot="menu-v2-item-content"><span class="min-w-0 truncate">${name}</span></span></div>`
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="menu-1" role="menu" data-component="menu-v2-content" data-appearance="compact">` +
      `${names.map(row).join("")}<hr data-slot="menu-v2-separator">` +
      `<div role="group"><span data-slot="menu-v2-group-label">Remote</span>${row("origin/new-remote")}</div></div>`,
  )

  return document.querySelector("[data-plus-branch]")
}

const checked = () => Array.from(document.querySelectorAll("[data-plus-branch-current]"), (item) => item.textContent)

// Catches a check on the wrong branch, such as one whose name only starts with the current branch's name.
test("checks the label's branch in its open dropdown", () => {
  document.body.innerHTML = tray(label("main"), "/Users/ephraim/dev/opencode-plus")
  open("feature/x", "main-old", "main")

  check()

  expect(checked()).toEqual(["main"])
})

// With "Local" chosen after ⌘T in a worktree's session, the app names the worktree's branch, but the path and the new
// session are the project folder's. Catches a label that keeps the worktree's branch, a check that follows it, and a
// label that hides the app's branch when the folder's branch is unknown.
test.each([
  ["feat/workflows", "main", "main"],
  ["main", "main", "main"],
  ["feat/workflows", undefined, "feat/workflows"],
])("with the app's %s and the folder's %s, the label shows %s and checks it", (app, folder, want) => {
  document.head.innerHTML = `<style>${css}</style>`
  document.body.innerHTML = tray(label(app), "/Users/ephraim/dev/opencode-plus")
  const element = open("main", "demo", "feat/workflows")

  show(element, folder)
  check()

  const shown = Array.from(element.querySelectorAll("span"))
    .filter((span) => getComputedStyle(span).display !== "none")
    .map((span) => span.textContent)
  expect(shown).toEqual([want])
  expect(checked()).toEqual([want])
})

// Catches a list that stays on the old folder's branches after the user chooses a different folder or the app's branch
// changes, and a list that loads again on each pass because the label now shows the folder's branch.
test("the tray's state changes with its path and the app's branch, but not with the branch the label shows", () => {
  document.body.innerHTML = tray(label("feat/workflows"), "/Users/ephraim/dev/opencode-plus")
  const element = open("main")
  const before = state(element)

  show(element, "main")
  expect(state(element)).toBe(before)

  element.querySelector(":scope > span").textContent = "demo"
  expect(state(element)).not.toBe(before)

  element.querySelector(":scope > span").textContent = "feat/workflows"
  document.querySelector('[data-slot="new-session-location-path"] bdi').textContent = "/Users/ephraim/…/3a950b/crisp-squid"
  expect(state(element)).not.toBe(before)
})

// Catches git running in the wrong folder: a path the tray shows in full is used as it is, and a shortened path
// resolves to the one project folder or worktree that fits it.
test.each([
  ["/Users/ephraim/dev/opencode-plus", "/Users/ephraim/dev/opencode-plus"],
  ["/Users/ephraim/…/abc/feature-x", "/Users/ephraim/.local/share/opencode/worktree/abc/feature-x"],
  ["/Users/ephraim/…/zzz/feature-x", undefined],
])("path %s is folder %s", async (shown, want) => {
  document.body.innerHTML = tray(label("main"), shown)
  const projects = async () => [
    project("/Users/ephraim/dev/opencode-plus", ["/Users/ephraim/.local/share/opencode/worktree/abc/feature-x"]),
    project("/Users/ephraim/dev/roadmap-sync", ["/Users/ephraim/.local/share/opencode/worktree/def/feature-x"]),
  ]

  const element = document.querySelector('[data-slot="new-session-composer"] .text-v2-text-text-faint')

  expect(await directory(element, projects)).toBe(want)
})

// `git branch --all --no-color --no-column --sort=-committerdate` in a clone with a linked worktree.
const output = [
  "  feature/x",
  "  main",
  "* only-remote",
  "+ wt-branch",
  "  remotes/origin/HEAD -> origin/main",
  "  remotes/origin/feature/x",
  "  remotes/origin/main",
  "  remotes/origin/new-remote",
  "  remotes/origin/only-remote",
  "  remotes/origin/wt-branch",
  "",
].join("\n")

// Catches a list git cannot switch to: a branch that another worktree uses, a remote branch twice under its local
// name, or the remote's HEAD pointer.
test("lists the local branches, then the remote branches with no local branch", () => {
  expect(branches(output)).toEqual({
    current: "only-remote",
    local: ["feature/x", "main", "only-remote"],
    remote: [{ name: "new-remote", ref: "origin/new-remote" }],
  })
})

// Catches a detached HEAD taken for a branch named "(HEAD".
test("has no current branch on a detached HEAD", () => {
  expect(branches("* (HEAD detached at ee5c1a4)\n  main\n")).toEqual({
    current: undefined,
    local: ["main"],
    remote: [],
  })
})

// Catches a branch name that the shell reads as code: it must reach git as one word, as it is. A new branch keeps its
// "-c" flag in front of its name.
test.each([
  [["main"], "git switch main"],
  [["feature/x-1.2_b"], "git switch feature/x-1.2_b"],
  [["fix#12"], "git switch 'fix#12'"],
  [["a;rm"], "git switch 'a;rm'"],
  [["it's"], "git switch 'it'\\''s'"],
  [["-c", "feat/login"], "git switch -c feat/login"],
  [["-c", "feat#2"], "git switch -c 'feat#2'"],
])("git switch with %j runs %s", (args, want) => {
  expect(command(...args)).toBe(want)
})
