// A one-line summary of a tool call for the Workflows panel, from the tool's input: the file it reads, the command it
// runs, the query it searches. Paths inside `directory` show relative to it. Shared by the server part and the panel.

const KEYS = ["filePath", "file", "command", "pattern", "query", "url", "path", "description", "prompt", "name"]

export function summarize(input, directory) {
  if (!input || typeof input !== "object") return ""

  const key = KEYS.find((name) => typeof input[name] === "string" && input[name].trim())
  const value = key ? input[key] : Object.values(input).find((item) => typeof item === "string" && item.trim())

  return value ? oneLine(relative(value, directory), 120) : ""
}

function relative(text, directory) {
  if (!directory) return text

  const base = directory.endsWith("/") ? directory : `${directory}/`

  return text === directory ? "." : text.split(base).join("")
}

// A result (JSON) on one line: text as it is, and structured output as `key: value` pairs, with lists as counts.
export function brief(json, length) {
  let value

  try {
    value = JSON.parse(json)
  } catch {
    return oneLine(json, length)
  }

  if (typeof value === "string") return oneLine(value, length)
  if (Array.isArray(value)) return items(value.length)
  if (!value || typeof value !== "object") return String(value)

  return oneLine(
    Object.entries(value)
      .map(([key, item]) => `${key}: ${short(item)}`)
      .join(" · "),
    length,
  )
}

const items = (count) => (count === 1 ? "1 item" : `${count} items`)

function short(value) {
  if (Array.isArray(value)) return items(value.length)
  if (value && typeof value === "object") return "{…}"

  return String(value)
}

function oneLine(text, length) {
  const line = String(text).replace(/\s+/g, " ").trim()

  return line.length > length ? `${line.slice(0, length - 1)}…` : line
}
