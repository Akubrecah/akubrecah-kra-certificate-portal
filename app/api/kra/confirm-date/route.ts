import { NextRequest, NextResponse } from 'next/server';
import kraService from '@/lib/services/kraService';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/kra/confirm-date
 * Asynchronously query the static KRA Pin Checker to extract and verify the exact registration date
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN is required' }, { status: 400 });
    }

    console.log(`[CONFIRM-DATE] Triggering lazy verification for PIN: ${pin}`);
    let exactDate = await kraService.fetchEffectiveDateFromPinChecker(pin);
    if (!exactDate) {
      exactDate = (kraService as any).derivePrimaryRegistrationDate(pin);
      console.log(`[CONFIRM-DATE] Fallback: derived primary date: ${exactDate}`);
    }

    return NextResponse.json({ 
      success: true, 
      registeredDate: exactDate || '' 
    });
  } catch (error: any) {
    console.error('API Error in KRA date confirmation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
