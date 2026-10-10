import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchTaxpayerById } from '@/lib/kra-api';
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
    const { idNumber, engineMode = 'auto' } = body;

    if (!idNumber || typeof idNumber !== 'string' || !idNumber.trim()) {
      return NextResponse.json({ success: false, error: 'National ID number is required.' }, { status: 400 });
    }

    const cleanId = idNumber.trim();

    if (!/^\d{5,12}$/.test(cleanId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid National ID format. Must contain 5 to 12 digits.' },
        { status: 400 }
      );
    }

    const taxpayerData = await fetchTaxpayerById(cleanId, engineMode);

    // Zero-storage policy: Do not persist taxpayer lookup details into database cache.
    // Live taxpayer results are processed ephemerally in-memory for the active session.
    
    //Check user subscription status
    const { isSubscribed} = await getUserSubscriptionStatus(clerkId);

    // Apply strict privacy masking: unsubscribes users cannot see phone or location
    const maskedData = maskTaxpayerData(taxpayerData as any, isSubscribed, isAdmin);
    await createSystemLog({
      level: 'info',
      service: 'KRA-Live-ID-Checker',
      message: 'Verified ID ${cleadID}, resolve PIN ${taxpayerData.pin} for ${taxpayerData.taxpayerName} (Subscribed: ${isSubscribed})',
      actor: userEmail,
      ip,
      details:{
        idNumber: cleanId,
        pin: taxpayerData.pin,
        name: taxpayerData.taxpayerName,
        station: isSubscribed ? taxpayerData.station: 'MASKED',
        source: taxpayerData.source,
        isSubscribed,
      },
      
    });
    return NextResponse.json({
      success: true,
      data: {
        ...maskedData,
        rawPin: taxpayerData.pin,
        rawId: cleanId,
      },
      isSubscribed,
    });
  } catch (error: any) {
    console.error('[API /api/kra/live-verify/id Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify National ID with KRA live gateway.' },
      { status: 500 }
    );
  }
}
