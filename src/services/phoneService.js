/**
 * PhoneGuard API - Phone Validation & Risk Service
 * High-performance, 100% in-memory phone intelligence and fraud detection engine.
 */

import parsePhoneNumber from 'libphonenumber-js/max';
import { getCountryDetails } from './countryService.js';

/**
 * Calculates risk score, recommendation, and reason codes based on validity and line type.
 * @param {boolean} isValid
 * @param {boolean} isPossible
 * @param {string} lineType
 * @returns {{ riskScore: number, recommendation: 'allow' | 'review' | 'block', reasons: string[] }}
 */
function evaluateFraudRisk(isValid, isPossible, lineType) {
  if (!isPossible) {
    return {
      riskScore: 100,
      recommendation: 'block',
      reasons: ['IMPOSSIBLE_PHONE_NUMBER_LENGTH', 'INVALID_SYNTAX']
    };
  }

  if (!isValid) {
    return {
      riskScore: 95,
      recommendation: 'block',
      reasons: ['INVALID_PHONE_NUMBER', 'UNASSIGNED_OR_INACTIVE_RANGE']
    };
  }

  switch (lineType) {
    case 'MOBILE':
      return {
        riskScore: 5,
        recommendation: 'allow',
        reasons: ['VALID_MOBILE_CARRIER_LINE', 'SMS_DELIVERY_CONFIRMED']
      };

    case 'FIXED_LINE_OR_MOBILE':
      return {
        riskScore: 15,
        recommendation: 'allow',
        reasons: ['AMBIGUOUS_MOBILE_OR_FIXED_PREFIX', 'SMS_DELIVERY_SUPPORTED']
      };

    case 'VOIP':
      return {
        riskScore: 75,
        recommendation: 'review',
        reasons: ['VOIP_VIRTUAL_NUMBER', 'POTENTIAL_BURNER_OR_FRAUD_RISK', 'SMS_DELIVERY_UNRELIABLE']
      };

    case 'FIXED_LINE':
      return {
        riskScore: 60,
        recommendation: 'review',
        reasons: ['LANDLINE_CANNOT_RECEIVE_SMS', 'VOICE_CALL_VERIFICATION_REQUIRED']
      };

    case 'TOLL_FREE':
      return {
        riskScore: 80,
        recommendation: 'review',
        reasons: ['TOLL_FREE_BUSINESS_LINE', 'CANNOT_RECEIVE_PERSONAL_SMS']
      };

    case 'PREMIUM_RATE':
      return {
        riskScore: 95,
        recommendation: 'block',
        reasons: ['PREMIUM_RATE_SERVICE', 'HIGH_FINANCIAL_OR_TOLL_FRAUD_RISK']
      };

    case 'SHARED_COST':
      return {
        riskScore: 75,
        recommendation: 'review',
        reasons: ['SHARED_COST_SERVICE_LINE', 'SMS_NOT_SUPPORTED']
      };

    case 'PAGER':
      return {
        riskScore: 85,
        recommendation: 'review',
        reasons: ['PAGER_DEVICE_LINE', 'SMS_INCOMPATIBLE']
      };

    case 'UAN':
      return {
        riskScore: 65,
        recommendation: 'review',
        reasons: ['UNIVERSAL_ACCESS_NUMBER', 'NON_STANDARD_MOBILE_LINE']
      };

    case 'VOICEMAIL':
      return {
        riskScore: 85,
        recommendation: 'review',
        reasons: ['VOICEMAIL_DIRECT_ACCESS_NUMBER', 'SMS_NOT_SUPPORTED']
      };

    case 'PERSONAL_NUMBER':
      return {
        riskScore: 60,
        recommendation: 'review',
        reasons: ['PERSONAL_FORWARDING_NUMBER', 'SMS_DELIVERY_UNCERTAIN']
      };

    case 'UNKNOWN':
    default:
      return {
        riskScore: 50,
        recommendation: 'review',
        reasons: ['UNDETERMINED_LINE_TYPE', 'MANUAL_OR_SECONDARY_REVIEW_SUGGESTED']
      };
  }
}

/**
 * Validates and enriches a single phone number
 * @param {string} rawPhone - Raw phone number string
 * @param {string} [defaultCountry] - ISO 3166-1 alpha-2 default country code (e.g. 'US', 'MX')
 * @returns {object} Validation result
 */
export function validatePhoneNumber(rawPhone, defaultCountry = null) {
  const startTime = performance.now();
  const trimmedPhone = typeof rawPhone === 'string' ? rawPhone.trim() : String(rawPhone || '');
  const normalizedCountry = defaultCountry && typeof defaultCountry === 'string'
    ? defaultCountry.trim().toUpperCase()
    : undefined;

  let parsed = null;
  let parseFailed = false;

  try {
    parsed = parsePhoneNumber(trimmedPhone, normalizedCountry);
    if (!parsed) {
      parseFailed = true;
    }
  } catch (err) {
    parseFailed = true;
  }

  // If libphonenumber could not parse anything
  if (parseFailed || !parsed) {
    const elapsed = parseFloat((performance.now() - startTime).toFixed(3));
    return {
      phone: trimmedPhone,
      isValid: false,
      isPossible: false,
      lineType: 'UNKNOWN',
      canReceiveSms: false,
      formats: {
        e164: null,
        international: null,
        national: null,
        rfc3966: null
      },
      country: null,
      fraudAnalysis: {
        riskScore: 100,
        recommendation: 'block',
        reasons: ['INVALID_PHONE_NUMBER_FORMAT', 'UNABLE_TO_PARSE']
      },
      meta: {
        execution_time_ms: elapsed,
        timestamp: new Date().toISOString()
      }
    };
  }

  const isValid = parsed.isValid();
  const isPossible = parsed.isPossible();
  const detectedType = parsed.getType();
  const lineType = detectedType || 'UNKNOWN';

  // canReceiveSms is true strictly if valid and MOBILE or FIXED_LINE_OR_MOBILE
  const canReceiveSms = isValid && (lineType === 'MOBILE' || lineType === 'FIXED_LINE_OR_MOBILE');

  // Formats (only available if parsed)
  let e164 = null;
  let international = null;
  let national = null;
  let rfc3966 = null;

  try {
    e164 = parsed.format('E.164');
    international = parsed.format('INTERNATIONAL');
    national = parsed.format('NATIONAL');
    rfc3966 = parsed.format('RFC3966');
  } catch (fmtErr) {
    // Graceful fallback if formatting fails for edge case
  }

  // Country and timezone resolution
  const countryCode = parsed.country || normalizedCountry || null;
  const callingCode = parsed.countryCallingCode || null;
  const countryDetails = countryCode ? getCountryDetails(countryCode, callingCode) : null;

  // Fraud & SMS Recommendation
  const fraudAnalysis = evaluateFraudRisk(isValid, isPossible, lineType);

  const elapsed = parseFloat((performance.now() - startTime).toFixed(3));

  return {
    phone: trimmedPhone,
    isValid,
    isPossible,
    lineType,
    canReceiveSms,
    formats: {
      e164,
      international,
      national,
      rfc3966
    },
    country: countryDetails,
    fraudAnalysis,
    meta: {
      execution_time_ms: elapsed,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Validates an array of phone numbers in batch mode
 * @param {Array<string|{ phone: string, defaultCountry?: string }>} items
 * @param {string} [globalDefaultCountry]
 * @returns {object} Batch results and aggregated summary
 */
export function validateBatch(items, globalDefaultCountry = null) {
  const batchStart = performance.now();
  const results = [];

  let validCount = 0;
  let invalidCount = 0;
  let allowCount = 0;
  let reviewCount = 0;
  let blockCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let phoneStr = '';
    let country = globalDefaultCountry;

    if (typeof item === 'string') {
      phoneStr = item;
    } else if (item && typeof item === 'object') {
      phoneStr = item.phone || '';
      if (item.defaultCountry) {
        country = item.defaultCountry;
      }
    }

    const validated = validatePhoneNumber(phoneStr, country);
    results.push(validated);

    if (validated.isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    switch (validated.fraudAnalysis.recommendation) {
      case 'allow':
        allowCount++;
        break;
      case 'review':
        reviewCount++;
        break;
      case 'block':
        blockCount++;
        break;
    }
  }

  const batchElapsed = parseFloat((performance.now() - batchStart).toFixed(3));

  return {
    summary: {
      total: items.length,
      valid: validCount,
      invalid: invalidCount,
      recommendations: {
        allow: allowCount,
        review: reviewCount,
        block: blockCount
      },
      execution_time_ms: batchElapsed
    },
    results,
    meta: {
      execution_time_ms: batchElapsed,
      timestamp: new Date().toISOString()
    }
  };
}

export default {
  validatePhoneNumber,
  validateBatch
};
