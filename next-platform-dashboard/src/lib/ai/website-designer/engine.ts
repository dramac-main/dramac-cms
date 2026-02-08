/**
 * PHASE AWD-03: AI Website Designer Core Engine
 * Main WebsiteDesignerEngine Class
 *
 * This is the brain of the AI Website Designer - it orchestrates
 * all systems to generate complete, multi-page websites from a single prompt.
 *
 * ENHANCED with:
 * - OpenAI GPT-4o for cost-effective generation (configurable)
 * - Design Reference System (curated industry patterns)
 * - Multi-Pass Refinement Engine (quality improvement)
 * - Module Integration Orchestrator (Booking/E-commerce integration)
 */

import { generateObject } from "ai";
import { getAIModel, getModelInfo } from "./config/ai-provider";
import { findBlueprint, formatBlueprintForAI, formatBlueprintPageForAI, type IndustryBlueprint } from "./config/industry-blueprints";
import { buildDataContext } from "./data-context/builder";
import { formatContextForAI } from "./data-context/formatter";
import { checkDataAvailability } from "./data-context/checker";
import { componentRegistry } from "@/lib/studio/registry";
import { DesignInspirationEngine, type DesignRecommendation } from "./design/inspiration-engine";
import { MultiPassRefinementEngine } from "./refinement/multi-pass-engine";
import { ModuleIntegrationOrchestrator } from "./modules/orchestrator";
import type { ModuleConfig } from "./modules/types";
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
// ENGINE CONFIGURATION
// =============================================================================

export interface EngineConfig {
  /** Enable design inspiration engine for Dribbble/Awwwards-level designs (adds ~30s) */
  enableDesignInspiration: boolean;
  /** Use quick design tokens instead of full AI analysis (fast, no AI call) */
  useQuickDesignTokens: boolean;
  /** Enable multi-pass refinement for higher quality output (adds 2-4 minutes!) */
  enableRefinement: boolean;
  /** Number of refinement passes (1-4). More passes = better quality but slower */
  refinementPasses: 1 | 2 | 3 | 4;
  /** Enable module integration (booking, e-commerce, etc.) (adds ~30s) */
  enableModuleIntegration: boolean;
}

/**
 * DEFAULT CONFIG - Optimized for Vercel's 300s timeout
 * 
 * Heavy features are DISABLED by default to prevent timeouts.
 * For higher quality, enable features in the API call:
 * - enableDesignInspiration: true (for award-winning patterns)
 * - enableRefinement: true (for multi-pass quality improvement)
 * - enableModuleIntegration: true (for booking/e-commerce)
 */
const DEFAULT_CONFIG: EngineConfig = {
  enableDesignInspiration: false, // Disabled - adds AI call
  useQuickDesignTokens: true,     // Fast industry-based tokens (no AI)
  enableRefinement: false,        // Disabled - adds 4 AI calls!
  refinementPasses: 2,            // If enabled, use 2 passes max
  enableModuleIntegration: true,  // Enabled - adds ~10-15s (2 AI calls), detects booking/ecommerce/CRM
};

// =============================================================================
// ENGINE CLASS
// =============================================================================

export class WebsiteDesignerEngine {
  private siteId: string;
  private context: BusinessDataContext | null = null;
  private availability: DataAvailability | null = null;
  private architecture: SiteArchitecture | null = null;
  private userPrompt: string = ""; // Store user's original prompt
  private onProgress?: (progress: GenerationProgress) => void;
  private config: EngineConfig;
  private activeBlueprint: IndustryBlueprint | null = null; // Proven industry blueprint
  
  // Enhancement Engines
  private moduleOrchestrator: ModuleIntegrationOrchestrator | null = null;

  constructor(
    siteId: string, 
    onProgress?: (progress: GenerationProgress) => void,
    config: Partial<EngineConfig> = {}
  ) {
    this.siteId = siteId;
    this.onProgress = onProgress;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a complete website from a user prompt
   */
  async generateWebsite(input: WebsiteDesignerInput): Promise<WebsiteDesignerOutput> {
    const startTime = Date.now();
    this.userPrompt = input.prompt; // Store for use in page generation

    try {
      // Step 1: Build data context
      this.reportProgress("building-context", "Gathering business information...", 0, 1);
      this.context = await buildDataContext(this.siteId);
      this.availability = checkDataAvailability(this.context);
      const formattedContext = formatContextForAI(this.context);

      // Step 1.5: Get design inspiration
      let designInspiration: DesignRecommendation | null = null;
      let quickDesignTokens: ReturnType<DesignInspirationEngine["getQuickDesignTokens"]> | null = null;
      
      const industry = this.context?.client.industry?.toLowerCase() || "general";
      const designEngine = new DesignInspirationEngine(industry, "modern", input.prompt);

      // Step 1.6: Find proven industry blueprint (NEW — CRITICAL for quality)
      this.activeBlueprint = findBlueprint(industry, input.prompt);
      if (this.activeBlueprint) {
        console.log(`[WebsiteDesignerEngine] ✅ Found industry blueprint: ${this.activeBlueprint.name} (${this.activeBlueprint.id})`);
      } else {
        console.log(`[WebsiteDesignerEngine] ⚠️ No blueprint found for industry: ${industry} — using AI freeform generation`);
      }
      
      if (this.config.enableDesignInspiration) {
        // Full AI-powered design analysis (slower but better)
        this.reportProgress("building-context", "Analyzing award-winning design patterns...", 0, 1);
        try {
          designInspiration = await designEngine.getDesignRecommendations();
        } catch (error) {
          console.warn("[WebsiteDesignerEngine] Design inspiration failed, using quick tokens:", error);
          quickDesignTokens = designEngine.getQuickDesignTokens();
        }
      } else if (this.config.useQuickDesignTokens) {
        // Quick design tokens (instant, no AI call)
        quickDesignTokens = designEngine.getQuickDesignTokens();
      }

      // Step 2: Analyze prompt and create architecture
      this.reportProgress("analyzing-prompt", "Analyzing your requirements...", 0, 1);
      this.architecture = await this.createArchitecture(
        input.prompt,
        formattedContext,
        input.preferences,
        designInspiration,
        quickDesignTokens,
        this.activeBlueprint
      );

      // Step 2.5: Initialize module integration (only if enabled)
      if (this.config.enableModuleIntegration && this.context) {
        this.reportProgress("analyzing-prompt", "Analyzing module requirements...", 0, 1);
        // Convert our context to module context format (simplified for module analysis)
        const moduleContext = {
          client: {
            industry: this.context.client?.industry,
            businessName: this.context.client?.company || this.context.branding?.business_name,
          },
          site: {
            domain: this.context.site?.domain,
            name: this.context.site?.name,
          },
          services: this.context.services?.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: typeof s.price === 'string' ? parseFloat(s.price) || undefined : s.price,
            category: s.category,
          })),
          products: [], // Will be populated from e-commerce data if available
          team: this.context.team?.map(t => ({
            id: t.id,
            name: t.name,
            role: t.role,
          })),
          testimonials: this.context.testimonials?.map(t => ({
            id: t.id,
            author: t.name || t.author_name || "Anonymous",
            content: t.content || "",
          })),
          social: this.context.social?.map(s => ({
            platform: s.platform,
            url: s.url,
          })),
          hours: this.context.hours?.map(h => ({
            day: h.day,
            open: h.open_time || "09:00",
            close: h.close_time || "17:00",
            closed: h.is_closed || false,
          })),
        };
        
        this.moduleOrchestrator = new ModuleIntegrationOrchestrator(moduleContext);
        const { configs: moduleConfigs } = await this.moduleOrchestrator.analyzeAndConfigure(
          input.prompt,
          this.architecture.intent
        );
        
        // Store module config in architecture for later use
        if (moduleConfigs.length > 0) {
          (this.architecture as SiteArchitecture & { moduleConfig?: ModuleConfig[] }).moduleConfig = moduleConfigs;
        }
      }

      // Apply constraints if provided
      if (input.constraints) {
        this.applyConstraints(input.constraints);
      }

      // Step 3: Generate each page
      const totalPages = this.architecture.pages.length;
      let pages: GeneratedPage[] = [];

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

      // Step 3.5: Integrate modules into pages (NEW)
      if (this.config.enableModuleIntegration && this.moduleOrchestrator) {
        this.reportProgress("generating-pages", "Integrating booking & e-commerce modules...", totalPages, totalPages);
        const moduleConfigs = (this.architecture as SiteArchitecture & { moduleConfig?: ModuleConfig[] }).moduleConfig;
        if (moduleConfigs && Array.isArray(moduleConfigs)) {
          pages = this.moduleOrchestrator.integrateModules(pages, moduleConfigs);
        }
      }

      // Step 4: Generate shared elements (navbar, footer)
      this.reportProgress("generating-shared-elements", "Creating navigation...", 0, 1);
      const navbar = await this.generateNavbar(pages);
      const footer = await this.generateFooter();

      // Step 5: Apply navbar and footer to all pages
      let pagesWithNav = this.applySharedElements(pages, navbar, footer);

      // Step 5.5: Run multi-pass refinement (NEW)
      if (this.config.enableRefinement) {
        this.reportProgress("finalizing", "Refining website quality...", 0, 1);
        
        const refinementEngine = new MultiPassRefinementEngine(
          pagesWithNav,
          this.architecture,
          `${this.getBusinessName()} - ${this.context?.client.industry || "business"}: ${this.userPrompt}`,
          (progress) => {
            this.reportProgress(
              "finalizing",
              `Pass ${progress.pass}: ${progress.passName}...`,
              progress.pass - 1,
              4
            );
          }
        );

        const refinementResult = await refinementEngine.refine();
        pagesWithNav = refinementResult.pages;
        
        console.log(`[WebsiteDesignerEngine] Refinement complete: ${refinementResult.totalImprovements} improvements, score: ${refinementResult.overallScore}/10`);
      }

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
   * Enhanced with design inspiration patterns or quick tokens
   */
  private async createArchitecture(
    prompt: string,
    context: string,
    preferences?: WebsiteDesignerInput["preferences"],
    designInspiration?: DesignRecommendation | null,
    quickDesignTokens?: ReturnType<DesignInspirationEngine["getQuickDesignTokens"]> | null,
    blueprint?: IndustryBlueprint | null
  ): Promise<SiteArchitecture> {
    const componentSummary = this.summarizeComponents();

    // BLUEPRINT CONTEXT — Proven industry architecture (HIGHEST PRIORITY)
    let blueprintContext = "";
    if (blueprint) {
      blueprintContext = formatBlueprintForAI(blueprint);
      console.log(`[WebsiteDesignerEngine] 📋 Injecting ${blueprint.name} blueprint into architecture prompt`);
    }

    // Enhance prompt with design inspiration if available
    let inspirationContext = "";
    if (designInspiration) {
      // Full AI-powered design inspiration
      inspirationContext = `
## DESIGN INSPIRATION (Award-winning patterns to incorporate):

### Hero Pattern
Name: ${designInspiration.heroPattern.name}
Description: ${designInspiration.heroPattern.description}
Animation: ${designInspiration.heroPattern.animationSuggestion}

### Color Scheme
Style: ${designInspiration.colorScheme.name}
Primary: ${designInspiration.colorScheme.primary}
Secondary: ${designInspiration.colorScheme.secondary}
Accent: ${designInspiration.colorScheme.accent}
Background: ${designInspiration.colorScheme.background}

### Typography
Heading: ${designInspiration.typography.heading}
Body: ${designInspiration.typography.body}
Style: ${designInspiration.typography.style}

### Layout Recommendations
${designInspiration.layoutRecommendations.map((l) => `- ${l.section}: ${l.layout} (${l.animation})`).join("\n")}

### Micro-Interactions to Include
${designInspiration.microInteractions.map((m) => `- ${m}`).join("\n")}

### Design Principles
${designInspiration.designPrinciples.map((p) => `- ${p}`).join("\n")}
`;
    } else if (quickDesignTokens) {
      // Quick design tokens (pre-curated, no AI call)
      inspirationContext = `
## DESIGN TOKENS (Industry-optimized design system):

### Color Scheme: ${quickDesignTokens.colors.name}
Primary: ${quickDesignTokens.colors.primary}
Secondary: ${quickDesignTokens.colors.secondary}
Accent: ${quickDesignTokens.colors.accent}
Background: ${quickDesignTokens.colors.background}
Text: ${quickDesignTokens.colors.text}

### Typography: ${quickDesignTokens.typography.name}
Heading Font: ${quickDesignTokens.typography.heading}
Body Font: ${quickDesignTokens.typography.body}
Style: ${quickDesignTokens.typography.style}

### Hero Pattern: ${quickDesignTokens.heroPattern.name}
${quickDesignTokens.heroPattern.description}
Animation: ${quickDesignTokens.heroPattern.animation}
`;
    }

    const fullPrompt = buildArchitecturePrompt(
      prompt,
      context + inspirationContext + blueprintContext,
      preferences as Record<string, unknown> | undefined,
      componentSummary
    );

    const { object } = await generateObject({
      model: getAIModel("architecture"),
      schema: SiteArchitectureSchema,
      system: SITE_ARCHITECT_PROMPT,
      prompt: fullPrompt,
    });

    // Apply design tokens to architecture
    const architecture = object as SiteArchitecture;
    
    // Priority: Blueprint > Design Inspiration > Quick Tokens
    // Blueprint provides proven, tested color/typography combinations
    if (blueprint) {
      const palette = blueprint.design.palettes[0]; // Primary proven palette
      const typo = blueprint.design.typography[0]; // Primary proven typography
      architecture.designTokens = {
        ...architecture.designTokens,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        accentColor: palette.accent,
        backgroundColor: palette.background,
        textColor: palette.text,
        fontHeading: typo.heading,
        fontBody: typo.body,
      };
      console.log(`[WebsiteDesignerEngine] 🎨 Applied blueprint palette: ${palette.name} (${palette.mood})`);
    } else if (designInspiration) {
      // Apply full AI-powered design inspiration
      architecture.designTokens = {
        ...architecture.designTokens,
        primaryColor: designInspiration.colorScheme.primary,
        secondaryColor: designInspiration.colorScheme.secondary,
        accentColor: designInspiration.colorScheme.accent,
        backgroundColor: designInspiration.colorScheme.background,
        textColor: designInspiration.colorScheme.text,
        fontHeading: designInspiration.typography.heading,
        fontBody: designInspiration.typography.body,
      };
    } else if (quickDesignTokens) {
      // Apply quick design tokens
      architecture.designTokens = {
        ...architecture.designTokens,
        primaryColor: quickDesignTokens.colors.primary,
        secondaryColor: quickDesignTokens.colors.secondary,
        accentColor: quickDesignTokens.colors.accent,
        backgroundColor: quickDesignTokens.colors.background,
        textColor: quickDesignTokens.colors.text,
        fontHeading: quickDesignTokens.typography.heading,
        fontBody: quickDesignTokens.typography.body,
      };
    }

    return architecture;
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
   * Enhanced with blueprint page-specific guidance for proven section order + content formulas
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

    // Inject blueprint page guidance if available (PROVEN section-by-section specifications)
    let blueprintPageContext = "";
    if (this.activeBlueprint) {
      blueprintPageContext = formatBlueprintPageForAI(this.activeBlueprint, pagePlan.name);
      if (blueprintPageContext) {
        console.log(`[WebsiteDesignerEngine] 📄 Injecting blueprint guidance for page: ${pagePlan.name}`);
      }
    }

    const fullPrompt = buildPagePrompt(
      pagePlan,
      context,
      (this.architecture?.designTokens || {}) as Record<string, unknown>,
      componentDetails,
      this.userPrompt, // Pass user's original prompt for reference
      blueprintPageContext // Pass proven blueprint guidance for this specific page
    );

    const { object } = await generateObject({
      model: getAIModel("page-content"),
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
      model: getAIModel("navbar"),
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

    const allNavLinks = [{ label: "Home", href: "/" }, ...navItems];
    return {
      id: "shared-navbar",
      type: "Navbar",
      props: {
        ...object,
        links: allNavLinks,
        navItems: allNavLinks, // backward compat
      },
    };
  }

  /**
   * Generate footer component
   */
  private async generateFooter(): Promise<GeneratedComponent> {
    // Build context about what pages exist
    const pageLinks = this.architecture?.pages.map(p => ({
      label: p.name,
      href: p.slug,
    })) || [];

    // Get services for footer columns
    const services = this.context?.services?.slice(0, 6).map(s => s.name) || [];

    const { object } = await generateObject({
      model: getAIModel("footer"),
      schema: FooterComponentSchema,
      system: FOOTER_GENERATOR_PROMPT,
      prompt: `Generate a premium footer configuration.

Business: ${this.getBusinessName()}
Industry: ${this.context?.client.industry || "general"}
Business Description: ${this.context?.client.description || `A ${this.context?.client.industry || "professional"} business`}
Services Offered: ${services.length > 0 ? services.join(", ") : "Not specified"}
Pages on This Website: ${JSON.stringify(pageLinks)}
Logo: ${this.context?.branding.logo_url || ""}
Contact Email: ${this.context?.contact.email || ""}
Contact Phone: ${this.context?.contact.phone || ""}
Address: ${JSON.stringify(this.context?.contact.address || {})}
Social Links: ${JSON.stringify(this.context?.social || [])}
Business Hours: ${JSON.stringify(this.context?.hours || [])}
Style: ${this.architecture?.sharedElements.footer.style || "comprehensive"}
Columns: ${this.architecture?.sharedElements.footer.columns || 3}
Show Newsletter: ${this.architecture?.sharedElements.footer.newsletter}
Design Tokens: ${JSON.stringify(this.architecture?.designTokens || {})}

CRITICAL: Footer columns must contain links relevant to "${this.context?.client.industry || "this"}" business.
Use the ACTUAL services and pages listed above, NOT generic corporate services.
The tagline must describe this specific business, not a generic company.

Configure ALL footer props for a complete, professional result.`,
    });

    // Validate that description actually references this business
    const businessName = this.getBusinessName();
    const industry = this.context?.client.industry || "";
    let description = object.description || object.tagline || "";
    
    // Detect generic/placeholder descriptions that don't mention the business
    const genericPatterns = [
      /innovative\s+technology\s+solutions/i,
      /building\s+the\s+future/i,
      /professional\s+business\s+solutions/i,
      /your\s+trusted\s+partner/i,
      /premium\s+consulting/i,
      /strategic\s+planning/i,
      /cutting[\s-]edge\s+solutions/i,
      /empowering\s+businesses/i,
      /transforming\s+the\s+way/i,
      /leading\s+provider\s+of/i,
    ];
    
    const isGeneric = genericPatterns.some(p => p.test(description)) ||
      (!description.toLowerCase().includes(businessName.toLowerCase().split(" ")[0]) && 
       !description.toLowerCase().includes(industry.toLowerCase()));
    
    if (isGeneric && businessName !== "Your Business") {
      // Build a contextual description from actual business data
      const desc = this.context?.client.description || "";
      if (desc && desc.length > 10 && desc.length < 200) {
        description = desc;
      } else {
        description = industry
          ? `${industry.charAt(0).toUpperCase() + industry.slice(1)} services by ${businessName}`
          : `Welcome to ${businessName}`;
      }
    }

    // Fix contact info — use real data, never leave placeholders
    const contactEmail = object.email || this.context?.contact?.email || "";
    const contactPhone = object.phone || this.context?.contact?.phone || "";
    const contactAddress = (() => {
      if (object.address && !object.address.includes("123 Main")) return object.address;
      const addr = this.context?.contact?.address;
      if (addr && typeof addr === "object") {
        return [addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(", ");
      }
      return typeof addr === "string" ? addr : "";
    })();

    return {
      id: "shared-footer",
      type: "Footer",
      props: {
        ...object,
        companyName: businessName,
        description,
        logoText: object.logoText || businessName,
        email: contactEmail,
        contactEmail,
        phone: contactPhone,
        contactPhone,
        address: contactAddress,
        contactAddress,
        copyrightText: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
      },
    };
  }

  /**
   * Apply navbar and footer to all pages
   * IMPORTANT: Only add if page doesn't already have these components to avoid duplicates
   */
  private applySharedElements(
    pages: GeneratedPage[],
    navbar: GeneratedComponent,
    footer: GeneratedComponent
  ): GeneratedPage[] {
    return pages.map((page) => {
      // Check if page already has navbar/footer to avoid duplicates
      const hasNavbar = page.components.some(
        (c) => c.type === "Navbar" || c.type === "NavbarBlock" || c.type === "Navigation"
      );
      const hasFooter = page.components.some(
        (c) => c.type === "Footer" || c.type === "FooterBlock"
      );

      // Filter out any navbar/footer components that were accidentally generated in page content
      const filteredComponents = page.components.filter(
        (c) => !["Navbar", "NavbarBlock", "Navigation", "Footer", "FooterBlock"].includes(c.type)
      );

      return {
        ...page,
        // Always use the shared navbar at start and shared footer at end
        components: [navbar, ...filteredComponents, footer],
      };
    });
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
      timezone: (this.context?.site?.settings as Record<string, unknown>)?.timezone as string || "UTC",
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
      timezone: "UTC",
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
 * 
 * @param input - The website generation input
 * @param onProgress - Optional progress callback
 * @param config - Optional engine configuration for design inspiration, refinement, and modules
 */
export async function generateWebsiteFromPrompt(
  input: WebsiteDesignerInput,
  onProgress?: (progress: GenerationProgress) => void,
  config?: Partial<EngineConfig>
): Promise<WebsiteDesignerOutput> {
  const engine = new WebsiteDesignerEngine(input.siteId, onProgress, config);
  return engine.generateWebsite(input);
}
