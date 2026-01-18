"use client";

/**
 * Template Selector for Site Creation
 * Phase 68: Industry Templates UI
 * 
 * Compact template selector for use in site creation wizards.
 */

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TemplateGallery } from "./template-gallery";
import { INDUSTRIES } from "@/lib/templates/template-types";
import type { Template } from "@/lib/templates/template-types";

interface TemplateSelectorProps {
  selectedTemplate: Template | null;
  onSelect: (template: Template | null) => void;
  triggerLabel?: string;
}

export function TemplateSelector({
  selectedTemplate,
  onSelect,
  triggerLabel = "Choose a template",
}: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (template: Template) => {
    onSelect(template);
    setOpen(false);
  };

  const industry = selectedTemplate
    ? INDUSTRIES.find((i) => i.id === selectedTemplate.industry)
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-auto py-3"
          type="button"
        >
          {selectedTemplate ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center text-2xl bg-muted rounded-md">
                {industry?.icon || "🌐"}
              </div>
              <div className="text-left">
                <div className="font-medium">{selectedTemplate.name}</div>
                <div className="text-sm text-muted-foreground">
                  {industry?.label}
                </div>
              </div>
              <Badge variant="default" className="ml-2 bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{triggerLabel}</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[calc(85vh-100px)] pr-2">
          <TemplateGallery
            onSelect={handleSelect}
            showSelectButton
            selectedTemplateId={selectedTemplate?.id}
            compact
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick template picker showing popular templates
 */
import { getPopularTemplates } from "@/lib/templates/template-data";

interface QuickTemplateSelectorProps {
  selectedTemplate: Template | null;
  onSelect: (template: Template) => void;
  onViewAll: () => void;
}

export function QuickTemplateSelector({
  selectedTemplate,
  onSelect,
  onViewAll,
}: QuickTemplateSelectorProps) {
  const popularTemplates = getPopularTemplates(4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {popularTemplates.map((template) => {
          const industry = INDUSTRIES.find((i) => i.id === template.industry);
          const isSelected = selectedTemplate?.id === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={`flex items-center gap-3 p-3 border rounded-lg text-left transition-colors hover:bg-muted/50 ${
                isSelected ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center text-2xl bg-muted rounded-md shrink-0">
                {industry?.icon || "🌐"}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{template.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {industry?.label}
                </div>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary shrink-0 ml-auto" />
              )}
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onViewAll}
      >
        View All Templates
      </Button>
    </div>
  );
}
