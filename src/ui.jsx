import { createSignal, onCleanup } from "solid-js"
import { usePlugin } from "@opencode/plugin/gui"

// Parts of the plugin's side panels, with the markup and classes of the app's browser panel and new tab view, so the
// panels look like the rest of the app.

// The browser panel's toolbar.
export function Bar(props) {
  return (
    <div class="h-11 shrink-0 flex items-center gap-2 px-3 border-b-[0.5px] border-v2-border-border-muted">
      {props.children}
    </div>
  )
}

export function Scroll(props) {
  return (
    <div class="min-h-0 flex-1 overflow-y-auto" data-scrollable>
      {props.children}
    </div>
  )
}

// An icon button of the browser panel's toolbar, with its label as a tooltip.
export function Action(props) {
  const ctx = usePlugin()

  return (
    <ctx.ui.Tooltip value={props.label} placement="top">
      <ctx.ui.IconButton
        variant="ghost-muted"
        size="large"
        icon={props.icon}
        label={props.label}
        busy={props.busy}
        onClick={props.onClick}
      />
    </ctx.ui.Tooltip>
  )
}

// The new tab view's "Show more".
export function More(props) {
  return (
    <button
      type="button"
      class="flex h-8 w-fit items-center gap-1 rounded-[6px] px-2 text-[13px] font-[440] text-v2-text-text-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base"
      onClick={() => props.onClick()}
    >
      {props.children}
    </button>
  )
}

// The time every `interval` milliseconds while `ticking()` holds.
export function clock(ticking, interval = 1000) {
  const [now, setNow] = createSignal(Date.now())
  const timer = setInterval(() => {
    if (ticking()) setNow(Date.now())
  }, interval)

  onCleanup(() => clearInterval(timer))

  return now
}
