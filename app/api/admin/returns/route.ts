import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Quick check using session claims
    if (!isAdminUser(sessionClaims)) {
      // Fallback: Fetch full user object from Clerk for definitive verification
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (!isAdminUser(user)) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      } catch (error) {
        console.error('[RETRIEVALS_API] Admin verification fallback failed:', error);
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const returns = await prisma.userActivity.findMany({
      where: {
        activityType: {
          in: ['document', 'return', 'GENERATE_CERTIFICATE', 'KRA_RETURN_FILING']
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    const formattedReturns = returns.map(ret => {
      try {
        const metadata = (ret.metadata as any) || {};
        return {
          id: ret.id,
          userName: ret.user ? `${ret.user.firstName || ''} ${ret.user.lastName || ''}`.trim() || 'Anonymous' : 'Guest User',
          userEmail: ret.user?.email || 'N/A',
          pinNumber: metadata.pin || 'N/A',
          authorizedBy: metadata.authorizedBy || 'System',
          submissionDate: ret.createdAt ? (ret.createdAt instanceof Date ? ret.createdAt.toISOString() : new Date(ret.createdAt).toISOString()) : new Date().toISOString(),
          status: ret.status === 'success' ? 'completed' : ret.status === 'error' ? 'failed' : ret.status,
          amount: metadata.amount || 0,
          activityType: ret.activityType,
          description: ret.description || 'KRA Retrieval'
        };
      } catch (err) {
        console.error(`[ADMIN_RETRIEVALS] Error mapping record ${ret.id}:`, err);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json(formattedReturns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
