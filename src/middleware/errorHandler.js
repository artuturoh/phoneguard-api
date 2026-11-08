/**
 * PhoneGuard API - Global Error & Not Found Handlers
 */

import { ZodError } from 'zod';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
}

export function errorHandler(err, req, res, next) {
  // Handle JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload in request body'
      }
    });
  }

  // Handle Zod validation error
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const issues = err.issues || err.errors || [];
    const details = issues.map((e) => ({
      path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        details
      }
    });
  }

  // Generic internal server error
  console.error('[PhoneGuard Error]', err);

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message
    }
  });
}
