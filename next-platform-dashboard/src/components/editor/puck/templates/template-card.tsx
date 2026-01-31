/**
 * Template Card Component
 * PHASE-ED-07A: Template System - Categories
 * 
 * Individual template display card with thumbnail, metadata, tags,
 * and quick actions (preview, apply).
 */

"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  Download,
  Star,
  Sparkles,
  Clock,
  Layers,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PuckTemplate } from "@/types/puck-templates";
import { getCategoryIcon, getCategoryLabel, getCategoryColor } from "@/lib/templates/puck-template-categories";

interface TemplateCardProps {
  template: PuckTemplate;
  onPreview?: () => void;
  onApply?: () => void;
  isSelected?: boolean;
  isApplying?: boolean;
  compact?: boolean;
}

export function TemplateCard({
  template,
  onPreview,
  onApply,
  isSelected,
  isApplying,
  compact = false,
}: TemplateCardProps) {
  const categoryColor = getCategoryColor(template.category);
  
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary",
        compact ? "p-2" : "p-0"
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "relative bg-muted overflow-hidden",
          compact ? "aspect-[4/3] rounded-md" : "aspect-video"
        )}
      >
        {/* Placeholder or actual thumbnail */}
        {template.thumbnail && template.thumbnail !== "/templates/blank.svg" ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl"
            style={{ backgroundColor: `${categoryColor}10` }}
          >
            {getCategoryIcon(template.category)}
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          {onPreview && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview();
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Preview</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onApply && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply();
                    }}
                    disabled={isApplying}
                  >
                    {isApplying ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Use
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Apply Template</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
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
          {template.isFeatured && !template.isPremium && !template.isNew && (
            <Badge variant="secondary">Featured</Badge>
          )}
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn("space-y-2", compact ? "pt-2" : "p-4")}>
        {/* Title & Category */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold truncate",
              compact ? "text-sm" : "text-base"
            )}>
              {template.name}
            </h3>
            {!compact && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {template.description}
              </p>
            )}
          </div>
        </div>

        {/* Category badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              borderColor: categoryColor,
              color: categoryColor,
            }}
          >
            {getCategoryIcon(template.category)} {getCategoryLabel(template.category)}
          </Badge>
        </div>

        {/* Meta info (non-compact only) */}
        {!compact && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {template.metadata.componentCount}
                </TooltipTrigger>
                <TooltipContent>Components</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {template.metadata.estimatedBuildTime}
                </TooltipTrigger>
                <TooltipContent>Build Time</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="capitalize">{template.metadata.difficulty}</span>
          </div>
        )}

        {/* Tags (non-compact only) */}
        {!compact && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default TemplateCard;
