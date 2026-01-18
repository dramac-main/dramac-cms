"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface SeoFormData {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalUrl: string;
}

interface SeoFormProps {
  data: Partial<SeoFormData>;
  onChange: (data: Partial<SeoFormData>) => void;
  disabled?: boolean;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
}

export function SeoForm({
  data,
  onChange,
  disabled = false,
  titlePlaceholder = "Page Title",
  descriptionPlaceholder = "Page description...",
}: SeoFormProps) {
  const handleChange = <K extends keyof SeoFormData>(
    field: K,
    value: SeoFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Basic SEO */}
      <Card>
        <CardHeader>
          <CardTitle>Basic SEO</CardTitle>
          <CardDescription>
            How this page appears in search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SEO Title</Label>
            <Input
              value={data.seoTitle || ""}
              onChange={(e) => handleChange("seoTitle", e.target.value)}
              placeholder={titlePlaceholder}
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recommended: 50-60 characters</span>
              <span className={
                (data.seoTitle?.length || 0) > 60 
                  ? "text-yellow-600" 
                  : ""
              }>
                {data.seoTitle?.length || 0}/60
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea
              value={data.seoDescription || ""}
              onChange={(e) => handleChange("seoDescription", e.target.value)}
              placeholder={descriptionPlaceholder}
              rows={3}
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recommended: 150-160 characters</span>
              <span className={
                (data.seoDescription?.length || 0) > 160 
                  ? "text-yellow-600" 
                  : ""
              }>
                {data.seoDescription?.length || 0}/160
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keywords</Label>
            <Input
              value={data.seoKeywords?.join(", ") || ""}
              onChange={(e) => handleChange(
                "seoKeywords",
                e.target.value.split(",").map(k => k.trim()).filter(Boolean)
              )}
              placeholder="keyword1, keyword2, keyword3"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of keywords (3-5 recommended)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Open Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Social Sharing</CardTitle>
          <CardDescription>
            How this page appears when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>OG Title</Label>
            <Input
              value={data.ogTitle || ""}
              onChange={(e) => handleChange("ogTitle", e.target.value)}
              placeholder={data.seoTitle || titlePlaceholder}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use SEO title
            </p>
          </div>

          <div className="space-y-2">
            <Label>OG Description</Label>
            <Textarea
              value={data.ogDescription || ""}
              onChange={(e) => handleChange("ogDescription", e.target.value)}
              placeholder={data.seoDescription || descriptionPlaceholder}
              rows={2}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use meta description
            </p>
          </div>

          <div className="space-y-2">
            <Label>OG Image URL</Label>
            <Input
              value={data.ogImageUrl || ""}
              onChange={(e) => handleChange("ogImageUrl", e.target.value)}
              placeholder="https://..."
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x630px for best display
            </p>
            {data.ogImageUrl && (
              <div className="mt-2 border rounded-lg p-2 max-w-xs">
                <img 
                  src={data.ogImageUrl} 
                  alt="OG Preview" 
                  className="max-h-24 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Additional SEO controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Canonical URL</Label>
            <Input
              value={data.canonicalUrl || ""}
              onChange={(e) => handleChange("canonicalUrl", e.target.value)}
              placeholder="https://..."
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Use if this content exists at another URL (prevents duplicate content issues)
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Indexing</Label>
              <p className="text-sm text-muted-foreground">
                Let search engines index this page
              </p>
            </div>
            <Switch
              checked={data.robotsIndex ?? true}
              onCheckedChange={(checked) => handleChange("robotsIndex", checked)}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Link Following</Label>
              <p className="text-sm text-muted-foreground">
                Let search engines follow links on this page
              </p>
            </div>
            <Switch
              checked={data.robotsFollow ?? true}
              onCheckedChange={(checked) => handleChange("robotsFollow", checked)}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
