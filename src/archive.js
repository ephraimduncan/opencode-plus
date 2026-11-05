// Archives sessions that sat finished and untouched, or whose pull request merged, like T3 Code's auto-settle, and
// brings an archived session back when it gets a new message or run.
//
// This runs in the desktop app's main process rather than in a server part, because the server plugin API's
// `session.update` ignores `archived` (OpenCode 2.2.5). The HTTP client here sends it.

import * as pr from "./pr.js"
import * as shell from "./shell.js"

const SECOND = 1000
const MINUTE = 60 * SECOND
const PAGE = 200
const EVENTS = ["session.inbox.enqueued", "session.execution.started", "session.unarchived"]

// The app can leave an earlier main process instance running after a reload (OpenCode Desktop 2.2.5), so the newest one
// stops it.
const INSTANCE = Symbol.for("opencode-plus.archive")

// Whether `session` is due for archive at `now`: its last run ended `after` ms ago with nothing new since, or the pull
// request of its branch merged at `merged` after its last run started. A run that waits for a permission or a question
// still runs: its start is newer than its end. `key` names the session metadata that holds when the session was last
// unarchived by hand.
export function due(session, now, after, key, merged) {
  const { created, updated, busy, idle, archived } = session.time

  if (archived !== undefined || session.parentID) return false

  if (busy !== undefined && (idle === undefined || busy > idle)) return false

  // Changed a moment ago, such as unarchived before its keep mark was written. Short, as the end of a run that merged
  // the pull request also changes the session.
  if (now - updated < 30 * SECOND) return false

  const start = busy ?? created
  const last = Math.max(created, busy ?? 0, idle ?? 0)
  const kept = Number(session.metadata?.[key]) || 0

  // Its pull request merged, so its work is done, like a T3 Code thread. A run that starts after the merge, such as a
  // follow-up, or an unarchive by hand after the merge keeps it.
  if (merged > Math.max(start, kept)) return true

  // Unarchived by hand since its last run: stays until new activity, like un-settle in T3 Code.
  if (kept >= last) return false

  return now - last >= after
}

// Archives due sessions every 10 seconds, and follows the server's events to bring sessions back. Returns the stop.
export function archive(ctx, after) {
  const key = `${ctx.id}.keptAt`
  const started = Date.now()
  const controller = new AbortController()
  const signal = controller.signal
  const report = (error) => ctx.log.write("error", `${ctx.id}: ${error?.stack ?? error}`)

  const roots = async () => {
    const list = []
    let page = await ctx.client.session.list({ parentID: null, archived: false, limit: PAGE })

    while (true) {
      list.push(...page.data)

      if (page.data.length < PAGE || !page.cursor.next) return list
      page = await ctx.client.session.list({ cursor: page.cursor.next, limit: PAGE })
    }
  }

  // Each folder's owner of `origin`, and GitHub's last answer about the pull request of the folder's branch.
  const folders = new Map()

  // When the pull request of the branch of `directory` merged, or undefined. The pull request is the one that the
  // badge in the sidebar shows. A folder on its default branch has no lookup.
  const merged = async (directory) => {
    const { current, default: base } = (await ctx.client.vcs.get({ location: { directory } })).data.branch

    if (!current || current === base) return
    let folder = folders.get(directory)

    if (!folder) {
      const remote = await shell.run(ctx.client, directory, "git remote get-url origin")

      folder = { owner: remote.ok ? pr.owner(remote.output) : undefined }
      folders.set(directory, folder)
    }

    if (!folder.owner) return

    // The ETag can be from an earlier branch of the folder. A 304 then means that the two branches have the same
    // answer, so the pull request that the folder keeps is still correct.
    const asked = await shell.run(ctx.client, directory, pr.ask(folder.owner, current, folder.etag))
    Object.assign(folder, pr.answer(asked.output))

    return folder.pull?.state === "merged" ? Date.parse(folder.pull.mergedAt) : undefined
  }

  let sweeping = false
  const sweep = async () => {
    if (sweeping) return
    sweeping = true

    try {
      const now = Date.now()
      // Only a session that a merge at this moment would archive needs a lookup.
      const list = (await roots()).filter((session) => due(session, now, after, key, now))
      // The sessions of a folder share its branch, so they share one lookup. A folder that is gone, such as a removed
      // worktree, has no pull request.
      const directories = new Set(list.map((session) => session.location.directory))
      const lookups = new Map(
        Array.from(directories, (directory) => [directory, merged(directory).catch(() => undefined)]),
      )

      for (const session of list) {
        if (!due(session, now, after, key, await lookups.get(session.location.directory))) continue
        await ctx.client.session.update({ sessionID: session.id, archived: true })
        ctx.log.write("info", `${ctx.id}: archived ${session.id} "${session.title ?? ""}"`)
      }
    } finally {
      sweeping = false
    }
  }

  const handle = async (event) => {
    // The stream also opens with `server.connected`.
    if (!EVENTS.includes(event.type)) return

    // A new subscription can replay older events; only react to what happened while the plugin runs.
    if (event.created < started - MINUTE) return

    if (event.type === "session.inbox.enqueued" && event.data.item.type !== "user") return

    const session = await ctx.client.session.get({ sessionID: event.data.sessionID })
    const archived = session.time.archived

    // A message or a new run in an archived session brings it back, like new activity un-settles a T3 Code thread.
    if (event.type !== "session.unarchived") {
      if (archived === undefined || event.created <= archived) return
      await ctx.client.session.update({ sessionID: session.id, archived: false })
      ctx.log.write("info", `${ctx.id}: unarchived ${session.id} on ${event.type}`)

      return
    }

    // Unarchived by hand: remember when, so the sweep leaves it alone until it has new activity.
    if (archived !== undefined || (Number(session.metadata?.[key]) || 0) >= event.created) return
    await ctx.client.session.update({ sessionID: session.id, metadata: { ...session.metadata, [key]: event.created } })
  }

  // Follows the server's events, and connects again after the server restarts.
  const watch = async () => {
    while (!signal.aborted) {
      try {
        const events = ctx.client.event.subscribe({ types: EVENTS }, { signal })

        for await (const event of events) void handle(event).catch(report)
      } catch (error) {
        if (!signal.aborted) report(error)
      }

      if (!signal.aborted) await new Promise((resolve) => setTimeout(resolve, 5_000))
    }
  }

  const run = () => void sweep().catch(report)
  let timer
  const first = setTimeout(() => {
    run()
    timer = setInterval(run, 10 * SECOND)
  }, MINUTE)

  const stop = () => {
    if (signal.aborted) return
    clearTimeout(first)
    clearInterval(timer)
    controller.abort()
  }

  globalThis[INSTANCE]?.()
  globalThis[INSTANCE] = stop
  ctx.signal.addEventListener("abort", stop, { once: true })

  void watch()

  return stop
}
