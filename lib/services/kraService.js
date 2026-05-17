import https from 'https';
import AnalyticsService from '../analyticsService';

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

      const analyticsService = new AnalyticsService();
      analyticsService.logActivity({
        type: 'kra_retrieval_initiated',
        title: 'KRA PIN Retrieval Initiated',
        description: `Retrieval started for ID: ${id_number || directPin}`,
        status: 'pending'
      }).catch(e => console.error('[ANALYTICS] Error:', e));

      // 1. Initialize session
      const cookies = await this.initKraSession();
      const scriptSessionId = this.generateScriptSessionId();
      const windowName = this.generateWindowName();

      let fullPin = directPin ? String(directPin).trim().toUpperCase() : null;

      // 2. If no direct PIN, look it up by ID number
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

      // 3. Fetch taxpayer details, manufacturer details, and confirm exact registration date concurrently!
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

      const registeredDate = confirmedDate
        || taxpayerDetails?.registeredDate 
        || manufacturerDetails?.registeredDate 
        || '';

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
        path: '/KRA-Portal/',
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
    try {
      console.log(`[KRAService][PinChecker] Starting ultra-fast raw HTTP registration date lookup for PIN: ${pin}`);
      const startTime = Date.now();

      const path = await import('path');
      const { createWorker } = await import('tesseract.js');

      // 1. Initialize session and cookies
      const cookies = await this.initKraSession();
      const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
      
      const maxAttempts = 5;
      let attempts = 0;
      let htmlResult = null;
      let success = false;

      // Initialize Tesseract worker once to avoid startup penalty
      worker = await createWorker('eng', 1, {
        workerPath: path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js')
      });

      while (attempts < maxAttempts) {
        console.log(`[KRAService][PinChecker] Solving CAPTCHA attempt ${attempts + 1}/${maxAttempts}`);
        
        // 2. Fetch CAPTCHA image as buffer using the session cookies
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

        // 3. OCR recognize CAPTCHA text
        const ret = await worker.recognize(captchaBuffer);
        const text = ret.data.text.trim();
        
        // Parse math expression using our bulletproof OCR solver
        const parsed = this.parseMathExpression(text);
        if (!parsed) {
          console.log(`[KRAService][PinChecker] Attempt ${attempts + 1}: Could not parse math from OCR: "${text}". Retrying...`);
          attempts++;
          continue;
        }

        console.log(`[KRAService][PinChecker] Attempt ${attempts + 1}: OCR text: "${text}" -> solved expression: ${parsed.num1} ${parsed.operator} ${parsed.num2} = ${parsed.result}`);

        // 4. Submit POST request via raw HTTP
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
          console.log(`[KRAService][PinChecker] Attempt ${attempts + 1}: Wrong arithmetic answer returned by iTax. Retrying...`);
          attempts++;
        } else {
          console.log(`[KRAService][PinChecker] Attempt ${attempts + 1}: CAPTCHA successfully verified!`);
          success = true;
          break;
        }
      }

      await worker.terminate().catch(() => {});
      worker = null;

      if (!success || !htmlResult) {
        throw new Error('Unable to solve KRA CAPTCHA after max attempts.');
      }

      // 5. Parse the primary registration date using a robust, blazing-fast regular expression from the result table
      const matches = [...htmlResult.matchAll(/<td[^>]*class="textAlignRight"[^>]*>(\d{2}\/\d{2}\/\d{4})<\/td>/g)];
      if (matches.length > 0) {
        const exactDate = matches[0][1];
        console.log(`[KRAService][PinChecker] Success! Extracted primary registration date via raw HTTP in ${Date.now() - startTime}ms: ${exactDate}`);
        return exactDate;
      }

      console.warn('[KRAService][PinChecker] Captcha accepted but no obligation date table found in response.');
      return null;

    } catch (error) {
      console.error('[KRAService][PinChecker] Raw HTTP lookup failed:', error.message);
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
}

export default new KRAService();
