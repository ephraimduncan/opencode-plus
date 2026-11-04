// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { saveWorkflow } from "../src/workflow/store.js"

const source = (name, body = "return 1") => `export const meta = { name: '${name}', description: 'A test workflow' }\n${body}`

describe("saveWorkflow", () => {
  let project

  beforeEach(() => {
    project = mkdtempSync(join(tmpdir(), "ocp-store-"))
    mkdirSync(join(project, ".git"))
  })

  afterEach(() => rmSync(project, { recursive: true, force: true }))

  // Catches a silent overwrite: "Review changes" and "review-changes" share the file review-changes.js.
  test("refuses to replace a different workflow that has the same file name", () => {
    const path = saveWorkflow({ source: source("Review changes"), name: "Review changes", scope: "project", directory: project })

    expect(() =>
      saveWorkflow({ source: source("review-changes"), name: "review-changes", scope: "project", directory: project }),
    ).toThrow("holds a different workflow")
    expect(readFileSync(path, "utf8")).toBe(source("Review changes"))
  })

  test("replaces the same workflow when it is saved again", () => {
    saveWorkflow({ source: source("audit"), name: "audit", scope: "project", directory: project })
    const path = saveWorkflow({ source: source("audit", "return 2"), name: "audit", scope: "project", directory: project })

    expect(path).toBe(join(project, ".opencode", "workflows", "audit.js"))
    expect(readFileSync(path, "utf8")).toBe(source("audit", "return 2"))
  })
})
