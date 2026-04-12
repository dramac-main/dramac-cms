/**
 * Marketing Module - SMS & WhatsApp Types
 *
 * Phase MKT-08: SMS & WhatsApp Channel (Foundation)
 *
 * Types for SMS/WhatsApp providers, messages, and delivery tracking.
 */

// ============================================================================
// SMS TYPES
// ============================================================================

export interface SMSOptions {
  from?: string;
  campaignId?: string;
  contactId?: string;
  subscriberId?: string;
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  segments?: number;
}

export interface DeliveryStatus {
  messageId: string;
  status: "queued" | "sent" | "delivered" | "failed" | "undelivered";
  errorCode?: string;
  errorMessage?: string;
  updatedAt: string;
}

export interface SMSProvider {
  sendSMS(
    to: string,
    message: string,
    options?: SMSOptions,
  ): Promise<SMSSendResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}

export interface SMSProviderConfig {
  provider: "twilio" | "vonage" | "messagebird";
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  dailyLimit: number;
}

// ============================================================================
// WHATSAPP TYPES
// ============================================================================

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{
    type: "text" | "image" | "document" | "video";
    text?: string;
    image?: { link: string };
  }>;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    components?: WhatsAppTemplateComponent[],
  ): Promise<WhatsAppSendResult>;
  sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult>;
}

export interface WhatsAppProviderConfig {
  businessAccountId?: string;
  phoneNumberId?: string;
  accessToken?: string;
  approvedTemplates: WhatsAppTemplate[];
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: "marketing" | "utility" | "authentication";
  status: "approved" | "pending" | "rejected";
  components: Array<{
    type: "header" | "body" | "footer" | "buttons";
    text?: string;
    format?: string;
  }>;
}

// ============================================================================
// SEQUENCE STEP CONFIGS FOR SMS/WHATSAPP
// ============================================================================

export interface SMSStepConfig {
  message: string;
  personalization: boolean;
}

export interface WhatsAppStepConfig {
  templateName: string;
  templateLanguage: string;
  templateComponents: WhatsAppTemplateComponent[];
}

// ============================================================================
// SMS CAMPAIGN (extends existing campaign with channel = 'sms')
// ============================================================================

export interface SMSCampaignContent {
  message: string;
  personalization: boolean;
  characterCount: number;
  segments: number;
}

// ============================================================================
// MESSAGE DELIVERY LOG
// ============================================================================

export interface MessageDeliveryLog {
  id: string;
  siteId: string;
  channel: "sms" | "whatsapp";
  campaignId?: string;
  sequenceId?: string;
  subscriberId?: string;
  contactId?: string;
  to: string;
  content: string;
  templateName?: string;
  providerMessageId?: string;
  status: "queued" | "sent" | "delivered" | "failed" | "undelivered";
  errorMessage?: string;
  cost?: number;
  sentAt: string;
  deliveredAt?: string;
}

// ============================================================================
// AI MARKETING INTELLIGENCE TYPES (MKT-09)
// ============================================================================

export interface SubjectLineInput {
  goal: string;
  audienceDescription: string;
  keyMessage: string;
  brandVoice?: string;
  industry?: string;
}

export interface SubjectLineSuggestion {
  subjectLine: string;
  previewText: string;
  predictedPerformance: "high" | "medium" | "low";
  reasoning: string;
}

export interface EmailContentInput {
  goal: string;
  keyMessage: string;
  audienceDescription: string;
  tone: string;
  callToAction: string;
  brandVoice?: string;
}

export interface EmailContentResult {
  blocks: Array<{
    type: string;
    content: Record<string, any>;
  }>;
  subjectLine: string;
  previewText: string;
}

export interface SendTimeRecommendation {
  day: number; // 0=Sun, 6=Sat
  hour: number; // 0-23
  confidence: number; // 0-1
  dataPoints: number;
  reasoning: string;
}

export interface AudienceSuggestion {
  name: string;
  description: string;
  estimatedMatchRate: number;
  filterSuggestions: string[];
}

export interface CampaignDraft {
  name: string;
  type: string;
  subject?: string;
  previewText?: string;
  contentSummary: string;
  suggestedSegments: string[];
  suggestedSendDay: string;
  suggestedSendHour: number;
  estimatedDuration: string;
  keyMessages: string[];
  callToAction: string;
  tone: string;
}

export interface MarketingInsight {
  title: string;
  description: string;
  type: "positive" | "warning" | "suggestion";
  priority: "high" | "medium" | "low";
}
