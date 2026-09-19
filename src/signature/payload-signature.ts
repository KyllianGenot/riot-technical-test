import { canonicalizeJson } from '../json/canonicalize-json.js';
import type { JsonObject } from '../json/json-types.js';
import type { SignatureAlgorithm } from './signature-algorithm.js';

export function signPayload(
  payload: JsonObject,
  algorithm: SignatureAlgorithm,
): string {
  return algorithm.sign(serializeForSigning(payload));
}

export function verifyPayloadSignature(
  payload: JsonObject,
  signature: string,
  algorithm: SignatureAlgorithm,
): boolean {
  return algorithm.verify(serializeForSigning(payload), signature);
}

function serializeForSigning(payload: JsonObject): string {
  return JSON.stringify(canonicalizeJson(payload));
}
