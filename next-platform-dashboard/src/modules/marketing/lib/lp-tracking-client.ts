/**
 * LP Client-Side Tracking Service
 *
 * Phase LPB-08: Analytics & Conversion Tracking
 *
 * Injected into the LP page via CraftRenderer in LP mode.
 * Tracks: visit, scroll depth, time on page, conversions.
 *
 * Design principles:
 * - Zero impact on page load performance
 * - All tracking is best-effort (fire and forget)
 * - No cookies required (uses localStorage for visitor ID)
 * - Minimal data transmission (single beacon on exit)
 * - Zero external dependencies — all vanilla browser APIs
 */

class LPTracker {
  private siteId: string;
  private landingPageId: string;
  private visitorId: string;
  private sessionId: string;
  private startTime: number;
  private maxScrollDepth: number = 0;
  private hasTrackedVisit: boolean = false;
  private hasSentEngagement: boolean = false;

  constructor(siteId: string, landingPageId: string) {
    this.siteId = siteId;
    this.landingPageId = landingPageId;
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  /** Initialize tracking on page load */
  init() {
    this.trackVisit();
    this.trackScroll();
    this.trackExit();
  }

  /** Track initial page visit */
  private async trackVisit() {
    if (this.hasTrackedVisit) return;
    this.hasTrackedVisit = true;

    try {
      await fetch("/api/marketing/lp/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: this.siteId,
          landingPageId: this.landingPageId,
          visitorId: this.visitorId,
          sessionId: this.sessionId,
          referrer: document.referrer,
          utmParams: this.getUtmParams(),
          deviceType: this.getDeviceType(),
        }),
      });
    } catch {
      // Best-effort, don't block the page
    }
  }

  /** Track scroll depth (max reached) */
  private trackScroll() {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent =
        docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
    };

    window.addEventListener("scroll", handler, { passive: true });
  }

  /** Send engagement data when leaving page */
  private trackExit() {
    const sendEngagement = () => {
      if (this.hasSentEngagement) return;
      this.hasSentEngagement = true;

      const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);

      // Use sendBeacon for reliable delivery during page unload
      try {
        navigator.sendBeacon(
          "/api/marketing/lp/track",
          JSON.stringify({
            type: "engagement",
            siteId: this.siteId,
            landingPageId: this.landingPageId,
            visitorId: this.visitorId,
            sessionId: this.sessionId,
            timeOnPage,
            scrollDepth: this.maxScrollDepth,
          }),
        );
      } catch {
        // Best-effort
      }
    };

    // visibilitychange is more reliable than beforeunload on mobile
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendEngagement();
    });

    // Fallback for desktop
    window.addEventListener("beforeunload", sendEngagement);
  }

  /** Get time on page in seconds */
  getTimeOnPage(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /** Get max scroll depth (0-100) */
  getScrollDepth(): number {
    return this.maxScrollDepth;
  }

  /** Get the session ID for this tracking session */
  getSessionId(): string {
    return this.sessionId;
  }

  /** Get the visitor ID */
  getVisitorId(): string {
    return this.visitorId;
  }

  private getOrCreateVisitorId(): string {
    const key = "dramac_visitor_id";
    try {
      let id = localStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private getUtmParams(): Record<string, string | null> {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
    };
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone/i.test(ua)) return "mobile";
    if (/iPad|Tablet/i.test(ua)) return "tablet";
    return "desktop";
  }
}

/**
 * Initialize LP tracking on the current page.
 * Called from CraftRenderer when in LP mode.
 */
export function initLPTracking(
  siteId: string,
  landingPageId: string,
): LPTracker {
  const tracker = new LPTracker(siteId, landingPageId);
  tracker.init();
  // Expose on window so form components can access it
  (window as any).__lpTracker = tracker;
  return tracker;
}
