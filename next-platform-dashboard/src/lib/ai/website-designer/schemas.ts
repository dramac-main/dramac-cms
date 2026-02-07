/**
 * PHASE AWD-03: AI Website Designer Core Engine
 * Zod Schemas for AI Output Validation
 *
 * These schemas validate the structured outputs from Claude
 * to ensure type safety and data integrity.
 */

import { z } from "zod";

// =============================================================================
// DESIGN TOKENS SCHEMA
// =============================================================================

export const DesignTokensSchema = z.object({
  primaryColor: z.string().describe("Primary brand color in hex format"),
  secondaryColor: z.string().optional().describe("Secondary color in hex format"),
  accentColor: z.string().optional().describe("Accent color for highlights"),
  backgroundColor: z.string().optional().describe("Background color"),
  textColor: z.string().optional().describe("Main text color"),
  fontHeading: z.string().describe("Font family for headings"),
  fontBody: z.string().describe("Font family for body text"),
  borderRadius: z
    .enum(["none", "sm", "md", "lg", "xl", "full"])
    .describe("Border radius style"),
  shadowStyle: z
    .enum(["none", "subtle", "soft", "dramatic"])
    .describe("Shadow intensity"),
  spacingScale: z
    .enum(["compact", "balanced", "spacious"])
    .describe("Spacing density"),
});

// =============================================================================
// SECTION PLAN SCHEMA
// =============================================================================

export const SectionPlanSchema = z.object({
  intent: z.string().describe("Purpose of this section (e.g., 'Hero section to capture attention')"),
  suggestedComponent: z.string().describe("Best component type for this section"),
  alternativeComponents: z.array(z.string()).describe("Alternative component options"),
  contentNeeds: z.array(z.string()).describe("Content items needed (e.g., headline, image)"),
  designNotes: z.string().describe("Design guidance for this section"),
});

// =============================================================================
// PAGE PLAN SCHEMA
// =============================================================================

export const PagePlanSchema = z.object({
  name: z.string().describe("Display name for the page"),
  slug: z.string().describe("URL slug for the page (e.g., '/' for home, '/about' for about)"),
  purpose: z.string().describe("Purpose of this page"),
  sections: z.array(SectionPlanSchema).describe("Sections to include on this page"),
  priority: z.number().int().min(1).max(99).describe("Page priority (1 = highest)"),
});

// =============================================================================
// NAVBAR PLAN SCHEMA
// =============================================================================

export const NavbarPlanSchema = z.object({
  style: z.enum(["sticky", "fixed", "static"]).describe("Navbar positioning style"),
  variant: z.enum(["minimal", "modern", "classic", "transparent"]).describe("Visual variant"),
  ctaButton: z.boolean().describe("Whether to show a CTA button"),
  ctaText: z.string().optional().describe("CTA button text"),
  ctaLink: z.string().optional().describe("CTA button link"),
});

// =============================================================================
// FOOTER PLAN SCHEMA
// =============================================================================

export const FooterPlanSchema = z.object({
  style: z.enum(["minimal", "simple", "comprehensive", "centered"]).describe("Footer style"),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).describe("Number of link columns"),
  newsletter: z.boolean().describe("Include newsletter signup"),
  socialLinks: z.boolean().describe("Include social media links"),
  copyright: z.boolean().describe("Include copyright notice"),
});

// =============================================================================
// SITE ARCHITECTURE SCHEMA
// =============================================================================

export const SiteArchitectureSchema = z.object({
  intent: z
    .enum([
      "portfolio",
      "ecommerce",
      "landing",
      "corporate",
      "blog",
      "service",
      "restaurant",
      "real-estate",
      "agency",
      "saas",
      "healthcare",
      "construction",
      "education",
      "nonprofit",
      "general",
    ])
    .describe("Primary purpose/intent of the website"),
  tone: z
    .enum([
      "professional",
      "playful",
      "minimal",
      "bold",
      "elegant",
      "friendly",
      "authoritative",
      "innovative",
    ])
    .describe("Brand voice and tone"),
  pages: z.array(PagePlanSchema).min(1).max(20).describe("Pages to generate"),
  sharedElements: z.object({
    navbar: NavbarPlanSchema,
    footer: FooterPlanSchema,
  }),
  designTokens: DesignTokensSchema,
});

// =============================================================================
// GENERATED COMPONENT SCHEMA
// =============================================================================

export const GeneratedComponentSchema = z.object({
  id: z.string().describe("Unique component ID"),
  type: z.string().describe("Component type from registry"),
  props: z.record(z.string(), z.unknown()).describe("Component props"),
  aiNotes: z.string().optional().describe("AI reasoning for this configuration"),
});

// =============================================================================
// PAGE SEO SCHEMA
// =============================================================================

export const PageSEOSchema = z.object({
  title: z.string().describe("Page title for SEO"),
  description: z.string().describe("Meta description"),
  keywords: z.array(z.string()).optional().describe("SEO keywords"),
  ogImage: z.string().optional().describe("Open Graph image URL"),
  noIndex: z.boolean().optional().describe("Whether to hide from search engines"),
});

// =============================================================================
// GENERATED PAGE SCHEMA
// =============================================================================

export const GeneratedPageSchema = z.object({
  name: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  components: z.array(GeneratedComponentSchema),
  seo: PageSEOSchema.optional(),
});

// =============================================================================
// PAGE COMPONENTS OUTPUT SCHEMA
// =============================================================================

export const PageComponentsOutputSchema = z.object({
  components: z.array(GeneratedComponentSchema),
});

// =============================================================================
// NAVBAR COMPONENT SCHEMA
// =============================================================================

export const NavbarComponentSchema = z.object({
  variant: z.string().optional(),
  position: z.enum(["sticky", "fixed", "static"]).optional(),
  logoUrl: z.string().optional(),
  logoText: z.string().optional(),
  logoAlt: z.string().optional(),
  navItems: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        isExternal: z.boolean().optional(),
      })
    )
    .optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  ctaVariant: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  shadow: z.boolean().optional(),
  transparent: z.boolean().optional(),
  mobileMenuStyle: z.string().optional(),
});

// =============================================================================
// FOOTER COMPONENT SCHEMA
// =============================================================================

export const FooterComponentSchema = z.object({
  variant: z.string().optional(),
  columns: z
    .array(
      z.object({
        title: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            href: z.string(),
          })
        ),
      })
    )
    .optional(),
  logoUrl: z.string().optional(),
  logoText: z.string().optional(),
  tagline: z.string().optional(),
  businessName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  showNewsletter: z.boolean().optional(),
  newsletterTitle: z.string().optional(),
  newsletterDescription: z.string().optional(),
  copyrightText: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderTop: z.boolean().optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type DesignTokensSchemaType = z.infer<typeof DesignTokensSchema>;
export type SectionPlanSchemaType = z.infer<typeof SectionPlanSchema>;
export type PagePlanSchemaType = z.infer<typeof PagePlanSchema>;
export type SiteArchitectureSchemaType = z.infer<typeof SiteArchitectureSchema>;
export type GeneratedComponentSchemaType = z.infer<typeof GeneratedComponentSchema>;
export type GeneratedPageSchemaType = z.infer<typeof GeneratedPageSchema>;
export type NavbarComponentSchemaType = z.infer<typeof NavbarComponentSchema>;
export type FooterComponentSchemaType = z.infer<typeof FooterComponentSchema>;
