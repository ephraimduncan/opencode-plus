// @vitest-environment node
import { describe, expect, test } from "vitest"
import { parse } from "../src/workflow/script.js"
import { check, validate } from "../src/workflow/schema.js"

describe("parse", () => {
  test("reads the meta literal after leading comments", () => {
    const { meta } = parse(`// A review.
/* Two phases. */
export const meta = {
  name: 'review-changes',
  description: 'Review changed files, verify each finding', // shown in the approval
  phases: [{ title: 'Review', detail: "one agent per file" }, { title: 'Verify' }],
}
return 1`)

    expect(meta).toEqual({
      name: "review-changes",
      description: "Review changed files, verify each finding",
      phases: [{ title: "Review", detail: "one agent per file" }, { title: "Verify" }],
    })
  })

  test.each([
    ["no meta", "await agent('x')", "must begin with `export const meta"],
    ["meta after code", "const x = 1\nexport const meta = { name: 'a', description: 'b' }", "must begin with"],
    ["a variable in meta", "export const meta = { name: NAME, description: 'b' }", "pure literal"],
    ["a spread in meta", "export const meta = { ...{ name: 'a' }, description: 'b' }", "pure literal"],
    ["a call in meta", "export const meta = { name: String('a'), description: 'b' }", "pure literal"],
    // A tagged template is a call with no parentheses: it reaches the Function constructor through a property chain.
    [
      "a tagged template in meta",
      "export const meta = { name: 'a', description: ''['constructor']['constructor']`return 1` }",
      "pure literal",
    ],
    ["a property read in meta", "export const meta = { name: 'abc'['length'], description: 'b' }", "pure literal"],
    ["interpolation in meta", "export const meta = { name: `a${1}`, description: 'b' }", "no template interpolation"],
    ["a meta without a description", "export const meta = { name: 'a' }", "`meta.description`"],
    ["phases without titles", "export const meta = { name: 'a', description: 'b', phases: ['Find'] }", "`meta.phases`"],
    ["a dynamic import", "export const meta = { name: 'a', description: 'b' }\nconst fs = await import('node:fs')", "cannot load modules"],
    ["an import() with a comment", "export const meta = { name: 'a', description: 'b' }\nawait import/**/('node:fs')", "cannot load modules"],
    ["an import() with a line comment", "export const meta = { name: 'a', description: 'b' }\nawait import // x\n('node:fs')", "cannot load modules"],
    ["a static import", "export const meta = { name: 'a', description: 'b' }\nimport fs from 'node:fs'", "cannot load modules"],
    ["TypeScript", "export const meta = { name: 'a', description: 'b' }\nconst files: string[] = []", "syntax error"],
  ])("rejects %s", (_, source, message) => {
    expect(() => parse(source)).toThrow(message)
  })
})

describe("check", () => {
  test.each([
    ["a root that is not an object", { type: "array", items: {} }, "at its root"],
    ["a root without properties", { type: "object" }, "at its root"],
    ["a required key the root does not define", { type: "object", properties: { a: {} }, required: ["b"] }, 'requires "b"'],
    [
      "a nested required key that additionalProperties rules out",
      {
        type: "object",
        properties: { item: { type: "object", properties: {}, required: ["x"], additionalProperties: false } },
      },
      '`/item` requires "x"',
    ],
  ])("rejects %s", (_, schema, message) => {
    expect(() => check(schema)).toThrow(message)
  })

  test("accepts a nested required key that additional properties can hold", () => {
    expect(() =>
      check({ type: "object", properties: { item: { type: "object", required: ["x"] } }, required: ["item"] }),
    ).not.toThrow()
  })
})

describe("validate", () => {
  const FINDINGS = {
    type: "object",
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: { file: { type: "string" }, line: { type: "integer" }, severity: { enum: ["low", "high"] } },
          required: ["file", "severity"],
          additionalProperties: false,
        },
      },
    },
    required: ["findings"],
  }

  test.each([
    ["a matching value", { findings: [{ file: "a.ts", line: 3, severity: "high" }] }, []],
    ["a missing key", {}, ['/: missing required property "findings"']],
    ["a wrong type deep in a list", { findings: [{ file: 4, severity: "low" }] }, ["/findings/0/file: must be string, not number"]],
    ["a fraction for an integer", { findings: [{ file: "a", line: 1.5, severity: "low" }] }, ["/findings/0/line: must be integer, not number"]],
    ["a value outside the enum", { findings: [{ file: "a", severity: "mid" }] }, ['/findings/0/severity: must be one of "low", "high"']],
    ["an extra key", { findings: [{ file: "a", severity: "low", note: "x" }] }, ["/findings/0/note: is not an allowed property"]],
  ])("reports %s", (_, value, errors) => {
    expect(validate(FINDINGS, value)).toEqual(errors)
  })
})
