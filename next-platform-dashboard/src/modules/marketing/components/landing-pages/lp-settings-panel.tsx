/**
 * LP Settings Panel
 * Phase LPB-02: Studio LP Editor
 *
 * Right sidebar panel for LP-specific settings (shown when no component is selected).
 * Sections: URL & Slug, Branding, Header/Footer, SEO, Conversion, UTM, Schedule, Custom Scripts.
 */
"use client";

import { useState, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Link2,
  Palette,
  PanelTop,
  Search,
  Target,
  Tag,
  Clock,
  Code,
} from "lucide-react";
import { LP_CONVERSION_GOALS } from "../../lib/lp-builder-constants";
import type {
  LPSettings,
  LPBrandingOverride,
} from "../../types/lp-builder-types";

// ─── Types ─────────────────────────────────────────────────────

interface LPSettingsPanelProps {
  slug: string;
  title: string;
  description?: string;
  settings: LPSettings;
  seoConfig?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    noIndex?: boolean;
    canonicalUrl?: string;
  };
  utmConfig?: {
    autoAppendUtm?: boolean;
    defaultSource?: string;
    defaultMedium?: string;
    defaultCampaign?: string;
  };
  conversionGoal: string;
  siteSubdomain?: string;
  siteCustomDomain?: string | null;
  onSlugChange: (slug: string) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onSettingsChange: (settings: Partial<LPSettings>) => void;
  onSeoChange: (seo: Record<string, unknown>) => void;
  onUtmChange: (utm: Record<string, unknown>) => void;
  onConversionGoalChange: (goal: string) => void;
}

// ─── Helpers ───────────────────────────────────────────────────

function buildPreviewUrl(
  slug: string,
  siteSubdomain?: string,
  siteCustomDomain?: string | null,
): string {
  const domain =
    siteCustomDomain ||
    (siteSubdomain ? `${siteSubdomain}.dramac.app` : "yoursite.com");
  return `https://${domain}/lp/${slug}`;
}

// ─── Component ─────────────────────────────────────────────────

export function LPSettingsPanel({
  slug,
  title,
  description,
  settings,
  seoConfig,
  utmConfig,
  conversionGoal,
  siteSubdomain,
  siteCustomDomain,
  onSlugChange,
  onTitleChange,
  onDescriptionChange,
  onSettingsChange,
  onSeoChange,
  onUtmChange,
  onConversionGoalChange,
}: LPSettingsPanelProps) {
  const [brandingEnabled, setBrandingEnabled] = useState(
    !!settings.brandingOverride,
  );

  const previewUrl = buildPreviewUrl(slug, siteSubdomain, siteCustomDomain);

  const handleBrandingToggle = useCallback(
    (enabled: boolean) => {
      setBrandingEnabled(enabled);
      if (!enabled) {
        onSettingsChange({ brandingOverride: null });
      } else {
        onSettingsChange({
          brandingOverride: {
            primaryColor: "",
            secondaryColor: "",
            accentColor: "",
          },
        });
      }
    },
    [onSettingsChange],
  );

  const handleBrandingField = useCallback(
    (field: keyof LPBrandingOverride, value: string) => {
      const current = settings.brandingOverride || {};
      onSettingsChange({
        brandingOverride: { ...current, [field]: value },
      });
    },
    [settings.brandingOverride, onSettingsChange],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Landing Page Settings</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure page settings and SEO
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <Accordion
          type="multiple"
          defaultValue={["url", "header-footer"]}
          className="w-full"
        >
          {/* ─── URL & Slug ──────────────────────────────── */}
          <AccordionItem value="url">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL & Details
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div>
                <Label htmlFor="lp-title" className="text-xs">
                  Title
                </Label>
                <Input
                  id="lp-title"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Landing page title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lp-slug" className="text-xs">
                  URL Slug
                </Label>
                <Input
                  id="lp-slug"
                  value={slug}
                  onChange={(e) =>
                    onSlugChange(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    )
                  }
                  placeholder="my-landing-page"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {previewUrl}
                </p>
              </div>
              <div>
                <Label htmlFor="lp-desc" className="text-xs">
                  Description
                </Label>
                <Textarea
                  id="lp-desc"
                  value={description || ""}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Branding ────────────────────────────────── */}
          <AccordionItem value="branding">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Branding
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Override site branding</Label>
                <Switch
                  checked={brandingEnabled}
                  onCheckedChange={handleBrandingToggle}
                />
              </div>
              {brandingEnabled && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={
                          settings.brandingOverride?.primaryColor || "#3b82f6"
                        }
                        onChange={(e) =>
                          handleBrandingField("primaryColor", e.target.value)
                        }
                        className="h-8 w-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.brandingOverride?.primaryColor || ""}
                        onChange={(e) =>
                          handleBrandingField("primaryColor", e.target.value)
                        }
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={
                          settings.brandingOverride?.secondaryColor || "#6366f1"
                        }
                        onChange={(e) =>
                          handleBrandingField("secondaryColor", e.target.value)
                        }
                        className="h-8 w-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.brandingOverride?.secondaryColor || ""}
                        onChange={(e) =>
                          handleBrandingField("secondaryColor", e.target.value)
                        }
                        placeholder="#6366f1"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Accent Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={
                          settings.brandingOverride?.accentColor || "#f59e0b"
                        }
                        onChange={(e) =>
                          handleBrandingField("accentColor", e.target.value)
                        }
                        className="h-8 w-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.brandingOverride?.accentColor || ""}
                        onChange={(e) =>
                          handleBrandingField("accentColor", e.target.value)
                        }
                        placeholder="#f59e0b"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Logo URL</Label>
                    <Input
                      value={settings.brandingOverride?.logoUrl || ""}
                      onChange={(e) =>
                        handleBrandingField("logoUrl", e.target.value)
                      }
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ─── Header & Footer ─────────────────────────── */}
          <AccordionItem value="header-footer">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <PanelTop className="h-4 w-4" />
                Header & Footer
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show site header</Label>
                <Switch
                  checked={settings.showHeader}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ showHeader: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show site footer</Label>
                <Switch
                  checked={settings.showFooter}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ showFooter: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, your site&apos;s header and footer will wrap the
                landing page content.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* ─── SEO ─────────────────────────────────────── */}
          <AccordionItem value="seo">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                SEO
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div>
                <Label className="text-xs">Meta Title</Label>
                <Input
                  value={seoConfig?.metaTitle || ""}
                  onChange={(e) =>
                    onSeoChange({ ...seoConfig, metaTitle: e.target.value })
                  }
                  placeholder="Page title for search engines"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Meta Description</Label>
                <Textarea
                  value={seoConfig?.metaDescription || ""}
                  onChange={(e) =>
                    onSeoChange({
                      ...seoConfig,
                      metaDescription: e.target.value,
                    })
                  }
                  placeholder="Description for search engines"
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">OG Image URL</Label>
                <Input
                  value={seoConfig?.ogImage || ""}
                  onChange={(e) =>
                    onSeoChange({ ...seoConfig, ogImage: e.target.value })
                  }
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Canonical URL</Label>
                <Input
                  value={seoConfig?.canonicalUrl || ""}
                  onChange={(e) =>
                    onSeoChange({ ...seoConfig, canonicalUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">No Index</Label>
                <Switch
                  checked={seoConfig?.noIndex || false}
                  onCheckedChange={(checked) =>
                    onSeoChange({ ...seoConfig, noIndex: checked })
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Conversion ──────────────────────────────── */}
          <AccordionItem value="conversion">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conversion
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div>
                <Label className="text-xs">Conversion Goal</Label>
                <Select
                  value={conversionGoal}
                  onValueChange={onConversionGoalChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LP_CONVERSION_GOALS.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value}>
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Conversion Value ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={settings.conversionValue || 0}
                  onChange={(e) =>
                    onSettingsChange({
                      conversionValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">
                  Redirect URL (after conversion)
                </Label>
                <Input
                  value={settings.redirectUrl || ""}
                  onChange={(e) =>
                    onSettingsChange({ redirectUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Max Conversions</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.maxConversions ?? ""}
                  onChange={(e) =>
                    onSettingsChange({
                      maxConversions: e.target.value
                        ? parseInt(e.target.value, 10)
                        : null,
                    })
                  }
                  placeholder="Unlimited"
                  className="mt-1"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── UTM Tracking ────────────────────────────── */}
          <AccordionItem value="utm">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                UTM Tracking
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Auto-append UTM params</Label>
                <Switch
                  checked={utmConfig?.autoAppendUtm || false}
                  onCheckedChange={(checked) =>
                    onUtmChange({ ...utmConfig, autoAppendUtm: checked })
                  }
                />
              </div>
              {utmConfig?.autoAppendUtm && (
                <>
                  <div>
                    <Label className="text-xs">Default Source</Label>
                    <Input
                      value={utmConfig?.defaultSource || ""}
                      onChange={(e) =>
                        onUtmChange({
                          ...utmConfig,
                          defaultSource: e.target.value,
                        })
                      }
                      placeholder="e.g. google"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Default Medium</Label>
                    <Input
                      value={utmConfig?.defaultMedium || ""}
                      onChange={(e) =>
                        onUtmChange({
                          ...utmConfig,
                          defaultMedium: e.target.value,
                        })
                      }
                      placeholder="e.g. cpc"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Default Campaign</Label>
                    <Input
                      value={utmConfig?.defaultCampaign || ""}
                      onChange={(e) =>
                        onUtmChange({
                          ...utmConfig,
                          defaultCampaign: e.target.value,
                        })
                      }
                      placeholder="e.g. summer-sale"
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ─── Schedule ────────────────────────────────── */}
          <AccordionItem value="schedule">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Evergreen (always active)</Label>
                <Switch
                  checked={settings.isEvergreen}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ isEvergreen: checked })
                  }
                />
              </div>
              {!settings.isEvergreen && (
                <>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={settings.startsAt?.slice(0, 16) || ""}
                      onChange={(e) =>
                        onSettingsChange({
                          startsAt: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="datetime-local"
                      value={settings.endsAt?.slice(0, 16) || ""}
                      onChange={(e) =>
                        onSettingsChange({
                          endsAt: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">
                      Redirect URL (when expired)
                    </Label>
                    <Input
                      value={settings.expiredRedirectUrl || ""}
                      onChange={(e) =>
                        onSettingsChange({
                          expiredRedirectUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ─── Custom Scripts ───────────────────────────── */}
          <AccordionItem value="scripts">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Custom Scripts
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <Textarea
                value={settings.customScripts || ""}
                onChange={(e) =>
                  onSettingsChange({ customScripts: e.target.value })
                }
                placeholder="<!-- GTM, Meta Pixel, etc. -->"
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Scripts will be injected into the page head. Use for tracking
                pixels, GTM containers, etc.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
