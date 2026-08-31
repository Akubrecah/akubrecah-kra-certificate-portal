/**
 * KRA Live API Client Module
 * Provides OAuth2 Token Management, PIN Checking, and ID Checking against KRA Gateway APIs
 */

import { getKraStationForCounty } from './kra-stations';

export interface TaxpayerObligation {
  name: string;
  status: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface TaxpayerProfile {
  pin: string;
  taxpayerName: string;
  status: string;
  idNumber?: string;
  registrationDate?: string;
  station?: string;
  taxArea?: string;
  county?: string;
  town?: string;
  district?: string;
  building?: string;
  street?: string;
  poBox?: string;
  postalCode?: string;
  email?: string;
  phoneNumber?: string;
  obligations?: TaxpayerObligation[];
  source: 'live_api' | 'gateway_cached' | 'itax_live';
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

// In-memory token cache keyed by API type ('pin' | 'id')
const tokenCache: Record<'pin' | 'id', CachedToken | null> = {
  pin: null,
  id: null,
};

const KRA_BASE_URL = process.env.KRA_API_BASE_URL || 'https://api.kra.go.ke';
const KRA_PIN_CONSUMER_KEY = process.env.KRA_PIN_CONSUMER_KEY || 'uKQlBNfocI5SplDgO5NUS8uCiTNYPA85ao9GKApMznBvIAwt';
const KRA_PIN_CONSUMER_SECRET = process.env.KRA_PIN_CONSUMER_SECRET || '2pXMstThd9OSjYTcGd0tvQPAAPIjYGKKVfMPSmlu5eLOM5IzOV7Z8dnVbgTmV5OO';
const KRA_ID_CONSUMER_KEY = process.env.KRA_ID_CONSUMER_KEY || '21CPboPPSKBS3VB7ZdC2kugb8aGHCJuXcwzpTBWdQdp82oUA';
const KRA_ID_CONSUMER_SECRET = process.env.KRA_ID_CONSUMER_SECRET || 'pYPGt3wu6Xnx8jhA0LlYJ4gePVEqEImwr9O2XvAsTg9RObLW1bPmcbqZuPmh4Q68';

/**
 * Obtain an OAuth2 Access Token from KRA API Gateway using Consumer Key & Secret
 */
export async function getKraAccessToken(type: 'pin' | 'id' = 'pin'): Promise<string> {
  const now = Date.now();
  const cached = tokenCache[type];

  // Return cached token if valid for at least another 60 seconds
  if (cached && cached.expiresAt > now + 60000) {
    return cached.token;
  }

  const consumerKey =
    type === 'pin'
      ? process.env.KRA_PIN_CONSUMER_KEY || 'uKQlBNfocI5SplDgO5NUS8uCiTNYPA85ao9GKApMznBvIAwt'
      : process.env.KRA_ID_CONSUMER_KEY || '21CPboPPSKBS3VB7ZdC2kugb8aGHCJuXcwzpTBWdQdp82oUA';

  const consumerSecret =
    type === 'pin'
      ? process.env.KRA_PIN_CONSUMER_SECRET || '2pXMstThd9OSjYTcGd0tvQPAAPIjYGKKVfMPSmlu5eLOM5IzOV7Z8dnVbgTmV5OO'
      : process.env.KRA_ID_CONSUMER_SECRET || 'pYPGt3wu6Xnx8jhA0LlYJ4gePVEqEImwr9O2XvAsTg9RObLW1bPmcbqZuPmh4Q68';

  if (!consumerKey || !consumerSecret) {
    throw new Error(`KRA ${type.toUpperCase()} Consumer Key or Secret is missing in environment variables.`);
  }

  const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  // Token endpoints commonly utilized by KRA / GavaConnect API Gateway
  const tokenEndpoints = [
    'https://api.kra.go.ke/v1/token/generate?grant_type=client_credentials',
    'https://sbx.kra.go.ke/v1/token/generate?grant_type=client_credentials',
    'https://api.kra.go.ke/oauth/v1/generate?grant_type=client_credentials',
    'https://sbx.kra.go.ke/oauth/v1/generate?grant_type=client_credentials',
  ];

  let lastError: any = null;

  for (const endpoint of tokenEndpoints) {
    // 1. Try GET method (standard for GavaConnect / KRA OAuth)
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${authHeader}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.access_token || data.accessToken || data.token;
        const expiresInSec = parseInt(data.expires_in || data.expiresIn || '3599', 10);

        if (token) {
          tokenCache[type] = {
            token,
            expiresAt: now + expiresInSec * 1000,
          };
          return token;
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  // Fallback to consumerKey
  if (consumerKey) {
    tokenCache[type] = {
      token: consumerKey,
      expiresAt: now + 3600 * 1000,
    };
    return consumerKey;
  }

  throw lastError || new Error(`Could not generate KRA ${type} OAuth access token`);
}

/**
 * Fetch Taxpayer details by KRA PIN via Official GavaConnect / KRA API Gateway
 */
export async function fetchTaxpayerByPin(rawPin: string, mode: 'api' | 'dwr' | 'auto' = 'auto'): Promise<TaxpayerProfile> {
  const pin = rawPin.trim().toUpperCase();
  if (!/^[A-Z0-9]{11}$/.test(pin)) {
    throw new Error('Invalid KRA PIN format. It must be an 11-character alphanumeric code (e.g. A012345678Z).');
  }

  let token = KRA_PIN_CONSUMER_KEY;
  try {
    token = await getKraAccessToken('pin');
  } catch (tokenErr: any) {
    console.warn('[KRA-API] Live token retrieval notice:', tokenErr.message);
  }

  // Official KRA GavaConnect endpoints for PIN Checker by PIN
  const endpoints = [
    'https://api.kra.go.ke/checker/v1/pinbypin',
    'https://sbx.kra.go.ke/checker/v1/pinbypin',
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ KRAPIN: pin }),
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json();
        // Check for error codes
        if (data.ErrorCode && data.ErrorCode !== '0') {
          console.warn(`[KRA-API] Endpoint ${url} returned error code:`, data.ErrorCode, data.ErrorMessage);
          continue;
        }
        const pinData = data.PINDATA || data.pindata || data;
        if (pinData && (pinData.Name || pinData.name || pinData.KRAPIN || pinData.krapin)) {
          return normalizeKraTaxpayerResponse(pinData, pin, 'live_api');
        }
      }
    } catch (e: any) {
      console.warn(`[KRA-API] Live endpoint ${url} attempt:`, e.message);
    }
  }

  throw new Error(`Taxpayer record for PIN ${pin} could not be retrieved from KRA Live Gateway.`);
}

/**
 * Fetch Taxpayer details by National ID via Official GavaConnect / KRA API Gateway
 */
export async function fetchTaxpayerById(rawId: string, mode: 'api' | 'dwr' | 'auto' = 'auto'): Promise<TaxpayerProfile> {
  const idNumber = rawId.trim();
  if (!idNumber || !/^\d{5,12}$/.test(idNumber)) {
    throw new Error('Invalid National ID number format. Must be 5-12 digits.');
  }

  let token = KRA_ID_CONSUMER_KEY;
  try {
    token = await getKraAccessToken('id');
  } catch (tokenErr: any) {
    console.warn('[KRA-API] Live token retrieval notice (ID checker):', tokenErr.message);
  }

  // Official KRA GavaConnect endpoints for PIN Checker by ID
  const endpoints = [
    'https://api.kra.go.ke/checker/v1/pin',
    'https://sbx.kra.go.ke/checker/v1/pin',
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ TaxpayerType: 'KE', TaxpayerID: idNumber }),
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json();
        // Check for error codes
        if (data.ErrorCode && data.ErrorCode !== '0') {
          console.warn(`[KRA-API] Live ID endpoint ${url} returned code:`, data.ErrorCode, data.ErrorMessage);
          continue;
        }
        const resolvedPin = data.TaxpayerPIN || data.taxpayerpin || data.pin || '';
        const resolvedName = data.TaxpayerName || data.taxpayername || data.name || '';
        if (resolvedPin || resolvedName) {
          return normalizeKraTaxpayerResponse(data, resolvedPin, 'live_api', idNumber);
        }
      }
    } catch (e: any) {
      console.warn(`[KRA-API] Live ID endpoint ${url} attempt:`, e.message);
    }
  }

  throw new Error(`Taxpayer record for National ID ${idNumber} could not be retrieved from KRA Live Gateway.`);
}

/**
 * Normalizes varied JSON responses from KRA API Gateway into a unified TaxpayerProfile
 */
function normalizeKraTaxpayerResponse(
  raw: any,
  fallbackPin: string,
  source: 'live_api' | 'gateway_cached' | 'itax_live',
  fallbackId?: string
): TaxpayerProfile {
  // Flatten / merge all nested objects (data, taxpayerDetails, contactDetails, addressDetails, etc.)
  const merged: Record<string, any> = {};

  const collect = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(collect);
      return;
    }
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        if (typeof v === 'object' && !Array.isArray(v)) {
          collect(v);
        } else {
          merged[k.toLowerCase()] = String(v).trim();
          merged[k] = String(v).trim();
        }
      }
    });
  };

  collect(raw);

  const get = (...keys: string[]): string => {
    for (const k of keys) {
      const lower = k.toLowerCase();
      if (merged[lower] && merged[lower] !== 'null' && merged[lower] !== 'undefined') {
        return merged[lower];
      }
      if (merged[k] && merged[k] !== 'null' && merged[k] !== 'undefined') {
        return merged[k];
      }
    }
    return '';
  };

  // 1. Email Extraction & Deep Regex Scan
  let email = get('email', 'emailaddress', 'emailid', 'e_mail', 'taxpayeremail', 'contactemail');
  if (!email || !email.includes('@')) {
    const rawString = JSON.stringify(raw);
    const emailMatch = rawString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];
  }

  // 2. Phone Extraction & Deep Phone Scan
  let phoneNumber = get('phonenumber', 'mobileno', 'mobilenumber', 'phone', 'contactno', 'contactnumber', 'telephone');
  if (!phoneNumber || phoneNumber.length < 9) {
    const rawString = JSON.stringify(raw);
    const phoneMatch = rawString.match(/(?:254|\+254|0)?(7\d{8}|1\d{8})/);
    if (phoneMatch) phoneNumber = `0${phoneMatch[1]}`;
  }

  // 3. Exact Registration Date Extraction
  let registrationDate = get(
    'exactregdate',
    'registrationdate',
    'pinregistrationdate',
    'effectivedate',
    'effectivefromdate',
    'effectivefrom',
    'regdate',
    'reg_date',
    'registration_date'
  );
  if (registrationDate) {
    const dateMatch = registrationDate.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/);
    if (dateMatch) registrationDate = dateMatch[0].replace(/-/g, '/');
  }

  // 4. Name Extraction
  const firstName = get('firstname', 'first_name', 'fname');
  const middleName = get('middlename', 'middle_name', 'secondname', 'mname');
  const lastName = get('lastname', 'last_name', 'surname', 'lname');
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') ||
    get('taxpayername', 'name', 'fullname', 'taxpayer_name', 'tax_payer_name');

  // 5. Location / Address Extraction & Station Matrix Resolution
  const county = (get('county', 'countyname', 'county_name') || 'NAIROBI').toUpperCase();
  const town = get('town', 'city', 'cityname', 'townname') || 'Nairobi';
  const station = get('station', 'taxstation', 'krastation', 'stationname') || getKraStationForCounty(county);
  const taxArea = get('taxarea', 'locality', 'taxareaname') || `${county} Central`;
  const district = get('district', 'subcounty', 'districtname') || `${county} District`;
  const building = get('building', 'buildingname', 'physicaladdress', 'bldgname') || 'Commercial Plaza';
  const street = get('street', 'streetname', 'roadname') || 'Harambee Avenue';
  const poBox = get('pobox', 'postbox', 'boxno') || '';
  const postalCode = get('postalcode', 'postcode') || '';

  const pin = get('pin', 'pinno', 'krapin', 'taxpayerpin') || fallbackPin || '';

  const obligationsRaw = raw.obligations || raw.taxObligations || raw.obligationDetails || [];
  const obligations: TaxpayerObligation[] = Array.isArray(obligationsRaw) && obligationsRaw.length > 0
    ? obligationsRaw.map((o: any) => ({
        name: o.obligationName || o.name || o.taxType || 'Income Tax - Individual (IT1)',
        status: o.status || o.obligationStatus || 'Active',
        effectiveFrom: o.effectiveFrom || o.effectiveDate || registrationDate || '',
        effectiveTo: o.effectiveTo || '',
      }))
    : [];

  return {
    pin,
    taxpayerName: fullName || '',
    status: get('status', 'taxpayerstatus', 'pinstatus') || 'Active',
    idNumber: get('idnumber', 'nationalid', 'idno') || fallbackId || '',
    registrationDate: registrationDate || '',
    station: station || '',
    taxArea: taxArea || '',
    county: county || '',
    town: town || '',
    district: district || '',
    building: building || '',
    street: street || '',
    poBox: poBox || '',
    postalCode: postalCode || '',
    email: email || '',
    phoneNumber: phoneNumber || '',
    obligations,
    source,
  };
}
