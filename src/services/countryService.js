/**
 * PhoneGuard API - Country and Timezone Service
 * High-performance, in-memory country and timezone resolution.
 */

import ct from 'countries-and-timezones';

// In-memory continent mapping for standard ISO 3166-1 alpha-2 codes
const CONTINENT_MAP = {
  US: 'North America', CA: 'North America', MX: 'North America',
  GB: 'Europe', FR: 'Europe', DE: 'Europe', ES: 'Europe', IT: 'Europe',
  NL: 'Europe', BE: 'Europe', CH: 'Europe', AT: 'Europe', SE: 'Europe',
  NO: 'Europe', DK: 'Europe', FI: 'Europe', PL: 'Europe', PT: 'Europe',
  IE: 'Europe', GR: 'Europe', CZ: 'Europe', RO: 'Europe', UA: 'Europe',
  BR: 'South America', AR: 'South America', CO: 'South America', CL: 'South America',
  PE: 'South America', VE: 'South America', EC: 'South America', UY: 'South America',
  CN: 'Asia', JP: 'Asia', IN: 'Asia', KR: 'Asia', SG: 'Asia',
  ID: 'Asia', MY: 'Asia', PH: 'Asia', TH: 'Asia', VN: 'Asia',
  AE: 'Asia', SA: 'Asia', IL: 'Asia', TR: 'Asia', QA: 'Asia',
  AU: 'Oceania', NZ: 'Oceania',
  ZA: 'Africa', EG: 'Africa', NG: 'Africa', KE: 'Africa', MA: 'Africa'
};

/**
 * Get country and timezone information by ISO-3166-1 alpha-2 code
 * @param {string} countryCode - 2-letter ISO code (e.g. 'US', 'MX', 'ES')
 * @param {string} [callingCode] - Optional phone calling code (e.g. '1', '52')
 * @returns {object|null} Enriched country metadata
 */
export function getCountryDetails(countryCode, callingCode = null) {
  if (!countryCode || typeof countryCode !== 'string') {
    return null;
  }

  const upperCode = countryCode.toUpperCase();
  const countryData = ct.getCountry(upperCode);

  if (!countryData) {
    return {
      code: upperCode,
      name: upperCode,
      callingCode: callingCode ? (callingCode.startsWith('+') ? callingCode : `+${callingCode}`) : null,
      continent: CONTINENT_MAP[upperCode] || 'Unknown',
      timezones: [],
      primaryTimezone: null,
      totalTimezones: 0
    };
  }

  const timezones = Array.isArray(countryData.timezones) ? countryData.timezones : [];
  const formattedCallingCode = callingCode
    ? (callingCode.startsWith('+') ? callingCode : `+${callingCode}`)
    : null;

  return {
    code: countryData.id,
    name: countryData.name,
    callingCode: formattedCallingCode,
    continent: CONTINENT_MAP[upperCode] || 'International',
    timezones,
    primaryTimezone: timezones.length > 0 ? timezones[0] : null,
    totalTimezones: timezones.length
  };
}

export default {
  getCountryDetails
};
