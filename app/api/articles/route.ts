import { NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/cms';

export const revalidate = 60;

export async function GET() {
  try {
    const articles = await getPublishedArticles();
    return NextResponse.json({ success: true, articles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
