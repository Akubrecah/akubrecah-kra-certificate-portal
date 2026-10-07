/**
 * Privacy and Data Protection Masking Utilities
 * Compliant with Kenya Data Protection Act (KDPA).
 * 
 * Note: Monthly subscriptions have been decommissioned.
 * Users retrieve their tax data directly and pay KES 20 per certificate download.
 */

export interface TaxpayerData {
  pin?: string;
  name?: string;
  taxpayerName?: string;
  fullName?: string;
  idNumber?: string;
  email?: string;
  phoneNumber?: string;
  building?: string;
  street?: string;
  town?: string;
  county?: string;
  district?: string;
  taxArea?: string;
  station?: string;
  poBox?: string;
  postalCode?: string;
  registrationDate?: string;
  registeredDate?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Partially masks a KRA PIN (e.g., "A012345678Z" -> "A01*****78Z")
 */
export function maskPin(pin?: string | null): string {
  if (!pin || typeof pin !== 'string') return '';
  const trimmed = pin.trim().toUpperCase();
  if (trimmed.length < 6) return trimmed;
  return `${trimmed.slice(0, 3)}*****${trimmed.slice(-3)}`;
}

/**
 * Partially masks an email address (e.g., "john.doe@gmail.com" -> "j***e@gmail.com")
 */
export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.indexOf('@');
  if (atIndex < 2) return trimmed;
  
  const user = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex);
  const maskedUser = user.length > 2 
    ? `${user[0]}***${user[user.length - 1]}`
    : `${user[0]}*`;
  return `${maskedUser}${domain}`;
}

/**
 * Partially masks a phone number (e.g., "0712345678" -> "07****5678")
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.length < 6) return cleaned;
  return `${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`;
}

/**
 * Formats date string cleanly
 */
export function maskDate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  return dateStr.trim();
}

/**
 * Returns taxpayer data for verified display.
 * Since monthly subscription is removed, all verified inquiries return full verified data
 * and users pay KES 20 per official certificate download.
 */
export function maskTaxpayerData<T extends TaxpayerData>(data: T, _isSubscribed: boolean = true, _isAdmin: boolean = false): T & { isSubscribed: boolean } {
  return {
    ...data,
    isSubscribed: true,
  };
}
