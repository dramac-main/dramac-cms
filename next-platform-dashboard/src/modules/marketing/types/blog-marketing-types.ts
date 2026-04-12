/**
 * Marketing Module - Blog Marketing Types
 *
 * Phase MKT-07: Blog Marketing Enhancement
 *
 * Types for blog CTA blocks, subscriber widgets,
 * content-to-email conversion, SEO scoring, and RSS feeds.
 */

// ============================================================================
// BLOG CTA BLOCKS
// ============================================================================

export type BlogCTAStyle = "banner" | "card" | "inline" | "sidebar";

export type BlogCTAPosition =
  | "after_paragraph_2"
  | "after_paragraph_5"
  | "end_of_post"
  | "custom";

export interface BlogCTABlock {
  id: string;
  type: "marketing_cta";
  style: BlogCTAStyle;
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  formId?: string | null;
  backgroundColor?: string | null;
  imageUrl?: string | null;
  position: BlogCTAPosition;
}

export interface BlogCTATemplate {
  id: string;
  name: string;
  description: string;
  style: BlogCTAStyle;
  heading: string;
  body: string;
  buttonText: string;
  position: BlogCTAPosition;
}

// ============================================================================
// BLOG SUBSCRIBER WIDGET
// ============================================================================

export type WidgetPlacement = "below_post" | "sidebar" | "floating";

export interface BlogSubscribeConfig {
  enabled: boolean;
  heading: string;
  description: string;
  buttonText: string;
  placement: WidgetPlacement;
  formId?: string | null;
  listId?: string | null;
  autoTagSubscribers: string[];
  showOnAllPosts: boolean;
  excludeCategories: string[];
}

// ============================================================================
// CONTENT-TO-EMAIL CONVERSION
// ============================================================================

export interface EmailBlock {
  type: "header" | "image" | "text" | "button" | "divider" | "footer";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface BlogToEmailResult {
  subjectLine: string;
  previewText: string;
  blocks: EmailBlock[];
  contentHtml: string;
}

// ============================================================================
// SEO CONTENT SCORING
// ============================================================================

export interface ContentScore {
  overall: number;
  readability: number;
  seoScore: number;
  engagementPotential: number;
  recommendations: ContentRecommendation[];
}

export interface ContentRecommendation {
  category:
    | "title"
    | "meta"
    | "structure"
    | "content"
    | "media"
    | "cta"
    | "readability";
  severity: "info" | "warning" | "error";
  message: string;
  currentValue?: string | number;
  suggestedValue?: string | number;
}

// ============================================================================
// RSS FEED
// ============================================================================

export interface RSSFeedConfig {
  siteId: string;
  title: string;
  description: string;
  link: string;
  language: string;
  maxItems: number;
}

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  author: string;
  pubDate: string;
  guid: string;
  categories: string[];
  imageUrl?: string | null;
}

// ============================================================================
// BLOG AUTO-SHARE
// ============================================================================

export type ShareChannel = "email_campaign" | "email_digest";

export interface BlogAutoShareConfig {
  enabled: boolean;
  siteId: string;
  channels: ShareChannel[];
  audienceId?: string | null;
  listId?: string | null;
  digestSchedule: "per_post" | "daily" | "weekly";
  digestDay?: number;
  lastDigestSentAt?: string | null;
}
