import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'akubrecah_kra_admin_magic_token_secret_key_2026';

export interface MagicTokenPayload {
  phone: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Generate a signed, tamper-proof magic token that expires in 15 minutes
 */
export function createAdminMagicToken(phone: string): string {
  const payload: MagicTokenPayload = {
    phone,
    role: 'Super Admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify signature and expiration of an admin magic token
 */
export function verifyAdminMagicToken(token: string): MagicTokenPayload | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [payloadBase64, signature] = token.split('.');

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: MagicTokenPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    );

    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
