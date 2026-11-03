// Every change the plugin makes to the app's markup goes through these two, so a pass that finds nothing new writes
// nothing, and the page-wide observer does not wake again.

export const set = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

// Sets the attribute, or removes it when the value is undefined.
export const mark = (element, name, value) =>
  value === undefined ? element.removeAttribute(name) : set(element, name, value)
