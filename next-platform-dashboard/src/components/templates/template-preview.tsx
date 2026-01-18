"use client";

/**
 * Template Preview Modal
 * Phase 68: Industry Templates UI
 * 
 * Full preview of a template with details and selection option.
 */

import Image from "next/image";
import { Check, X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { INDUSTRIES } from "@/lib/templates/template-types";
import type { Template } from "@/lib/templates/template-types";
import { useState } from "react";

interface TemplatePreviewProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (template: Template) => void;
}

export function TemplatePreview({
  template,
  open,
  onOpenChange,
  onSelect,
}: TemplatePreviewProps) {
  const [imageError, setImageError] = useState(false);

  if (!template) return null;

  const industry = INDUSTRIES.find((i) => i.id === template.industry);

  const handleSelect = () => {
    onSelect?.(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{industry?.icon}</span>
            {template.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Preview image */}
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
              {template.thumbnail && !imageError ? (
                <Image
                  src={template.thumbnail}
                  alt={template.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <TemplatePreviewPlaceholder
                  icon={industry?.icon || "🌐"}
                  template={template}
                />
              )}
            </div>

            {/* Details grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{template.description}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Industry</h3>
                  <Badge variant="secondary" className="text-sm">
                    {industry?.icon} {industry?.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {industry?.description}
                  </p>
                </div>

                {template.colorScheme && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color Scheme
                    </h3>
                    <div className="flex gap-2">
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
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Features</h3>
                  <ul className="space-y-1.5">
                    {template.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Page Sections</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {template.sections.map((section) => (
                      <Badge key={section} variant="outline" className="capitalize">
                        {formatSectionName(section)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Popularity Score</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${template.popularity}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{template.popularity}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              {onSelect && (
                <Button onClick={handleSelect}>
                  <Check className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Color swatch display
 */
function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-8 h-8 rounded-md border shadow-sm"
        style={{ backgroundColor: color }}
        title={color}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Placeholder for template preview
 */
function TemplatePreviewPlaceholder({
  icon,
  template,
}: {
  icon: string;
  template: Template;
}) {
  const bgColor = template.colorScheme?.secondary || "#f5f5f5";
  const primaryColor = template.colorScheme?.primary || "#6366f1";

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-7xl">{icon}</span>
      <div className="text-center">
        <h4 className="font-semibold" style={{ color: primaryColor }}>
          {template.name}
        </h4>
        <p className="text-sm text-muted-foreground max-w-md">
          {template.description}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center max-w-md">
        {template.sections.slice(0, 5).map((section) => (
          <Badge key={section} variant="outline" className="capitalize">
            {formatSectionName(section)}
          </Badge>
        ))}
        {template.sections.length > 5 && (
          <Badge variant="outline">+{template.sections.length - 5} more</Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Format section names for display
 */
function formatSectionName(section: string): string {
  return section
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
