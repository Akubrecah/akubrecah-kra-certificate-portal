import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!isAdminUser(sessionClaims)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const returns = await prisma.userActivity.findMany({
      where: {
        activityType: {
          in: ['GENERATE_CERTIFICATE', 'KRA_RETURN_FILING']
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedReturns = returns.map(ret => ({
      id: ret.id,
      userName: ret.user ? `${ret.user.firstName || ''} ${ret.user.lastName || ''}`.trim() || 'Anonymous' : 'Deleted User',
      userEmail: ret.user?.email || 'N/A',
      pinNumber: (ret.metadata as any)?.pin || 'N/A',
      authorizedBy: (ret.metadata as any)?.authorizedBy || 'System',
      submissionDate: ret.createdAt ? ret.createdAt.toISOString() : new Date().toISOString(),
      status: ret.status,
      amount: (ret.metadata as any)?.amount || 0,
      activityType: ret.activityType,
      description: ret.description || 'KRA Certificate Generation'
    }));

    return NextResponse.json(formattedReturns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
