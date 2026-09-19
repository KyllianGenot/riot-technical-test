import type { JsonValue } from './json-types.js';

export function canonicalizeJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJson);
  }
  if (typeof value === 'object' && value !== null) {
    // Default sort compares UTF-16 code units: deterministic and locale-independent.
    const sortedKeys = Object.keys(value).sort();
    return Object.fromEntries(
      sortedKeys.map((key) => [key, canonicalizeJson(value[key])]),
    );
  }
  return value;
}
