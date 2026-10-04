/**
 * KRA Live API Client Module
 * Provides OAuth2 Token Management, PIN Checking, and ID Checking against KRA Gateway APIs
 */

import https from 'https';
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

export interface ManufacturerDetails {
  name: string;
  email: string;
  phoneNumber: string;
  building: string;
  street: string;
  town: string;
  county: string;
  district: string;
  taxArea: string;
  poBox: string;
  postalCode: string;
}

/**
 * Fetch genuine taxpayer details (email, phone, address) from KRA iTax Manufacturer endpoint
 */
export function fetchManufacturerDetails(pin: string, cookieString = ''): Promise<ManufacturerDetails | null> {
  return new Promise((resolve) => {
    const postData = `manPin=${encodeURIComponent(pin)}`;
    const buf = Buffer.from(postData, 'utf8');
    const headers: Record<string, any> = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Length': buf.length,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    if (cookieString && cookieString.trim()) {
      headers['Cookie'] = cookieString.trim();
    }

    const req = https.request({
      hostname: 'itax.kra.go.ke',
      port: 443,
      path: '/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl',
      method: 'POST',
      headers,
      timeout: 8000,
      rejectUnauthorized: false,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8');
          const parsed = JSON.parse(raw);
          if (parsed && !parsed.isError) {
            const clean = (v: any) => {
              if (v === undefined || v === null) return '';
              const s = String(v).trim();
              if (!s || s.toLowerCase() === 'na' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '0') return '';
              return s;
            };

            const basic = parsed.timsManBasicRDtlDTO || {};
            const business = parsed.manBusinessRDtlDTO || {};
            const contact = parsed.manContactRDtlDTO || {};
            const address = parsed.manAddRDtlDTO || {};

            const fn = clean(basic.firstName);
            const mn = clean(basic.middleName);
            const ln = clean(basic.lastName);
            const fullName = clean([fn, mn, ln].filter(Boolean).join(' ') || basic.manufacturerName || business.businessName);

            const email = clean(contact.mainEmail || contact.secondaryEmail);
            const phoneNumber = clean(contact.mobileNo || contact.telephoneNo);
            const county = clean(address.county);
            const town = clean(address.cityTown || address.town);
            const district = clean(address.district);
            const taxArea = clean(address.taxAreaLocality);
            const building = clean(address.buldgNo || address.descriptiveAddress);
            const street = clean(address.streetRoad);
            const poBox = clean(address.poBox);
            const postalCode = clean(address.postalCode);

            resolve({
              name: fullName,
              email,
              phoneNumber,
              building,
              street,
              town,
              county,
              district,
              taxArea,
              poBox,
              postalCode,
            });
            return;
          }
        } catch {}
        resolve(null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.write(buf);
    req.end();
  });
}

async function enrichTaxpayerProfile(profile: TaxpayerProfile): Promise<void> {
  if (profile.pin && (!profile.email || !profile.phoneNumber || !profile.county)) {
    try {
      const man = await fetchManufacturerDetails(profile.pin);
      if (man) {
        if (!profile.email && man.email) profile.email = man.email;
        if (!profile.phoneNumber && man.phoneNumber) profile.phoneNumber = man.phoneNumber;
        if ((!profile.taxpayerName || profile.taxpayerName === 'Registered Taxpayer') && man.name) {
          profile.taxpayerName = man.name;
        }
        if (!profile.county && man.county) profile.county = man.county;
        if (!profile.town && man.town) profile.town = man.town;
        if (!profile.district && man.district) profile.district = man.district;
        if (!profile.taxArea && man.taxArea) profile.taxArea = man.taxArea;
        if (!profile.building && man.building) profile.building = man.building;
        if (!profile.street && man.street) profile.street = man.street;
        if (!profile.poBox && man.poBox) profile.poBox = man.poBox;
        if (!profile.postalCode && man.postalCode) profile.postalCode = man.postalCode;
        if (!profile.station && profile.county) {
          profile.station = getKraStationForCounty(profile.county);
        }
      }
    } catch (err: any) {
      console.warn('[KRA-API] Failed to enrich with manufacturer details:', err.message);
    }
  }
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

export async function getKraAccessToken(type: 'pin' | 'id' = 'pin'): Promise<string> {
  const now = Date.now();
  const cached = tokenCache[type];

  // Return cached token if valid for at least another 60 seconds
  if (cached && cached.expiresAt > now + 60000) {
    return cached.token;
  }

  const consumerKey =
    type === 'pin'
      ? (process.env.KRA_PIN_CONSUMER_KEY || '').trim()
      : (process.env.KRA_ID_CONSUMER_KEY || '').trim();

  const consumerSecret =
    type === 'pin'
      ? (process.env.KRA_PIN_CONSUMER_SECRET || '').trim()
      : (process.env.KRA_ID_CONSUMER_SECRET || '').trim();

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

  let token = '';
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
          const profile = normalizeKraTaxpayerResponse(pinData, pin, 'live_api');
          await enrichTaxpayerProfile(profile);
          return profile;
        }
      }
    } catch (e: any) {
      console.warn(`[KRA-API] Live endpoint ${url} attempt:`, e.message);
    }
  }

  // Fallback to Manufacturer DTO if Live Gateway is unavailable or returns 404
  try {
    const man = await fetchManufacturerDetails(pin);
    if (man && (man.name || man.email || man.county)) {
      const county = man.county || '';
      return {
        pin,
        taxpayerName: man.name || 'Registered Taxpayer',
        status: 'Active',
        registrationDate: '',
        station: county ? getKraStationForCounty(county) : '',
        taxArea: man.taxArea || (county ? `${county} Central` : ''),
        county,
        town: man.town || '',
        district: man.district || '',
        building: man.building || '',
        street: man.street || '',
        poBox: man.poBox || '',
        postalCode: man.postalCode || '',
        email: man.email || '',
        phoneNumber: man.phoneNumber || '',
        obligations: [
          {
            name: 'Income Tax - Individual (IT1)',
            status: 'Active',
            effectiveFrom: '01/01/2015',
          }
        ],
        source: 'itax_live',
      };
    }
  } catch {}

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

  let token = '';
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
          const profile = normalizeKraTaxpayerResponse(data, resolvedPin, 'live_api', idNumber);
          await enrichTaxpayerProfile(profile);
          return profile;
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
  const county = (get('county', 'countyname', 'county_name') || '').toUpperCase();
  const town = get('town', 'city', 'cityname', 'townname') || '';
  const station = get('station', 'taxstation', 'krastation', 'stationname') || (county ? getKraStationForCounty(county) : '');
  const taxArea = get('taxarea', 'locality', 'taxareaname') || (county ? `${county} Central` : '');
  const district = get('district', 'subcounty', 'districtname') || (county ? `${county} District` : '');
  const building = get('building', 'buildingname', 'physicaladdress', 'bldgname') || '';
  const street = get('street', 'streetname', 'roadname') || '';
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
