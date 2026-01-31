import { Widget, WidgetConfig, WidgetSize, WidgetType, WidgetPosition } from "@/types/dashboard-widgets";
import { widgetRegistry, WIDGET_TYPES } from "./widget-registry";
import { v4 as uuid } from "uuid";

export interface CreateWidgetOptions {
  type: WidgetType | string;
  title: string;
  description?: string;
  size?: WidgetSize;
  position?: Partial<WidgetPosition>;
  config?: Partial<WidgetConfig>;
}

export function createWidget(options: CreateWidgetOptions): Widget {
  const { type, title, description, size = 'md', position = {}, config = {} } = options;
  
  // Get default config from registry if available
  const defaultConfig = widgetRegistry.getDefaultConfig(type) || {};
  
  const widget: Widget = {
    metadata: {
      id: uuid(),
      title,
      description,
      category: type,
      version: '1.0.0',
    },
    type: type as WidgetType,
    size,
    position: {
      row: position.row ?? 0,
      col: position.col ?? 0,
      rowSpan: position.rowSpan,
      colSpan: position.colSpan,
    },
    config: {
      ...defaultConfig,
      ...config,
      dataSource: config.dataSource || defaultConfig.dataSource || {
        type: 'static',
      },
    },
    isLoading: false,
    hasError: false,
    lastUpdated: new Date(),
  };
  
  return widget;
}

export function createStatWidget(
  title: string,
  options: {
    dataSource: WidgetConfig['dataSource'];
    thresholds?: WidgetConfig['thresholds'];
    size?: WidgetSize;
  }
): Widget {
  return createWidget({
    type: WIDGET_TYPES.STAT_CARD,
    title,
    size: options.size || 'sm',
    config: {
      dataSource: options.dataSource,
      thresholds: options.thresholds,
      animateOnLoad: true,
    },
  });
}

export function createChartWidget(
  title: string,
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'donut',
  options: {
    dataSource: WidgetConfig['dataSource'];
    chartConfig?: WidgetConfig['chartConfig'];
    timeRange?: WidgetConfig['timeRange'];
    size?: WidgetSize;
    showLegend?: boolean;
  }
): Widget {
  const typeMap = {
    line: WIDGET_TYPES.CHART_LINE,
    bar: WIDGET_TYPES.CHART_BAR,
    area: WIDGET_TYPES.CHART_AREA,
    pie: WIDGET_TYPES.CHART_PIE,
    donut: WIDGET_TYPES.CHART_DONUT,
  };
  
  return createWidget({
    type: typeMap[chartType],
    title,
    size: options.size || 'md',
    config: {
      dataSource: options.dataSource,
      chartType,
      chartConfig: options.chartConfig,
      timeRange: options.timeRange,
      showLegend: options.showLegend ?? true,
      showTooltip: true,
      showGrid: true,
      animateOnLoad: true,
      gradients: true,
    },
  });
}

export function createTableWidget(
  title: string,
  options: {
    dataSource: WidgetConfig['dataSource'];
    size?: WidgetSize;
  }
): Widget {
  return createWidget({
    type: WIDGET_TYPES.TABLE,
    title,
    size: options.size || 'lg',
    config: {
      dataSource: options.dataSource,
    },
  });
}

export function createListWidget(
  title: string,
  options: {
    dataSource: WidgetConfig['dataSource'];
    size?: WidgetSize;
  }
): Widget {
  return createWidget({
    type: WIDGET_TYPES.LIST,
    title,
    size: options.size || 'md',
    config: {
      dataSource: options.dataSource,
    },
  });
}

// Utility to clone a widget with new ID
export function cloneWidget(widget: Widget): Widget {
  return {
    ...widget,
    metadata: {
      ...widget.metadata,
      id: uuid(),
    },
  };
}

// Utility to update widget config
export function updateWidgetConfig(
  widget: Widget,
  config: Partial<WidgetConfig>
): Widget {
  return {
    ...widget,
    config: {
      ...widget.config,
      ...config,
    },
  };
}

// Utility to get widget size classes
export function getWidgetSizeClasses(size: WidgetSize): {
  colSpan: string;
  minHeight: string;
} {
  const sizeMap: Record<WidgetSize, { colSpan: string; minHeight: string }> = {
    sm: { colSpan: 'col-span-1', minHeight: 'min-h-[120px]' },
    md: { colSpan: 'col-span-1 md:col-span-2', minHeight: 'min-h-[200px]' },
    lg: { colSpan: 'col-span-1 md:col-span-2 lg:col-span-3', minHeight: 'min-h-[300px]' },
    xl: { colSpan: 'col-span-full lg:col-span-4', minHeight: 'min-h-[400px]' },
    full: { colSpan: 'col-span-full', minHeight: 'min-h-[400px]' },
  };
  
  return sizeMap[size] || sizeMap.md;
}
