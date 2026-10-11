import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminCaller } from '@/lib/admin-auth';

export const maxDuration = 30;

// GET: Retrieve inquiries with optional search & status filter
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('q')?.trim() || '';

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const stats = {
      total: inquiries.length,
      new: inquiries.filter((i) => i.status === 'new').length,
      contacted: inquiries.filter((i) => i.status === 'contacted').length,
      qualified: inquiries.filter((i) => i.status === 'qualified').length,
      won: inquiries.filter((i) => i.status === 'won').length,
    };

    return NextResponse.json({ success: true, inquiries, stats });
  } catch (error: any) {
    console.error('[API Admin Inquiries GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update inquiry status
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Inquiry ID and new status are required.' }, { status: 400 });
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status },
      include: { notes: true },
    });

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error: any) {
    console.error('[API Admin Inquiries PATCH Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Add internal note to an inquiry
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { inquiryId, content, authorName } = body;

    if (!inquiryId || !content?.trim()) {
      return NextResponse.json({ success: false, error: 'Inquiry ID and note content are required.' }, { status: 400 });
    }

    const note = await prisma.inquiryNote.create({
      data: {
        inquiryId,
        content: content.trim(),
        authorName: authorName || admin.email || 'Admin',
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('[API Admin Inquiries POST Note Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
