import { describe, expect, it } from 'vitest';

import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('loads HMAC_SECRET and defaults PORT to 3000', () => {
    expect(loadEnv({ HMAC_SECRET: 'test-secret' })).toEqual({
      port: 3000,
      hmacSecret: 'test-secret',
    });
  });

  it('defaults PORT to 3000 when PORT is an empty string', () => {
    expect(loadEnv({ HMAC_SECRET: 'test-secret', PORT: '' }).port).toBe(3000);
  });

  it('loads an explicit PORT', () => {
    expect(loadEnv({ HMAC_SECRET: 'test-secret', PORT: '8080' }).port).toBe(
      8080,
    );
  });

  it.each([['0'], ['65536'], ['abc'], ['80.5']])(
    'rejects PORT "%s"',
    (port) => {
      expect(() => loadEnv({ HMAC_SECRET: 'test-secret', PORT: port })).toThrow(
        /PORT must be an integer between 1 and 65535/,
      );
    },
  );

  it('fails when HMAC_SECRET is missing', () => {
    expect(() => loadEnv({})).toThrow(/HMAC_SECRET must be set/);
  });

  it('fails when HMAC_SECRET is empty', () => {
    expect(() => loadEnv({ HMAC_SECRET: '' })).toThrow(
      /HMAC_SECRET must be set/,
    );
  });
});
