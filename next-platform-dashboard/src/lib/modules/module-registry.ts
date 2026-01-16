import { MODULE_CATALOG } from "./module-catalog";
import type { ModuleDefinition, ModuleCategory, ModuleSearchParams } from "./module-types";

// Populated module registry using catalog
class ModuleRegistry {
  private modules: Map<string, ModuleDefinition>;

  constructor() {
    this.modules = new Map();
    // Initialize with catalog modules
    MODULE_CATALOG.forEach((module) => {
      this.modules.set(module.id, module);
    });
  }

  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  getBySlug(slug: string): ModuleDefinition | undefined {
    return Array.from(this.modules.values()).find((m) => m.slug === slug);
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  getByCategory(category: ModuleCategory): ModuleDefinition[] {
    return this.getAll().filter((m) => m.category === category);
  }

  search(params: ModuleSearchParams): { modules: ModuleDefinition[]; total: number } {
    let results = this.getAll();

    // Filter by query
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (params.category) {
      results = results.filter((m) => m.category === params.category);
    }

    // Filter by price type
    if (params.priceType) {
      results = results.filter((m) => m.pricing.type === params.priceType);
    }

    // Sort
    switch (params.sort) {
      case "popular":
        results.sort((a, b) => (b.installCount || 0) - (a.installCount || 0));
        break;
      case "newest":
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "price-low":
        results.sort((a, b) => a.pricing.amount - b.pricing.amount);
        break;
      case "price-high":
        results.sort((a, b) => b.pricing.amount - a.pricing.amount);
        break;
      case "rating":
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        results.sort((a, b) => (b.installCount || 0) - (a.installCount || 0));
    }

    const total = results.length;

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    results = results.slice(start, start + limit);

    return { modules: results, total };
  }

  getFeatured(): ModuleDefinition[] {
    return this.getAll()
      .filter((m) => m.status === "active" && (m.rating || 0) >= 4.5)
      .sort((a, b) => (b.installCount || 0) - (a.installCount || 0))
      .slice(0, 6);
  }

  register(module: ModuleDefinition): void {
    this.modules.set(module.id, module);
  }

  unregister(id: string): boolean {
    return this.modules.delete(id);
  }
}

// Export singleton instance
export const moduleRegistry = new ModuleRegistry();

// Export for backward compatibility
export default moduleRegistry;
