import { createStore, reconcile } from "solid-js/store"
import { act, download, failure, methods, parts, patch, picture, read, settings, view } from "./format.js"

// The pull requests and issues that the panel shows, by address: the item as `gh` last read it, or why it could not,
// the diff of each file of a pull request that the panel asks for, and what each repository lets the user merge with.
// `run(directory, command)` runs a shell command in `directory` and resolves to whether it exited with 0, and its
// output. One read of each item runs at a time.
export function createItems(run) {
  const [state, setState] = createStore({ items: {}, repos: {} })
  const reads = new Map()
  const images = new Map()

  // Reads the item at `address` again, unless the last read is younger than `age` milliseconds. A new commit drops the
  // diffs that the panel read before it.
  const load = (address, directory, age = 0) => {
    const entry = state.items[address]

    if (reads.has(address) || Date.now() - (entry?.time ?? -Infinity) < age) return reads.get(address)
    setState("items", address, { busy: true })
    const task = attempt(directory, view(address), (output) => ({
      item: read(address, JSON.parse(output.slice(output.indexOf("{")))),
    }))
      .then(({ item, error }) => {
        if (item && item.sha !== state.items[address].item?.sha) setState("items", address, "patches", undefined)
        if (item) setState("items", address, "item", reconcile(item))
        setState("items", address, { error, busy: false, time: Date.now() })
      })
      .finally(() => reads.delete(address))

    reads.set(address, task)

    return task
  }

  // Reads the diff of the file at `path` in the pull request at `address`, unless the panel has it.
  const loadPatch = (address, directory, path) => {
    const current = state.items[address]?.patches?.[path]
    const put = (value) => setState("items", address, "patches", (patches) => ({ ...patches, [path]: value }))

    if (current && !current.error) return
    put({ busy: true })
    void attempt(directory, patch(address, path), (output) => ({ text: output.trimEnd() })).then((result) =>
      put({ busy: false, ...result }),
    )
  }

  // Reads the merge methods of the repository of `address`, unless the panel has them or reads them now.
  const loadRepo = (address, directory) => {
    const key = repo(address)

    if (state.repos[key] && !state.repos[key].error) return
    setState("repos", key, { busy: true, error: undefined })
    void attempt(directory, settings(address), (output) => methods(JSON.parse(output.slice(output.indexOf("{"))))).then(
      (result) => setState("repos", key, { busy: false, ...result }),
    )
  }

  // Resolves to the address of a copy of the image at `url` that `gh` downloads with the user's login, for an image that
  // the panel cannot load itself, such as an attachment of a private repository. Each image downloads once. Resolves to
  // undefined when `gh` cannot download it, and a later call tries again.
  const loadImage = (url, directory) => {
    if (!images.has(url)) {
      const task = attempt(directory, download(url), (output) => ({ picture: picture(output) })).then((result) => {
        if (result.picture) return URL.createObjectURL(new Blob([result.picture.bytes], { type: result.picture.type }))
        images.delete(url)
      })

      images.set(url, task)
    }

    return images.get(url)
  }

  // Makes the change `action` to the item at `address`, then reads it again. Resolves to the error, if any.
  const change = async (address, directory, action, method) => {
    const { error } = await attempt(directory, act(address, action, method), () => ({}))

    await reads.get(address)
    await load(address, directory)

    return error
  }

  // Runs `command`, and resolves to what `parse` makes of its output, or to `{ error }` when it fails.
  const attempt = (directory, command, parse) =>
    run(directory, command)
      .then(({ ok, output }) => (ok ? parse(output) : { error: failure(output) }))
      .catch((error) => ({ error: { reason: "other", detail: String(error?.message ?? error) } }))

  return { state, load, loadPatch, loadRepo, loadImage, change, repo }
}

const repo = (address) => {
  const { origin, owner, repo } = parts(address)

  return `${origin}/${owner}/${repo}`
}
