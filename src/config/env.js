/**
 * PhoneGuard API - Environment & Service Configuration
 */

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  rapidApiProxySecret: process.env.RAPIDAPI_PROXY_SECRET || null,
  service: {
    name: 'PhoneGuard API',
    version: '1.0.0',
    description: 'High-performance in-memory international phone validation, E.164 formatting, line type detection, timezone lookup, and SMS fraud risk scoring.',
    docsUrl: 'https://rapidapi.com/phoneguard/api/phoneguard-api'
  },
  batch: {
    maxBatchSize: 50
  }
};
