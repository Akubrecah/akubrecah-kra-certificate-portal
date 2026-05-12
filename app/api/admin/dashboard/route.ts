import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
          console.warn(`[DASHBOARD_API] Forbidden access attempt by user: ${userId}`);
          return new NextResponse('Forbidden', { status: 403 });
        }
      } catch (error) {
        console.error('[DASHBOARD_API] Admin verification fallback failed:', error);
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    let totalUsers = 0;
    try {
      const client = await clerkClient();
      totalUsers = await client.users.getCount();
    } catch (clerkError) {
      console.error('[DASHBOARD_API] Clerk API Error:', clerkError);
    }

    try {
      // 2. Get metrics from Prisma with individual try-catch for resilience
      let totalReturns = 0;
      let sessionCount = 0;
      try {
        totalReturns = await prisma.session.count({ where: { status: 'completed' } });
        sessionCount = await prisma.session.count();
      } catch (e) {
        console.error('[DASHBOARD_API] Error fetching session counts:', e);
      }
      
      // 3. Get recent activities (User + Session)
      let userActivities: any[] = [];
      try {
        userActivities = await prisma.userActivity.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true }
        });
      } catch (e) {
        console.error('[DASHBOARD_API] Error fetching user activities:', e);
      }

      let sessionActivities: any[] = [];
      try {
        sessionActivities = await prisma.sessionActivity.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { session: true }
        });
      } catch (e) {
        console.error('[DASHBOARD_API] Error fetching session activities:', e);
      }

      const recentActivity = [
        ...userActivities.map(a => ({
          id: a.id,
          type: a.activityType,
          title: (a.activityType || 'Activity').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: a.description,
          time: a.createdAt,
          status: a.status === 'success' ? 'completed' : a.status === 'error' ? 'failed' : 'pending',
          user: a.user ? (`${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user.email) : 'System User',
        })),
        ...sessionActivities.map(a => ({
          id: a.id,
          type: 'return',
          title: (a.activityType || 'Return').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: a.description || `Session activity for PIN: ${a.session?.pin || 'Unknown'}`,
          time: a.createdAt,
          status: 'completed',
          user: a.session?.pin || 'Guest User',
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

      // 4. Calculate real user trend data (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let userMetrics = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { name: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), users: 0 };
      });

      try {
        const userMetricsRaw = await prisma.user.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true }
        });

        userMetrics = userMetrics.map(metric => {
          const count = userMetricsRaw.filter(u => {
            const d = new Date(u.createdAt);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) === metric.name;
          }).length;
          return { ...metric, users: count };
        });
      } catch (e) {
        console.error('[DASHBOARD_API] Error fetching user metrics:', e);
      }

      // 5. Calculate real returns trend (last 7 days)
      let returnsData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { name: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), completed: 0, pending: 0, failed: 0 };
      });

      try {
        const returnsMetricsRaw = await prisma.userActivity.findMany({
          where: { 
            activityType: 'document',
            createdAt: { gte: sevenDaysAgo }
          },
          select: { createdAt: true, status: true }
        });

        returnsData = returnsData.map(metric => {
          const filtered = returnsMetricsRaw.filter(r => 
            new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) === metric.name
          );
          const completed = filtered.filter(r => r.status === 'success').length;
          const failed = filtered.filter(r => r.status === 'error').length;
          return { ...metric, completed, failed };
        });
      } catch (e) {
        console.error('[DASHBOARD_API] Error fetching returns metrics:', e);
      }

      // 6. PIN Type Breakdown
      let pinCount = 0;
      try {
        pinCount = await prisma.userActivity.count({ where: { activityType: 'return' } });
      } catch (e) {
        console.error('[DASHBOARD_API] Error fetching pin count:', e);
      }
      
      const pinBreakdown = [
        { name: 'Individual', value: pinCount || 1 },
        { name: 'Business', value: 0 }
      ];

      return NextResponse.json({
        totals: {
          users: totalUsers,
          revenue: 0,
          returns: totalReturns || (returnsData.reduce((acc, curr) => acc + curr.completed, 0)),
          successRate: sessionCount > 0 ? (totalReturns / sessionCount) * 100 : 0,
        },
        userMetrics,
        pinBreakdown,
        returnsData,
        recentActivity,
        success: true
      });
    } catch (prismaError) {
      console.error('[DASHBOARD_API] Unexpected Prisma Error:', prismaError);
      return new NextResponse('Database connectivity issue', { status: 500 });
    }
  } catch (error: any) {
    console.error('[DASHBOARD_API] Unhandled Error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
