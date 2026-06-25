import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export const maxDuration = 150; // Allow up to 2.5 minutes for user interaction & filing

// Define global declaration for TypeScript compiler
declare global {
  var kraSessions: Map<string, any> | undefined;
}

const activeSessions = globalThis.kraSessions || new Map<string, any>();
if (!globalThis.kraSessions) {
  globalThis.kraSessions = activeSessions;
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.createdAt > 300000) { // 5 minutes timeout
      console.log(`[KRA Nil Return] Cleanup: Closing expired session ${sessionId}`);
      session.browser.close().catch(() => {});
      activeSessions.delete(sessionId);
    }
  }
}

export async function POST(req: NextRequest) {
  // Run cleanup on new requests
  try {
    cleanupExpiredSessions();
  } catch (e) {
    console.error('[KRA Nil Return] Cleanup error:', e);
  }

  try {
    const body = await req.json();
    const { action, pin, password, shouldReset, sessionId, captchaAnswer } = body;

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: START
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'start') {
      if (!pin) {
        return NextResponse.json({ success: false, error: 'KRA PIN or National ID is required' }, { status: 400 });
      }

      console.log(`[KRA Nil Return] Launching browser for PIN/ID: ${pin}`);

      // If reset is requested, run headfully so operator can answer security questions in Chrome.
      // Otherwise, run headlessly (invisible background worker).
      const launchOptions: any = {
        headless: !shouldReset,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      };

      const macChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      if (existsSync(macChromePath)) {
        console.log(`[KRA Nil Return] Found local Google Chrome at: ${macChromePath}. Using it.`);
        launchOptions.executablePath = macChromePath;
      }

      const browser = await chromium.launch(launchOptions);
      const context = await browser.newContext({
        viewport: { width: 1200, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      // Navigate to KRA iTax
      await page.goto('https://itax.kra.go.ke/KRA-Portal/', {
        waitUntil: 'networkidle',
        timeout: 45000,
      });

      console.log('[KRA Nil Return] Entering PIN/ID...');
      await page.locator('#logid').click();
      await page.locator('#logid').fill(pin.trim().toUpperCase());
      await page.getByRole('link', { name: 'Continue' }).click();

      // Enters Password if customer knows it
      if (password && !shouldReset) {
        console.log('[KRA Nil Return] Pre-filling Password...');
        const passwordField = page.locator('input[type="password"]').first();
        await passwordField.waitFor({ state: 'visible', timeout: 10000 });
        await passwordField.click();
        await passwordField.fill(password);
      }

      // Handle Password Reset trigger
      if (shouldReset) {
        console.log('[KRA Nil Return] Reset Password requested. Clicking Forgot Password/PIN...');
        const forgotLink = page.locator('a:has-text("Forgot Password"), a:has-text("Forgot PIN")').first();
        if (await forgotLink.isVisible()) {
          await forgotLink.click();
        }
      }

      // Set up session tracker
      const newSessionId = crypto.randomUUID();
      const sessionObj = {
        browser,
        page,
        pin,
        password,
        shouldReset,
        createdAt: Date.now(),
        lastDialogMessage: '',
      };

      page.on('dialog', async (dialog) => {
        const msg = dialog.message();
        console.log(`[KRA Dialog Alert]: ${msg}`);
        sessionObj.lastDialogMessage = msg;
        await dialog.accept();
      });

      activeSessions.set(newSessionId, sessionObj);

      // Handle single-step forgot password reset flow (Runs Headfully)
      if (shouldReset) {
        console.log('[KRA Nil Return] Awaiting manual CAPTCHA solving and reset from operator in Chrome...');
        
        try {
          await page.waitForSelector('text=File Nil Return', { timeout: 120000 });
          console.log('[KRA Nil Return] Login detected! Proceeding to file returns...');
        } catch (timeoutErr) {
          await browser.close().catch(() => {});
          activeSessions.delete(newSessionId);
          throw new Error('Forgot password login timed out. Operator did not solve reset flow within 120 seconds.');
        }

        // Navigate to Nil returns page
        await page.goto('https://itax.kra.go.ke/KRA-Portal/eReturns.htm?actionCode=loadPage&nilReturnFlag=Y&amendmentFlag=N', {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Select Obligation: Individual (value 2)
        console.log('[KRA Nil Return] Selecting Obligation...');
        const obligationDropdown = page.locator('#regType');
        await obligationDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await obligationDropdown.selectOption('2');

        // Click Next
        await page.getByRole('button', { name: 'Next' }).click();

        await page.waitForTimeout(3000);
        if (sessionObj.lastDialogMessage && (
          sessionObj.lastDialogMessage.toLowerCase().includes('cannot file') ||
          sessionObj.lastDialogMessage.toLowerCase().includes('already filed')
        )) {
          await browser.close().catch(() => {});
          activeSessions.delete(newSessionId);
          throw new Error(`KRA Blocker: ${sessionObj.lastDialogMessage}`);
        }

        // Submit
        const submitBtn = page.getByRole('button', { name: 'Submit' });
        await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
        await submitBtn.click();

        // Download receipt
        const downloadReceiptLink = page.getByRole('link', { name: 'Download Returns Receipt' });
        await downloadReceiptLink.waitFor({ state: 'visible', timeout: 20000 });

        const downloadPromise = page.waitForEvent('download');
        await downloadReceiptLink.click();
        const download = await downloadPromise;
        const tempPath = await download.path();

        if (!tempPath) {
          await browser.close().catch(() => {});
          activeSessions.delete(newSessionId);
          throw new Error('Failed to retrieve the returns receipt file.');
        }

        const pdfBuffer = await readFile(tempPath);
        const pdfBase64 = pdfBuffer.toString('base64');

        await browser.close().catch(() => {});
        activeSessions.delete(newSessionId);

        return NextResponse.json({
          success: true,
          message: 'KRA Nil Return successfully filed!',
          receiptPdfBase64: pdfBase64,
        });
      }

      // Standard Flow: Screenshot KRA login CAPTCHA image element and return to client
      console.log('[KRA Nil Return] Locating login CAPTCHA element...');
      const captchaElement = page.locator('#captcha_img');
      await captchaElement.waitFor({ state: 'visible', timeout: 15000 });
      const captchaBuffer = await captchaElement.screenshot();
      const captchaBase64 = `data:image/png;base64,${captchaBuffer.toString('base64')}`;

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        captchaImage: captchaBase64,
        isForgotFlow: false,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: SUBMIT CAPTCHA
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'submit') {
      if (!sessionId || !captchaAnswer) {
        return NextResponse.json({ success: false, error: 'Session ID and CAPTCHA answer are required' }, { status: 400 });
      }

      const session = activeSessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session expired or not found. Please reload the page.' }, { status: 404 });
      }

      const { page, browser, pin } = session;
      session.lastDialogMessage = ''; // reset

      // Input CAPTCHA answer
      console.log(`[KRA Nil Return] Feeding CAPTCHA answer: ${captchaAnswer}`);
      const captchaInput = page.locator('#captcahText');
      await captchaInput.waitFor({ state: 'visible', timeout: 5000 });
      await captchaInput.click();
      await captchaInput.fill(captchaAnswer.trim());

      // Click Login button
      console.log('[KRA Nil Return] Clicking Login submit...');
      const loginBtn = page.locator('input[value="Login"], input[type="submit"], button:has-text("Login"), #btnSubmit').first();
      await loginBtn.click();

      // Wait to verify if login completes or KRA throws an alert dialog (e.g. wrong captcha)
      let loginSuccess = false;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(500);
        if (session.lastDialogMessage) {
          console.log(`[KRA Nil Return] Login failure dialog detected: ${session.lastDialogMessage}`);
          break;
        }
        const isDashboard = await page.isVisible('text=File Nil Return');
        if (isDashboard) {
          loginSuccess = true;
          break;
        }
      }

      if (!loginSuccess) {
        const errorMsg = session.lastDialogMessage || 'Login failed. Please verify credentials and captcha answer.';
        session.lastDialogMessage = ''; // reset

        // KRA automatically changes the CAPTCHA on failed logins. Screenshot the new one.
        console.log('[KRA Nil Return] Capturing refreshed CAPTCHA...');
        const captchaElement = page.locator('#captcha_img');
        await captchaElement.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
        const captchaBuffer = await captchaElement.screenshot().catch(() => null);
        const newCaptchaBase64 = captchaBuffer ? `data:image/png;base64,${captchaBuffer.toString('base64')}` : null;

        return NextResponse.json({
          success: false,
          error: errorMsg,
          captchaImage: newCaptchaBase64,
        });
      }

      // Login Successful! Navigate to Returns filing page
      console.log('[KRA Nil Return] Login successful! Navigating to Nil returns page...');
      
      try {
        await page.goto('https://itax.kra.go.ke/KRA-Portal/eReturns.htm?actionCode=loadPage&nilReturnFlag=Y&amendmentFlag=N', {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Select Obligation: Individual (value 2)
        console.log('[KRA Nil Return] Selecting Obligation...');
        const obligationDropdown = page.locator('#regType');
        await obligationDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await obligationDropdown.selectOption('2');

        // Click Next
        await page.getByRole('button', { name: 'Next' }).click();

        await page.waitForTimeout(3000);
        if (session.lastDialogMessage && (
          session.lastDialogMessage.toLowerCase().includes('cannot file') ||
          session.lastDialogMessage.toLowerCase().includes('already filed') ||
          session.lastDialogMessage.toLowerCase().includes('error') ||
          session.lastDialogMessage.toLowerCase().includes('invalid')
        )) {
          throw new Error(`KRA Blocker: ${session.lastDialogMessage}`);
        }

        // Submit Nil Returns
        console.log('[KRA Nil Return] Submitting Returns form...');
        const submitBtn = page.getByRole('button', { name: 'Submit' });
        await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
        await submitBtn.click();

        // Download receipt
        console.log('[KRA Nil Return] Awaiting acknowledgement returns receipt...');
        const downloadReceiptLink = page.getByRole('link', { name: 'Download Returns Receipt' });
        try {
          await downloadReceiptLink.waitFor({ state: 'visible', timeout: 20000 });
        } catch (err) {
          if (session.lastDialogMessage) {
            throw new Error(`Submission Error: ${session.lastDialogMessage}`);
          }
          throw new Error('Failed to reach receipt download page. Check KRA filing constraints.');
        }

        // Capture PDF Receipt Download
        const downloadPromise = page.waitForEvent('download');
        await downloadReceiptLink.click();
        const download = await downloadPromise;
        const tempPath = await download.path();

        if (!tempPath) {
          throw new Error('Failed to retrieve the receipt file path from browser download.');
        }

        const pdfBuffer = await readFile(tempPath);
        const pdfBase64 = pdfBuffer.toString('base64');

        console.log('[KRA Nil Return] Returns successfully filed! PDF receipt generated.');

        return NextResponse.json({
          success: true,
          message: 'KRA Nil Return successfully filed!',
          receiptPdfBase64: pdfBase64,
        });

      } catch (filingErr: any) {
        console.error('[KRA Nil Return Filing Error]:', filingErr.message);
        return NextResponse.json({
          success: false,
          error: filingErr.message || 'Filing automation failed during returns submission.'
        }, { status: 500 });
      } finally {
        await browser.close().catch(() => {});
        activeSessions.delete(sessionId);
      }
    }

    if (action === 'cancel') {
      if (sessionId) {
        const session = activeSessions.get(sessionId);
        if (session) {
          console.log(`[KRA Nil Return] Explicit cancel requested. Closing session: ${sessionId}`);
          await session.browser.close().catch(() => {});
          activeSessions.delete(sessionId);
        }
      }
      return NextResponse.json({ success: true, message: 'Session closed successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter specified' }, { status: 400 });

  } catch (error: any) {
    console.error('[KRA Nil Return Automation Error]:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Filing automation failed. Please try again.',
    }, { status: 500 });
  }
}
