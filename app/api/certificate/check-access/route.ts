import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/subscription';

export const maxDuration = 10;

// Official KRA Certificate download fee is strictly KES 20 ("20 bob")
const DOWNLOAD_FEE_KES = 20;

export async function GET(req: NextRequest) {
  try {
    let isAdmin = false;
    try {
      const session = await auth();
      if (session?.userId) {
        isAdmin = await isAdminUser(session.userId);
      }
    } catch {
      // Guest / unauthenticated request
    }

    // Admin users bypass the fee
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        access: 'admin',
        feeKes: 0,
        subscription: null,
      });
    }

    // Standard user or guest: strictly KES 20 per certificate download
    return NextResponse.json({
      success: true,
      access: 'pay_per_download',
      feeKes: DOWNLOAD_FEE_KES,
      subscription: null,
    });
  } catch (error: any) {
    console.error('[check-access] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
