import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

/**
 * POST /api/kra/upload-id
 * Accepts a multipart form with a file field named "idImage".
 * Saves it temporarily to /tmp/kra-ids/<uuid>.<ext> and returns the path.
 * The caller is responsible for deleting the file after use.
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

    const uploadDir = '/tmp/kra-ids';
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = file.type === 'application/pdf' ? '.pdf' : file.type === 'image/png' ? '.png' : '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, filePath, filename });
  } catch (error: any) {
    console.error('[upload-id] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
