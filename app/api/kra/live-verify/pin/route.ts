import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchTaxpayerByPin } from '@/lib/kra-api';
import { createSystemLog } from '@/lib/prisma';
import { getUserSubscriptionStatus } from '@/lib/subscription';
import { maskTaxpayerData } from '@/lib/masking';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    let clerkId: string | null = null;
    let userEmail = 'guest@akubrecah.co.ke';
    try {
      const session = await auth();
      clerkId = session?.userId || null;
      if (clerkId) {
        userEmail = clerkId;
        const client = await clerkClient();
        const user = await client.users.getUser(clerkId);
        userEmail = user.primaryEmailAddress?.emailAddress || clerkId;
      }
    } catch {}

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    // Check if user is super admin
    let isAdmin = false;
    if (clerkId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(clerkId);
        const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
        const configAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
        const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
        if (email === "poweldayck@gmail.com" || email === configAdminEmail || email === configPublicAdminEmail || user.publicMetadata?.role === "Super Admin" || user.publicMetadata?.role === "Admin") {
          isAdmin = true;
        }
      } catch {}
    }

    const body = await req.json();
    const { pin, engineMode = 'auto' } = body;

    if (!pin || typeof pin !== 'string' || !pin.trim()) {
      return NextResponse.json({ success: false, error: 'KRA PIN is required.' }, { status: 400 });
    }

    const cleanPin = pin.trim().toUpperCase();

    // Verify PIN pattern: 11 characters (letter + 9 digits + letter, or standard alphanumeric 11-char)
    if (!/^[A-Z0-9]{11}$/.test(cleanPin)) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN format. KRA PIN must be exactly 11 characters (e.g. A012345678Z).' },
        { status: 400 }
      );
    }

    const taxpayerData = await fetchTaxpayerByPin(cleanPin, engineMode);

    // Cache unmasked record in database for legitimate certificate generation
    try {
      const prismaModule = await import('@/lib/prisma');
      const db = prismaModule.default as any;
      if (db.kra_pin_cache && cleanPin) {
        await db.kra_pin_cache.upsert({
          where: { pin: cleanPin },
          update: {
            id_number: taxpayerData.idNumber ? String(taxpayerData.idNumber).trim() : undefined,
            name: taxpayerData.taxpayerName || '',
            email: taxpayerData.email || null,
            building: taxpayerData.building || null,
            street: taxpayerData.street || null,
            city: taxpayerData.town || null,
            county: taxpayerData.county || null,
            district: taxpayerData.district || null,
            tax_area: taxpayerData.taxArea || null,
            po_box: taxpayerData.poBox || null,
            postal_code: taxpayerData.postalCode || null,
            station: taxpayerData.station || null,
            phone_number: taxpayerData.phoneNumber || null,
            registered_date: taxpayerData.registrationDate || null,
            updated_at: new Date(),
          },
          create: {
            id: `CACHE_${cleanPin}_${Date.now()}`,
            pin: cleanPin,
            id_number: taxpayerData.idNumber ? String(taxpayerData.idNumber).trim() : null,
            name: taxpayerData.taxpayerName || '',
            email: taxpayerData.email || null,
            building: taxpayerData.building || null,
            street: taxpayerData.street || null,
            city: taxpayerData.town || null,
            county: taxpayerData.county || null,
            district: taxpayerData.district || null,
            tax_area: taxpayerData.taxArea || null,
            po_box: taxpayerData.poBox || null,
            postal_code: taxpayerData.postalCode || null,
            station: taxpayerData.station || null,
            phone_number: taxpayerData.phoneNumber || null,
            registered_date: taxpayerData.registrationDate || null,
            updated_at: new Date(),
          },
        });
      }
    } catch (cacheErr: any) {
      console.warn('[live-verify/pin] kra_pin_cache upsert warning:', cacheErr.message);
    }

    // Check user subscription status
    const { isSubscribed } = await getUserSubscriptionStatus(clerkId);

    // Apply strict privacy masking: unsubscribed users cannot see phone or location
    const maskedData = maskTaxpayerData(taxpayerData as any, isSubscribed, isAdmin);

    await createSystemLog({
      level: 'info',
      service: 'KRA-Live-PIN-Checker',
      message: `Verified KRA PIN ${cleanPin} for ${taxpayerData.taxpayerName} (Subscribed: ${isSubscribed})`,
      actor: userEmail,
      ip,
      details: {
        pin: cleanPin,
        name: taxpayerData.taxpayerName,
        station: isSubscribed ? taxpayerData.station : 'MASKED',
        source: taxpayerData.source,
        isSubscribed,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...maskedData,
        rawPin: cleanPin,
      },
      isSubscribed,
    });
  } catch (error: any) {
    console.error('[API /api/kra/live-verify/pin Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify KRA PIN with live gateway.' },
      { status: 500 }
    );
  }
}
