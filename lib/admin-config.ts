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
 * Check if a user object (from Clerk) or session claims is an admin
 */
export function isAdminUser(userOrClaims: any): boolean {
  if (!userOrClaims) return false;
  
  // Case 1: Clerk User object
  if (userOrClaims.primaryEmailAddress || userOrClaims.emailAddresses) {
    const email = userOrClaims.primaryEmailAddress?.emailAddress || 
                  userOrClaims.emailAddresses?.[0]?.emailAddress;
    
    if (isSuperAdmin(email)) return true;
    return userOrClaims.publicMetadata?.role === 'admin';
  }
  
  // Case 2: Session Claims (JWT)
  const email = userOrClaims.email;
  if (isSuperAdmin(email)) return true;
  
  const metadata = userOrClaims.metadata || userOrClaims.publicMetadata;
  return (metadata as any)?.role === 'admin';
}
