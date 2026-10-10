/**
 * Evolution API Client (Self-Hosted Free WhatsApp Integration)
 * Compatible with atendai/evolution-api:latest
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
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
export async function sendEvolutionTextMessage(phone: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = sanitizeWhatsAppPhone(phone);
    const url = `${EVOLUTION_API_URL.replace(/\/$/, '')}/message/sendText/${EVOLUTION_INSTANCE}`;
    
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
      return { success: false, error: `Evolution API returned ${response.status}: ${errText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Evolution API Exception] sendEvolutionTextMessage:', error.message);
    return { success: false, error: error.message };
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
    const formattedPhone = sanitizeWhatsAppPhone(phone);
    const base64Data = pdfBuffer.toString('base64');
    const url = `${EVOLUTION_API_URL.replace(/\/$/, '')}/message/sendMedia/${EVOLUTION_INSTANCE}`;

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
