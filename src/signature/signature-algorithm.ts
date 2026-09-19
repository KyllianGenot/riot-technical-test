export interface SignatureAlgorithm {
  sign(message: string): string;
  verify(message: string, signature: string): boolean;
}
