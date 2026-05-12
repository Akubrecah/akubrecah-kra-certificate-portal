import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';
import { logUserActivity } from '@/lib/activity-logger';


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
        console.error('[ADMIN_API] Admin verification fallback failed:', error);
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const client = await clerkClient();

    // Fetch users from Clerk - increased limit
    // Note: Removing potentially problematic orderBy string to ensure compatibility
    const clerkUsersResponse = await client.users.getUserList({
      limit: 500,
    });

    // Handle both potential response formats (PaginatedResourceResponse or direct array)
    const clerkUsers = Array.isArray(clerkUsersResponse) 
      ? clerkUsersResponse 
      : (clerkUsersResponse.data || []);

    if (clerkUsers.length === 0) {
      console.warn('[ADMIN_USERS_API] No users returned from Clerk getUserList');
    }

    const clerkIds = clerkUsers.map(u => u.id);

    // Fetch all corresponding users from database in one query
    const dbUsers = clerkIds.length > 0 
      ? await prisma.user.findMany({
          where: { clerkId: { in: clerkIds } },
          include: {
            activities: {
              where: { 
                activityType: 'return',
                status: 'success'
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        })
      : [];

    // Map Clerk data to a consistent format for the frontend
    const formattedUsers = clerkUsers.map((u) => {
      const dbUser = dbUsers.find(dbu => dbu.clerkId === u.id);
      
      // Get last PIN from nested activities (pre-fetched)
      let lastPin = 'N/A';
      if (dbUser && dbUser.activities && dbUser.activities.length > 0) {
        const metadata = dbUser.activities[0].metadata as any;
        lastPin = metadata.pin || 'N/A';
      }

      return {
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous',
        email: u.emailAddresses && u.emailAddresses[0] ? u.emailAddresses[0].emailAddress : 'N/A',
        image: u.imageUrl,
        pin: lastPin,
        status: u.lastSignInAt ? 'active' : 'inactive',
        role: (u.publicMetadata?.role as string) || 'user',
        registeredAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        lastActive: new Date(u.lastSignInAt || u.updatedAt || Date.now()).toISOString(),
      };
    });

    // Sort by registration date descending manually to be safe
    formattedUsers.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST() {
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
        console.error('[ADMIN_API] Admin verification fallback failed:', error);
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({ limit: 500 });
    
    // Handle both potential response formats
    const clerkUsers = Array.isArray(clerkUsersResponse) 
      ? clerkUsersResponse 
      : (clerkUsersResponse.data || []);

    let syncCount = 0;
    for (const u of clerkUsers) {
      await prisma.user.upsert({
        where: { clerkId: u.id },
        update: {
          email: u.emailAddresses && u.emailAddresses[0] ? u.emailAddresses[0].emailAddress : '',
          firstName: u.firstName,
          lastName: u.lastName,
          profileImage: u.imageUrl,
          role: (u.publicMetadata?.role as string) || 'user',
        },
        create: {
          clerkId: u.id,
          email: u.emailAddresses && u.emailAddresses[0] ? u.emailAddresses[0].emailAddress : '',
          firstName: u.firstName,
          lastName: u.lastName,
          profileImage: u.imageUrl,
          role: (u.publicMetadata?.role as string) || 'user',
        },
      });
      syncCount++;
    }

    return NextResponse.json({ success: true, synced: syncCount });
  } catch (error) {
    console.error('Error syncing users:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
