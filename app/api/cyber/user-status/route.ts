import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { isAdminUser } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const clerkId = session.userId;
    const user = await currentUser();
    const isAdmin = await isAdminUser(clerkId);

    const db = prisma as any;

    // Search for CyberCafe linked by clerkUserId or user's phone
    let cafe = await db.cyberCafe.findFirst({
      where: {
        clerkUserId: clerkId,
      },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Fallback: check by user's phone number if not found by clerkUserId
    if (!cafe && user) {
      const phones = user.phoneNumbers.map(p => p.phoneNumber.replace(/\D/g, '')).filter(Boolean);
      for (const phone of phones) {
        let normalized = phone;
        if (normalized.startsWith('0')) normalized = '254' + normalized.slice(1);
        else if (normalized.startsWith('7') || normalized.startsWith('1')) normalized = '254' + normalized;

        const matchedCafe = await db.cyberCafe.findFirst({
          where: {
            OR: [
              { whatsappPhone: normalized },
              { paymentPhone: normalized },
            ],
          },
          include: {
            invoices: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        });

        if (matchedCafe) {
          // Link this cafe to the Clerk user ID for future fast lookups
          await db.cyberCafe.update({
            where: { id: matchedCafe.id },
            data: { clerkUserId: clerkId },
          });
          cafe = matchedCafe;
          break;
        }
      }
    }

    if (!cafe) {
      return NextResponse.json({
        success: true,
        hasSubscription: false,
        isAdmin,
        cafe: null,
        daysRemaining: 0,
        invoices: [],
      });
    }

    const now = new Date();
    const isExpired = !cafe.expiresAt || new Date(cafe.expiresAt) <= now;
    const daysRemaining = isExpired ? 0 : Math.max(0, Math.ceil((new Date(cafe.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Auto-update status to expired if date passed
    if (isExpired && cafe.status === 'active') {
      await db.cyberCafe.update({
        where: { id: cafe.id },
        data: { status: 'expired' },
      });
      cafe.status = 'expired';
    }

    return NextResponse.json({
      success: true,
      hasSubscription: true,
      isActive: cafe.status === 'active' && !isExpired,
      isAdmin,
      daysRemaining,
      cafe: {
        id: cafe.id,
        cafeName: cafe.cafeName,
        ownerName: cafe.ownerName,
        whatsappPhone: cafe.whatsappPhone,
        paymentPhone: cafe.paymentPhone,
        status: cafe.status,
        expiresAt: cafe.expiresAt,
        totalDownloads: cafe.totalDownloads,
        dailyDownloads: cafe.dailyDownloads,
      },
      invoices: cafe.invoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        currency: inv.currency,
        mpesaReceipt: inv.mpesaReceipt,
        status: inv.status,
        createdAt: inv.createdAt,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
      })),
    });
  } catch (error: any) {
    console.error('[api/cyber/user-status] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
