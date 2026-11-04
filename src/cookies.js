// The app gives the browser pane of each session its own partition, in memory (OpenCode Desktop 2.2.5). Thus a login
// stays only until the app quits, and the panes of other sessions do not see it. This keeps one jar of cookies for all
// panes: each new pane gets the jar, each change in a pane goes to the jar and to the other panes, and the jar is
// stored, encrypted, for the next start of the app.
//
// The panes cannot use one persistent partition instead: each pane sends its traffic through a proxy to the server of
// its session, and the proxy is a setting of the partition. A persistent partition would also write the cookies to
// disk unencrypted, as the app turns off Electron's cookie encryption.

import { Schema } from "effect"

const KEY = "browser.cookies"
const SECOND = 1000

// The app can leave an earlier main process instance running after a reload (OpenCode Desktop 2.2.5), so the newest one
// stops it.
const INSTANCE = Symbol.for("opencode-plus.cookies")

// Shares one jar of cookies among the browser panes, and keeps it across restarts. `electron` has the modules of the
// main process. Returns the stop.
export function keep(ctx, { app, safeStorage, webContents }) {
  globalThis[INSTANCE]?.()

  const report = (error) => ctx.log.write("warn", `${ctx.id}: ${error?.stack ?? error}`)

  // Without a key to encrypt with, such as on Linux with no keyring, the jar stays in memory.
  const stored = safeStorage.isEncryptionAvailable()
    ? ctx.storage.store(KEY, { schema: Schema.String, initial: "" })
    : undefined

  const load = () => {
    if (!stored?.value) return []

    try {
      const now = Date.now() / SECOND
      const list = JSON.parse(safeStorage.decryptString(Buffer.from(stored.value, "base64")))

      return list.filter((cookie) => cookie.expirationDate === undefined || cookie.expirationDate > now)
    } catch (error) {
      report(error)
      return []
    }
  }

  const jar = new Map(load().map((cookie) => [id(cookie), cookie]))

  let timer
  const write = () => {
    clearTimeout(timer)
    timer = undefined
    stored.set(safeStorage.encryptString(JSON.stringify([...jar.values()])).toString("base64"))
  }
  // At most one write each second: a page can change many cookies at once.
  const save = () => {
    if (stored) timer ??= setTimeout(write, SECOND)
  }

  // The session of each pane, with its listener, and the states that the jar sent to it for each cookie and that its
  // events have not shown yet. The state of a cookie is its JSON, or "" when it is removed.
  const panes = new Map()

  const send = (pane, cookie, state) => {
    const key = id(cookie)
    const sent = pane.sent.get(key) ?? []

    sent.push(state)
    pane.sent.set(key, sent)

    // A cookie that expired removes the cookie with the same domain, path, and name. `cookies.remove` also removes the
    // cookies with the same name that other domains and paths give to the address.
    const done = pane.session.cookies.set(state ? details(cookie) : { ...details(cookie), expirationDate: 1 })

    // A change that fails does not show in the pane.
    done.catch((error) => {
      const index = sent.indexOf(state)

      if (index >= 0) sent.splice(index, 1)
      report(error)
    })
  }

  const change = (pane, cookie, cause, removed) => {
    // An insert that replaces a cookie first removes the old cookie. The insert follows.
    if (removed && cause === "overwrite") return

    const key = id(cookie)
    const state = removed ? "" : JSON.stringify(cookie)
    const sent = pane.sent.get(key) ?? []
    const index = sent.indexOf(state)

    // The pane shows a change that the jar sent to it. A pane makes the changes in the sequence it gets them, so the
    // states before this one will not show.
    if (index >= 0) {
      sent.splice(0, index + 1)
      if (sent.length === 0) pane.sent.delete(key)
      return
    }

    if (state === (jar.has(key) ? JSON.stringify(jar.get(key)) : "")) return

    if (removed) jar.delete(key)
    else jar.set(key, cookie)

    for (const other of panes.values()) if (other !== pane) send(other, cookie, state)
    save()
  }

  // Starts to share the jar with `session`, if it is the in-memory session of a browser pane. The app's own windows use
  // persistent sessions.
  const watch = (session) => {
    if (session.isPersistent() || panes.has(session)) return

    const pane = {
      session,
      sent: new Map(),
      listener: (_, cookie, cause, removed) => change(pane, pick(cookie), cause, removed),
    }

    panes.set(session, pane)
    session.cookies.on("changed", pane.listener)

    for (const cookie of jar.values()) send(pane, cookie, JSON.stringify(cookie))
  }

  // A pane's partition is new when the pane opens, before the pane loads a page.
  app.on("session-created", watch)

  // The panes that opened before this instance started, such as before a reload, come here: at once if they show a
  // page, else with their first page.
  const created = (_, contents) => watch(contents.session)

  app.on("web-contents-created", created)
  for (const contents of webContents.getAllWebContents()) watch(contents.session)

  const stop = () => {
    app.off("session-created", watch)
    app.off("web-contents-created", created)
    for (const pane of panes.values()) pane.session.cookies.off("changed", pane.listener)
    panes.clear()
    if (timer) write()
  }

  globalThis[INSTANCE] = stop

  return stop
}

// The parts of an Electron cookie that `cookies.set` takes, always in this sequence, so that two copies of a cookie
// have the same JSON. A session cookie has no expiry.
function pick({ name, value, domain, path, secure, httpOnly, sameSite, expirationDate }) {
  return {
    name,
    value,
    domain,
    path,
    secure,
    httpOnly,
    sameSite,
    ...(expirationDate !== undefined && { expirationDate }),
  }
}

// One cookie replaces another with the same domain, path, and name.
function id({ domain, path, name }) {
  return [domain, path, name].join("\t")
}

// What `cookies.set` takes to make `cookie` again. The domain of a cookie that subdomains also get starts with a dot;
// without a domain, `cookies.set` makes a cookie for the host of the address only.
function details({ domain, ...cookie }) {
  const host = domain.replace(/^\./, "")

  return {
    ...cookie,
    url: `${cookie.secure ? "https" : "http"}://${host}${cookie.path}`,
    ...(domain !== host && { domain }),
  }
}
