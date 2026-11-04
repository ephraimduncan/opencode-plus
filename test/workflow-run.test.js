// @vitest-environment node
import { describe, expect, test } from "vitest"
import { Run, shorten } from "../src/workflow/run.js"
import { parse } from "../src/workflow/script.js"

const META = "export const meta = { name: 'test-flow', description: 'A test workflow', phases: [{ title: 'Find' }] }\n"

// A run of `body`, whose agents answer through `answer(prompt, agent, tools)`. `tools` holds the run signal and the
// update callback that spawn receives, and a sleep that a stop ends early.
function start(body, { answer = (prompt) => `done: ${prompt}`, ...options } = {}) {
  const { meta, code } = parse(META + body)
  const spawned = []
  const run = new Run({
    id: "wf_test",
    meta,
    code,
    concurrency: 16,
    ...options,
    spawn: async (agent, tools) => {
      spawned.push(agent.prompt)
      const sleep = (ms) =>
        new Promise((resolve) => {
          const timer = setTimeout(resolve, ms)
          tools.signal.addEventListener("abort", () => (clearTimeout(timer), resolve()), { once: true })
        })

      const value = await answer(agent.prompt, agent, { ...tools, sleep })

      return tools.signal.aborted ? null : value
    },
  })

  return { run, spawned, done: run.start() }
}

const result = (run) => JSON.parse(run.result)

describe("agent()", () => {
  test("returns the agent's text, and the script's return value becomes the result", async () => {
    const { run, done } = start("const a = await agent('one')\nreturn { a }")
    await done
    expect(run.status).toBe("completed")
    expect(result(run)).toEqual({ a: "done: one" })
  })

  test("returns the structured object of an agent with a schema", async () => {
    const { run, done } = start(
      "const r = await agent('count', { schema: { type: 'object', properties: { n: { type: 'number' } }, required: ['n'] } })\nreturn r.n + 1",
      { answer: () => ({ n: 41 }) },
    )
    await done
    expect(result(run)).toBe(42)
  })

  // Catches a schema check that runs only after the agent starts.
  test("rejects a schema that requires a key it does not define, before any agent starts", async () => {
    const { run, done, spawned } = start(
      "await agent('x', { schema: { type: 'object', properties: {}, required: ['missing'] } })",
    )
    await done
    expect(run.status).toBe("failed")
    expect(run.error).toContain('requires "missing"')
    expect(spawned).toEqual([])
  })

  test("uses the phase of the last phase() call, or the one in its options", async () => {
    const { run, done } = start("phase('Find')\nawait agent('a')\nawait agent('b', { phase: 'Verify', label: 'check b' })")
    await done
    expect(run.agents.map((agent) => [agent.label, agent.phase])).toEqual([
      ["a", "Find"],
      ["check b", "Verify"],
    ])
    expect(run.phases.map((phase) => phase.title)).toEqual(["Find", "Verify"])
  })
})

describe("parallel()", () => {
  test("puts null in place of a failed task and logs it, without failing the call", async () => {
    const { run, done } = start(
      "return await parallel([() => agent('a'), () => agent('boom'), () => agent('c')])",
      {
        answer: (prompt) => {
          if (prompt === "boom") throw new Error("model went away")
          return prompt
        },
      },
    )
    await done
    expect(result(run)).toEqual(["a", null, "c"])
    expect(run.logs.map((log) => log.message)).toEqual(["parallel[1] failed: model went away"])
  })

  test("rejects promises in place of functions", async () => {
    const { run, done } = start("await parallel([agent('a')])")
    await done
    expect(run.status).toBe("failed")
    expect(run.error).toContain("not promises")
  })

  // Catches arrays of the host realm: the script's own checks must work on what the runtime returns.
  test("returns an array of the script's own realm", async () => {
    const { run, done } = start("const r = await parallel([() => agent('a')])\nreturn r instanceof Array")
    await done
    expect(result(run)).toBe(true)
  })
})

describe("pipeline()", () => {
  // Catches a barrier between stages: the fast item reaches stage two while the slow item is still in stage one.
  test("moves each item through the stages without waiting for the other items", async () => {
    const order = []
    const { run, done } = start(
      "return await pipeline(['slow', 'fast'], (item) => agent('find ' + item), (found, item, index) => agent('verify ' + item + ' ' + index))",
      {
        answer: async (prompt, agent, tools) => {
          if (prompt === "find slow") await tools.sleep(150)
          order.push(prompt)
          return prompt
        },
      },
    )
    await done
    expect(order).toEqual(["find fast", "verify fast 1", "find slow", "verify slow 0"])
    expect(result(run)).toEqual(["verify slow 0", "verify fast 1"])
  })

  test("drops an item to null when a stage throws, and skips its later stages", async () => {
    const { run, done, spawned } = start(
      "return await pipeline([1, 2], (n) => { if (n === 2) throw new Error('bad item'); return agent('one ' + n) }, (r) => agent('two ' + r))",
    )
    await done
    expect(result(run)).toEqual(["done: two done: one 1", null])
    expect(spawned).toEqual(["one 1", "two done: one 1"])
    expect(run.logs.map((log) => log.message)).toEqual(["pipeline[1] failed: bad item"])
  })
})

describe("limits", () => {
  // Catches a slot count that is not enforced: six agents with two slots never run more than two at a time.
  test("runs at most `concurrency` agents at a time", async () => {
    let running = 0
    let most = 0
    const { done } = start("await parallel([1, 2, 3, 4, 5, 6].map((n) => () => agent('n' + n)))", {
      concurrency: 2,
      answer: async (prompt, agent, tools) => {
        most = Math.max(most, ++running)
        await tools.sleep(30)
        running--
        return prompt
      },
    })
    await done
    expect(most).toBe(2)
  })

  test("stops a loop at the agent cap", async () => {
    const { run, done, spawned } = start("while (true) await agent('again')", { maxAgents: 3 })
    await done
    expect(run.status).toBe("failed")
    expect(run.error).toContain("cap of 3 agent() calls")
    expect(spawned).toHaveLength(3)
  })

  test("throws when the token budget is spent, and drops the slots of parallel() calls", async () => {
    const { run, done } = start(
      "await agent('first')\nconst r = await parallel([() => agent('x'), () => agent('y')])\nreturn { r, left: budget.remaining() }",
      {
        total: 100,
        answer: (prompt, agent, tools) => {
          tools.update({ tokens: { input: 10, output: 150, reasoning: 0, cache: { read: 0, write: 0 } } })
          return prompt
        },
      },
    )
    await done
    expect(result(run)).toEqual({ r: [null, null], left: 0 })
    expect(run.logs.map((log) => log.message)).toEqual(["parallel: 2 slots dropped, token budget exceeded"])
  })

  // Catches a script that can read the clock: a resumed run would make different agent() calls.
  test.each([
    ["Date.now()"],
    ["new Date()"],
    ["Math.random()"],
    ["new Date(0).constructor.now()"],
    ["Temporal.Now.instant()"],
    ["new Intl.DateTimeFormat('en', { timeStyle: 'long' }).format()"],
    ["new Intl.DateTimeFormat('en').formatToParts()"],
  ])("fails a script that calls %s", async (call) => {
    const { run, done } = start(`return ${call}`)
    await done
    expect(run.status).toBe("failed")
    expect(run.error).toContain("is not available in a workflow script")
  })

  test("keeps dated values that do not read the clock", async () => {
    const { run, done } = start("return new Date(0).toISOString()")
    await done
    expect(result(run)).toBe("1970-01-01T00:00:00.000Z")
  })

  test("has no Node or file system access", async () => {
    const { run, done } = start("return [typeof require, typeof process, typeof fetch, typeof Bun]")
    await done
    expect(result(run)).toEqual(["undefined", "undefined", "undefined", "undefined"])
  })

  // Catches an import() error from the host's realm: its constructor chain reaches the host's Function and `process`.
  // The code skips `parse`, whose check rejects import(), to test the runtime's own guard.
  test("rejects an import() with an error that cannot reach the host", async () => {
    const run = new Run({
      id: "wf_test",
      meta: { name: "test-flow", description: "x", phases: [] },
      code: [
        "try { await import('node:fs'); return 'loaded' } catch (error) {",
        "  try { return typeof error.constructor.constructor('return process')() } catch (inner) { return 'blocked' }",
        "}",
      ].join("\n"),
      spawn: async () => null,
    })
    await run.start()
    expect(result(run)).toBe("blocked")
  })

  test("lets the script read its own meta", async () => {
    const { run, done } = start("return meta.phases[0].title")
    await done
    expect(result(run)).toBe("Find")
  })

  test("reports the script line of an error", async () => {
    const { run, done } = start("const a = 1\nundefinedFunction()")
    await done
    expect(run.error).toBe("ReferenceError: undefinedFunction is not defined (script line 3)")
  })
})

describe("control", () => {
  test("starts no agent while paused, and continues on resume", async () => {
    const { run, done, spawned } = start("await agent('a')\nawait agent('b')", {
      answer: async (prompt, agent, tools) => {
        if (prompt === "a") run.pause()
        return prompt
      },
    })
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(spawned).toEqual(["a"])
    expect(run.agents.map((agent) => agent.status)).toEqual(["done", "queued"])
    run.resume()
    await done
    expect(spawned).toEqual(["a", "b"])
  })

  test("stops the run: running agents get an aborted signal and queued ones never start", async () => {
    let aborted = false
    const { run, done, spawned } = start("await parallel([() => agent('a'), () => agent('b')])", {
      concurrency: 1,
      answer: async (prompt, agent, tools) => {
        setTimeout(() => run.stop(), 20)
        await tools.sleep(5000)
        aborted = tools.signal.aborted
        return prompt
      },
    })
    await done
    expect(run.status).toBe("stopped")
    expect(aborted).toBe(true)
    expect(spawned).toEqual(["a"])
    expect(run.agents.map((agent) => agent.status)).toEqual(["stopped", "stopped"])
  })

  test("stops one agent: its call resolves null and the script continues", async () => {
    const { run, done } = start("const r = await parallel([() => agent('slow'), () => agent('fast')])\nreturn r", {
      answer: async (prompt, agent, tools) => {
        if (prompt === "slow") {
          setTimeout(() => run.stopAgent(agent.id), 20)
          await tools.sleep(5000)
        }
        return prompt
      },
    })
    await done
    expect(result(run)).toEqual([null, "fast"])
    expect(run.agents.map((agent) => agent.status)).toEqual(["stopped", "done"])
  })

  // Catches an agent that died on an API error but shows as stopped, so the failed count of the run leaves it out.
  test("fails an agent that ends with no result and no stop, and its call resolves null", async () => {
    const { run, done } = start("const r = await parallel([() => agent('dies'), () => agent('ok')])\nreturn r", {
      answer: (prompt) => (prompt === "dies" ? null : prompt),
    })
    await done
    expect(result(run)).toEqual([null, "ok"])
    expect(run.agents.map((agent) => agent.status)).toEqual(["failed", "done"])
  })
})

describe("resume", () => {
  // Catches a cache that ignores the prompt: the changed agent must run again, and the unchanged ones must not.
  test("returns earlier results for unchanged calls and runs changed ones", async () => {
    const journal = []
    const first = start("const a = await agent('alpha')\nconst b = await agent('beta ' + a)\nreturn [a, b]", {
      journal: (entry) => journal.push(entry),
    })
    await first.done

    const second = start("const a = await agent('alpha')\nconst b = await agent('beta ' + a)\nconst c = await agent('gamma')\nreturn [a, b, c]", {
      cached: journal,
      answer: (prompt) => `new: ${prompt}`,
    })
    await second.done
    expect(result(second.run)).toEqual(["done: alpha", "done: beta done: alpha", "new: gamma"])
    expect(second.spawned).toEqual(["gamma"])
  })

  test("does not cache an agent that failed", async () => {
    const journal = []
    const first = start("await parallel([() => agent('ok'), () => agent('bad')])", {
      journal: (entry) => journal.push(entry),
      answer: (prompt) => {
        if (prompt === "bad") throw new Error("down")
        return prompt
      },
    })
    await first.done
    expect(journal).toHaveLength(1)

    const second = start("await parallel([() => agent('ok'), () => agent('bad')])", { cached: journal })
    await second.done
    expect(second.spawned).toEqual(["bad"])
  })
})

describe("workflow()", () => {
  const saved = META.replace("test-flow", "child") + "phase('Inner')\nreturn await agent('inner ' + args.n)"

  test("runs a saved workflow as one step, with its agents in a group of their own", async () => {
    const { run, done } = start("const r = await workflow('child', { n: 7 })\nreturn r", {
      resolve: async (ref) => {
        expect(ref).toBe("child")
        return { source: saved }
      },
    })
    await done
    expect(result(run)).toBe("done: inner 7")
    expect(run.agents.map((agent) => agent.phase)).toEqual(["child: Inner"])
  })

  test("does not nest twice", async () => {
    const { run, done } = start("return await workflow('child', {})", {
      resolve: async () => ({ source: META.replace("test-flow", "child") + "return await workflow('again')" }),
    })
    await done
    expect(run.status).toBe("failed")
    expect(run.error).toContain("nesting is one level only")
  })
})

describe("shorten", () => {
  // Catches the rows of a stored run that show an agent's raw JSON result and full prompt, where a live run shows
  // previews.
  test("turns a stored agent into the row that a live run shows", () => {
    const stored = {
      id: "a1",
      label: "find:src/cart.js",
      status: "done",
      prompt: "x".repeat(400),
      result: JSON.stringify({ findings: [{ line: 3 }, { line: 8 }], file: "src/cart.js" }),
      schema: { type: "object" },
      tokens: { input: 1, output: 2, reasoning: 0, cache: { read: 0, write: 0 } },
    }

    expect(shorten(stored)).toEqual({
      id: "a1",
      label: "find:src/cart.js",
      status: "done",
      prompt: `${"x".repeat(299)}…`,
      result: "findings: 2 items · file: src/cart.js",
      tokens: { input: 1, output: 2, reasoning: 0, cache: { read: 0, write: 0 } },
    })
  })
})
