/**
 * PhoneGuard API - v1 API Routes
 */

import { Router } from 'express';
import { rapidApiAuth } from '../middleware/auth.js';
import {
  handleSingleValidate,
  handleQueryValidate,
  handleBatchValidate
} from '../controllers/phoneController.js';

const router = Router();

// RapidAPI security middleware protects all /v1 endpoints
router.use(rapidApiAuth);

// Single validation (POST & GET)
router.post('/validate', handleSingleValidate);
router.get('/validate', handleQueryValidate);

// Batch validation (POST)
router.post('/validate/batch', handleBatchValidate);

export default router;
