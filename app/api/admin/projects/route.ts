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

    const projects = await prisma.project.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('[API Admin Projects GET Error]:', error);
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
    const {
      title,
      slug,
      summary,
      description,
      category,
      client,
      featuredImage,
      galleryImages,
      liveUrl,
      githubUrl,
      technologies,
      problemStatement,
      solutionArchitecture,
      measurableOutcomes,
      isFeatured,
      isPublished,
      displayOrder,
      seoTitle,
      seoDescription,
    } = body;

    if (!title || !slug || !summary || !description || !category) {
      return NextResponse.json(
        { success: false, error: 'Title, slug, summary, description, and category are required.' },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        slug: cleanSlug,
        summary: summary.trim(),
        description: description.trim(),
        category: category.trim(),
        client: client?.trim() || null,
        featuredImage: featuredImage || '/akubrecah-logo.webp',
        galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
        liveUrl: liveUrl?.trim() || null,
        githubUrl: githubUrl?.trim() || null,
        technologies: Array.isArray(technologies) ? technologies : [],
        problemStatement: problemStatement?.trim() || null,
        solutionArchitecture: solutionArchitecture?.trim() || null,
        measurableOutcomes: Array.isArray(measurableOutcomes) ? measurableOutcomes : [],
        isFeatured: Boolean(isFeatured),
        isPublished: Boolean(isPublished ?? true),
        displayOrder: Number(displayOrder) || 0,
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('[API Admin Projects POST Error]:', error);
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
      return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
    }

    if (data.slug) {
      data.slug = String(data.slug)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('[API Admin Projects PUT Error]:', error);
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
      return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error: any) {
    console.error('[API Admin Projects DELETE Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
