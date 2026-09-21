import { describe, expect, it } from 'vitest';

import type { JsonValue } from '../json/json-types.js';
import { HmacSignatureAlgorithm } from './hmac-signature-algorithm.js';
import { signPayload, verifyPayloadSignature } from './payload-signature.js';

const algorithm = new HmacSignatureAlgorithm('test-secret');

describe('signPayload', () => {
  it('returns a hexadecimal signature', () => {
    expect(signPayload({ message: 'Hello World' }, algorithm)).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  it('ignores root property order', () => {
    const first = signPayload(
      { message: 'Hello World', timestamp: 1616161616 },
      algorithm,
    );
    const second = signPayload(
      { timestamp: 1616161616, message: 'Hello World' },
      algorithm,
    );

    expect(first).toBe(second);
  });

  it('ignores nested property order', () => {
    const first = signPayload(
      { contact: { email: 'a@b.c', phone: '1' } },
      algorithm,
    );
    const second = signPayload(
      { contact: { phone: '1', email: 'a@b.c' } },
      algorithm,
    );

    expect(first).toBe(second);
  });

  it('changes when a value changes', () => {
    const original = signPayload({ message: 'Hello World' }, algorithm);
    const modified = signPayload({ message: 'Goodbye World' }, algorithm);

    expect(modified).not.toBe(original);
  });

  it('changes when array order changes', () => {
    const original = signPayload({ tags: ['a', 'b'] }, algorithm);
    const reordered = signPayload({ tags: ['b', 'a'] }, algorithm);

    expect(reordered).not.toBe(original);
  });
});

describe('signPayload with a non-object root', () => {
  it.each<[string, JsonValue]>([
    ['an array', ['a', { b: 1 }]],
    ['a string', 'hello'],
    ['a number', 42],
    ['a boolean', true],
    ['null', null],
  ])('signs %s and verifies the result', (_case, value) => {
    const signature = signPayload(value, algorithm);

    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyPayloadSignature(value, signature, algorithm)).toBe(true);
  });

  it('keeps root array order significant', () => {
    expect(signPayload(['a', 'b'], algorithm)).not.toBe(
      signPayload(['b', 'a'], algorithm),
    );
  });

  it('ignores property order of objects inside a root array', () => {
    expect(signPayload([{ b: 1, a: 2 }], algorithm)).toBe(
      signPayload([{ a: 2, b: 1 }], algorithm),
    );
  });
});

describe('verifyPayloadSignature', () => {
  const payload = { message: 'Hello World', timestamp: 1616161616 };
  const signature = signPayload(payload, algorithm);

  it('accepts a valid signature', () => {
    expect(verifyPayloadSignature(payload, signature, algorithm)).toBe(true);
  });

  it('accepts a valid signature when the payload keys are reordered', () => {
    const reordered = { timestamp: 1616161616, message: 'Hello World' };

    expect(verifyPayloadSignature(reordered, signature, algorithm)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const tampered = { ...payload, message: 'Goodbye World' };

    expect(verifyPayloadSignature(tampered, signature, algorithm)).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const tampered =
      signature.slice(0, -1) + (signature.endsWith('0') ? '1' : '0');

    expect(verifyPayloadSignature(payload, tampered, algorithm)).toBe(false);
  });

  it('rejects a malformed hexadecimal signature without throwing', () => {
    expect(verifyPayloadSignature(payload, 'not-hex!', algorithm)).toBe(false);
  });
});
