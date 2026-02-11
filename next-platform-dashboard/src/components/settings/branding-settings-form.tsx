/**
 * Branding Settings Page
 * 
 * Phase WL-01: White-Label Branding Foundation
 * Agency owners can configure their brand identity, colors, logos, and portal appearance.
 */
"use client";

import { useState, useEffect } from "react";
import { Paintbrush, Image, Mail, Globe, Shield, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/client";
import type { BrandingFormData } from "@/types/branding";
import { DEFAULT_BRANDING } from "@/types/branding";

export default function BrandingSettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BrandingFormData>({
    ...DEFAULT_BRANDING,
  });

  useEffect(() => {
    async function loadBranding() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get agency membership
        const { data: member } = await supabase
          .from("agency_members")
          .select("agency_id, role")
          .eq("user_id", user.id)
          .single();

        if (!member) return;
        setAgencyId(member.agency_id);

        // Fetch existing branding
        const response = await fetch(`/api/branding/${member.agency_id}`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setFormData(data);
          }
        }
      } catch {
        toast.error("Failed to load branding settings");
      } finally {
        setIsLoading(false);
      }
    }
    loadBranding();
  }, []);

  async function handleSave() {
    if (!agencyId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/branding/${agencyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedBranding = await response.json();
        toast.success("Branding saved successfully");
        
        // Dispatch event so BrandingProvider updates immediately
        window.dispatchEvent(
          new CustomEvent("branding-updated", { detail: updatedBranding })
        );
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to save branding");
      }
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setIsSaving(false);
    }
  }

  function updateField<K extends keyof BrandingFormData>(key: K, value: BrandingFormData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Branding"
        description="Customize how your agency appears to clients across the platform"
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Changes</>
            )}
          </Button>
        }
      />

      {/* Section 1: Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            <CardTitle>Brand Identity</CardTitle>
          </div>
          <CardDescription>
            Your agency name and tagline appear throughout the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.agency_display_name}
                onChange={(e) => updateField("agency_display_name", e.target.value)}
                placeholder="Acme Agency"
              />
              <p className="text-xs text-muted-foreground">
                Shown in sidebar, emails, and portal login
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline ?? ""}
                onChange={(e) => updateField("tagline", e.target.value || null)}
                placeholder="Building digital experiences"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Logos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <CardTitle>Logos</CardTitle>
          </div>
          <CardDescription>
            Upload your agency logos for different contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Primary Logo URL</Label>
              <Input
                id="logoUrl"
                value={formData.logo_url ?? ""}
                onChange={(e) => updateField("logo_url", e.target.value || null)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">For light backgrounds</p>
              {formData.logo_url && (
                <div className="p-4 border rounded bg-white dark:bg-muted">
                  <img src={formData.logo_url} alt="Logo preview" className="max-h-12 object-contain" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoDarkUrl">Dark Mode Logo URL</Label>
              <Input
                id="logoDarkUrl"
                value={formData.logo_dark_url ?? ""}
                onChange={(e) => updateField("logo_dark_url", e.target.value || null)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">For dark backgrounds (optional)</p>
              {formData.logo_dark_url && (
                <div className="p-4 border rounded bg-zinc-900">
                  <img src={formData.logo_dark_url} alt="Dark logo preview" className="max-h-12 object-contain" />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input
                id="faviconUrl"
                value={formData.favicon_url ?? ""}
                onChange={(e) => updateField("favicon_url", e.target.value || null)}
                placeholder="https://... (32x32 PNG)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Colors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            <CardTitle>Brand Colors</CardTitle>
          </div>
          <CardDescription>
            These colors are applied to buttons, links, and interactive elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="primaryColor"
                  value={formData.primary_color}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  className="flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryFg">Primary Text</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="primaryFg"
                  value={formData.primary_foreground}
                  onChange={(e) => updateField("primary_foreground", e.target.value)}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.primary_foreground}
                  onChange={(e) => updateField("primary_foreground", e.target.value)}
                  className="flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="accentColor"
                  value={formData.accent_color}
                  onChange={(e) => updateField("accent_color", e.target.value)}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.accent_color}
                  onChange={(e) => updateField("accent_color", e.target.value)}
                  className="flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentFg">Accent Text</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="accentFg"
                  value={formData.accent_foreground}
                  onChange={(e) => updateField("accent_foreground", e.target.value)}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  value={formData.accent_foreground}
                  onChange={(e) => updateField("accent_foreground", e.target.value)}
                  className="flex-1"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="pt-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Preview</Label>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Button
                type="button"
                style={{ backgroundColor: formData.primary_color, color: formData.primary_foreground }}
              >
                Primary Button
              </Button>
              <Button
                type="button"
                style={{ backgroundColor: formData.accent_color, color: formData.accent_foreground }}
              >
                Accent Button
              </Button>
              <span style={{ color: formData.accent_color }} className="font-medium">
                Accent Link
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 4: Email Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Branding</CardTitle>
          </div>
          <CardDescription>
            Customize how emails appear when sent to your clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailFromName">From Name</Label>
              <Input
                id="emailFromName"
                value={formData.email_from_name ?? ""}
                onChange={(e) => updateField("email_from_name", e.target.value || null)}
                placeholder="Acme Agency"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailReplyTo">Reply-To Email</Label>
              <Input
                id="emailReplyTo"
                type="email"
                value={formData.email_reply_to ?? ""}
                onChange={(e) => updateField("email_reply_to", e.target.value || null)}
                placeholder="hello@youragency.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailFooterText">Email Footer Text</Label>
            <Textarea
              id="emailFooterText"
              value={formData.email_footer_text ?? ""}
              onChange={(e) => updateField("email_footer_text", e.target.value || null)}
              placeholder="© 2026 Your Agency. All rights reserved."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailFooterAddress">Physical Address (CAN-SPAM)</Label>
            <Input
              id="emailFooterAddress"
              value={formData.email_footer_address ?? ""}
              onChange={(e) => updateField("email_footer_address", e.target.value || null)}
              placeholder="123 Main St, City, Country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Portal Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Client Portal</CardTitle>
          </div>
          <CardDescription>
            Customize the portal login and welcome experience for your clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portalTitle">Welcome Title</Label>
              <Input
                id="portalTitle"
                value={formData.portal_welcome_title ?? ""}
                onChange={(e) => updateField("portal_welcome_title", e.target.value || null)}
                placeholder="Welcome to Your Agency"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portalSubtitle">Welcome Subtitle</Label>
              <Input
                id="portalSubtitle"
                value={formData.portal_welcome_subtitle ?? ""}
                onChange={(e) => updateField("portal_welcome_subtitle", e.target.value || null)}
                placeholder="Manage your websites and services"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="portalBg">Login Background Image URL</Label>
            <Input
              id="portalBg"
              value={formData.portal_login_background_url ?? ""}
              onChange={(e) => updateField("portal_login_background_url", e.target.value || null)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Legal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Legal & Support</CardTitle>
          </div>
          <CardDescription>
            Links shown in footers and support pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={formData.support_email ?? ""}
                onChange={(e) => updateField("support_email", e.target.value || null)}
                placeholder="support@youragency.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportUrl">Support URL</Label>
              <Input
                id="supportUrl"
                type="url"
                value={formData.support_url ?? ""}
                onChange={(e) => updateField("support_url", e.target.value || null)}
                placeholder="https://support.youragency.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="privacyUrl">Privacy Policy URL</Label>
              <Input
                id="privacyUrl"
                type="url"
                value={formData.privacy_policy_url ?? ""}
                onChange={(e) => updateField("privacy_policy_url", e.target.value || null)}
                placeholder="https://youragency.com/privacy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termsUrl">Terms of Service URL</Label>
              <Input
                id="termsUrl"
                type="url"
                value={formData.terms_of_service_url ?? ""}
                onChange={(e) => updateField("terms_of_service_url", e.target.value || null)}
                placeholder="https://youragency.com/terms"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: White-Label Level */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            <CardTitle>White-Label Level</CardTitle>
          </div>
          <CardDescription>
            Control how much platform branding is visible to your clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wlLevel">Branding Level</Label>
            <Select
              value={formData.white_label_level}
              onValueChange={(v) => updateField("white_label_level", v as "basic" | "full" | "custom")}
            >
              <SelectTrigger id="wlLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  <div className="flex items-center gap-2">
                    Basic <Badge variant="secondary" className="text-xs">Free</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="full">
                  <div className="flex items-center gap-2">
                    Full White-Label <Badge variant="default" className="text-xs">Pro</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    Custom <Badge variant="default" className="text-xs">Enterprise</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p><strong>Basic:</strong> Your agency name and logo replace the platform brand</p>
              <p><strong>Full:</strong> All platform references removed, custom portal domain support</p>
              <p><strong>Custom:</strong> Full white-label plus custom CSS/HTML injection</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Save Bar */}
      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="shadow-lg">
          {isSaving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save All Changes</>
          )}
        </Button>
      </div>
    </div>
  );
}
