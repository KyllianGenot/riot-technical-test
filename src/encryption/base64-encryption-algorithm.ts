import type { EncryptionAlgorithm } from './encryption-algorithm.js';

export class Base64EncryptionAlgorithm implements EncryptionAlgorithm {
  encrypt(plaintext: string): string {
    return Buffer.from(plaintext, 'utf8').toString('base64');
  }

  // No strict validation: recognising our values is the payload layer's job.
  decrypt(encrypted: string): string {
    return Buffer.from(encrypted, 'base64').toString('utf8');
  }
}
