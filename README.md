# opencode-plus

opencode-plus is a plugin for the OpenCode Desktop app. It puts the sessions in the sidebar into groups by project, archives finished sessions, and makes the conversation easier to read.

The plugin works with OpenCode Desktop 2.2.5.

## What the plugin does

### Sidebar

- The sessions of each project show together. A project with two or more sessions gets a heading with the project badge and a `+` button.
- The `+` button starts a new session in that project.
- Working sessions show at the top of their project, with a blue "Working" status.
- After you open a finished session, the sidebar shows it dim. A finished session that you did not open stays bright.
- The "Archived" section stays closed, at the bottom of the list. Click its heading to open it.

### Automatic archive

- The plugin archives a session 12 hours after its last run stops, if no new activity occurs.
- If an archived session gets a new message or a new run, the plugin unarchives it.
- If you unarchive a session yourself, the plugin keeps the session until it has new activity.

### Conversation and chat input

- A "Response" divider shows above the last text of each answer from the agent, after its tool calls.
- The agent dropdown does not show while the agent is `build`. If you select a different agent, the dropdown shows again.
- Reasoning levels show in lowercase, for example `high` and `xhigh`.
- The project menu above the conversation has a "New session" item.
- If you hold the pointer on the context ring above the conversation, a card shows below the ring. The card also shows when the ring has the keyboard focus.
- The card shows the number of tokens in the context window and the context limit of the model. It also shows the part of the limit that the session uses, in percent.
- A bar shows the part of the context window that the session uses. Each color in the bar shows one type of token, for example "Cache read", "Input", or "Output".
- Below the bar, the card shows the number of tokens of each type and the cost.
- A click on the ring opens the "Context" panel of the app. Then the card stays closed until the pointer moves off the ring.

### Branch on the new session page

- The branch name under the chat input is a button. A click on it opens a list of the branches of the folder.
- The plugin runs `git switch` with the branch that you select.
- The list also shows remote branches that have no local branch. For such a branch, `git switch` makes a local branch from the remote branch.
- A branch that a different worktree uses does not show, because git does not let two worktrees use one branch.
- If `git switch` is not successful, for example because of changes to your files, the plugin shows the error from git.

## Install

The `opencode` command must be version 2.2.5 or later. Earlier versions do not install a plugin that has only a desktop part. To see your version, run `opencode --version`.

If your `opencode` command is older than the desktop app, use the command that the app contains. On macOS, it is `/Applications/OpenCode.app/Contents/Resources/opencode-cli`.

1. Run this command:

   ```sh
   opencode plugin add github:ephraimduncan/opencode-plus
   ```

2. Open OpenCode Desktop. If the app is open, wait a few seconds.
3. Open **Settings > Extensions > Plugins** and make sure that `opencode-plus` is in the list.

## Options

To change the behavior of the plugin, use the `options` object of the plugin entry. The entry is in your global `opencode.json` or `opencode.jsonc`, in the `plugins` list. This example shows each option with its default value:

```jsonc
{
  "plugins": [
    {
      "package": "github:ephraimduncan/opencode-plus",
      "options": {
        "archiveAfterHours": 12,
        "hideAgent": "build",
        "responseLabel": "Response",
        "lowercaseVariants": true
      }
    }
  ]
}
```

| Option | Default | Result |
| --- | --- | --- |
| `archiveAfterHours` | `12` | The number of hours after the last run stops before the plugin archives a session. `0` stops automatic archive and unarchive. |
| `hideAgent` | `"build"` | The agent for which the agent dropdown does not show. `false` always shows the dropdown. |
| `responseLabel` | `"Response"` | The text on the divider above the last text of an answer. `""` shows the divider with no text. |
| `lowercaseVariants` | `true` | Shows reasoning levels in lowercase. `false` keeps the capital first letter that the app shows. |

When you save a change to the options, OpenCode loads the plugin again with the new values.

## Commands

Open the command palette and type the name of a command:

| Command | Result |
| --- | --- |
| "Show archived sessions" | Opens the "Archived" section. When the section is open, the command is "Hide archived sessions". |
| "Stop grouping sessions by project" | Shows one list with no project groups. The command then changes to "Group sessions by project". |
| "Show working sessions in their own section" | Moves working sessions back to the "Working" section of the app. |

## Limits

- The GUI plugin API of OpenCode is experimental. A new release of OpenCode can change it.
- The sidebar, the chat input, the conversation, and the context ring have no plugin API. Thus, the plugin changes the markup of the app.
- If a new release of OpenCode changes this markup, some changes of the plugin can stop. The rest of OpenCode continues to operate.
- The branch button operates only with folders on the computer that runs OpenCode Desktop.
- Automatic archive operates only while OpenCode Desktop is open. When you open the app again, the plugin archives the due sessions in approximately one minute.

## Remove

Run this command:

```sh
opencode plugin remove github:ephraimduncan/opencode-plus
```

## Development

1. Install the packages with `bun install`.
2. Build the plugin with `bun run bundle`. The build writes `dist/gui-experimental.cjs`.
3. Do the tests with `bun run test`.

The build script has the name `bundle`, not `build`. For a GitHub install, npm prepares a package that has a `build` script, and OpenCode cannot do this preparation.

To use your local copy in OpenCode Desktop, remove the GitHub install first. Then put a link to your copy in the global plugins folder:

```sh
ln -s "$PWD" ~/.config/opencode/plugins/opencode-plus
```

OpenCode loads the plugin again after each build. To build after each change, run `bunx vite build --watch`.

The GitHub install uses the built file. Thus, commit `dist/gui-experimental.cjs` with each change to `src`.

## License

[MIT](LICENSE)
