import { set } from "./dom.js"

// The new session page's tray names the folder's branch under the chat input (OpenCode Desktop 2.2.5). For a project
// folder or an existing worktree it is a plain label: the branch icon, then the name. A new worktree gets the app's own
// branch picker instead, with another icon. The tray ends with the folder's path.

const TRAY = '[data-slot="new-session-composer"]'
const PATH = '[data-slot="new-session-location-path"]'
// The second is the icon of the app's "New icons" experiment.
const ICON = ["branch", "new-branch"].map((name) => `${TRAY} use[href="#opencode-v2-icon-${name}"]`).join(", ")

const BRANCH = "data-plus-branch"

export const css = `
[${BRANCH}] {
  border-radius: var(--radius-sm);
}
[${BRANCH}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
`

// The shell command that lists every branch, the most recent commit first.
export const LIST = "git branch --all --no-color --no-column --sort=-committerdate"

// Makes each tray's branch label a button, described to screen readers as `description`.
export function enable(description) {
  document.querySelectorAll(ICON).forEach((icon) => {
    const label = icon.closest("svg").parentElement

    set(label, BRANCH, "")
    set(label, "role", "button")
    set(label, "tabindex", "0")
    set(label, "aria-haspopup", "dialog")
    set(label, "aria-description", description)
  })
}

// Runs `open` with the branch label that is clicked, or pressed with Enter or Space. Returns the cleanup.
export function listen(open) {
  const label = (event) => (event.target instanceof Element ? event.target.closest(`[${BRANCH}]`) : null)

  const click = (event) => {
    const element = label(event)

    if (element) open(element)
  }

  const key = (event) => {
    const element = label(event)

    if ((event.key !== "Enter" && event.key !== " ") || !element) return
    event.preventDefault()
    open(element)
  }

  document.addEventListener("click", click)
  document.addEventListener("keydown", key)

  return () => {
    document.removeEventListener("click", click)
    document.removeEventListener("keydown", key)
  }
}

// The folder of the label's branch: the path at the end of its tray. The app shortens a long path to its first and
// last folders around "…"; then it is the project folder or worktree from `projects()` whose path fits.
export async function directory(label, projects) {
  const shown = label.closest(TRAY)?.querySelector(PATH)?.textContent ?? ""

  if (!shown.includes("…")) return shown || undefined
  const [start, end] = shown.split("…")

  return (await projects())
    .flatMap((project) => [project.canonical, ...project.sandboxes])
    .find((path) => path.startsWith(start) && path.endsWith(end))
}

// The current branch in the output of `LIST`, and the branches `git switch` takes, as options of the app's select
// dialog. A remote branch with no local branch of its name comes as that name, from which `git switch` makes a local
// branch. A branch that another worktree uses stays out: git does not switch to it.
export function branches(output) {
  const local = new Set()
  const remote = new Map()
  const options = []
  let current

  for (const line of output.split(/\r?\n/)) {
    const name = line.slice(2).trim()

    // A detached HEAD shows as "(HEAD detached at …)", and a remote's default branch as "remotes/origin/HEAD -> …".
    if (!name || name.startsWith("(") || name.includes(" -> ")) continue

    if (name.startsWith("remotes/")) {
      const ref = name.slice("remotes/".length)
      const short = ref.slice(ref.indexOf("/") + 1)

      if (!remote.has(short)) remote.set(short, ref)
      continue
    }

    local.add(name)
    if (line.startsWith("*")) current = name
    if (!line.startsWith("+")) options.push({ title: name, value: name })
  }

  remote.forEach((ref, name) => {
    if (!local.has(name)) options.push({ title: name, value: name, description: ref })
  })

  return { current, options }
}

// The shell command that switches to branch `name`. A branch name has no spaces, but it can hold characters a shell
// reads, so a name with more than letters, digits and . _ / - goes in single quotes.
export const command = (name) => `git switch ${/^[\w./-]+$/.test(name) ? name : `'${name.replaceAll("'", `'\\''`)}'`}`

// Removes every change `enable` made, as when the plugin stops.
export function clean() {
  document.querySelectorAll(`[${BRANCH}]`).forEach((label) => {
    ;[BRANCH, "role", "tabindex", "aria-haspopup", "aria-description"].forEach((name) => label.removeAttribute(name))
  })
}
