import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

const app = createApp({ hmacSecret: 'test-secret' });

const postJson = (path: string, body: unknown) =>
  request(app)
    .post(path)
    .send(body as object);

const postRaw = (path: string, rawBody: string) =>
  request(app).post(path).set('Content-Type', 'application/json').send(rawBody);

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

describe('POST /encrypt', () => {
  it('encrypts every top-level value and keeps the keys', async () => {
    const response = await postJson('/encrypt', {
      name: 'John Doe',
      age: 30,
      contact: { email: 'john@example.com', phone: '123-456-7890' },
    });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body)).toEqual(['name', 'age', 'contact']);
    for (const value of Object.values(response.body)) {
      expect(value).toMatch(BASE64_PATTERN);
    }
  });
});

describe('POST /decrypt', () => {
  it('decrypts values produced by /encrypt', async () => {
    const response = await postJson('/decrypt', {
      name: 'ZW5jOiJKb2huIERvZSI=',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'John Doe' });
  });

  it('leaves plain properties unchanged next to encrypted ones', async () => {
    const response = await postJson('/decrypt', {
      name: 'ZW5jOiJKb2huIERvZSI=',
      birth_date: '1998-11-19',
    });

    expect(response.body).toEqual({
      name: 'John Doe',
      birth_date: '1998-11-19',
    });
  });
});

describe('POST /encrypt then POST /decrypt', () => {
  it('restores the original payload', async () => {
    const payload = {
      name: 'John Doe',
      age: 30,
      active: true,
      manager: null,
      contact: { email: 'john@example.com', phone: '123-456-7890' },
      tags: ['a', 'b'],
    };

    const encrypted = await postJson('/encrypt', payload);
    const decrypted = await postJson('/decrypt', encrypted.body);

    expect(decrypted.body).toEqual(payload);
  });
});

describe('POST /sign', () => {
  it('returns a hexadecimal signature', async () => {
    const response = await postJson('/sign', {
      message: 'Hello World',
      timestamp: 1616161616,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      signature: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });

  it('returns the same signature when keys are reordered', async () => {
    const first = await postJson('/sign', {
      message: 'Hello World',
      timestamp: 1616161616,
    });
    const second = await postJson('/sign', {
      timestamp: 1616161616,
      message: 'Hello World',
    });

    expect(first.body.signature).toBe(second.body.signature);
  });
});

describe('POST /verify', () => {
  const data = { message: 'Hello World', timestamp: 1616161616 };

  const signatureOf = async (payload: unknown): Promise<string> => {
    const response = await postJson('/sign', payload);
    return response.body.signature as string;
  };

  it('returns 204 with an empty body for a signature produced by /sign', async () => {
    const response = await postJson('/verify', {
      signature: await signatureOf(data),
      data,
    });

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  it('accepts the signature when the data keys are reordered', async () => {
    const response = await postJson('/verify', {
      signature: await signatureOf(data),
      data: { timestamp: 1616161616, message: 'Hello World' },
    });

    expect(response.status).toBe(204);
  });

  it('returns 400 for a tampered payload', async () => {
    const response = await postJson('/verify', {
      signature: await signatureOf(data),
      data: { ...data, message: 'Goodbye World' },
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid signature' });
  });

  it('returns 400 for a tampered signature', async () => {
    const signature = await signatureOf(data);
    const tampered =
      signature.slice(0, -1) + (signature.endsWith('0') ? '1' : '0');

    const response = await postJson('/verify', { signature: tampered, data });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid signature' });
  });

  it('returns 400 when signature is not a string', async () => {
    const response = await postJson('/verify', { signature: 123, data });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'signature must be a string' });
  });

  it('returns 400 when signature is missing', async () => {
    const response = await postJson('/verify', { data });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'signature must be a string' });
  });

  it.each([
    ['missing', undefined],
    ['null', null],
    ['an array', [1, 2]],
    ['a string', 'text'],
  ])('returns 400 when data is %s', async (_case, data) => {
    const response = await postJson('/verify', { signature: 'abcd', data });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'data must be a JSON object' });
  });
});

describe.each(['/encrypt', '/decrypt', '/sign', '/verify'])(
  'POST %s with an invalid root body',
  (path) => {
    it.each([
      ['null', 'null'],
      ['an array', '[1, 2]'],
      ['a string', '"text"'],
      ['a number', '42'],
      ['a boolean', 'true'],
    ])('returns 400 when the body is %s', async (_case, rawBody) => {
      const response = await postRaw(path, rawBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Request body must be a JSON object',
      });
    });

    it('returns 400 when the body is not JSON at all', async () => {
      const response = await request(app)
        .post(path)
        .set('Content-Type', 'text/plain')
        .send('hello');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Request body must be a JSON object',
      });
    });

    it('returns a JSON 400 for malformed JSON', async () => {
      const response = await postRaw(path, '{"broken"');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Request body must be valid JSON',
      });
    });
  },
);
