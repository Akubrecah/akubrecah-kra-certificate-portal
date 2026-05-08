import { NextRequest, NextResponse } from 'next/server';
import kraService from '@/lib/services/kraService';

/**
 * POST /api/kra/retrieve
 * Handle KRA record retrieval requests
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idNumber, pin, fullName, dateOfBirth, phoneNumber } = body;

    if (!idNumber && !pin) {
      return NextResponse.json({ success: false, error: 'ID Number or PIN is required' }, { status: 400 });
    }

    // Use the unified KRA service logic for both direct PIN and ID lookups
    const result = await kraService.retrieveKRAPIN({
      id_number: idNumber,
      pin: pin,
      full_name: fullName
    }) as any;

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
