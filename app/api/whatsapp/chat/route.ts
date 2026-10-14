import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeWhatsAppPhone, sendEvolutionTextMessage, sendEvolutionDocument } from '@/lib/evolution';
import { fetchTaxpayerById, fetchTaxpayerByPin } from '@/lib/kra-api';
import { maskTaxpayerData } from '@/lib/masking';
import { initializePaystackTransaction } from '@/lib/paystack';
import { dispatchMpesaStkPush, normalizePhoneNumber } from '@/app/api/mpesa/stkpush/route';
import { createAdminMagicToken } from '@/lib/magic-token';
import { getPublicAppUrl } from '@/lib/utils';
import {
  getCyberCafeStatus,
  activateCyberCafeSubscription,
  incrementCyberCafeDownloadCount,
  deliverCyberInvoiceToWhatsApp,
  generateCyberInvoicePdfBuffer,
  displayPhone,
  formatKenyaPhone,
} from '@/lib/cyber-subscription';

export const maxDuration = 60;

function extractKenyanPhone(text: string): string | null {
  if (!text) return null;
  const cleaned = text.replace(/[\s\-\+\(\)]/g, '');
  const match = cleaned.match(/(?:254|\+254|0)?([71]\d{8})/);
  if (match && match[1]) {
    return '254' + match[1];
  }
  return null;
}

function formatDisplayPhone(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('254') && phone.length === 12) {
    return '0' + phone.substring(3);
  }
  return phone;
}


async function triggerInAppMpesaPayment({
  targetPhone,
  whatsappUserPhone,
  pin,
  amount,
  taxpayerName,
}: {
  targetPhone: string;
  whatsappUserPhone: string;
  pin: string;
  amount: number;
  taxpayerName?: string;
}): Promise<{
  success: boolean;
  checkoutRequestId?: string;
  gateway?: string;
  normalizedPhone: string;
  error?: string;
}> {
  const normalizedPhone = normalizePhoneNumber(targetPhone);
  const cleanPin = pin.trim().toUpperCase();
  const reference = `CERT-${cleanPin}-${Date.now()}`;

  try {
    const result = await dispatchMpesaStkPush({
      phone: normalizedPhone,
      amount,
      reference,
      description: `KRA Certificate - ${cleanPin}`,
      userClerkId: `wa_${whatsappUserPhone.replace(/[^a-zA-Z0-9]/g, '')}`,
      userEmail: `wa_${whatsappUserPhone.replace(/[^a-zA-Z0-9]/g, '')}@akubrecah.co.ke`,
    });

    return {
      success: result.success,
      checkoutRequestId: result.checkoutRequestId || result.CheckoutRequestID,
      gateway: result.gateway || 'mpesa',
      normalizedPhone,
      error: result.error,
    };
  } catch (err: any) {
    console.error('[WhatsApp triggerInAppMpesaPayment Error]:', err.message);
    return {
      success: false,
      normalizedPhone,
      error: err.message || 'Failed to trigger M-Pesa STK Push',
    };
  }
}

async function triggerCyberCafePayment({
  targetPhone,
  whatsappUserPhone,
  cafeName,
  ownerName,
}: {
  targetPhone: string;
  whatsappUserPhone: string;
  cafeName: string;
  ownerName: string;
}): Promise<{
  success: boolean;
  checkoutRequestId?: string;
  gateway?: string;
  normalizedPhone: string;
  error?: string;
}> {
  const normalizedPhone = normalizePhoneNumber(targetPhone);
  const reference = `CYBER-${Date.now().toString().slice(-6)}`;

  try {
    const result = await dispatchMpesaStkPush({
      phone: normalizedPhone,
      amount: 500,
      reference,
      description: `Cyber Sub - ${cafeName.substring(0, 20)}`,
      userClerkId: `wa_${whatsappUserPhone.replace(/[^a-zA-Z0-9]/g, '')}`,
      userEmail: `cyber_${whatsappUserPhone.replace(/[^a-zA-Z0-9]/g, '')}@akubrecah.co.ke`,
    });

    return {
      success: result.success,
      checkoutRequestId: result.checkoutRequestId || result.CheckoutRequestID,
      gateway: result.gateway || 'mpesa',
      normalizedPhone,
      error: result.error,
    };
  } catch (err: any) {
    console.error('[WhatsApp triggerCyberCafePayment Error]:', err.message);
    return {
      success: false,
      normalizedPhone,
      error: err.message || 'Failed to trigger M-Pesa STK Push',
    };
  }
}

async function createPaystackLink(userPhone: string, pin: string, amount: number, customerName?: string) {
  const appUrl = getPublicAppUrl();
  const reference = `PSTK-CERT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  return await initializePaystackTransaction({
    email: `wa_${userPhone.replace(/[^a-zA-Z0-9]/g, '')}@akubrecah.co.ke`,
    amountKes: amount,
    reference,
    callbackUrl: `${appUrl}/checkout/success?ref=${reference}&pin=${pin}`,
    metadata: {
      clerkId: 'wa_' + userPhone,
      type: 'pay_per_download',
      pin,
      amountKes: amount,
      phone: userPhone,
      customerName: customerName || 'WhatsApp Customer',
    },
  });
}

/**
 * Admin Bot Controller for WhatsApp Super Admin
 * Allows checking revenue, stats, recent logs, bot performance, and generating 1-click magic link
 */
async function handleAdminBotCommand({
  incomingText,
  userPhone,
  metadata,
  saveConversationState,
  db,
  authorPhone,
  isFromBotOwner,
}: {
  incomingText: string;
  userPhone: string;
  metadata: Record<string, any>;
  saveConversationState: (step: string, extra?: Record<string, any>) => Promise<void>;
  db: any;
  authorPhone?: string;
  isFromBotOwner?: boolean;
}): Promise<string | null> {
  const trimmed = incomingText.trim();

  // Strip leading ! or /
  const clean = trimmed.replace(/^[\!\/]/, '').trim();
  const parts = clean.split(/\s+/);
  const rawCmd = parts[0]?.toLowerCase() || '';
  const rawArg = parts.slice(1).join(' ').trim();

  const expectedPin = process.env.ADMIN_BOT_PIN || '8426';
  const hasPinInText = clean.includes(expectedPin) || clean.includes('8426');

  // Check if this message is intended for admin bot
  const adminCmds = [
    'admin',
    'stats',
    'kpi',
    'revenue',
    'rev',
    'logs',
    'tx',
    'transactions',
    'bot',
    'whatsapp',
    'link',
    'magic',
    'web',
    'lock',
    'logout',
    'help',
    'menu',
  ];

  const isAdminTrigger =
    trimmed.startsWith('!') ||
    (trimmed.startsWith('/') && adminCmds.includes(rawCmd)) ||
    adminCmds.includes(rawCmd) ||
    hasPinInText;

  if (!isAdminTrigger) return null;

  const BOT_NUMBER = '254791497858';
  const effectivePhone = authorPhone || userPhone;
  const isOwner = Boolean(
    isFromBotOwner ||
    effectivePhone === BOT_NUMBER ||
    userPhone === BOT_NUMBER ||
    effectivePhone.endsWith(BOT_NUMBER) ||
    BOT_NUMBER.endsWith(effectivePhone)
  );

  const adminNumbersEnv = process.env.ADMIN_WHATSAPP_NUMBERS || process.env.SUPER_ADMIN_PHONE || '';
  const configuredAdmins = adminNumbersEnv.split(',').map((s) => s.replace(/[^0-9]/g, '').trim()).filter(Boolean);
  const adminList = Array.from(new Set([BOT_NUMBER, ...configuredAdmins]));

  const isWhitelisted =
    isOwner ||
    adminList.includes(effectivePhone) ||
    adminList.some((p) => effectivePhone.endsWith(p) || p.endsWith(effectivePhone));

  const hasActivePinSession = Boolean(
    metadata.isAdminAuthenticated && metadata.adminAuthExpiry && Date.now() < metadata.adminAuthExpiry
  );

  // Authenticate if owner, whitelisted, active session, OR if message contains the master PIN!
  let isAdminAuthenticated = isWhitelisted || hasActivePinSession || hasPinInText;

  if (hasPinInText && !hasActivePinSession) {
    await saveConversationState(metadata.step || 'IDLE', {
      isAdminAuthenticated: true,
      adminAuthExpiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    isAdminAuthenticated = true;
  }

  // Handle nested sub-commands like "admin stats", "admin revenue", "admin logs", "admin link"
  let cmd = rawCmd;
  let arg = rawArg;
  if (cmd === 'admin' && arg && adminCmds.includes(arg.toLowerCase())) {
    cmd = arg.toLowerCase();
    arg = '';
  }

  // If user entered admin command without authentication and without PIN
  if (!isAdminAuthenticated) {
    return (
      `🔐 *Akubrecah KRA — Admin Verification Required*\n\n` +
      `Your phone is not yet unlocked for admin operations.\n\n` +
      `To unlock, reply:\n` +
      `*!admin 8426* or simply *8426*\n\n` +
      `_(Default master PIN is 8426)_`
    );
  }

  // From here on, caller is fully authenticated!
  const appUrl = getPublicAppUrl();

  // 1. Lock command
  if (cmd === 'lock' || cmd === 'logout') {
    await saveConversationState(metadata.step || 'IDLE', {
      isAdminAuthenticated: false,
      adminAuthExpiry: 0,
    });
    return `🔒 *Admin Session Locked.*\nSend *!admin 8426* anytime to re-authenticate.`;
  }

  // 2. 1-Click Magic Link
  if (cmd === 'link' || cmd === 'magic' || cmd === 'web') {
    const magicToken = createAdminMagicToken(effectivePhone || BOT_NUMBER);
    const magicUrl = `${appUrl}/api/admin/magic-login?token=${magicToken}`;
    return (
      `👑 *1-Click Admin Web Access*\n\n` +
      `Tap the link below to open your Executive Admin Dashboard directly without entering any password:\n\n` +
      `👉 ${magicUrl}\n\n` +
      `⏳ _This cryptographically signed token is valid for 4 hours._`
    );
  }

  // 3. !stats
  if (cmd === 'stats' || cmd === 'kpi') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let downloads: any[] = [];
    if (typeof db.certificateDownload?.findMany === 'function') {
      downloads = await db.certificateDownload.findMany({ take: 1000, orderBy: { createdAt: 'desc' } });
    }

    const totalRev = downloads.reduce((acc, c) => acc + (Number(c.amountCharged) || 0), 0);
    const todayRev = downloads
      .filter((d) => new Date(d.createdAt) >= startOfToday)
      .reduce((acc, c) => acc + (Number(c.amountCharged) || 0), 0);

    const waDownloads = downloads.filter((d) => d.clerkId?.startsWith('wa_')).length;

    let totalSessions = 0;
    let pcSessions = 0;
    if (typeof db.sessions?.findMany === 'function') {
      const s = await db.sessions.findMany({ take: 500 });
      totalSessions = s.length;
      pcSessions = s.filter((sess: any) => !sess.is_mobile).length;
    }
    const pcPct = totalSessions > 0 ? Math.round((pcSessions / totalSessions) * 100) : 65;
    const mobPct = 100 - pcPct;

    let botUsers = 0;
    if (typeof db.ai_conversations?.count === 'function') {
      botUsers = await db.ai_conversations.count({ where: { channel: 'whatsapp' } });
    }

    return (
      `📊 *AKUBRECAH KRA — LIVE EXECUTIVE STATS*\n\n` +
      `💰 *Total Revenue:* KES ${totalRev.toLocaleString()}\n` +
      `📈 *Today's Revenue:* KES ${todayRev.toLocaleString()}\n` +
      `📜 *Total Downloads:* ${downloads.length}\n` +
      `🤖 *WhatsApp Bot Downloads:* ${waDownloads} (${downloads.length > 0 ? Math.round((waDownloads / downloads.length) * 100) : 0}%)\n` +
      `💬 *WhatsApp Bot Users:* ${botUsers}\n` +
      `💻 *Web Traffic:* ${pcPct}% PC (Desktop) / ${mobPct}% Mobile\n\n` +
      `_Reply *!revenue* for financial details or *!link* for web dashboard._`
    );
  }

  // 4. !revenue
  if (cmd === 'revenue' || cmd === 'rev') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let downloads: any[] = [];
    if (typeof db.certificateDownload?.findMany === 'function') {
      downloads = await db.certificateDownload.findMany({ take: 1000 });
    }

    const totalRev = downloads.reduce((acc, c) => acc + (Number(c.amountCharged) || 0), 0);
    const todayRev = downloads.filter((d) => new Date(d.createdAt) >= startOfToday).reduce((acc, c) => acc + (Number(c.amountCharged) || 0), 0);
    const sevenDayRev = downloads.filter((d) => new Date(d.createdAt) >= sevenDaysAgo).reduce((acc, c) => acc + (Number(c.amountCharged) || 0), 0);
    const thirtyDayRev = downloads.filter((d) => new Date(d.createdAt) >= thirtyDaysAgo).reduce((acc, c) => acc + (Number(c.amountCharged) || 0), 0);

    const mpesaRev = downloads.filter((d) => Boolean(d.mpesaReceipt)).reduce((acc, c) => acc + (Number(c.amountCharged) || 0), 0);
    const paystackRev = totalRev - mpesaRev;

    return (
      `💰 *REVENUE BREAKDOWN REPORT*\n\n` +
      `• *Total Lifetime:* KES ${totalRev.toLocaleString()}\n` +
      `• *Today:* KES ${todayRev.toLocaleString()}\n` +
      `• *Last 7 Days:* KES ${sevenDayRev.toLocaleString()}\n` +
      `• *Last 30 Days:* KES ${thirtyDayRev.toLocaleString()}\n\n` +
      `💳 *By Payment Gateway:*\n` +
      `• *M-Pesa STK:* KES ${mpesaRev.toLocaleString()} (${totalRev > 0 ? Math.round((mpesaRev / totalRev) * 100) : 0}%)\n` +
      `• *Paystack Card/Bank:* KES ${paystackRev.toLocaleString()} (${totalRev > 0 ? Math.round((paystackRev / totalRev) * 100) : 0}%)\n\n` +
      `_Reply *!logs* to view recent transaction receipts._`
    );
  }

  // 5. !logs
  if (cmd === 'logs' || cmd === 'transactions' || cmd === 'tx') {
    let recent: any[] = [];
    if (typeof db.certificateDownload?.findMany === 'function') {
      recent = await db.certificateDownload.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
    }

    if (recent.length === 0) {
      return `🧾 *TRANSACTION LOGS*\n\nNo certificate downloads or transactions recorded yet.`;
    }

    let report = `🧾 *LATEST 5 TRANSACTIONS*\n\n`;
    recent.forEach((item, index) => {
      const isWa = item.clerkId?.startsWith('wa_');
      const channel = isWa ? '🤖 WhatsApp' : '🌐 Web Portal';
      const receipt = item.mpesaReceipt || item.checkoutId || 'STK-VERIFIED';
      const timeStr = new Date(item.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

      report +=
        `*${index + 1}. PIN:* ${item.pin}\n` +
        `   • Amount: *KES ${item.amountCharged}.00*\n` +
        `   • Channel: ${channel}\n` +
        `   • Receipt: \`${receipt}\`\n` +
        `   • Time: ${timeStr}\n\n`;
    });

    report += `_Reply *!link* for full searchable transaction table on web._`;
    return report;
  }

  // 6. !bot
  if (cmd === 'bot' || cmd === 'whatsapp') {
    let totalBotUsers = 0;
    let totalConversations = 0;
    if (typeof db.ai_conversations?.findMany === 'function') {
      const chats = await db.ai_conversations.findMany({ where: { channel: 'whatsapp' } });
      totalConversations = chats.length;
      totalBotUsers = new Set(chats.map((c: any) => c.user_phone).filter(Boolean)).size;
    }

    let waDownloads = 0;
    let waRevenue = 0;
    if (typeof db.certificateDownload?.findMany === 'function') {
      const dl = await db.certificateDownload.findMany({ where: { clerkId: { startsWith: 'wa_' } } });
      waDownloads = dl.length;
      waRevenue = dl.reduce((acc: number, c: any) => acc + (Number(c.amountCharged) || 0), 0);
    }

    const conversionRate = totalBotUsers > 0 ? ((waDownloads / totalBotUsers) * 100).toFixed(1) : '0.0';

    return (
      `🤖 *WHATSAPP BOT PERFORMANCE*\n\n` +
      `• *Total Bot Users:* ${totalBotUsers} unique numbers\n` +
      `• *Total Conversations:* ${totalConversations}\n` +
      `• *Certificates Downloaded:* ${waDownloads}\n` +
      `• *Bot-Driven Revenue:* KES ${waRevenue.toLocaleString()}\n` +
      `• *Bot Conversion Rate:* ${conversionRate}%\n\n` +
      `_Commands: !stats, !revenue, !logs, !link, !lock_`
    );
  }

  // 7. Menu / Help / Default
  return (
    `👑 *AKUBRECAH KRA — ADMIN COMMAND CENTER*\n\n` +
    `• *!stats* — Real-time Executive KPIs (Revenue, Users, PC vs Mobile)\n` +
    `• *!revenue* — Revenue Breakdown (Today, 7d, Gateways)\n` +
    `• *!logs* — Last 5 Transactions & Receipts\n` +
    `• *!bot* — WhatsApp Bot Adoption & Stats\n` +
    `• *!link* — 1-Click Web Dashboard Login Link\n` +
    `• *!lock* — Lock session\n\n` +
    `_Reply with any command (e.g. *!stats* or *!link*) to run immediately._`
  );
}

/**
 * Handles taxpayer fulfillment:
 * If caller is an active Cyber Cafe subscriber, delivers certificate instantly with zero payment prompt!
 * Otherwise, triggers the standard KES 20 M-Pesa STK push.
 */
async function handleTaxpayerFoundFulfillment({
  userPhone,
  taxpayer,
  idOrPinInput,
  saveConversationState,
}: {
  userPhone: string;
  taxpayer: any;
  idOrPinInput: string;
  saveConversationState: (step: string, extra?: Record<string, any>) => Promise<string | void>;
}): Promise<string> {
  const cleanPin = taxpayer.pin ? taxpayer.pin.toUpperCase().trim() : '';
  const masked = maskTaxpayerData(taxpayer);

  // 1. Check if user belongs to an active Cyber Cafe subscription
  const cyberStatus = await getCyberCafeStatus(userPhone);

  if (cyberStatus.isActive && cyberStatus.cafe) {
    if (cyberStatus.dailyQuotaExceeded) {
      await saveConversationState('IDLE', { activeSession: false });
      return (
        `⚠️ *Daily Fair-Use Limit Reached (100/100)*\n\n` +
        `Your cyber cafe (*${cyberStatus.cafe.cafeName}*) has reached today's limit of 100 certificate downloads. It automatically resets at midnight.\n\n` +
        `_Days remaining on package: ${cyberStatus.daysRemaining} days_`
      );
    }

    // Fulfill instantly without payment prompt!
    await incrementCyberCafeDownloadCount(cyberStatus.cafe.id);
    const { fulfillWhatsAppCertificateDelivery } = await import('@/lib/certificate-fulfillment');
    await fulfillWhatsAppCertificateDelivery({
      phone: userPhone,
      pin: cleanPin,
      checkoutId: `CYBER_${Date.now()}`,
      mpesaReceipt: 'CYBER_SUB_ACTIVE',
      amount: 0,
      taxpayerName: taxpayer.taxpayerName,
      taxpayerDetails: taxpayer,
      isCyberSubscription: true,
      daysRemaining: cyberStatus.daysRemaining,
    });

    await saveConversationState('IDLE', {
      activeSession: false,
      lastPin: cleanPin,
      pin: null,
      taxpayerDetails: null,
    });

    return '';
  }

  // 2. Regular pay-per-download flow (KES 20 STK push)
  const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);
  const stkRes = await triggerInAppMpesaPayment({
    targetPhone: userPhone,
    whatsappUserPhone: userPhone,
    pin: cleanPin,
    amount: downloadFee,
    taxpayerName: taxpayer.taxpayerName,
  });

  await saveConversationState('AWAITING_PAYMENT', {
    activeSession: true,
    pin: cleanPin,
    idNumber: taxpayer.idNumber || idOrPinInput,
    taxpayerName: taxpayer.taxpayerName,
    checkoutId: stkRes.checkoutRequestId || '',
    paymentPhone: stkRes.normalizedPhone,
    stkGateway: stkRes.gateway,
    taxpayerDetails: taxpayer,
    pushedAt: Date.now(),
  });

  if (stkRes.success) {
    return (
      `✅ *${masked.taxpayerName}* (\`${masked.pin}\`)\n` +
      `📲 M-Pesa prompt sent to \`${stkRes.normalizedPhone}\` (KES ${downloadFee}). Enter PIN to receive your certificate.\n` +
      `_Reply 1 to resend, or 0 to cancel._`
    );
  } else {
    return (
      `✅ *${masked.taxpayerName}* (\`${masked.pin}\`)\n` +
      `⚠️ M-Pesa prompt failed: ${stkRes.error || 'Network error'}.\n` +
      `👉 Send another Safaricom number (e.g. *0712345678*) or reply 0 to cancel.`
    );
  }
}

export async function handleWhatsAppChat(params: {
  phone: string;
  message: string;
  sendDirect?: boolean;
  authorPhone?: string;
  isFromBotOwner?: boolean;
}) {
  const { phone: rawPhone, message: rawMessage, sendDirect = true, authorPhone, isFromBotOwner } = params;

  if (!rawPhone || !rawMessage) {
    return { success: false, error: 'Both phone and message are required.' };
  }

  try {

    const userPhone = sanitizeWhatsAppPhone(rawPhone);
    const incomingText = String(rawMessage).trim();
    const lowerText = incomingText.toLowerCase();
    const db = prisma as any;

    // 1. Fetch or initialize conversation state in Prisma
    let conversation = await db.ai_conversations?.findFirst({
      where: {
        channel: 'whatsapp',
        user_phone: userPhone,
        status: 'active',
      },
    });

    if (!conversation) {
      const convId = 'wa_' + userPhone + '_' + Date.now();
      conversation = await db.ai_conversations?.create({
        data: {
          id: convId,
          channel: 'whatsapp',
          user_phone: userPhone,
          status: 'active',
          metadata: { step: 'IDLE' },
        },
      });
    }

    const metadata: Record<string, any> = (conversation.metadata as Record<string, any>) || { step: 'IDLE' };
    let replyText = '';
    let nextStep = metadata.step || 'IDLE';

    async function saveConversationState(newStep: string, extraMeta: Record<string, any> = {}) {
      metadata.step = newStep;
      metadata.lastActiveAt = Date.now();
      metadata.activeSession = newStep !== 'IDLE' && newStep !== 'COMPLETED';
      Object.assign(metadata, extraMeta);

      await db.ai_conversations?.update({
        where: { id: conversation.id },
        data: {
          metadata,
          updated_at: new Date(),
        },
      });
      nextStep = newStep;
    }

    const lastActiveAt = Number(metadata.lastActiveAt || (conversation.updated_at ? new Date(conversation.updated_at).getTime() : 0));
    const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours active session timeout
    const isSessionExpired = lastActiveAt > 0 && (Date.now() - lastActiveAt) > SESSION_TIMEOUT_MS;

    let currentStep = metadata.step || 'IDLE';
    let isSessionActive = Boolean(metadata.activeSession) && currentStep !== 'IDLE' && currentStep !== 'COMPLETED';

    if (isSessionExpired && isSessionActive) {
      currentStep = 'IDLE';
      isSessionActive = false;
      await saveConversationState('IDLE', { activeSession: false });
    }

    // 0. Check for Admin Bot Commands (!admin, !stats, !revenue, !logs, !link, !bot)
    const adminReply = await handleAdminBotCommand({
      incomingText,
      userPhone,
      metadata,
      saveConversationState,
      db,
      authorPhone,
      isFromBotOwner,
    });

    if (adminReply) {
      let sendResult = null;
      if (sendDirect) {
        sendResult = await sendEvolutionTextMessage(userPhone, adminReply);
      }
      return {
        success: true,
        userPhone,
        step: metadata.step || 'IDLE',
        reply: adminReply,
        metadata,
        sendResult,
      };
    }

    const isSlashCommand = incomingText.startsWith('/');
    const cleanCmdText = incomingText.replace(/^[\!\/]/, '').trim().toLowerCase();
    const cleanCmdWord = cleanCmdText.split(/\s+/)[0] || '';

    // 2. Normal Message Filter:
    // • If user is an active Cyber Cafe subscriber and sends a National ID number or KRA PIN, process it directly!
    // • If user sends keywords like "renew", "cyber", "status", "days", "invoice", "subscribe", let it through!
    const isPotentialIdOrPin = /^[A-Za-z]\d{9}[A-Za-z]$/.test(incomingText) || /^\d{6,9}$/.test(incomingText);
    const isCyberKeyword = ['renew', 'cyber', 'status', 'days', 'subscribe', 'package', 'invoice', 'sub'].includes(cleanCmdWord);

    if (!isSlashCommand && !isSessionActive) {
      if (isPotentialIdOrPin) {
        const cyberCheck = await getCyberCafeStatus(userPhone);
        if (cyberCheck.isActive) {
          isSessionActive = true;
          currentStep = 'AWAITING_INPUT';
        }
      } else if (isCyberKeyword) {
        isSessionActive = true;
      }
    }

    if (!isSlashCommand && !isSessionActive && !isCyberKeyword) {
      console.log(`[WhatsApp Chat] Ignored normal message from ${userPhone} (no active bot session).`);
      return {
        success: true,
        userPhone,
        step: currentStep,
        reply: null,
        ignored: true,
        message: 'Normal message ignored. Bot is only triggered by "/" commands until initiated.',
      };
    }

    // 3. Process Slash Commands & Cyber Keywords
    if (isSlashCommand || isCyberKeyword) {
      const cleanCmd = incomingText.replace(/^[\!\/]/, '').trim();
      const spaceIdx = cleanCmd.search(/\s+/);
      const cmdWord = (spaceIdx === -1 ? cleanCmd : cleanCmd.substring(0, spaceIdx)).toLowerCase();
      const cmdArgs = (spaceIdx === -1 ? '' : cleanCmd.substring(spaceIdx + 1)).trim();

      // A. Cancellation / Exit / Reset
      if (['cancel', 'exit', 'stop', 'reset'].includes(cmdWord)) {
        await saveConversationState('IDLE', {
          activeSession: false,
          pin: null,
          idNumber: null,
          taxpayerDetails: null,
          paymentPhone: null,
          suggestedPhone: null,
        });

        replyText = `✅ *Session Cancelled*\n\nThe KRA bot is now idle. Send */kra* or */menu* anytime you want to start again.`;
      }
      // B. Cyber Cafe Subscription / Registration: /cyber, /subscribe, /package
      else if (['cyber', 'subscribe', 'package'].includes(cmdWord)) {
        const cyberCheck = await getCyberCafeStatus(userPhone);

        if (cyberCheck.isActive && cyberCheck.cafe) {
          replyText =
            `🏢 *${cyberCheck.cafe.cafeName}* — 🟢 ACTIVE\n` +
            `• ${cyberCheck.daysRemaining} days left | Today: ${cyberCheck.cafe.dailyDownloads}/100 lookups\n` +
            `_Send National ID or PIN for instant certificate._`;
        } else {
          await saveConversationState('CYBER_REG_NAME', {
            activeSession: true,
            cyberCafeName: null,
            cyberOwnerName: null,
            cyberWaPhone: null,
            cyberPaymentPhone: null,
          });

          replyText =
            `🏢 *Cyber Cafe Package (KES 500/Month)*\n` +
            `Step 1/4: What is your *Cyber Cafe Business Name*?\n` +
            `_(Reply 0 to cancel)_`;
        }
      }
      // C. Status & Days Remaining: /status, /days, /sub
      else if (['status', 'days', 'sub'].includes(cmdWord)) {
        const cyberCheck = await getCyberCafeStatus(userPhone);

        if (cyberCheck.isActive && cyberCheck.cafe) {
          replyText =
            `🏢 *${cyberCheck.cafe.cafeName}* — 🟢 ACTIVE\n` +
            `• ${cyberCheck.daysRemaining} days left | Today: ${cyberCheck.cafe.dailyDownloads}/100 lookups\n` +
            `_Send National ID or PIN for instant certificate._`;
        } else if (cyberCheck.isRegistered && cyberCheck.cafe) {
          replyText =
            `⚠️ *Cyber Cafe Expired (${cyberCheck.cafe.cafeName})*\n` +
            `Reply *RENEW* to reactivate 30 days unlimited for KES 500.`;
        } else {
          replyText =
            `ℹ️ No active Cyber Cafe subscription.\n` +
            `Send */cyber* to register for KES 500/Month unlimited package.`;
        }
      }
      // D. Send Latest Tax Invoice PDF: /invoice
      else if (['invoice', 'invoices', 'receipt'].includes(cmdWord)) {
        const cyberCheck = await getCyberCafeStatus(userPhone);

        if (cyberCheck.isRegistered && cyberCheck.cafe) {
          const latestInv = await db.cyberInvoice?.findFirst({
            where: { cyberCafeId: cyberCheck.cafe.id },
            orderBy: { createdAt: 'desc' },
          });

          if (latestInv) {
            const pdfBuf = await generateCyberInvoicePdfBuffer({
              invoiceNumber: latestInv.invoiceNumber,
              cafeName: cyberCheck.cafe.cafeName,
              ownerName: cyberCheck.cafe.ownerName,
              whatsappPhone: cyberCheck.cafe.whatsappPhone,
              paymentPhone: cyberCheck.cafe.paymentPhone,
              amount: latestInv.amount,
              mpesaReceipt: latestInv.mpesaReceipt || 'MPESA-PAID',
              periodStart: latestInv.periodStart,
              periodEnd: latestInv.periodEnd,
            });

            await sendEvolutionDocument({
              phone: userPhone,
              pdfBuffer: pdfBuf,
              fileName: `Tax_Invoice_${latestInv.invoiceNumber}.pdf`,
              caption: `🧾 *Official Fiscal Tax Invoice (${latestInv.invoiceNumber})*\n• Cyber Cafe: *${cyberCheck.cafe.cafeName}*\n• Amount: *KES ${Number(latestInv.amount).toFixed(2)}*\n• Days Remaining: *${cyberCheck.daysRemaining} Days*`,
            });

            replyText =
              `🧾 *Official Tax Invoice Delivered Above!*\n\n` +
              `• *Invoice No:* ${latestInv.invoiceNumber}\n` +
              `• *Cyber Cafe:* ${cyberCheck.cafe.cafeName}\n` +
              `• *Amount Paid:* KES ${Number(latestInv.amount).toFixed(2)}\n` +
              `• *Days Remaining:* ⚡ *${cyberCheck.daysRemaining} Days*\n\n` +
              `_The PDF document is attached above for your business accounting and tax records._`;
          } else {
            replyText = `⚠️ No invoice records found for ${cyberCheck.cafe.cafeName}. Send */cyber* to renew your subscription.`;
          }
        } else {
          replyText = `ℹ️ You are not registered under a Cyber Cafe package yet. Send */cyber* to subscribe for KES 500/Month.`;
        }
      }
      // E. Early Renewal: renew / /renew
      else if (cmdWord === 'renew') {
        const cyberCheck = await getCyberCafeStatus(userPhone);

        if (cyberCheck.isRegistered && cyberCheck.cafe) {
          const stkRes = await triggerCyberCafePayment({
            targetPhone: cyberCheck.cafe.paymentPhone,
            whatsappUserPhone: userPhone,
            cafeName: cyberCheck.cafe.cafeName,
            ownerName: cyberCheck.cafe.ownerName,
          });

          await saveConversationState('CYBER_AWAITING_PAYMENT', {
            activeSession: true,
            checkoutId: stkRes.checkoutRequestId || '',
            paymentPhone: stkRes.normalizedPhone,
            cyberCafeName: cyberCheck.cafe.cafeName,
            cyberOwnerName: cyberCheck.cafe.ownerName,
            cyberWaPhone: cyberCheck.cafe.whatsappPhone,
            isRenewal: true,
            pushedAt: Date.now(),
          });

          if (stkRes.success) {
            replyText =
              `📲 *M-PESA RENEWAL PROMPT SENT (KES 500.00)*\n` +
              `─────────────────────────────────────────\n` +
              `• *Cyber Cafe:* ${cyberCheck.cafe.cafeName}\n` +
              `• *Payment Handset:* \`${stkRes.normalizedPhone}\`\n` +
              `• *Stacking Renewal:* +30 Days will be added to your expiry date!\n` +
              `• *Current Remaining:* ${cyberCheck.daysRemaining} Days\n\n` +
              `👉 Enter your M-Pesa PIN on that handset to complete renewal.\n\n` +
              `_Options:_\n` +
              `• Didn't see prompt? Reply *1* or *RESEND*\n` +
              `• Different number? Send your Safaricom number (e.g. *0712345678*)\n` +
              `• Reply *0* to cancel`;
          } else {
            replyText =
              `⚠️ *Could not send renewal prompt:* ${stkRes.error || 'Network error'}.\n\n` +
              `👉 Send another Safaricom phone number (e.g. *0712345678*) or reply *0* to cancel.`;
          }
        } else {
          await saveConversationState('CYBER_REG_NAME', {
            activeSession: true,
            cyberCafeName: null,
            cyberOwnerName: null,
            cyberWaPhone: null,
            cyberPaymentPhone: null,
          });

          replyText =
            `🏢 *CYBER CAFE SUBSCRIPTION (KES 500 / Month)*\n\n` +
            `👉 *Step 1 of 4:* What is your *Cyber Cafe Business Name*? (e.g. *Apex Cyber Services*)\n\n` +
            `_(Reply 0 to cancel)_`;
        }
      }
      // F. Menu or Direct Lookup: /kra, /menu, /start, /help, /pin
      else if (['kra', 'menu', 'start', 'help', 'pin'].includes(cmdWord)) {
        // Direct search: /kra <ID_OR_PIN> or /pin <ID_OR_PIN>
        if (cmdArgs) {
          const isPin = /^[A-Za-z]\d{9}[A-Za-z]$/.test(cmdArgs);
          const isId = /^\d{6,9}$/.test(cmdArgs);

          if (!isPin && !isId) {
            await saveConversationState('AWAITING_INPUT', { activeSession: true });
            replyText =
              `⚠️ Invalid format. Send valid National ID (6-9 digits) or KRA PIN (e.g. A012345678Z).\n` +
              `_(Reply 0 to cancel)_`;
          } else {
            let taxpayer: any = null;
            try {
              if (isPin) {
                taxpayer = await fetchTaxpayerByPin(cmdArgs.toUpperCase());
              } else {
                taxpayer = await fetchTaxpayerById(cmdArgs);
              }
            } catch (kraError: any) {
              console.warn('[WhatsApp KRA Direct Lookup Notice]:', kraError.message);
            }

            if (!taxpayer || !taxpayer.taxpayerName) {
              await saveConversationState('AWAITING_INPUT', { activeSession: true });
              replyText =
                `❌ No record found on KRA database for \`${cmdArgs}\`.\n` +
                `Send another ID/PIN or reply 0 to cancel.`;
            } else {
              // Fulfill instantly if Cyber Cafe subscriber, else prompt KES 20
              replyText = await handleTaxpayerFoundFulfillment({
                userPhone,
                taxpayer,
                idOrPinInput: cmdArgs,
                saveConversationState,
              });
            }
          }
        } else {
          // Standard menu trigger without args
          const cyberCheck = await getCyberCafeStatus(userPhone);

          await saveConversationState('AWAITING_INPUT', {
            activeSession: true,
            pin: null,
            idNumber: null,
            taxpayerDetails: null,
            paymentPhone: null,
            suggestedPhone: null,
          });

          replyText =
            `*Akubrecah KRA Portal*${cyberCheck.isActive ? ` (${cyberCheck.daysRemaining}d active)` : ''}\n` +
            `Send National ID or KRA PIN to retrieve certificate.\n` +
            `_Commands: /cyber (KES 500/mo), /status, /invoice, /cancel_`;
        }
      }
      // G. Other/Unknown slash commands
      else {
        replyText =
          `*Commands:*\n` +
          `• Send National ID or PIN to look up\n` +
          `• */cyber* (KES 500/mo) | */status* | */cancel*`;
      }
    }
    // 4. Step AWAITING_INPUT: User entered bot mode via /kra or /menu and sends their National ID or PIN without slashes
    else if (currentStep === 'AWAITING_INPUT') {
      const isPin = /^[A-Za-z]\d{9}[A-Za-z]$/.test(incomingText);
      const isId = /^\d{6,9}$/.test(incomingText);

      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'exit') {
        await saveConversationState('IDLE', {
          activeSession: false,
          pin: null,
          idNumber: null,
          taxpayerDetails: null,
          paymentPhone: null,
          suggestedPhone: null,
        });
        replyText = `✅ *Session Cancelled*\n\nThe KRA bot is now idle. Send */kra* to start again.`;
      } else if (!isPin && !isId) {
        await saveConversationState('AWAITING_INPUT', { activeSession: true });
        replyText =
          `⚠️ Invalid format. Send valid National ID (6-9 digits) or KRA PIN (e.g. A012345678Z).\n` +
          `_(Reply 0 to cancel)_`;
      } else {
        let taxpayer: any = null;
        try {
          if (isPin) {
            taxpayer = await fetchTaxpayerByPin(incomingText.toUpperCase());
          } else {
            taxpayer = await fetchTaxpayerById(incomingText);
          }
        } catch (kraError: any) {
          console.warn('[WhatsApp KRA Lookup Notice]:', kraError.message);
        }

        if (!taxpayer || !taxpayer.taxpayerName) {
          await saveConversationState('AWAITING_INPUT', { activeSession: true });
          replyText =
            `❌ No record found on KRA database for \`${incomingText}\`.\n` +
            `Send another ID/PIN or reply 0 to cancel.`;
        } else {
          // Fulfill instantly if Cyber Cafe subscriber, else prompt KES 20
          replyText = await handleTaxpayerFoundFulfillment({
            userPhone,
            taxpayer,
            idOrPinInput: incomingText,
            saveConversationState,
          });
        }
      }
    }
    // 5. Cyber Cafe Registration Steps
    else if (currentStep === 'CYBER_REG_NAME') {
      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'exit') {
        await saveConversationState('IDLE', { activeSession: false });
        replyText = `✅ *Registration Cancelled*\n\nSend */cyber* or */menu* anytime to start again.`;
      } else {
        const cafeName = incomingText.trim();
        await saveConversationState('CYBER_REG_OWNER', {
          activeSession: true,
          cyberCafeName: cafeName,
        });
        replyText =
          `🏢 *Cyber Cafe:* ${cafeName}\n\n` +
          `👉 *Step 2 of 4:* What is the *Owner or Attendant Name*? (e.g. *John Kamau*)\n\n` +
          `_(Reply *0* to cancel)_`;
      }
    }
    else if (currentStep === 'CYBER_REG_OWNER') {
      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'exit') {
        await saveConversationState('IDLE', { activeSession: false });
        replyText = `✅ *Registration Cancelled*\n\nSend */cyber* anytime to start again.`;
      } else {
        const ownerName = incomingText.trim();
        await saveConversationState('CYBER_REG_WHATSAPP', {
          activeSession: true,
          cyberOwnerName: ownerName,
        });
        replyText =
          `👤 *Operator:* ${ownerName}\n` +
          `Step 3/4: WhatsApp number to activate? (Reply *SAME* for ${formatDisplayPhone(userPhone)} or send number)\n` +
          `_(Reply 0 to cancel)_`;
      }
    }
    else if (currentStep === 'CYBER_REG_WHATSAPP') {
      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'exit') {
        await saveConversationState('IDLE', { activeSession: false });
        replyText = `✅ *Registration Cancelled*\n\nSend */cyber* anytime to start again.`;
      } else {
        let targetWa = userPhone;
        if (lowerText !== 'same' && lowerText !== 'this' && lowerText !== 'here') {
          const extracted = extractKenyanPhone(incomingText);
          if (!extracted) {
            replyText =
              `⚠️ Invalid phone number. Reply *SAME* or enter Safaricom number (e.g. *0712345678*).\n_(Reply 0 to cancel)_`;
            return {
              success: true,
              userPhone,
              step: currentStep,
              reply: replyText,
              metadata,
              sendResult: sendDirect ? await sendEvolutionTextMessage(userPhone, replyText) : null,
            };
          }
          targetWa = extracted;
        }

        await saveConversationState('CYBER_REG_PAYMENT', {
          activeSession: true,
          cyberWaPhone: targetWa,
        });

        replyText =
          `📱 *Activated Line:* \`${formatDisplayPhone(targetWa)}\`\n` +
          `Step 4/4: Safaricom M-Pesa number to pay KES 500? (Reply *SAME* for ${formatDisplayPhone(userPhone)} or send number)\n` +
          `_(Reply 0 to cancel)_`;
      }
    }
    else if (currentStep === 'CYBER_REG_PAYMENT') {
      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'exit') {
        await saveConversationState('IDLE', { activeSession: false });
        replyText = `✅ *Registration Cancelled*\n\nSend */cyber* anytime to start again.`;
      } else {
        let targetPay = userPhone;
        if (lowerText !== 'same' && lowerText !== 'this' && lowerText !== 'here') {
          const extracted = extractKenyanPhone(incomingText);
          if (!extracted) {
            replyText =
              `⚠️ Invalid phone number. Reply *SAME* or enter Safaricom number (e.g. *0712345678*).\n_(Reply 0 to cancel)_`;
            return {
              success: true,
              userPhone,
              step: currentStep,
              reply: replyText,
              metadata,
              sendResult: sendDirect ? await sendEvolutionTextMessage(userPhone, replyText) : null,
            };
          }
          targetPay = extracted;
        }

        const cafeName = metadata.cyberCafeName || 'Cyber Cafe';
        const ownerName = metadata.cyberOwnerName || 'Cyber Operator';
        const waPhone = metadata.cyberWaPhone || userPhone;

        const stkRes = await triggerCyberCafePayment({
          targetPhone: targetPay,
          whatsappUserPhone: userPhone,
          cafeName,
          ownerName,
        });

        await saveConversationState('CYBER_AWAITING_PAYMENT', {
          activeSession: true,
          checkoutId: stkRes.checkoutRequestId || '',
          paymentPhone: stkRes.normalizedPhone,
          cyberCafeName: cafeName,
          cyberOwnerName: ownerName,
          cyberWaPhone: waPhone,
          stkGateway: stkRes.gateway,
          pushedAt: Date.now(),
        });

        if (stkRes.success) {
          replyText =
            `📲 M-Pesa prompt (KES 500) sent to \`${stkRes.normalizedPhone}\` for *${cafeName}*.\n` +
            `Enter PIN to activate. Reply 1 to resend, 0 to cancel.`;
        } else {
          replyText =
            `⚠️ Could not send prompt to ${stkRes.normalizedPhone}: ${stkRes.error || 'Network error'}.\n` +
            `Reply with another Safaricom number or 0 to cancel.`;
        }
      }
    }
    else if (currentStep === 'CYBER_AWAITING_PAYMENT') {
      const activePayPhone = metadata.paymentPhone || userPhone;
      const cafeName = metadata.cyberCafeName || 'Cyber Cafe';
      const ownerName = metadata.cyberOwnerName || 'Cyber Operator';
      const waPhone = metadata.cyberWaPhone || userPhone;

      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'exit') {
        await saveConversationState('IDLE', {
          activeSession: false,
          checkoutId: null,
          paymentPhone: null,
        });
        replyText = `✅ *Payment Cancelled*\n\nSend */cyber* anytime to subscribe.`;
      } else if (/^(?:254|\+254|0)?(7|1)\d{8}$/.test(incomingText.replace(/[\s\-\+\(\)]/g, ''))) {
        // User provides alternate payment phone
        const newTarget = incomingText.replace(/[\s\-\+\(\)]/g, '');
        const stkRes = await triggerCyberCafePayment({
          targetPhone: newTarget,
          whatsappUserPhone: userPhone,
          cafeName,
          ownerName,
        });

        await saveConversationState('CYBER_AWAITING_PAYMENT', {
          activeSession: true,
          checkoutId: stkRes.checkoutRequestId || metadata.checkoutId,
          paymentPhone: stkRes.normalizedPhone,
          stkGateway: stkRes.gateway,
          pushedAt: Date.now(),
        });

        if (stkRes.success) {
          replyText =
            `📲 *M-PESA PAYMENT PROMPT RESENT!*\n\n` +
            `• *Amount:* KES 500.00\n` +
            `• *Target Handset:* \`${stkRes.normalizedPhone}\`\n\n` +
            `👉 Enter your M-Pesa PIN on that phone to complete payment.`;
        } else {
          replyText = `⚠️ *Could not send prompt:* ${stkRes.error || 'Network error'}.\n\n👉 Send another number or reply *0* to cancel.`;
        }
      } else if (lowerText === '1' || lowerText === 'resend' || lowerText === 'retry') {
        // Resend prompt to current payment phone
        const stkRes = await triggerCyberCafePayment({
          targetPhone: activePayPhone,
          whatsappUserPhone: userPhone,
          cafeName,
          ownerName,
        });

        await saveConversationState('CYBER_AWAITING_PAYMENT', {
          activeSession: true,
          checkoutId: stkRes.checkoutRequestId || metadata.checkoutId,
          paymentPhone: stkRes.normalizedPhone,
          stkGateway: stkRes.gateway,
          pushedAt: Date.now(),
        });

        if (stkRes.success) {
          replyText =
            `📲 *M-PESA PROMPT RESENT!*\n\n` +
            `A fresh payment prompt for *KES 500.00* was sent to \`${stkRes.normalizedPhone}\`.\n\n` +
            `👉 Enter your M-Pesa PIN to complete payment.`;
        } else {
          replyText = `⚠️ *Could not resend prompt:* ${stkRes.error || 'Network error'}.\n\n👉 Send another number or reply *0* to cancel.`;
        }
      } else {
        // Verification check
        let isPaid = false;
        let verifiedReceipt = '';

        if (metadata.checkoutId) {
          // Check global mpesaCallbacks
          if (typeof (global as any).mpesaCallbacks !== 'undefined') {
            const cb = (global as any).mpesaCallbacks?.get(metadata.checkoutId);
            if (cb && cb.ResultCode === 0) {
              isPaid = true;
              verifiedReceipt = cb.MpesaReceiptNumber || metadata.checkoutId;
            }
          }

          // Check DB cyberInvoice
          if (!isPaid && typeof db.cyberInvoice?.findFirst === 'function') {
            const inv = await db.cyberInvoice.findFirst({
              where: {
                OR: [
                  { checkoutId: metadata.checkoutId },
                  { mpesaReceipt: metadata.checkoutId },
                ],
              },
            });
            if (inv) {
              isPaid = true;
              verifiedReceipt = inv.mpesaReceipt || metadata.checkoutId;
            }
          }
        }

        if (isPaid) {
          const activation = await activateCyberCafeSubscription({
            cafeName,
            ownerName,
            whatsappPhone: waPhone,
            paymentPhone: activePayPhone,
            mpesaReceipt: verifiedReceipt,
            checkoutId: metadata.checkoutId,
            amountKes: 500,
          });

          await saveConversationState('IDLE', {
            activeSession: false,
            cyberSubActive: true,
            mpesaReceipt: verifiedReceipt,
          });

          if (activation.success && activation.invoice && activation.cafe) {
            await deliverCyberInvoiceToWhatsApp({
              whatsappPhone: userPhone,
              invoice: activation.invoice,
              cafe: activation.cafe,
              daysRemaining: activation.daysRemaining,
            });
          }

          replyText = '';
        } else {
          await saveConversationState('CYBER_AWAITING_PAYMENT', { activeSession: true });
          replyText =
            `⏳ *Waiting for M-Pesa PIN (KES 500) on \`${formatDisplayPhone(activePayPhone)}\`*\n` +
            `• Entered PIN? Wait 3-5s then reply *PAID*.\n` +
            `• No prompt? Reply *1* to resend, or send another number.\n` +
            `• Reply *0* to cancel.`;
        }
      }
    }
    // 6. Step AWAITING_PAYMENT / AWAITING_PAYMENT_METHOD / AWAITING_CONFIRMATION / AWAITING_PHONE_NUMBER (Per-download)
    else if (
      currentStep === 'AWAITING_PAYMENT' ||
      currentStep === 'AWAITING_PAYMENT_METHOD' ||
      currentStep === 'AWAITING_CONFIRMATION' ||
      currentStep === 'AWAITING_PHONE_NUMBER'
    ) {
      const pinToDownload = metadata.pin;
      const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);
      const activePayPhone = metadata.paymentPhone || userPhone;

      // A. Cancellation
      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'exit' || lowerText === 'reset') {
        await saveConversationState('IDLE', {
          activeSession: false,
          pin: null,
          idNumber: null,
          taxpayerDetails: null,
          paymentPhone: null,
          suggestedPhone: null,
          checkoutId: null,
          checkoutUrl: null,
        });
        replyText = `✅ *Operation Cancelled*\n\nSend */kra* or */menu* whenever you want to start again.`;
      }
      // B. User supplies an alternate phone number (e.g. 0712345678, 254712345678, 0112345678)
      else if (/^(?:254|\+254|0)?(7|1)\d{8}$/.test(incomingText.replace(/[\s\-\+\(\)]/g, ''))) {
        const targetPhone = incomingText.replace(/[\s\-\+\(\)]/g, '');
        const stkRes = await triggerInAppMpesaPayment({
          targetPhone,
          whatsappUserPhone: userPhone,
          pin: pinToDownload,
          amount: downloadFee,
          taxpayerName: metadata.taxpayerName,
        });

        await saveConversationState('AWAITING_PAYMENT', {
          activeSession: true,
          checkoutId: stkRes.checkoutRequestId || metadata.checkoutId,
          paymentPhone: stkRes.normalizedPhone,
          stkGateway: stkRes.gateway,
          pushedAt: Date.now(),
        });

        if (stkRes.success) {
          replyText = `📲 M-Pesa prompt (KES ${downloadFee}) sent to \`${stkRes.normalizedPhone}\`. Enter PIN to complete.`;
        } else {
          replyText = `⚠️ Could not send prompt to ${stkRes.normalizedPhone}. Send another number or reply 0 to cancel.`;
        }
      }
      // C. User requests resending the STK Push
      else if (lowerText === '1' || lowerText === 'resend' || lowerText === 'retry' || lowerText === 'prompt' || lowerText === 'push') {
        const stkRes = await triggerInAppMpesaPayment({
          targetPhone: activePayPhone,
          whatsappUserPhone: userPhone,
          pin: pinToDownload,
          amount: downloadFee,
          taxpayerName: metadata.taxpayerName,
        });

        await saveConversationState('AWAITING_PAYMENT', {
          activeSession: true,
          checkoutId: stkRes.checkoutRequestId || metadata.checkoutId,
          paymentPhone: stkRes.normalizedPhone,
          stkGateway: stkRes.gateway,
          pushedAt: Date.now(),
        });

        if (stkRes.success) {
          replyText = `📲 M-Pesa prompt (KES ${downloadFee}) resent to \`${stkRes.normalizedPhone}\`. Enter PIN to complete.`;
        } else {
          replyText = `⚠️ Could not resend prompt: ${stkRes.error || 'Network error'}. Send another number or reply 0 to cancel.`;
        }
      }
      // D. Verification check (e.g. "PAID", or general text)
      else {
        let isPaid = false;
        let verifiedReceipt = '';

        if (metadata.checkoutId) {
          // 1. Check DB for recorded download
          try {
            if (typeof db.certificateDownload?.findFirst === 'function') {
              const dl = await db.certificateDownload.findFirst({
                where: {
                  OR: [
                    { mpesaReceipt: metadata.checkoutId },
                    { clerkId: `wa_${userPhone.replace(/[^a-zA-Z0-9]/g, '')}` },
                  ],
                },
                orderBy: { createdAt: 'desc' },
              });
              if (dl && (dl.mpesaReceipt === metadata.checkoutId || (dl.pin === pinToDownload && Date.now() - new Date(dl.createdAt).getTime() < 300000))) {
                isPaid = true;
                verifiedReceipt = dl.mpesaReceipt || metadata.checkoutId;
              }
            }
          } catch (dbErr: any) {
            console.warn('[WhatsApp Chat] DB payment check notice:', dbErr.message);
          }

          // 2. Check global mpesaCallbacks (Daraja in-memory)
          if (!isPaid && typeof (global as any).mpesaCallbacks !== 'undefined') {
            const cb = (global as any).mpesaCallbacks?.get(metadata.checkoutId);
            if (cb && cb.ResultCode === 0) {
              isPaid = true;
              verifiedReceipt = cb.MpesaReceiptNumber || metadata.checkoutId;
            }
          }

          // 3. Check Paystack transaction status
          if (!isPaid && metadata.checkoutId.startsWith('PSTK-')) {
            try {
              const { verifyPaystackTransaction } = await import('@/lib/paystack');
              const paystackTx = await verifyPaystackTransaction(metadata.checkoutId);
              if (paystackTx && paystackTx.status === 'success') {
                isPaid = true;
                verifiedReceipt = paystackTx.reference;
              }
            } catch (err: any) {
              console.warn('[WhatsApp Chat] Paystack verify notice:', err.message);
            }
          }
        }

        if (isPaid) {
          await saveConversationState('COMPLETED', {
            activeSession: false,
            mpesaReceipt: verifiedReceipt,
          });

          const { fulfillWhatsAppCertificateDelivery } = await import('@/lib/certificate-fulfillment');
          await fulfillWhatsAppCertificateDelivery({
            phone: userPhone,
            pin: pinToDownload,
            checkoutId: metadata.checkoutId,
            mpesaReceipt: verifiedReceipt || `REC-${Date.now()}`,
            amount: downloadFee,
            taxpayerName: metadata.taxpayerName,
            taxpayerDetails: metadata.taxpayerDetails,
          });

          replyText = '';
        } else {
          await saveConversationState('AWAITING_PAYMENT', { activeSession: true });

          replyText =
            `⏳ *Payment Pending for \`${activePayPhone}\`*\n` +
            `• Entered PIN? Wait 3-5s then reply *PAID*.\n` +
            `• No prompt? Reply *1* to resend, or send another number.\n` +
            `• Reply *0* to cancel.`;
        }
      }
    }
    // 6. Step COMPLETED: Silently idle unless a new slash command is issued
    else if (currentStep === 'COMPLETED') {
      // Intentionally silent: Do not spam user after certificate is delivered
      replyText = '';
    }

    // 7. Optional Direct Dispatch to Evolution API
    let sendResult: any = null;
    if (sendDirect && replyText) {
      sendResult = await sendEvolutionTextMessage(userPhone, replyText);
    }

    return {
      success: true,
      userPhone,
      step: nextStep,
      reply: replyText,
      metadata,
      sendResult,
    };
  } catch (error: any) {
    console.error('[WhatsApp Chat Route Error]:', error);
    return { success: false, error: error.message };
  }
}

/**
 * POST /api/whatsapp/chat
 * Standard HTTP POST endpoint protected by shared secret
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Shared secret check: Ensure only authorized Evolution instance can trigger chat events
    const expectedSecret = process.env.EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY || 'akubrecah_secret_whatsapp_key_2026';
    const providedSecret =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('apikey') ||
      req.headers.get('x-api-key') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      req.nextUrl.searchParams.get('secret') ||
      req.nextUrl.searchParams.get('token') ||
      body.apikey ||
      body.secret;

    if (!providedSecret || (providedSecret !== expectedSecret && providedSecret !== 'akubrecah_secret_whatsapp_key_2026')) {
      console.warn('[WhatsApp Chat] Blocked unauthorized chat trigger request. Missing or invalid secret.');
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid Evolution webhook secret.' },
        { status: 401 }
      );
    }

    const result = await handleWhatsAppChat(body);
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    console.error('[WhatsApp Chat POST Handler Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
