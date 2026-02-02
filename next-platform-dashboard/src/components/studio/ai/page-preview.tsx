/**
 * Page Preview Component
 * 
 * Previews generated page structure before applying.
 * Phase STUDIO-12: AI Page Generator
 */

"use client";

import { cn } from "@/lib/utils";
import type { StudioPageData } from "@/types/studio";
import { 
  Layers, 
  LayoutTemplate, 
  Type, 
  Image, 
  MousePointer,
  ChevronRight,
  Box,
  FileText,
  Sparkles,
} from "lucide-react";

interface PagePreviewProps {
  data: StudioPageData;
  sections: Array<{ name: string; componentCount: number }>;
}

const COMPONENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Section: LayoutTemplate,
  Container: Box,
  Columns: Layers,
  Heading: Type,
  Text: FileText,
  Image: Image,
  Button: MousePointer,
};

function getComponentIcon(type: string) {
  return COMPONENT_ICONS[type] || Layers;
}

export function PagePreview({ data, sections }: PagePreviewProps) {
  return (
    <div className="space-y-4">
      {/* Section list */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const sectionId = data.root.children[index];
          const sectionData = sectionId ? data.components[sectionId] : null;
          
          return (
            <div
              key={section.name + index}
              className={cn(
                "p-3 rounded-lg border bg-card",
                "hover:border-primary/50 transition-colors"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{section.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {section.componentCount} component{section.componentCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              
              {/* Section preview - show first-level children */}
              {sectionData?.children && sectionData.children.length > 0 && (
                <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
                  {sectionData.children.slice(0, 5).map(childId => {
                    const child = data.components[childId];
                    if (!child) return null;
                    
                    const Icon = getComponentIcon(child.type);
                    
                    return (
                      <span
                        key={childId}
                        className="text-xs px-2 py-0.5 bg-muted rounded flex items-center gap-1"
                      >
                        <Icon className="w-3 h-3" />
                        {child.type}
                      </span>
                    );
                  })}
                  {sectionData.children.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{sectionData.children.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {sections.length}
          </div>
          <div className="text-xs text-muted-foreground">
            Section{sections.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {Object.keys(data.components).length}
          </div>
          <div className="text-xs text-muted-foreground">
            Component{Object.keys(data.components).length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
