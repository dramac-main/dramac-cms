import { 
  WidgetRegistryEntry, 
  WidgetConfig, 
  WidgetData,
} from "@/types/dashboard-widgets";

class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Map<string, WidgetRegistryEntry> = new Map();

  private constructor() {}

  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  register(type: string, entry: WidgetRegistryEntry): void {
    if (this.widgets.has(type)) {
      console.warn(`Widget type "${type}" is already registered. Overwriting...`);
    }
    this.widgets.set(type, entry);
  }

  unregister(type: string): boolean {
    return this.widgets.delete(type);
  }

  get(type: string): WidgetRegistryEntry | undefined {
    return this.widgets.get(type);
  }

  has(type: string): boolean {
    return this.widgets.has(type);
  }

  getAll(): Map<string, WidgetRegistryEntry> {
    return new Map(this.widgets);
  }

  getAllTypes(): string[] {
    return Array.from(this.widgets.keys());
  }

  getDefaultConfig(type: string): Partial<WidgetConfig> | undefined {
    const entry = this.widgets.get(type);
    return entry?.defaultConfig;
  }

  validateConfig(type: string, config: WidgetConfig): boolean {
    const entry = this.widgets.get(type);
    if (!entry || !entry.validateConfig) {
      return true; // No validation function means config is valid
    }
    return entry.validateConfig(config);
  }

  async fetchData(type: string, config: WidgetConfig): Promise<WidgetData | null> {
    const entry = this.widgets.get(type);
    if (!entry || !entry.fetchData) {
      return null;
    }
    return entry.fetchData(config);
  }
}

export const widgetRegistry = WidgetRegistry.getInstance();

// Built-in widget types
export const WIDGET_TYPES = {
  STAT: 'stat',
  STAT_CARD: 'stat-card',
  CHART_LINE: 'chart-line',
  CHART_BAR: 'chart-bar',
  CHART_AREA: 'chart-area',
  CHART_PIE: 'chart-pie',
  CHART_DONUT: 'chart-donut',
  CHART_SPARKLINE: 'chart-sparkline',
  TABLE: 'table',
  LIST: 'list',
  ACTIVITY_FEED: 'activity-feed',
  PROGRESS: 'progress',
  MINI_CHART: 'mini-chart',
} as const;

export type BuiltInWidgetType = typeof WIDGET_TYPES[keyof typeof WIDGET_TYPES];
