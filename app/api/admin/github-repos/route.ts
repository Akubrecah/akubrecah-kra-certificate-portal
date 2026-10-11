import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { 
  getAllGithubRepos, 
  getRepoVisibilitySettings, 
  saveRepoVisibilitySettings,
  RepoVisibilitySettings
} from '@/lib/github';
import { verifyAdminCaller } from '@/lib/admin-auth';
import { createSystemLog } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 403 }
      );
    }

    const [githubData, visibilitySettings] = await Promise.all([
      getAllGithubRepos('Akubrecah'),
      getRepoVisibilitySettings(),
    ]);

    const hiddenSet = new Set(visibilitySettings.hiddenRepoNames || []);
    const featuredSet = new Set(visibilitySettings.featuredRepoNames || []);

    const enrichedRepos = githubData.repos.map((repo) => ({
      ...repo,
      isVisible: !hiddenSet.has(repo.name),
      isFeatured: featuredSet.has(repo.name),
    }));

    const stats = {
      total: enrichedRepos.length,
      visible: enrichedRepos.filter((r) => r.isVisible).length,
      hidden: enrichedRepos.filter((r) => !r.isVisible).length,
      featured: enrichedRepos.filter((r) => r.isFeatured).length,
    };

    return NextResponse.json({
      success: true,
      repos: enrichedRepos,
      stats,
      visibilitySettings,
    });
  } catch (error: any) {
    console.error('[API Admin GitHub Repos GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const currentSettings = await getRepoVisibilitySettings();

    let newHidden = new Set(currentSettings.hiddenRepoNames || []);
    let newFeatured = new Set(currentSettings.featuredRepoNames || []);

    if (body.action === 'show_all') {
      newHidden.clear();
    } else if (body.action === 'hide_all') {
      const allData = await getAllGithubRepos('Akubrecah');
      newHidden = new Set(allData.repos.map((r) => r.name));
    } else if (body.action === 'reset_defaults') {
      newHidden.clear();
      newFeatured = new Set(['BWM-XMD-QUANTUM', 'Flet-Weather-App', 'XeonBug-V8.1', 'Mpesa-Daraja-Api-Python']);
    } else if (Array.isArray(body.hiddenRepoNames) || Array.isArray(body.featuredRepoNames)) {
      if (Array.isArray(body.hiddenRepoNames)) {
        newHidden = new Set(body.hiddenRepoNames);
      }
      if (Array.isArray(body.featuredRepoNames)) {
        newFeatured = new Set(body.featuredRepoNames);
      }
    } else if (body.repoName && typeof body.repoName === 'string') {
      const { repoName, isVisible, isFeatured } = body;

      if (typeof isVisible === 'boolean') {
        if (isVisible) {
          newHidden.delete(repoName);
        } else {
          newHidden.add(repoName);
        }
      }

      if (typeof isFeatured === 'boolean') {
        if (isFeatured) {
          newFeatured.add(repoName);
        } else {
          newFeatured.delete(repoName);
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request payload: repoName or action required.' },
        { status: 400 }
      );
    }

    const updatedSettings: RepoVisibilitySettings = {
      hiddenRepoNames: Array.from(newHidden),
      featuredRepoNames: Array.from(newFeatured),
      updatedBy: admin.email || admin.userId,
    };

    await saveRepoVisibilitySettings(updatedSettings);

    // Revalidate public cache paths immediately
    try {
      revalidatePath('/', 'page');
      revalidatePath('/projects', 'page');
    } catch (revErr: any) {
      console.warn('[Admin GitHub Repos Revalidate Warning]:', revErr.message);
    }

    await createSystemLog({
      level: 'info',
      service: 'GitHub Repositories CMS',
      message: `Admin updated GitHub repo visibility (${updatedSettings.hiddenRepoNames.length} hidden, ${updatedSettings.featuredRepoNames.length} featured)`,
      actor: admin.email || 'Admin',
      details: {
        hiddenCount: updatedSettings.hiddenRepoNames.length,
        featuredCount: updatedSettings.featuredRepoNames.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Repository visibility preferences updated successfully.',
      visibilitySettings: updatedSettings,
    });
  } catch (error: any) {
    console.error('[API Admin GitHub Repos POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update repository visibility' },
      { status: 500 }
    );
  }
}
