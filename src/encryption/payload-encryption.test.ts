import { describe, expect, it } from 'vitest';

import type { JsonObject } from '../json/json-types.js';
import { Base64EncryptionAlgorithm } from './base64-encryption-algorithm.js';
import type { EncryptionAlgorithm } from './encryption-algorithm.js';
import { decryptPayload, encryptPayload } from './payload-encryption.js';

const algorithm = new Base64EncryptionAlgorithm();
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

describe('encryptPayload', () => {
  it('encrypts every top-level value into a Base64 string and keeps the keys', () => {
    const payload = {
      name: 'John Doe',
      age: 30,
      contact: { email: 'john@example.com', phone: '123-456-7890' },
    };

    const encrypted = encryptPayload(payload, algorithm);

    expect(Object.keys(encrypted)).toEqual(['name', 'age', 'contact']);
    for (const value of Object.values(encrypted)) {
      expect(value).toMatch(BASE64_PATTERN);
    }
  });

  it('encrypts a nested object as one depth-1 value, not field by field', () => {
    const encrypted = encryptPayload(
      { contact: { email: 'john@example.com', phone: '123-456-7890' } },
      algorithm,
    );

    expect(typeof encrypted.contact).toBe('string');
    expect(algorithm.decrypt(encrypted.contact as string)).toBe(
      'enc:{"email":"john@example.com","phone":"123-456-7890"}',
    );
  });

  it('produces the documented protocol for a string value', () => {
    expect(encryptPayload({ name: 'John Doe' }, algorithm)).toEqual({
      name: 'ZW5jOiJKb2huIERvZSI=',
    });
  });
});

describe('encryptPayload followed by decryptPayload', () => {
  it.each<[string, JsonObject]>([
    ['string', { value: 'John Doe' }],
    ['empty string', { value: '' }],
    ['number', { value: 30 }],
    ['boolean', { value: true }],
    ['null', { value: null }],
    ['object', { value: { email: 'john@example.com', nested: { deep: 1 } } }],
    ['array', { value: [1, 'two', null, { three: 3 }] }],
  ])('restores the %s property with its original type', (_type, payload) => {
    const roundTrip = decryptPayload(
      encryptPayload(payload, algorithm),
      algorithm,
    );

    expect(roundTrip).toEqual(payload);
    expect(typeof roundTrip.value).toBe(typeof payload.value);
  });

  it('restores a payload with several properties of mixed types', () => {
    const payload: JsonObject = {
      name: 'John Doe',
      age: 30,
      active: false,
      manager: null,
      contact: { email: 'john@example.com', phone: '123-456-7890' },
      tags: ['a', 'b'],
    };

    expect(
      decryptPayload(encryptPayload(payload, algorithm), algorithm),
    ).toEqual(payload);
  });
});

describe('decryptPayload', () => {
  it('leaves a plain, unencrypted string unchanged', () => {
    expect(decryptPayload({ birth_date: '1998-11-19' }, algorithm)).toEqual({
      birth_date: '1998-11-19',
    });
  });

  it('leaves a plain string that starts with enc: unchanged', () => {
    expect(decryptPayload({ value: 'enc:hello' }, algorithm)).toEqual({
      value: 'enc:hello',
    });
  });

  it('leaves a valid Base64 string without the enc: marker unchanged', () => {
    const base64OfHelloWorld = 'aGVsbG8gd29ybGQ=';

    expect(decryptPayload({ value: base64OfHelloWorld }, algorithm)).toEqual({
      value: base64OfHelloWorld,
    });
  });

  it('leaves a value with the enc: marker but unparsable JSON unchanged', () => {
    const base64OfEncNotJson = 'ZW5jOntub3QganNvbg==';

    expect(decryptPayload({ value: base64OfEncNotJson }, algorithm)).toEqual({
      value: base64OfEncNotJson,
    });
  });

  it('leaves non-string values unchanged', () => {
    const payload: JsonObject = {
      age: 30,
      active: true,
      manager: null,
      contact: { email: 'john@example.com' },
      tags: ['a'],
    };

    expect(decryptPayload(payload, algorithm)).toEqual(payload);
  });

  it('leaves the value unchanged when the algorithm cannot decrypt it', () => {
    const throwingAlgorithm: EncryptionAlgorithm = {
      encrypt: (plaintext) => plaintext,
      decrypt: () => {
        throw new Error('cannot decrypt');
      },
    };

    expect(decryptPayload({ value: 'anything' }, throwingAlgorithm)).toEqual({
      value: 'anything',
    });
  });

  it('decrypts only the encrypted values of a mixed payload', () => {
    const payload = {
      name: 'ZW5jOiJKb2huIERvZSI=',
      birth_date: '1998-11-19',
    };

    expect(decryptPayload(payload, algorithm)).toEqual({
      name: 'John Doe',
      birth_date: '1998-11-19',
    });
  });
});
