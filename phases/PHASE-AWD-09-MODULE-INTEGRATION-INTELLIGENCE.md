# Phase AWD-09: Module Integration Intelligence

> **Priority**: 🟢 MEDIUM
> **Estimated Time**: 8-10 hours
> **Prerequisites**: AWD-03 Complete, Modules Exist
> **Status**: 📋 READY TO IMPLEMENT

---

## ⚠️ BEFORE YOU BEGIN

**REQUIRED READING**: Before implementing this phase, you MUST read:

1. **[PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - Project structure, module locations
2. **AWD-03**: How the engine integrates module configs into generation
3. **Module Documentation**: Check existing module implementations in `packages/`

**This phase DEPENDS ON AWD-03** - integrates modules into the generation pipeline.

---

## 📁 Files To Create

| File | Purpose |
|------|--------|
| `next-platform-dashboard/src/lib/ai/website-designer/modules/types.ts` | Module integration types |
| `next-platform-dashboard/src/lib/ai/website-designer/modules/analyzer.ts` | Detect module requirements |
| `next-platform-dashboard/src/lib/ai/website-designer/modules/configurator.ts` | Configure each module type |
| `next-platform-dashboard/src/lib/ai/website-designer/modules/component-injector.ts` | Inject module components |
| `next-platform-dashboard/src/lib/ai/website-designer/modules/orchestrator.ts` | Main orchestration class |
| `next-platform-dashboard/src/lib/ai/website-designer/modules/index.ts` | Public exports |

---

## 📦 Available Modules Reference

| Module | Components Added | Pages Created |
|--------|-----------------|---------------|
| **ecommerce** | ProductGrid, Cart, Checkout, FeaturedProducts | /shop, /cart, /checkout |
| **booking** | BookingWidget, BookingCalendar, ServiceSelector | /book |
| **crm** | ContactForm (with lead capture), Newsletter | - |
| **automation** | - (background workflows) | - |
| **social-media** | SocialFeed, ShareButtons, SocialIcons | - |

---

## 🎯 Objective

Build intelligent **Module Integration** that automatically configures and integrates platform modules (E-commerce, Booking, CRM, Automation, Social Media) based on the website's purpose and user requirements.

**Principle:** AI understands when and how to activate modules for maximum business value

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODULE INTEGRATION INTELLIGENCE                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   MODULE ANALYZER                              │ │
│  │  • Detect module requirements from prompt                      │ │
│  │  • Check industry-specific module needs                        │ │
│  │  • Verify module availability                                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   MODULE CONFIGURATOR                          │ │
│  │  • E-commerce setup (products, cart, checkout)                 │ │
│  │  • Booking setup (services, calendar, availability)            │ │
│  │  • CRM setup (forms, leads, contacts)                          │ │
│  │  • Automation setup (workflows, emails)                        │ │
│  │  • Social setup (feeds, sharing)                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   COMPONENT INJECTOR                           │ │
│  │  • Add module-specific components to pages                     │ │
│  │  • Configure component-module bindings                         │ │
│  │  • Set up data connections                                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Core Types

```typescript
// src/lib/ai/website-designer/modules/types.ts

export type ModuleType = "ecommerce" | "booking" | "crm" | "automation" | "social-media";

export interface ModuleRequirement {
  module: ModuleType;
  required: boolean;
  priority: "high" | "medium" | "low";
  reason: string;
  suggestedConfig: ModuleConfig;
}

export interface ModuleConfig {
  enabled: boolean;
  settings: Record<string, any>;
  components: ModuleComponent[];
  pages: ModulePage[];
  integrations: ModuleIntegration[];
}

export interface ModuleComponent {
  componentType: string;
  placement: "page" | "global";
  page?: string;            // Page slug if page-specific
  position?: "header" | "footer" | "main";
  props: Record<string, any>;
}

export interface ModulePage {
  name: string;
  slug: string;
  template: string;
  components: string[];
}

export interface ModuleIntegration {
  type: string;
  config: Record<string, any>;
}

// E-commerce specific
export interface EcommerceConfig extends ModuleConfig {
  settings: {
    currency: string;
    taxRate: number;
    shippingEnabled: boolean;
    shippingZones: ShippingZone[];
    paymentMethods: string[];
    inventoryTracking: boolean;
    lowStockThreshold: number;
  };
}

// Booking specific
export interface BookingConfig extends ModuleConfig {
  settings: {
    timezone: string;
    bookingWindow: number;     // Days ahead
    cancellationPolicy: string;
    requireDeposit: boolean;
    depositAmount: number;
    confirmationEmail: boolean;
    reminderEmail: boolean;
  };
}

// CRM specific
export interface CRMConfig extends ModuleConfig {
  settings: {
    leadCapture: boolean;
    leadScoring: boolean;
    emailIntegration: boolean;
    pipelineStages: string[];
    autoAssignment: boolean;
  };
}

// Automation specific
export interface AutomationConfig extends ModuleConfig {
  settings: {
    welcomeEmail: boolean;
    abandonedCartEmail: boolean;
    followUpSequence: boolean;
    reviewRequest: boolean;
  };
  workflows: AutomationWorkflow[];
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
}

// Social Media specific
export interface SocialMediaConfig extends ModuleConfig {
  settings: {
    platforms: string[];
    autoPost: boolean;
    feedDisplay: boolean;
    shareButtons: boolean;
  };
}
```

---

## 🔧 Implementation

### 1. Module Analyzer

```typescript
// src/lib/ai/website-designer/modules/analyzer.ts

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { ModuleRequirement, ModuleType } from "./types";

const industryModuleMapping: Record<string, { required: ModuleType[]; recommended: ModuleType[] }> = {
  restaurant: {
    required: ["booking"],
    recommended: ["crm", "social-media", "automation"],
  },
  ecommerce: {
    required: ["ecommerce"],
    recommended: ["crm", "automation", "social-media"],
  },
  saas: {
    required: ["crm"],
    recommended: ["automation"],
  },
  healthcare: {
    required: ["booking", "crm"],
    recommended: ["automation"],
  },
  "real-estate": {
    required: ["crm"],
    recommended: ["automation", "social-media"],
  },
  service: {
    required: ["booking", "crm"],
    recommended: ["automation"],
  },
  portfolio: {
    required: [],
    recommended: ["crm", "social-media"],
  },
  construction: {
    required: ["crm"],
    recommended: ["automation"],
  },
};

export async function analyzeModuleRequirements(
  userPrompt: string,
  industry: string,
  businessContext: BusinessDataContext
): Promise<ModuleRequirement[]> {
  // Start with industry defaults
  const industryDefaults = industryModuleMapping[industry] || { required: [], recommended: [] };
  
  // Use AI to analyze prompt for additional module needs
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: z.object({
      detectedModules: z.array(z.object({
        module: z.enum(["ecommerce", "booking", "crm", "automation", "social-media"]),
        confidence: z.number().min(0).max(1),
        reason: z.string(),
        features: z.array(z.string()),
      })),
    }),
    prompt: `Analyze this website request and determine which modules are needed.

User prompt: "${userPrompt}"

Industry: ${industry}

Business context:
- Has products/services: ${businessContext.services?.length > 0}
- Has team: ${businessContext.team?.length > 0}
- Has testimonials: ${businessContext.testimonials?.length > 0}
- Has social links: ${businessContext.social?.length > 0}

Available modules:
1. **E-commerce**: Product catalog, shopping cart, checkout, payments, inventory
2. **Booking**: Appointment scheduling, calendar, availability, confirmations
3. **CRM**: Lead capture, contact management, pipeline, follow-ups
4. **Automation**: Email sequences, abandoned cart, review requests, workflows
5. **Social Media**: Social feeds, share buttons, auto-posting, Instagram display

Determine which modules would benefit this website and why.
`,
  });
  
  // Combine AI analysis with industry defaults
  const requirements: ModuleRequirement[] = [];
  
  // Add required modules from industry
  for (const module of industryDefaults.required) {
    const aiModule = object.detectedModules.find(m => m.module === module);
    requirements.push({
      module,
      required: true,
      priority: "high",
      reason: aiModule?.reason || `Standard requirement for ${industry} websites`,
      suggestedConfig: getDefaultModuleConfig(module),
    });
  }
  
  // Add AI-detected modules
  for (const detected of object.detectedModules) {
    if (!requirements.find(r => r.module === detected.module)) {
      const isRecommended = industryDefaults.recommended.includes(detected.module);
      
      requirements.push({
        module: detected.module,
        required: detected.confidence > 0.8,
        priority: detected.confidence > 0.7 ? "high" : detected.confidence > 0.4 ? "medium" : "low",
        reason: detected.reason,
        suggestedConfig: getDefaultModuleConfig(detected.module, detected.features),
      });
    }
  }
  
  // Add recommended modules not yet added
  for (const module of industryDefaults.recommended) {
    if (!requirements.find(r => r.module === module)) {
      requirements.push({
        module,
        required: false,
        priority: "low",
        reason: `Recommended for ${industry} websites`,
        suggestedConfig: getDefaultModuleConfig(module),
      });
    }
  }
  
  return requirements.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function getDefaultModuleConfig(module: ModuleType, features?: string[]): ModuleConfig {
  const configs: Record<ModuleType, ModuleConfig> = {
    ecommerce: {
      enabled: true,
      settings: {
        currency: "USD",
        taxRate: 0,
        shippingEnabled: true,
        paymentMethods: ["card", "paypal"],
        inventoryTracking: true,
      },
      components: [
        { componentType: "ProductGrid", placement: "page", page: "/shop", props: {} },
        { componentType: "Cart", placement: "global", position: "header", props: {} },
        { componentType: "FeaturedProducts", placement: "page", page: "/", props: {} },
      ],
      pages: [
        { name: "Shop", slug: "/shop", template: "shop", components: ["ProductGrid", "ProductFilters"] },
        { name: "Cart", slug: "/cart", template: "cart", components: ["CartItems", "CartSummary"] },
        { name: "Checkout", slug: "/checkout", template: "checkout", components: ["CheckoutForm"] },
      ],
      integrations: [
        { type: "stripe", config: {} },
      ],
    },
    booking: {
      enabled: true,
      settings: {
        timezone: "America/New_York",
        bookingWindow: 30,
        cancellationPolicy: "24 hours notice required",
        requireDeposit: false,
        confirmationEmail: true,
        reminderEmail: true,
      },
      components: [
        { componentType: "BookingWidget", placement: "page", page: "/", props: {} },
        { componentType: "BookingCalendar", placement: "page", page: "/book", props: {} },
        { componentType: "ServiceSelector", placement: "page", page: "/book", props: {} },
      ],
      pages: [
        { name: "Book Now", slug: "/book", template: "booking", components: ["BookingCalendar", "ServiceSelector"] },
      ],
      integrations: [],
    },
    crm: {
      enabled: true,
      settings: {
        leadCapture: true,
        leadScoring: false,
        emailIntegration: true,
        pipelineStages: ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"],
        autoAssignment: false,
      },
      components: [
        { componentType: "ContactForm", placement: "page", page: "/contact", props: { captureAsLead: true } },
        { componentType: "Newsletter", placement: "global", position: "footer", props: {} },
      ],
      pages: [],
      integrations: [],
    },
    automation: {
      enabled: true,
      settings: {
        welcomeEmail: true,
        abandonedCartEmail: false,
        followUpSequence: true,
        reviewRequest: false,
      },
      components: [],
      pages: [],
      integrations: [
        { type: "email", config: { provider: "sendgrid" } },
      ],
    },
    "social-media": {
      enabled: true,
      settings: {
        platforms: ["facebook", "instagram", "twitter"],
        autoPost: false,
        feedDisplay: true,
        shareButtons: true,
      },
      components: [
        { componentType: "SocialFeed", placement: "page", page: "/", props: {} },
        { componentType: "ShareButtons", placement: "global", props: {} },
        { componentType: "SocialIcons", placement: "global", position: "footer", props: {} },
      ],
      pages: [],
      integrations: [],
    },
  };
  
  return configs[module];
}
```

### 2. Module Configurator

```typescript
// src/lib/ai/website-designer/modules/configurator.ts

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { ModuleConfig, ModuleRequirement, EcommerceConfig, BookingConfig } from "./types";

export class ModuleConfigurator {
  private businessContext: BusinessDataContext;
  
  constructor(businessContext: BusinessDataContext) {
    this.businessContext = businessContext;
  }
  
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
  
  private async configureEcommerce(requirement: ModuleRequirement): Promise<EcommerceConfig> {
    const baseConfig = requirement.suggestedConfig as EcommerceConfig;
    
    // Auto-configure based on business context
    const products = this.businessContext.services || [];
    const hasProducts = products.length > 0;
    
    // Determine optimal product display
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: z.object({
        productGridColumns: z.number().min(2).max(5),
        showFilters: z.boolean(),
        showQuickView: z.boolean(),
        showCompare: z.boolean(),
        featuredProductCount: z.number(),
        categoriesEnabled: z.boolean(),
      }),
      prompt: `Configure e-commerce display settings.

Products available: ${products.length}
Product categories: ${[...new Set(products.map(p => p.category))].join(", ") || "None"}

Determine optimal e-commerce configuration.
`,
    });
    
    return {
      ...baseConfig,
      settings: {
        ...baseConfig.settings,
        // Additional settings based on AI analysis
      },
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
  }
  
  private async configureBooking(requirement: ModuleRequirement): Promise<BookingConfig> {
    const baseConfig = requirement.suggestedConfig as BookingConfig;
    const services = this.businessContext.services || [];
    const businessHours = this.businessContext.hours || [];
    
    // Determine booking configuration
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: z.object({
        bookingType: z.enum(["appointment", "class", "table", "consultation"]),
        durationOptions: z.array(z.number()),
        allowMultipleBookings: z.boolean(),
        requirePhone: z.boolean(),
        showPrices: z.boolean(),
        bufferTime: z.number(),
      }),
      prompt: `Configure booking settings.

Services: ${services.map(s => `${s.name}: ${s.description}`).join("\n")}
Business hours: ${JSON.stringify(businessHours)}
Industry: ${this.businessContext.client?.industry || "general"}

Determine optimal booking configuration.
`,
    });
    
    return {
      ...baseConfig,
      settings: {
        ...baseConfig.settings,
        // Merge AI-determined settings
      },
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
  }
  
  private async configureCRM(requirement: ModuleRequirement): Promise<ModuleConfig> {
    // Configure CRM based on business needs
    return {
      ...requirement.suggestedConfig,
      components: [
        {
          componentType: "ContactForm",
          placement: "page",
          page: "/contact",
          props: {
            captureAsLead: true,
            fields: ["name", "email", "phone", "message"],
            includeService: this.businessContext.services?.length > 0,
          },
        },
        {
          componentType: "Newsletter",
          placement: "global",
          position: "footer",
          props: {
            title: "Stay Updated",
            description: "Subscribe to our newsletter for updates and special offers.",
          },
        },
      ],
    };
  }
  
  private async configureAutomation(requirement: ModuleRequirement): Promise<ModuleConfig> {
    // Determine which automations to enable
    const hasEcommerce = true; // Check from other modules
    const hasCRM = true;
    
    return {
      ...requirement.suggestedConfig,
      settings: {
        ...requirement.suggestedConfig.settings,
        abandonedCartEmail: hasEcommerce,
        welcomeEmail: hasCRM,
        followUpSequence: hasCRM,
      },
    };
  }
  
  private async configureSocialMedia(requirement: ModuleRequirement): Promise<ModuleConfig> {
    const socialLinks = this.businessContext.social || [];
    const platforms = socialLinks.map(s => s.platform.toLowerCase());
    
    return {
      ...requirement.suggestedConfig,
      settings: {
        ...requirement.suggestedConfig.settings,
        platforms: platforms.length > 0 ? platforms : ["facebook", "instagram"],
        feedDisplay: platforms.includes("instagram"),
      },
      components: [
        ...(platforms.includes("instagram") ? [{
          componentType: "InstagramFeed",
          placement: "page" as const,
          page: "/",
          props: {
            count: 6,
            columns: 3,
          },
        }] : []),
        {
          componentType: "SocialIcons",
          placement: "global" as const,
          position: "footer" as const,
          props: {
            platforms,
            links: Object.fromEntries(socialLinks.map(s => [s.platform.toLowerCase(), s.url])),
          },
        },
      ],
    };
  }
}
```

### 3. Component Injector

```typescript
// src/lib/ai/website-designer/modules/component-injector.ts

import type { GeneratedPage, ModuleConfig, ModuleComponent } from "./types";

export class ComponentInjector {
  private moduleConfigs: ModuleConfig[];
  
  constructor(moduleConfigs: ModuleConfig[]) {
    this.moduleConfigs = moduleConfigs;
  }
  
  injectModuleComponents(pages: GeneratedPage[]): GeneratedPage[] {
    // Create new pages array with injected components
    const pagesWithModules = [...pages];
    
    for (const config of this.moduleConfigs) {
      if (!config.enabled) continue;
      
      for (const component of config.components) {
        if (component.placement === "page") {
          // Add to specific page
          const pageIndex = pagesWithModules.findIndex(
            p => p.slug === component.page
          );
          
          if (pageIndex !== -1) {
            pagesWithModules[pageIndex] = this.addComponentToPage(
              pagesWithModules[pageIndex],
              component
            );
          }
        } else if (component.placement === "global") {
          // Add to all pages
          pagesWithModules.forEach((page, index) => {
            pagesWithModules[index] = this.addComponentToPage(
              page,
              component
            );
          });
        }
      }
      
      // Add module-specific pages
      for (const modulePage of config.pages) {
        if (!pagesWithModules.find(p => p.slug === modulePage.slug)) {
          pagesWithModules.push(this.createModulePage(modulePage));
        }
      }
    }
    
    return pagesWithModules;
  }
  
  private addComponentToPage(
    page: GeneratedPage,
    moduleComponent: ModuleComponent
  ): GeneratedPage {
    const newComponent = {
      id: crypto.randomUUID(),
      type: moduleComponent.componentType,
      props: moduleComponent.props,
    };
    
    let components = [...page.components];
    
    switch (moduleComponent.position) {
      case "header":
        // Add after navbar (usually first component)
        const navbarIndex = components.findIndex(c => c.type === "Navbar");
        if (navbarIndex !== -1) {
          components.splice(navbarIndex + 1, 0, newComponent);
        } else {
          components.unshift(newComponent);
        }
        break;
        
      case "footer":
        // Add before footer (usually last component)
        const footerIndex = components.findIndex(c => c.type === "Footer");
        if (footerIndex !== -1) {
          components.splice(footerIndex, 0, newComponent);
        } else {
          components.push(newComponent);
        }
        break;
        
      default:
        // Add to main content area (middle of page)
        const middleIndex = Math.floor(components.length / 2);
        components.splice(middleIndex, 0, newComponent);
    }
    
    return {
      ...page,
      components,
    };
  }
  
  private createModulePage(modulePage: ModulePage): GeneratedPage {
    return {
      id: crypto.randomUUID(),
      name: modulePage.name,
      slug: modulePage.slug,
      title: modulePage.name,
      description: `${modulePage.name} page`,
      isHomepage: false,
      components: modulePage.components.map(componentType => ({
        id: crypto.randomUUID(),
        type: componentType,
        props: {},
      })),
      seo: {
        title: modulePage.name,
        description: `${modulePage.name} page`,
      },
      order: 100, // Low priority for module pages
    };
  }
}
```

### 4. Module Integration Orchestrator

```typescript
// src/lib/ai/website-designer/modules/orchestrator.ts

import { analyzeModuleRequirements } from "./analyzer";
import { ModuleConfigurator } from "./configurator";
import { ComponentInjector } from "./component-injector";
import type { GeneratedPage, ModuleConfig, ModuleRequirement } from "./types";

export class ModuleIntegrationOrchestrator {
  private businessContext: BusinessDataContext;
  
  constructor(businessContext: BusinessDataContext) {
    this.businessContext = businessContext;
  }
  
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
    
    // Step 2: Configure each module
    const configurator = new ModuleConfigurator(this.businessContext);
    const configs: ModuleConfig[] = [];
    
    for (const requirement of requirements) {
      if (requirement.required || requirement.priority === "high") {
        const config = await configurator.configureModule(requirement);
        configs.push(config);
      }
    }
    
    return { requirements, configs };
  }
  
  integrateModules(
    pages: GeneratedPage[],
    moduleConfigs: ModuleConfig[]
  ): GeneratedPage[] {
    const injector = new ComponentInjector(moduleConfigs);
    return injector.injectModuleComponents(pages);
  }
  
  async getModuleSummary(configs: ModuleConfig[]): Promise<string> {
    const enabledModules = configs.filter(c => c.enabled);
    
    const summaries = enabledModules.map(config => {
      const componentCount = config.components.length;
      const pageCount = config.pages.length;
      
      return `- ${this.getModuleName(config)}: ${componentCount} components, ${pageCount} new pages`;
    });
    
    return `Enabled Modules:\n${summaries.join("\n")}`;
  }
  
  private getModuleName(config: ModuleConfig): string {
    // Determine module name from config structure
    if (config.pages.some(p => p.template === "shop")) return "E-commerce";
    if (config.pages.some(p => p.template === "booking")) return "Booking";
    if (config.components.some(c => c.componentType === "ContactForm" && c.props?.captureAsLead)) return "CRM";
    if ((config as any).workflows) return "Automation";
    if (config.components.some(c => c.componentType.includes("Social"))) return "Social Media";
    return "Unknown Module";
  }
}
```

---

## 📋 Implementation Tasks

### Task 1: Module Analyzer (2 hours)
- Build industry-module mapping
- Implement AI analysis
- Create requirement ranking

### Task 2: Module Configurator (3 hours)
- Build configurator for each module type
- Implement AI-powered configuration
- Handle business context

### Task 3: Component Injector (2 hours)
- Build component injection logic
- Handle placement positions
- Create module pages

### Task 4: Integration (2 hours)
- Connect to AWD-03 engine
- Test full pipeline
- Verify component rendering

### Task 5: Testing (1 hour)
- Test each module type
- Test combinations
- Verify data binding

---

## ✅ Completion Checklist

- [ ] Module analyzer working
- [ ] Industry-module mapping complete
- [ ] E-commerce configurator working
- [ ] Booking configurator working
- [ ] CRM configurator working
- [ ] Automation configurator working
- [ ] Social Media configurator working
- [ ] Component injector working
- [ ] Module pages created
- [ ] Integration with engine complete
- [ ] All modules tested

---

## 📁 Files Created

```
src/lib/ai/website-designer/modules/
├── types.ts
├── analyzer.ts
├── configurator.ts
├── component-injector.ts
├── orchestrator.ts
└── index.ts
```

---

**READY TO IMPLEMENT! 🚀**
