// Reads the plugin's `options` from its entry in opencode.json. `0`, `false`, and `""` are real choices that turn a
// feature off, so only a missing or malformed value falls back to its default.
export function settings(options = {}) {
  const hours = options.archiveAfterHours

  return {
    archiveAfterHours: typeof hours === "number" && hours >= 0 ? hours : 12,
    hideAgent: typeof options.hideAgent === "string" || options.hideAgent === false ? options.hideAgent : "build",
    responseLabel:
      typeof options.responseLabel === "string" ? options.responseLabel : options.responseLabel === false ? "" : "Response",
    lowercaseVariants: options.lowercaseVariants !== false,
  }
}
