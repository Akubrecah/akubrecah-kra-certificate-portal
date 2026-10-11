const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('[seed] Seeding initial production CMS records...');

  // 1. Projects
  const projects = [
    {
      id: 'proj_kra_portal',
      slug: 'kra-certificate-portal',
      title: 'KRA Compliance & Certificate Portal',
      summary: 'High-throughput statutory compliance engine processing instant tax certificate retrieval, Nil return filing, and automated PDF generation.',
      description: 'A mission-critical GovTech automation portal serving thousands of Kenyan citizens and enterprises. Built with Next.js 16 App Router, Prisma ORM, Neon PostgreSQL, Safaricom Daraja M-Pesa STK push, Paystack, and an Evolution API WhatsApp bot integration.',
      category: 'GovTech & Compliance',
      client: 'Public Infrastructure / In-House',
      featuredImage: '/akubrecah-logo.webp',
      galleryImages: ['/akubrecah-logo.webp'],
      liveUrl: 'https://akubrecah.vercel.app/retrieval-portal',
      githubUrl: 'https://github.com/Akubrecah/akubrecah-kra-certificate-portal',
      technologies: ['Next.js 16', 'TypeScript', 'Prisma ORM', 'PostgreSQL', 'M-Pesa STK', 'Paystack', 'PDF-Lib', 'WhatsApp Baileys'],
      problemStatement: 'Kenyan taxpayers and enterprise HR teams face lengthy delays and complex portal navigation when retrieving compliance certificates or verifying tax compliance.',
      solutionArchitecture: 'Engineered an in-memory buffer streaming pipeline utilizing PDF-Lib to stream certificates directly to users without storing personal tax documents on the server. Added WhatsApp automated dispatch via self-hosted Evolution API.',
      measurableOutcomes: ['Over 1,360+ successful live transactions', 'Zero-server tax document storage policy enforced', 'Sub-3-second certificate generation and delivery'],
      isFeatured: true,
      isPublished: true,
      displayOrder: 1,
      seoTitle: 'KRA Certificate Retrieval & Compliance Portal | Akubrecah',
      seoDescription: 'Instant official KRA compliance document retrieval and verification engine by Akubrecah.',
    },
    {
      id: 'proj_pos_cloud',
      slug: 'akubrecah-pos-retail-engine',
      title: 'Akubrecah POS Cloud Retail Engine',
      summary: 'Offline-first, enterprise point-of-sale system featuring real-time inventory synchronization, thermal receipt printing, and barcode generation.',
      description: 'A robust commercial retail management system built for high-volume supermarkets, hardware outlets, and restaurants. Supports multi-terminal cashier sessions, automated stock valuation, and reconciliation.',
      category: 'Full-Stack SaaS',
      client: 'Retail Enterprises',
      featuredImage: '/akubrecah-logo.webp',
      galleryImages: [],
      liveUrl: 'https://akubrecah.vercel.app',
      githubUrl: 'https://github.com/Akubrecah/pos',
      technologies: ['React 19', 'Electron / Node.js', 'SQLite', 'PostgreSQL', 'Tailwind CSS', 'ESC/POS Thermal Printing'],
      problemStatement: 'Unreliable internet connectivity in brick-and-mortar retail environments leads to lost sales and inaccurate inventory records.',
      solutionArchitecture: 'Designed an offline-first transactional queue utilizing SQLite with background sync to PostgreSQL once connectivity resumes, coupled with direct thermal ESC/POS raw hardware drivers.',
      measurableOutcomes: ['Zero downtime during internet outages', '100% accurate shift-end cash register reconciliation'],
      isFeatured: true,
      isPublished: true,
      displayOrder: 2,
      seoTitle: 'Akubrecah POS Cloud Retail Engine | Engineering Case Study',
      seoDescription: 'Offline-first retail point-of-sale and inventory control architecture.',
    },
    {
      id: 'proj_vybe_dispatcher',
      slug: 'vybe-africa-orchestration-engine',
      title: 'Vybe Africa Multi-Tenant Dispatcher',
      summary: 'Automated multi-tenant webhook orchestration pipeline handling payment webhooks, receipt generation, and real-time messaging.',
      description: 'High-availability workflow automation platform combining self-hosted n8n workflows with Evolution API WhatsApp gateways and cloud accounting engines.',
      category: 'Fintech / Payments',
      client: 'Vybe Africa',
      featuredImage: '/akubrecah-logo.webp',
      galleryImages: [],
      liveUrl: 'https://akubrecah.vercel.app',
      githubUrl: 'https://github.com/Akubrecah',
      technologies: ['n8n', 'Node.js', 'Docker', 'PostgreSQL', 'Caddy Reverse Proxy', 'WhatsApp API'],
      problemStatement: 'Disjointed communication between payment gateways and end-user notification pipelines resulted in dropped alerts and delayed order fulfillment.',
      solutionArchitecture: 'Configured a Docker Compose stack behind Caddy TLS with automated retry queues, idempotent payment deduplication, and streaming PDF receipt delivery.',
      measurableOutcomes: ['99.98% webhook delivery reliability', 'Instant receipt delivery within 2 seconds of payment'],
      isFeatured: true,
      isPublished: true,
      displayOrder: 3,
      seoTitle: 'Vybe Africa Orchestration Engine | Akubrecah',
      seoDescription: 'Multi-tenant payment dispatcher and workflow automation platform.',
    },
    {
      id: 'proj_azani_isp',
      slug: 'azani-isp-radius-billing',
      title: 'Azani ISP Billing & Mikrotik Radius Engine',
      summary: 'Automated ISP billing, Hotspot bandwidth management, and Mikrotik RouterOS API provisioning engine with M-Pesa instant activation.',
      description: 'Complete telecommunications automation software designed for wireless internet service providers (WISPs). Interacts directly with Mikrotik RouterOS via RouterOS API to provision queues, bandwidth caps, and user accounts upon M-Pesa STK payment.',
      category: 'Fintech / Payments',
      client: 'Regional WISPs',
      featuredImage: '/akubrecah-logo.webp',
      galleryImages: [],
      liveUrl: 'https://akubrecah.vercel.app',
      githubUrl: 'https://github.com/Akubrecah',
      technologies: ['Node.js', 'Mikrotik RouterOS API', 'Daraja STK Push', 'Redis', 'PostgreSQL'],
      problemStatement: 'Manual hotspot voucher generation and static queue management created significant administrative overhead for ISP operators.',
      solutionArchitecture: 'Built an event-driven subscriber provisioning loop that activates Mikrotik dynamic queues within 800ms of Safaricom STK confirmation.',
      measurableOutcomes: ['Automated 100% of hotspot voucher sales', 'Instant internet activation for subscribers'],
      isFeatured: false,
      isPublished: true,
      displayOrder: 4,
      seoTitle: 'Azani ISP Radius Engine | Akubrecah',
      seoDescription: 'ISP billing and RouterOS provisioning engine.',
    },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  // 2. Skill Categories & Skills
  const categories = [
    {
      id: 'cat_systems',
      name: 'Full-Stack & Systems Engineering',
      displayOrder: 1,
      skills: [
        { name: 'Next.js 16 (App Router / Turbopack)', proficiency: 98, yearsOfExp: 6 },
        { name: 'TypeScript (Strict / Type-Safe)', proficiency: 95, yearsOfExp: 6 },
        { name: 'React 19 & Modern Hooks', proficiency: 96, yearsOfExp: 7 },
        { name: 'Node.js & Express / Fastify', proficiency: 94, yearsOfExp: 7 },
        { name: 'Python & Automation Scripting', proficiency: 90, yearsOfExp: 5 },
        { name: 'Rust & Systems Programming', proficiency: 82, yearsOfExp: 2 },
      ],
    },
    {
      id: 'cat_databases',
      name: 'Databases & Data Infrastructure',
      displayOrder: 2,
      skills: [
        { name: 'PostgreSQL & Neon Serverless', proficiency: 95, yearsOfExp: 6 },
        { name: 'Prisma ORM & Query Planning', proficiency: 96, yearsOfExp: 5 },
        { name: 'Redis (Caching & Pub/Sub)', proficiency: 90, yearsOfExp: 4 },
        { name: 'SQLite (Offline-First POS)', proficiency: 92, yearsOfExp: 5 },
      ],
    },
    {
      id: 'cat_cloud',
      name: 'Cloud, DevOps & Security',
      displayOrder: 3,
      skills: [
        { name: 'Docker & Containerization', proficiency: 92, yearsOfExp: 5 },
        { name: 'AWS & Cloud Infrastructure', proficiency: 88, yearsOfExp: 4 },
        { name: 'Vercel Edge & Serverless Functions', proficiency: 96, yearsOfExp: 5 },
        { name: 'Caddy & Reverse Proxies', proficiency: 90, yearsOfExp: 4 },
        { name: 'CI/CD (GitHub Actions)', proficiency: 94, yearsOfExp: 5 },
        { name: 'OWASP Security & Penetration Hardening', proficiency: 90, yearsOfExp: 4 },
      ],
    },
    {
      id: 'cat_fintech',
      name: 'Fintech & Integrations',
      displayOrder: 4,
      skills: [
        { name: 'Safaricom Daraja STK Push & C2B', proficiency: 98, yearsOfExp: 6 },
        { name: 'Paystack Gateway Integration', proficiency: 96, yearsOfExp: 5 },
        { name: 'Evolution API & WhatsApp Baileys', proficiency: 95, yearsOfExp: 3 },
        { name: 'KRA Statutory iTax Reverse Engineering', proficiency: 94, yearsOfExp: 4 },
      ],
    },
  ];

  for (const cat of categories) {
    const { skills, ...catData } = cat;
    const upsertedCat = await prisma.skillCategory.upsert({
      where: { name: cat.name },
      update: catData,
      create: catData,
    });

    for (const s of skills) {
      await prisma.skill.create({
        data: {
          categoryId: upsertedCat.id,
          name: s.name,
          proficiency: s.proficiency,
          yearsOfExp: s.yearsOfExp,
        },
      });
    }
  }

  // 3. Work Experience
  const experiences = [
    {
      id: 'exp_1',
      company: 'Akubrecah Engineering Studio',
      role: 'Principal Software Architect & Lead Engineer',
      location: 'Nairobi, Kenya',
      employmentType: 'Full-time / Founding Lead',
      startDate: '2022',
      endDate: 'Present',
      description: 'Lead architecture, engineering, and maintenance of high-consequence compliance web portals, enterprise retail POS solutions, and automated fintech payment pipelines across East Africa.',
      achievements: [
        'Built Kenyan tax compliance platform handling thousands of document generation requests with sub-3s delivery',
        'Engineered offline-first POS engine deployed to retail outlets with zero downtime',
        'Implemented dual-gateway reconciliation architecture integrating Safaricom M-Pesa Daraja and Paystack',
      ],
      technologies: ['Next.js 16', 'TypeScript', 'PostgreSQL', 'Prisma', 'Docker', 'M-Pesa STK', 'Paystack'],
      displayOrder: 1,
    },
    {
      id: 'exp_2',
      company: 'Enterprise Systems Consultancy',
      role: 'Senior Full-Stack Software Engineer',
      location: 'Nairobi, Kenya',
      employmentType: 'Contract & Advisory',
      startDate: '2020',
      endDate: '2022',
      description: 'Architected scalable SaaS applications, automated reporting microservices, and secure API gateways for medium-to-large business clients.',
      achievements: [
        'Reduced client server costs by 45% through migration to serverless and edge computing',
        'Eliminated payment reconciliation discrepancies with automated webhook verification queues',
      ],
      technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Redis', 'Docker'],
      displayOrder: 2,
    },
  ];

  for (const e of experiences) {
    await prisma.workExperience.upsert({
      where: { id: e.id },
      update: e,
      create: e,
    });
  }

  // 4. Service Offerings
  const services = [
    {
      id: 'srv_1',
      title: 'Full-Stack SaaS & Web Applications',
      slug: 'full-stack-saas-engineering',
      tagline: 'Sub-second, strictly typed web architectures built for scale.',
      description: 'We build reactive web applications using Next.js 16, React 19, TypeScript, and modern relational databases engineered for flawless Core Web Vitals and bulletproof security.',
      icon: 'code',
      deliverables: ['Custom Web App Architecture', 'Strict TypeScript Domain Logic', 'Database Schema & Query Optimization', 'Automated CI/CD Pipeline'],
      technologies: ['Next.js 16', 'React 19', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
      priceStarting: 'KES 250,000',
      isFeatured: true,
      displayOrder: 1,
    },
    {
      id: 'srv_2',
      title: 'GovTech & Statutory Compliance Systems',
      slug: 'govtech-compliance-automation',
      tagline: 'Automated tax verification, document retrieval, and compliance workflows.',
      description: 'We develop specialized portal software that bridges public statutory authorities and private enterprises, enabling automated certificate generation, taxpayer lookups, and compliance checks.',
      icon: 'shield',
      deliverables: ['In-Memory RAM PDF Document Streaming', 'Zero Server File Storage Hardening', 'Automated PIN & National ID Verification', 'High-Availability Worker Architecture'],
      technologies: ['PDF-Lib', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
      priceStarting: 'KES 350,000',
      isFeatured: true,
      displayOrder: 2,
    },
    {
      id: 'srv_3',
      title: 'Fintech & Payment Gateway Pipelines',
      slug: 'fintech-payment-gateways',
      tagline: 'Seamless M-Pesa STK, C2B, and card processing with zero transaction drops.',
      description: 'Enterprise integration with Safaricom Daraja STK Push, C2B Paybill/Till, and Paystack. Includes idempotent transaction processing, webhook deduplication, and live ledger accounting.',
      icon: 'credit-card',
      deliverables: ['Daraja STK Push Integration', 'Webhook Signature Verification', 'Real-Time Financial Reconciliation', 'Automated Customer Receipts'],
      technologies: ['Daraja API', 'Paystack API', 'Next.js', 'PostgreSQL'],
      priceStarting: 'KES 200,000',
      isFeatured: true,
      displayOrder: 3,
    },
    {
      id: 'srv_4',
      title: 'Autonomous WhatsApp & AI Automation Bots',
      slug: 'whatsapp-ai-automation-bots',
      tagline: 'Self-hosted, cost-effective WhatsApp bots for customer service and billing.',
      description: 'Deploy self-hosted WhatsApp automation powered by Evolution API and Baileys. Handles automated customer ordering, document delivery, admin commands, and instant payment links.',
      icon: 'bot',
      deliverables: ['Self-Hosted VPS Setup', 'Multi-Device Baileys Connection', 'Admin Command Center Integration', 'Automated PDF Dispatch'],
      technologies: ['Evolution API', 'Baileys', 'Node.js', 'n8n', 'Docker'],
      priceStarting: 'KES 150,000',
      isFeatured: true,
      displayOrder: 4,
    },
  ];

  for (const s of services) {
    await prisma.serviceOffering.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  // 5. Initial Articles
  const articles = [
    {
      id: 'art_1',
      slug: 'architecting-high-throughput-kenyan-fintech-systems',
      title: 'Architecting High-Throughput Kenyan Fintech Systems with M-Pesa & Next.js',
      excerpt: 'How to build fault-tolerant Daraja STK push pipelines with webhook deduplication, active polling fallbacks, and real-time ledger verification.',
      content: `# Architecting High-Throughput Kenyan Fintech Systems

Integrating payment gateways in East Africa requires engineering for high variability in telecommunication latency and webhook delivery drops.

## The Challenge with Webhook-Only Architecture
Many engineering teams rely solely on Safaricom Daraja webhook callbacks. However, network hops and upstream gateway congestion frequently delay or drop callbacks, resulting in frustrated users whose payments were deducted without their order being marked as completed.

## The Dual-Loop Verification Pattern
In our architecture at Akubrecah, we implement a **Dual-Loop Verification Pattern**:
1. **Immediate STK Dispatch:** The user triggers an STK push.
2. **Active Server-Side Polling:** A background task periodically queries the transaction status for 50 seconds.
3. **Idempotent Webhook Handler:** If the webhook arrives first, it fulfills the transaction and sets state to \`COMPLETED\`. If the active poll detects payment first, it marks state and fulfills in-memory.

This guarantees that users receive their digital assets or compliance certificates within seconds of entering their PIN, even during upstream gateway congestions.`,
      category: 'Fintech & Architecture',
      tags: ['Fintech', 'M-Pesa', 'Next.js', 'Architecture', 'TypeScript'],
      authorName: 'Akubrecah',
      readingTimeMinutes: 6,
      isPublished: true,
      publishedAt: new Date(),
      seoTitle: 'Architecting Kenyan Fintech Systems with M-Pesa | Akubrecah',
      seoDescription: 'High-throughput payment gateway architectures and Daraja integration patterns by Akubrecah.',
    },
    {
      id: 'art_2',
      slug: 'zero-server-storage-statutory-pdf-generation',
      title: 'Zero-Server Storage: Streaming Sensitive PDFs Directly from In-Memory RAM',
      excerpt: 'Why storing tax and identification documents on server disk is a massive security risk, and how to stream them on-the-fly via RAM buffers.',
      content: `# Zero-Server Storage: Streaming Sensitive PDFs Directly from In-Memory RAM

When dealing with government compliance certificates, national IDs, and tax documents, privacy and data protection are paramount.

## The Threat Vector of Server-Stored PDFs
Storing generated PDFs on persistent disk or public object storage buckets introduces compliance and security risks:
- Risk of unauthorized bucket enumeration.
- Orphaned temporary files remaining on local disk indefinitely.
- Potential data breach liability under the Kenya Data Protection Act (KDPA).

## The In-Memory Buffer Solution
By utilizing **PDF-Lib** within Next.js Serverless Route Handlers, documents are synthesized directly in RAM buffers and streamed to the user's browser response with:
\`\`\`http
Content-Type: application/pdf
Content-Disposition: attachment; filename="KRA_Certificate.pdf"
\`\`\`
Once the response stream completes, the buffer is automatically garbage-collected. No files ever touch the server filesystem.`,
      category: 'Security & Cloud',
      tags: ['Security', 'PDF-Lib', 'Serverless', 'Data Privacy'],
      authorName: 'Akubrecah',
      readingTimeMinutes: 5,
      isPublished: true,
      publishedAt: new Date(),
      seoTitle: 'Zero-Server Storage PDF Streaming Architecture | Akubrecah',
      seoDescription: 'In-memory RAM buffer streaming patterns for sensitive documents.',
    },
  ];

  for (const a of articles) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    });
  }

  // 6. Site Settings
  const defaultSettings = [
    { key: 'site_title', value: 'Akubrecah — Principal Software Engineer & Engineering Studio' },
    { key: 'hero_headline', value: 'Architecting High-Consequence Systems, Compliant Portals & Scalable SaaS' },
    { key: 'hero_subheadline', value: 'Senior software engineering, automated GovTech compliance portals, and enterprise fintech integrations built for sub-second performance.' },
    { key: 'contact_email', value: 'engineering@akubrecah.co.ke' },
    { key: 'contact_phone', value: '+254 791 497 858' },
    { key: 'location', value: 'Nairobi, Kenya' },
    { key: 'github_url', value: 'https://github.com/Akubrecah' },
    { key: 'linkedin_url', value: 'https://linkedin.com' },
    { key: 'resume_url', value: '/resume.pdf' },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  console.log('[seed] Successfully seeded initial production CMS records!');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('[seed Error]:', err);
  process.exit(1);
});
