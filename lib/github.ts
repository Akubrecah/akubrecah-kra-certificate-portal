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
  isVisible?: boolean;
  isFeatured?: boolean;
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

export interface RepoVisibilitySettings {
  hiddenRepoNames: string[];
  featuredRepoNames: string[];
  lastUpdated?: string;
  updatedBy?: string;
}

/**
 * Loads repository visibility settings from Prisma SiteSetting (or local JSON fallback).
 */
export async function getRepoVisibilitySettings(): Promise<RepoVisibilitySettings> {
  // 1. Try Prisma SiteSetting
  try {
    const prismaModule = await import('@/lib/prisma');
    const prisma = prismaModule.default;
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'github_repo_visibility' },
    });
    if (setting?.value && typeof setting.value === 'object') {
      const val = setting.value as any;
      return {
        hiddenRepoNames: Array.isArray(val.hiddenRepoNames) ? val.hiddenRepoNames : [],
        featuredRepoNames: Array.isArray(val.featuredRepoNames) ? val.featuredRepoNames : [],
        lastUpdated: val.lastUpdated,
        updatedBy: val.updatedBy,
      };
    }
  } catch (err: any) {
    // DB fallback
  }

  // 2. Try filesystem fallback data/repo-visibility.json
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'repo-visibility.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        hiddenRepoNames: Array.isArray(parsed.hiddenRepoNames) ? parsed.hiddenRepoNames : [],
        featuredRepoNames: Array.isArray(parsed.featuredRepoNames) ? parsed.featuredRepoNames : [],
        lastUpdated: parsed.lastUpdated,
        updatedBy: parsed.updatedBy,
      };
    }
  } catch (err) {
    // Ignore
  }

  return {
    hiddenRepoNames: [],
    featuredRepoNames: ['BWM-XMD-QUANTUM', 'Flet-Weather-App', 'XeonBug-V8.1', 'Mpesa-Daraja-Api-Python'],
  };
}

/**
 * Persists repository visibility settings to both Prisma SiteSetting and JSON fallback.
 */
export async function saveRepoVisibilitySettings(settings: {
  hiddenRepoNames: string[];
  featuredRepoNames: string[];
  updatedBy?: string;
}): Promise<boolean> {
  const payload = {
    hiddenRepoNames: Array.from(new Set(settings.hiddenRepoNames)),
    featuredRepoNames: Array.from(new Set(settings.featuredRepoNames)),
    lastUpdated: new Date().toISOString(),
    updatedBy: settings.updatedBy || 'admin',
  };

  // 1. Save to database
  try {
    const prismaModule = await import('@/lib/prisma');
    const prisma = prismaModule.default;
    await prisma.siteSetting.upsert({
      where: { key: 'github_repo_visibility' },
      update: { value: payload as any },
      create: { key: 'github_repo_visibility', value: payload as any },
    });
  } catch (dbErr: any) {
    console.warn('[saveRepoVisibilitySettings DB Warning]:', dbErr.message);
  }

  // 2. Save to filesystem fallback
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, 'repo-visibility.json');
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (fsErr: any) {
    console.warn('[saveRepoVisibilitySettings FS Warning]:', fsErr.message);
  }

  return true;
}

/**
 * Retrieves public repositories filtered by admin visibility settings.
 * Only repositories not listed in `hiddenRepoNames` will be returned.
 */
export async function getPublicGithubRepos(username = DEFAULT_USERNAME) {
  const [data, visibility] = await Promise.all([
    getAllGithubRepos(username),
    getRepoVisibilitySettings(),
  ]);

  const hiddenSet = new Set(visibility.hiddenRepoNames);
  const featuredSet = new Set(visibility.featuredRepoNames);

  // Filter out hidden repositories and annotate featured status
  const publicRepos = data.repos
    .filter((r) => !hiddenSet.has(r.name))
    .map((r) => ({
      ...r,
      isVisible: true,
      isFeatured: featuredSet.has(r.name),
    }));

  // Recalculate stats for visible repos
  const langCounts: Record<string, number> = {};
  let totalStars = 0;
  let totalForks = 0;

  for (const repo of publicRepos) {
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
    repos: publicRepos,
    stats: {
      totalRepos: publicRepos.length,
      totalStars,
      totalForks,
      languages,
    },
    totalAllRepos: data.repos.length,
    hiddenCount: data.repos.length - publicRepos.length,
    featuredCount: publicRepos.filter((r) => r.isFeatured).length,
  };
}

/**
 * Fetches and resolves the raw README markdown for a given GitHub repository.
 * Rewrites relative images and document links so they render seamlessly.
 */
export async function getRepoReadme(repoName: string, defaultBranch = 'main'): Promise<{
  content: string;
  hasReadme: boolean;
}> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'Akubrecah-Portfolio',
    Accept: 'application/vnd.github.v3.raw',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let raw = '';

  // 1. Try official GitHub API readme endpoint
  try {
    const res = await fetch(`https://api.github.com/repos/Akubrecah/${encodeURIComponent(repoName)}/readme`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      raw = await res.text();
    }
  } catch (err: any) {
    console.warn(`[GitHub Readme API Error for ${repoName}]:`, err.message);
  }

  // 2. Fallback to raw.githubusercontent.com on main / master
  if (!raw || raw.startsWith('{"message":')) {
    const branches = [defaultBranch, 'main', 'master'];
    for (const b of branches) {
      if (raw && !raw.startsWith('{"message":')) break;
      try {
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/Akubrecah/${encodeURIComponent(repoName)}/${b}/README.md`,
          { next: { revalidate: 3600 } }
        );
        if (rawRes.ok) {
          const txt = await rawRes.text();
          if (txt && !txt.includes('404: Not Found') && !txt.startsWith('{"message":')) {
            raw = txt;
            break;
          }
        }
      } catch {}
    }
  }

  if (!raw || raw.includes('404: Not Found') || raw.startsWith('{"message":')) {
    return { content: '', hasReadme: false };
  }

  const rawBase = `https://raw.githubusercontent.com/Akubrecah/${repoName}/${defaultBranch}`;
  const blobBase = `https://github.com/Akubrecah/${repoName}/blob/${defaultBranch}`;

  let processed = raw;

  // Rewrite relative markdown image syntax ![alt](relative-path)
  processed = processed.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/|data:|\/|#)([^)]+)\)/g,
    `![$1](${rawBase}/$2)`
  );

  // Rewrite HTML <img ... src="relative-path" ...>
  processed = processed.replace(
    /<img\s+([^>]*?)src=["'](?!https?:\/\/|data:|\/|#)([^"']+)["']([^>]*?)>/gi,
    `<img $1src="${rawBase}/$2"$3>`
  );

  // Rewrite relative markdown links [text](relative-file.md)
  processed = processed.replace(
    /\[([^\]]+)\]\((?!https?:\/\/|mailto:|#|\/)([^)]+)\)/g,
    `[$1](${blobBase}/$2)`
  );

  return {
    content: processed,
    hasReadme: true,
  };
}

