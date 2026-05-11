import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';
import { logUserActivity } from '@/lib/activity-logger';


export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the current user is an admin
    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    
    if (!isAdminUser(currentUser)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch users from Clerk
    const clerkUsersResponse = await client.users.getUserList({
      limit: 100,
      orderBy: '-created_at',
    });

    const clerkUsers = clerkUsersResponse.data;
    const clerkIds = clerkUsers.map(u => u.id);

    // Fetch all corresponding users from database in one query
    const dbUsers = await prisma.user.findMany({
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
    });

    // Map Clerk data to a consistent format for the frontend
    const formattedUsers = clerkUsers.map((u) => {
      const dbUser = dbUsers.find(dbu => dbu.clerkId === u.id);
      
      // Get last PIN from nested activities (pre-fetched)
      let lastPin = 'N/A';
      if (dbUser && dbUser.activities.length > 0) {
        const metadata = dbUser.activities[0].metadata as any;
        lastPin = metadata.pin || 'N/A';
      }

      return {
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous',
        email: u.emailAddresses[0]?.emailAddress || 'N/A',
        image: u.imageUrl,
        pin: lastPin,
        status: u.lastSignInAt ? 'active' : 'inactive',
        role: (u.publicMetadata?.role as string) || 'user',
        registeredAt: new Date(u.createdAt).toISOString(),
        lastActive: new Date(u.lastSignInAt || u.updatedAt).toISOString(),
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
