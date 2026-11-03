import { chevron, mark, set } from "./dom.js"

// The new session page's tray names the folder's branch under the chat input (OpenCode Desktop 2.2.5). For a project
// folder or an existing worktree it is a plain label: the branch icon, then the name. A new worktree gets the app's own
// branch picker instead, with another icon. The tray ends with the folder's path.
//
// Each label gets a dropdown like the chat input's reasoning dropdown: the app's menu, opened by a button that lies
// unseen over the label. The label keeps showing the branch, so it follows the app when the branch changes.

const TRAY = '[data-slot="new-session-composer"]'
const PATH = '[data-slot="new-session-location-path"]'
// The second is the icon of the app's "New icons" experiment.
const ICON = ["branch", "new-branch"].map((name) => `${TRAY} use[href="#opencode-v2-icon-${name}"]`).join(", ")

const BRANCH = "data-plus-branch"
const TRIGGER = "data-plus-branch-trigger"
const MENU = "data-plus-branch-menu"
const CURRENT = "data-plus-branch-current"

// The check of the app's radio menu items.
const checkmark =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>'

// The label takes the look of the reasoning dropdown's button. The menu is as wide as its longest branch, up to the
// width of the app's other menus, and a longer name ends in "…". Every item keeps room for the check at its end, as
// the app's radio items do, and a long list scrolls.
export const css = `
[${BRANCH}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${BRANCH}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(chevron)}") center / 16px no-repeat;
}
[${BRANCH}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${TRIGGER}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${TRIGGER}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${MENU}] {
  width: max-content;
  max-width: min(320px, 100vw - 32px);
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${MENU}] [data-slot="menu-v2-item-content"] {
  flex: 0 1 auto;
  min-width: 0;
}
[${MENU}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${MENU}] [${CURRENT}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(checkmark)}") center / 14px no-repeat;
}
`

// The shell command that lists every branch, the most recent commit first.
export const LIST = "git branch --all --no-color --no-column --sort=-committerdate"

const dropdowns = new Map()

// Gives each tray's branch label a dropdown, which `render(container, label)` puts in `container` and returns the
// cleanup of. Ends the dropdowns of labels that left the page.
export function mount(render) {
  dropdowns.forEach((dispose, label) => {
    if (label.isConnected) return
    dispose()
    dropdowns.delete(label)
  })

  document.querySelectorAll(ICON).forEach((icon) => {
    const label = icon.closest("svg").parentElement

    if (dropdowns.has(label)) return
    const container = document.createElement("div")
    container.setAttribute(TRIGGER, "")
    label.setAttribute(BRANCH, "")
    label.append(container)
    dropdowns.set(label, render(container, label))
  })
}

// Marks each open dropdown, and in it the branch its label shows. A name that ends in "…" gets its full text as a
// tooltip.
export function check() {
  document.querySelectorAll(`[${TRIGGER}] > [aria-controls]`).forEach((trigger) => {
    const menu = document.getElementById(trigger.getAttribute("aria-controls"))

    if (!menu) return
    const current = trigger.closest(`[${BRANCH}]`).querySelector(":scope > span").textContent.trim()

    set(menu, MENU, "")
    menu.querySelectorAll('[data-component="menu-v2-item"]').forEach((item) => {
      const text = item.querySelector('[data-slot="menu-v2-item-content"] > span')

      mark(item, CURRENT, item.textContent.trim() === current ? "" : undefined)
      if (text) mark(item, "title", text.scrollWidth > text.clientWidth ? text.textContent : undefined)
    })
  })
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

// The current branch in the output of `LIST`, the local branches `git switch` takes, and the remote branches with no
// local branch of their name. From the name of such a remote branch, `git switch` makes a local branch. A branch that
// another worktree uses stays out: git does not switch to it.
export function branches(output) {
  const names = new Set()
  const local = []
  const refs = new Map()
  let current

  for (const line of output.split(/\r?\n/)) {
    const name = line.slice(2).trim()

    // A detached HEAD shows as "(HEAD detached at …)", and a remote's default branch as "remotes/origin/HEAD -> …".
    if (!name || name.startsWith("(") || name.includes(" -> ")) continue

    if (name.startsWith("remotes/")) {
      const ref = name.slice("remotes/".length)
      const short = ref.slice(ref.indexOf("/") + 1)

      if (!refs.has(short)) refs.set(short, ref)
      continue
    }

    names.add(name)
    if (line.startsWith("*")) current = name
    if (!line.startsWith("+")) local.push(name)
  }

  const remote = Array.from(refs, ([name, ref]) => ({ name, ref })).filter(({ name }) => !names.has(name))

  return { current, local, remote }
}

// The shell command `git switch` with `args`, such as a branch name, or "-c" and the name of a branch to make.
export const command = (...args) => ["git", "switch", ...args.map(quote)].join(" ")

// A branch name has no spaces, but it can hold characters a shell reads, so an argument with more than letters, digits
// and . _ / - goes in single quotes.
export const quote = (arg) => (/^[\w./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", `'\\''`)}'`)

// Removes every dropdown and mark, as when the plugin stops.
export function clean() {
  dropdowns.forEach((dispose) => dispose())
  dropdowns.clear()
  document.querySelectorAll(`[${TRIGGER}]`).forEach((container) => container.remove())
  document.querySelectorAll(`[${BRANCH}]`).forEach((label) => label.removeAttribute(BRANCH))
}
