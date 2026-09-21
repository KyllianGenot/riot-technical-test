import { canonicalizeJson } from '../json/canonicalize-json.js';
import type { JsonValue } from '../json/json-types.js';
import type { SignatureAlgorithm } from './signature-algorithm.js';

export function signPayload(
  payload: JsonValue,
  algorithm: SignatureAlgorithm,
): string {
  return algorithm.sign(serializeForSigning(payload));
}

export function verifyPayloadSignature(
  payload: JsonValue,
  signature: string,
  algorithm: SignatureAlgorithm,
): boolean {
  return algorithm.verify(serializeForSigning(payload), signature);
}

function serializeForSigning(payload: JsonValue): string {
  return JSON.stringify(canonicalizeJson(payload));
}
