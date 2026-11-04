import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { parse } from "./script.js"
import deepResearch from "./builtin/deep-research.js"

// Files of the workflows: one directory for each run, under its session, and the saved workflows that run as commands.
//
// A run directory holds `script.js` (the model can edit it and run it again), `journal.jsonl` (the result of each
// finished agent, for resume), and `run.json` (the last state of the run, for the panel after a restart).

const BUILTIN = [deepResearch]

function root() {
  return join(process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"), "opencode-plus", "workflows")
}

export function runDirectory(sessionID, runID) {
  return join(root(), sessionID, runID)
}

export function writeScript(directory, source) {
  mkdirSync(directory, { recursive: true })
  const path = join(directory, "script.js")

  writeFileSync(path, source)

  return path
}

export function appendJournal(directory, entry) {
  appendFileSync(join(directory, "journal.jsonl"), `${JSON.stringify(entry)}\n`)
}

// The journal entries of a run, without lines that a crash cut short.
export function readJournal(directory) {
  const path = join(directory, "journal.jsonl")

  if (!existsSync(path)) return []

  return readFileSync(path, "utf8")
    .split("\n")
    .flatMap((line) => {
      try {
        const entry = JSON.parse(line)

        return typeof entry?.key === "string" && typeof entry.result === "string" ? [entry] : []
      } catch {
        return []
      }
    })
}

// Writes through a temporary file, so that a crash during the write cannot leave a broken record.
export function writeRecord(directory, record) {
  const path = join(directory, "run.json")

  mkdirSync(directory, { recursive: true })
  writeFileSync(`${path}.tmp`, JSON.stringify(record))
  renameSync(`${path}.tmp`, path)
}

export function readRecord(directory) {
  try {
    return JSON.parse(readFileSync(join(directory, "run.json"), "utf8"))
  } catch {
    return undefined
  }
}

// The stored runs of a session.
export function sessionRecords(sessionID) {
  const directory = join(root(), sessionID)

  if (!existsSync(directory)) return []

  return readdirSync(directory).flatMap((runID) => {
    const record = readRecord(join(directory, runID))

    return record ? [record] : []
  })
}

// The directories that hold saved workflows, nearest first: each `.opencode/workflows` from `directory` up to the root
// of its repository, then the personal directory.
function savedDirectories(directory) {
  return [...projectDirectories(directory).map((path) => ({ path, scope: "project" })), { path: personal(), scope: "personal" }]
}

function projectDirectories(directory) {
  const found = []
  let current = resolve(directory)

  while (true) {
    found.push(join(current, ".opencode", "workflows"))
    if (existsSync(join(current, ".git")) || dirname(current) === current) return found
    current = dirname(current)
  }
}

function personal() {
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "opencode", "workflows")
}

// The saved workflows for `directory` by name. A nearer project workflow wins over a farther one, a project workflow
// over a personal one, and both over a bundled one. A file that does not parse is left out.
export function savedWorkflows(directory) {
  const found = new Map()

  for (const { path, scope } of savedDirectories(directory)) {
    if (!existsSync(path)) continue
    for (const file of readdirSync(path).filter((name) => name.endsWith(".js")).sort()) {
      try {
        const source = readFileSync(join(path, file), "utf8")
        const { meta } = parse(source)

        if (!found.has(meta.name)) found.set(meta.name, { ...meta, scope, path: join(path, file), source })
      } catch {
        // A broken file must not hide the others.
      }
    }
  }

  for (const source of BUILTIN) {
    const { meta } = parse(source)

    if (!found.has(meta.name)) found.set(meta.name, { ...meta, scope: "bundled", source })
  }

  return found
}

// Saves `source` as a workflow named `name`, and returns its path. The project location is the nearest existing
// `.opencode/workflows` up to the repository root, else the one at the repository root. Refuses to write through a
// symlink, and to replace a different workflow whose name gives the same file name.
export function saveWorkflow({ source, name, scope, directory }) {
  const project = scope === "personal" ? [] : projectDirectories(directory)
  const target = scope === "personal" ? personal() : (project.find(existsSync) ?? project.at(-1))
  const file = join(target, `${slug(name)}.js`)

  for (const path of scope === "personal" ? [file] : [dirname(target), target, file])
    if (existsSync(path) && lstatSync(path).isSymbolicLink())
      throw new Error(`${path} is a symlink, so the workflow was not saved.`)

  if (existsSync(file) && savedName(file) !== name)
    throw new Error(`${file} holds a different workflow, so the workflow was not saved.`)

  mkdirSync(target, { recursive: true })
  writeFileSync(file, source)

  return file
}

// The name in the meta of a saved workflow file, or undefined when the file does not parse.
function savedName(file) {
  try {
    return parse(readFileSync(file, "utf8")).meta.name
  } catch {
    return undefined
  }
}

export const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "workflow"
