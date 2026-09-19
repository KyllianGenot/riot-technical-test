const DEFAULT_PORT = 3000;

export interface Env {
  port: number;
  hmacSecret: string;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return { port: readPort(source), hmacSecret: readHmacSecret(source) };
}

function readPort(source: NodeJS.ProcessEnv): number {
  const raw = source.PORT;
  if (raw === undefined || raw === '') {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `PORT must be an integer between 1 and 65535, received "${raw}"`,
    );
  }
  return port;
}

function readHmacSecret(source: NodeJS.ProcessEnv): string {
  const secret = source.HMAC_SECRET;
  if (secret === undefined || secret === '') {
    throw new Error(
      'HMAC_SECRET must be set to a non-empty value (see .env.example)',
    );
  }
  return secret;
}
