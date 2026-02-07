/**
 * PHASE AWD-03: AI Website Designer Core Engine
 * Zod Schemas for AI Output Validation
 *
 * These schemas validate the structured outputs from the AI model
 * to ensure type safety and data integrity.
 * 
 * IMPORTANT: OpenAI structured output requires ALL properties to be REQUIRED.
 * Use .default() instead of .optional() to provide fallback values.
 * Never use .optional() in schemas passed to generateObject() with OpenAI.
 */

import { z } from "zod";

// =============================================================================
// DESIGN TOKENS SCHEMA
// =============================================================================

export const DesignTokensSchema = z.object({
  primaryColor: z.string().describe("Primary brand color in hex format"),
  secondaryColor: z.string().describe("Secondary color in hex format"),
  accentColor: z.string().describe("Accent color for highlights"),
  backgroundColor: z.string().describe("Background color"),
  textColor: z.string().describe("Main text color"),
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
  priority: z.number().int().describe("Page priority from 1-99 where 1 is highest"),
});

// =============================================================================
// NAVBAR PLAN SCHEMA
// =============================================================================

export const NavbarPlanSchema = z.object({
  style: z.enum(["sticky", "fixed", "static"]).describe("Navbar positioning style"),
  variant: z.enum(["minimal", "modern", "classic", "transparent"]).describe("Visual variant"),
  ctaButton: z.boolean().describe("Whether to show a CTA button"),
  ctaText: z.string().describe("CTA button text, e.g. 'Contact Us' or 'Get Started'"),
  ctaLink: z.string().describe("CTA button link, e.g. '/contact'"),
});

// =============================================================================
// FOOTER PLAN SCHEMA
// =============================================================================

export const FooterPlanSchema = z.object({
  style: z.enum(["minimal", "simple", "comprehensive", "centered"]).describe("Footer style"),
  columns: z.number().int().describe("Number of link columns, must be 1, 2, 3, or 4"),
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
  pages: z.array(PagePlanSchema).describe("Pages to generate, between 1 and 20 pages"),
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
  props: z.array(
    z.object({
      key: z.string().describe("Property name"),
      value: z.string().describe("Property value as a JSON string"),
    })
  ).describe("Component props as key-value pairs. Use JSON strings for complex values."),
  aiNotes: z.string().describe("AI reasoning for this configuration"),
});

// =============================================================================
// PAGE SEO SCHEMA
// =============================================================================

export const PageSEOSchema = z.object({
  title: z.string().describe("Page title for SEO"),
  description: z.string().describe("Meta description"),
  keywords: z.array(z.string()).describe("SEO keywords"),
  ogImage: z.string().describe("Open Graph image URL or empty string if none"),
  noIndex: z.boolean().describe("Whether to hide from search engines"),
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
  seo: PageSEOSchema,
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
  variant: z.string().describe("Navbar visual variant"),
  position: z.enum(["sticky", "fixed", "static"]).describe("Navbar positioning"),
  logoUrl: z.string().describe("Logo image URL or empty string"),
  logoText: z.string().describe("Logo text fallback when no image"),
  logoAlt: z.string().describe("Logo alt text"),
  navItems: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        isExternal: z.boolean().describe("Whether this link opens externally"),
      })
    )
    .describe("Navigation menu items"),
  ctaText: z.string().describe("CTA button text"),
  ctaLink: z.string().describe("CTA button link"),
  ctaVariant: z.string().describe("CTA button style variant"),
  backgroundColor: z.string().describe("Navbar background color"),
  textColor: z.string().describe("Navbar text color"),
  shadow: z.boolean().describe("Whether navbar has shadow"),
  transparent: z.boolean().describe("Whether navbar starts transparent"),
  mobileMenuStyle: z.string().describe("Mobile menu style: slide, dropdown, fullscreen"),
});

// =============================================================================
// FOOTER COMPONENT SCHEMA
// =============================================================================

export const FooterComponentSchema = z.object({
  variant: z.string().describe("Footer visual variant"),
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
    .describe("Footer link columns"),
  logoUrl: z.string().describe("Footer logo URL or empty string"),
  logoText: z.string().describe("Footer logo text fallback"),
  tagline: z.string().describe("Business tagline"),
  businessName: z.string().describe("Business name"),
  email: z.string().describe("Contact email"),
  phone: z.string().describe("Contact phone"),
  address: z.string().describe("Business address"),
  socialLinks: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string(),
      })
    )
    .describe("Social media links"),
  showNewsletter: z.boolean().describe("Whether to show newsletter signup"),
  newsletterTitle: z.string().describe("Newsletter section title"),
  newsletterDescription: z.string().describe("Newsletter section description"),
  copyrightText: z.string().describe("Copyright text"),
  backgroundColor: z.string().describe("Footer background color"),
  textColor: z.string().describe("Footer text color"),
  borderTop: z.boolean().describe("Whether footer has top border"),
});

// =============================================================================
// POST-PROCESSING UTILITIES
// =============================================================================

/**
 * Convert AI-generated key-value pair arrays back to plain objects.
 * OpenAI doesn't support z.record() (generates 'propertyNames' keyword),
 * so we use arrays of {key, value} in schemas and convert back here.
 */
export function convertPropsArrayToObject(
  propsArray: Array<{ key: string; value: string }>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { key, value } of propsArray) {
    try {
      // Try to parse as JSON (for arrays, objects, booleans, numbers)
      result[key] = JSON.parse(value);
    } catch {
      // If not valid JSON, use as plain string
      result[key] = value;
    }
  }
  return result;
}

/**
 * Process AI-generated components to convert props from key-value arrays to objects.
 * Call this after every generateObject() that uses GeneratedComponentSchema.
 */
export function processAIComponents(
  components: Array<{
    id: string;
    type: string;
    props: Array<{ key: string; value: string }>;
    aiNotes: string;
  }>
): Array<{ id: string; type: string; props: Record<string, unknown>; aiNotes: string }> {
  return components.map((c) => ({
    ...c,
    props: convertPropsArrayToObject(c.props),
  }));
}

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
