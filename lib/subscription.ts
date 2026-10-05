import prisma from '@/lib/prisma';

export interface UserSubscriptionStatus {
  isSubscribed: boolean;
  subscription: {
    id: string;
    planName: string;
    amountPaid: number;
    currency: string;
    expiresAt: Date;
    status: string;
  } | null;
  userId: string | null;
}

/**
 * Checks whether a given Clerk user has an active, valid subscription.
 */
export async function getUserSubscriptionStatus(clerkId?: string | null): Promise<UserSubscriptionStatus> {
  if (!clerkId) {
    return { isSubscribed: false, subscription: null, userId: null };
  }

  try {
    const db = prisma as any;
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

    if (!dbUser) {
      return { isSubscribed: false, subscription: null, userId: null };
    }

    const activeSub = dbUser.subscriptions?.[0] || null;

    if (activeSub) {
      return {
        isSubscribed: true,
        subscription: {
          id: activeSub.id,
          planName: activeSub.planName,
          amountPaid: activeSub.amountPaid,
          currency: activeSub.currency,
          expiresAt: activeSub.expiresAt,
          status: activeSub.status,
        },
        userId: dbUser.id,
      };
    }

    return {
      isSubscribed: false,
      subscription: null,
      userId: dbUser.id,
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

