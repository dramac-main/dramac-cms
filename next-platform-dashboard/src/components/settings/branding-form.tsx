"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAgencyBranding, uploadBrandingLogo } from "@/lib/actions/agency";

interface BrandingFormProps {
  agencyId: string;
  branding: Record<string, string>;
}

export function BrandingForm({ agencyId, branding }: BrandingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color || "#6366f1");
  const [secondaryColor, setSecondaryColor] = useState(branding.secondary_color || "#8b5cf6");
  const [logoUrl, setLogoUrl] = useState(branding.logo_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload an image file.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("agencyId", agencyId);

      const result = await uploadBrandingLogo(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        setLogoUrl(result.url || "");
        toast.success("Logo uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateAgencyBranding(agencyId, {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: "",
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setLogoUrl("");
        toast.success("Logo removed");
      }
    } catch (error) {
      toast.error("Failed to remove logo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateAgencyBranding(agencyId, {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Branding updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update branding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl}
                  alt="Agency logo"
                  className="h-16 w-auto object-contain rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveLogo}
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="h-16 w-32 bg-muted rounded border flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No logo</span>
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading ? "Uploading..." : "Upload Logo"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended: SVG or PNG, max 10MB
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
                placeholder="#6366f1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="secondaryColor"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1"
                placeholder="#8b5cf6"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Branding
        </Button>
      </div>
    </form>
  );
}
