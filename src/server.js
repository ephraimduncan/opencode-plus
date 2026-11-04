import { Plugin } from "@opencode/plugin"
import { settings } from "./settings.js"
import { workflows } from "./workflow/server.js"

// The server part: dynamic workflows. The desktop part, `src/index.js`, shows their runs in the Workflows panel.
export default Plugin.define({
  id: "opencode-plus",
  async setup(ctx) {
    const options = settings(ctx.options)

    if (options.workflows) return workflows(ctx, options)
  },
})
