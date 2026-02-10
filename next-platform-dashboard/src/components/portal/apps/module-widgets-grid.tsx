import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { icons } from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";

interface ModuleWidget {
  moduleId: string;
  moduleName: string;
  moduleIcon: string;
  widgetType: "stats" | "chart" | "list" | "custom";
  widgetSize: "small" | "medium" | "large";
  data: {
    value?: string | number;
    items?: Array<{ label: string; value?: string | number }>;
    [key: string]: unknown;
  };
}

interface ModuleWidgetsGridProps {
  widgets: ModuleWidget[];
}

export function ModuleWidgetsGrid({ widgets }: ModuleWidgetsGridProps) {
  if (widgets.length === 0) {
    return null;
  }

  const getWidgetCols = (size: string) => {
    switch (size) {
      case "small": return "col-span-1";
      case "medium": return "col-span-1 md:col-span-2";
      case "large": return "col-span-1 md:col-span-2 lg:col-span-3";
      default: return "col-span-1";
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Quick Stats from Your Apps</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {widgets.map((widget, index) => (
          <Card key={`${widget.moduleId}-${index}`} className={getWidgetCols(widget.widgetSize)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {(() => { const I = icons[resolveIconName(widget.moduleIcon) as keyof typeof icons] || icons.ChartBar; return <I className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />; })()}
                {widget.moduleName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {widget.widgetType === "stats" && (
                <div className="text-2xl font-bold">
                  {widget.data?.value ?? "—"}
                </div>
              )}
              {widget.widgetType === "list" && (
                <ul className="space-y-1 text-sm">
                  {(widget.data?.items || []).slice(0, 3).map((item, i) => (
                    <li key={i} className="flex justify-between text-muted-foreground">
                      <span>• {item.label}</span>
                      {item.value !== undefined && (
                        <span className="font-medium text-foreground">{item.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {widget.widgetType === "chart" && (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                  Chart visualization
                </div>
              )}
              {widget.widgetType === "custom" && (
                <div className="text-sm text-muted-foreground">
                  {typeof widget.data?.content === "string" 
                    ? widget.data.content 
                    : "Custom widget content"}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
