/**
 * PhoneGuard API - RapidAPI Proxy Secret Verification Middleware
 * Ensures incoming requests to protected routes originate through RapidAPI proxy
 * when RAPIDAPI_PROXY_SECRET is configured.
 */

import { config } from '../config/env.js';

export function rapidApiAuth(req, res, next) {
  const expectedSecret = process.env.RAPIDAPI_PROXY_SECRET || config.rapidApiProxySecret;

  // If secret is not configured in this environment, allow request through (development/testing)
  if (!expectedSecret) {
    return next();
  }

  const incomingSecret = req.headers['x-rapidapi-proxy-secret'];

  if (!incomingSecret || incomingSecret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing X-RapidAPI-Proxy-Secret header'
      }
    });
  }

  next();
}

export default rapidApiAuth;
