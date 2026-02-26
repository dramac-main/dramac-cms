"use client";

/**
 * Site Branding Settings
 * 
 * THE central location for all site branding: logo, favicon, colors, fonts.
 * Changes here affect the ENTIRE published site — all pages, all modules,
 * all components. The AI designer also reads these values.
 * Email templates use the logo and colors from here for customer-facing emails.
 * 
 * This writes to sites.settings flat fields (primary_color, font_heading, logo_url, etc.)
 * AND to sites.settings.theme (for AI designer compatibility).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Paintbrush, Type, Eye, RotateCcw, Upload, ImageIcon, Trash2, Globe } from "lucide-react";
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
  uploadSiteLogoAction,
  removeSiteLogoAction,
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [branding, setBranding] = useState<SiteBrandingData>({
    primary_color: "",
    secondary_color: "",
    accent_color: "",
    background_color: "#ffffff",
    text_color: "#0f172a",
    font_heading: "",
    font_body: "",
    logo_url: "",
    favicon_url: "",
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

  const handleFileUpload = async (file: File, type: "logo" | "favicon") => {
    const setUploading = type === "logo" ? setIsUploadingLogo : setIsUploadingFavicon;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("siteId", siteId);
      formData.append("type", type);
      const result = await uploadSiteLogoAction(formData);
      if (result.url) {
        const field = type === "favicon" ? "favicon_url" : "logo_url";
        setBranding((prev) => ({ ...prev, [field]: result.url! }));
        toast.success(`${type === "logo" ? "Logo" : "Favicon"} uploaded successfully!`);
      } else {
        toast.error(result.error || `Failed to upload ${type}`);
      }
    } catch {
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (type: "logo" | "favicon") => {
    const result = await removeSiteLogoAction(siteId, type);
    if (result.success) {
      const field = type === "favicon" ? "favicon_url" : "logo_url";
      setBranding((prev) => ({ ...prev, [field]: "" }));
      toast.success(`${type === "logo" ? "Logo" : "Favicon"} removed.`);
    } else {
      toast.error(result.error || `Failed to remove ${type}`);
    }
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
      {/* Logo & Favicon Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Logo & Favicon</CardTitle>
              <CardDescription>
                Your site logo appears on every page, in emails sent to customers, and anywhere your brand is shown.
                The favicon appears in browser tabs.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Site Logo</Label>
              <p className="text-xs text-muted-foreground">Used in navigation, emails, invoices, and all branded content. Recommended: 400×100px PNG or SVG.</p>
              <div className="flex items-start gap-3">
                {branding.logo_url ? (
                  <div className="relative group">
                    <div className="h-20 w-40 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={branding.logo_url} alt="Site logo" className="max-h-full max-w-full object-contain p-2" />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage("logo")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="h-20 w-40 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Upload logo</span>
                      </>
                    )}
                  </div>
                )}
                {branding.logo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                    Replace
                  </Button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "logo");
                  e.target.value = "";
                }}
              />
            </div>

            {/* Favicon Upload */}
            <div className="space-y-3">
              <Label>Favicon</Label>
              <p className="text-xs text-muted-foreground">Appears in browser tabs. Recommended: 32×32px PNG or ICO.</p>
              <div className="flex items-start gap-3">
                {branding.favicon_url ? (
                  <div className="relative group">
                    <div className="h-16 w-16 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={branding.favicon_url} alt="Favicon" className="max-h-full max-w-full object-contain p-1" />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage("favicon")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    {isUploadingFavicon ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Globe className="h-4 w-4 text-muted-foreground mb-0.5" />
                        <span className="text-[10px] text-muted-foreground">Upload</span>
                      </>
                    )}
                  </div>
                )}
                {branding.favicon_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={isUploadingFavicon}
                  >
                    {isUploadingFavicon ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                    Replace
                  </Button>
                )}
              </div>
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/png,image/x-icon,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "favicon");
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
            Your logo, colors, and fonts are used across all pages, navigation, booking module, shop, email templates, and every component.
            Customer-facing emails (booking confirmations, order receipts) will show your site logo and colors.
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
