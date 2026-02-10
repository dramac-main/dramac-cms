/**
 * DRAMAC Studio SEO Settings Panel
 * 
 * Panel for configuring page SEO metadata including title, description,
 * keywords, Open Graph, and structured data.
 * Created in PHASE-STUDIO-29.
 */

"use client";

import { memo, useState, useCallback } from "react";
import {
  Search,
  Globe,
  Image,
  Share2,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface SEOSettings {
  // Basic Meta
  title: string;
  description: string;
  keywords: string[];
  
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  
  // Twitter Card
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  
  // Advanced
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: string;
}

interface SEOSettingsPanelProps {
  settings: SEOSettings;
  onChange: (settings: SEOSettings) => void;
  pageUrl?: string;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface FieldLabelProps {
  label: string;
  tooltip?: string;
  required?: boolean;
}

function FieldLabel({ label, tooltip, required }: FieldLabelProps) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface CharacterCountProps {
  current: number;
  max: number;
  optimal?: { min: number; max: number };
}

function CharacterCount({ current, max, optimal }: CharacterCountProps) {
  const isOverLimit = current > max;
  const isOptimal = optimal && current >= optimal.min && current <= optimal.max;
  const isUnderOptimal = optimal && current < optimal.min;
  
  return (
    <div className="flex items-center gap-2 mt-1">
      <span
        className={cn(
          "text-xs",
          isOverLimit && "text-destructive",
          isOptimal && "text-green-600",
          isUnderOptimal && "text-amber-600",
          !isOverLimit && !isOptimal && !isUnderOptimal && "text-muted-foreground"
        )}
      >
        {current}/{max}
      </span>
      {optimal && (
        <span className="text-xs text-muted-foreground">
          (Optimal: {optimal.min}-{optimal.max})
        </span>
      )}
      {isOptimal && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
      {isOverLimit && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
    </div>
  );
}

// =============================================================================
// SEO SCORE CALCULATOR
// =============================================================================

interface SEOScore {
  score: number;
  issues: string[];
  suggestions: string[];
}

function calculateSEOScore(settings: SEOSettings): SEOScore {
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Title check (25 points)
  if (settings.title) {
    if (settings.title.length >= 30 && settings.title.length <= 60) {
      score += 25;
    } else if (settings.title.length > 0) {
      score += 15;
      if (settings.title.length < 30) {
        suggestions.push("Title is too short. Aim for 30-60 characters.");
      } else {
        issues.push("Title is too long. Keep it under 60 characters.");
      }
    }
  } else {
    issues.push("Missing page title.");
  }
  
  // Description check (25 points)
  if (settings.description) {
    if (settings.description.length >= 120 && settings.description.length <= 160) {
      score += 25;
    } else if (settings.description.length > 0) {
      score += 15;
      if (settings.description.length < 120) {
        suggestions.push("Description is too short. Aim for 120-160 characters.");
      } else {
        issues.push("Description is too long. Keep it under 160 characters.");
      }
    }
  } else {
    issues.push("Missing meta description.");
  }
  
  // Keywords check (10 points)
  if (settings.keywords && settings.keywords.length > 0) {
    score += 10;
    if (settings.keywords.length > 10) {
      suggestions.push("Consider reducing keywords. 5-10 targeted keywords is ideal.");
    }
  } else {
    suggestions.push("Add relevant keywords for better targeting.");
  }
  
  // Open Graph check (20 points)
  if (settings.ogTitle || settings.title) {
    score += 5;
  } else {
    suggestions.push("Add Open Graph title for social sharing.");
  }
  
  if (settings.ogDescription || settings.description) {
    score += 5;
  } else {
    suggestions.push("Add Open Graph description for social sharing.");
  }
  
  if (settings.ogImage) {
    score += 10;
  } else {
    suggestions.push("Add an Open Graph image for better social media appearance.");
  }
  
  // Twitter Card check (10 points)
  if (settings.twitterCard) {
    score += 5;
  }
  if (settings.twitterImage || settings.ogImage) {
    score += 5;
  }
  
  // Canonical URL check (10 points)
  if (settings.canonicalUrl) {
    score += 10;
  } else {
    suggestions.push("Consider adding a canonical URL to avoid duplicate content issues.");
  }
  
  return { score, issues, suggestions };
}

// =============================================================================
// GOOGLE PREVIEW COMPONENT
// =============================================================================

interface GooglePreviewProps {
  title: string;
  description: string;
  url: string;
}

function GooglePreview({ title, description, url }: GooglePreviewProps) {
  const displayTitle = title || "Page Title";
  const displayDescription = description || "Add a meta description to see how your page appears in search results.";
  const displayUrl = url || "https://example.com/page";
  
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-card">
      <p className="text-xs text-muted-foreground mb-2">Google Search Preview</p>
      <div className="space-y-1">
        <p className="text-sm text-green-700 truncate">{displayUrl}</p>
        <p className="text-lg text-blue-600 hover:underline cursor-pointer line-clamp-1">
          {displayTitle}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2">{displayDescription}</p>
      </div>
    </div>
  );
}

// =============================================================================
// SOCIAL PREVIEW COMPONENT
// =============================================================================

interface SocialPreviewProps {
  title: string;
  description: string;
  image?: string;
  platform: "facebook" | "twitter";
}

function SocialPreview({ title, description, image, platform }: SocialPreviewProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-card">
      <p className="text-xs text-muted-foreground p-2 border-b">
        {platform === "facebook" ? "Facebook" : "Twitter/X"} Preview
      </p>
      {image ? (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <img src={image} alt="Social preview" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <Image className="h-12 w-12 text-muted-foreground/50" />
        </div>
      )}
      <div className="p-3 border-t">
        <p className="text-sm font-medium line-clamp-1">{title || "Page Title"}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {description || "Page description will appear here."}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const SEOSettingsPanel = memo(function SEOSettingsPanel({
  settings,
  onChange,
  pageUrl = "",
}: SEOSettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<string>("basic");
  const [showPreview, setShowPreview] = useState(false);
  
  const seoScore = calculateSEOScore(settings);
  
  const updateField = useCallback(
    <K extends keyof SEOSettings>(field: K, value: SEOSettings[K]) => {
      onChange({ ...settings, [field]: value });
    },
    [settings, onChange]
  );
  
  const handleKeywordsChange = useCallback(
    (value: string) => {
      const keywords = value
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      updateField("keywords", keywords);
    },
    [updateField]
  );
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          <span>SEO</span>
          <Badge
            variant={seoScore.score >= 80 ? "default" : seoScore.score >= 50 ? "secondary" : "destructive"}
            className="ml-1"
          >
            {seoScore.score}%
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Settings
          </SheetTitle>
          <SheetDescription>
            Optimize your page for search engines and social sharing.
          </SheetDescription>
        </SheetHeader>
        
        {/* SEO Score */}
        <div className="mt-6 p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">SEO Score</span>
            <span
              className={cn(
                "text-lg font-bold",
                seoScore.score >= 80 && "text-green-600",
                seoScore.score >= 50 && seoScore.score < 80 && "text-amber-600",
                seoScore.score < 50 && "text-destructive"
              )}
            >
              {seoScore.score}%
            </span>
          </div>
          <Progress
            value={seoScore.score}
            className={cn(
              "h-2",
              seoScore.score >= 80 && "[&>div]:bg-green-600",
              seoScore.score >= 50 && seoScore.score < 80 && "[&>div]:bg-amber-500",
              seoScore.score < 50 && "[&>div]:bg-destructive"
            )}
          />
          {(seoScore.issues.length > 0 || seoScore.suggestions.length > 0) && (
            <div className="mt-3 space-y-1">
              {seoScore.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
              {seoScore.suggestions.slice(0, 2).map((suggestion, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-600">
                  <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Separator className="my-6" />
        
        {/* Basic Meta Section */}
        <Collapsible
          open={activeSection === "basic"}
          onOpenChange={(open) => setActiveSection(open ? "basic" : "")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">Basic Meta Tags</span>
            </div>
            {activeSection === "basic" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div>
              <FieldLabel
                label="Page Title"
                tooltip="The title that appears in search results and browser tabs. Keep it between 30-60 characters."
                required
              />
              <Input
                value={settings.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter page title..."
                maxLength={70}
              />
              <CharacterCount
                current={settings.title.length}
                max={70}
                optimal={{ min: 30, max: 60 }}
              />
            </div>
            
            <div>
              <FieldLabel
                label="Meta Description"
                tooltip="A brief summary of the page shown in search results. Keep it between 120-160 characters."
                required
              />
              <Textarea
                value={settings.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Enter meta description..."
                maxLength={200}
                rows={3}
              />
              <CharacterCount
                current={settings.description.length}
                max={200}
                optimal={{ min: 120, max: 160 }}
              />
            </div>
            
            <div>
              <FieldLabel
                label="Keywords"
                tooltip="Comma-separated keywords relevant to your page content."
              />
              <Input
                value={settings.keywords?.join(", ") || ""}
                onChange={(e) => handleKeywordsChange(e.target.value)}
                placeholder="keyword1, keyword2, keyword3..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate keywords with commas
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <Separator className="my-4" />
        
        {/* Open Graph Section */}
        <Collapsible
          open={activeSection === "og"}
          onOpenChange={(open) => setActiveSection(open ? "og" : "")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Social Sharing (Open Graph)</span>
            </div>
            {activeSection === "og" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div>
              <FieldLabel
                label="OG Title"
                tooltip="Title for social media shares. Defaults to page title if empty."
              />
              <Input
                value={settings.ogTitle || ""}
                onChange={(e) => updateField("ogTitle", e.target.value)}
                placeholder={settings.title || "Same as page title..."}
              />
            </div>
            
            <div>
              <FieldLabel
                label="OG Description"
                tooltip="Description for social media shares. Defaults to meta description if empty."
              />
              <Textarea
                value={settings.ogDescription || ""}
                onChange={(e) => updateField("ogDescription", e.target.value)}
                placeholder={settings.description || "Same as meta description..."}
                rows={2}
              />
            </div>
            
            <div>
              <FieldLabel
                label="OG Image URL"
                tooltip="Image shown when sharing on social media. Recommended size: 1200x630px."
              />
              <Input
                value={settings.ogImage || ""}
                onChange={(e) => updateField("ogImage", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            {/* Social Preview */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <SocialPreview
                title={settings.ogTitle || settings.title}
                description={settings.ogDescription || settings.description}
                image={settings.ogImage}
                platform="facebook"
              />
              <SocialPreview
                title={settings.twitterTitle || settings.ogTitle || settings.title}
                description={settings.twitterDescription || settings.ogDescription || settings.description}
                image={settings.twitterImage || settings.ogImage}
                platform="twitter"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <Separator className="my-4" />
        
        {/* Advanced Section */}
        <Collapsible
          open={activeSection === "advanced"}
          onOpenChange={(open) => setActiveSection(open ? "advanced" : "")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium">Advanced Settings</span>
            </div>
            {activeSection === "advanced" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div>
              <FieldLabel
                label="Canonical URL"
                tooltip="The preferred URL for this page. Helps prevent duplicate content issues."
              />
              <Input
                value={settings.canonicalUrl || ""}
                onChange={(e) => updateField("canonicalUrl", e.target.value)}
                placeholder="https://example.com/preferred-url"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">No Index</Label>
                <p className="text-xs text-muted-foreground">
                  Prevent search engines from indexing this page
                </p>
              </div>
              <Switch
                checked={settings.noIndex || false}
                onCheckedChange={(checked) => updateField("noIndex", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">No Follow</Label>
                <p className="text-xs text-muted-foreground">
                  Prevent search engines from following links on this page
                </p>
              </div>
              <Switch
                checked={settings.noFollow || false}
                onCheckedChange={(checked) => updateField("noFollow", checked)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <Separator className="my-4" />
        
        {/* Google Preview */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="font-medium">Search Preview</span>
            </div>
          </div>
          <GooglePreview
            title={settings.title}
            description={settings.description}
            url={pageUrl}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default SEOSettingsPanel;
