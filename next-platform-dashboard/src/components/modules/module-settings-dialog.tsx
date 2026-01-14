"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdateSiteModule } from "@/hooks/use-site-modules";
import type { Module, SiteModule } from "@/types/modules";
import { toast } from "sonner";

interface ModuleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  module: Module;
  siteModule: SiteModule | null;
}

// Module-specific settings schemas
const moduleSettingsSchemas: Record<string, Array<{
  key: string;
  label: string;
  type: "text" | "switch" | "number";
  default?: unknown;
  description?: string;
}>> = {
  analytics: [
    {
      key: "trackClicks",
      label: "Track Clicks",
      type: "switch",
      default: true,
      description: "Track user click events",
    },
    {
      key: "trackScrollDepth",
      label: "Track Scroll Depth",
      type: "switch",
      default: true,
      description: "Track how far users scroll",
    },
    {
      key: "excludedPaths",
      label: "Excluded Paths",
      type: "text",
      default: "/admin,/dashboard",
      description: "Comma-separated paths to exclude",
    },
  ],
  "seo-pro": [
    {
      key: "autoSitemap",
      label: "Auto-generate Sitemap",
      type: "switch",
      default: true,
    },
    {
      key: "addSchema",
      label: "Add Schema Markup",
      type: "switch",
      default: true,
    },
  ],
  "forms-pro": [
    {
      key: "saveSubmissions",
      label: "Save Submissions",
      type: "switch",
      default: true,
    },
    {
      key: "emailNotifications",
      label: "Email Notifications",
      type: "switch",
      default: true,
    },
    {
      key: "notificationEmail",
      label: "Notification Email",
      type: "text",
      default: "",
    },
  ],
  blog: [
    {
      key: "postsPerPage",
      label: "Posts Per Page",
      type: "number",
      default: 10,
    },
    {
      key: "enableComments",
      label: "Enable Comments",
      type: "switch",
      default: true,
    },
    {
      key: "moderateComments",
      label: "Moderate Comments",
      type: "switch",
      default: true,
    },
  ],
};

export function ModuleSettingsDialog({
  open,
  onOpenChange,
  siteId,
  module,
  siteModule,
}: ModuleSettingsDialogProps) {
  const updateMutation = useUpdateSiteModule(siteId, module.id);
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  const schema = moduleSettingsSchemas[module.slug] || [];

  useEffect(() => {
    if (!open) return;
    
    // Initialize settings with current values or defaults
    const initial: Record<string, unknown> = {};
    schema.forEach((field) => {
      initial[field.key] = siteModule?.settings?.[field.key] ?? field.default;
    });
    setSettings(initial);
  }, [module.slug, siteModule, open, schema]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ settings });
      toast.success("Settings saved");
      onOpenChange(false);
    } catch (_error) {
      toast.error("Failed to save settings");
    }
  };

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{module.name} Settings</DialogTitle>
          <DialogDescription>
            Configure how this module works on your site
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {schema.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No configurable settings for this module
            </p>
          ) : (
            schema.map((field) => (
              <div key={field.key} className="space-y-2">
                {field.type === "switch" ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{field.label}</Label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={settings[field.key] as boolean}
                      onCheckedChange={(checked) =>
                        updateSetting(field.key, checked)
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {field.description}
                      </p>
                    )}
                    <Input
                      id={field.key}
                      type={field.type}
                      value={settings[field.key] as string}
                      onChange={(e) =>
                        updateSetting(
                          field.key,
                          field.type === "number"
                            ? parseInt(e.target.value)
                            : e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || schema.length === 0}
          >
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
