/**
 * Privacy and Data Protection Masking Utilities
 * Strictly compliant with Kenya Data Protection Act (KDPA).
 * 
 * Rules:
 * - Phone: completely masked ("••••••••••")
 * - Email: partial email (e.g. "j***e@gmail.com")
 * - Station name: unmasked, fully visible (e.g. "Kitale TSO", "West of Nairobi")
 * - National ID: unmasked, fully visible (e.g. "28475912")
 * - KRA PIN: partial PIN (e.g. "A01*****78Z")
 * - Street / Building / Box: protected ("••••••••")
 * - Certificate Download: strictly KES 20 ("20 bob")
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
 * Completely masks a phone number (e.g., "0712345678" -> "••••••••••")
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  return '••••••••••';
}

/**
 * Formats date string cleanly
 */
export function maskDate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  return dateStr.trim();
}

/**
 * Returns taxpayer data masked for preview and public query:
 * - Phone completely masked
 * - Email partially masked
 * - Station name fully shown
 * - National ID fully shown
 * - PIN partially masked
 * - Full legal name visible for identity verification
 * - Building, street, poBox secured
 */
export function maskTaxpayerData<T extends TaxpayerData>(
  data: T,
  _isSubscribed: boolean = false,
  _isAdmin: boolean = false
): T & { isSubscribed: boolean } {
  if (_isAdmin) {
    return {
      ...data,
      isSubscribed: true,
    };
  }

  const name = data.name || data.taxpayerName || data.fullName || '';

  return {
    ...data,
    pin: maskPin(data.pin),
    phoneNumber: maskPhone(data.phoneNumber),
    email: maskEmail(data.email),
    station: data.station || '', // Fully visible
    idNumber: data.idNumber || '', // Fully visible
    name,
    taxpayerName: name,
    fullName: name,
    building: data.building ? '••••••••' : '',
    street: data.street ? '••••••••' : '',
    poBox: data.poBox ? '••••••' : '',
    postalCode: data.postalCode ? '•••••' : '',
    isSubscribed: false,
  };
}
