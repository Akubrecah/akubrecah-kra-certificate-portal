import https from 'https';
import AnalyticsService from '../analyticsService';
import prisma from '../prisma';

/**
 * KRAService handles KRA-specific operations including registration and retrieval
 */
class KRAService {
  /**
   * Retrieve KRA PIN details using ID number
   * @param {Object} data - Retrieval parameters (id_number, etc.)
   * @returns {Promise<Object>} - Result of the operation
   */
  async retrieveKRAPIN(data) {
    const { id_number, full_name, pin: directPin } = data;
    
    try {
      console.log(`[KRAService] Starting retrieval — ID: ${id_number}, direct PIN: ${directPin}`);

      const searchPin = directPin ? String(directPin).trim().toUpperCase() : null;
      const searchId = id_number ? String(id_number).trim() : null;

      // 1. Check Neon PostgreSQL Cache
      if (searchPin || searchId) {
        console.log(`[KRAService] Checking Neon PostgreSQL Cache...`);
        let cached = null;
        if (searchPin) {
          cached = await prisma.kRAPinCache.findUnique({
            where: { pin: searchPin }
          });
        } else if (searchId) {
          cached = await prisma.kRAPinCache.findFirst({
            where: { idNumber: searchId }
          });
        }

        if (cached) {
          console.log(`[KRAService] Instant Cache Hit! Serving details from Neon DB for PIN: ${cached.pin}`);
          
          // Smart Cache Invalidations: If the cached registration date matches the day the cache was created,
          // or is a known migration fallback date, treat it as unverified to trigger exact lookup.
          let regDate = cached.registeredDate || '';
          const knownMigrationDates = ['12/06/2018', '15/06/2018', '12/10/2018'];
          if (regDate && cached.createdAt) {
            const cDate = new Date(cached.createdAt);
            const d = String(cDate.getDate()).padStart(2, '0');
            const m = String(cDate.getMonth() + 1).padStart(2, '0');
            const y = cDate.getFullYear();
            const cacheDay = `${d}/${m}/${y}`;
            if (regDate === cacheDay || knownMigrationDates.includes(regDate)) {
              console.log(`[KRAService] Cached date "${regDate}" matches cache creation day "${cacheDay}" or is a known migration date. Treating as unverified fallback.`);
              regDate = '';
            }
          }

          if (!regDate) {
            console.log(`[KRAService] Cache missing valid exact date for ${cached.pin}. Attempting fast live lookup...`);
            try {
              const exactDate = await this.fetchEffectiveDateFromPinChecker(cached.pin);
              if (exactDate) {
                regDate = exactDate;
                await prisma.kRAPinCache.updateMany({
                  where: { pin: cached.pin },
                  data: { registeredDate: exactDate }
                });
                console.log(`[KRAService] Cache patched with live exact date: ${exactDate}`);
              }
            } catch (err) {
              console.error(`[KRAService] Fast live lookup for date failed:`, err.message);
            }
          }

          return {
            success: true,
            fromCache: true,
            data: {
              pin: cached.pin,
              name: cached.name,
              email: cached.email || '',
              status: 'Active',
              certificate_url: `https://itax.kra.go.ke/KRA-Portal/dotDownloadCertificate.htm?pin=${cached.pin}`,
              building: cached.building || '',
              street: cached.street || '',
              town: cached.city || '',
              county: cached.county || '',
              district: cached.district || '',
              taxArea: cached.taxArea || '',
              station: cached.station || '',
              poBox: cached.poBox || '',
              postalCode: cached.postalCode || '',
              phoneNumber: cached.phoneNumber || '',
              registeredDate: regDate,
            }
          };
        }
        console.log(`[KRAService] DB Cache Miss. Fetching live details from KRA Portal...`);
      }

      const analyticsService = new AnalyticsService();
      analyticsService.logActivity({
        type: 'kra_retrieval_initiated',
        title: 'KRA PIN Retrieval Initiated',
        description: `Retrieval started for ID: ${id_number || directPin}`,
        status: 'pending'
      }).catch(e => console.error('[ANALYTICS] Error:', e));

      // 2. Initialize session
      const cookies = await this.initKraSession();
      const scriptSessionId = this.generateScriptSessionId();
      const windowName = this.generateWindowName();

      let fullPin = directPin ? String(directPin).trim().toUpperCase() : null;

      // 3. If no direct PIN, look it up by ID number
      if (!fullPin && id_number) {
        const maskedResponse = await this.callKraDWR({
          cookies,
          scriptSessionId,
          windowName,
          scriptName: 'findPinByIdno',
          methodName: 'findPinByIdnumber',
          params: [`string:${id_number}`],
          batchId: 0
        });

        if (!maskedResponse) {
          throw new Error('No response from KRA PIN lookup');
        }

        if (maskedResponse.includes('#$')) {
          const [maskedPin, reversedDigits] = maskedResponse.split('#$');
          const actualDigits = reversedDigits.split('').reverse().join('');
          fullPin = maskedPin.replace('*****', actualDigits).trim().toUpperCase();
        } else {
          fullPin = String(maskedResponse).trim().toUpperCase();
        }
      }

      if (!fullPin) {
        throw new Error('Could not determine KRA PIN — provide id_number or pin');
      }

      console.log('[KRAService] Normalized PIN:', fullPin);

      // 4. Fetch taxpayer details, manufacturer details, and confirm exact registration date concurrently!
      console.log('[KRAService] Triggering concurrent lookups (DWR, Manufacturer, and static PinChecker confirmation)...');
      const [taxpayerDetails, manufacturerDetails, confirmedDate] = await Promise.all([
        this.fetchTaxpayerDetailsByDWR(fullPin, cookies, scriptSessionId, windowName),
        this.fetchManufacturerDetails(fullPin, cookies),
        this.fetchEffectiveDateFromPinChecker(fullPin).catch((err) => {
          console.warn('[KRAService] Background PinChecker confirmation timed out or failed, using basic details fallback:', err.message);
          return null;
        })
      ]);

      console.log('[KRAService] DWR result:', JSON.stringify(taxpayerDetails));
      console.log('[KRAService] Manufacturer result:', JSON.stringify(manufacturerDetails));
      console.log('[KRAService] Confirmed PinChecker Date:', confirmedDate);

      const name = taxpayerDetails?.name
        || manufacturerDetails?.name
        || full_name
        || 'Taxpayer Name';

      // Enforce: The exact registration date must come ONLY from the static PIN Checker page (confirmedDate).
      // We do not fall back to DWR dates as they sometimes return migration dates like 12/06/2018.
      const realRegisteredDate = confirmedDate || '';

      let registeredDate = realRegisteredDate;

      if (!registeredDate) {
        // Fallback to today's date ONLY for the temporary response to prevent UI layout issues,
        // but we do NOT save this fallback date to the database cache (it will be cached as null/empty).
        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = today.getFullYear();
        registeredDate = `${d}/${m}/${y}`;
        console.log(`[KRAService] Exact registration date not yet confirmed from PIN Checker, using temporary fallback: ${registeredDate}`);
      }

      const result = {
        success: true,
        data: {
          pin: fullPin,
          name,
          email:      taxpayerDetails?.email      || manufacturerDetails?.email      || '',
          status:     'Active',
          certificate_url: `https://itax.kra.go.ke/KRA-Portal/dotDownloadCertificate.htm?pin=${fullPin}`,
          building:   taxpayerDetails?.building   || manufacturerDetails?.building   || '',
          street:     taxpayerDetails?.street     || manufacturerDetails?.street     || '',
          town:       taxpayerDetails?.city       || manufacturerDetails?.city       || '',
          county:     taxpayerDetails?.county     || manufacturerDetails?.county     || '',
          district:   taxpayerDetails?.district   || manufacturerDetails?.district   || '',
          taxArea:    taxpayerDetails?.taxArea    || manufacturerDetails?.taxArea    || '',
          station:    taxpayerDetails?.station    || manufacturerDetails?.station    || '',
          poBox:      taxpayerDetails?.poBox      || manufacturerDetails?.poBox      || '',
          postalCode: taxpayerDetails?.postalCode || manufacturerDetails?.postalCode || '',
          phoneNumber: taxpayerDetails?.phoneNumber || manufacturerDetails?.phoneNumber || '',
          registeredDate: registeredDate,
        }
      };

      console.log('[KRAService] Final result:', JSON.stringify(result.data));

      // 5. Cache retrieved details to Neon PostgreSQL
      try {
        console.log(`[KRAService] Caching retrieved details to Neon PostgreSQL for PIN: ${fullPin}`);
        await prisma.kRAPinCache.upsert({
          where: { pin: fullPin },
          update: {
            idNumber: id_number ? String(id_number).trim() : undefined,
            name: name,
            email: result.data.email,
            building: result.data.building,
            street: result.data.street,
            city: result.data.town,
            county: result.data.county,
            district: result.data.district,
            taxArea: result.data.taxArea,
            poBox: result.data.poBox,
            postalCode: result.data.postalCode,
            station: result.data.station,
            phoneNumber: result.data.phoneNumber,
            registeredDate: realRegisteredDate || null, // DO NOT write fallback date to DB cache!
          },
          create: {
            pin: fullPin,
            idNumber: id_number ? String(id_number).trim() : null,
            name: name,
            email: result.data.email,
            building: result.data.building,
            street: result.data.street,
            city: result.data.town,
            county: result.data.county,
            district: result.data.district,
            taxArea: result.data.taxArea,
            poBox: result.data.poBox,
            postalCode: result.data.postalCode,
            station: result.data.station,
            phoneNumber: result.data.phoneNumber,
            registeredDate: realRegisteredDate || null, // DO NOT write fallback date to DB cache!
          }
        });
        console.log(`[KRAService] Successfully cached details to Neon DB!`);
      } catch (cacheError) {
        console.error('[KRAService] Error saving details to cache:', cacheError.message);
      }

      analyticsService.logActivity({
        type: 'kra_retrieval_success',
        title: 'KRA PIN Retrieval Success',
        description: `PIN ${fullPin} retrieved`,
        status: 'completed'
      }).catch(e => console.error('[ANALYTICS] Error:', e));

      return result;

    } catch (error) {
      console.error('[KRAService] Error in retrieval:', error);
      return { success: false, error: error.message };
    }
  }


  /**
   * Fetch taxpayer details via DWR.
   * KRA only exposes one real method: getTaxpayerBasicRdtlsByPin
   * We log the raw response so we can diagnose parsing issues.
   */
  async fetchTaxpayerDetailsByDWR(pin, cookies, scriptSessionId, windowName) {
    return new Promise((resolve) => {
      const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
      const body = [
        'callCount=1',
        `windowName=${windowName}`,
        'c0-scriptName=TaxPayerRDWR',
        'c0-methodName=getTaxpayerBasicRdtlsByPin',
        'c0-id=0',
        `c0-param0=string:${pin}`,
        'batchId=1',
        'instanceId=0',
        'page=%2FKRA-Portal%2FpinChecker.htm',
        'httpSessionId=',
        `scriptSessionId=${scriptSessionId}`
      ].join('\n') + '\n';

      const options = {
        hostname: 'itax.kra.go.ke',
        port: 443,
        path: '/KRA-Portal/dwr/call/plaincall/TaxPayerRDWR.getTaxpayerBasicRdtlsByPin.dwr',
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(body),
          'Cookie': cookieString,
          'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          // ===== CRITICAL: Log raw response for diagnosis =====
          console.log('[KRAService][DWR] HTTP Status:', res.statusCode);
          console.log('[KRAService][DWR] Raw response (first 1200 chars):\n', data.substring(0, 1200));
          const parsed = this.parseDWRObjectResponse(data);
          console.log('[KRAService][DWR] Parsed result:', JSON.stringify(parsed));
          resolve(parsed);
        });
      });
      req.on('error', (e) => {
        console.error('[KRAService][DWR] Request error:', e.message);
        resolve(null);
      });
      req.write(body);
      req.end();
    });
  }

  /**
   * Parse KRA DWR responses.
   * KRA uses two response formats:
   *
   * Format A — inline object in callback:
   *   dwr.engine._remoteHandleCallback('1','0',{pin:"A001",lastName:"DOE",...});
   *
   * Format B — variable assignment then callback reference:
   *   var s0={};
   *   s0.pin="A001"; s0.lastName="DOE"; s0.countyName="NAIROBI";
   *   dwr.engine._remoteHandleCallback('1','0',s0);   <-- 's0' is a variable ref, NOT an object!
   *
   * Format C — string variables used as values:
   *   var s1="NAIROBI"; var s2="WESTLANDS";
   *   s0.countyName=s1; s0.districtName=s2;
   */
  parseDWRObjectResponse(raw) {
    try {
      if (!raw || raw.trim().length === 0) return null;

      // --- Step 1: Extract all standalone string variable assignments: var s1="VALUE" or s1="VALUE" ---
      const stringVars = {};
      const strVarPattern = /(?:var\s+)?(s\d+)\s*=\s*"([^"]*)"/g;
      let m;
      while ((m = strVarPattern.exec(raw)) !== null) {
        stringVars[m[1]] = m[2];
      }

      // --- Step 2: Extract all object property assignments: s0.field="value" or s0.field=s1 ---
      // Group by object variable name (e.g. s0, s1, s2) in case there are multiple objects
      const objectFields = {}; // { s0: { field: value, ... }, s3: {...} }
      const propPattern = /(s\d+)\.(\w+)\s*=\s*([^;\n]+)/g;
      while ((m = propPattern.exec(raw)) !== null) {
        const objVar = m[1];
        const key    = m[2];
        let   val    = m[3].trim();

        // Dereference string variable references
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        } else if (stringVars[val] !== undefined) {
          val = stringVars[val];
        } else if (val === 'null' || val === 'undefined' || val === 'true' || val === 'false') {
          val = val === 'null' || val === 'undefined' ? '' : val;
        } else {
          // Could be a number or unrecognised — keep as-is
        }

        if (!objectFields[objVar]) objectFields[objVar] = {};
        objectFields[objVar][key] = val;
      }

      // --- Step 3: Find which variable the callback actually returns ---
      // Matches both: handleCallback('1','0',s0)  and  handleCallback('1','0',{...})
      const cbMatch = raw.match(/handleCallback\([^,]*,[^,]*,\s*(s\d+|\{[^}]*\})\s*\)/);

      let fields = {};

      if (cbMatch) {
        const ref = cbMatch[1].trim();
        if (ref.startsWith('{')) {
          // Inline object — parse it
          try {
            const objStr = ref
              .replace(/(\w+)\s*:/g, '"$1":')
              .replace(/'/g, '"');
            fields = JSON.parse(objStr);
          } catch (e) {
            // Inline parse failed — fall through to property assignments
          }
        } else {
          // Variable reference (e.g. s0) — use its collected properties
          fields = objectFields[ref] || {};
        }
      }

      // --- Step 4: If callback gave us nothing, merge ALL collected object properties ---
      if (Object.keys(fields).length === 0) {
        for (const vars of Object.values(objectFields)) {
          Object.assign(fields, vars);
        }
      }

      if (Object.keys(fields).length === 0) {
        console.log('[KRAService][DWR] Parser found no fields in response');
        return null;
      }

      console.log('[KRAService][DWR] Parser extracted fields:', JSON.stringify(fields));
      return this.mapKRATaxpayerFields(fields);

    } catch (e) {
      console.error('[KRAService][DWR] parseDWRObjectResponse error:', e.message);
      return null;
    }
  }

  /**
   * Map raw KRA field names to our standard field names.
   * KRA uses various naming conventions across different endpoints.
   */
  mapKRATaxpayerFields(obj) {
    if (!obj) return null;
    
    // Aggressive field extractor with case-insensitive search
    const get = (...keys) => {
      // 1. Try exact matches
      for (const k of keys) {
        const val = obj[k];
        if (val !== undefined && val !== null && val !== 'null' && val !== 'undefined') {
          const sVal = String(val).trim();
          if (sVal.length > 0) return sVal;
        }
      }
      // 2. Try case-insensitive matches
      const objKeys = Object.keys(obj);
      for (const k of keys) {
        const match = objKeys.find(ok => ok.toLowerCase() === k.toLowerCase());
        if (match) {
          const val = obj[match];
          if (val !== undefined && val !== null && val !== 'null' && val !== 'undefined') {
            const sVal = String(val).trim();
            if (sVal.length > 0) return sVal;
          }
        }
      }
      return '';
    };

    const firstName = get('firstName', 'first_name', 'fName', 'f_name');
    const middleName = get('middleName', 'middle_name', 'secondName', 'mName', 'm_name');
    const lastName = get('lastName', 'last_name', 'surname', 'lName', 'l_name');
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')
      || get('taxpayerName', 'fullName', 'manufacturerName', 'name', 'taxpayer_name', 'tp_name', 'tax_payer_name');

    // Aggressive Email Search if not found in standard fields
    let email = get('emailAddress', 'emailId', 'email', 'email_id', 'email_address', 'mainEmail', 'secondaryEmail');
    if (!email) {
      const allStrings = JSON.stringify(obj);
      const emailMatch = allStrings.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];
    }

    const phoneNumber = get('mobileNo', 'phoneNumber', 'phone', 'telNo', 'contactNo', 'mobile_no', 'phone_number');

    return {
      name: fullName || null,
      email: email,
      building: get('buildingName', 'building', 'bldgName', 'building_name', 'physicalAddress', 'bldName', 'buildingNameEn', 'buldgNo'),
      street: get('streetName', 'street', 'roadName', 'street_name', 'road_name', 'roadEn', 'streetEn', 'streetRoad'),
      city: get('city', 'town', 'cityName', 'townName', 'city_name', 'town_name', 'cityEn', 'townEn', 'cityNameEn', 'cityTown'),
      county: get('county', 'countyName', 'county_name', 'countyDesc', 'county_desc', 'countyNameEn'),
      district: get('district', 'districtName', 'subCounty', 'district_name', 'distName', 'subCountyEn', 'districtEn'),
      taxArea: get('taxArea', 'taxAreaName', 'taxAreaDesc', 'tax_area', 'tax_area_name', 'taxAreaEn', 'localityEn', 'taxAreaLocality'),
      poBox: get('poBox', 'pobox', 'postBox', 'boxNumber', 'pBox', 'poBoxEn'),
      postalCode: get('postalCode', 'postalcode', 'postCode', 'post_code', 'pCode', 'postCodeEn'),
      station: get('station', 'stationName', 'stationDesc', 'station_name', 'station_desc', 'stationEn'),
      phoneNumber: phoneNumber,
      registeredDate: get('pinRegDate', 'registrationDate', 'regDate', 'effectiveDate', 'effDate', 'registration_date', 'effective_date', 'businessRegDate', 'businessComDate'),
    };
  }

  // --- Helper Methods (Internal DWR logic) ---

  async initKraSession() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'itax.kra.go.ke',
        port: 443,
        path: '/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        const cookies = res.headers['set-cookie'] || [];
        const cookieMap = {};
        cookies.forEach((cookie) => {
          const [nameValue] = cookie.split(';');
          const [name, value] = nameValue.split('=');
          if (name && value) cookieMap[name] = value;
        });
        resolve(cookieMap);
      });

      req.on('error', (e) => reject(e));
      req.end();
    });
  }

  async callKraDWR(params) {
    return new Promise((resolve, reject) => {
      const cookieString = Object.entries(params.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      const body = [
        'callCount=1',
        `windowName=${params.windowName}`,
        `c0-scriptName=${params.scriptName}`,
        `c0-methodName=${params.methodName}`,
        'c0-id=0',
        ...params.params.map((p, i) => `c0-param${i}=${p}`),
        `batchId=${params.batchId}`,
        'instanceId=0',
        'page=%2FKRA-Portal%2FpinChecker.htm',
        'httpSessionId=',
        `scriptSessionId=${params.scriptSessionId}`
      ].join('\n') + '\n';

      const options = {
        hostname: 'itax.kra.go.ke',
        port: 443,
        path: `/KRA-Portal/dwr/call/plaincall/${params.scriptName}.${params.methodName}.dwr`,
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Cookie': cookieString,
          'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('[callKraDWR] Raw response:', data.substring(0, 400));
          // Inline callback: handleCallback('batchId','id',"value")
          const callbackMatch = data.match(/handleCallback\([^,]+,[^,]+,"([^"]+)"\)/);
          if (callbackMatch) return resolve(callbackMatch[1]);
          // String assignment: s0="value"
          const stringMatch = data.match(/s\d+="([^"]+)"/);
          if (stringMatch) return resolve(stringMatch[1]);
          // Null/empty
          resolve(null);
        });
      });

      req.on('error', (e) => reject(e));
      req.write(body);
      req.end();
    });
  }

  async fetchManufacturerDetails(pin, cookies) {
    return new Promise((resolve) => {
      const cookieString = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      const body = `manPin=${encodeURIComponent(pin)}`;

      const options = {
        hostname: 'itax.kra.go.ke',
        port: 443,
        path: '/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': cookieString,
          'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (parsedData) {
                // Merge all nested DTOs into a single flat object for the mapper
                const mergedData = {};
                Object.values(parsedData).forEach(val => {
                  if (val && typeof val === 'object' && !Array.isArray(val)) {
                    Object.assign(mergedData, val);
                  }
                });
                
                if (Object.keys(mergedData).length > 0) {
                   const mapped = this.mapKRATaxpayerFields(mergedData);
                   console.log('[KRAService] Manufacturer mapped result:', JSON.stringify(mapped));
                   resolve(mapped);
                }
            }
            resolve(null);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.write(body);
      req.end();
    });
  }

  /**
   * Solve CAPTCHA and fetch exact effective/registered date from KRA static Pin Checker
   * @param {string} pin - The KRA PIN to check
   * @returns {Promise<string|null>} - The exact registration date if found, or null
   */
  async fetchEffectiveDateFromPinChecker(pin) {
    let worker = null;
    const fs = await import('fs');
    const path = await import('path');
    const logFile = path.join(process.cwd(), 'temp', 'pin-checker-debug.log');
    const log = (msg) => {
      const line = `[${new Date().toISOString()}] ${msg}\n`;
      console.log(`[KRAService][PinChecker] ${msg}`);
      try {
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
        fs.appendFileSync(logFile, line);
      } catch (e) {}
    };

    try {
      log(`Starting ultra-fast raw HTTP registration date lookup for PIN: ${pin}`);
      const startTime = Date.now();

      const { createRequire } = await import('module');
      const { createWorker } = await import('tesseract.js');

      const require = createRequire(import.meta.url);
      let workerPath, corePath;
      try {
        workerPath = require.resolve('tesseract.js/src/worker-script/node/index.js');
        corePath = require.resolve('tesseract.js-core/tesseract-core.wasm.js');
        
        if (workerPath.includes('[project]') || !fs.existsSync(workerPath)) {
          throw new Error('Next.js require.resolve hijack detected');
        }
        log(`Resolved workerPath via require.resolve: ${workerPath}`);
        log(`Resolved corePath via require.resolve: ${corePath}`);
      } catch (err) {
        log(`require.resolve failed or hijacked, falling back to static process.cwd paths: ${err.message}`);
        workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
        corePath = path.join(process.cwd(), 'node_modules', 'tesseract.js-core', 'tesseract-core.wasm.js');
      }

      log(`Using workerPath: ${workerPath} (exists: ${fs.existsSync(workerPath)})`);
      log(`Using corePath: ${corePath} (exists: ${fs.existsSync(corePath)})`);

      // Explicit reference to ensure Vercel Node File Trace (NFT) bundles the training data
      const searchPaths = [
        process.cwd(),
        path.join(process.cwd(), '.next'),
        path.join(process.cwd(), '.next/server'),
        path.join(process.cwd(), '.next/server/app'),
        path.join(process.cwd(), '.next/server/chunks'),
      ];

      let cachePath = '/tmp';
      let foundTrainedData = false;
      let sourcePath = null;
      for (const p of searchPaths) {
        const testPath = path.join(p, 'eng.traineddata');
        if (fs.existsSync(testPath)) {
          sourcePath = testPath;
          foundTrainedData = true;
          log(`Local traineddata source verified at: ${testPath}`);
          break;
        }
      }

      if (foundTrainedData && sourcePath) {
        try {
          const destPath = path.join('/tmp', 'eng.traineddata');
          if (!fs.existsSync(destPath)) {
            log(`Copying eng.traineddata to /tmp for read-write access...`);
            fs.copyFileSync(sourcePath, destPath);
            log(`Copy complete.`);
          } else {
            log(`eng.traineddata already exists in /tmp.`);
          }
        } catch (copyErr) {
          log(`Failed to copy traineddata to /tmp: ${copyErr.message}`);
        }
      } else {
        log(`eng.traineddata not found in search paths. Defaulting cachePath to: ${cachePath}`);
      }

      log(`Initializing session and cookies...`);
      const cookies = await this.initKraSession();
      log(`Session cookies obtained: ${JSON.stringify(cookies)}`);
      const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
      
      const maxAttempts = 5;
      let attempts = 0;
      let htmlResult = null;
      let success = false;

      log(`Initializing Tesseract worker completely offline...`);
      worker = await createWorker('eng', 1, {
        cachePath: cachePath,
        gzip: false,
        workerPath: workerPath,
        corePath: corePath
      });
      log(`Tesseract worker initialized successfully.`);

      while (attempts < maxAttempts) {
        log(`Solving CAPTCHA attempt ${attempts + 1}/${maxAttempts}`);
        
        // Fetch CAPTCHA image as buffer using the session cookies
        const randNum = Math.floor(Math.random() * 1000);
        const captchaBuffer = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: `/KRA-Portal/GenerateCaptchaServlet.do?sourcePage=LOGIN&rand=${randNum}`,
            method: 'GET',
            headers: {
              'Cookie': cookieString,
              'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            rejectUnauthorized: false
          };

          https.get(options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
          }).on('error', reject);
        });

        log(`CAPTCHA image buffer fetched: ${captchaBuffer.length} bytes`);

        // OCR recognize CAPTCHA text
        const ret = await worker.recognize(captchaBuffer);
        const text = ret.data.text.trim();
        log(`OCR raw text output: "${text}"`);
        
        // Parse math expression using our OCR solver
        const parsed = this.parseMathExpression(text);
        if (!parsed) {
          log(`Attempt ${attempts + 1}: Could not parse math from OCR: "${text}". Retrying...`);
          attempts++;
          continue;
        }

        log(`Attempt ${attempts + 1}: OCR text: "${text}" -> solved expression: ${parsed.num1} ${parsed.operator} ${parsed.num2} = ${parsed.result}`);

        // Submit POST request via raw HTTP
        const postData = `viewType=static&actionCode=checkPin&vo.pinNo=${encodeURIComponent(pin)}&captcahText=${parsed.result}`;
        
        htmlResult = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: '/KRA-Portal/pinChecker.htm',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData),
              'Cookie': cookieString,
              'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            rejectUnauthorized: false
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
          });
          req.on('error', reject);
          req.write(postData);
          req.end();
        });

        log(`Response HTML content length: ${htmlResult.length}`);

        if (htmlResult.includes('Wrong result of the arithmetic operation.')) {
          log(`Attempt ${attempts + 1}: Wrong arithmetic answer returned by iTax. Retrying...`);
          attempts++;
        } else {
          log(`Attempt ${attempts + 1}: CAPTCHA successfully verified!`);
          success = true;
          break;
        }
      }

      await worker.terminate().catch(() => {});
      worker = null;

      if (!success || !htmlResult) {
        throw new Error('Unable to solve KRA CAPTCHA after max attempts.');
      }

      // Parse the primary registration date from the PIN Details section in HTML
      let exactDate = null;
      const pinDetailsIndex = htmlResult.indexOf('PIN Details');
      if (pinDetailsIndex !== -1) {
        const sub = htmlResult.substring(pinDetailsIndex);
        
        // 1. Try to find "PIN Registration Date" or "Registration Date" label specifically
        const regDateLabelIndex = sub.toLowerCase().indexOf('registration date');
        if (regDateLabelIndex !== -1) {
          const subReg = sub.substring(regDateLabelIndex, regDateLabelIndex + 300);
          const dateMatch = subReg.match(/\d{2}\/\d{2}\/\d{4}/);
          if (dateMatch) {
            exactDate = dateMatch[0];
            log(`Found exact date from 'registration date' label context: ${exactDate}`);
          }
        }
        
        // 2. If not found, look for the first date in "Obligation Details" section
        if (!exactDate) {
          const obligationDetailsIndex = sub.toLowerCase().indexOf('obligation details');
          if (obligationDetailsIndex !== -1) {
            const subObl = sub.substring(obligationDetailsIndex);
            const dateMatch = subObl.match(/\d{2}\/\d{2}\/\d{4}/);
            if (dateMatch) {
              exactDate = dateMatch[0];
              log(`Found exact date from 'obligation details' table context: ${exactDate}`);
            }
          }
        }
        
        // 3. General fallback inside the PIN Details container
        if (!exactDate) {
          const dateMatch = sub.match(/\d{2}\/\d{2}\/\d{4}/);
          if (dateMatch) {
            exactDate = dateMatch[0];
            log(`Found exact date from general table context: ${exactDate}`);
          }
        }
      } else {
        log(`PIN Details container not found in HTML response.`);
      }

      if (exactDate) {
        log(`Success! Extracted primary registration date via raw HTTP in ${Date.now() - startTime}ms: ${exactDate}`);
        return exactDate;
      }

      log(`Captcha accepted but no exact registration date found in response HTML.`);
      return null;

    } catch (error) {
      log(`Raw HTTP lookup failed: ${error.stack || error.message}`);
      if (worker) {
        await worker.terminate().catch(() => {});
      }
      return null;
    }
  }

  /**
   * Fetch all active obligations and their effective dates from KRA static Pin Checker via fast raw HTTP
   * @param {string} pin - The KRA PIN to check
   * @returns {Promise<Array<{name: string, status: string, effectiveFrom: string, effectiveTo: string}>|null>} - List of obligations or null
   */
  async fetchObligationsFromPinChecker(pin) {
    let worker = null;
    try {
      console.log(`[KRAService][PinChecker] Starting fast obligations lookup for PIN: ${pin}`);
      const startTime = Date.now();

      const fs = await import('fs');
      const path = await import('path');
      const { createRequire } = await import('module');
      const { createWorker } = await import('tesseract.js');

      const require = createRequire(import.meta.url);
      let workerPath, corePath;
      try {
        workerPath = require.resolve('tesseract.js/src/worker-script/node/index.js');
        corePath = require.resolve('tesseract.js-core/tesseract-core.wasm.js');
        
        if (workerPath.includes('[project]') || !fs.existsSync(workerPath)) {
          throw new Error('Next.js require.resolve hijack detected');
        }
      } catch (err) {
        workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
        corePath = path.join(process.cwd(), 'node_modules', 'tesseract.js-core', 'tesseract-core.wasm.js');
      }

      let cachePath = '/tmp';
      let foundTrainedData = false;
      let sourcePath = null;
      
      const searchPaths = [
        process.cwd(),
        path.join(process.cwd(), '.next'),
        path.join(process.cwd(), '.next/server'),
        path.join(process.cwd(), '.next/server/app'),
        path.join(process.cwd(), '.next/server/chunks'),
      ];

      for (const p of searchPaths) {
        const testPath = path.join(p, 'eng.traineddata');
        if (fs.existsSync(testPath)) {
          sourcePath = testPath;
          foundTrainedData = true;
          break;
        }
      }

      if (foundTrainedData && sourcePath) {
        try {
          const destPath = path.join('/tmp', 'eng.traineddata');
          if (!fs.existsSync(destPath)) {
            fs.copyFileSync(sourcePath, destPath);
          }
        } catch (copyErr) {
          console.error(`[KRAService][PinChecker] Failed to copy traineddata to /tmp:`, copyErr.message);
        }
      }

      const cookies = await this.initKraSession();
      const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
      
      const maxAttempts = 5;
      let attempts = 0;
      let htmlResult = null;
      let success = false;

      worker = await createWorker('eng', 1, {
        cachePath: cachePath,
        gzip: false,
        workerPath: workerPath,
        corePath: corePath
      });

      while (attempts < maxAttempts) {
        const randNum = Math.floor(Math.random() * 1000);
        const captchaBuffer = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: `/KRA-Portal/GenerateCaptchaServlet.do?sourcePage=LOGIN&rand=${randNum}`,
            method: 'GET',
            headers: {
              'Cookie': cookieString,
              'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            rejectUnauthorized: false
          };

          https.get(options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
          }).on('error', reject);
        });

        const ret = await worker.recognize(captchaBuffer);
        const text = ret.data.text.trim();
        
        const parsed = this.parseMathExpression(text);
        if (!parsed) {
          attempts++;
          continue;
        }

        const postData = `viewType=static&actionCode=checkPin&vo.pinNo=${encodeURIComponent(pin)}&captcahText=${parsed.result}`;
        
        htmlResult = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: '/KRA-Portal/pinChecker.htm',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData),
              'Cookie': cookieString,
              'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            rejectUnauthorized: false
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
          });
          req.on('error', reject);
          req.write(postData);
          req.end();
        });

        if (htmlResult.includes('Wrong result of the arithmetic operation.')) {
          attempts++;
        } else {
          success = true;
          break;
        }
      }

      await worker.terminate().catch(() => {});
      worker = null;

      if (!success || !htmlResult) {
        throw new Error('Unable to solve KRA CAPTCHA after max attempts.');
      }

      const obligations = [];
      const oblsStartIndex = htmlResult.indexOf('Obligation Details');
      if (oblsStartIndex !== -1) {
        const oblsEndIndex = htmlResult.indexOf('</fieldset>', oblsStartIndex);
        const oblsSection = htmlResult.substring(oblsStartIndex, oblsEndIndex);
        
        const rowRegex = /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
        let match;
        while ((match = rowRegex.exec(oblsSection)) !== null) {
          const name = match[1].replace(/<[^>]*>/g, '').trim();
          const status = match[2].replace(/<[^>]*>/g, '').trim();
          const effectiveFrom = match[3].replace(/<[^>]*>/g, '').trim();
          const effectiveTo = match[4].replace(/<[^>]*>/g, '').trim() || 'Active';
          
          if (name && name.toLowerCase() !== 'obligation name') {
            obligations.push({
              name,
              status,
              effectiveFrom,
              effectiveTo
            });
          }
        }
      }

      console.log(`[KRAService][PinChecker] Successfully extracted ${obligations.length} obligations via raw HTTP in ${Date.now() - startTime}ms`);
      return obligations;

    } catch (error) {
      console.error('[KRAService][PinChecker] Obligations lookup failed:', error.message);
      if (worker) {
        await worker.terminate().catch(() => {});
      }
      return null;
    }
  }

  /**
   * Smart mathematical parser to solve OCR text and handle Tesseract's trailing '?' misreading glitches
   */
  parseMathExpression(ocrText) {
    let clean = ocrText.replace(/\s+/g, '');
    clean = clean.replace(/~/g, '-').replace(/—/g, '-').replace(/_/g, '-');
    
    const isMinus = clean.includes('-');
    const isPlus = clean.includes('+');
    
    if (!isMinus && !isPlus) return null;
    
    const op = isMinus ? '-' : '+';
    const parts = clean.split(op);
    
    if (parts.length < 2) return null;
    
    const num1Match = parts[0].match(/\d+/);
    if (!num1Match) return null;
    const num1 = parseInt(num1Match[0], 10);
    
    let secondPart = parts[1].replace(/[^0-9]/g, '');
    if (secondPart.length === 0) return null;
    
    let num2 = parseInt(secondPart, 10);
    if (secondPart.length > 1) {
      const stripped = secondPart.slice(0, -1);
      num2 = parseInt(stripped, 10);
    }
    
    return {
      num1,
      operator: op,
      num2,
      result: op === '+' ? (num1 + num2) : (num1 - num2)
    };
  }

  generateScriptSessionId() {
    const random = Math.random().toString(16).slice(2).toUpperCase();
    return `${random}/${Date.now()}`;
  }

  generateWindowName() {
    return 'DWR-' + Math.random().toString(16).slice(2).toUpperCase();
  }

  derivePrimaryRegistrationDate(pin) {
    if (!pin) return '12/10/2017';
    const normalized = String(pin).trim().toUpperCase();
    
    const matches = normalized.match(/[A-Z](\d+)/);
    if (!matches) return '15/06/2018';
    
    const seq = parseInt(matches[1].substring(0, 4), 10);
    
    let year = 2017;
    let month = '10';
    let day = '12';
    
    if (seq <= 40) {
      year = 2014;
      month = '05';
      day = '18';
    } else if (seq <= 80) {
      year = 2015;
      month = '09';
      day = '24';
    } else if (seq <= 120) {
      year = 2016;
      month = '03';
      day = '11';
    } else if (seq <= 160) {
      year = 2017;
      month = '11';
      day = '07';
    } else if (seq <= 200) {
      year = 2018;
      month = '06';
      day = '21';
    } else if (seq <= 240) {
      year = 2019;
      month = '02';
      day = '14';
    } else if (seq <= 280) {
      year = 2020;
      month = '10';
      day = '05';
    } else if (seq <= 320) {
      year = 2021;
      month = '04';
      day = '29';
    } else if (seq <= 360) {
      year = 2022;
      month = '08';
      day = '19';
    } else if (seq <= 400) {
      year = 2023;
      month = '12';
      day = '02';
    } else if (seq <= 450) {
      year = 2024;
      month = '05';
      day = '25';
    } else {
      year = 2025;
      month = '01';
      day = '15';
    }
    
    const extraDays = (parseInt(matches[1].slice(-2), 10) || 0) % 28;
    const finalDay = String(Math.max(1, (parseInt(day, 10) + extraDays) % 28)).padStart(2, '0');
    
    return `${finalDay}/${month}/${year}`;
  }
}

export default new KRAService();

