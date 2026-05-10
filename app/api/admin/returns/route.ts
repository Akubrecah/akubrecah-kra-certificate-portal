import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the current user is an admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    if (!isAdminUser(user)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch returns (UserActivity with activityType 'document' or 'return')
    // We'll also fetch 'Session' data if needed, but UserActivity is more like a log of events.
    const returns = await prisma.userActivity.findMany({
      where: {
        OR: [
          { activityType: 'document' },
          { activityType: 'return' }
        ]
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            clerkId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedReturns = returns.map(ret => {
      const metadata = (ret.metadata as any) || {};
      return {
        id: ret.id,
        userName: `${ret.user.firstName || ''} ${ret.user.lastName || ''}`.trim() || ret.user.email || 'Unknown',
        userEmail: ret.user.email,
        pinNumber: metadata.pin || 'N/A',
        authorizedBy: ret.authorizedBy || metadata.authorizedBy || 'System',
        submissionDate: ret.createdAt.toISOString(),
        status: ret.status,
        amount: ret.amount || metadata.amount || 0,
        activityType: ret.activityType,
        description: ret.description
      };
    });

    return NextResponse.json(formattedReturns);
  } catch (error) {
    console.error('Error fetching admin returns:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
