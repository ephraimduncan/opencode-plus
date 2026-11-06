// Rows for the app's menus: the project menu that opens from the project name above the conversation, and the context
// menu of a session in the sidebar. The menus are the app's own component, which plugins cannot import, so the rows
// copy its markup (OpenCode Desktop 2.2.5).

// An item labeled `label` that runs `onSelect`. `icon` fills in its icon, if any, and `shortcut` is the key text to
// show at its end.
export function item({ label, icon, shortcut, onSelect }) {
  const row = document.createElement("div")
  row.setAttribute("role", "menuitem")
  row.setAttribute("data-component", "menu-v2-item")

  const content = document.createElement("span")
  content.setAttribute("data-slot", "menu-v2-item-content")
  icon?.(content)
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
    // The menu does not know this row, so the row closes it with Escape. Opening a new session does not close it: the
    // app keeps the views it hides mounted.
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    onSelect()
  })
  fit(row)

  return row
}

export function separator() {
  const element = document.createElement("hr")
  element.setAttribute("data-slot", "menu-v2-separator")
  fit(element)

  return element
}

// The menu sets its items' density; match its other items once `element` is in place.
const fit = (element) =>
  queueMicrotask(() => {
    const appearance = element
      .closest('[role="menu"]')
      ?.querySelector("[data-appearance]")
      ?.getAttribute("data-appearance")

    if (appearance) element.setAttribute("data-appearance", appearance)
  })
