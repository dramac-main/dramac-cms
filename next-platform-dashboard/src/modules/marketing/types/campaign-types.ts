/**
 * Marketing Module - Campaign Types
 *
 * Phase MKT-01: Database Foundation
 *
 * These types define the data structures for campaigns, templates,
 * audiences, subscribers, lists, and campaign sends.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type CampaignType = "email" | "sms" | "whatsapp" | "multi_channel";
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "cancelled"
  | "archived"
  | "failed";

export type TemplateCategory =
  | "welcome"
  | "promotional"
  | "newsletter"
  | "transactional"
  | "announcement"
  | "winback"
  | "seasonal"
  | "custom";

export type AudienceType =
  | "segment"
  | "list"
  | "all_subscribers"
  | "all_contacts"
  | "custom";
export type AudienceFilterLogic = "and" | "or";

export type SubscriberStatus =
  | "active"
  | "unsubscribed"
  | "bounced"
  | "complained"
  | "cleaned";

export type ListType = "manual" | "import" | "form_capture" | "api";

export type CampaignSendStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "unsubscribed"
  | "failed";

// ============================================================================
// CAMPAIGNS
// ============================================================================

export interface Campaign {
  id: string;
  siteId: string;
  name: string;
  description?: string | null;
  type: CampaignType;
  status: CampaignStatus;
  subjectLine?: string | null;
  previewText?: string | null;
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
  templateId?: string | null;
  contentHtml?: string | null;
  contentText?: string | null;
  contentJson?: Record<string, unknown> | null;
  audienceId?: string | null;
  segmentId?: string | null;
  abTestEnabled: boolean;
  abTestConfig?: Record<string, unknown> | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  totalComplained: number;
  revenueAttributed: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional joins)
  template?: EmailTemplate | null;
  audience?: Audience | null;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export interface EmailTemplate {
  id: string;
  siteId?: string | null;
  name: string;
  description?: string | null;
  category: TemplateCategory;
  thumbnailUrl?: string | null;
  contentJson: Record<string, unknown>;
  contentHtml?: string | null;
  contentText?: string | null;
  subjectLine?: string | null;
  previewText?: string | null;
  mergeVariables: string[];
  isSystem: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AUDIENCES
// ============================================================================

export interface Audience {
  id: string;
  siteId: string;
  name: string;
  description?: string | null;
  type: AudienceType;
  crmSegmentId?: string | null;
  filterCriteria?: Record<string, unknown> | null;
  filterLogic: AudienceFilterLogic;
  excludeCriteria?: Record<string, unknown> | null;
  contactCount: number;
  lastEvaluatedAt?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SUBSCRIBERS
// ============================================================================

export interface Subscriber {
  id: string;
  siteId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  crmContactId?: string | null;
  status: SubscriberStatus;
  emailOptIn: boolean;
  smsOptIn: boolean;
  consentSource?: string | null;
  consentDate?: string | null;
  consentIp?: string | null;
  tags: string[];
  customFields: Record<string, unknown>;
  engagementScore: number;
  lastEmailSentAt?: string | null;
  lastEmailOpenedAt?: string | null;
  lastEmailClickedAt?: string | null;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  bounceCount: number;
  unsubscribedAt?: string | null;
  unsubscribeReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// LISTS
// ============================================================================

export interface MailingList {
  id: string;
  siteId: string;
  name: string;
  description?: string | null;
  type: ListType;
  subscriberCount: number;
  isDoubleOptIn: boolean;
  welcomeEmailTemplateId?: string | null;
  tags: string[];
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListSubscriber {
  id: string;
  listId: string;
  subscriberId: string;
  addedAt: string;
  source?: string | null;
}

// ============================================================================
// CAMPAIGN SENDS
// ============================================================================

export interface CampaignSend {
  id: string;
  campaignId: string;
  subscriberId: string;
  email: string;
  status: CampaignSendStatus;
  resendMessageId?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  firstOpenedAt?: string | null;
  lastOpenedAt?: string | null;
  openCount: number;
  firstClickedAt?: string | null;
  lastClickedAt?: string | null;
  clickCount: number;
  clickedLinks: Record<string, unknown>[];
  bouncedAt?: string | null;
  bounceType?: string | null;
  bounceReason?: string | null;
  unsubscribedAt?: string | null;
  complainedAt?: string | null;
  abVariant?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// CAMPAIGN LINKS
// ============================================================================

export interface CampaignLink {
  id: string;
  campaignId: string;
  originalUrl: string;
  trackingUrl: string;
  displayText?: string | null;
  position?: number | null;
  totalClicks: number;
  uniqueClicks: number;
  createdAt: string;
}
