import { NextRequest, NextResponse } from 'next/server';
import kraService from '@/lib/services/kraService';
import { auth } from '@clerk/nextjs/server';
import { logUserActivity } from '@/lib/activity-logger';
import prisma from '@/lib/prisma';

/**
 * POST /api/kra/retrieve
 * Handle KRA record retrieval requests with Auth & Logging
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Find the internal DB user for logging
    const dbUser = await prisma.user.findUnique({
      where: { clerkId }
    });

    const body = await req.json();
    const { idNumber, pin, fullName } = body;

    if (!idNumber && !pin) {
      return NextResponse.json({ success: false, error: 'ID Number or PIN is required' }, { status: 400 });
    }

    // Use the unified KRA service logic for both direct PIN and ID lookups
    const result = await kraService.retrieveKRAPIN({
      id_number: idNumber,
      pin: pin,
      full_name: fullName
    }) as any;

    // Log the activity if we have a DB user
    if (dbUser) {
      await logUserActivity({
        userId: dbUser.id,
        activityType: 'return',
        description: result.success 
          ? `Successfully retrieved KRA details for PIN: ${result.data?.pin || pin || 'Unknown'}`
          : `Failed to retrieve KRA details: ${result.error || 'Unknown error'}`,
        status: result.success ? 'success' : 'error',
        metadata: {
          idNumber: idNumber ? `${idNumber.substring(0, 3)}****` : undefined, // Mask sensitive data
          success: result.success,
          pin: result.data?.pin || pin
        }
      });
    }

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Error in KRA retrieval:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
