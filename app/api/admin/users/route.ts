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
          await prisma.user.upsert({
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
    const formattedUsers = clerkUsers.map(u => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous',
      email: u.emailAddresses[0]?.emailAddress || 'N/A',
      image: u.imageUrl,
      status: 'active', // Clerk doesn't have a simple 'active' status like mock
      role: (u.publicMetadata?.role as string) || 'user',
      registeredAt: new Date(u.createdAt).toISOString(),
      lastActive: new Date(u.lastSignInAt || u.updatedAt).toISOString(),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
