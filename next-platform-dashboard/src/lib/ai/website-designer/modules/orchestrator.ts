/**
 * PHASE AWD-09: Module Integration Intelligence
 * Module Integration Orchestrator
 *
 * Main orchestration class that coordinates module analysis,
 * configuration, and integration into website generation.
 */

import { analyzeModuleRequirements, getRequiredModules } from "./analyzer";
import { ModuleConfigurator } from "./configurator";
import { ComponentInjector } from "./component-injector";
import type {
  ModuleConfig,
  ModuleRequirement,
  ModuleType,
  BusinessDataContext,
} from "./types";
import type { GeneratedPage } from "../types";

// =============================================================================
// ORCHESTRATOR CLASS
// =============================================================================

export class ModuleIntegrationOrchestrator {
  private businessContext: BusinessDataContext;

  constructor(businessContext: BusinessDataContext) {
    this.businessContext = businessContext;
  }

  /**
   * Analyze requirements and configure modules
   */
  async analyzeAndConfigure(
    userPrompt: string,
    industry: string
  ): Promise<{
    requirements: ModuleRequirement[];
    configs: ModuleConfig[];
  }> {
    // Step 1: Analyze requirements
    const requirements = await analyzeModuleRequirements(
      userPrompt,
      industry,
      this.businessContext
    );

    // Step 2: Configure each required/high-priority module
    const configurator = new ModuleConfigurator(this.businessContext);
    const configs: ModuleConfig[] = [];

    const requiredModules = getRequiredModules(requirements);

    for (const requirement of requiredModules) {
      try {
        const config = await configurator.configureModule(requirement);
        configs.push(config);
      } catch (error) {
        console.error(
          `[ModuleIntegrationOrchestrator] Error configuring ${requirement.module}:`,
          error
        );
      }
    }

    return { requirements, configs };
  }

  /**
   * Integrate modules into generated pages
   */
  integrateModules(
    pages: GeneratedPage[],
    moduleConfigs: ModuleConfig[]
  ): GeneratedPage[] {
    const injector = new ComponentInjector(moduleConfigs);
    return injector.injectModuleComponents(pages);
  }

  /**
   * Get a summary of enabled modules
   */
  getModuleSummary(configs: ModuleConfig[]): string {
    const enabledModules = configs.filter((c) => c.enabled);

    if (enabledModules.length === 0) {
      return "No modules enabled.";
    }

    const summaries = enabledModules.map((config) => {
      const componentCount = config.components.length;
      const pageCount = config.pages.length;
      const moduleName = this.getModuleName(config);

      return `- ${moduleName}: ${componentCount} components, ${pageCount} new pages`;
    });

    return `Enabled Modules:\n${summaries.join("\n")}`;
  }

  /**
   * Get the display name for a module config
   */
  private getModuleName(config: ModuleConfig): string {
    // Determine module name from config structure
    if (config.pages.some((p) => p.template === "shop")) return "E-commerce";
    if (config.pages.some((p) => p.template === "booking")) return "Booking";
    if (
      config.components.some(
        (c) =>
          c.componentType === "ContactForm" &&
          (c.props as Record<string, unknown>)?.captureAsLead
      )
    )
      return "CRM";
    if ((config as { workflows?: unknown[] }).workflows) return "Automation";
    if (config.components.some((c) => c.componentType.includes("Social")))
      return "Social Media";
    return "Unknown Module";
  }

  /**
   * Get all module pages that will be created
   */
  getModulePages(configs: ModuleConfig[]): Array<{ name: string; slug: string }> {
    const pages: Array<{ name: string; slug: string }> = [];

    for (const config of configs) {
      if (!config.enabled) continue;
      for (const page of config.pages) {
        pages.push({ name: page.name, slug: page.slug });
      }
    }

    return pages;
  }

  /**
   * Check if a specific module is enabled
   */
  isModuleEnabled(configs: ModuleConfig[], moduleType: ModuleType): boolean {
    return configs.some((config) => {
      if (!config.enabled) return false;

      switch (moduleType) {
        case "ecommerce":
          return config.pages.some((p) => p.template === "shop");
        case "booking":
          return config.pages.some((p) => p.template === "booking");
        case "crm":
          return config.components.some(
            (c) =>
              c.componentType === "ContactForm" &&
              (c.props as Record<string, unknown>)?.captureAsLead
          );
        case "automation":
          return (config as { workflows?: unknown[] }).workflows !== undefined;
        case "social-media":
          return config.components.some((c) =>
            c.componentType.includes("Social")
          );
        default:
          return false;
      }
    });
  }
}
