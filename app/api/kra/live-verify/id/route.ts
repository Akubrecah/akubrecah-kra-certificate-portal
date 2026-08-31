import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchTaxpayerById } from '@/lib/kra-api';
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

    await createSystemLog({
      level: 'info',
      service: 'KRA-Live-ID-Checker',
      message: `Successfully verified ID ${cleanId}, resolved PIN ${taxpayerData.pin} for ${taxpayerData.taxpayerName}`,
      actor: userEmail,
      ip,
      details: {
        idNumber: cleanId,
        pin: taxpayerData.pin,
        name: taxpayerData.taxpayerName,
        source: taxpayerData.source,
      },
    });

    return NextResponse.json({
      success: true,
      data: taxpayerData,
    });
  } catch (error: any) {
    console.error('[API /api/kra/live-verify/id Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify National ID with KRA live gateway.' },
      { status: 500 }
    );
  }
}
