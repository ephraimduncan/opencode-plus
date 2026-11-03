import { expect, test } from "vitest"
import { settings } from "../src/settings.js"

// Catches a default that swallows a real choice: `0`, `false`, and `""` each turn a feature off.
test.each([
  [{}, { archiveAfterHours: 12, hideAgent: "build", responseLabel: "Response", lowercaseVariants: true }],
  [{ archiveAfterHours: 0 }, { archiveAfterHours: 0 }],
  [{ archiveAfterHours: 2.5 }, { archiveAfterHours: 2.5 }],
  [{ archiveAfterHours: -1 }, { archiveAfterHours: 12 }],
  [{ archiveAfterHours: "6" }, { archiveAfterHours: 12 }],
  [{ hideAgent: false }, { hideAgent: false }],
  [{ hideAgent: "plan" }, { hideAgent: "plan" }],
  [{ hideAgent: 1 }, { hideAgent: "build" }],
  [{ responseLabel: "" }, { responseLabel: "" }],
  [{ responseLabel: false }, { responseLabel: "" }],
  [{ responseLabel: "Answer" }, { responseLabel: "Answer" }],
  [{ lowercaseVariants: false }, { lowercaseVariants: false }],
])("%o", (options, want) => {
  expect(settings(options)).toMatchObject(want)
})
