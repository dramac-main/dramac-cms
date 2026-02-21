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
import { getDesignPersonality, formatPersonalityForAI, getSectionBackgrounds, type DesignPersonality } from "./design/variety-engine";
import { MultiPassRefinementEngine } from "./refinement/multi-pass-engine";
import { auditWebsite } from "./quality/design-auditor";
import { ModuleIntegrationOrchestrator } from "./modules/orchestrator";
import type { ModuleConfig } from "./modules/types";
import {
  SITE_ARCHITECT_PROMPT,
  PAGE_GENERATOR_PROMPT,
  NAVBAR_GENERATOR_PROMPT,
  FOOTER_GENERATOR_PROMPT,
  buildArchitecturePrompt,
  buildPagePrompt,
  parseUserPrompt,
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

import { DEFAULT_TIMEZONE } from '@/lib/locale-config'

// =============================================================================
// SHARED ELEMENTS CONTEXT — Passed from architecture step to shared elements
// Eliminates redundant DB calls (saves ~5s and avoids timeout risk)
// =============================================================================

export interface SharedElementsContext {
  name: string;
  domain: string;
  industry: string;
  description: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: Record<string, string | undefined>;
  social: Array<{ platform: string; url: string }>;
  hours: Array<{ day: string; openTime: string; closeTime: string; isClosed?: boolean }>;
  services: string[];
}
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
  enableModuleIntegration: false, // Disabled by default — adds ~10-15s AI call, exceeds 60s Vercel timeout
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
   * STEP 1: Build context + generate architecture
   * Returns architecture JSON that the client passes to step 2.
   * This runs in its own serverless function with its own 60s budget.
   */
  async stepArchitecture(input: WebsiteDesignerInput): Promise<{
    success: boolean;
    architecture: SiteArchitecture;
    formattedContext: string;
    siteContext: SharedElementsContext;
    designPersonality?: DesignPersonality;
    personalityContext?: string;
    error?: string;
  }> {
    this.userPrompt = input.prompt;

    // Extract business name from user's prompt (highest priority for naming)
    const parsed = parseUserPrompt(input.prompt);
    if (parsed.businessName) {
      this.extractedBusinessName = parsed.businessName;
      console.log(`[WebsiteDesignerEngine] 📛 Extracted business name from prompt: "${this.extractedBusinessName}"`);
    }

    try {
      // Build data context
      this.reportProgress("building-context", "Gathering business information...", 0, 1);
      this.context = await buildDataContext(this.siteId);
      this.availability = checkDataAvailability(this.context);
      const formattedContext = formatContextForAI(this.context);

      // Design inspiration
      let designInspiration: DesignRecommendation | null = null;
      let quickDesignTokens: ReturnType<DesignInspirationEngine["getQuickDesignTokens"]> | null = null;
      const industry = this.context?.client.industry?.toLowerCase() || "general";
      const designEngine = new DesignInspirationEngine(industry, "modern", input.prompt);

      // Find proven industry blueprint
      this.activeBlueprint = findBlueprint(industry, input.prompt);
      if (this.activeBlueprint) {
        console.log(`[WebsiteDesignerEngine] ✅ Found industry blueprint: ${this.activeBlueprint.name} (${this.activeBlueprint.id})`);
      } else {
        console.log(`[WebsiteDesignerEngine] ⚠️ No blueprint found for industry: ${industry} — using AI freeform generation`);
      }

      // Generate unique design personality for variety
      const designPersonality = getDesignPersonality(industry);
      const personalityContext = formatPersonalityForAI(designPersonality);
      console.log(`[WebsiteDesignerEngine] 🎭 Design personality: ${designPersonality.name} (hero: ${designPersonality.heroStyle}, cards: ${designPersonality.cardStyle})`);

      if (this.config.enableDesignInspiration) {
        this.reportProgress("building-context", "Analyzing award-winning design patterns...", 0, 1);
        try {
          designInspiration = await designEngine.getDesignRecommendations();
        } catch (error) {
          console.warn("[WebsiteDesignerEngine] Design inspiration failed, using quick tokens:", error);
          quickDesignTokens = designEngine.getQuickDesignTokens();
        }
      } else if (this.config.useQuickDesignTokens) {
        quickDesignTokens = designEngine.getQuickDesignTokens();
      }

      // Generate architecture via AI
      this.reportProgress("analyzing-prompt", "Analyzing your requirements...", 0, 1);
      this.architecture = await this.createArchitecture(
        input.prompt,
        formattedContext,
        input.preferences,
        designInspiration,
        quickDesignTokens,
        this.activeBlueprint,
        personalityContext
      );

      // Apply constraints
      if (input.constraints) {
        this.applyConstraints(input.constraints);
      }

      // Cap pages (no longer strictly needed with multi-step, but keeps output reasonable)
      const MAX_PAGES = 8;
      if (this.architecture.pages.length > MAX_PAGES) {
        console.log(`[WebsiteDesignerEngine] ⚡ Capping pages from ${this.architecture.pages.length} to ${MAX_PAGES}`);
        this.architecture.pages = this.architecture.pages.slice(0, MAX_PAGES);
      }

      return {
        success: true,
        architecture: this.architecture,
        formattedContext,
        designPersonality,
        personalityContext,
        siteContext: {
          name: this.getBusinessName(),
          domain: this.context?.site?.domain || "",
          industry: this.context?.client?.industry || "general",
          description: this.context?.client?.description || "",
          logoUrl: this.context?.branding?.logo_url || "",
          contactEmail: this.context?.contact?.email || "",
          contactPhone: this.context?.contact?.phone || "",
          contactAddress: (this.context?.contact?.address as Record<string, string | undefined>) || {},
          social: (this.context?.social || []).map(s => ({ platform: s.platform || "", url: s.url || "" })),
          hours: (this.context?.hours || []).map(h => ({ day: h.day || "", openTime: h.open_time || "", closeTime: h.close_time || "", isClosed: h.is_closed })),
          services: (this.context?.services || []).slice(0, 8).map(s => s.name || ""),
        },
      };
    } catch (error) {
      console.error("[WebsiteDesignerEngine] stepArchitecture error:", error);
      return {
        success: false,
        architecture: this.getDefaultArchitecture(),
        formattedContext: "",
        siteContext: { name: "", domain: "", industry: "general", description: "", logoUrl: "", contactEmail: "", contactPhone: "", contactAddress: {}, social: [], hours: [], services: [] },
        error: error instanceof Error ? error.message : "Failed to generate architecture",
      };
    }
  }

  /**
   * STEP 2A: Generate a SINGLE page from architecture
   * Each page gets its own 60s serverless function budget.
   * Called once per page from the client in a sequential loop.
   */
  async stepSinglePage(
    input: WebsiteDesignerInput,
    architecture: SiteArchitecture,
    pagePlan: PagePlan,
    formattedContext: string,
    industry?: string,
    personalityContext?: string,
    designPersonality?: DesignPersonality
  ): Promise<{
    success: boolean;
    page?: GeneratedPage;
    error?: string;
  }> {
    this.userPrompt = input.prompt;
    this.architecture = architecture;

    // Use industry from architecture step to avoid redundant DB call (saves 13 queries per page)
    const resolvedIndustry = industry?.toLowerCase() || "general";
    this.activeBlueprint = findBlueprint(resolvedIndustry, input.prompt);

    try {
      this.reportProgress("generating-pages", `Generating page: ${pagePlan.name}...`, 0, 1);
      const page = await this.generatePage(pagePlan, formattedContext, personalityContext, designPersonality);
      this.reportProgress("generating-pages", `Page "${pagePlan.name}" generated`, 1, 1);
      return { success: true, page };
    } catch (error) {
      console.error(`[WebsiteDesignerEngine] stepSinglePage error (${pagePlan.name}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to generate page: ${pagePlan.name}`,
      };
    }
  }

  /**
   * STEP 2B: Generate shared elements (navbar + footer)
   * Both use Haiku (fast tier) and run in parallel — completes in ~8-10s.
   * Called once after all pages are generated.
   *
   * ZERO DB CALLS — receives all needed context from architecture step via siteContext.
   * If AI calls fail, returns safe deterministic fallbacks (never throws).
   */
  async stepSharedElements(
    input: WebsiteDesignerInput,
    architecture: SiteArchitecture,
    pages: Array<{ name: string; slug: string; isHomepage?: boolean }>,
    siteContext?: SharedElementsContext
  ): Promise<{
    success: boolean;
    navbar?: GeneratedComponent;
    footer?: GeneratedComponent;
    error?: string;
  }> {
    this.userPrompt = input.prompt;
    this.architecture = architecture;

    // Build nav links from actual generated pages
    const navItems = pages
      .filter((p) => !p.isHomepage)
      .map((p) => ({ label: p.name, href: p.slug }));
    const allNavLinks = [{ label: "Home", href: "/" }, ...navItems];

    // Reconstruct minimal context from siteContext (ZERO DB CALLS)
    if (siteContext) {
      this.context = {
        site: { id: "", name: siteContext.name, domain: siteContext.domain },
        branding: { business_name: siteContext.name, logo_url: siteContext.logoUrl },
        client: {
          company: siteContext.name,
          company_name: siteContext.name,
          name: siteContext.name,
          industry: siteContext.industry,
          description: siteContext.description,
        },
        contact: {
          email: siteContext.contactEmail,
          phone: siteContext.contactPhone,
          address: siteContext.contactAddress,
        },
        social: siteContext.social.map(s => ({ id: "", site_id: "", platform: s.platform, url: s.url })),
        hours: siteContext.hours.map(h => ({ id: "", site_id: "", day: h.day, open_time: h.openTime, close_time: h.closeTime, is_closed: h.isClosed })),
        services: siteContext.services.map(name => ({ id: "", site_id: "", name })),
        locations: [],
        testimonials: [],
        team: [],
        portfolio: [],
        blog: [],
        faq: [],
        modules: [],
      } as unknown as BusinessDataContext;
    } else {
      // Legacy fallback — only used by generateWebsite() wrapper
      this.context = await buildDataContext(this.siteId);
    }

    try {
      this.reportProgress("generating-shared-elements", "Generating navbar & footer...", 0, 2);

      // Both are Haiku (fast tier) — run in parallel with a 45s safety timeout
      const AI_TIMEOUT = 45_000; // 45 seconds — leaves 15s buffer for cold start + auth
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI generation timed out after 45s")), AI_TIMEOUT)
      );

      let navbar: GeneratedComponent;
      let footer: GeneratedComponent;

      try {
        [navbar, footer] = await Promise.race([
          Promise.all([
            this.generateNavbar(pages.map(p => ({
              name: p.name, slug: p.slug, title: p.name, description: "",
              isHomepage: p.isHomepage || false, components: [], seo: {} as PageSEO, order: 0, id: "",
            })) as GeneratedPage[]),
            this.generateFooter(),
          ]),
          timeoutPromise,
        ]) as [GeneratedComponent, GeneratedComponent];
      } catch (aiError) {
        console.warn("[WebsiteDesignerEngine] AI shared elements failed, using deterministic fallback:", aiError);
        // Deterministic fallback — guaranteed to work, no AI needed
        navbar = this.buildFallbackNavbar(siteContext, allNavLinks);
        footer = this.buildFallbackFooter(siteContext, allNavLinks);
      }

      // Ensure navbar links match actual generated pages
      navbar.props = { ...navbar.props, links: allNavLinks, navItems: allNavLinks };

      this.reportProgress("generating-shared-elements", "Navigation generated", 2, 2);

      return { success: true, navbar, footer };
    } catch (error) {
      console.error("[WebsiteDesignerEngine] stepSharedElements error:", error);
      // Even on unexpected error, return fallbacks instead of failing
      const navbar = this.buildFallbackNavbar(siteContext, allNavLinks);
      const footer = this.buildFallbackFooter(siteContext, allNavLinks);
      return { success: true, navbar, footer };
    }
  }

  /**
   * Build a deterministic navbar without AI — used as fallback when AI times out
   */
  private buildFallbackNavbar(
    ctx?: SharedElementsContext,
    navLinks?: Array<{ label: string; href: string }>
  ): GeneratedComponent {
    const businessName = ctx?.name || this.getBusinessName();
    return {
      id: "shared-navbar",
      type: "Navbar",
      props: {
        logoText: businessName,
        logoSrc: ctx?.logoUrl || "",
        links: navLinks || [],
        navItems: navLinks || [],
        ctaText: "Contact Us",
        ctaLink: "/contact",
        sticky: true,
        variant: "modern",
        style: this.architecture?.sharedElements?.navbar?.style || "sticky",
      },
    };
  }

  /**
   * Build a deterministic footer without AI — used as fallback when AI times out
   */
  private buildFallbackFooter(
    ctx?: SharedElementsContext,
    navLinks?: Array<{ label: string; href: string }>
  ): GeneratedComponent {
    const businessName = ctx?.name || this.getBusinessName();
    const year = new Date().getFullYear();
    const industry = ctx?.industry || "professional";
    const description = ctx?.description || `${industry.charAt(0).toUpperCase() + industry.slice(1)} services by ${businessName}`;

    // Build footer columns from available data
    const columns: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [];
    
    // Column 1: Pages
    if (navLinks && navLinks.length > 0) {
      columns.push({ title: "Pages", links: navLinks });
    }

    // Column 2: Services (if available)
    if (ctx?.services && ctx.services.length > 0) {
      columns.push({
        title: "Services",
        links: ctx.services.map(s => ({ label: s, href: "#" })),
      });
    }

    // Column 3: Contact
    const contactLinks: Array<{ label: string; href: string }> = [];
    if (ctx?.contactEmail) contactLinks.push({ label: ctx.contactEmail, href: `mailto:${ctx.contactEmail}` });
    if (ctx?.contactPhone) contactLinks.push({ label: ctx.contactPhone, href: `tel:${ctx.contactPhone}` });
    if (contactLinks.length > 0) {
      columns.push({ title: "Contact", links: contactLinks });
    }

    return {
      id: "shared-footer",
      type: "Footer",
      props: {
        companyName: businessName,
        logoText: businessName,
        description,
        columns,
        email: ctx?.contactEmail || "",
        contactEmail: ctx?.contactEmail || "",
        phone: ctx?.contactPhone || "",
        contactPhone: ctx?.contactPhone || "",
        copyrightText: `© ${year} ${businessName}. All rights reserved.`,
        socialLinks: (ctx?.social || []).map(s => ({ platform: s.platform, url: s.url })),
        style: this.architecture?.sharedElements?.footer?.style || "comprehensive",
      },
    };
  }

  /**
   * STEP 3: Finalize — local processing only, NO AI calls, NO DB calls
   * Takes architecture + pages + navbar + footer from steps 1 & 2.
   * Applies shared elements, runs quality audit, builds final output.
   * This is purely CPU work — completes in < 1 second.
   */
  async stepFinalize(
    input: WebsiteDesignerInput,
    architecture: SiteArchitecture,
    pages: GeneratedPage[],
    startTime: number,
    navbar?: GeneratedComponent,
    footer?: GeneratedComponent,
    siteContext?: { name: string; domain: string; industry: string; description: string }
  ): Promise<WebsiteDesignerOutput> {
    this.userPrompt = input.prompt;
    this.architecture = architecture;

    // Use provided context instead of DB call (no network needed)
    if (siteContext) {
      this.context = {
        site: { id: "", name: siteContext.name, domain: siteContext.domain },
        client: { name: siteContext.name, company: siteContext.name, industry: siteContext.industry, description: siteContext.description },
        branding: { business_name: siteContext.name },
        contact: {},
        social: [],
        hours: [],
        locations: [],
        team: [],
        services: [],
        testimonials: [],
        portfolio: [],
        faq: [],
        blog: [],
        modules: [],
      };
    }

    try {
      // Apply shared elements (navbar/footer from step 2)
      const defaultNavbar: GeneratedComponent = navbar || { id: "shared-navbar", type: "Navbar", props: { logoText: siteContext?.name || "Site", links: [] } };
      const defaultFooter: GeneratedComponent = footer || { id: "shared-footer", type: "Footer", props: { companyName: siteContext?.name || "Site" } };
      let pagesWithNav = this.applySharedElements(pages, defaultNavbar, defaultFooter);

      // Refinement (if enabled)
      if (this.config.enableRefinement) {
        this.reportProgress("finalizing", "Refining website quality...", 0, 1);
        const refinementEngine = new MultiPassRefinementEngine(
          pagesWithNav,
          this.architecture,
          `${this.getBusinessName()} - ${this.context?.client.industry || "business"}: ${this.userPrompt}`,
          (progress) => {
            this.reportProgress("finalizing", `Pass ${progress.pass}: ${progress.passName}...`, progress.pass - 1, 4);
          }
        );
        const refinementResult = await refinementEngine.refine();
        pagesWithNav = refinementResult.pages;
        console.log(`[WebsiteDesignerEngine] Refinement complete: ${refinementResult.totalImprovements} improvements, score: ${refinementResult.overallScore}/10`);
      }

      // Navigation structure
      const navigation = this.generateNavigation(pagesWithNav);

      // Quality audit
      this.reportProgress("finalizing", "Running quality audit...", 0, 1);
      const designTokens = this.architecture.designTokens || {};
      for (const page of pagesWithNav) {
        const auditResult = auditWebsite(page.components, designTokens);
        if (auditResult.autoFixed > 0) {
          const autoFixedIssues = auditResult.issues.filter(issue => issue.autoFixed);
          for (const fix of autoFixedIssues) {
            const comp = page.components.find(c => c.id === fix.componentId);
            if (comp && fix.field && fix.fixedValue !== undefined) {
              (comp.props as Record<string, unknown>)[fix.field] = fix.fixedValue;
            }
          }
          console.log(`[WebsiteDesignerEngine] 🔧 Quality audit fixed ${auditResult.autoFixed} issues on "${page.name}" (score: ${auditResult.score}/100)`);
        }
      }

      // Finalize
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
          domain: this.context?.site?.domain || "",
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
      console.error("[WebsiteDesignerEngine] stepFinalize error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to finalize website",
        site: { name: "", settings: this.getDefaultSiteSettings(), seo: this.getDefaultSEO() },
        pages: [],
        navigation: { main: [], footer: [] },
        designSystem: this.getDefaultDesignSystem(),
        contentSummary: this.getEmptyContentSummary(),
        estimatedBuildTime: Date.now() - startTime,
        architecture: this.getDefaultArchitecture(),
      };
    }
  }

  /**
   * Generate a complete website from a user prompt (LEGACY — single-request mode)
   * 
   * WARNING: This must complete within a single 60s serverless function.
   * For production use, prefer the multi-step approach (stepArchitecture → stepSinglePage × N → stepSharedElements → stepFinalize).
   */
  async generateWebsite(input: WebsiteDesignerInput): Promise<WebsiteDesignerOutput> {
    const startTime = Date.now();
    this.userPrompt = input.prompt;

    try {
      // Step 1: Architecture
      const archResult = await this.stepArchitecture(input);
      if (!archResult.success) {
        throw new Error(archResult.error || "Architecture generation failed");
      }
      this.architecture = archResult.architecture;

      // Step 2: Pages (sequential, one at a time)
      const pages: GeneratedPage[] = [];
      for (const pagePlan of archResult.architecture.pages) {
        const pageResult = await this.stepSinglePage(input, archResult.architecture, pagePlan, archResult.formattedContext, archResult.siteContext?.industry, archResult.personalityContext, archResult.designPersonality);
        if (!pageResult.success || !pageResult.page) {
          throw new Error(pageResult.error || `Failed to generate page: ${pagePlan.name}`);
        }
        pages.push(pageResult.page);
      }

      // Step 2B: Shared elements (navbar + footer)
      const sharedResult = await this.stepSharedElements(
        input,
        archResult.architecture,
        pages.map(p => ({ name: p.name, slug: p.slug, isHomepage: p.isHomepage })),
        archResult.siteContext
      );

      // Step 3: Finalize
      return await this.stepFinalize(
        input,
        archResult.architecture,
        pages,
        startTime,
        sharedResult.navbar,
        sharedResult.footer
      );
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
    blueprint?: IndustryBlueprint | null,
    personalityContext?: string
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
      context + inspirationContext + blueprintContext + (personalityContext ? "\n\n" + personalityContext : ""),
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
   * Enhanced with page-type classification for intelligent inner page generation
   */
  private async generatePage(pagePlan: PagePlan, context: string, personalityContext?: string, designPersonality?: DesignPersonality): Promise<GeneratedPage> {
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

    // Generate section backgrounds from personality (visual rhythm)
    let sectionBackgrounds: string[] | undefined;
    if (designPersonality) {
      sectionBackgrounds = getSectionBackgrounds(designPersonality, pagePlan.sections.length);
      console.log(`[WebsiteDesignerEngine] 🎨 Section backgrounds for ${pagePlan.name}: ${designPersonality.backgroundPattern}`);
    }

    // Build all-pages list for cross-page context (so AI can link to real pages)
    const allPages = (this.architecture?.pages || []).map(p => ({ name: p.name, slug: p.slug }));

    const fullPrompt = buildPagePrompt(
      { ...pagePlan, slug: pagePlan.slug },
      context,
      (this.architecture?.designTokens || {}) as Record<string, unknown>,
      componentDetails,
      this.userPrompt, // Pass user's original prompt for reference
      blueprintPageContext, // Pass proven blueprint guidance for this specific page
      allPages, // Pass full site structure for cross-page linking
      personalityContext, // Pass design personality for unique styling
      sectionBackgrounds, // Pass pre-computed section backgrounds
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
   * IMPORTANT: Filters out duplicate navbars, footers, and trailing CTA sections
   * to prevent the common AI pattern of generating these inside page content.
   */
  private applySharedElements(
    pages: GeneratedPage[],
    navbar: GeneratedComponent,
    footer: GeneratedComponent
  ): GeneratedPage[] {
    return pages.map((page) => {
      // Filter out any navbar/footer components that were accidentally generated in page content
      const filteredComponents = page.components.filter(
        (c) => !["Navbar", "NavbarBlock", "Navigation", "Footer", "FooterBlock"].includes(c.type)
      );

      // Deduplicate: if the LAST component is a CTA that looks like a page-ending CTA
      // and there's already a CTA earlier in the page, remove the trailing one
      // (AI often generates two — one mid-page and one at the end that duplicates with footer)
      const ctaIndices = filteredComponents
        .map((c, i) => c.type === "CTA" ? i : -1)
        .filter(i => i >= 0);
      
      let finalComponents = filteredComponents;
      if (ctaIndices.length >= 2) {
        const lastIdx = ctaIndices[ctaIndices.length - 1];
        // Only remove if the trailing CTA is truly the last component
        if (lastIdx === filteredComponents.length - 1) {
          finalComponents = filteredComponents.slice(0, lastIdx);
        }
      }

      return {
        ...page,
        // Always use the shared navbar at start and shared footer at end
        components: [navbar, ...finalComponents, footer],
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
      timezone: (this.context?.site?.settings as Record<string, unknown>)?.timezone as string || DEFAULT_TIMEZONE,
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
   * 
   * Priority chain (most specific → least specific):
   * 1. User prompt extracted name (set by stepArchitecture → parseUserPrompt)
   * 2. Site name (sites.name — the ACTUAL site/brand name)
   * 3. Branding business name (site.settings.business_name — explicit override)
   * 4. Client company (clients.company — fallback, may be the agency's client name)
   * 5. Client company_name (alias)
   * 6. Fallback
   * 
   * NOTE: client.name is intentionally EXCLUDED — it's usually the contact person's
   * personal name (e.g., "John Doe"), not the business name.
   */
  private getBusinessName(): string {
    // If user explicitly named the business in their prompt, that wins
    if (this.extractedBusinessName) {
      return this.extractedBusinessName;
    }
    return (
      this.context?.site?.name ||
      this.context?.branding?.business_name ||
      this.context?.client?.company ||
      this.context?.client?.company_name ||
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
      timezone: DEFAULT_TIMEZONE,
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
