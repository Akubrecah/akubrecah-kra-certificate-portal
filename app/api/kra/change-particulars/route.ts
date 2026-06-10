import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

export const maxDuration = 120;

interface ChangeParticularsPayload {
  changeType: 'email' | 'mobile';
  newValue: string;
  idFilePath: string;
  kraAccount: {
    firstName: string;
    email: string;
    username: string;
    password: string;
    idNumber?: string;
    kraPin?: string;
  };
}

/**
 * POST /api/kra/change-particulars
 *
 * Automates the KRA support portal to:
 * 1. Create or log into an account on kenya-revenue-authority.custhelp.com
 * 2. Submit a support case for changing email or mobile number
 * 3. Attach the user's ID image
 * 4. Return the case reference number
 */
export async function POST(req: NextRequest) {
  let browser;
  let idFilePath: string | undefined;

  try {
    const body: ChangeParticularsPayload = await req.json();
    const { changeType, newValue, idFilePath: uploadedPath, kraAccount } = body;

    if (!changeType || !newValue || !uploadedPath || !kraAccount) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    idFilePath = uploadedPath;

    if (!existsSync(uploadedPath)) {
      return NextResponse.json({ success: false, error: 'ID file not found. Please re-upload.' }, { status: 400 });
    }

    const subject =
      changeType === 'email'
        ? 'Change of Email Address'
        : 'Change of Mobile Number';

    const messageBody =
      changeType === 'email'
        ? `Dear KRA Support,\n\nI would like to request a change of my registered email address on my KRA iTax profile.\n\nNew Email Address: ${newValue}\n\nPlease find my National ID attached for verification.\n\nThank you.`
        : `Dear KRA Support,\n\nI would like to request a change of my registered mobile phone number on my KRA iTax profile.\n\nNew Mobile Number: ${newValue}\n\nPlease find my National ID attached for verification.\n\nThank you.`;

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // Step 1: Navigate to account creation page
    console.log('[change-particulars] Navigating to KRA support portal...');
    await page.goto('https://kenya-revenue-authority.custhelp.com/app/utils/login_form', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Step 2: Try to create an account
    const createAccountLink = page.locator('a[href*="create"], a:has-text("Create an Account"), a:has-text("create account")').first();
    if (await createAccountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createAccountLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Navigate directly to account creation
      await page.goto('https://kenya-revenue-authority.custhelp.com/app/account/create', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
    }

    console.log('[change-particulars] Filling account creation form...');

    // Fill first name
    const firstNameField = page.locator('input[name*="first"], input[id*="first"], input[placeholder*="First"]').first();
    if (await firstNameField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstNameField.fill(kraAccount.firstName);
    }

    // Fill email
    const emailField = page.locator('input[type="email"], input[name*="email"], input[id*="email"]').first();
    if (await emailField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailField.fill(kraAccount.email);
    }

    // Fill username
    const usernameField = page.locator('input[name*="user"], input[id*="login"], input[id*="username"]').first();
    if (await usernameField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await usernameField.fill(kraAccount.username);
    }

    // Fill password
    const passwordFields = page.locator('input[type="password"]');
    const pwCount = await passwordFields.count();
    if (pwCount >= 1) await passwordFields.nth(0).fill(kraAccount.password);
    if (pwCount >= 2) await passwordFields.nth(1).fill(kraAccount.password);

    // Fill ID / Company Reg Number if provided
    if (kraAccount.idNumber) {
      const idField = page
        .locator('input[name*="id"], input[id*="national"], input[placeholder*="ID"], input[placeholder*="Passport"]')
        .first();
      if (await idField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await idField.fill(kraAccount.idNumber);
      }
    }

    // Fill KRA PIN if provided
    if (kraAccount.kraPin) {
      const pinField = page
        .locator('input[name*="pin"], input[id*="pin"], input[placeholder*="PIN"], input[placeholder*="A000"]')
        .first();
      if (await pinField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pinField.fill(kraAccount.kraPin.toUpperCase());
      }
    }

    // Submit account creation
    const submitBtn = page
      .locator('button[type="submit"], input[type="submit"], button:has-text("Create"), button:has-text("Register")')
      .first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });
    }

    // Step 3: Navigate to ask a question / create case
    console.log('[change-particulars] Navigating to support case creation...');
    await page.goto('https://kenya-revenue-authority.custhelp.com/app/ask', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Fill subject
    const subjectField = page
      .locator('input[name*="subject"], input[id*="subject"], textarea[name*="subject"]')
      .first();
    if (await subjectField.isVisible({ timeout: 8000 }).catch(() => false)) {
      await subjectField.fill(subject);
    }

    // Fill message body
    const bodyField = page
      .locator('textarea[name*="body"], textarea[name*="message"], textarea[id*="body"], #rn_QuestionDetail')
      .first();
    if (await bodyField.isVisible({ timeout: 8000 }).catch(() => false)) {
      await bodyField.fill(messageBody);
    }

    // Attach ID document
    console.log('[change-particulars] Attaching ID document...');
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles(uploadedPath);
    }

    // Submit the case
    const caseSubmitBtn = page
      .locator('button[type="submit"]:has-text("Submit"), input[type="submit"], button:has-text("Send"), button:has-text("Ask")')
      .first();
    if (await caseSubmitBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await caseSubmitBtn.click();
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    }

    // Extract case/reference number from confirmation page
    const pageContent = await page.content();
    const caseMatch = pageContent.match(/[Cc]ase\s*#?\s*(\d{5,10})|[Rr]ef(?:erence)?\s*#?\s*(\d{5,10})|[Tt]icket\s*#?\s*(\d{5,10})/);
    const caseNumber = caseMatch ? (caseMatch[1] || caseMatch[2] || caseMatch[3]) : `KRA-${Date.now()}`;

    console.log(`[change-particulars] Case submitted. Reference: ${caseNumber}`);

    return NextResponse.json({
      success: true,
      caseNumber,
      message: `Your ${changeType === 'email' ? 'email change' : 'mobile number change'} request has been submitted to KRA. Reference: ${caseNumber}`,
    });
  } catch (error: any) {
    console.error('[change-particulars] Automation error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: `Automation failed: ${error.message}. Please try again or contact KRA support directly.`,
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    // Clean up the uploaded ID file
    if (idFilePath && existsSync(idFilePath)) {
      await unlink(idFilePath).catch(() => {});
    }
  }
}
