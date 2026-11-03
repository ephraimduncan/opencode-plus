// Every change the plugin makes to the app's markup goes through these two, so a pass that finds nothing new writes
// nothing, and the page-wide observer does not wake again.

export const set = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

// Sets the attribute, or removes it when the value is undefined.
export const mark = (element, name, value) =>
  value === undefined ? element.removeAttribute(name) : set(element, name, value)

// The app's chevron-down icon, for a CSS mask.
export const chevron =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>'
