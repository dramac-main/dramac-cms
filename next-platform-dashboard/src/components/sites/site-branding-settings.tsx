"use client";

/**
 * Site Branding Settings
 * 
 * THE central location for all site branding: colors, fonts, everything.
 * Changes here affect the ENTIRE published site — all pages, all modules,
 * all components. The AI designer also reads these values.
 * 
 * This writes to sites.settings flat fields (primary_color, font_heading, etc.)
 * AND to sites.settings.theme (for AI designer compatibility).
 */

import { useState, useEffect, useCallback } from "react";
import { Loader2, Paintbrush, Type, Eye, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getSiteBrandingAction,
  updateSiteBrandingAction,
  type SiteBrandingData,
} from "@/lib/actions/sites";

// Popular Google Fonts for websites
const FONT_OPTIONS = [
  { label: "System Default", value: "" },
  { label: "Inter", value: "Inter" },
  { label: "Poppins", value: "Poppins" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Raleway", value: "Raleway" },
  { label: "Nunito", value: "Nunito" },
  { label: "Source Sans 3", value: "Source Sans 3" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Space Grotesk", value: "Space Grotesk" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Oswald", value: "Oswald" },
  { label: "Work Sans", value: "Work Sans" },
  { label: "Manrope", value: "Manrope" },
  { label: "Plus Jakarta Sans", value: "Plus Jakarta Sans" },
];

interface SiteBrandingSettingsProps {
  siteId: string;
}

export function SiteBrandingSettings({ siteId }: SiteBrandingSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [branding, setBranding] = useState<SiteBrandingData>({
    primary_color: "",
    secondary_color: "",
    accent_color: "",
    background_color: "#ffffff",
    text_color: "#0f172a",
    font_heading: "",
    font_body: "",
  });

  const loadBranding = useCallback(async () => {
    setIsLoading(true);
    const result = await getSiteBrandingAction(siteId);
    if (result.data) {
      setBranding(result.data);
    } else if (result.error) {
      toast.error("Failed to load branding settings");
    }
    setIsLoading(false);
  }, [siteId]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateSiteBrandingAction(siteId, branding);
    if (result.success) {
      toast.success("Branding saved! Changes will appear on your published site.");
    } else {
      toast.error(result.error || "Failed to save branding");
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof SiteBrandingData, value: string) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading branding...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Colors Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                These colors are used across your entire website — pages, modules, navigation, buttons, everything.
                The AI designer will also use these when generating content.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary & Secondary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <p className="text-xs text-muted-foreground">Main brand color — used for buttons, links, highlights</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary_color"
                  value={branding.primary_color || "#3b82f6"}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.primary_color}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <p className="text-xs text-muted-foreground">Supporting brand color — used for secondary buttons, accents</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondary_color"
                  value={branding.secondary_color || "#6366f1"}
                  onChange={(e) => updateField("secondary_color", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.secondary_color}
                  onChange={(e) => updateField("secondary_color", e.target.value)}
                  placeholder="#6366f1"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Accent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent Color</Label>
              <p className="text-xs text-muted-foreground">Highlight color — used for badges, alerts, CTAs</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="accent_color"
                  value={branding.accent_color || "#f59e0b"}
                  onChange={(e) => updateField("accent_color", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.accent_color}
                  onChange={(e) => updateField("accent_color", e.target.value)}
                  placeholder="#f59e0b"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Background & Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="background_color">Background Color</Label>
              <p className="text-xs text-muted-foreground">Page background — usually white or very light</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="background_color"
                  value={branding.background_color || "#ffffff"}
                  onChange={(e) => updateField("background_color", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.background_color}
                  onChange={(e) => updateField("background_color", e.target.value)}
                  placeholder="#ffffff"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_color">Text Color</Label>
              <p className="text-xs text-muted-foreground">Default text color — usually dark</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="text_color"
                  value={branding.text_color || "#0f172a"}
                  onChange={(e) => updateField("text_color", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.text_color}
                  onChange={(e) => updateField("text_color", e.target.value)}
                  placeholder="#0f172a"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {branding.primary_color && (
            <>
              <Separator />
              <div>
                <Label className="flex items-center gap-1.5 mb-3">
                  <Eye className="h-4 w-4" />
                  Color Preview
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                  {branding.primary_color && (
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: branding.primary_color }} />
                      <span className="text-[10px] text-muted-foreground mt-1 block">Primary</span>
                    </div>
                  )}
                  {branding.secondary_color && (
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: branding.secondary_color }} />
                      <span className="text-[10px] text-muted-foreground mt-1 block">Secondary</span>
                    </div>
                  )}
                  {branding.accent_color && (
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: branding.accent_color }} />
                      <span className="text-[10px] text-muted-foreground mt-1 block">Accent</span>
                    </div>
                  )}
                  {branding.background_color && (
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: branding.background_color }} />
                      <span className="text-[10px] text-muted-foreground mt-1 block">Background</span>
                    </div>
                  )}
                  {branding.text_color && (
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-lg border shadow-sm" style={{ backgroundColor: branding.text_color }} />
                      <span className="text-[10px] text-muted-foreground mt-1 block">Text</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fonts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Font families used across your website. Fonts are loaded from Google Fonts automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <p className="text-xs text-muted-foreground">Used for page titles, section headings, card titles</p>
              <Select
                value={branding.font_heading || ""}
                onValueChange={(v) => updateField("font_heading", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a heading font..." />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value || "system"}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Body Font</Label>
              <p className="text-xs text-muted-foreground">Used for paragraphs, descriptions, form labels</p>
              <Select
                value={branding.font_body || ""}
                onValueChange={(v) => updateField("font_body", v === "system" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a body font..." />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value || "system"}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Font Preview */}
          {(branding.font_heading || branding.font_body) && (
            <>
              <Separator />
              <div className="rounded-lg border p-4 space-y-2" style={{ fontFamily: branding.font_body ? `'${branding.font_body}', sans-serif` : undefined }}>
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: branding.font_heading ? `'${branding.font_heading}', sans-serif` : undefined }}
                >
                  {branding.font_heading || "Default"} Heading Preview
                </h3>
                <p className="text-sm text-muted-foreground">
                  This is a preview of your body font ({branding.font_body || "System Default"}). All paragraphs,
                  descriptions, and form text will use this font across your entire website.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>How it works:</strong> These settings are the central source of truth for your website&apos;s visual identity.
            All pages, navigation, booking module, shop, and every component automatically use these colors and fonts.
            When the AI designer generates content, it reads these settings and uses them as mandatory design tokens.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={loadBranding} disabled={isSaving}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Branding
        </Button>
      </div>
    </div>
  );
}
