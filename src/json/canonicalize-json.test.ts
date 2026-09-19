import { describe, expect, it } from 'vitest';

import { canonicalizeJson } from './canonicalize-json.js';

describe('canonicalizeJson', () => {
  it('sorts root keys so that property order no longer matters', () => {
    const first = canonicalizeJson({ b: 1, a: 2 });
    const second = canonicalizeJson({ a: 2, b: 1 });

    expect(JSON.stringify(first)).toBe('{"a":2,"b":1}');
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('sorts nested object keys recursively', () => {
    const first = canonicalizeJson({ outer: { z: 1, y: { b: 2, a: 3 } } });
    const second = canonicalizeJson({ outer: { y: { a: 3, b: 2 }, z: 1 } });

    expect(JSON.stringify(first)).toBe('{"outer":{"y":{"a":3,"b":2},"z":1}}');
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('preserves array element order', () => {
    expect(canonicalizeJson([3, 1, 2])).toEqual([3, 1, 2]);
  });

  it('canonicalizes objects inside arrays', () => {
    const canonical = canonicalizeJson([{ b: 1, a: 2 }]);

    expect(JSON.stringify(canonical)).toBe('[{"a":2,"b":1}]');
  });

  it.each([
    ['string', 'text'],
    ['number', 42],
    ['boolean', true],
    ['null', null],
  ])('leaves a %s primitive unchanged', (_type, value) => {
    expect(canonicalizeJson(value)).toBe(value);
  });

  it('serializes integer-like keys identically regardless of input order', () => {
    const first = canonicalizeJson({ '10': 'a', '9': 'b', name: 'c' });
    const second = canonicalizeJson({ name: 'c', '9': 'b', '10': 'a' });

    // JavaScript enumerates integer-like keys numerically before other keys.
    expect(JSON.stringify(first)).toBe('{"9":"b","10":"a","name":"c"}');
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
