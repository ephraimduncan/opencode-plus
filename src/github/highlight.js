import { codeToTokens, isSupportedLanguage } from "@pierre/highlights"

// The tokens of each line of `list`, the hunks of the file at `path`, as `{ text, style }` runs, by line. The file
// before and the file after the change are highlighted apart, so that a removed line cannot change how an added line
// reads, for example when it opens a comment. A line of a language that the app cannot highlight has no runs.
export function highlight(list, path) {
  const lang = language(path)
  const runs = new Map()

  if (lang === "text") return runs

  const lines = list.flatMap((hunk) => hunk.lines)
  const before = lines.filter((line) => line.type !== "add")
  const after = lines.filter((line) => line.type !== "del")

  for (const side of [before, after]) {
    const { tokens } = codeToTokens(side.map((line) => line.text).join("\n"), { lang, theme, tokenizeMaxLineLength })

    side.forEach((line, index) => runs.set(line, tokens[index].map(run)))
  }

  return runs
}

// The language of the file at `path`, from its extension or, without one, its name, such as `Dockerfile`.
function language(path) {
  const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase()
  const dot = name.lastIndexOf(".")
  const key = dot > 0 ? name.slice(dot + 1) : name

  return isSupportedLanguage(key) ? key : "text"
}

// A run in the style that the app's code blocks give it.
function run(token) {
  const style = [
    token.color && `color:${token.color}`,
    token.fontStyle & 1 && "font-style:italic",
    token.fontStyle & 2 && "font-weight:bold",
  ]

  return { text: token.content, style: style.filter(Boolean).join(";") }
}

// A longer line stays one plain run, so that a minified line does not fill the diff with elements.
const tokenizeMaxLineLength = 1000

// The app's palette for code (`OpenCodeTheme`): each value names a CSS variable of the app without its `--`, so the
// code takes the colors of the theme that the user picked.
const theme = {
  name: "OpenCode",
  appearance: "dark",
  cssVariables: { prefix: "--" },
  style: {
    "editor.background": "color-background-stronger",
    "editor.foreground": "text-base",
    created: "syntax-diff-add",
    deleted: "syntax-diff-delete",
    modified: "syntax-diff-unknown",
    syntax: {
      attribute: "syntax-property",
      background: "color-background-stronger",
      boolean: "syntax-constant",
      comment: "syntax-comment",
      constant: "syntax-constant",
      constructor: "syntax-type",
      "diff.minus": "syntax-diff-delete",
      "diff.plus": "syntax-diff-add",
      embedded: "text-base",
      emphasis: "text-base",
      enum: "syntax-type",
      foreground: "text-base",
      function: "syntax-primitive",
      hint: "syntax-comment",
      keyword: "syntax-keyword",
      "keyword.operator": "syntax-operator",
      label: "syntax-constant",
      link_text: "syntax-info",
      link_uri: "syntax-keyword",
      namespace: "syntax-constant",
      number: "syntax-constant",
      operator: "syntax-operator",
      predictive: { color: "syntax-comment", font_style: "italic" },
      preproc: "syntax-keyword",
      primary: "syntax-info",
      property: "syntax-variable",
      punctuation: "syntax-punctuation",
      "punctuation.special": "syntax-keyword",
      selector: "syntax-keyword",
      "selector.class": "syntax-property",
      "selector.id": "syntax-primitive",
      "selector.pseudo": "syntax-operator",
      string: "syntax-string",
      "string.escape": "syntax-constant",
      "string.regex": "syntax-regexp",
      "string.special": "syntax-constant",
      tag: "syntax-keyword",
      "tag.component.jsx": "syntax-type",
      text: "text-base",
      "text.literal": "syntax-string",
      title: { color: "syntax-keyword", font_weight: 700 },
      type: "syntax-type",
      variable: "syntax-variable",
      "variable.parameter": "text-base",
      "variable.special": "syntax-constant",
      variant: "syntax-constant",
    },
  },
}
