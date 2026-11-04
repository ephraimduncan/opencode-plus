// The app opens every web link in the system browser (OpenCode Desktop 2.2.5): the window hands each page it does not
// host to the operating system. Conversation links are `<a target="_blank">`; some have a click handler of their own.

// Runs `open` with the address of each web link that a click with no modifier keys activates, and stops the app from
// opening the link when `open` returns true. A click with ⌘, Ctrl, Shift or Alt keeps the system browser. Links in the
// app's dialogs, such as Settings, also keep it: a dialog covers the pane. Returns the cleanup.
export function listen(open) {
  const click = (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null

    if (!(link instanceof HTMLAnchorElement) || !/^https?:$/.test(link.protocol) || link.closest('[role="dialog"]'))
      return
    if (open(link.href)) event.preventDefault()
  }

  // On the document as it bubbles, where Solid runs the app's click handlers first. A link that the app opens itself
  // is default-prevented by then; a handler that stops the event does not stop the other listeners of the document.
  document.addEventListener("click", click)

  return () => document.removeEventListener("click", click)
}
