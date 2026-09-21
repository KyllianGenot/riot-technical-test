import { Router, type Response } from 'express';

import type { EncryptionAlgorithm } from '../encryption/encryption-algorithm.js';
import {
  decryptPayload,
  encryptPayload,
} from '../encryption/payload-encryption.js';
import { isJsonObject, isJsonValue } from '../json/json-types.js';
import {
  signPayload,
  verifyPayloadSignature,
} from '../signature/payload-signature.js';
import type { SignatureAlgorithm } from '../signature/signature-algorithm.js';

export function createCryptoRoutes(
  encryptionAlgorithm: EncryptionAlgorithm,
  signatureAlgorithm: SignatureAlgorithm,
): Router {
  const router = Router();

  router.post('/encrypt', (req, res) => {
    const body: unknown = req.body;
    if (!isJsonObject(body)) {
      badRequest(res, 'Request body must be a JSON object');
      return;
    }
    res.json(encryptPayload(body, encryptionAlgorithm));
  });

  router.post('/decrypt', (req, res) => {
    const body: unknown = req.body;
    if (!isJsonObject(body)) {
      badRequest(res, 'Request body must be a JSON object');
      return;
    }
    res.json(decryptPayload(body, encryptionAlgorithm));
  });

  router.post('/sign', (req, res) => {
    const body: unknown = req.body;
    if (!isJsonValue(body)) {
      badRequest(res, 'Request body must be a JSON value');
      return;
    }
    res.json({ signature: signPayload(body, signatureAlgorithm) });
  });

  router.post('/verify', (req, res) => {
    const body: unknown = req.body;
    if (!isJsonObject(body)) {
      badRequest(res, 'Request body must be a JSON object');
      return;
    }
    const { signature, data } = body;
    if (typeof signature !== 'string') {
      badRequest(res, 'signature must be a string');
      return;
    }
    // Any JSON value is signable, including null; only absence is an error.
    if (!Object.hasOwn(body, 'data')) {
      badRequest(res, 'data is required');
      return;
    }
    if (!verifyPayloadSignature(data, signature, signatureAlgorithm)) {
      badRequest(res, 'Invalid signature');
      return;
    }
    res.status(204).end();
  });

  return router;
}

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}
