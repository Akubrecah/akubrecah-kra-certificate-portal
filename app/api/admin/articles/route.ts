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

    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, articles });
  } catch (error: any) {
    console.error('[API Admin Articles GET Error]:', error);
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
    const { title, slug, excerpt, content, category, tags, featuredImage, readingTimeMinutes, isPublished } = body;

    if (!title || !slug || !excerpt || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Title, slug, excerpt, content, and category are required.' },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        slug: cleanSlug,
        excerpt: excerpt.trim(),
        content: content.trim(),
        category: category.trim(),
        tags: Array.isArray(tags) ? tags : [],
        featuredImage: featuredImage || null,
        authorName: 'Akubrecah',
        readingTimeMinutes: Number(readingTimeMinutes) || Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
        isPublished: Boolean(isPublished ?? true),
        publishedAt: isPublished ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    console.error('[API Admin Articles POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Article ID is required.' }, { status: 400 });
    }

    if (data.slug) {
      data.slug = String(data.slug)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (data.content && !data.readingTimeMinutes) {
      data.readingTimeMinutes = Math.max(1, Math.ceil(data.content.split(/\s+/).length / 200));
    }

    const article = await prisma.article.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    console.error('[API Admin Articles PUT Error]:', error);
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
      return NextResponse.json({ success: false, error: 'Article ID is required.' }, { status: 400 });
    }

    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Article deleted successfully.' });
  } catch (error: any) {
    console.error('[API Admin Articles DELETE Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
