import { describe, expect, it } from 'vitest';

import { Base64EncryptionAlgorithm } from './base64-encryption-algorithm.js';

describe('Base64EncryptionAlgorithm', () => {
  const algorithm = new Base64EncryptionAlgorithm();

  it('encrypts to the standard Base64 representation', () => {
    expect(algorithm.encrypt('hello')).toBe('aGVsbG8=');
  });

  it('decrypts back to the original string, including non-ASCII characters', () => {
    const plaintext = 'héllo wörld 🌍';

    expect(algorithm.decrypt(algorithm.encrypt(plaintext))).toBe(plaintext);
  });

  it('does not throw on input that is not Base64', () => {
    expect(() => algorithm.decrypt('not base64!!')).not.toThrow();
  });
});
