import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { usePlugin } from "@opencode/plugin/gui"
import { More } from "../ui.jsx"
import { hunks } from "./format.js"
import { Glyph, Label, Lines } from "./parts.jsx"

// The Files view: the count of files, commits and lines as Linear shows it, a filter, then a row for each file as a
// turn's changes in the timeline. A row opens to the file's diff, which loads when it first opens.
export function Files(props) {
  const ctx = usePlugin()
  const [query, setQuery] = createSignal("")
  const [open, setOpen] = createSignal(new Set())
  const shown = () => {
    const text = query().trim().toLowerCase()

    return text ? props.item.files.filter((file) => file.path.toLowerCase().includes(text)) : props.item.files
  }
  const all = () => shown().length > 0 && shown().every((file) => open().has(file.path))

  const toggle = (path, value = !open().has(path)) => {
    const next = new Set(open())

    if (value) {
      next.add(path)
      props.load(path)
    } else next.delete(path)
    setOpen(next)
  }

  return (
    <div class="flex flex-col gap-3 pt-4">
      <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        <span class="text-14-medium tabular-nums text-v2-text-text-base">
          {ctx.plural("github.changed", props.item.changed)}
        </span>
        <Lines additions={props.item.additions} deletions={props.item.deletions} />
        <span class="flex items-center gap-1 text-12-regular tabular-nums text-v2-text-text-muted">
          <Glyph name="commit" size="small" />
          {ctx.plural("github.commits.count", props.item.commits)}
        </span>
        <span class="min-w-0 flex-1" />
        <ctx.ui.Button
          variant="ghost-muted"
          size="small"
          disabled={shown().length === 0}
          onClick={() => shown().forEach((file) => toggle(file.path, !all()))}
        >
          <Label glyph={all() ? "fold" : "unfold"}>
            {ctx.t(all() ? "github.files.collapse" : "github.files.expand")}
          </Label>
        </ctx.ui.Button>
      </div>
      <Show when={props.item.files.length > 6}>
        <ctx.ui.TextInput
          type="search"
          label={ctx.t("github.files.filter")}
          placeholder={ctx.t("github.files.filter")}
          value={query()}
          onInput={setQuery}
        />
      </Show>
      <div data-component="apply-patch-tool">
        <div data-component="accordion" data-scope="apply-patch">
          <For each={shown()}>
            {(file) => (
              <File
                file={file}
                open={open().has(file.path)}
                patch={props.patches?.[file.path]}
                onToggle={() => toggle(file.path)}
              />
            )}
          </For>
        </div>
      </div>
      <Show when={props.item.changed > props.item.files.length}>
        <More onClick={() => props.browse(`${props.item.url}/files`)}>
          {ctx.t("github.files.rest", { count: props.item.changed - props.item.files.length })}
        </More>
      </Show>
    </div>
  )
}

// A file as an item of the apply-patch accordion: its folder and name, what changed, then its diff when it is open.
function File(props) {
  const ctx = usePlugin()
  const slash = props.file.path.lastIndexOf("/")
  const state = () => (props.open ? { "data-expanded": "" } : { "data-closed": "" })

  return (
    <div data-slot="accordion-item" {...state()}>
      <h3 data-slot="accordion-header" data-component="sticky-accordion-header" {...state()}>
        <button
          type="button"
          data-slot="accordion-trigger"
          aria-expanded={props.open}
          {...state()}
          onClick={props.onToggle}
        >
          <div data-slot="apply-patch-trigger-content">
            <div data-slot="apply-patch-file-info">
              <Glyph name="file" class="text-v2-icon-icon-muted" />
              <div data-slot="apply-patch-file-name-container">
                <Show when={slash >= 0}>
                  <span data-slot="apply-patch-directory">{`\u202A${props.file.path.slice(0, slash + 1)}\u202C`}</span>
                </Show>
                <span data-slot="apply-patch-filename">{props.file.path.slice(slash + 1)}</span>
              </div>
            </div>
            <div data-slot="apply-patch-trigger-actions">
              <Switch fallback={<Lines additions={props.file.additions} deletions={props.file.deletions} />}>
                <Match when={props.file.change === "added"}>
                  <span data-slot="apply-patch-change" data-type="added">
                    {ctx.t("ui.patch.action.created")}
                  </span>
                </Match>
                <Match when={props.file.change === "deleted"}>
                  <span data-slot="apply-patch-change" data-type="removed">
                    {ctx.t("ui.patch.action.deleted")}
                  </span>
                </Match>
              </Switch>
              <ctx.ui.Icon name="chevron-grabber-vertical" size="small" />
            </div>
          </div>
        </button>
      </h3>
      <Show when={props.open}>
        <div role="region" data-slot="accordion-content" data-expanded="">
          <Switch>
            <Match when={props.patch?.text}>
              <Diff text={props.patch.text} />
            </Match>
            <Match when={props.patch?.error}>
              <div class="px-3 py-2 text-12-regular text-v2-state-fg-danger">
                {ctx.t(`github.error.${props.patch.error.reason}`)}
              </div>
            </Match>
            <Match when={props.patch && !props.patch.busy}>
              <div class="px-3 py-2 text-12-regular text-v2-text-text-faint">{ctx.t("github.diff.none")}</div>
            </Match>
            <Match when={true}>
              <div class="flex flex-col gap-2 px-3 py-3">
                <span data-slot="ghost" style={{ width: "50%" }} />
                <span data-slot="ghost" style={{ width: "33%" }} />
              </div>
            </Match>
          </Switch>
        </div>
      </Show>
    </div>
  )
}

// A file's diff in the colors of the app's diff view: a row for each line, with its numbers before and after, and a
// band before each hunk that says how many lines it skips.
function Diff(props) {
  const ctx = usePlugin()
  const list = createMemo(() => hunks(props.text))

  return (
    <div data-slot="diff" data-component="apply-patch-file-diff">
      <div data-slot="diff-rows">
        <For each={list()}>
          {(hunk) => (
            <>
              <div data-slot="diff-hunk">
                <Glyph name="unfold" size="small" />
                <Show when={hunk.skipped > 0}>
                  <span>{ctx.plural("github.diff.skipped", hunk.skipped)}</span>
                </Show>
                <span class="truncate font-mono">{hunk.heading}</span>
              </div>
              <For each={hunk.lines}>
                {(line) => (
                  <div data-slot="diff-line" data-type={line.type}>
                    <span data-slot="diff-number">{line.before}</span>
                    <span data-slot="diff-number">{line.after}</span>
                    <span data-slot="diff-sign">{SIGNS[line.type]}</span>
                    <span data-slot="diff-code">{line.text}</span>
                  </div>
                )}
              </For>
            </>
          )}
        </For>
      </div>
    </div>
  )
}

const SIGNS = { add: "+", del: "-", same: " " }
