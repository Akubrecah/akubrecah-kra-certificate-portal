import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminCaller } from '@/lib/admin-auth';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const categories = await prisma.skillCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        skills: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('[API Admin Skills GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { categoryId, name, proficiency, yearsOfExp } = body;

    if (!categoryId || !name) {
      return NextResponse.json({ success: false, error: 'Category ID and skill name are required.' }, { status: 400 });
    }

    const skill = await prisma.skill.create({
      data: {
        categoryId,
        name: name.trim(),
        proficiency: Number(proficiency) || 90,
        yearsOfExp: yearsOfExp ? Number(yearsOfExp) : null,
      },
    });

    return NextResponse.json({ success: true, skill });
  } catch (error: any) {
    console.error('[API Admin Skills POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Skill ID is required.' }, { status: 400 });
    }

    await prisma.skill.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Skill deleted successfully.' });
  } catch (error: any) {
    console.error('[API Admin Skills DELETE Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
