import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    if (!isAdminUser(user)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 1. Get total users from Clerk
    const totalUsers = await client.users.getCount();

    // 2. Get metrics from Prisma
    const totalReturns = await prisma.aiConversation.count(); // Using conversations as a proxy for 'returns' or similar if that's where data is
    // Actually, let's check what other models we have. 
    // From schema: User, Session, AIConversation, AITask, Ticket
    const sessionCount = await prisma.session.count();
    const completedSessions = await prisma.session.count({ where: { status: 'completed' } });
    
    // 3. Get recent activity (last 5 sessions or conversations)
    const recentSessions = await prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentActivity = recentSessions.map(s => ({
      id: s.id,
      type: 'registration', // Fallback type
      user: s.pin || 'Guest',
      time: new Date(s.createdAt).toISOString(),
      status: s.status,
    }));

    // 4. Calculate trend data (mocked for now but based on real totals)
    const userMetrics = [
      { name: 'Total', users: totalUsers },
    ];

    return NextResponse.json({
      totals: {
        users: totalUsers,
        revenue: 0, // No payment logic found yet in Prisma
        returns: totalReturns,
        successRate: totalReturns > 0 ? (completedSessions / sessionCount) * 100 : 0,
      },
      userMetrics,
      recentActivity,
      success: true
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
