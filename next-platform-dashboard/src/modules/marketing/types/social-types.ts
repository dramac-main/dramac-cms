/**
 * Social Media Integration Types
 *
 * Phase MKT-12: Social Media Integration
 *
 * Types for social connections, posts, calendar, and AI captions.
 */

// ─── Platform Types ──────────────────────────────────────────────

export type SocialPlatform = "facebook" | "instagram" | "twitter" | "linkedin";

export type SocialConnectionStatus = "active" | "expired" | "disconnected";

export type SocialPostStatus = "draft" | "scheduled" | "published" | "failed";

// ─── Character Limits ────────────────────────────────────────────

export const SOCIAL_PLATFORM_LIMITS: Record<
  SocialPlatform,
  { maxLength: number; label: string; style: string; icon: string }
> = {
  twitter: {
    maxLength: 280,
    label: "X (Twitter)",
    style: "concise with hashtags",
    icon: "twitter",
  },
  facebook: {
    maxLength: 500,
    label: "Facebook",
    style: "engaging and conversational",
    icon: "facebook",
  },
  instagram: {
    maxLength: 2200,
    label: "Instagram",
    style: "descriptive with hashtags",
    icon: "instagram",
  },
  linkedin: {
    maxLength: 1300,
    label: "LinkedIn",
    style: "professional and insightful",
    icon: "linkedin",
  },
};

// ─── UTM Parameters ──────────────────────────────────────────────

export interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string;
  utm_content?: string;
}

// ─── Social Connection ───────────────────────────────────────────

export interface SocialConnection {
  id: string;
  siteId: string;
  platform: SocialPlatform;
  accountName: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  pageId?: string | null;
  connectedAt: string;
  status: SocialConnectionStatus;
  profileUrl?: string | null;
  avatarUrl?: string | null;
}

export interface CreateSocialConnectionInput {
  siteId: string;
  platform: SocialPlatform;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  pageId?: string;
  profileUrl?: string;
  avatarUrl?: string;
}

export interface UpdateSocialConnectionInput {
  accountName?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  status?: SocialConnectionStatus;
}

// ─── Social Post ─────────────────────────────────────────────────

export interface SocialPost {
  id: string;
  siteId: string;
  content: string;
  mediaUrls?: string[] | null;
  platforms: SocialPlatform[];
  scheduledAt?: string | null;
  publishedAt?: string | null;
  status: SocialPostStatus;
  linkUrl?: string | null;
  utmParams?: UTMParams | null;
  campaignId?: string | null;
  blogPostId?: string | null;
  platformPostIds?: Record<string, string> | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialPostInput {
  siteId: string;
  content: string;
  mediaUrls?: string[];
  platforms: SocialPlatform[];
  scheduledAt?: string;
  linkUrl?: string;
  utmParams?: UTMParams;
  campaignId?: string;
  blogPostId?: string;
}

export interface UpdateSocialPostInput {
  content?: string;
  mediaUrls?: string[];
  platforms?: SocialPlatform[];
  scheduledAt?: string;
  linkUrl?: string;
  utmParams?: UTMParams;
  status?: SocialPostStatus;
}

// ─── Calendar Event ──────────────────────────────────────────────

export type CalendarEventType =
  | "campaign"
  | "social"
  | "blog"
  | "sequence"
  | "landing_page";

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  type: CalendarEventType;
  status: string;
  color: string;
  link: string;
}

export const CALENDAR_EVENT_COLORS: Record<CalendarEventType, string> = {
  campaign: "#3B82F6",    // Blue
  social: "#22C55E",      // Green
  blog: "#A855F7",        // Purple
  sequence: "#F97316",    // Orange
  landing_page: "#6B7280", // Gray
};

// ─── AI Caption ──────────────────────────────────────────────────

export interface GenerateCaptionInput {
  title: string;
  excerpt?: string;
  platform: SocialPlatform;
  tone?: string;
}

export interface GenerateCaptionResult {
  caption: string;
  platform: SocialPlatform;
  characterCount: number;
  withinLimit: boolean;
}
