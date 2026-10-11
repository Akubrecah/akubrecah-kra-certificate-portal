import { NextResponse } from 'next/server';
import { getPublishedProjects } from '@/lib/cms';

export const revalidate = 60;

export async function GET() {
  try {
    const projects = await getPublishedProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
