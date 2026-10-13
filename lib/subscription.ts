import prisma from '@/lib/prisma';

/**
 * Determines if a Clerk user is a super admin / admin.
 * Checks email against env-configured admin emails and Clerk publicMetadata role.
 */
export async function isAdminUser(clerkId?: string | null): Promise<boolean> {
  if (!clerkId) return false;
  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(clerkId);
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
    const configAdmin = (process.env.SUPER_ADMIN_EMAIL || 'poweldayck@gmail.com').toLowerCase();
    const publicAdmin = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'poweldayck@gmail.com').toLowerCase();
    return (
      email === 'poweldayck@gmail.com' ||
      email === configAdmin ||
      email === publicAdmin ||
      user.publicMetadata?.role === 'Super Admin' ||
      user.publicMetadata?.role === 'Admin'
    );
  } catch {
    return false;
  }
}

export interface UserSubscriptionStatus {
  isSubscribed: boolean;
  subscription: {
    id: string;
    planName: string;
    amountPaid: number;
    currency: string;
    expiresAt: Date;
    status: string;
    daysRemaining?: number;
    cafeName?: string;
    ownerName?: string;
  } | null;
  userId: string | null;
}

/**
 * Checks whether a given Clerk user has an active, valid subscription.
 * Admin users are always considered subscribed and bypass the DB lookup.
 */
export async function getUserSubscriptionStatus(clerkId?: string | null): Promise<UserSubscriptionStatus> {
  if (!clerkId) {
    return { isSubscribed: false, subscription: null, userId: null };
  }

  // Admins are always treated as subscribed — no payment required.
  const adminCheck = await isAdminUser(clerkId);
  if (adminCheck) {
    return { isSubscribed: true, subscription: null, userId: clerkId };
  }

  try {
    const db = prisma as any;

    // 1. Check direct active CyberCafe subscription linked by clerkUserId
    const cafeByClerk = await db.cyberCafe?.findFirst({
      where: {
        clerkUserId: clerkId,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });

    if (cafeByClerk && cafeByClerk.expiresAt) {
      const daysRemaining = Math.max(0, Math.ceil((new Date(cafeByClerk.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      return {
        isSubscribed: true,
        subscription: {
          id: cafeByClerk.id,
          planName: 'cyber_monthly',
          amountPaid: 500,
          currency: 'KES',
          expiresAt: cafeByClerk.expiresAt,
          status: cafeByClerk.status,
          daysRemaining,
          cafeName: cafeByClerk.cafeName,
          ownerName: cafeByClerk.ownerName,
        },
        userId: clerkId,
      };
    }

    const dbUser = await db.users?.findFirst({
      where: { clerkId },
      include: {
        subscriptions: {
          where: {
            status: 'active',
            expiresAt: { gt: new Date() },
          },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });

    const activeSub = dbUser?.subscriptions?.[0] || null;

    if (activeSub) {
      const daysRemaining = Math.max(0, Math.ceil((new Date(activeSub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      return {
        isSubscribed: true,
        subscription: {
          id: activeSub.id,
          planName: activeSub.planName,
          amountPaid: activeSub.amountPaid,
          currency: activeSub.currency,
          expiresAt: activeSub.expiresAt,
          status: activeSub.status,
          daysRemaining,
        },
        userId: dbUser.id,
      };
    }

    // 2. Check if user has an active Cyber Cafe monthly package by WhatsApp phone
    if (clerkId.startsWith('wa_')) {
      const waPhone = clerkId.replace(/^wa_/, '');
      const cafe = await db.cyberCafe?.findFirst({
        where: {
          whatsappPhone: waPhone,
          status: 'active',
          expiresAt: { gt: new Date() },
        },
      });
      if (cafe && cafe.expiresAt) {
        const daysRemaining = Math.max(0, Math.ceil((new Date(cafe.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        return {
          isSubscribed: true,
          subscription: {
            id: cafe.id,
            planName: 'cyber_monthly',
            amountPaid: 500,
            currency: 'KES',
            expiresAt: cafe.expiresAt,
            status: cafe.status,
            daysRemaining,
            cafeName: cafe.cafeName,
            ownerName: cafe.ownerName,
          },
          userId: dbUser?.id || clerkId,
        };
      }
    }

    return {
      isSubscribed: false,
      subscription: null,
      userId: dbUser?.id || clerkId,
    };
  } catch (error: any) {
    console.error('[getUserSubscriptionStatus] Error verifying subscription:', error.message);
    return { isSubscribed: false, subscription: null, userId: null };
  }
}

/**
 * Ensures a user record exists in the local database mapped to their Clerk ID.
 */
export async function getOrCreateDbUser(clerkId: string, email?: string, fullName?: string) {
  const db = prisma as any;
  if (!clerkId) return null;

  try {
    // 1. Try finding by clerkId first
    let dbUser = await db.users?.findFirst({ where: { clerkId } });
    if (dbUser) return dbUser;

    // 2. Resolve missing email or name from Clerk
    let resolvedEmail = email;
    let resolvedFirst = 'Taxpayer';
    let resolvedLast: string | undefined = undefined;

    if (!resolvedEmail || !fullName) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkId);
        resolvedEmail = resolvedEmail || clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
        resolvedFirst = clerkUser.firstName || resolvedFirst;
        resolvedLast = clerkUser.lastName || undefined;
      } catch (clerkErr: any) {
        console.warn('[getOrCreateDbUser] Notice fetching Clerk profile:', clerkErr?.message);
      }
    }

    if (fullName && !resolvedLast) {
      const parts = fullName.trim().split(' ');
      resolvedFirst = parts[0] || resolvedFirst;
      resolvedLast = parts.slice(1).join(' ') || undefined;
    }

    const primaryEmail = resolvedEmail || `${clerkId}@akubrecah.local`;

    // 3. Check if a user already exists with this email
    const existingByEmail = await db.users?.findFirst({ where: { email: primaryEmail } });
    if (existingByEmail) {
      dbUser = await db.users?.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId,
          firstName: resolvedFirst || existingByEmail.firstName,
          lastName: resolvedLast || existingByEmail.lastName,
          updatedAt: new Date(),
        },
      });
      return dbUser;
    }

    // 4. Create new user record
    dbUser = await db.users?.create({
      data: {
        id: clerkId,
        clerkId,
        email: primaryEmail,
        firstName: resolvedFirst,
        lastName: resolvedLast,
        role: 'user',
        updatedAt: new Date(),
      },
    });

    return dbUser;
  } catch (error: any) {
    console.error('[getOrCreateDbUser] Error ensuring DB user record:', error.message);
    // Fallback: try finding again in case of race condition
    return await db.users?.findFirst({ where: { clerkId } }).catch(() => null);
  }
}

