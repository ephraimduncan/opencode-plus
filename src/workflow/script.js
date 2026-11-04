import vm from "node:vm"

// A workflow script starts with `export const meta = { ... }`: a pure literal that names the workflow, describes it,
// and lists its phases. The rest is plain JavaScript with top-level `await`, run by the sandbox.

const HEAD = /^export\s+const\s+meta\s*=\s*/

// `import(` with any white space or comments between the two, including the HTML-like comments that scripts allow.
const IMPORT = /\bimport(?:\s|\/\*[\s\S]*?\*\/|(?:\/\/|<!--|-->)[^\n\r\u2028\u2029]*)*\(/

// Splits `source` into its meta and the code the sandbox runs. The code keeps the meta as a plain `const meta`, with
// every character in place, so that line numbers in errors match the source. Throws a message for the model when the
// script cannot run.
export function parse(source) {
  if (typeof source !== "string" || !source.trim()) throw new Error("The workflow script is empty.")
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u202a-\u202e\u2066-\u2069]/.test(source))
    throw new Error("The workflow script contains control or invisible format characters.")

  const start = skip(source, 0)
  const head = HEAD.exec(source.slice(start))

  if (!head || source[start + head[0].length] !== "{")
    throw new Error("A workflow script must begin with `export const meta = { name, description, phases }`.")

  const open = start + head[0].length
  const close = literalEnd(source, open)
  const meta = evaluate(source.slice(open, close + 1))
  const code = source.slice(0, start) + " ".repeat("export".length) + source.slice(start + "export".length)

  if (IMPORT.test(code.slice(close)) || /^\s*import[\s{*"']/m.test(code.slice(close)))
    throw new Error("Workflow scripts cannot load modules. Put work that needs a library in an agent's task.")

  if (/^\s*export\s/m.test(code.slice(close))) throw new Error("Only `meta` can be exported from a workflow script.")

  compile(code, meta.name)

  return { meta, code }
}

// The function the sandbox evaluates. The wrapper adds one line before the script, which `lineOffset` takes back.
// `importModuleDynamically` answers an import() that gets past `parse`.
export function compile(code, name = "workflow", importModuleDynamically) {
  try {
    return new vm.Script(`(async () => {\n${code}\n})()`, {
      filename: `${name}.js`,
      lineOffset: -1,
      ...(importModuleDynamically && { importModuleDynamically }),
    })
  } catch (error) {
    throw new Error(`The workflow script has a syntax error: ${error.message}`)
  }
}

// Index of the first character after leading white space and comments.
function skip(source, index) {
  while (index < source.length) {
    if (/\s/.test(source[index])) index++
    else if (source.startsWith("//", index)) index = lineEnd(source, index)
    else if (source.startsWith("/*", index)) index = blockEnd(source, index)
    else break
  }

  return index
}

const lineEnd = (source, index) => {
  const end = source.indexOf("\n", index)

  return end === -1 ? source.length : end + 1
}

const blockEnd = (source, index) => {
  const end = source.indexOf("*/", index + 2)

  if (end === -1) throw new Error("The workflow script has a comment that does not end.")

  return end + 2
}

// Index of the `}` that closes the object literal that opens at `open`.
function literalEnd(source, open) {
  let depth = 0
  let index = open

  while (index < source.length) {
    const char = source[index]

    if (char === '"' || char === "'") index = stringEnd(source, index, char)
    else if (char === "`") {
      const end = stringEnd(source, index, "`")

      if (source.slice(index, end).includes("${"))
        throw new Error("The `meta` object must be a pure literal: no template interpolation.")
      index = end
    } else if (source.startsWith("//", index)) index = lineEnd(source, index)
    else if (source.startsWith("/*", index)) index = blockEnd(source, index)
    else {
      if (char === "{" || char === "[") depth++
      if (char === "}" || char === "]") depth--
      if (depth === 0) return index
      index++
    }
  }

  throw new Error("The `meta` object does not close.")
}

function stringEnd(source, index, quote) {
  for (let at = index + 1; at < source.length; at++) {
    if (source[at] === "\\") at++
    else if (source[at] === quote) return at + 1
    else if (quote !== "`" && source[at] === "\n") break
  }

  throw new Error("The `meta` object has a string that does not end.")
}

// Evaluates the literal after a check that it holds only keys, values, and punctuation: no variable, call, operator, or
// spread can reach the evaluation.
function evaluate(literal) {
  const impure = "The `meta` object must be a pure literal: no variables, function calls, or spreads."

  if (!pure(literal)) throw new Error(impure)

  let value

  try {
    value = vm.runInNewContext(`(${literal})`, Object.create(null), {
      timeout: 100,
      contextCodeGeneration: { strings: false, wasm: false },
      microtaskMode: "afterEvaluate",
    })
  } catch {
    throw new Error(impure)
  }

  if (!plain(value)) throw new Error("The `meta` object must hold only strings, numbers, booleans, arrays, and objects.")

  const { name, description, phases, whenToUse } = value

  if (typeof name !== "string" || !name.trim()) throw new Error("`meta.name` must be a non-empty string.")
  if (typeof description !== "string" || !description.trim())
    throw new Error("`meta.description` must be a non-empty string.")
  if (whenToUse !== undefined && typeof whenToUse !== "string") throw new Error("`meta.whenToUse` must be a string.")
  if (phases !== undefined && (!Array.isArray(phases) || phases.some((phase) => typeof phase?.title !== "string")))
    throw new Error("`meta.phases` must be a list of `{ title, detail? }` objects.")

  return {
    name: name.trim(),
    description: description.trim(),
    ...(whenToUse && { whenToUse }),
    phases: (phases ?? []).map((phase) => ({
      title: phase.title,
      ...(typeof phase.detail === "string" && { detail: phase.detail }),
      ...(typeof phase.model === "string" && { model: phase.model }),
    })),
  }
}

// Whether `literal` has only strings, numbers, true, false, null, keys, and the punctuation of objects and arrays. A
// value can be followed only by `,` `:` `]` or `}`: a `[` or a backtick after a value reads a property or calls a tag.
function pure(literal) {
  let index = 0
  let value = false

  while (index < literal.length) {
    const rest = literal.slice(index)
    const char = literal[index]

    if (/\s/.test(char)) index++
    else if (rest.startsWith("//")) index = lineEnd(literal, index)
    else if (rest.startsWith("/*")) index = blockEnd(literal, index)
    else if (value && !",:]}".includes(char)) return false
    else if ("{}[],:".includes(char)) {
      value = char === "]" || char === "}"
      index++
    } else if (char === '"' || char === "'" || char === "`") {
      index = stringEnd(literal, index, char)
      value = true
    } else {
      const number = /^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(rest)
      const word = /^[A-Za-z_$][\w$]*/.exec(rest)

      if (number) index += number[0].length
      else if (word && (["true", "false", "null"].includes(word[0]) || /^\s*:/.test(rest.slice(word[0].length))))
        index += word[0].length
      else return false
      value = true
    }
  }

  return true
}

function plain(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return true
  if (Array.isArray(value)) return value.every(plain)
  if (typeof value !== "object") return false

  return Object.values(value).every(plain)
}
