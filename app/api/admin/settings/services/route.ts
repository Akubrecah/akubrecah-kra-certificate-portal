import { NextRequest, NextResponse } from 'next/server';
import settingsService from '@/lib/services/settingsService';

/**
 * GET /api/admin/settings/services
 * Fetch all service settings
 */
export async function GET() {
  try {
    const result = await settingsService.getServiceSettings();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings/services
 * Update a specific service setting
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, isActive } = body;

    if (!key || typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const result = await settingsService.updateServiceSetting(key, isActive);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
/**
 * PUT /api/admin/settings/services
 * Create a new service setting
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, name, description, isActive } = body;

    if (!key || !name) {
      return NextResponse.json({ success: false, error: 'Key and Name are required' }, { status: 400 });
    }

    const result = await settingsService.createServiceSetting({ key, name, description, isActive });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
