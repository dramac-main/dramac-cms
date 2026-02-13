"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Info } from "lucide-react";
import { icons } from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModuleConfigFormProps {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  pricingTier: string;
  dependencies: string[];
  onChange: (field: string, value: unknown) => void;
  isNew?: boolean;
}

const CATEGORIES = [
  { value: "analytics", label: "Analytics & Tracking", icon: "BarChart3" },
  { value: "seo", label: "SEO & Marketing", icon: "Search" },
  { value: "ecommerce", label: "E-Commerce", icon: "ShoppingCart" },
  { value: "forms", label: "Forms & Lead Gen", icon: "FileText" },
  { value: "chat", label: "Chat & Support", icon: "MessageCircle" },
  { value: "social", label: "Social Media", icon: "Share2" },
  { value: "content", label: "Content & Media", icon: "Clapperboard" },
  { value: "security", label: "Security & Privacy", icon: "Lock" },
  { value: "performance", label: "Performance", icon: "Zap" },
  { value: "integration", label: "Integrations", icon: "Link" },
  { value: "other", label: "Other", icon: "Package" },
];

const PRICING_TIERS = [
  { 
    value: "free", 
    label: "Free", 
    description: "No charge",
    color: "bg-muted text-muted-foreground" 
  },
  { 
    value: "starter", 
    label: "Starter", 
    description: "$125-$400/mo",
    color: "bg-muted text-muted-foreground" 
  },
  { 
    value: "pro", 
    label: "Pro", 
    description: "$500-$1,300/mo",
    color: "bg-muted text-muted-foreground" 
  },
  { 
    value: "enterprise", 
    label: "Enterprise", 
    description: "$2,600+/mo",
    color: "bg-muted text-muted-foreground" 
  },
];

const ICON_SUGGESTIONS = [
  "BarChart3", "TrendingUp", "Search", "MessageCircle", "Mail", "ShoppingCart", "CreditCard", "Lock", "Zap",
  "Palette", "Smartphone", "Globe", "FileText", "Link", "Target", "Megaphone", "Lightbulb", "Rocket",
  "Star", "Bell", "Calendar", "FolderOpen", "HardDrive", "RefreshCw", "CircleCheck", "Tag", "Pin",
];

export function ModuleConfigForm({
  name,
  slug,
  description,
  icon,
  category,
  pricingTier,
  dependencies,
  onChange,
  isNew = false,
}: ModuleConfigFormProps) {
  const [newDep, setNewDep] = useState("");
  const [showAllIcons, setShowAllIcons] = useState(false);

  const addDependency = useCallback(() => {
    const trimmedDep = newDep.trim();
    if (trimmedDep && !dependencies.includes(trimmedDep)) {
      onChange("dependencies", [...dependencies, trimmedDep]);
      setNewDep("");
    }
  }, [newDep, dependencies, onChange]);

  const removeDependency = useCallback((dep: string) => {
    onChange("dependencies", dependencies.filter((d) => d !== dep));
  }, [dependencies, onChange]);

  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  const handleNameChange = useCallback((newName: string) => {
    onChange("name", newName);
    // Auto-generate slug if it's a new module and slug matches the old generated slug
    if (isNew && (!slug || slug === generateSlug(name))) {
      onChange("slug", generateSlug(newName));
    }
  }, [isNew, slug, name, onChange, generateSlug]);

  const displayedIcons = showAllIcons ? ICON_SUGGESTIONS : ICON_SUGGESTIONS.slice(0, 18);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Configuration</CardTitle>
        <CardDescription>
          Basic settings and metadata for your module
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Name & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Module Name
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Awesome Module"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="slug">
                Slug
                <span className="text-destructive ml-1">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      URL-friendly identifier used in links and API calls.
                      Can only contain lowercase letters, numbers, and hyphens.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => onChange("slug", e.target.value)}
              placeholder="my-awesome-module"
              disabled={!isNew}
              className={!isNew ? "bg-muted" : ""}
            />
            {!isNew && (
              <p className="text-xs text-muted-foreground">
                Slug cannot be changed after creation
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Describe what your module does and its key features..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 characters
          </p>
        </div>

        {/* Icon Selection */}
        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="flex items-start gap-4">
            <div className="border rounded-lg p-3 bg-muted/50 flex-shrink-0 flex items-center justify-center w-16 h-16">
              {(() => {
                const iconName = resolveIconName(icon);
                const LucideIcon = icons[iconName as keyof typeof icons] || icons.Package;
                return <LucideIcon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />;
              })()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-1">
                {displayedIcons.map((iconName) => {
                  const LucideIcon = icons[iconName as keyof typeof icons] || icons.Package;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      className={`p-2 rounded-md transition-colors hover:bg-muted ${
                        icon === iconName 
                          ? "bg-primary/20 ring-2 ring-primary" 
                          : ""
                      }`}
                      onClick={() => onChange("icon", iconName)}
                      title={iconName}
                    >
                      <LucideIcon className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  );
                })}
              </div>
              {ICON_SUGGESTIONS.length > 18 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowAllIcons(!showAllIcons)}
                >
                  {showAllIcons ? "Show less" : `Show ${ICON_SUGGESTIONS.length - 18} more`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Category & Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => onChange("category", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pricing Tier</Label>
            <Select
              value={pricingTier}
              onValueChange={(v) => onChange("pricingTier", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pricing" />
              </SelectTrigger>
              <SelectContent>
                {PRICING_TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tier.color}`}>
                        {tier.label}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {tier.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dependencies */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Dependencies</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Other modules that must be installed for this module to work.
                    Enter the module slug/ID.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Input
              value={newDep}
              onChange={(e) => setNewDep(e.target.value)}
              placeholder="module-slug"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDependency();
                }
              }}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addDependency}
              disabled={!newDep.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {dependencies.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {dependencies.map((dep) => (
                <Badge 
                  key={dep} 
                  variant="secondary" 
                  className="gap-1 pr-1"
                >
                  {dep}
                  <button
                    type="button"
                    onClick={() => removeDependency(dep)}
                    className="ml-1 hover:text-destructive rounded-sm p-0.5 hover:bg-destructive/10 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No dependencies added. This module will work standalone.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
