/**
 * Configuration for administrative access
 */
export const SUPER_ADMIN_EMAIL = 'poweldayck@gmail.com';

/**
 * Check if a user email corresponds to a super admin
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Check if a user object (from Clerk) is an admin
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false;
  
  // Check email
  const email = user.primaryEmailAddress?.emailAddress || 
                user.emailAddresses?.[0]?.emailAddress;
  
  if (isSuperAdmin(email)) return true;
  
  // Check public metadata role
  return user.publicMetadata?.role === 'admin';
}
