import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchTaxpayerByPin } from '@/lib/kra-api';
import { createSystemLog } from '@/lib/prisma';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    let userEmail = clerkId;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(clerkId);
      userEmail = user.primaryEmailAddress?.emailAddress || clerkId;
    } catch {}

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

    await createSystemLog({
      level: 'info',
      service: 'KRA-Live-PIN-Checker',
      message: `Successfully verified KRA PIN ${cleanPin} for ${taxpayerData.taxpayerName}`,
      actor: userEmail,
      ip,
      details: {
        pin: cleanPin,
        name: taxpayerData.taxpayerName,
        station: taxpayerData.station,
        source: taxpayerData.source,
      },
    });

    return NextResponse.json({
      success: true,
      data: taxpayerData,
    });
  } catch (error: any) {
    console.error('[API /api/kra/live-verify/pin Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify KRA PIN with live gateway.' },
      { status: 500 }
    );
  }
}
