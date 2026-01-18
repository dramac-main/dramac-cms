"use client";

/**
 * Template Card Component
 * Phase 68: Industry Templates UI
 * 
 * Displays a single template with preview image, info, and actions.
 */

import Image from "next/image";
import { Eye, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES } from "@/lib/templates/template-types";
import type { Template } from "@/lib/templates/template-types";
import { useState } from "react";

interface TemplateCardProps {
  template: Template;
  onPreview?: () => void;
  onSelect?: () => void;
  selected?: boolean;
}

export function TemplateCard({ template, onPreview, onSelect, selected }: TemplateCardProps) {
  const [imageError, setImageError] = useState(false);
  const industry = INDUSTRIES.find((i) => i.id === template.industry);

  return (
    <Card className={`overflow-hidden group transition-all ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className="relative aspect-[4/3] bg-muted">
        {template.thumbnail && !imageError ? (
          <Image
            src={template.thumbnail}
            alt={template.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <TemplatePlaceholder
            icon={industry?.icon || "🌐"}
            name={template.name}
            colorScheme={template.colorScheme}
          />
        )}

        {/* Popularity indicator */}
        {template.popularity >= 90 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="default" className="bg-yellow-500 text-black">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Popular
            </Badge>
          </div>
        )}

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="default" className="bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              Selected
            </Badge>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          {onSelect && (
            <Button size="sm" onClick={onSelect}>
              <Check className="h-4 w-4 mr-1" />
              {selected ? "Selected" : "Select"}
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
        <Badge variant="secondary">
          {industry?.icon} {industry?.label}
        </Badge>
        {template.features.slice(0, 2).map((feature) => (
          <Badge key={feature} variant="outline" className="text-xs">
            {feature}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}

/**
 * Placeholder when no thumbnail image is available
 */
function TemplatePlaceholder({
  icon,
  name,
  colorScheme,
}: {
  icon: string;
  name: string;
  colorScheme?: Template["colorScheme"];
}) {
  const bgColor = colorScheme?.secondary || "#f5f5f5";
  const primaryColor = colorScheme?.primary || "#6366f1";
  
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-5xl">{icon}</span>
      <span
        className="text-xs font-medium px-2 text-center"
        style={{ color: primaryColor }}
      >
        {name}
      </span>
    </div>
  );
}
