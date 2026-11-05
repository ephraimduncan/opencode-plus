# opencode-plus

opencode-plus is a plugin for the OpenCode Desktop app. It puts the sessions in the sidebar into groups by project, archives finished sessions, runs dynamic workflows, shows GitHub pull requests and issues at the side of the conversation, and makes the conversation easier to read.

The plugin works with OpenCode Desktop 2.2.5.

## What the plugin does

### Sidebar

- The sessions of each project show together. A project with two or more sessions gets a heading with the project badge and a `+` button.
- The `+` button starts a new session in that project.
- Working sessions show at the top of their project, with a blue "Working" status.
- After you open a finished session, the sidebar shows it dim. A finished session that you did not open stays bright.
- The "Archived" section stays closed, at the bottom of the list. Click its heading to open it.

### Pull request badge

- If the branch of a session has a pull request on GitHub, the sidebar shows a badge after the branch name, like T3 Code. The badge shows the number of the pull request, for example `#12`.
- The color and the icon of the badge show the state of the pull request: open, draft, merged, or closed.
- If a branch has more than one pull request, the badge shows the open pull request. If no pull request is open, the badge shows the pull request with the most recent change.
- A click on the badge opens the pull request in the GitHub panel. If you hold the pointer on the badge, the title of the pull request shows.
- The plugin finds the pull requests with the `gh` command. The plugin does a check of each branch again after two minutes, and when a session on the branch stops its run.

### GitHub panel

- A click on a link to a GitHub pull request or issue opens the GitHub panel at the side of the conversation, in a tab for that pull request or issue. Links to a page of a pull request, for example its files or a comment, also open the panel.
- The header of the panel shows the title, the state, the author, the base and head branches, and the size of the change. A button in the header copies the `gh pr checkout` command.
- The "Summary" tab starts with a status card. The status card tells you if the pull request can merge. If it cannot merge, the card tells you why: for example merge conflicts, failed checks, or a review that requests changes.
- Under the status card, rows show the reviewers, the assignees, the labels, the branch, and the milestone. A ring around the picture of a reviewer shows the verdict of that reviewer. The "Branch" row tells you if the branch is up to date with the base branch, behind it, or in conflict with it.
- Then the "Summary" tab shows the full description, the checks, and the comments and reviews. The failed checks and the running checks show first.
- The "Timeline" tab shows each event on a vertical line: the start of the pull request, the commits, the comments and reviews as cards, and the merge. A button changes the order from "Oldest first" to "Newest first".
- The "Files" tab shows the changed files and the number of commits. A click on a file shows its diff, with line numbers and the syntax colors of the app's theme. "Expand all" opens all the files. If the pull request changes more than six files, you can filter the files by name.
- If you can write to the repository, the card has a merge button for the merge method that you use on GitHub. The other permitted methods are in the menu next to the button. The plugin asks before it merges.
- When the checks run or a review is necessary, "Merge when ready" turns on auto-merge. When the branch is out of date, "Update branch" adds the latest commits of the base branch to it.
- While the checks run, the "Merge now" menu next to "Merge when ready" merges the pull request before the checks complete. If a rule of the repository makes the checks necessary, only an admin gets the menu. The admin merge ignores the rules of the repository.
- When the pull request has merge conflicts, failed checks, or a review that requests changes, the card has a button for the agent. For example, "Resolve conflicts" attaches the pull request to the prompt and writes an instruction in an empty prompt. You can change the instruction before you send it.
- A failed check has a "Fix" button, and a review that requests changes has an "Address" button. These buttons attach the pull request to the prompt with an instruction for that check or that review.
- The card of an open issue has "Fix with the agent". It attaches the issue and its description to the prompt in the same way.
- The `⋯` menu of the panel copies the link, the branch name, or the checkout command. It also marks a pull request ready for review or converts it to a draft, and closes or reopens a pull request or issue.
- "Add to the prompt" in the `⋯` menu attaches the pull request or issue to the prompt, with no instruction.
- The panel reads an open pull request or issue again each minute while it shows.
- The plugin reads and changes pull requests and issues with the `gh` command, in the folder of the session.

### Automatic archive

- The plugin archives a session 12 hours after its last run stops, if no new activity occurs.
- If an archived session gets a new message or a new run, the plugin unarchives it.
- If you unarchive a session yourself, the plugin keeps the session until it has new activity.

### Conversation and chat input

- A "Response" divider shows above the last text of each answer from the agent, after its tool calls.
- Each message that you send has a Copy button before its `⋯` menu. The button is the same as the Copy button below each answer from the agent.
- The agent dropdown does not show while the agent is `build`. If you select a different agent, the dropdown shows again.
- Reasoning levels show in lowercase, for example `high` and `xhigh`.
- The project menu above the conversation has a "New session" item.
- If you hold the pointer on the context ring above the conversation, a card shows below the ring. The card also shows when the ring has the keyboard focus.
- The card shows the number of tokens in the context window and the context limit of the model. It also shows the part of the limit that the session uses, in percent.
- A bar shows the part of the context window that the session uses. Each color in the bar shows one type of token, for example "Cache read", "Input", or "Output".
- Below the bar, the card shows the number of tokens of each type and the cost.
- A click on the ring opens the "Context" panel of the app. Then the card stays closed until the pointer moves off the ring.

### Branch on the new session page

- A click on the branch name under the chat input opens a dropdown, like the dropdown of the reasoning level. The dropdown shows the branches of the folder, with a check on the current branch.
- The branch name shows the current branch of the folder where the new session runs. The path of this folder shows after the branch name.
- If you open the page with ⌘T from a session in a worktree, the app can show the branch of the worktree near "Local". But with "Local", the new session runs in the project folder. Thus, the plugin shows the branch of the project folder.
- The plugin runs `git switch` with the branch that you select.
- The first item, "New branch…", asks for a name. The plugin then runs `git switch -c` with the name. The new branch starts from the current branch and keeps your changes. Spaces in the name become hyphens.
- A long branch name ends in "…". If you hold the pointer on it, the full name shows.
- Under "Remote", the dropdown shows the remote branches that have no local branch. For such a branch, `git switch` makes a local branch from the remote branch.
- A branch that a different worktree uses does not show, because git does not let two worktrees use one branch.
- If `git switch` is not successful, for example because of changes to your files, the plugin shows the error from git.

### Links

- A click on a web link opens the page in a new tab of the browser pane, at the side of the conversation. A link to a GitHub pull request or issue opens the GitHub panel.
- If you hold ⌘ (Ctrl on Windows and Linux) when you click a link, the page opens in the browser of your computer.
- Links in a dialog of the app, for example in Settings, open in the browser of your computer.
- If the app cannot show the browser pane, for example because the window is not sufficiently wide, the page opens in the browser of your computer.

### Browser logins

- The browser pane keeps your logins. If you log in to a site, for example GitHub, you stay logged in after you close and open the app again.
- The panes of all sessions and projects use one set of cookies. Thus, a login in one pane also shows in the other panes.
- If you log out of a site, or clear "Cookies and site data" for the site, the plugin removes the cookies of the site from all panes.
- The plugin keeps the cookies encrypted with a key from the keychain of your system. If the system has no keychain, for example Linux with no keyring, the panes share the cookies only until the app closes.

**Warning:** Log in only to sites that the agent can use. The agent controls the same browser pane, and it can do actions on these sites as you.

### Workflows

A workflow is a JavaScript script that the agent writes. The script starts many subagents and collects their results. The workflows operate like the dynamic workflows of Claude Code, with `agent()`, `parallel()`, `pipeline()`, `phase()`, and `log()`.

- The agent starts a workflow only when you ask for one. You can put the word `ultracode` in a prompt, or ask in your own words, for example "use a workflow".
- The `/ultracode` command turns on ultracode for the session. Then the agent uses a workflow for each task that is not a short answer or a small edit. `/ultracode off` turns it off.
- Each agent of a workflow is a subagent session of OpenCode, with the `general` agent type. The agents obey your permission rules.
- A workflow runs in the background. When the workflow completes, the agent gets the result and continues its answer.
- A workflow can start many agents. Thus, it can use many more tokens than a usual answer.
- The "Workflows" panel at the side of the conversation shows the workflows of the session. A new workflow opens the panel. The new tab of the side panel and the "Show workflows" command also open it.
- A click on a workflow shows its phases and its agents. Each agent shows its last tool call, its number of tokens, and its time.
- A click on an agent shows its prompt, its tool calls and its text as they occur, and its result.
- The panel has buttons to pause, resume, and stop a workflow. When you pause a workflow, the agents that operate at that time complete their work, but no new agent starts.
- If you ask the agent to resume a stopped workflow, the completed agents do not run again. Their results come from a cache.
- The `⋯` menu of a workflow saves its script as a command for the project or for you. The command has the name of the workflow, and the text after the command goes to the script as `args`.
- The `/deep-research` command is a built-in workflow. It uses web search to find sources for your question, lets three agents examine each claim, and writes a report with its sources.
- An agent with the option `isolation: 'worktree'` operates in a new git worktree. Thus, it does not change the files in your folder.

A workflow starts with no question, because OpenCode lets agents do all actions by default. To make OpenCode ask you before each workflow starts, add this rule to the `permissions` list of your global `opencode.json` or `opencode.jsonc`:

```jsonc
{ "action": "workflow", "resource": "*", "effect": "ask" }
```

## Install

The `opencode` command must be version 2.2.5 or later. Earlier versions do not install a plugin that has only a desktop part. To see your version, run `opencode --version`.

If your `opencode` command is older than the desktop app, use the command that the app contains. On macOS, it is `/Applications/OpenCode.app/Contents/Resources/opencode-cli`.

1. Run this command:

   ```sh
   opencode plugin add github:ephraimduncan/opencode-plus
   ```

2. Open OpenCode Desktop. If the app is open, wait a few seconds.
3. Open **Settings > Extensions > Plugins** and make sure that `opencode-plus` is in the list.

## Update

OpenCode keeps the installed version of the plugin until you update it. A restart of OpenCode does not get a new version.

1. Run this command:

   ```sh
   opencode plugin update
   ```

2. Close OpenCode Desktop and open it again.

## Options

To change the behavior of the plugin, use the `options` object of the plugin entry. The entry is in your global `opencode.json` or `opencode.jsonc`, in the `plugins` list. This example shows the options with their default values:

```jsonc
{
  "plugins": [
    {
      "package": "github:ephraimduncan/opencode-plus",
      "options": {
        "archiveAfterHours": 12,
        "hideAgent": "build",
        "responseLabel": "Response",
        "lowercaseVariants": true,
        "github": true,
        "workflows": true,
        "workflowSize": "medium"
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
| `github` | `true` | Opens links to GitHub pull requests and issues in the GitHub panel. `false` opens them in the browser pane, as other links. |
| `workflows` | `true` | Lets the agent run workflows. `false` removes the workflow tool, the "Workflows" panel, and the workflow commands. |
| `workflowSize` | `"medium"` | The number of agents that the agent tries to use in each workflow: `"small"` (less than 5), `"medium"` (less than 10), `"large"` (less than 50), or `"unrestricted"`. If you ask for more agents, the agent uses more. |
| `workflowConcurrency` | The number of CPU cores minus 2, from 1 to 16 | The maximum number of agents of one workflow that operate at the same time. |

When you save a change to the options, OpenCode loads the plugin again with the new values.

## Commands

Open the command palette and type the name of a command:

| Command | Result |
| --- | --- |
| "Show archived sessions" | Opens the "Archived" section. When the section is open, the command is "Hide archived sessions". |
| "Stop grouping sessions by project" | Shows one list with no project groups. The command then changes to "Group sessions by project". |
| "Show working sessions in their own section" | Moves working sessions back to the "Working" section of the app. |
| "Show the pull request of this branch" | Opens the pull request of the branch of the session in the GitHub panel. |
| "Show workflows" | Opens the "Workflows" panel. If the panel is open, the command closes it. |
| "Turn on ultracode for this session" | Does the same as `/ultracode`. When ultracode is on, the command is "Turn off ultracode for this session". |

## Limits

- The GUI plugin API of OpenCode is experimental. A new release of OpenCode can change it.
- The sidebar, the chat input, the conversation, and the context ring have no plugin API. Thus, the plugin changes the markup of the app.
- If a new release of OpenCode changes this markup, some changes of the plugin can stop. The rest of OpenCode continues to operate.
- The branch dropdown operates only with folders on the computer that runs OpenCode Desktop.
- The pull request badge and the GitHub panel operate only if the `gh` command is installed and has access to GitHub. The badge shows only pull requests from the owner of the `origin` remote.
- The GitHub panel shows a maximum of 100 changed files. The "Files" tab has a link to the remaining files on GitHub.
- The browser pane keeps only cookies. A site that keeps its login in local storage, for example some apps on Firebase, does not stay logged in after a restart.
- Automatic archive operates only while OpenCode Desktop is open. When you open the app again, the plugin archives the due sessions in approximately one minute.
- A workflow runs in the OpenCode server. If OpenCode Desktop closes, the workflow stops.

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
