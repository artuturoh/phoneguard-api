/**
 * PhoneGuard API - Main Router Setup
 */

import { Router } from 'express';
import { handleRoot, handleHealth } from '../controllers/metaController.js';
import v1Router from './v1.js';

const router = Router();

// Public meta & health endpoints
router.get('/', handleRoot);
router.get('/health', handleHealth);

// v1 routes
router.use('/v1', v1Router);

export default router;
