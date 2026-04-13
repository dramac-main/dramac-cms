/**
 * LP Builder Pro — Constants
 *
 * Component categories, template categories, and static configuration
 * for the Landing Page Builder.
 *
 * @phase LPB-01 — Foundation
 */

import type { LPTemplateCategory } from "../types/lp-builder-types";

// ─── LP Component Types ────────────────────────────────────────

/**
 * All LP-specific Studio component type identifiers.
 * These match the `type` field in core-components.ts definitions.
 */
export const LP_COMPONENT_TYPES = [
  "LPHero",
  "LPForm",
  "LPLogoBar",
  "LPTrustBadges",
  "LPCountdown",
  "LPTestimonialWall",
  "LPPricingTable",
  "LPFloatingCTA",
] as const;

export type LPComponentType = (typeof LP_COMPONENT_TYPES)[number];

// ─── Template Categories ───────────────────────────────────────

export const LP_TEMPLATE_CATEGORIES: {
  id: LPTemplateCategory;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "lead-gen",
    label: "Lead Generation",
    description: "Capture leads with forms and CTAs",
    icon: "UserPlus",
  },
  {
    id: "webinar",
    label: "Webinar",
    description: "Webinar registration pages",
    icon: "Video",
  },
  {
    id: "product-launch",
    label: "Product Launch",
    description: "Launch announcements and pre-orders",
    icon: "Rocket",
  },
  {
    id: "coming-soon",
    label: "Coming Soon",
    description: "Pre-launch countdown pages",
    icon: "Clock",
  },
  {
    id: "sale-promo",
    label: "Sale / Promo",
    description: "Limited-time offers and promotions",
    icon: "Tag",
  },
  {
    id: "ebook-download",
    label: "eBook Download",
    description: "Free resource download pages",
    icon: "BookOpen",
  },
  {
    id: "free-trial",
    label: "Free Trial",
    description: "Trial signup pages",
    icon: "Gift",
  },
  {
    id: "consultation",
    label: "Consultation",
    description: "Book a consultation or demo",
    icon: "Calendar",
  },
  {
    id: "saas-signup",
    label: "SaaS Signup",
    description: "SaaS product signup pages",
    icon: "Laptop",
  },
  {
    id: "app-download",
    label: "App Download",
    description: "Mobile app download pages",
    icon: "Smartphone",
  },
  {
    id: "agency-services",
    label: "Agency Services",
    description: "Service offering pages",
    icon: "Briefcase",
  },
  {
    id: "newsletter",
    label: "Newsletter",
    description: "Newsletter signup pages",
    icon: "Mail",
  },
  {
    id: "event-registration",
    label: "Event Registration",
    description: "Event and conference registration",
    icon: "CalendarDays",
  },
  {
    id: "course-enrollment",
    label: "Course Enrollment",
    description: "Online course signup pages",
    icon: "GraduationCap",
  },
  {
    id: "real-estate",
    label: "Real Estate",
    description: "Property listing and inquiry pages",
    icon: "Home",
  },
  {
    id: "fitness-health",
    label: "Fitness & Health",
    description: "Fitness program signup pages",
    icon: "Heart",
  },
];

// ─── Default LP Structure ──────────────────────────────────────

/**
 * Default Studio component tree for a blank landing page.
 * Used when starting from scratch (no template).
 */
export const DEFAULT_LP_CONTENT_STUDIO = {
  root: {
    type: "Section",
    props: {
      background: "transparent",
      padding: "80px 0",
    },
    children: [
      {
        type: "LPHero",
        props: {
          variant: "split-left",
          headline: "Your Headline Here",
          subheadline:
            "Add a compelling description that explains your offer and why visitors should take action.",
          ctaText: "Get Started",
          ctaUrl: "#",
          minHeight: "80vh",
          verticalAlign: "center",
          textAlign: "left",
        },
      },
    ],
  },
};

// ─── Conversion Goals ──────────────────────────────────────────

export const LP_CONVERSION_GOALS = [
  {
    value: "form_submit",
    label: "Form Submission",
    description: "Track form completions",
  },
  {
    value: "button_click",
    label: "Button Click",
    description: "Track CTA button clicks",
  },
  {
    value: "page_scroll",
    label: "Page Scroll",
    description: "Track scroll to a target depth",
  },
] as const;

// ─── LP Status Labels ──────────────────────────────────────────

export const LP_STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "bg-yellow-100 text-yellow-800",
    icon: "FileEdit",
  },
  published: {
    label: "Published",
    color: "bg-green-100 text-green-800",
    icon: "Globe",
  },
  archived: {
    label: "Archived",
    color: "bg-gray-100 text-gray-800",
    icon: "Archive",
  },
} as const;
