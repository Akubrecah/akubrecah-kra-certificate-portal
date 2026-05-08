import { NextRequest, NextResponse } from 'next/server';
import appSettingsService from '@/lib/services/appSettingsService';

/**
 * GET /api/admin/settings
 * Fetch all settings, or filter by category if provided
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');

    let result;
    if (category) {
      result = await appSettingsService.getSettingsByCategory(category);
    } else {
      result = await appSettingsService.getAllSettings();
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings
 * Update multiple settings for a category
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, settings } = body;

    if (!category || !settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Category and settings object are required' },
        { status: 400 }
      );
    }

    const result = await appSettingsService.updateCategorySettings(category, settings);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings
 * Update a specific individual setting
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, key, value } = body;

    if (!category || !key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Category, key, and value are required' },
        { status: 400 }
      );
    }

    const result = await appSettingsService.upsertSetting(category, key, value);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
