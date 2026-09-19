export interface EncryptionAlgorithm {
  encrypt(plaintext: string): string;
  // May throw on input that encrypt did not produce.
  decrypt(encrypted: string): string;
}
