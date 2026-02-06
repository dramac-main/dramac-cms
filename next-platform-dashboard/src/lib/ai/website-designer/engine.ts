/**
 * PHASE AWD-03: AI Website Designer Core Engine
 * Main WebsiteDesignerEngine Class
 *
 * This is the brain of the AI Website Designer - it orchestrates
 * all systems to generate complete, multi-page websites from a single prompt.
 */

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { buildDataContext } from "./data-context/builder";
import { formatContextForAI } from "./data-context/formatter";
import { checkDataAvailability } from "./data-context/checker";
import { componentRegistry } from "@/lib/studio/registry";
import {
  SITE_ARCHITECT_PROMPT,
  PAGE_GENERATOR_PROMPT,
  NAVBAR_GENERATOR_PROMPT,
  FOOTER_GENERATOR_PROMPT,
  buildArchitecturePrompt,
  buildPagePrompt,
} from "./prompts";
import {
  SiteArchitectureSchema,
  PageComponentsOutputSchema,
  NavbarComponentSchema,
  FooterComponentSchema,
} from "./schemas";
import type {
  WebsiteDesignerInput,
  WebsiteDesignerOutput,
  SiteArchitecture,
  GeneratedPage,
  GeneratedComponent,
  PagePlan,
  NavigationStructure,
  SiteSettings,
  SEOSettings,
  AppliedDesignSystem,
  ContentSummary,
  PageSEO,
  GenerationProgress,
} from "./types";
import type { BusinessDataContext, DataAvailability } from "./data-context/types";

// =============================================================================
// ENGINE CLASS
// =============================================================================

export class WebsiteDesignerEngine {
  private siteId: string;
  private context: BusinessDataContext | null = null;
  private availability: DataAvailability | null = null;
  private architecture: SiteArchitecture | null = null;
  private onProgress?: (progress: GenerationProgress) => void;

  constructor(siteId: string, onProgress?: (progress: GenerationProgress) => void) {
    this.siteId = siteId;
    this.onProgress = onProgress;
  }

  /**
   * Generate a complete website from a user prompt
   */
  async generateWebsite(input: WebsiteDesignerInput): Promise<WebsiteDesignerOutput> {
    const startTime = Date.now();

    try {
      // Step 1: Build data context
      this.reportProgress("building-context", "Gathering business information...", 0, 1);
      this.context = await buildDataContext(this.siteId);
      this.availability = checkDataAvailability(this.context);
      const formattedContext = formatContextForAI(this.context);

      // Step 2: Analyze prompt and create architecture
      this.reportProgress("analyzing-prompt", "Analyzing your requirements...", 0, 1);
      this.architecture = await this.createArchitecture(
        input.prompt,
        formattedContext,
        input.preferences
      );

      // Apply constraints if provided
      if (input.constraints) {
        this.applyConstraints(input.constraints);
      }

      // Step 3: Generate each page
      const totalPages = this.architecture.pages.length;
      const pages: GeneratedPage[] = [];

      for (let i = 0; i < totalPages; i++) {
        const pagePlan = this.architecture.pages[i];
        this.reportProgress(
          "generating-pages",
          `Generating ${pagePlan.name} page...`,
          i,
          totalPages,
          pagePlan.name
        );

        const page = await this.generatePage(pagePlan, formattedContext);
        pages.push(page);
      }

      // Step 4: Generate shared elements (navbar, footer)
      this.reportProgress("generating-shared-elements", "Creating navigation...", 0, 1);
      const navbar = await this.generateNavbar(pages);
      const footer = await this.generateFooter();

      // Step 5: Apply navbar and footer to all pages
      const pagesWithNav = this.applySharedElements(pages, navbar, footer);

      // Step 6: Generate navigation structure
      const navigation = this.generateNavigation(pagesWithNav);

      // Step 7: Finalize
      this.reportProgress("finalizing", "Finalizing website...", 0, 1);
      const siteSettings = this.generateSiteSettings();
      const seoSettings = this.generateSEO();
      const designSystem = this.buildDesignSystem();
      const contentSummary = this.generateContentSummary(pagesWithNav);

      const buildTime = Date.now() - startTime;

      return {
        success: true,
        site: {
          name: this.getBusinessName(),
          domain: this.context.site.domain,
          settings: siteSettings,
          seo: seoSettings,
        },
        pages: pagesWithNav,
        navigation,
        designSystem,
        contentSummary,
        estimatedBuildTime: buildTime,
        architecture: this.architecture,
      };
    } catch (error) {
      console.error("[WebsiteDesignerEngine] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate website",
        site: {
          name: "",
          settings: this.getDefaultSiteSettings(),
          seo: this.getDefaultSEO(),
        },
        pages: [],
        navigation: { main: [], footer: [] },
        designSystem: this.getDefaultDesignSystem(),
        contentSummary: this.getEmptyContentSummary(),
        estimatedBuildTime: Date.now() - startTime,
        architecture: this.getDefaultArchitecture(),
      };
    }
  }

  // ===========================================================================
  // ARCHITECTURE GENERATION
  // ===========================================================================

  /**
   * Create site architecture from user prompt
   */
  private async createArchitecture(
    prompt: string,
    context: string,
    preferences?: WebsiteDesignerInput["preferences"]
  ): Promise<SiteArchitecture> {
    const componentSummary = this.summarizeComponents();

    const fullPrompt = buildArchitecturePrompt(
      prompt,
      context,
      preferences as Record<string, unknown> | undefined,
      componentSummary
    );

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: SiteArchitectureSchema,
      system: SITE_ARCHITECT_PROMPT,
      prompt: fullPrompt,
    });

    return object as SiteArchitecture;
  }

  /**
   * Apply user constraints to architecture
   */
  private applyConstraints(constraints: WebsiteDesignerInput["constraints"]): void {
    if (!this.architecture || !constraints) return;

    // Limit pages
    if (constraints.maxPages && this.architecture.pages.length > constraints.maxPages) {
      this.architecture.pages = this.architecture.pages.slice(0, constraints.maxPages);
    }

    // Ensure required pages exist
    if (constraints.requiredPages) {
      for (const requiredSlug of constraints.requiredPages) {
        const exists = this.architecture.pages.some(
          (p) => p.slug === requiredSlug || p.name.toLowerCase() === requiredSlug.toLowerCase()
        );
        if (!exists) {
          this.architecture.pages.push({
            name: this.slugToName(requiredSlug),
            slug: requiredSlug.startsWith("/") ? requiredSlug : `/${requiredSlug}`,
            purpose: `Required page: ${requiredSlug}`,
            sections: [],
            priority: this.architecture.pages.length + 1,
          });
        }
      }
    }

    // Filter excluded components from sections
    if (constraints.excludeComponents) {
      for (const page of this.architecture.pages) {
        page.sections = page.sections.filter(
          (s) => !constraints.excludeComponents!.includes(s.suggestedComponent)
        );
      }
    }
  }

  // ===========================================================================
  // PAGE GENERATION
  // ===========================================================================

  /**
   * Generate a single page with all its components
   */
  private async generatePage(pagePlan: PagePlan, context: string): Promise<GeneratedPage> {
    // Get detailed field info for suggested components
    const componentDetails = pagePlan.sections.map((section) => {
      const component = componentRegistry.get(section.suggestedComponent);
      return {
        section: section.intent,
        component: section.suggestedComponent,
        fields: component?.fields || {},
        fieldGroups: component?.fieldGroups || [],
      };
    });

    const fullPrompt = buildPagePrompt(
      pagePlan,
      context,
      (this.architecture?.designTokens || {}) as Record<string, unknown>,
      componentDetails
    );

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: PageComponentsOutputSchema,
      system: PAGE_GENERATOR_PROMPT,
      prompt: fullPrompt,
    });

    // Ensure all components have unique IDs
    const components = (object.components || []).map((c, index) => ({
      ...c,
      id: c.id || `${pagePlan.slug.replace(/\//g, "-")}-component-${index}`,
    }));

    return {
      id: crypto.randomUUID(),
      name: pagePlan.name,
      slug: pagePlan.slug,
      title: `${pagePlan.name} | ${this.getBusinessName()}`,
      description: this.generatePageDescription(pagePlan),
      isHomepage: pagePlan.slug === "/" || pagePlan.slug === "",
      components,
      seo: this.generatePageSEO(pagePlan),
      order: pagePlan.priority,
    };
  }

  // ===========================================================================
  // SHARED ELEMENTS
  // ===========================================================================

  /**
   * Generate navbar component
   */
  private async generateNavbar(pages: GeneratedPage[]): Promise<GeneratedComponent> {
    const navItems = pages
      .filter((p) => !p.isHomepage)
      .map((p) => ({
        label: p.name,
        href: p.slug,
      }));

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: NavbarComponentSchema,
      system: NAVBAR_GENERATOR_PROMPT,
      prompt: `Generate a premium navbar configuration.

Business: ${this.getBusinessName()}
Logo: ${this.context?.branding.logo_url || "Use text logo with business name"}
Pages: ${JSON.stringify(navItems)}
Style: ${this.architecture?.sharedElements.navbar.style || "sticky"}
Variant: ${this.architecture?.sharedElements.navbar.variant || "modern"}
Show CTA: ${this.architecture?.sharedElements.navbar.ctaButton}
CTA Text: ${this.architecture?.sharedElements.navbar.ctaText || "Contact Us"}
Design Tokens: ${JSON.stringify(this.architecture?.designTokens || {})}

Configure ALL navbar fields for a modern, responsive navigation.`,
    });

    return {
      id: "shared-navbar",
      type: "Navbar",
      props: {
        ...object,
        navItems: [{ label: "Home", href: "/" }, ...navItems],
      },
    };
  }

  /**
   * Generate footer component
   */
  private async generateFooter(): Promise<GeneratedComponent> {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: FooterComponentSchema,
      system: FOOTER_GENERATOR_PROMPT,
      prompt: `Generate a premium footer configuration.

Business: ${this.getBusinessName()}
Logo: ${this.context?.branding.logo_url || ""}
Contact Email: ${this.context?.contact.email || ""}
Contact Phone: ${this.context?.contact.phone || ""}
Address: ${JSON.stringify(this.context?.contact.address || {})}
Social Links: ${JSON.stringify(this.context?.social || [])}
Business Hours: ${JSON.stringify(this.context?.hours || [])}
Style: ${this.architecture?.sharedElements.footer.style || "comprehensive"}
Columns: ${this.architecture?.sharedElements.footer.columns || 4}
Show Newsletter: ${this.architecture?.sharedElements.footer.newsletter}
Design Tokens: ${JSON.stringify(this.architecture?.designTokens || {})}

Configure ALL footer fields for a comprehensive, professional footer.`,
    });

    return {
      id: "shared-footer",
      type: "Footer",
      props: {
        ...object,
        businessName: this.getBusinessName(),
        copyrightText: `© ${new Date().getFullYear()} ${this.getBusinessName()}. All rights reserved.`,
      },
    };
  }

  /**
   * Apply navbar and footer to all pages
   */
  private applySharedElements(
    pages: GeneratedPage[],
    navbar: GeneratedComponent,
    footer: GeneratedComponent
  ): GeneratedPage[] {
    return pages.map((page) => ({
      ...page,
      components: [navbar, ...page.components, footer],
    }));
  }

  // ===========================================================================
  // NAVIGATION & SETTINGS
  // ===========================================================================

  /**
   * Generate navigation structure from pages
   */
  private generateNavigation(pages: GeneratedPage[]): NavigationStructure {
    const sortedPages = [...pages].sort((a, b) => a.order - b.order);

    return {
      main: sortedPages
        .filter((p) => !p.isHomepage)
        .map((p) => ({
          label: p.name,
          href: p.slug,
          order: p.order,
        })),
      footer: sortedPages.map((p) => ({
        label: p.name,
        href: p.slug,
      })),
    };
  }

  /**
   * Generate site-wide settings
   */
  private generateSiteSettings(): SiteSettings {
    return {
      theme: "light",
      language: "en",
      timezone: "Africa/Lusaka", // Zambia default
      favicon: this.context?.branding.favicon_url,
      socialImage: this.context?.branding.logo_url,
    };
  }

  /**
   * Generate site-wide SEO settings
   */
  private generateSEO(): SEOSettings {
    const businessName = this.getBusinessName();
    const industry = this.context?.client.industry || "";
    const description =
      this.context?.client.description ||
      this.context?.site.description ||
      `Welcome to ${businessName}`;

    return {
      title: businessName,
      description:
        description.length > 160 ? description.substring(0, 157) + "..." : description,
      keywords: [businessName, industry].filter(Boolean),
      ogImage: this.context?.branding.logo_url,
      siteName: businessName,
    };
  }

  /**
   * Generate page-specific SEO
   */
  private generatePageSEO(pagePlan: PagePlan): PageSEO {
    const businessName = this.getBusinessName();

    return {
      title: `${pagePlan.name} | ${businessName}`,
      description:
        pagePlan.purpose.length > 160
          ? pagePlan.purpose.substring(0, 157) + "..."
          : pagePlan.purpose,
    };
  }

  /**
   * Generate page description from plan
   */
  private generatePageDescription(pagePlan: PagePlan): string {
    return pagePlan.purpose;
  }

  // ===========================================================================
  // DESIGN SYSTEM
  // ===========================================================================

  /**
   * Build applied design system from architecture
   */
  private buildDesignSystem(): AppliedDesignSystem {
    const tokens = this.architecture?.designTokens;

    return {
      colors: {
        primary: tokens?.primaryColor || "#3b82f6",
        secondary: tokens?.secondaryColor || "#6b7280",
        accent: tokens?.accentColor || "#f59e0b",
        background: tokens?.backgroundColor || "#ffffff",
        text: tokens?.textColor || "#111827",
      },
      typography: {
        headingFont: tokens?.fontHeading || "Inter",
        bodyFont: tokens?.fontBody || "Inter",
        scale: "1.25",
      },
      spacing: {
        scale: tokens?.spacingScale || "balanced",
      },
      borders: {
        radius: tokens?.borderRadius || "md",
      },
      shadows: {
        style: tokens?.shadowStyle || "soft",
      },
    };
  }

  // ===========================================================================
  // CONTENT SUMMARY
  // ===========================================================================

  /**
   * Generate summary of generated content
   */
  private generateContentSummary(pages: GeneratedPage[]): ContentSummary {
    const componentsUsed = new Set<string>();
    let totalComponents = 0;
    let headlines = 0;
    let paragraphs = 0;
    let buttons = 0;
    let images = 0;

    for (const page of pages) {
      for (const component of page.components) {
        componentsUsed.add(component.type);
        totalComponents++;

        // Count content types
        const props = component.props || {};
        if (props.headline || props.title) headlines++;
        if (props.description || props.content || props.text) paragraphs++;
        if (props.ctaText || props.buttonText) buttons++;
        if (props.image || props.backgroundImage || props.imageUrl) images++;
      }
    }

    const dataSourcesUsed: string[] = [];
    if (this.context?.team.length) dataSourcesUsed.push("team");
    if (this.context?.testimonials.length) dataSourcesUsed.push("testimonials");
    if (this.context?.services.length) dataSourcesUsed.push("services");
    if (this.context?.portfolio.length) dataSourcesUsed.push("portfolio");
    if (this.context?.faq.length) dataSourcesUsed.push("faq");
    if (this.context?.social.length) dataSourcesUsed.push("social");
    if (this.context?.hours.length) dataSourcesUsed.push("hours");

    return {
      totalPages: pages.length,
      totalComponents,
      componentsUsed: Array.from(componentsUsed),
      dataSourcesUsed,
      contentGenerated: {
        headlines,
        paragraphs,
        buttons,
        images,
      },
    };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Get business name from context
   */
  private getBusinessName(): string {
    return (
      this.context?.branding.business_name ||
      this.context?.client.company ||
      this.context?.client.company_name ||
      this.context?.site.name ||
      "Your Business"
    );
  }

  /**
   * Summarize available components for AI
   */
  private summarizeComponents(): string {
    const components = componentRegistry.getAll();
    return components
      .map(
        (c) =>
          `- ${c.type} (${c.category}): ${c.description || "No description"} [${Object.keys(c.fields || {}).length} fields]`
      )
      .join("\n");
  }

  /**
   * Convert slug to readable name
   */
  private slugToName(slug: string): string {
    return slug
      .replace(/^\//, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    stage: GenerationProgress["stage"],
    message: string,
    current: number,
    total: number,
    currentPage?: string
  ): void {
    if (this.onProgress) {
      this.onProgress({
        stage,
        message,
        pagesComplete: current,
        pagesTotal: total,
        currentPage,
      });
    }
  }

  // ===========================================================================
  // DEFAULTS
  // ===========================================================================

  private getDefaultSiteSettings(): SiteSettings {
    return {
      theme: "light",
      language: "en",
      timezone: "Africa/Lusaka",
    };
  }

  private getDefaultSEO(): SEOSettings {
    return {
      title: "Website",
      description: "Welcome to our website",
    };
  }

  private getDefaultDesignSystem(): AppliedDesignSystem {
    return {
      colors: {
        primary: "#3b82f6",
        secondary: "#6b7280",
        accent: "#f59e0b",
        background: "#ffffff",
        text: "#111827",
      },
      typography: {
        headingFont: "Inter",
        bodyFont: "Inter",
        scale: "1.25",
      },
      spacing: {
        scale: "balanced",
      },
      borders: {
        radius: "md",
      },
      shadows: {
        style: "soft",
      },
    };
  }

  private getEmptyContentSummary(): ContentSummary {
    return {
      totalPages: 0,
      totalComponents: 0,
      componentsUsed: [],
      dataSourcesUsed: [],
      contentGenerated: {
        headlines: 0,
        paragraphs: 0,
        buttons: 0,
        images: 0,
      },
    };
  }

  private getDefaultArchitecture(): SiteArchitecture {
    return {
      intent: "general",
      tone: "professional",
      pages: [],
      sharedElements: {
        navbar: {
          style: "sticky",
          variant: "modern",
          ctaButton: true,
        },
        footer: {
          style: "comprehensive",
          columns: 4,
          newsletter: true,
          socialLinks: true,
          copyright: true,
        },
      },
      designTokens: {
        primaryColor: "#3b82f6",
        fontHeading: "Inter",
        fontBody: "Inter",
        borderRadius: "md",
        shadowStyle: "soft",
        spacingScale: "balanced",
      },
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTION
// =============================================================================

/**
 * Generate a website from a prompt (convenience function)
 */
export async function generateWebsiteFromPrompt(
  input: WebsiteDesignerInput,
  onProgress?: (progress: GenerationProgress) => void
): Promise<WebsiteDesignerOutput> {
  const engine = new WebsiteDesignerEngine(input.siteId, onProgress);
  return engine.generateWebsite(input);
}
