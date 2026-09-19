import type { JsonObject, JsonValue } from '../json/json-types.js';
import type { EncryptionAlgorithm } from './encryption-algorithm.js';

// Lets decryption tell our values apart from ordinary strings that also decode.
const ENCRYPTED_VALUE_MARKER = 'enc:';

export function encryptPayload(
  payload: JsonObject,
  algorithm: EncryptionAlgorithm,
): JsonObject {
  return mapTopLevelValues(payload, (value) => encryptValue(value, algorithm));
}

export function decryptPayload(
  payload: JsonObject,
  algorithm: EncryptionAlgorithm,
): JsonObject {
  return mapTopLevelValues(payload, (value) => decryptValue(value, algorithm));
}

function encryptValue(
  value: JsonValue,
  algorithm: EncryptionAlgorithm,
): string {
  return algorithm.encrypt(ENCRYPTED_VALUE_MARKER + JSON.stringify(value));
}

function decryptValue(
  value: JsonValue,
  algorithm: EncryptionAlgorithm,
): JsonValue {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    const decrypted = algorithm.decrypt(value);
    if (!decrypted.startsWith(ENCRYPTED_VALUE_MARKER)) {
      return value;
    }
    return JSON.parse(
      decrypted.slice(ENCRYPTED_VALUE_MARKER.length),
    ) as JsonValue;
  } catch {
    // Not produced by encryptValue, so it is not ours to transform.
    return value;
  }
}

function mapTopLevelValues(
  payload: JsonObject,
  transform: (value: JsonValue) => JsonValue,
): JsonObject {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, transform(value)]),
  );
}
