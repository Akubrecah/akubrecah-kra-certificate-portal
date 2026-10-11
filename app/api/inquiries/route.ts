import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEvolutionTextMessage } from '@/lib/evolution';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, phone, company, projectType, budget, message } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Full name is required (at least 2 characters).' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Message must be at least 10 characters detailing your requirements.' }, { status: 400 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // 2. Persistent Database Storage
    const inquiry = await prisma.inquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        company: company ? String(company).trim() : null,
        projectType: projectType ? String(projectType).trim() : 'Software Engineering',
        budget: budget ? String(budget).trim() : 'Flexible',
        message: message.trim(),
        status: 'new',
        source: 'website_contact',
        ipAddress,
      },
    });

    // 3. Instant WhatsApp Notification to Admin Bot (254791497858)
    const adminPhone = process.env.SUPER_ADMIN_PHONE || '254791497858';
    const alertText =
      `🔔 *NEW CLIENT INQUIRY RECEIVED*\n\n` +
      `👤 *Client:* ${inquiry.name}\n` +
      `📧 *Email:* ${inquiry.email}\n` +
      `📱 *Phone:* ${inquiry.phone || 'Not provided'}\n` +
      `🏢 *Company:* ${inquiry.company || 'Individual / Startup'}\n` +
      `🛠️ *Project Type:* ${inquiry.projectType}\n` +
      `💰 *Budget Range:* ${inquiry.budget}\n\n` +
      `📝 *Message:*\n"${inquiry.message}"\n\n` +
      `_Status: NEW. View and manage in your Admin Portal at /admin/inquiries_`;

    sendEvolutionTextMessage(adminPhone, alertText).catch((err) => {
      console.warn('[Inquiries WhatsApp Alert Error]:', err.message);
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your inquiry has been received. Our principal engineering team will review and reply within 24 hours.',
      inquiryId: inquiry.id,
    });
  } catch (error: any) {
    console.error('[API Inquiries POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    );
  }
}
