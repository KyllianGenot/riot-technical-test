import { createApp } from './app.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const app = createApp({ hmacSecret: env.hmacSecret });

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
