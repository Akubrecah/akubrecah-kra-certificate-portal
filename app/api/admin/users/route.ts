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
    const user = await client.users.getUser(userId);
    
    if (!isAdminUser(user)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch users from Clerk
    const clerkUsersResponse = await client.users.getUserList({
      limit: 100,
      orderBy: '-created_at',
    });

    const clerkUsers = clerkUsersResponse.data;

    // Optional: Sync with Prisma database
    // This ensures that the 'users' table is populated with Clerk users
    for (const clerkUser of clerkUsers) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        try {
          const newUser = await prisma.user.upsert({
            where: { clerkId: clerkUser.id },
            update: {
              email,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              profileImage: clerkUser.imageUrl,
              lastLogin: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : undefined,
            },
            create: {
              clerkId: clerkUser.id,
              email,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              profileImage: clerkUser.imageUrl,
              role: (clerkUser.publicMetadata?.role as string) || 'user',
            },
          });

          // Log activity for the synced user
          await logUserActivity({
            userId: newUser.id,
            activityType: 'auth',
            description: `User synced from Clerk: ${email}`,
            status: 'success',
            metadata: {
              clerkId: clerkUser.id,
              source: 'admin_sync'
            }
          });

        } catch (e) {
          console.error(`Error upserting user ${clerkUser.id}:`, e);
        }
      }
    }

    // Fetch synced users from database to get additional metadata if any
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Map Clerk data to a consistent format for the frontend
    const formattedUsers = await Promise.all(clerkUsers.map(async (u) => {
      // Find the most recent PIN retrieved by this user from their activity logs
      const dbUser = dbUsers.find(dbu => dbu.clerkId === u.id);
      let lastPin = 'N/A';
      
      if (dbUser) {
        const latestActivity = await prisma.userActivity.findFirst({
          where: { 
            userId: dbUser.id,
            activityType: 'return',
            status: 'success'
          },
          orderBy: { createdAt: 'desc' }
        });
        
        if (latestActivity && latestActivity.metadata) {
          const metadata = latestActivity.metadata as any;
          lastPin = metadata.pin || 'N/A';
        }
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
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
