// A sidebar row shows the title of a session and the name of its project, but not its folder (OpenCode Desktop 2.2.6).
// This finds the session of a row from these two, among the root sessions of the app's own server.

// A row that names no session loads the list again, at most once in this time.
const STALE = 30 * 1000

// `load` resolves to the sessions, each as `{ id, title, project, location }`. `changed` runs when a load ends, and
// when a row that names no session can load the list again.
// Returns `find(title, project)`: the location of the session that the two name, and its id when only one session
// fits. Undefined when no session fits, or when sessions in more than one folder fit.
export function sessions(load, changed) {
  let list = []
  let time = -Infinity
  let loading = false
  let retry

  const reload = () => {
    if (loading) return
    const wait = time + STALE - Date.now()

    if (wait > 0) {
      // The page can stay as it is, as when a new session gets its title and then stops. Thus, no pass follows.
      retry ??= setTimeout(() => {
        retry = undefined
        changed()
      }, wait)

      return
    }
    loading = true
    load()
      .then((value) => (list = value), () => undefined)
      .finally(() => {
        loading = false
        time = Date.now()
        changed()
      })
  }

  return (title, project) => {
    const fit = list.filter((session) => session.title === title && session.project === project)

    if (fit.length === 0) reload()

    if (new Set(fit.map((session) => session.location.directory)).size !== 1) return

    return { location: fit[0].location, id: fit.length === 1 ? fit[0].id : undefined }
  }
}
