import prisma from '@/lib/prisma';

export async function getPublishedProjects() {
  try {
    return await prisma.project.findMany({
      where: { isPublished: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  } catch (error) {
    console.error('[getPublishedProjects Error]:', error);
    return [];
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    return await prisma.project.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error(`[getProjectBySlug Error for ${slug}]:`, error);
    return null;
  }
}

export async function getPublishedArticles() {
  try {
    return await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (error) {
    console.error('[getPublishedArticles Error]:', error);
    return [];
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    return await prisma.article.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error(`[getArticleBySlug Error for ${slug}]:`, error);
    return null;
  }
}

export async function getSkillsByCategory() {
  try {
    return await prisma.skillCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        skills: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  } catch (error) {
    console.error('[getSkillsByCategory Error]:', error);
    return [];
  }
}

export async function getWorkExperiences() {
  try {
    return await prisma.workExperience.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  } catch (error) {
    console.error('[getWorkExperiences Error]:', error);
    return [];
  }
}

export async function getServiceOfferings() {
  try {
    return await prisma.serviceOffering.findMany({
      where: { isFeatured: true },
      orderBy: { displayOrder: 'asc' },
    });
  } catch (error) {
    console.error('[getServiceOfferings Error]:', error);
    return [];
  }
}

export async function getSiteSettings(): Promise<Record<string, any>> {
  try {
    const records = await prisma.siteSetting.findMany();
    const map: Record<string, any> = {};
    for (const r of records) {
      map[r.key] = r.value;
    }
    return map;
  } catch (error) {
    console.error('[getSiteSettings Error]:', error);
    return {};
  }
}
