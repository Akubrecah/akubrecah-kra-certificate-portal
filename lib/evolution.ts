/**
 * Evolution API Client (Self-Hosted Free WhatsApp Integration)
 * Compatible with atendai/evolution-api:latest
 */

export function getEvolutionApiUrl(): string {
  let envUrl = (process.env.EVOLUTION_API_URL || '').trim();
  // If undefined, empty, localhost/127.0.0.1, or placeholder from setup script, use production VPS IP
  if (
    !envUrl ||
    envUrl.includes('localhost') ||
    envUrl.includes('127.0.0.1') ||
    envUrl.includes('<YOUR_VPS_IP>')
  ) {
    return 'http://169.58.96.131:8085';
  }
  // Host port on VPS is 8085 (mapped to internal container 8080)
  if (envUrl.includes(':8080')) {
    envUrl = envUrl.replace(':8080', ':8085');
  }
  // Raw IP does not have TLS certificate, must use http
  if (envUrl.startsWith('https://169.58.96.131')) {
    envUrl = envUrl.replace('https://', 'http://');
  }
  return envUrl;
}

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'akubrecah_secret_whatsapp_key_2026';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'akubrecah-kra';

/**
 * Format phone numbers to international format required by WhatsApp/Evolution API
 * e.g. 0712345678 -> 254712345678
 *      +254712345678 -> 254712345678
 *      254712345678@s.whatsapp.net -> 254712345678
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/@s\.whatsapp\.net/g, '').replace(/[\s\-\+\(\)]/g, '');
  if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    return '254' + cleaned;
  }
  if ((cleaned.startsWith('07') || cleaned.startsWith('01')) && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Send a plain text or formatted message to a WhatsApp user
 */
export async function sendEvolutionTextMessage(
  phone: string,
  text: string
): Promise<{ success: boolean; error?: string; targetUrl?: string }> {
  const baseUrl = getEvolutionApiUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/message/sendText/${EVOLUTION_INSTANCE}`;
  try {
    const formattedPhone = sanitizeWhatsAppPhone(phone);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: text,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Evolution API] Failed to send text message:', response.status, errText);
      return { success: false, error: `Evolution API returned ${response.status}: ${errText}`, targetUrl: url };
    }

    return { success: true, targetUrl: url };
  } catch (error: any) {
    const causeMsg = error.cause ? ` (cause: ${error.cause?.code || error.cause?.message || JSON.stringify(error.cause)})` : '';
    console.error('[Evolution API Exception] sendEvolutionTextMessage:', error.message, causeMsg);
    return { success: false, error: `${error.message}${causeMsg}`, targetUrl: url };
  }
}

/**
 * Mark a message as read (blue ticks)
 */
export async function markEvolutionMessageRead({
  remoteJid,
  messageId,
}: {
  remoteJid: string;
  messageId?: string;
}): Promise<void> {
  try {
    const baseUrl = getEvolutionApiUrl();
    const url = `${baseUrl.replace(/\/$/, '')}/chat/markMessageAsRead/${EVOLUTION_INSTANCE}`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        readMessages: [
          {
            remoteJid,
            fromMe: false,
            id: messageId || '',
          },
        ],
      }),
    });
  } catch (err: any) {
    console.error('[Evolution API] markEvolutionMessageRead error:', err.message);
  }
}

/**
 * Send a PDF or binary media document to a WhatsApp user
 */
export async function sendEvolutionDocument({
  phone,
  pdfBuffer,
  fileName,
  caption,
}: {
  phone: string;
  pdfBuffer: Buffer;
  fileName: string;
  caption?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getEvolutionApiUrl();
    const formattedPhone = sanitizeWhatsAppPhone(phone);
    const base64Data = pdfBuffer.toString('base64');
    const url = `${baseUrl.replace(/\/$/, '')}/message/sendMedia/${EVOLUTION_INSTANCE}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: formattedPhone,
        mediatype: 'document',
        mimetype: 'application/pdf',
        caption: caption || fileName,
        media: base64Data,
        fileName: fileName,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Evolution API] Failed to send document:', response.status, errText);
      return { success: false, error: `Evolution API returned ${response.status}: ${errText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Evolution API Exception] sendEvolutionDocument:', error.message);
    return { success: false, error: error.message };
  }
}
