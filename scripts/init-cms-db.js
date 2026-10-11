const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initDb() {
  console.log('[initDb] Starting PostgreSQL schema migration for CMS models...');

  const ddlStatements = [
    // 1. Projects
    `CREATE TABLE IF NOT EXISTS "projects" (
      "id" TEXT PRIMARY KEY,
      "slug" TEXT UNIQUE NOT NULL,
      "title" TEXT NOT NULL,
      "summary" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "client" TEXT,
      "featuredImage" TEXT NOT NULL,
      "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "liveUrl" TEXT,
      "githubUrl" TEXT,
      "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "problemStatement" TEXT,
      "solutionArchitecture" TEXT,
      "measurableOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "isFeatured" BOOLEAN DEFAULT false,
      "isPublished" BOOLEAN DEFAULT true,
      "displayOrder" INTEGER DEFAULT 0,
      "seoTitle" TEXT,
      "seoDescription" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "projects_slug_idx" ON "projects"("slug");`,
    `CREATE INDEX IF NOT EXISTS "projects_category_idx" ON "projects"("category");`,
    `CREATE INDEX IF NOT EXISTS "projects_isPublished_idx" ON "projects"("isPublished");`,

    // 2. Articles
    `CREATE TABLE IF NOT EXISTS "articles" (
      "id" TEXT PRIMARY KEY,
      "slug" TEXT UNIQUE NOT NULL,
      "title" TEXT NOT NULL,
      "excerpt" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "featuredImage" TEXT,
      "authorName" TEXT NOT NULL DEFAULT 'Akubrecah',
      "readingTimeMinutes" INTEGER NOT NULL DEFAULT 5,
      "isPublished" BOOLEAN DEFAULT true,
      "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "seoTitle" TEXT,
      "seoDescription" TEXT,
      "canonicalUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles"("slug");`,
    `CREATE INDEX IF NOT EXISTS "articles_category_idx" ON "articles"("category");`,
    `CREATE INDEX IF NOT EXISTS "articles_isPublished_idx" ON "articles"("isPublished");`,

    // 3. Inquiries
    `CREATE TABLE IF NOT EXISTS "inquiries" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "company" TEXT,
      "projectType" TEXT NOT NULL,
      "budget" TEXT,
      "message" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'new',
      "source" TEXT NOT NULL DEFAULT 'website_contact',
      "ipAddress" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "inquiries_status_idx" ON "inquiries"("status");`,
    `CREATE INDEX IF NOT EXISTS "inquiries_createdAt_idx" ON "inquiries"("createdAt");`,

    // 4. Inquiry Notes
    `CREATE TABLE IF NOT EXISTS "inquiry_notes" (
      "id" TEXT PRIMARY KEY,
      "inquiryId" TEXT NOT NULL REFERENCES "inquiries"("id") ON DELETE CASCADE,
      "authorName" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "inquiry_notes_inquiryId_idx" ON "inquiry_notes"("inquiryId");`,

    // 5. Skill Categories & Skills
    `CREATE TABLE IF NOT EXISTS "skill_categories" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT UNIQUE NOT NULL,
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "skills" (
      "id" TEXT PRIMARY KEY,
      "categoryId" TEXT NOT NULL REFERENCES "skill_categories"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "proficiency" INTEGER NOT NULL DEFAULT 90,
      "iconName" TEXT,
      "yearsOfExp" INTEGER,
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "skills_categoryId_idx" ON "skills"("categoryId");`,

    // 6. Work Experience
    `CREATE TABLE IF NOT EXISTS "work_experiences" (
      "id" TEXT PRIMARY KEY,
      "company" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "location" TEXT,
      "employmentType" TEXT,
      "startDate" TEXT NOT NULL,
      "endDate" TEXT,
      "description" TEXT NOT NULL,
      "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 7. Service Offerings
    `CREATE TABLE IF NOT EXISTS "service_offerings" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT UNIQUE NOT NULL,
      "tagline" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "icon" TEXT NOT NULL DEFAULT 'code',
      "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "priceStarting" TEXT,
      "isFeatured" BOOLEAN DEFAULT true,
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 8. Testimonials
    `CREATE TABLE IF NOT EXISTS "testimonials" (
      "id" TEXT PRIMARY KEY,
      "authorName" TEXT NOT NULL,
      "authorTitle" TEXT NOT NULL,
      "company" TEXT NOT NULL,
      "avatarUrl" TEXT,
      "content" TEXT NOT NULL,
      "isVerified" BOOLEAN DEFAULT true,
      "isPublished" BOOLEAN DEFAULT true,
      "displayOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 9. Site Settings
    `CREATE TABLE IF NOT EXISTS "site_settings" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT UNIQUE NOT NULL,
      "value" JSONB NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 10. Media Assets
    `CREATE TABLE IF NOT EXISTS "media_assets" (
      "id" TEXT PRIMARY KEY,
      "filename" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "sizeBytes" INTEGER NOT NULL DEFAULT 0,
      "altText" TEXT,
      "category" TEXT NOT NULL DEFAULT 'general',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "media_assets_category_idx" ON "media_assets"("category");`,
  ];

  for (const sql of ddlStatements) {
    await prisma.$executeRawUnsafe(sql);
  }

  console.log('[initDb] All CMS tables verified/created successfully!');
  await prisma.$disconnect();
}

initDb().catch((err) => {
  console.error('[initDb Error]:', err);
  process.exit(1);
});
