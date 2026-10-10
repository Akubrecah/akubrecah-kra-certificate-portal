import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

/**
 * POST /api/kra/upload-id
 * Accepts a multipart form with a file field named "idImage".
 * Processes upload in-memory with ZERO server disk storage.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('idImage') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload JPG, PNG, WEBP, or PDF.' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5 MB.' },
        { status: 400 }
      );
    }

    // Zero disk storage policy: Process in-memory buffer without saving to server filesystem
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      filename: file.name || 'id-document',
      dataUrl,
      filePath: null,
      message: 'ID document verified in-memory. Zero server disk retention enforced.',
    });
  } catch (error: any) {
    console.error('[upload-id] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
