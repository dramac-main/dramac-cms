/**
 * PHASE AWD-09: Module Integration Intelligence
 * Component Injector
 *
 * Injects module-specific components into generated pages.
 */

import type { GeneratedPage, GeneratedComponent } from "../types";
import type { ModuleConfig, ModuleComponent, ModulePage } from "./types";

// =============================================================================
// COMPONENT INJECTOR
// =============================================================================

export class ComponentInjector {
  private moduleConfigs: ModuleConfig[];

  constructor(moduleConfigs: ModuleConfig[]) {
    this.moduleConfigs = moduleConfigs;
  }

  /**
   * Inject module components into generated pages
   */
  injectModuleComponents(pages: GeneratedPage[]): GeneratedPage[] {
    // Create a mutable copy of pages
    const pagesWithModules: GeneratedPage[] = pages.map((p) => ({
      ...p,
      components: [...p.components],
    }));

    // Process each module
    for (const config of this.moduleConfigs) {
      if (!config.enabled) continue;

      // Inject components
      for (const component of config.components) {
        if (component.placement === "page" && component.page) {
          // Add to specific page
          const pageIndex = pagesWithModules.findIndex(
            (p) => p.slug === component.page
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
            pagesWithModules[index] = this.addComponentToPage(page, component);
          });
        }
      }

      // Create module-specific pages
      for (const modulePage of config.pages) {
        if (!pagesWithModules.find((p) => p.slug === modulePage.slug)) {
          pagesWithModules.push(this.createModulePage(modulePage));
        }
      }
    }

    return pagesWithModules;
  }

  /**
   * Add a component to a page at the appropriate position
   */
  private addComponentToPage(
    page: GeneratedPage,
    moduleComponent: ModuleComponent
  ): GeneratedPage {
    const newComponent: GeneratedComponent = {
      id: crypto.randomUUID(),
      type: moduleComponent.componentType,
      props: moduleComponent.props as Record<string, unknown>,
    };

    const components = [...page.components];

    switch (moduleComponent.position) {
      case "header":
        // Add after navbar (usually first component)
        const navbarIndex = components.findIndex((c) => c.type === "Navbar");
        if (navbarIndex !== -1) {
          components.splice(navbarIndex + 1, 0, newComponent);
        } else {
          components.unshift(newComponent);
        }
        break;

      case "footer":
        // Add before footer (usually last component)
        const footerIndex = components.findIndex((c) => c.type === "Footer");
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

  /**
   * Create a new page from a module page template
   */
  private createModulePage(modulePage: ModulePage): GeneratedPage {
    // Add a Hero header section to module pages for proper visual structure
    const heroComponent: GeneratedComponent = {
      id: crypto.randomUUID(),
      type: "Hero",
      props: {
        title: modulePage.name,
        description: `${modulePage.name} — browse and select from our available options below.`,
        variant: "centered",
        minHeight: "40vh",
        titleSize: "lg",
        contentAlign: "center",
        animateOnLoad: true,
        animationType: "fade-up",
      },
    };

    return {
      id: crypto.randomUUID(),
      name: modulePage.name,
      slug: modulePage.slug,
      title: modulePage.name,
      description: `${modulePage.name} page`,
      isHomepage: false,
      components: [
        heroComponent,
        ...modulePage.components.map((componentType) => ({
          id: crypto.randomUUID(),
          type: componentType,
          props: this.getDefaultModuleComponentProps(componentType),
        })),
      ],
      seo: {
        title: modulePage.name,
        description: `${modulePage.name} page`,
      },
      order: 100, // Lower priority for module pages
    };
  }

  /**
   * Get sensible default props for module component types
   * These ensure module components render properly even without AI-generated content
   */
  private getDefaultModuleComponentProps(componentType: string): Record<string, unknown> {
    switch (componentType) {
      case "BookingCalendar":
        return {
          title: "Select a Date & Time",
          variant: "calendar",
          showTimeSlots: true,
        };
      case "BookingServiceSelector":
        return {
          title: "Choose a Service",
          variant: "cards",
          columns: 3,
        };
      case "BookingForm":
        return {
          title: "Complete Your Booking",
          submitText: "Confirm Booking",
          variant: "standard",
        };
      case "BookingWidget":
        return {
          title: "Book an Appointment",
          variant: "compact",
        };
      case "ProductGrid":
        return {
          title: "Our Products",
          columns: 3,
          variant: "cards",
        };
      case "CartItems":
        return { title: "Your Cart" };
      case "CheckoutForm":
        return { title: "Checkout" };
      default:
        return {};
    }
  }

  /**
   * Get list of all pages that will be created by modules
   */
  getModulePages(): ModulePage[] {
    const modulePages: ModulePage[] = [];

    for (const config of this.moduleConfigs) {
      if (!config.enabled) continue;
      modulePages.push(...config.pages);
    }

    return modulePages;
  }

  /**
   * Get list of all global components from modules
   */
  getGlobalComponents(): ModuleComponent[] {
    const globalComponents: ModuleComponent[] = [];

    for (const config of this.moduleConfigs) {
      if (!config.enabled) continue;
      globalComponents.push(
        ...config.components.filter((c) => c.placement === "global")
      );
    }

    return globalComponents;
  }
}
