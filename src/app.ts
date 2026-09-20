import express, { type ErrorRequestHandler, type Express } from 'express';

import { Base64EncryptionAlgorithm } from './encryption/base64-encryption-algorithm.js';
import { createCryptoRoutes } from './routes/crypto-routes.js';
import { HmacSignatureAlgorithm } from './signature/hmac-signature-algorithm.js';

export interface AppConfig {
  hmacSecret: string;
}

export function createApp(config: AppConfig): Express {
  const app = express();
  // strict: false lets root primitives reach our own validation, so every
  // rejected body gets the same JSON error contract.
  app.use(express.json({ strict: false }));
  app.use(
    createCryptoRoutes(
      new Base64EncryptionAlgorithm(),
      new HmacSignatureAlgorithm(config.hmacSecret),
    ),
  );
  app.use(respondToMalformedJson);
  return app;
}

const respondToMalformedJson: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (!isJsonParseError(error)) {
    next(error);
    return;
  }
  res.status(400).json({ error: 'Request body must be valid JSON' });
};

function isJsonParseError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  );
}
