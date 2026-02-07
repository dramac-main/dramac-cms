/**
 * PHASE AWD-09: Module Integration Intelligence
 * Module Configurator
 *
 * Configures modules based on business context and AI analysis.
 */

import { getAIModel, generateObject } from "../config/ai-provider";
import { z } from "zod";
import type {
  ModuleConfig,
  ModuleRequirement,
  EcommerceConfig,
  BookingConfig,
  CRMConfig,
  AutomationConfig,
  SocialMediaConfig,
  BusinessDataContext,
} from "./types";

// =============================================================================
// SCHEMAS
// =============================================================================

const EcommerceOptionsSchema = z.object({
  productGridColumns: z.number().min(2).max(5),
  showFilters: z.boolean(),
  showQuickView: z.boolean(),
  showCompare: z.boolean(),
  featuredProductCount: z.number(),
  categoriesEnabled: z.boolean(),
});

const BookingOptionsSchema = z.object({
  bookingType: z.enum(["appointment", "class", "table", "consultation"]),
  durationOptions: z.array(z.number()),
  allowMultipleBookings: z.boolean(),
  requirePhone: z.boolean(),
  showPrices: z.boolean(),
  bufferTime: z.number(),
});

// =============================================================================
// CONFIGURATOR CLASS
// =============================================================================

export class ModuleConfigurator {
  private businessContext: BusinessDataContext;

  constructor(businessContext: BusinessDataContext) {
    this.businessContext = businessContext;
  }

  /**
   * Configure a module based on its requirement
   */
  async configureModule(requirement: ModuleRequirement): Promise<ModuleConfig> {
    switch (requirement.module) {
      case "ecommerce":
        return this.configureEcommerce(requirement);
      case "booking":
        return this.configureBooking(requirement);
      case "crm":
        return this.configureCRM(requirement);
      case "automation":
        return this.configureAutomation(requirement);
      case "social-media":
        return this.configureSocialMedia(requirement);
      default:
        return requirement.suggestedConfig;
    }
  }

  /**
   * Configure E-commerce module
   */
  private async configureEcommerce(
    requirement: ModuleRequirement
  ): Promise<EcommerceConfig> {
    const baseConfig = requirement.suggestedConfig as EcommerceConfig;
    const products = this.businessContext.products || [];
    const services = this.businessContext.services || [];
    const items = [...products, ...services];

    if (items.length === 0) {
      return baseConfig;
    }

    try {
      const categories = [
        ...new Set(items.map((p) => p.category).filter(Boolean)),
      ];

      const { object } = await generateObject({
        model: getAIModel("module-configurator"),
        schema: EcommerceOptionsSchema,
        prompt: `Configure e-commerce display settings.

Products available: ${items.length}
Product categories: ${categories.join(", ") || "None"}

Determine optimal e-commerce configuration for best user experience.
`,
      });

      return {
        ...baseConfig,
        components: [
          {
            componentType: "ProductGrid",
            placement: "page",
            page: "/shop",
            props: {
              columns: object.productGridColumns,
              showFilters: object.showFilters,
              showQuickView: object.showQuickView,
            },
          },
          {
            componentType: "FeaturedProducts",
            placement: "page",
            page: "/",
            props: {
              count: object.featuredProductCount,
            },
          },
          {
            componentType: "Cart",
            placement: "global",
            position: "header",
            props: {},
          },
        ],
      };
    } catch (error) {
      console.error("[ModuleConfigurator] Error configuring ecommerce:", error);
      return baseConfig;
    }
  }

  /**
   * Configure Booking module
   */
  private async configureBooking(
    requirement: ModuleRequirement
  ): Promise<BookingConfig> {
    const baseConfig = requirement.suggestedConfig as BookingConfig;
    const services = this.businessContext.services || [];
    const hours = this.businessContext.hours || [];

    if (services.length === 0) {
      return baseConfig;
    }

    try {
      const { object } = await generateObject({
        model: getAIModel("module-configurator"),
        schema: BookingOptionsSchema,
        prompt: `Configure booking settings.

Services: ${services.map((s) => `${s.name}: ${s.description || ""}`).join("\n")}
Business hours: ${JSON.stringify(hours)}
Industry: ${this.businessContext.client?.industry || "general"}

Determine optimal booking configuration.
`,
      });

      return {
        ...baseConfig,
        components: [
          {
            componentType: "BookingWidget",
            placement: "page",
            page: "/",
            props: {
              variant: object.bookingType,
              showPrices: object.showPrices,
            },
          },
          {
            componentType: "BookingCalendar",
            placement: "page",
            page: "/book",
            props: {
              durationOptions: object.durationOptions,
              bufferTime: object.bufferTime,
            },
          },
        ],
      };
    } catch (error) {
      console.error("[ModuleConfigurator] Error configuring booking:", error);
      return baseConfig;
    }
  }

  /**
   * Configure CRM module
   */
  private async configureCRM(requirement: ModuleRequirement): Promise<CRMConfig> {
    const baseConfig = requirement.suggestedConfig as CRMConfig;
    const hasServices = (this.businessContext.services?.length ?? 0) > 0;

    return {
      ...baseConfig,
      components: [
        {
          componentType: "ContactForm",
          placement: "page",
          page: "/contact",
          props: {
            captureAsLead: true,
            fields: ["name", "email", "phone", "message"],
            includeService: hasServices,
          },
        },
        {
          componentType: "Newsletter",
          placement: "global",
          position: "footer",
          props: {
            title: "Stay Updated",
            description:
              "Subscribe to our newsletter for updates and special offers.",
          },
        },
      ],
    };
  }

  /**
   * Configure Automation module
   */
  private async configureAutomation(
    requirement: ModuleRequirement
  ): Promise<AutomationConfig> {
    const baseConfig = requirement.suggestedConfig as AutomationConfig;

    // Check if e-commerce is likely enabled
    const hasProducts = (this.businessContext.products?.length ?? 0) > 0;

    return {
      ...baseConfig,
      settings: {
        ...baseConfig.settings,
        abandonedCartEmail: hasProducts,
        welcomeEmail: true,
        followUpSequence: true,
      },
    };
  }

  /**
   * Configure Social Media module
   */
  private async configureSocialMedia(
    requirement: ModuleRequirement
  ): Promise<SocialMediaConfig> {
    const baseConfig = requirement.suggestedConfig as SocialMediaConfig;
    const socialLinks = this.businessContext.social || [];
    const platforms = socialLinks.map((s) => s.platform.toLowerCase());

    const components = [...baseConfig.components];

    // Add Instagram feed if Instagram is linked
    if (platforms.includes("instagram")) {
      components.unshift({
        componentType: "InstagramFeed",
        placement: "page",
        page: "/",
        props: {
          count: 6,
          columns: 3,
        },
      });
    }

    // Update social icons with actual links
    const socialIconsIndex = components.findIndex(
      (c) => c.componentType === "SocialIcons"
    );
    if (socialIconsIndex !== -1) {
      components[socialIconsIndex] = {
        ...components[socialIconsIndex],
        props: {
          platforms: platforms.length > 0 ? platforms : ["facebook", "instagram"],
          links: Object.fromEntries(
            socialLinks.map((s) => [s.platform.toLowerCase(), s.url])
          ),
        },
      };
    }

    return {
      ...baseConfig,
      settings: {
        ...baseConfig.settings,
        platforms: platforms.length > 0 ? platforms : ["facebook", "instagram"],
        feedDisplay: platforms.includes("instagram"),
      },
      components,
    };
  }
}
