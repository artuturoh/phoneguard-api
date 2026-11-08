/**
 * PhoneGuard API - Server Entrypoint
 * Compatible with standalone Node.js and Vercel Serverless (@vercel/node).
 */

import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

let server = null;

// Only bind to port when running outside of Vercel Serverless environment
if (!process.env.VERCEL) {
  server = app.listen(config.port, () => {
    const proxyProtection = process.env.RAPIDAPI_PROXY_SECRET
      ? 'ENABLED (X-RapidAPI-Proxy-Secret enforced)'
      : 'DISABLED (Public / Dev Mode)';

    console.log(`
===========================================================
  🛡️  PhoneGuard API - Microservice Operational
===========================================================
  Port:               ${config.port}
  Environment:        ${config.nodeEnv}
  RapidAPI Auth:      ${proxyProtection}
  Health Check:       http://localhost:${config.port}/health
  Documentation:      http://localhost:${config.port}/
===========================================================
  Ready for high-throughput, sub-5ms phone intelligence.
===========================================================
    `);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down PhoneGuard API...`);
    if (server) {
      server.close(() => {
        console.log('HTTP server closed. Exiting process.');
        process.exit(0);
      });

      // Force shutdown after 5 seconds if lingering connections exist
      setTimeout(() => {
        console.error('Forced shutdown due to timeout.');
        process.exit(1);
      }, 5000).unref();
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

export default app;
