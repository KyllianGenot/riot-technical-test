import { describe, expect, it } from 'vitest';

import { HmacSignatureAlgorithm } from './hmac-signature-algorithm.js';

describe('HmacSignatureAlgorithm', () => {
  const algorithm = new HmacSignatureAlgorithm('key');
  const message = 'The quick brown fox jumps over the lazy dog';

  it('computes the reference HMAC-SHA256 hexadecimal digest', () => {
    expect(algorithm.sign(message)).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    );
  });

  it('produces a different signature with a different secret', () => {
    const otherAlgorithm = new HmacSignatureAlgorithm('other-key');

    expect(otherAlgorithm.sign(message)).not.toBe(algorithm.sign(message));
  });

  it('verifies a signature it produced', () => {
    expect(algorithm.verify(message, algorithm.sign(message))).toBe(true);
  });

  it('verifies a signature written in uppercase hexadecimal', () => {
    const uppercase = algorithm.sign(message).toUpperCase();

    expect(algorithm.verify(message, uppercase)).toBe(true);
  });

  it('rejects a signature for a different message', () => {
    expect(algorithm.verify('another message', algorithm.sign(message))).toBe(
      false,
    );
  });

  it('rejects a signature with one altered character', () => {
    const signature = algorithm.sign(message);
    const altered = (signature[0] === '0' ? '1' : '0') + signature.slice(1);

    expect(algorithm.verify(message, altered)).toBe(false);
  });

  it.each([
    ['non-hexadecimal characters', 'not-a-hex-signature'],
    ['an odd number of digits', 'abc'],
    ['an empty string', ''],
    ['valid hexadecimal of the wrong length', 'abcd'],
  ])('rejects %s without throwing', (_case, signature) => {
    expect(algorithm.verify(message, signature)).toBe(false);
  });
});
