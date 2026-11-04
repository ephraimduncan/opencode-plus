// The part of JSON Schema that agent({ schema }) accepts: enough to describe structured output, small enough to check
// here without a library.

// Throws when `schema` cannot be an agent's output shape: the root must be an object whose required keys are all in its
// properties, and no level can require a key that `additionalProperties: false` rules out.
export function check(schema) {
  if (!object(schema) || schema.type !== "object" || !object(schema.properties))
    throw new Error("agent({ schema }): the schema needs `{ type: 'object', properties: { ... } }` at its root.")
  contradiction(schema, "", true)
}

function contradiction(schema, path, root = false) {
  if (!object(schema)) return

  const properties = object(schema.properties) ? schema.properties : {}

  if (root || schema.additionalProperties === false)
    for (const key of Array.isArray(schema.required) ? schema.required : [])
      if (!(key in properties))
        throw new Error(
          `agent({ schema }): \`${path || "/"}\` requires "${key}", which its properties rule out. Add it to properties or remove it from required.`,
        )

  for (const [key, child] of Object.entries(properties)) contradiction(child, `${path}/${key}`)
  if (object(schema.items)) contradiction(schema.items, `${path}/items`)
  for (const branch of [...(schema.anyOf ?? []), ...(schema.oneOf ?? [])]) contradiction(branch, path)
}

// The reasons `value` does not match `schema`, each with the path of the wrong part. Empty when it matches.
export function validate(schema, value, path = "") {
  if (!object(schema)) return []

  const at = path || "/"

  if ("const" in schema && !equal(schema.const, value)) return [`${at}: must be ${JSON.stringify(schema.const)}`]
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => equal(item, value)))
    return [`${at}: must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(", ")}`]

  for (const key of ["anyOf", "oneOf"]) {
    if (!Array.isArray(schema[key])) continue
    if (!schema[key].some((branch) => validate(branch, value, path).length === 0))
      return [`${at}: does not match any of the allowed shapes`]
  }

  const types = schema.type === undefined ? [] : [schema.type].flat()

  if (types.length > 0 && !types.some((type) => is(type, value)))
    return [`${at}: must be ${types.join(" or ")}, not ${kind(value)}`]

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength)
      return [`${at}: must have at least ${schema.minLength} characters`]
    if (schema.maxLength !== undefined && value.length > schema.maxLength)
      return [`${at}: must have at most ${schema.maxLength} characters`]
  }

  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) return [`${at}: must be at least ${schema.minimum}`]
    if (schema.maximum !== undefined && value > schema.maximum) return [`${at}: must be at most ${schema.maximum}`]
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      return [`${at}: must have at least ${schema.minItems} items`]
    if (schema.maxItems !== undefined && value.length > schema.maxItems)
      return [`${at}: must have at most ${schema.maxItems} items`]

    return object(schema.items) ? value.flatMap((item, index) => validate(schema.items, item, `${path}/${index}`)) : []
  }

  if (!object(value)) return []

  const properties = object(schema.properties) ? schema.properties : {}
  const missing = (schema.required ?? []).filter((key) => value[key] === undefined)

  if (missing.length > 0) return missing.map((key) => `${at}: missing required property "${key}"`)

  return Object.entries(value).flatMap(([key, item]) => {
    if (key in properties) return validate(properties[key], item, `${path}/${key}`)
    if (schema.additionalProperties === false) return [`${path}/${key}: is not an allowed property`]

    return object(schema.additionalProperties) ? validate(schema.additionalProperties, item, `${path}/${key}`) : []
  })
}

const object = (value) => typeof value === "object" && value !== null && !Array.isArray(value)

function is(type, value) {
  switch (type) {
    case "object":
      return object(value)
    case "array":
      return Array.isArray(value)
    case "integer":
      return Number.isInteger(value)
    case "number":
      return typeof value === "number" && Number.isFinite(value)
    case "null":
      return value === null
    default:
      return typeof value === type
  }
}

function kind(value) {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"

  return typeof value
}

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
