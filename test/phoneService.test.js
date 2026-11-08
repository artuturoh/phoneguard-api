import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePhoneNumber, validateBatch } from '../src/services/phoneService.js';

describe('PhoneService - In-Memory Core Engine', () => {
  it('validates a real mobile phone (Spain) with SMS delivery allowed', () => {
    const result = validatePhoneNumber('+34612345678');

    assert.equal(result.isValid, true);
    assert.equal(result.isPossible, true);
    assert.equal(result.lineType, 'MOBILE');
    assert.equal(result.canReceiveSms, true);
    assert.equal(result.formats.e164, '+34612345678');
    assert.equal(result.formats.international, '+34 612 34 56 78');
    assert.equal(result.formats.national, '612 34 56 78');
    assert.equal(result.country.code, 'ES');
    assert.equal(result.country.name, 'Spain');
    assert.equal(result.country.callingCode, '+34');
    assert.ok(result.country.timezones.includes('Europe/Madrid'));
    assert.equal(result.fraudAnalysis.recommendation, 'allow');
    assert.ok(result.fraudAnalysis.riskScore <= 15);
    assert.ok(result.meta.execution_time_ms < 5, 'Execution time must be under 5ms');
  });

  it('validates a North American number (USA) with FIXED_LINE_OR_MOBILE classification', () => {
    const result = validatePhoneNumber('+14155552671');

    assert.equal(result.isValid, true);
    assert.equal(result.isPossible, true);
    assert.equal(result.lineType, 'FIXED_LINE_OR_MOBILE');
    assert.equal(result.canReceiveSms, true);
    assert.equal(result.formats.e164, '+14155552671');
    assert.equal(result.country.code, 'US');
    assert.ok(result.country.timezones.length > 0);
    assert.equal(result.fraudAnalysis.recommendation, 'allow');
    assert.ok(result.meta.execution_time_ms < 5);
  });

  it('parses a local national number when defaultCountry is provided', () => {
    const result = validatePhoneNumber('3312345678', 'MX');

    assert.equal(result.isValid, true);
    assert.equal(result.formats.e164, '+523312345678');
    assert.equal(result.country.code, 'MX');
    assert.equal(result.country.name, 'Mexico');
    assert.ok(result.country.timezones.includes('America/Mexico_City'));
  });

  it('identifies toll-free numbers and flags them for review (cannot receive SMS)', () => {
    const result = validatePhoneNumber('+18005550199');

    assert.equal(result.isValid, true);
    assert.equal(result.lineType, 'TOLL_FREE');
    assert.equal(result.canReceiveSms, false);
    assert.equal(result.fraudAnalysis.recommendation, 'review');
    assert.ok(result.fraudAnalysis.riskScore >= 70);
  });

  it('identifies fixed line numbers (UK) and marks canReceiveSms as false', () => {
    const result = validatePhoneNumber('+442079460991');

    assert.equal(result.isValid, true);
    assert.equal(result.lineType, 'FIXED_LINE');
    assert.equal(result.canReceiveSms, false);
    assert.equal(result.fraudAnalysis.recommendation, 'review');
  });

  it('handles completely invalid or gibberish inputs safely without throwing', () => {
    const result = validatePhoneNumber('invalid-gibberish-string');

    assert.equal(result.isValid, false);
    assert.equal(result.isPossible, false);
    assert.equal(result.lineType, 'UNKNOWN');
    assert.equal(result.canReceiveSms, false);
    assert.equal(result.formats.e164, null);
    assert.equal(result.country, null);
    assert.equal(result.fraudAnalysis.recommendation, 'block');
    assert.equal(result.fraudAnalysis.riskScore, 100);
    assert.ok(result.fraudAnalysis.reasons.length > 0);
  });

  it('processes batch numbers and returns accurate aggregated metrics', () => {
    const batchInput = [
      '+14155552671',
      { phone: '3312345678', defaultCountry: 'MX' },
      '+18005550199',
      'invalid-phone-num'
    ];

    const result = validateBatch(batchInput);

    assert.equal(result.summary.total, 4);
    assert.equal(result.summary.valid, 3);
    assert.equal(result.summary.invalid, 1);
    assert.equal(result.summary.recommendations.allow, 2);
    assert.equal(result.summary.recommendations.review, 1);
    assert.equal(result.summary.recommendations.block, 1);
    assert.equal(result.results.length, 4);
    assert.ok(result.summary.execution_time_ms < 10);
  });
});
