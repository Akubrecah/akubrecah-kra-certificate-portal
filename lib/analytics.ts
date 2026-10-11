/**
 * Lightweight Client-Side Analytics Tracker for Akubrecah KRA Portal
 * Tracks Device Usage (PC vs Mobile vs Tablet), Session Funnel, and Key Interaction Clicks.
 */

export interface TrackingPayload {
  activityType: 'page_view' | 'search_pin' | 'view_masked' | 'click_stk_mpesa' | 'click_paystack' | 'download_certificate' | string;
  description?: string;
  pin?: string;
  metadata?: Record<string, any>;
}

// Session key stored in sessionStorage (persists across page reloads in same tab)
const SESSION_STORAGE_KEY = 'kra_portal_session_id';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function getClientDeviceInfo() {
  if (typeof window === 'undefined') {
    return { isMobile: false, deviceType: 'desktop', os: 'unknown', browser: 'unknown' };
  }

  const ua = navigator.userAgent;
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = !isTablet && /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // Detect OS
  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS Mac';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS Apple';
  else if (/Linux/i.test(ua)) os = 'Linux PC';

  // Detect Browser
  let browser = 'Unknown';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/MSIE|Trident/i.test(ua)) browser = 'Internet Explorer';

  return {
    isMobile: isMobile || isTablet,
    isDesktopPC: deviceType === 'desktop',
    deviceType,
    os,
    browser,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || 'direct',
  };
}

/**
 * Track an activity or click event
 */
export async function trackEvent(payload: TrackingPayload): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = getOrCreateSessionId();
    const deviceInfo = getClientDeviceInfo();

    const body = JSON.stringify({
      sessionId,
      activityType: payload.activityType,
      description: payload.description || payload.activityType,
      pin: payload.pin || null,
      metadata: payload.metadata || {},
      isMobile: deviceInfo.isMobile,
      deviceInfo,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Silent failure for analytics
      });
    }
  } catch (err) {
    // Analytics failure should never break user interaction
  }
}
