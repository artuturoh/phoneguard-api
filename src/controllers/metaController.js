/**
 * PhoneGuard API - Meta & Health Controller
 * Handles root content negotiation and service health status.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const landingPagePath = path.join(projectRoot, 'public', 'index.html');

/**
 * GET /
 * Content negotiation:
 * - If client explicitly requests HTML (browser navigation), serves public/index.html
 * - Otherwise (cURL, RapidAPI monitors, Accept: application/json), serves JSON metadata
 */
export function handleRoot(req, res) {
  const acceptHeader = req.headers['accept'] || '';

  if (req.accepts('html') && !acceptHeader.includes('application/json')) {
    return res.sendFile(landingPagePath);
  }

  return res.status(200).json({
    service: config.service.name,
    version: config.service.version,
    description: config.service.description,
    status: 'operational',
    documentation: config.service.docsUrl,
    endpoints: {
      single_validate_post: {
        method: 'POST',
        path: '/v1/validate',
        description: 'Validate single phone number via JSON body',
        example_payload: { phone: '+14155552671', defaultCountry: 'US' }
      },
      single_validate_get: {
        method: 'GET',
        path: '/v1/validate?phone=+14155552671&country=US',
        description: 'Fast GET lookup for phone number'
      },
      batch_validate_post: {
        method: 'POST',
        path: '/v1/validate/batch',
        description: 'Batch validation of up to 50 phone numbers',
        example_payload: {
          numbers: ['+14155552671', { phone: '3312345678', defaultCountry: 'MX' }]
        }
      },
      health: {
        method: 'GET',
        path: '/health',
        description: 'Microservice health check and uptime status'
      }
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * GET /health
 * Lightweight health check for monitoring probes and keep-alive
 */
export function handleHealth(req, res) {
  const memory = process.memoryUsage();

  return res.status(200).json({
    status: 'ok',
    service: config.service.name,
    version: config.service.version,
    uptime_seconds: parseFloat(process.uptime().toFixed(2)),
    memory_mb: {
      rss: parseFloat((memory.rss / (1024 * 1024)).toFixed(2)),
      heap_used: parseFloat((memory.heapUsed / (1024 * 1024)).toFixed(2)),
      heap_total: parseFloat((memory.heapTotal / (1024 * 1024)).toFixed(2))
    },
    timestamp: new Date().toISOString()
  });
}

export default {
  handleRoot,
  handleHealth
};
