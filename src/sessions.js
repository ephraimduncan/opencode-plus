// A sidebar row shows the title of a session and the name of its project, but not its folder (OpenCode Desktop 2.2.6).
// This finds the session of a row from these two, among the root sessions of the app's own server.

// A row that names no session loads the list again, at most once in this time.
const STALE = 30 * 1000

// `load` resolves to the sessions, each as `{ title, project, location }`, and `changed` runs when a load ends. Returns
// `find(title, project)`: the location of the session that the two name. Undefined when no session fits, or when
// sessions in more than one folder fit.
export function sessions(load, changed) {
  let list = []
  let time = -Infinity
  let loading = false

  const reload = () => {
    if (loading || Date.now() - time < STALE) return
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

    return new Set(fit.map((session) => session.location.directory)).size === 1 ? fit[0].location : undefined
  }
}
