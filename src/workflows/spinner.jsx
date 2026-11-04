import { For, onCleanup } from "solid-js"

// The app's activity spinner, Soft Radar (`@opencode/ui/spinner`), which a plugin bundle cannot import: a 5×5 dot grid
// whose lit head sweeps clockwise around each square ring, with the centre dot steady. The markup matches the app's
// (`data-component="session-progress-indicator-v2"`, `data-slot="spinner-dots"`), so the app's styles apply to it.
// `still` shows the frozen pose, for work that waits.

const SPAN = 5
const SIZE = 2
const PITCH = 3
const LOOP = 1.8
const DIM = 0.2
const FADE = [1, 0.987, 0.934, 0.812, 0.599, 0.384, 0.238, 0.143, 0.081, 0.041, 0.017, 0.004, 0]
const TRAIL = [...FADE.map((level, index) => [index * 4, round(0.55 * level)]), [100, 0]]
const NAME = "spinner-radar"

const { dots, shapes } = layout()

export function Spinner(props) {
  keyframes()

  return (
    <svg
      ref={(el) => {
        if (!props.still) pin(el)
      }}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      data-component="session-progress-indicator-v2"
      data-slot="spinner-dots"
      aria-hidden="true"
      fill="currentColor"
      class={props.class}
    >
      <For each={dots}>
        {(dot) => (
          <rect
            x={dot.x}
            y={dot.y}
            width={dot.size}
            height={dot.size}
            rx={dot.size * 0.24}
            style={{
              "--still": dot.still,
              animation:
                dot.steady || props.still
                  ? undefined
                  : `${NAME}-${dot.shape} calc(${LOOP}s * var(--spinner-time, 1)) linear calc(${-LOOP * (1 - dot.at)}s * var(--spinner-time, 1)) infinite`,
            }}
          />
        )}
      </For>
    </svg>
  )
}

// The keyframes, once per document. The app adds the same ones under the same names when its own spinner renders.
function keyframes() {
  if (document.getElementById("ocp-spinner-radar")) return

  const style = document.createElement("style")

  style.id = "ocp-spinner-radar"
  style.textContent = shapes
    .map(
      (stops, index) =>
        `@keyframes ${NAME}-${index}{${stops
          .map(([percent, level]) => `${round(percent)}%{opacity:${round(DIM + (1 - DIM) * level)};animation-timing-function:linear}`)
          .join("")}}`,
    )
    .join("")
  document.head.append(style)
}

// Every spinner starts its loop at the document timeline's origin, so all spinners on screen share one phase, as the
// app's do.
function pin(el) {
  const observer = new ResizeObserver(() =>
    el.getAnimations({ subtree: true }).forEach((animation) => {
      if (animation.startTime !== 0) animation.startTime = 0
    }),
  )

  observer.observe(el)
  onCleanup(() => observer.disconnect())
}

function layout() {
  const placed = Array.from({ length: SPAN * SPAN }, (_, index) => {
    const cell = { gx: (index % SPAN) - (SPAN - 1) / 2, gy: Math.floor(index / SPAN) - (SPAN - 1) / 2 }

    return { cell, at: angle(cell), steady: cell.gx === 0 && cell.gy === 0 }
  })
  const ring = (cell) => Math.max(Math.abs(cell.gx), Math.abs(cell.gy))
  const keys = placed.map((dot) => {
    if (dot.steady) return ""

    const others = placed.filter((other) => other !== dot && !other.steady && ring(other.cell) === ring(dot.cell))
    const behind = Math.min(...others.map((other) => frac(dot.at - other.at)))
    const ahead = Math.min(...others.map((other) => frac(other.at - dot.at)))

    return `${round(behind)} ${round(ahead)}`
  })
  const unique = [...new Set(keys.filter((key) => key !== ""))]
  const shapes = unique.map((key) => {
    const [behind, ahead] = key.split(" ").map(Number)

    return head(behind * 100, ahead * 100)
  })
  const dots = placed.map((dot, index) => {
    const shape = Math.max(0, unique.indexOf(keys[index]))
    const level = dot.steady ? TRAIL[0][1] : levelAt(shapes[shape], frac(0.22 - dot.at) * 100)

    return {
      x: round(8 + dot.cell.gx * PITCH - SIZE / 2),
      y: round(8 + dot.cell.gy * PITCH - SIZE / 2),
      size: SIZE,
      at: round(dot.at),
      steady: dot.steady,
      still: round(DIM + (1 - DIM) * level),
      shape,
    }
  })

  return { dots, shapes }
}

function head(behind, ahead) {
  const edge = 1.5
  const off = ahead / 2 + edge
  const on = 100 - behind / 2

  return [
    [0, 1],
    [ahead / 2, 1],
    [off, levelAt(TRAIL, off)],
    ...TRAIL.filter(([percent]) => percent > off && percent < 100 && percent < on - edge),
    [on - edge, 0],
    [on, 1],
    [100, 1],
  ]
}

function angle(cell) {
  return frac(Math.atan2(cell.gx, -cell.gy) / (2 * Math.PI))
}

function levelAt(stops, percent) {
  const next = stops.findIndex(([at]) => at >= percent)

  if (next <= 0) return stops[0]?.[1] ?? 0

  const [p0, l0] = stops[next - 1]
  const [p1, l1] = stops[next]

  return l0 + ((l1 - l0) * (percent - p0)) / (p1 - p0 || 1)
}

function frac(value) {
  return value - Math.floor(value)
}

function round(value) {
  return Math.round(value * 1000) / 1000
}
