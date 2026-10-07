import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/subscription';

export const maxDuration = 10;

// Official KRA Certificate download fee is fixed at KES 20 (monthly subscriptions decommissioned)
const DOWNLOAD_FEE_KES = 20;

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Admin users bypass the fee
    const adminAccess = await isAdminUser(userId);
    if (adminAccess) {
      return NextResponse.json({
        success: true,
        access: 'admin',
        feeKes: 0,
        subscription: null,
      });
    }

    // Standard user: KES 20 per certificate download
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
