export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  homepage: string | null;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  isFork: boolean;
  isArchived: boolean;
  size: number;
  defaultBranch: string;
}

export interface GithubUserStats {
  username: string;
  avatarUrl: string;
  htmlUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  languages: { name: string; count: number; percentage: number }[];
}

export const GITHUB_LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  PHP: '#4F5D95',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Vue: '#41b883',
  Dart: '#00B4AB',
};

const DEFAULT_USERNAME = 'Akubrecah';

/**
 * Fetches all public GitHub repositories for the given username.
 * Supports pagination to retrieve 100+ repositories.
 */
export async function getAllGithubRepos(username = DEFAULT_USERNAME): Promise<{
  repos: GithubRepo[];
  stats: {
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    languages: { name: string; count: number; percentage: number }[];
  };
}> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'Akubrecah-Portfolio',
    Accept: 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let allRawRepos: any[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  try {
    while (hasMore && page <= 5) {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}&sort=updated`,
        {
          headers,
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      );

      if (!res.ok) {
        console.warn(`[GitHub API] Fetch returned status ${res.status} for page ${page}`);
        break;
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        allRawRepos = allRawRepos.concat(data);
        if (data.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }
  } catch (err: any) {
    console.error('[GitHub API Error]:', err.message);
  }

  // Fallback to cached snapshot if GitHub API returned 0 items (e.g. rate limit 403 or network error)
  if (allRawRepos.length === 0) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const cachePath = path.join(process.cwd(), 'data', 'github-repos-cache.json');
      if (fs.existsSync(cachePath)) {
        const fileContent = fs.readFileSync(cachePath, 'utf-8');
        const cached = JSON.parse(fileContent);
        if (cached && Array.isArray(cached.repos) && cached.repos.length > 0) {
          return {
            repos: cached.repos,
            stats: cached.stats || {
              totalRepos: cached.repos.length,
              totalStars: 92,
              totalForks: 3,
              languages: [],
            },
          };
        }
      }
    } catch (cacheErr: any) {
      console.warn('[GitHub Cache Read Fallback Warning]:', cacheErr.message);
    }
  }

  const repos: GithubRepo[] = allRawRepos.map((r: any) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description || `Engineering codebase and software implementation for ${r.name.replace(/[-_]/g, ' ')}.`,
    htmlUrl: r.html_url,
    homepage: r.homepage && r.homepage.trim() ? r.homepage : null,
    language: r.language || 'Codebase',
    stars: Number(r.stargazers_count) || 0,
    forks: Number(r.forks_count) || 0,
    openIssues: Number(r.open_issues_count) || 0,
    topics: Array.isArray(r.topics) ? r.topics : [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    pushedAt: r.pushed_at || r.updated_at,
    isFork: Boolean(r.fork),
    isArchived: Boolean(r.archived),
    size: Number(r.size) || 0,
    defaultBranch: r.default_branch || 'main',
  }));

  // Calculate language distribution
  const langCounts: Record<string, number> = {};
  let totalStars = 0;
  let totalForks = 0;

  for (const repo of repos) {
    totalStars += repo.stars;
    totalForks += repo.forks;
    if (repo.language && repo.language !== 'Codebase') {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
    }
  }

  const totalLangRepos = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
  const languages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalLangRepos) * 100),
    }));

  return {
    repos,
    stats: {
      totalRepos: repos.length,
      totalStars,
      totalForks,
      languages,
    },
  };
}
