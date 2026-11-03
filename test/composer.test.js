import { expect, test } from "vitest"
import { compose } from "../src/composer.js"

// The chat input's controls bar as the app renders it (OpenCode Desktop 2.2.5, editor.tsx).
const controls = (agent) => {
  document.body.innerHTML =
    `<div data-slot="composer-controls"><div class="flex h-full w-max items-center">` +
    `<div data-component="tooltip-v2-trigger"><button aria-label="Choose agent"><span class="truncate capitalize leading-5">${agent}</span></button></div>` +
    `<div data-component="tooltip-v2-trigger"><button data-action="composer-model">Claude Opus 5.5</button></div>` +
    `<div data-component="tooltip-v2-trigger"><button aria-label="Choose model variant"><span class="truncate capitalize leading-5">xhigh</span></button></div>` +
    `</div></div>`
  return document.querySelector('[data-component="tooltip-v2-trigger"]')
}

// Catches a dropdown hidden on every agent: a person who switches to plan must still see that they did.
test.each([
  ["build", "build", true],
  ["Build", "build", true],
  ["plan", "build", false],
  ["build", false, false],
])("agent %s with hideAgent %s: hidden %s", (agent, hideAgent, want) => {
  const dropdown = controls(agent)

  compose(hideAgent)

  expect(dropdown.hasAttribute("data-plus-hidden-agent")).toBe(want)
})
