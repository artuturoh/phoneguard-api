/**
 * PhoneGuard API - Request Validation Schemas with Zod
 */

import { z } from 'zod';

const countryCodeSchema = z
  .string()
  .trim()
  .length(2, 'Country code must be a 2-letter ISO 3166-1 alpha-2 code (e.g. US, MX, ES)')
  .transform((val) => val.toUpperCase())
  .optional()
  .nullable();

// Single phone POST schema
export const singleValidateSchema = z.object({
  phone: z
    .string({
      required_error: 'Phone number is required',
      invalid_type_error: 'Phone number must be a string'
    })
    .trim()
    .min(2, 'Phone number is too short')
    .max(50, 'Phone number is too long'),
  defaultCountry: countryCodeSchema
});

// Single phone GET query schema
export const singleQuerySchema = z.object({
  phone: z
    .string({
      required_error: 'Query parameter "phone" is required'
    })
    .trim()
    .min(2, 'Phone number is too short')
    .max(50, 'Phone number is too long'),
  country: countryCodeSchema
});

// Batch phone item schema (can be a string or an object)
const batchItemSchema = z.union([
  z.string().trim().min(2).max(50),
  z.object({
    phone: z.string().trim().min(2).max(50),
    defaultCountry: countryCodeSchema
  })
]);

// Batch POST schema
export const batchValidateSchema = z
  .object({
    numbers: z.array(batchItemSchema).optional(),
    phones: z.array(batchItemSchema).optional(),
    defaultCountry: countryCodeSchema
  })
  .refine(
    (data) => (Array.isArray(data.numbers) && data.numbers.length > 0) || (Array.isArray(data.phones) && data.phones.length > 0),
    {
      message: 'Either "numbers" or "phones" array must be provided with at least 1 item'
    }
  )
  .refine(
    (data) => {
      const list = data.numbers || data.phones || [];
      return list.length <= 50;
    },
    {
      message: 'Batch size exceeds maximum limit of 50 items'
    }
  );
