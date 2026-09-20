# Riot take-home API

Node.js + TypeScript + Express HTTP API with four JSON endpoints: `POST /encrypt`, `POST /decrypt`, `POST /sign` and `POST /verify`. Encryption is Base64, as the challenge requires, and signatures are HMAC-SHA256. Both mechanisms sit behind small interfaces so a different algorithm can be dropped in without touching the payload logic or the HTTP layer.

## Requirements

- Node.js 22.13 or newer (developed and verified on Node 24)
- npm

## Setup

```sh
npm ci
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value into `.env` as `HMAC_SECRET`, then start the API:

```sh
npm run dev
```

It listens on `http://localhost:3000` (`PORT` overrides this). Startup fails with an explicit error when `HMAC_SECRET` is missing or empty: there is no default secret and none is generated on the fly.

## Commands

| Command                | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Start with reload on file changes (`.env` is loaded if present) |
| `npm run build`        | Compile TypeScript to `dist/`                                   |
| `npm start`            | Run the compiled API from `dist/` (run `build` first)           |
| `npm run typecheck`    | Type-check without emitting                                     |
| `npm run lint`         | ESLint                                                          |
| `npm run format`       | Format with Prettier                                            |
| `npm run format:check` | Verify formatting                                               |
| `npm test`             | Unit and HTTP integration tests (Vitest)                        |

## API

Send `Content-Type: application/json`. Every endpoint returns JSON, except a successful `/verify`, which returns `204 No Content` with an empty body.

### POST /encrypt

Encrypts every top-level property value. A nested object or array is encrypted as one value.

```json
{
  "name": "John Doe",
  "age": 30,
  "contact": { "email": "john@example.com", "phone": "123-456-7890" }
}
```

Response `200`:

```json
{
  "name": "ZW5jOiJKb2huIERvZSI=",
  "age": "ZW5jOjMw",
  "contact": "ZW5jOnsiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicGhvbmUiOiIxMjMtNDU2LTc4OTAifQ=="
}
```

### POST /decrypt

Restores every top-level value produced by `/encrypt`, with its original JSON type, and leaves every other value unchanged.

```json
{ "name": "ZW5jOiJKb2huIERvZSI=", "birth_date": "1998-11-19" }
```

Response `200`:

```json
{ "name": "John Doe", "birth_date": "1998-11-19" }
```

### POST /sign

Returns the HMAC-SHA256 signature of the whole payload as lowercase hexadecimal. Property order does not change the result; array order does.

```json
{ "message": "Hello World", "timestamp": 1616161616 }
```

Response `200`:

```json
{ "signature": "<64-character hexadecimal signature>" }
```

### POST /verify

`signature` is the value returned by `/sign` for the same logical payload.

```json
{
  "signature": "<signature returned by /sign>",
  "data": { "timestamp": 1616161616, "message": "Hello World" }
}
```

- Signature matches `data`: `204 No Content`. The signature of the `/sign` example above verifies here even though the keys are in a different order.
- Signature does not match, or is not hexadecimal: `400` with `{ "error": "Invalid signature" }`.

### Validation errors

Rejected requests return `400` with `{ "error": "<message>" }`:

| Case                                                                                               | Message                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Body is not a JSON object: `null`, array, string, number, boolean, or the content type is not JSON | `Request body must be a JSON object` |
| Body cannot be parsed as JSON                                                                      | `Request body must be valid JSON`    |
| `/verify` without a string `signature`                                                             | `signature must be a string`         |
| `/verify` without an object `data`                                                                 | `data must be a JSON object`         |

## Design decisions

```
src/
  app.ts        composition root: JSON parser, concrete algorithms, routes
  server.ts     reads the environment and starts listening
  config/       environment loading with fail-fast validation
  routes/       the four HTTP handlers
  encryption/   EncryptionAlgorithm, Base64 implementation, payload-encryption
  signature/    SignatureAlgorithm, HMAC implementation, payload-signature
  json/         JSON value types and canonicalization
```

- **Root payloads are JSON objects.** The challenge defines its operations around top-level properties and all provided payload examples are objects, so the API deliberately accepts JSON objects at the root and rejects `null`, arrays and primitives with a `400`.
- **Algorithms sit behind two interfaces.** `EncryptionAlgorithm` and `SignatureAlgorithm` each have one concrete implementation, passed down as plain parameters. Concrete algorithms are selected in `app.ts`; replacing one does not require changes to the payload logic or HTTP routes. There is no factory or dependency-injection container because the current scope does not justify one.
- **The Base64 implementation only transforms strings.** JSON serialization, depth-1 traversal and protocol detection all live in `payload-encryption.ts`, so a replacement algorithm inherits them unchanged.
- **Encrypted values carry a marker.** Each value is `JSON.stringify`'d, prefixed with `enc:`, then Base64 encoded. On decryption the marker tells this API's values apart from ordinary strings that happen to be valid Base64, and `JSON.parse` restores the original type: a number comes back as a number, an object as an object. Values without the marker, or with unparsable content after it, are returned untouched.
- **Signing canonicalizes before hashing.** Object keys are sorted recursively, arrays keep their order because it is semantically meaningful, and the result is `JSON.stringify`'d before HMAC. Two payloads with the same logical content therefore produce the same signature regardless of property order at any depth.
- **HMAC-SHA256 with a secret from the environment.** `HMAC_SECRET` is mandatory, read once at startup, never hardcoded and never generated silently.
- **Verification is deliberate.** The supplied signature must be hexadecimal, is decoded to bytes, rejected on length mismatch, then compared with `crypto.timingSafeEqual`. Plain string equality is never used.
- **HTTP handlers stay thin.** Each one validates the body, calls the payload function and maps the result to a status code. Validation is a few explicit checks rather than a schema library because the request contracts are tiny.

## Trade-offs and limitations

- Base64 is an encoding, not encryption: anyone can decode the output. It is used because the challenge explicitly asks for it; the interface exists so a real cipher can replace it.
- The `enc:` marker identifies values produced by this API. It is not an authentication mechanism: a string that happens to be the Base64 of `enc:` followed by valid JSON is decoded like any other.
- Canonicalization is deterministic for this API but is not intended to implement a formal standard such as RFC 8785.
- Validation is intentionally small and manual because the request contracts are tiny.

## Testing

`npm test` runs Vitest. Unit tests sit next to the module they cover: Base64 transformation, payload encryption round trips and marker detection, canonicalization, HMAC signing and hexadecimal handling, payload signing and verification, and environment loading. HTTP integration tests in `src/routes/crypto-routes.test.ts` drive the composed app through supertest and check status codes, response bodies and the error contract for all four endpoints.
