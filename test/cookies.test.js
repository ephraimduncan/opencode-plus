import { EventEmitter } from "node:events"
import { afterEach, expect, test, vi } from "vitest"
import { keep } from "../src/cookies.js"

const MINUTE = 60
const DAY = 24 * 60 * MINUTE
const GITHUB = "https://github.com/"

// An Electron session in memory. Its cookie store sends events as Electron 44 does: after the change, and for an insert
// that replaces a cookie, the removal of the old cookie first.
const session = ({ persistent = false } = {}) => {
  const store = new Map()
  const cookies = new EventEmitter()
  const emit = (cookie, cause, removed) => setTimeout(() => cookies.emit("changed", {}, cookie, cause, removed))
  const remove = (key, cause) => {
    emit(store.get(key), cause, true)
    store.delete(key)
  }

  cookies.get = async () => [...store.values()]
  cookies.set = async ({ url, name = "", value = "", domain, path = "/", secure, httpOnly, expirationDate, sameSite }) => {
    const cookie = {
      name,
      value,
      domain: domain ?? new URL(url).hostname,
      hostOnly: !domain,
      path,
      secure: !!secure,
      httpOnly: !!httpOnly,
      session: expirationDate === undefined,
      ...(expirationDate !== undefined && { expirationDate }),
      sameSite: sameSite ?? "lax",
    }
    const key = [cookie.domain, path, name].join("\t")

    if (expirationDate <= Date.now() / 1000) {
      if (store.has(key)) remove(key, "expired-overwrite")
      return
    }
    if (store.has(key)) remove(key, "overwrite")
    store.set(key, cookie)
    emit(cookie, "inserted", false)
  }
  // Removes each cookie of the name that the address gets, as Chromium does.
  cookies.remove = async (url, name) => {
    const { hostname, pathname } = new URL(url)

    for (const [key, cookie] of store) {
      const host = cookie.hostOnly ? cookie.domain === hostname : `.${hostname}`.endsWith(cookie.domain)

      if (cookie.name === name && host && pathname.startsWith(cookie.path)) remove(key, "explicit")
    }
  }

  return { cookies, isPersistent: () => persistent }
}

const app = new EventEmitter()
let open = []
const stops = []

afterEach(() => {
  stops.splice(0).forEach((stop) => stop())
  open = []
  vi.useRealTimers()
})

const storage = () => ({
  value: "",
  set(value) {
    this.value = value
  },
})

// Encrypts by reversing the text, so the stored jar shows if it skips encryption.
const safeStorage = (available) => ({
  isEncryptionAvailable: () => available,
  encryptString: (text) => Buffer.from([...text].reverse().join("")),
  decryptString: (buffer) => [...buffer.toString()].reverse().join(""),
})

const start = (stored = storage(), { encryption = true } = {}) => {
  const ctx = { id: "opencode-plus", log: { write: () => undefined }, storage: { store: () => stored } }
  const stop = keep(ctx, { app, safeStorage: safeStorage(encryption), webContents: { getAllWebContents: () => open } })

  stops.push(stop)
  return stop
}

// The partition of a new browser pane.
const pane = () => {
  const value = session()

  app.emit("session-created", value)
  return value
}

const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve))
}

const values = async (target) =>
  Object.fromEntries((await target.cookies.get()).map((cookie) => [`${cookie.path} ${cookie.name}`, cookie.value]))

const login = (target, value = "abc") =>
  target.cookies.set({
    url: GITHUB,
    name: "user_session",
    value,
    secure: true,
    httpOnly: true,
    expirationDate: Date.now() / 1000 + 14 * DAY,
  })

// Catches a pane that keeps its cookies to itself: the panes of the other sessions must get a login, the open ones and
// the new ones.
test("a login in one pane reaches the open panes and the new panes", async () => {
  start()
  const a = pane()
  const b = pane()

  await login(a)
  await settle()
  const c = pane()
  await settle()

  expect(await values(b)).toEqual({ "/ user_session": "abc" })
  expect(await values(c)).toEqual({ "/ user_session": "abc" })
})

// Catches a pane that gets its own change back from another pane: a cookie that changes on each response, such as
// GitHub's `_gh_sess`, must not go back to an older value.
test("a pane that changes a cookie fast does not get an older value back", async () => {
  start()
  const a = pane()
  const b = pane()
  const seen = []

  a.cookies.on("changed", (_, cookie, cause, removed) => removed || seen.push(cookie.value))
  for (const value of ["s1", "s2", "s3"]) void a.cookies.set({ url: GITHUB, name: "_gh_sess", value })
  await settle()

  expect(seen).toEqual(["s1", "s2", "s3"])
  expect(await values(b)).toEqual({ "/ _gh_sess": "s3" })
})

// Catches a removal that also removes the cookies of the same name at other paths, as `cookies.remove` does, or a
// removal that stays in one pane.
test("a removal in one pane removes the same cookie in the other panes, and only it", async () => {
  start()
  const a = pane()
  const b = pane()

  await a.cookies.set({ url: GITHUB, name: "pref", value: "root", path: "/" })
  await a.cookies.set({ url: GITHUB, name: "pref", value: "docs", path: "/docs" })
  await settle()
  await a.cookies.set({ url: GITHUB, name: "pref", path: "/docs", expirationDate: 1 })
  await settle()

  expect(await values(b)).toEqual({ "/ pref": "root" })
})

// Catches a jar that a restart loses, that is stored in plain text, or that keeps cookies that expired for ever: no
// pane removes them, as no pane gets them.
test("a restart brings back the jar from an encrypted store, without the cookies that expired", async () => {
  vi.useFakeTimers({ toFake: ["Date"] })
  const stored = storage()
  const stop = start(stored)
  const a = pane()

  await login(a)
  await a.cookies.set({ url: GITHUB, name: "_gh_sess", value: "s0" })
  await a.cookies.set({ url: GITHUB, name: "flash", value: "saved", expirationDate: Date.now() / 1000 + MINUTE })
  await settle()
  stop()

  expect(Buffer.from(stored.value, "base64").toString()).not.toContain('"abc"')

  vi.setSystemTime(Date.now() + 2 * MINUTE * 1000)
  const again = start(stored)
  const b = pane()
  await settle()

  expect(await values(b)).toEqual({ "/ user_session": "abc", "/ _gh_sess": "s0" })

  await b.cookies.set({ url: GITHUB, name: "_gh_sess", value: "s1" })
  await settle()
  again()
  const jar = JSON.parse(safeStorage(true).decryptString(Buffer.from(stored.value, "base64")))

  expect(jar.map((cookie) => cookie.name).sort()).toEqual(["_gh_sess", "user_session"])
})

// Catches cookies stored in plain text when the system has no key to encrypt with. The panes still share them.
test("without encryption, the jar stays in memory", async () => {
  const stored = storage()
  const stop = start(stored, { encryption: false })
  const a = pane()

  await login(a)
  await settle()
  const b = pane()
  await settle()
  stop()

  expect(await values(b)).toEqual({ "/ user_session": "abc" })
  expect(stored.value).toBe("")
})

// Catches cookies of the browser pane that go to the app's own windows, which use persistent sessions.
test("leaves persistent sessions alone", async () => {
  start()
  const window = session({ persistent: true })

  app.emit("session-created", window)
  await login(pane())
  await settle()

  expect(await values(window)).toEqual({})
})

// Catches a reload that forgets the panes that are open: their partitions already exist, so no new session shows.
test("after a reload, a pane that is open still shares its changes", async () => {
  start()
  const a = pane()

  open = [{ session: a }]
  start()
  const b = pane()
  await login(a)
  await settle()

  expect(await values(b)).toEqual({ "/ user_session": "abc" })
})
