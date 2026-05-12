import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
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
        console.error('[ACTIVITIES_API] Admin verification fallback failed:', error);
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const clerkId = searchParams.get('clerkId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const userWhere: any = {};
    if (type && type !== 'all') userWhere.activityType = type;
    if (clerkId) userWhere.user = { clerkId };

    // Fetch activities from UserActivity
    const userActivities = await prisma.userActivity.findMany({
      where: userWhere,
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Fetch activities from SessionActivity (more system-level/anonymous)
    const sessionActivities = await prisma.sessionActivity.findMany({
      include: {
        session: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Combine and format
    const formattedUserActivities = userActivities.map(a => ({
      id: a.id,
      type: a.activityType,
      title: (a.activityType || 'Activity').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: a.description || '',
      timestamp: a.createdAt,
      status: a.status,
      user: a.user ? (`${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user.email) : 'System User',
    }));

    const formattedSessionActivities = sessionActivities.map(a => ({
      id: a.id,
      type: 'return', // Map session activity to 'return' type for UI
      title: (a.activityType || 'Return').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: a.description || `Session activity for PIN: ${a.session?.pin || 'Unknown'}`,
      timestamp: a.createdAt,
      status: 'success', // Default for session activities
      user: a.session?.pin || 'Guest User',
    }));

    // Merge and sort by timestamp
    const allActivities = [...formattedUserActivities, ...formattedSessionActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json(allActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
