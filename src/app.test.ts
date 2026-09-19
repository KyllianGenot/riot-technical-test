import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from './app.js';

describe('createApp', () => {
  it('serves HTTP requests and rejects unknown routes', async () => {
    const response = await request(createApp()).post('/unknown').send({});

    expect(response.status).toBe(404);
  });
});
