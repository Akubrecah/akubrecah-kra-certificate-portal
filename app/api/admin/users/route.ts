import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';
import kraService from '@/lib/services/kraService';
import { logUserActivity } from '@/lib/activity-logger';
import fs from 'fs';
import path from 'path';

// Force Vercel NFT to bundle eng.traineddata by referencing it statically
if (process.env.STATIC_TRACE) {
  fs.readFileSync(path.join(process.cwd(), 'eng.traineddata'));
}

export const maxDuration = 60; // Prevent Vercel timeouts

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!isAdminUser(sessionClaims)) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (!isAdminUser(user)) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      } catch (error) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({
      limit: 500,
    });

    const clerkUsers = Array.isArray(clerkUsersResponse) 
      ? clerkUsersResponse 
      : (clerkUsersResponse.data || []);

    const clerkIds = clerkUsers.map(u => u.id);

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

    const pins = dbUsers.flatMap(u => u.activities.map(a => (a.metadata as any)?.pin)).filter(Boolean) as string[];
    const uniquePins = [...new Set(pins)];
    
    let kraCache: Record<string, string | null> = {};
    if (uniquePins.length > 0) {
      const cacheRecords = await prisma.kRAPinCache.findMany({
        where: { pin: { in: uniquePins } },
        select: { pin: true, registeredDate: true }
      });
      for (const record of cacheRecords) {
        kraCache[record.pin] = record.registeredDate;
      }
    }

    // Identify PINs missing dates or having fallback dates
    const missingPins = uniquePins.filter(pin => {
      const d = kraCache[pin];
      if (!d) return true;
      // Check if it looks like a fallback date (today's date)
      const today = new Date();
      const fallbackStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      return d === fallbackStr;
    });

    // Attempt live fetch for up to 3 missing PINs to avoid timeouts
    if (missingPins.length > 0) {
      const toFetch = missingPins.slice(0, 3);
      await Promise.all(toFetch.map(async (pin) => {
        try {
          console.log(`[API/Users] Fetching LIVE exact date for PIN ${pin} via kraService...`);
          const exactDate = await kraService.fetchEffectiveDateFromPinChecker(pin);
          if (exactDate) {
            kraCache[pin] = exactDate;
            await prisma.kRAPinCache.updateMany({
              where: { pin: pin },
              data: { registeredDate: exactDate }
            });
          }
        } catch (err) {
          console.error(`[API/Users] Live fetch failed for ${pin}:`, err);
        }
      }));
    }

    const formattedUsers = clerkUsers.map((u) => {
      const dbUser = dbUsers.find(dbu => dbu.clerkId === u.id);
      
      let lastPin = 'N/A';
      let kraRegDate = null;
      if (dbUser && dbUser.activities && dbUser.activities.length > 0) {
        const metadata = dbUser.activities[0].metadata as any;
        lastPin = metadata.pin || 'N/A';
        if (lastPin !== 'N/A' && kraCache[lastPin]) {
          kraRegDate = kraCache[lastPin];
        }
      }

      let registeredAt = u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString();
      if (kraRegDate) {
        if (kraRegDate.includes('/')) {
          const parts = kraRegDate.split('/');
          if (parts.length === 3) {
            registeredAt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`).toISOString();
          }
        } else {
          try {
             const d = new Date(kraRegDate);
             if (!isNaN(d.getTime())) registeredAt = d.toISOString();
          } catch(e) {}
        }
      }

      return {
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous',
        email: u.emailAddresses && u.emailAddresses[0] ? u.emailAddresses[0].emailAddress : 'N/A',
        image: u.imageUrl,
        pin: lastPin,
        status: u.lastSignInAt ? 'active' : 'inactive',
        role: (u.publicMetadata?.role as string) || 'user',
        registeredAt: registeredAt,
        exactKraDate: kraRegDate,
        lastActive: new Date(u.lastSignInAt || u.updatedAt || Date.now()).toISOString(),
      };
    });

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
