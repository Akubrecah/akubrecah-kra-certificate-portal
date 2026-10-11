import { NextRequest, NextResponse } from 'next/server';
import { getPublicGithubRepos } from '@/lib/github';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 minute ISR cache

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('user') || 'Akubrecah';
    const language = searchParams.get('language') || 'all';
    const search = (searchParams.get('q') || '').toLowerCase().trim();
    const sort = searchParams.get('sort') || 'updated'; // 'updated' | 'stars' | 'forks' | 'name'

    const { repos, stats } = await getPublicGithubRepos(username);

    let filtered = repos;

    if (language !== 'all') {
      filtered = filtered.filter(
        (r) => r.language.toLowerCase() === language.toLowerCase()
      );
    }

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search) ||
          r.topics.some((t) => t.toLowerCase().includes(search))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'stars') return b.stars - a.stars;
      if (sort === 'forks') return b.forks - a.forks;
      if (sort === 'name') return a.name.localeCompare(b.name);
      return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
    });

    return NextResponse.json({
      success: true,
      username,
      totalCount: repos.length,
      filteredCount: filtered.length,
      stats,
      repos: filtered,
    });
  } catch (error: any) {
    console.error('[API /api/github/repos Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load GitHub repositories' },
      { status: 500 }
    );
  }
}
