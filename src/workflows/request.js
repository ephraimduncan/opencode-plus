import { Workflows } from "../rpc.js"

// The server starts its plugins in a folder after the first request there. Until the server part runs, a call fails
// with this error (OpenCode 2.2.7).
const UNAVAILABLE = "rpc.unavailable"

// A call that came too early runs again after this time, this many times at most.
const WAIT = 300
const TRIES = 10

// Calls `method` of the server part with `input`, in the folder of `session`.
export async function request(session, method, input) {
  const options = { location: { directory: session.directory } }

  for (let tries = 1; ; tries++) {
    try {
      return await session.server.client.rpc(Workflows)[method](input, options)
    } catch (error) {
      if (error?.type !== UNAVAILABLE || tries === TRIES) throw error
      await new Promise((resolve) => setTimeout(resolve, WAIT))
    }
  }
}
