import type {
  CampaignStatus,
  CampaignType,
  SubscriberStatus,
  TemplateCategory,
  SequenceStatus,
  SequenceStepType,
  FunnelStatus,
  FunnelStepType,
  CampaignSendStatus,
  ListType,
  LandingPageStatus,
  FormType,
  FormStatus,
} from "../types";

// ─── Table Names ───────────────────────────────────────────────
export const MKT_TABLES = {
  campaigns: "mod_mktmod01_campaigns",
  emailTemplates: "mod_mktmod01_email_templates",
  audiences: "mod_mktmod01_audiences",
  subscribers: "mod_mktmod01_subscribers",
  mailingLists: "mod_mktmod01_lists",
  listSubscribers: "mod_mktmod01_list_subscribers",
  campaignSends: "mod_mktmod01_campaign_sends",
  campaignLinks: "mod_mktmod01_campaign_links",
  sequences: "mod_mktmod01_sequences",
  sequenceSteps: "mod_mktmod01_sequence_steps",
  sequenceEnrollments: "mod_mktmod01_sequence_enrollments",
  funnels: "mod_mktmod01_funnels",
  funnelSteps: "mod_mktmod01_funnel_steps",
  funnelVisits: "mod_mktmod01_funnel_visits",
  settings: "mod_mktmod01_settings",
  landingPages: "mod_mktmod01_landing_pages",
  landingPageVisits: "mod_mktmod01_landing_page_visits",
  forms: "mod_mktmod01_forms",
  formSubmissions: "mod_mktmod01_form_submissions",
  sendingStats: "mod_mktmod01_sending_stats",
  socialConnections: "mod_mktmod01_social_connections",
  socialPosts: "mod_mktmod01_social_posts",
  // LP Builder Pro (Phase LPB-01)
  lpFormSubmissions: "mod_mktmod01_lp_form_submissions",
  lpVisits: "mod_mktmod01_lp_visits",
  lpTemplates: "mod_mktmod01_lp_templates",
} as const;

// ─── Campaign Status ───────────────────────────────────────────
export const VALID_CAMPAIGN_TRANSITIONS: Record<
  CampaignStatus,
  CampaignStatus[]
> = {
  draft: ["scheduled", "sending", "cancelled"],
  scheduled: ["sending", "cancelled"],
  sending: ["sent", "paused", "failed"],
  sent: ["archived"],
  paused: ["sending", "cancelled"],
  cancelled: ["draft"],
  archived: ["draft"],
  failed: ["draft"],
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
  paused: "Paused",
  cancelled: "Cancelled",
  archived: "Archived",
  failed: "Failed",
};

export const CAMPAIGN_STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; bgColor: string; description: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    description: "Campaign is being composed",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    description: "Campaign will send at the scheduled time",
  },
  sending: {
    label: "Sending",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
    description: "Campaign is currently being delivered",
  },
  sent: {
    label: "Sent",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
    description: "Campaign has been delivered",
  },
  paused: {
    label: "Paused",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900",
    description: "Campaign sending is paused",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
    description: "Campaign was cancelled",
  },
  archived: {
    label: "Archived",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    description: "Campaign has been archived",
  },
  failed: {
    label: "Failed",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
    description: "Campaign failed to send",
  },
};

// ─── Campaign Types ────────────────────────────────────────────
export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  multi_channel: "Multi-Channel",
};

// ─── Template Categories ───────────────────────────────────────
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  welcome: "Welcome",
  promotional: "Promotional",
  newsletter: "Newsletter",
  transactional: "Transactional",
  announcement: "Announcement",
  winback: "Win-Back",
  seasonal: "Seasonal",
  custom: "Custom",
};

// ─── Subscriber Status ─────────────────────────────────────────
export const SUBSCRIBER_STATUS_LABELS: Record<SubscriberStatus, string> = {
  active: "Active",
  unsubscribed: "Unsubscribed",
  bounced: "Bounced",
  complained: "Complained",
  cleaned: "Cleaned",
};

export const SUBSCRIBER_STATUS_CONFIG: Record<
  SubscriberStatus,
  { label: string; color: string; bgColor: string }
> = {
  active: {
    label: "Active",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  unsubscribed: {
    label: "Unsubscribed",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  bounced: {
    label: "Bounced",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900",
  },
  complained: {
    label: "Complained",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  cleaned: {
    label: "Cleaned",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900",
  },
};

// ─── List Types ────────────────────────────────────────────────
export const LIST_TYPE_LABELS: Record<ListType, string> = {
  manual: "Manual",
  import: "Import",
  form_capture: "Form Capture",
  api: "API",
};

// ─── Sequence Status ───────────────────────────────────────────
export const VALID_SEQUENCE_TRANSITIONS: Record<
  SequenceStatus,
  SequenceStatus[]
> = {
  draft: ["active", "archived"],
  active: ["paused", "archived"],
  paused: ["active", "archived"],
  archived: ["draft"],
};

export const SEQUENCE_STATUS_LABELS: Record<SequenceStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export const SEQUENCE_STEP_TYPE_LABELS: Record<SequenceStepType, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  delay: "Delay",
  condition: "Condition",
  action: "Action",
  split: "Split",
};

// ─── Send Status ───────────────────────────────────────────────
export const SEND_STATUS_LABELS: Record<CampaignSendStatus, string> = {
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  opened: "Opened",
  clicked: "Clicked",
  bounced: "Bounced",
  failed: "Failed",
  complained: "Complained",
  unsubscribed: "Unsubscribed",
};

// ─── Funnel Status ─────────────────────────────────────────────
export const FUNNEL_STATUS_LABELS: Record<FunnelStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export const FUNNEL_STEP_TYPE_LABELS: Record<FunnelStepType, string> = {
  landing_page: "Landing Page",
  opt_in: "Opt-In",
  sales_page: "Sales Page",
  checkout: "Checkout",
  upsell: "Upsell",
  downsell: "Downsell",
  thank_you: "Thank You",
  webinar: "Webinar",
  custom: "Custom",
};

// ─── Limits & Defaults ────────────────────────────────────────
export const MARKETING_LIMITS = {
  campaignNameMax: 200,
  subjectLineMax: 200,
  previewTextMax: 200,
  templateNameMax: 200,
  audienceNameMax: 200,
  listNameMax: 200,
  sequenceNameMax: 200,
  funnelNameMax: 200,
  landingPageTitleMax: 200,
  formNameMax: 200,
  tagsMax: 20,
  defaultDailyQuota: 1000,
  defaultMonthlyQuota: 25000,
  formSubmissionRateLimit: 10,
  smsBodyMax: 1600,
  smsSegmentGsm7: 160,
  smsSegmentUcs2: 70,
  whatsAppTemplateBodyMax: 1024,
} as const;

// ─── Landing Page Status ──────────────────────────────────────
export const LANDING_PAGE_STATUS_LABELS: Record<LandingPageStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const LANDING_PAGE_STATUS_CONFIG: Record<
  LandingPageStatus,
  { label: string; color: string; bgColor: string; description: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    description: "Landing page is being edited",
  },
  published: {
    label: "Published",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
    description: "Landing page is live and accessible",
  },
  archived: {
    label: "Archived",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    description: "Landing page has been archived",
  },
};

// ─── Form Type Labels ─────────────────────────────────────────
export const FORM_TYPE_LABELS: Record<FormType, string> = {
  inline: "Inline",
  popup: "Popup",
  slide_in: "Slide-In",
  top_bar: "Top Bar",
  full_page: "Full Page",
  floating_bar: "Floating Bar",
  exit_intent: "Exit Intent",
};

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export const FORM_STATUS_CONFIG: Record<
  FormStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  active: {
    label: "Active",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  paused: {
    label: "Paused",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900",
  },
  archived: {
    label: "Archived",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
};
