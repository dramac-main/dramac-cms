"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ModuleConfigureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  siteId: string;
  currentSettings: Record<string, any>;
  onSuccess?: () => void;
}

export function ModuleConfigureDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  siteId,
  currentSettings,
  onSuccess,
}: ModuleConfigureDialogProps) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: currentSettings || {},
  });

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      toast.success("Module settings saved");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {moduleName}</DialogTitle>
          <DialogDescription>
            Customize the module settings for this site
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Welcome Banner Specific Settings */}
          {moduleId.includes("welcome-banner") ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="message">Banner Message</Label>
                <Textarea
                  id="message"
                  placeholder="Welcome to our website!"
                  {...register("message", { required: "Message is required" })}
                  rows={3}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">{errors.message.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    {...register("backgroundColor")}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    placeholder="#4F46E5"
                    {...register("backgroundColor")}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    {...register("textColor")}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    placeholder="#FFFFFF"
                    {...register("textColor")}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">Call-to-Action Button Text (optional)</Label>
                <Input
                  id="ctaText"
                  placeholder="Learn More"
                  {...register("ctaText")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaLink">Button Link (optional)</Label>
                <Input
                  id="ctaLink"
                  type="url"
                  placeholder="https://example.com"
                  {...register("ctaLink")}
                />
              </div>
            </>
          ) : (
            /* Generic Settings for Other Modules */
            <div className="space-y-2">
              <Label>Module Settings</Label>
              <p className="text-sm text-muted-foreground">
                This module doesn't have configurable settings yet.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
