const MINUTE = 60 * 1000

// Runs `command` with the user's shell in `directory`, on the server of `client`. Returns whether it exited with 0, and
// all of its output.
export async function run(client, directory, command) {
  const location = { directory }
  let { data: shell } = await client.shell.create({ location, command, timeout: MINUTE })

  try {
    while (shell.status === "running") {
      await new Promise((resolve) => setTimeout(resolve, 100))
      shell = (await client.shell.get({ id: shell.id, location })).data
    }

    let { data } = await client.shell.output({ id: shell.id, location })

    // The first page holds only the start of a long output, such as an image. One read of the rest could cut a
    // character in two, so the second read takes the output from its start.
    if (data.cursor < data.size)
      ({ data } = await client.shell.output({ id: shell.id, location, cursor: 0, limit: data.size }))

    return { ok: shell.exit === 0, output: data.output }
  } finally {
    void client.shell.remove({ id: shell.id, location }).catch(() => undefined)
  }
}
