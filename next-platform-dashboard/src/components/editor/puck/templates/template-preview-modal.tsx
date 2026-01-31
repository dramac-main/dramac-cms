/**
 * Template Preview Modal
 * PHASE-ED-07A: Template System - Categories
 * 
 * Full-size template preview with section breakdown, features list,
 * color scheme display, and apply functionality.
 */

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  Download,
  Layers,
  Clock,
  Star,
  Sparkles,
  Palette,
  Layout,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PuckTemplate } from "@/types/puck-templates";
import { getCategoryIcon, getCategoryLabel, getCategoryColor, getSectionInfo } from "@/lib/templates/puck-template-categories";

interface TemplatePreviewModalProps {
  template: PuckTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (template: PuckTemplate) => void;
  isApplying?: boolean;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onApply,
  isApplying,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const categoryColor = getCategoryColor(template.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{template.name}</DialogTitle>
                {template.isPremium && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    <Star className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {template.isNew && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                )}
              </div>
              <DialogDescription>{template.description}</DialogDescription>
              <div className="flex items-center gap-3 text-sm">
                <Badge
                  variant="outline"
                  style={{ borderColor: categoryColor, color: categoryColor }}
                >
                  {getCategoryIcon(template.category)} {getCategoryLabel(template.category)}
                </Badge>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  {template.metadata.componentCount} components
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {template.metadata.estimatedBuildTime}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Preview Image */}
            <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
              {template.thumbnail && template.thumbnail !== "/templates/blank.svg" ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-8xl"
                  style={{ backgroundColor: `${categoryColor}10` }}
                >
                  {getCategoryIcon(template.category)}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Features Included
                </h4>
                <ul className="space-y-2">
                  {template.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-3 w-3 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sections */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Layout className="h-4 w-4 text-blue-500" />
                  Page Sections
                </h4>
                <div className="flex flex-wrap gap-2">
                  {template.sections.map((sectionType) => {
                    const sectionInfo = getSectionInfo(sectionType as any);
                    return (
                      <Badge
                        key={sectionType}
                        variant="secondary"
                        className="capitalize"
                      >
                        {sectionInfo?.icon || "📦"} {sectionInfo?.label || sectionType}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <Separator />

            {/* Color Scheme */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-500" />
                Color Scheme
              </h4>
              <div className="flex items-center gap-4">
                <ColorSwatch
                  color={template.colorScheme.primary}
                  label="Primary"
                />
                <ColorSwatch
                  color={template.colorScheme.secondary}
                  label="Secondary"
                />
                <ColorSwatch
                  color={template.colorScheme.accent}
                  label="Accent"
                />
                <ColorSwatch
                  color={template.colorScheme.background}
                  label="Background"
                />
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <h4 className="font-semibold">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{template.metadata.componentCount}</div>
                <div className="text-xs text-muted-foreground">Components</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold capitalize">{template.metadata.difficulty}</div>
                <div className="text-xs text-muted-foreground">Difficulty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{template.metadata.estimatedBuildTime}</div>
                <div className="text-xs text-muted-foreground">Build Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {template.metadata.responsive ? "✓" : "✗"}
                </div>
                <div className="text-xs text-muted-foreground">Responsive</div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {onApply && (
            <Button
              onClick={() => onApply(template)}
              disabled={isApplying}
              className="min-w-[140px]"
            >
              {isApplying ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Applying...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Use Template
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Color swatch component
 */
function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 rounded-lg border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono text-muted-foreground">{color}</span>
    </div>
  );
}

export default TemplatePreviewModal;
