// A row for the project menu, the one that opens from the project name above the conversation. The menu is the app's
// own component, which plugins cannot import, so the row copies its item markup (OpenCode Desktop 2.2.5). `icon` fills
// in its icon, and `shortcut` is the key text to show at its end.
export function newSessionRow({ label, icon, shortcut, onSelect }) {
  const separator = document.createElement("hr")
  separator.setAttribute("data-slot", "menu-v2-separator")

  const row = document.createElement("div")
  row.setAttribute("role", "menuitem")
  row.setAttribute("data-component", "menu-v2-item")

  const content = document.createElement("span")
  content.setAttribute("data-slot", "menu-v2-item-content")
  icon(content)
  content.append(label)
  row.append(content)

  if (shortcut) {
    const keys = document.createElement("span")
    keys.setAttribute("data-slot", "menu-v2-item-shortcut")
    keys.textContent = shortcut
    row.append(keys)
  }

  row.addEventListener("pointerenter", () => row.setAttribute("data-highlighted", ""))
  row.addEventListener("pointerleave", () => row.removeAttribute("data-highlighted"))
  row.addEventListener("click", () => {
    // Escape closes the menu. Leaving the session would not: its hidden view stays mounted.
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    onSelect()
  })

  // The menu sets its items' density; match its other items once the row is in place.
  queueMicrotask(() => {
    const appearance = row.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance")

    if (!appearance) return
    row.setAttribute("data-appearance", appearance)
    separator.setAttribute("data-appearance", appearance)
  })

  return [separator, row]
}
