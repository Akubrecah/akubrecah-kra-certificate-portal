/**
 * Security and Data Privacy Masking Utilities
 * Enforces partial masking and field hiding for unsubscribed users.
 */

export interface TaxpayerData {
  pin: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  certificate_url?: string;
  building?: string;
  street?: string;
  town?: string;
  county?: string;
  district?: string;
  taxArea?: string;
  station?: string;
  poBox?: string;
  postalCode?: string;
  registeredDate?: string;
  [key: string]: any;
}

/**
 * Partially masks an email address (e.g., "john.doe@example.com" -> "jo***e@example.com")
 */
export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim();
  if (!trimmed.includes('@')) return '***';

  const [username, domain] = trimmed.split('@');
  if (!username || !domain) return '***';

  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }

  const prefix = username.slice(0, 2);
  const suffix = username.slice(-1);
  return `${prefix}***${suffix}@${domain}`;
}

/**
 * Partially masks a KRA PIN (e.g., "A012345678Z" -> "A01*****8Z")
 */
export function maskPin(pin?: string | null): string {
  if (!pin || typeof pin !== 'string') return '';
  const trimmed = pin.trim().toUpperCase();
  if (trimmed.length < 5) return '***';

  const start = trimmed.slice(0, 3);
  const end = trimmed.slice(-2);
  return `${start}*****${end}`;
}

/**
 * Partially masks a date string (e.g., "12/05/2021" -> "**-**-2021")
 */
export function maskDate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      return `**/**/${parts[2]}`;
    }
  }
  return '******';
}

/**
 * Applies privacy masking to taxpayer records.
 * Unsubscribed users only see the full legal name and partial PIN/email, with phone & location completely hidden.
 * Admin users bypass all masking and see full data.
 */
export function maskTaxpayerData<T extends TaxpayerData>(data: T, isSubscribed: boolean, isAdmin: boolean = false): T & { isSubscribed: boolean } {
  if (isAdmin) {
    return {
      ...data,
      isSubscribed: true,
    };
  }

  if (isSubscribed) {
    return {
      ...data,
      isSubscribed: true,
    };
  }

  const resolvedName = (data as any).taxpayerName || (data as any).fullName || (data as any).name || '';
  const resolvedDate = (data as any).registrationDate || (data as any).registeredDate || '';

  return {
    ...data,
    pin: maskPin(data.pin),
    name: resolvedName,
    taxpayerName: resolvedName,
    fullName: resolvedName,
    idNumber: data.idNumber ? maskPin(data.idNumber) : '',
    email: maskEmail(data.email),
    phoneNumber: '', // Completely hidden for unsubscribed users
    building: '',    // Location details hidden
    street: '',
    town: '',
    county: '',
    district: '',
    taxArea: '',
    station: '',
    poBox: '',
    postalCode: '',
    registrationDate: maskDate(resolvedDate),
    registeredDate: maskDate(resolvedDate),
    isSubscribed: false,
  };
}
