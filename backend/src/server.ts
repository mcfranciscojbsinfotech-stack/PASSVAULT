import { buildApp } from './app.js';
import { CONFIG } from './config/env.js';
import { provisionFirstAdmin } from './utils/seed.js';

async function startServer() {
  const app = buildApp();

  try {
    // Provision administrator if database is clean
    await provisionFirstAdmin();

    await app.listen({ port: CONFIG.PORT, host: CONFIG.HOST });
    console.log(`\n======================================================`);
    console.log(` PassVault REST API is running at:`);
    console.log(` http://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(` Health check: http://${CONFIG.HOST}:${CONFIG.PORT}/api/health`);
    console.log(`======================================================\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
