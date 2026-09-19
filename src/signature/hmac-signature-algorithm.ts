import { createHmac, timingSafeEqual } from 'node:crypto';

import type { SignatureAlgorithm } from './signature-algorithm.js';

// Node's hex decoder silently drops invalid characters and odd trailing digits,
// so the format is checked before decoding. Either letter case is valid hex.
const HEX_BYTES_PATTERN = /^(?:[0-9a-f]{2})+$/i;

export class HmacSignatureAlgorithm implements SignatureAlgorithm {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  sign(message: string): string {
    return createHmac('sha256', this.secret).update(message).digest('hex');
  }

  verify(message: string, signature: string): boolean {
    if (!HEX_BYTES_PATTERN.test(signature)) {
      return false;
    }
    const expected = Buffer.from(this.sign(message), 'hex');
    const provided = Buffer.from(signature, 'hex');
    if (expected.length !== provided.length) {
      return false;
    }
    return timingSafeEqual(expected, provided);
  }
}
