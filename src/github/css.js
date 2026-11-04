import { colors, icons } from "../pr.js"

// The GitHub panel's styles, in the app's design tokens. The structure follows T3 Code's pull request panel and Linear's
// review view: meta rows, collapsible sections with sticky headings, comment cards, and a timeline whose events hang
// on one line. The segmented control repeats the app's own (`segmented-control-v2`), whose styles load only with the
// review panel. The glyphs are Lucide's, as T3 Code uses them: the app's icon set has none for pull requests.

const icon = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

const mask = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

// The states of pull requests and issues, with the colors of the sidebar's pull request badge.
const states = [
  ...Object.keys(icons).map((state) => ({ kind: "pull", state, svg: icons[state], color: colors[state] })),
  {
    kind: "issue",
    state: "open",
    svg: icon('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>'),
    color: colors.open,
  },
  {
    kind: "issue",
    state: "done",
    svg: icon('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
    color: colors.merged,
  },
  {
    kind: "issue",
    state: "skipped",
    svg: icon('<circle cx="12" cy="12" r="10"/><line x1="9" x2="15" y1="15" y2="9"/>'),
    color: colors.draft,
  },
]

// Glyphs in the color of the text around them, for buttons, meta rows and timeline markers.
export const glyphs = {
  merge: icons.merged,
  pull: icons.open,
  warning: icon(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  ),
  hammer: icon(
    '<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>',
  ),
  reply: icon(
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="m10 7-3 3 3 3"/><path d="M17 13v-1a2 2 0 0 0-2-2H7"/>',
  ),
  clock: icon('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  sync: icon(
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  ),
  reopen: icon('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
  eye: icon(
    '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  ),
  commit: icon(
    '<circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/>',
  ),
  comment: icon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  users: icon(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  ),
  user: icon('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  tag: icon(
    '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  ),
  milestone: icon(
    '<path d="M12 13v8"/><path d="M12 3v3"/><path d="M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.365l3.424-2.317a1 1 0 0 0 0-1.635l-3.424-2.318A2 2 0 0 0 17 6z"/>',
  ),
  branch: icon(
    '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  ),
  file: icon(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M9 10h6"/><path d="M12 13V7"/><path d="M9 17h6"/>',
  ),
  external: icon(
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  ),
  sort: icon('<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>'),
  terminal: icon('<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>'),
  checks: icon(
    '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  ),
  zap: icon(
    '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  ),
  box: icon(
    '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  ),
  parent: icon('<polyline points="14 9 9 4 4 9"/><path d="M20 20h-7a4 4 0 0 1-4-4V4"/>'),
  tree: icon(
    '<path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M3 6v4c0 1.1.9 2 2 2h3"/><path d="M3 10v6c0 1.1.9 2 2 2h3"/>',
  ),
  check: icon('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
  cross: icon('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'),
  chevron: icon('<path d="m9 18 6-6-6-6"/>'),
  unfold: icon('<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>'),
  copy: icon(
    '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  ),
}

const P = "[data-plus-github]"

export const css = `
[data-plus-github-state] {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  background-color: var(--plus-state);
}
[data-plus-github-state][data-size="small"] {
  width: 14px;
  height: 14px;
}
${states
  .map(
    ({ kind, state, svg, color }) => `[data-plus-github-state="${kind}:${state}"] {
  --plus-state: ${color[0]};
  mask: ${mask(svg)} center / contain no-repeat;
}
[data-color-scheme="dark"] [data-plus-github-state="${kind}:${state}"] {
  --plus-state: ${color[1]};
}`,
  )
  .join("\n")}
[data-plus-glyph] {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  background-color: currentColor;
  mask: var(--plus-glyph) center / contain no-repeat;
}
[data-plus-glyph][data-size="small"] {
  width: 12px;
  height: 12px;
}
${Object.entries(glyphs)
  .map(([name, svg]) => `[data-plus-glyph="${name}"] { --plus-glyph: ${mask(svg)}; }`)
  .join("\n")}

/* The header: T3 Code's crumbs, title, meta line and branch line. */
${P} [data-slot="title"] {
  font-size: 16px;
  font-weight: 530;
  line-height: 22px;
  letter-spacing: -0.16px;
  color: var(--color-v2-text-text-base);
  text-wrap: pretty;
  overflow-wrap: anywhere;
}
${P} [data-slot="chip"] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding-inline: 6px 8px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-v2-text-text-muted);
  background: var(--color-v2-background-bg-layer-01);
  box-shadow: inset 0 0 0 0.5px var(--color-v2-border-border-base);
  transition: color 0.15s, background-color 0.15s;
}
${P} [data-slot="chip"]:hover {
  color: var(--color-v2-text-text-base);
  background: var(--color-v2-background-bg-layer-02);
}

/* The tab bar: the app's segmented control on the start, the state of the view on the end. */
${P} [data-slot="tabbar"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding-block: 10px;
  border-block: 0.5px solid var(--color-v2-border-border-muted);
}
${P} [data-slot="segmented-control-v2"] {
  isolation: isolate;
  display: flex;
  flex: none;
  align-items: center;
  width: fit-content;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: var(--color-v2-background-bg-layer-01);
  box-shadow: 0 0 0 0.5px var(--color-v2-border-border-base);
  user-select: none;
}
${P} [data-slot="segmented-control-v2-item"] {
  display: flex;
  flex: none;
  flex-direction: row;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  font-weight: 440;
  line-height: 100%;
  letter-spacing: -0.04px;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-muted);
  transition: color 0.15s, background-color 0.12s, box-shadow 0.12s;
}
${P} [data-slot="segmented-control-v2-item"]:hover:not([data-pressed]) {
  color: var(--color-v2-text-text-base);
}
${P} [data-slot="segmented-control-v2-item"][data-pressed] {
  color: var(--color-v2-text-text-base);
  background: var(--color-v2-background-bg-base);
  box-shadow: 0 0 0 0.5px var(--color-v2-border-border-strong);
}
${P} [data-slot="segmented-control-v2-item"]:focus-visible {
  outline: 2px solid var(--color-v2-border-border-focus);
  outline-offset: 1px;
}
${P} [data-slot="segmented-control-v2-item"] [data-slot="count"] {
  color: var(--color-v2-text-text-faint);
}

/* The meta rows of T3 Code's summary: an icon and a label, then the value. */
${P} [data-slot="meta"] {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 28px;
  font-size: 12px;
  line-height: 16px;
}
${P} [data-slot="meta"] > :first-child {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-v2-text-text-muted);
}
${P} [data-slot="meta"] > :last-child {
  min-width: 0;
  color: var(--color-v2-text-text-base);
}

/* A label in its GitHub color, tinted as T3 Code tints it. */
${P} [data-slot="label"] {
  display: inline-flex;
  align-items: center;
  max-width: 192px;
  height: 20px;
  padding-inline: 8px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 530;
  color: color-mix(in oklch, var(--plus-label) 35%, var(--color-v2-text-text-base));
  background: color-mix(in oklch, var(--plus-label) 12%, transparent);
  box-shadow: inset 0 0 0 0.5px color-mix(in oklch, var(--plus-label) 30%, transparent);
}
[data-color-scheme="dark"] ${P} [data-slot="label"] {
  color: color-mix(in oklch, var(--plus-label) 55%, var(--color-v2-text-text-base));
  background: color-mix(in oklch, var(--plus-label) 18%, transparent);
}

/* Avatars, and the ring and badge of a reviewer's verdict. */
${P} [data-slot="avatar"] {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  border-radius: 9999px;
}
${P} [data-slot="avatar"] > img,
${P} [data-slot="avatar"] > [data-slot="initial"] {
  width: var(--plus-avatar, 16px);
  height: var(--plus-avatar, 16px);
  border-radius: 9999px;
  object-fit: cover;
  background: var(--color-v2-background-bg-layer-02);
}
${P} [data-slot="avatar"] > [data-slot="initial"] {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--plus-avatar, 16px) * 0.45);
  font-weight: 530;
  text-transform: uppercase;
  color: var(--color-v2-text-text-muted);
}
${P} [data-slot="avatars"] {
  display: flex;
  align-items: center;
}
${P} [data-slot="avatars"] > * + * {
  margin-inline-start: -4px;
}
${P} [data-slot="avatars"] [data-slot="avatar"] {
  box-shadow: 0 0 0 2px var(--color-v2-background-bg-base);
}
${P} [data-slot="avatar"][data-verdict="approved"] {
  box-shadow: 0 0 0 2px var(--color-v2-state-fg-success);
}
${P} [data-slot="avatar"][data-verdict="changes"] {
  box-shadow: 0 0 0 2px var(--color-v2-state-fg-danger);
}
${P} [data-slot="avatar"] > [data-slot="badge"] {
  position: absolute;
  inset-inline-end: -3px;
  bottom: -3px;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: var(--color-v2-background-bg-base);
}
${P} [data-slot="avatar"] > [data-slot="badge"] > [data-plus-glyph] {
  width: 10px;
  height: 10px;
}
${P} [data-slot="avatar"][data-verdict="approved"] > [data-slot="badge"] {
  color: var(--color-v2-state-fg-success);
}
${P} [data-slot="avatar"][data-verdict="changes"] > [data-slot="badge"] {
  color: var(--color-v2-state-fg-danger);
}

/* T3 Code's collapsible sections: the heading stays at the top while its section scrolls. */
${P} [data-slot="section"] > [data-slot="heading"] {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-v2-background-bg-base);
}
${P} [data-slot="section"] > [data-slot="heading"] > button {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 6px;
  padding-block: 12px;
  text-align: start;
  font-size: 12px;
  font-weight: 530;
  color: var(--color-v2-text-text-muted);
}
${P} [data-slot="section"] > [data-slot="heading"] > button:hover {
  color: var(--color-v2-text-text-base);
}
${P} [data-slot="section"] > [data-slot="heading"] [data-plus-glyph="chevron"] {
  color: var(--color-v2-icon-icon-faint);
  transition: transform 0.15s;
}
${P} [data-slot="section"][data-open] > [data-slot="heading"] [data-plus-glyph="chevron"] {
  transform: rotate(90deg);
}
${P} [data-slot="section"] + [data-slot="section"] {
  border-top: 0.5px solid var(--color-v2-border-border-muted);
}

/* A comment as T3 Code's card: a header with who and when, then the text. */
${P} [data-slot="comment"] {
  min-width: 0;
  overflow: hidden;
  border: 0.5px solid var(--color-v2-border-border-base);
  border-radius: 8px;
  background: var(--color-v2-background-bg-base);
}
${P} [data-slot="comment"] > header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  min-height: 36px;
  padding: 6px 6px 6px 12px;
  font-size: 12px;
  color: var(--color-v2-text-text-muted);
  background: var(--color-v2-background-bg-layer-01);
  border-bottom: 0.5px solid var(--color-v2-border-border-muted);
}
${P} [data-slot="comment"] > header:last-child {
  border-bottom: none;
}
${P} [data-slot="comment"] > [data-slot="body"] {
  padding: 10px 12px 12px;
}
${P} [data-slot="verdict"] {
  font-size: 11.5px;
  font-weight: 530;
}
${P} [data-slot="verdict"][data-verdict="approved"] {
  color: var(--color-v2-state-fg-success);
}
${P} [data-slot="verdict"][data-verdict="changes"] {
  color: var(--color-v2-state-fg-danger);
}
${P} [data-slot="reactions"] {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 12px 10px;
}
${P} [data-slot="reaction"] {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding-inline: 6px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-muted);
  box-shadow: inset 0 0 0 0.5px var(--color-v2-border-border-base);
}

/* The timeline of T3 Code: each event hangs on one line by its marker, an avatar or a glyph. */
${P} [data-slot="timeline"] {
  position: relative;
  display: flex;
  flex-direction: column;
}
${P} [data-slot="timeline"]::before {
  content: "";
  position: absolute;
  inset-inline-start: 15.5px;
  top: 20px;
  bottom: 20px;
  width: 1px;
  background: var(--color-v2-border-border-muted);
}
${P} [data-slot="event"] {
  position: relative;
  min-width: 0;
  padding-inline-start: 44px;
  padding-bottom: 20px;
}
${P} [data-slot="event"] > [data-slot="marker"] {
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-v2-icon-icon-muted);
  background: var(--color-v2-background-bg-base);
}
${P} [data-slot="event"] > [data-slot="marker"] > [data-slot="ring"] {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: var(--color-v2-background-bg-layer-01);
  box-shadow: inset 0 0 0 0.5px var(--color-v2-border-border-base);
}
${P} [data-slot="event"] > [data-slot="line"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
  min-height: 32px;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--color-v2-text-text-muted);
}
${P} [data-slot="event"] > [data-slot="line"] > strong {
  font-weight: 530;
  color: var(--color-v2-text-text-base);
}
${P} [data-slot="event"] > [data-slot="comment"] {
  margin-top: 4px;
}
${P} [data-slot="commit"] {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 32px;
  text-align: start;
}
${P} [data-slot="commit"]:hover [data-slot="headline"] {
  color: var(--color-v2-text-text-accent);
}

/* The rows of checks and reviewers. */
${P} [data-slot="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding-inline: 8px;
  margin-inline: -8px;
  border-radius: 6px;
  font-size: 12.5px;
}
${P} button[data-slot="row"]:hover,
${P} [data-slot="row"]:has(> button:first-child:hover) {
  background: var(--color-v2-background-bg-layer-02);
}

/* Markdown starts at the top of its box: the timeline's text part keeps its space from the message above. */
${P} [data-component="text-part"],
${P} [data-component="markdown"] > :first-child > :first-child,
${P} [data-component="markdown"] > :first-child:not([data-markdown-block]) {
  margin-top: 0;
}

/* A file's diff, in the diff colors of the app's theme: line numbers, a sign, then the code. */
${P} [data-slot="diff"] {
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 20px;
}
${P} [data-slot="diff-rows"] {
  width: max-content;
  min-width: 100%;
}
${P} [data-slot="diff-hunk"] {
  position: sticky;
  inset-inline-start: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding-inline: 14px 12px;
  font-family: var(--font-family-sans);
  font-size: 12px;
  color: var(--color-v2-text-text-muted);
  background: var(--surface-diff-hidden-weak);
  border-block: 0.5px solid var(--color-v2-border-border-muted);
}
${P} [data-slot="diff-hunk"]:first-child {
  border-top: none;
}
${P} [data-slot="diff-line"] {
  display: flex;
  color: var(--color-v2-text-text-base);
}
${P} [data-slot="diff-number"] {
  flex: none;
  width: 48px;
  padding-inline: 8px;
  text-align: end;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
  user-select: none;
}
${P} [data-slot="diff-sign"] {
  flex: none;
  width: 20px;
  text-align: center;
  color: var(--color-v2-text-text-faint);
  user-select: none;
}
${P} [data-slot="diff-code"] {
  flex: 1;
  padding-inline-end: 16px;
  white-space: pre;
}
${P} [data-slot="diff-line"][data-type="add"] {
  background: var(--surface-diff-add-base);
}
${P} [data-slot="diff-line"][data-type="add"] > [data-slot="diff-number"] {
  color: var(--text-diff-add-base);
  background: var(--surface-diff-add-strong);
}
${P} [data-slot="diff-line"][data-type="add"] > [data-slot="diff-sign"] {
  color: var(--text-diff-add-base);
}
${P} [data-slot="diff-line"][data-type="del"] {
  background: var(--surface-diff-delete-base);
}
${P} [data-slot="diff-line"][data-type="del"] > [data-slot="diff-number"] {
  color: var(--text-diff-delete-base);
  background: var(--surface-diff-delete-strong);
}
${P} [data-slot="diff-line"][data-type="del"] > [data-slot="diff-sign"] {
  color: var(--text-diff-delete-base);
}

/* The loading state: bars in the shape of the header, as T3 Code's ghost. */
${P} [data-slot="ghost"] {
  height: 12px;
  border-radius: 4px;
  background: var(--color-v2-background-bg-layer-02);
  animation: plus-github-ghost 1.4s ease-in-out infinite;
}
@keyframes plus-github-ghost {
  50% {
    opacity: 0.5;
  }
}
@media (prefers-reduced-motion: reduce) {
  ${P} [data-slot="ghost"] {
    animation: none;
  }
}
`
