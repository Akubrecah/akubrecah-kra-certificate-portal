import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const maxDuration = 10;

const DOWNLOAD_FEE_KES = 30;

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // 1. Look up the user's DB record by clerkId
    const db = prisma as any;

    const dbUser = await db.users?.findFirst({ where: { clerkId: userId } });

    if (!dbUser) {
      // User exists in Clerk but not synced to DB yet — treat as no subscription
      return NextResponse.json({
        success: true,
        access: 'pay_per_download',
        feeKes: DOWNLOAD_FEE_KES,
        subscription: null,
      });
    }

    // 2. Check for an active subscription
    const now = new Date();
    const activeSub = await db.subscriptions?.findFirst({
      where: {
        userId: dbUser.id,
        status: 'active',
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (activeSub) {
      return NextResponse.json({
        success: true,
        access: 'subscription',
        feeKes: 0,
        subscription: {
          id: activeSub.id,
          planName: activeSub.planName,
          expiresAt: activeSub.expiresAt,
        },
      });
    }

    // 3. No active subscription — must pay per download
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
