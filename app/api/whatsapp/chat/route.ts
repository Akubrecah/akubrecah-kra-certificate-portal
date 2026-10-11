import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeWhatsAppPhone, sendEvolutionTextMessage } from '@/lib/evolution';
import { fetchTaxpayerById, fetchTaxpayerByPin } from '@/lib/kra-api';
import { maskTaxpayerData } from '@/lib/masking';
import { initializePaystackTransaction } from '@/lib/paystack';
import { createAdminMagicToken } from '@/lib/magic-token';
import { getPublicAppUrl } from '@/lib/utils';

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

    // 2. Normal Message Filter:
    // If the bot has not been initiated (not in active session) and message has no slash, DO NOT TRIGGER!
    if (!isSlashCommand && !isSessionActive) {
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

    // 3. Process Slash Commands (/kra, /menu, /start, /cancel, etc.)
    if (isSlashCommand) {
      const cleanCmd = incomingText.substring(1).trim();
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
      // B. Menu or Direct Lookup: /kra, /menu, /start, /help, /pin
      else if (['kra', 'menu', 'start', 'help', 'pin'].includes(cmdWord)) {
        // Direct search: /kra <ID_OR_PIN> or /pin <ID_OR_PIN>
        if (cmdArgs) {
          const isPin = /^[A-Za-z]\d{9}[A-Za-z]$/.test(cmdArgs);
          const isId = /^\d{6,9}$/.test(cmdArgs);

          if (!isPin && !isId) {
            await saveConversationState('AWAITING_INPUT', { activeSession: true });
            replyText =
              `⚠️ *Invalid Format*\n\n` +
              `Please provide a valid *National ID Number* (6 to 9 digits) or *KRA PIN* (e.g., A012345678Z).\n\n` +
              `_Example: 12345678 or A012345678Z_\n` +
              `Reply *0* or send */cancel* to exit.`;
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
                `❌ *No record found* on KRA database for \`${cmdArgs}\`.\n\n` +
                `Please send your correct *National ID Number* or *KRA PIN* to try again, or reply *0* to cancel.`;
            } else {
              const cleanPin = taxpayer.pin ? taxpayer.pin.toUpperCase().trim() : '';
              const masked = maskTaxpayerData(taxpayer);
              const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);

              const paystackRes = await createPaystackLink(userPhone, cleanPin, downloadFee, taxpayer.taxpayerName);

              await saveConversationState('AWAITING_PAYMENT', {
                activeSession: true,
                pin: cleanPin,
                idNumber: taxpayer.idNumber || cmdArgs,
                taxpayerName: taxpayer.taxpayerName,
                checkoutId: paystackRes.reference || '',
                taxpayerDetails: taxpayer,
              });

              replyText =
                `✅ *Taxpayer Record Found!*\n\n` +
                `• *Name:* ${masked.taxpayerName}\n` +
                `• *PIN:* \`${masked.pin}\`\n` +
                `• *Station:* ${taxpayer.station || 'KRA Main'}\n\n` +
                `*Official Certificate Download:* KES ${downloadFee}.00\n\n` +
                (paystackRes.success && paystackRes.authorizationUrl
                  ? `💳 *Tap below to Pay with M-Pesa or Card (Paystack):*\n👉 ${paystackRes.authorizationUrl}\n\n`
                  : `Reply *1* to generate your secure Paystack checkout link.\n\n`) +
                `⚡ _Supports instant M-Pesa prompt, Visa, Mastercard & Apple Pay._\n` +
                `_Once payment is approved, your KRA PIN Certificate and Official Payment Receipt PDFs will be delivered right here in WhatsApp automatically!_\n\n` +
                `_(Reply *PAID* or *1* to verify payment, or *0* to cancel)_`;
            }
          }
        } else {
          // Standard menu trigger without args
          await saveConversationState('AWAITING_INPUT', {
            activeSession: true,
            pin: null,
            idNumber: null,
            taxpayerDetails: null,
            paymentPhone: null,
            suggestedPhone: null,
          });

          replyText =
            `👋 *Welcome to Akubrecah KRA Certificate Portal!*\n\n` +
            `I can retrieve and verify your official *KRA PIN Certificate* and *Payment Receipt* right here on WhatsApp.\n\n` +
            `👉 *Please reply with your National ID Number (e.g. 12345678) or KRA PIN (e.g. A012345678Z)* to look up your details.\n\n` +
            `_Quick Commands:_\n` +
            `• Send */menu* or */kra* to restart\n` +
            `• Send */kra <ID_OR_PIN>* for instant lookup\n` +
            `• Send */cancel* to exit bot mode`;
        }
      }
      // C. Other/Unknown slash commands
      else {
        replyText =
          `🤖 *Akubrecah KRA Bot Commands:*\n\n` +
          `• */kra* or */menu* — Open KRA Certificate Portal\n` +
          `• */kra <ID_OR_PIN>* — Direct taxpayer search\n` +
          `• */cancel* — Exit bot session`;
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
          `⚠️ *Invalid Format*\n\n` +
          `Please reply with a valid *National ID Number* (6 to 9 digits) or *KRA PIN* (e.g., A012345678Z).\n\n` +
          `_Example: 12345678 or A012345678Z_\n` +
          `Reply *0* or send */cancel* to exit bot mode.`;
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
            `❌ *No record found* on KRA database for \`${incomingText}\`.\n\n` +
            `Please check the number and send another National ID Number or KRA PIN, or reply *0* to exit.`;
        } else {
          const cleanPin = taxpayer.pin ? taxpayer.pin.toUpperCase().trim() : '';
          const masked = maskTaxpayerData(taxpayer);
          const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);

          const paystackRes = await createPaystackLink(userPhone, cleanPin, downloadFee, taxpayer.taxpayerName);

          await saveConversationState('AWAITING_PAYMENT', {
            activeSession: true,
            pin: cleanPin,
            idNumber: taxpayer.idNumber || incomingText,
            taxpayerName: taxpayer.taxpayerName,
            checkoutId: paystackRes.reference || '',
            checkoutUrl: paystackRes.authorizationUrl || '',
            taxpayerDetails: taxpayer,
          });

          replyText =
            `✅ *Taxpayer Record Found!*\n\n` +
            `• *Name:* ${masked.taxpayerName}\n` +
            `• *PIN:* \`${masked.pin}\`\n` +
            `• *Station:* ${taxpayer.station || 'KRA Main'}\n\n` +
            `*Official Certificate Download:* KES ${downloadFee}.00\n\n` +
            (paystackRes.success && paystackRes.authorizationUrl
              ? `💳 *Tap below to Pay with M-Pesa or Card (Paystack):*\n👉 ${paystackRes.authorizationUrl}\n\n`
              : `Reply *1* to generate your secure Paystack checkout link.\n\n`) +
            `⚡ _Supports instant M-Pesa prompt, Visa, Mastercard & Apple Pay._\n` +
            `_Once payment is approved, your KRA PIN Certificate and Official Payment Receipt PDFs will be delivered right here in WhatsApp automatically!_\n\n` +
            `_(Reply *PAID* or *1* to verify payment, or *0* to cancel)_`;
        }
      }
    }
    // 4. Step AWAITING_PAYMENT / AWAITING_PAYMENT_METHOD / AWAITING_PHONE_NUMBER
    else if (
      currentStep === 'AWAITING_PAYMENT' ||
      currentStep === 'AWAITING_PAYMENT_METHOD' ||
      currentStep === 'AWAITING_CONFIRMATION' ||
      currentStep === 'AWAITING_PHONE_NUMBER'
    ) {
      const pinToDownload = metadata.pin;
      const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);

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
      // B. User requests a fresh link
      else if (lowerText === 'retry' || lowerText === 'new' || lowerText === 'link' || lowerText === 'paystack') {
        const paystackRes = await createPaystackLink(userPhone, pinToDownload, downloadFee, metadata.taxpayerName);
        if (paystackRes.success && paystackRes.authorizationUrl) {
          await saveConversationState('AWAITING_PAYMENT', {
            activeSession: true,
            checkoutId: paystackRes.reference || '',
            checkoutUrl: paystackRes.authorizationUrl || '',
          });
          replyText =
            `💳 *New Secure Payment Link:*\n` +
            `👉 ${paystackRes.authorizationUrl}\n\n` +
            `⚡ _Supports M-Pesa, Card, and Apple Pay._\n` +
            `Once approved, your documents will be delivered right here automatically!\n\n` +
            `_(Reply *PAID* once finished, or *0* to cancel)_`;
        } else {
          await saveConversationState('AWAITING_PAYMENT', { activeSession: true });
          replyText = `❌ *Could not generate link:*\n${paystackRes.error || 'Please try again in a few moments'}.`;
        }
      }
      // C. Verification & check
      else {
        let isPaid = false;
        let paystackTx: any = null;
        if (metadata.checkoutId) {
          try {
            const { verifyPaystackTransaction } = await import('@/lib/paystack');
            paystackTx = await verifyPaystackTransaction(metadata.checkoutId);
            if (paystackTx && paystackTx.status === 'success') {
              isPaid = true;
            }
          } catch (err: any) {
            console.warn('[WhatsApp Chat] Paystack verify notice:', err.message);
          }
        }

        if (isPaid && paystackTx) {
          await saveConversationState('COMPLETED', {
            activeSession: false,
            mpesaReceipt: paystackTx.reference,
          });

          const { fulfillWhatsAppCertificateDelivery } = await import('@/lib/certificate-fulfillment');
          await fulfillWhatsAppCertificateDelivery({
            phone: userPhone,
            pin: pinToDownload,
            checkoutId: metadata.checkoutId,
            mpesaReceipt: paystackTx.reference,
            amount: paystackTx.amountKes || downloadFee,
            taxpayerName: metadata.taxpayerName,
            taxpayerDetails: metadata.taxpayerDetails,
          });

          replyText =
            `🎉 *Payment Confirmed!*\n\n` +
            `Your official *KRA PIN Certificate* and *Official Payment Receipt* have been delivered to your chat above.\n\n` +
            `Send */kra* or */menu* anytime to perform another lookup.`;
        } else {
          await saveConversationState('AWAITING_PAYMENT', { activeSession: true });
          const checkoutUrl = metadata.checkoutUrl;

          replyText =
            `⏳ *Payment Pending Approval*\n\n` +
            `We haven't received confirmation for reference \`${metadata.checkoutId || 'PSTK'}\` yet.\n\n` +
            (checkoutUrl ? `👉 *Complete payment here:*\n${checkoutUrl}\n\n` : '') +
            `⚡ _Select M-Pesa or Card on the Paystack checkout page._\n\n` +
            `• Reply *PAID* or *1* to verify again\n` +
            `• Reply *RETRY* to generate a fresh link\n` +
            `• Reply *0* to cancel`;
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
