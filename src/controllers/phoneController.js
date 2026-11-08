/**
 * PhoneGuard API - Phone Validation Controller
 */

import { validatePhoneNumber, validateBatch } from '../services/phoneService.js';
import { singleValidateSchema, singleQuerySchema, batchValidateSchema } from '../schemas/validation.js';

/**
 * POST /v1/validate
 * Validates a single phone number with full JSON contract.
 */
export async function handleSingleValidate(req, res, next) {
  try {
    const validatedBody = singleValidateSchema.parse(req.body);
    const result = validatePhoneNumber(validatedBody.phone, validatedBody.defaultCountry);

    const { meta, ...phoneData } = result;

    return res.status(200).json({
      success: true,
      data: phoneData,
      meta
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/validate?phone=...&country=...
 * Fast GET endpoint for quick lookups and URL-based integrations.
 */
export async function handleQueryValidate(req, res, next) {
  try {
    const validatedQuery = singleQuerySchema.parse(req.query);
    const result = validatePhoneNumber(validatedQuery.phone, validatedQuery.country);

    const { meta, ...phoneData } = result;

    return res.status(200).json({
      success: true,
      data: phoneData,
      meta
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/validate/batch
 * Validates up to 50 phone numbers concurrently in memory.
 */
export async function handleBatchValidate(req, res, next) {
  try {
    const validatedBody = batchValidateSchema.parse(req.body);
    const items = validatedBody.numbers || validatedBody.phones || [];
    const defaultCountry = validatedBody.defaultCountry || null;

    const batchResult = validateBatch(items, defaultCountry);

    // Separate meta from individual item outputs for clean responses
    const formattedData = batchResult.results.map(({ meta, ...itemData }) => itemData);

    return res.status(200).json({
      success: true,
      summary: batchResult.summary,
      data: formattedData,
      meta: batchResult.meta
    });
  } catch (err) {
    next(err);
  }
}

export default {
  handleSingleValidate,
  handleQueryValidate,
  handleBatchValidate
};
