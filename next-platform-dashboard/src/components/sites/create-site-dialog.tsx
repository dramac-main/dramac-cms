"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSiteAction } from "@/lib/actions/sites";
import { toast } from "sonner";
import { Sparkles, PenTool } from "lucide-react";

interface CreateSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

type CreationMode = "select" | "ai" | "manual";

export function CreateSiteDialog({
  open,
  onOpenChange,
  clientId,
}: CreateSiteDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [subdomain, setSubdomain] = useState("");

  // Auto-generate subdomain from name
  useEffect(() => {
    if (siteName && !subdomain) {
      const generated = siteName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30);
      setSubdomain(generated);
    }
  }, [siteName, subdomain]);

  const handleCreateSite = async (useAI: boolean) => {
    if (!siteName.trim()) {
      toast.error("Please enter a site name");
      return;
    }

    if (!subdomain.trim() || subdomain.length < 3) {
      toast.error("Please enter a valid subdomain (at least 3 characters)");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createSiteAction({
        name: siteName,
        subdomain: subdomain.toLowerCase(),
        client_id: clientId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Site created!");
      onOpenChange(false);
      setSiteName("");
      setSubdomain("");
      setMode("select");

      if (useAI) {
        router.push(`/dashboard/sites/${result.data?.site?.id}/builder`);
      } else {
        const siteId = result.data?.site?.id;
        const pageId = result.data?.homepage?.id;
        if (siteId && pageId) {
          router.push(`/studio/${siteId}/${pageId}`);
        } else {
          router.push(`/dashboard/sites/${siteId}`);
        }
      }
    } catch (error) {
      toast.error("Failed to create site");
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setMode("select");
    setSiteName("");
    setSubdomain("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) resetDialog();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
          <DialogDescription>
            {mode === "select"
              ? "Choose how you want to create your website"
              : "Enter details for your new site"}
          </DialogDescription>
        </DialogHeader>

        {mode === "select" ? (
          <div className="grid gap-4 py-4">
            <button
              onClick={() => setMode("ai")}
              className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Generate with AI</h3>
                <p className="text-sm text-muted-foreground">
                  Describe your business and let AI create a complete website for you
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode("manual")}
              className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Start from Scratch</h3>
                <p className="text-sm text-muted-foreground">
                  Build your website manually using the visual editor
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="My Awesome Website"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-awesome-website"
                  disabled={isLoading}
                  className="rounded-r-none"
                />
                <span className="px-3 py-2 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                  .dramac.io
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setMode("select")}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={() => handleCreateSite(mode === "ai")}
                disabled={isLoading || !siteName.trim() || subdomain.length < 3}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : mode === "ai" ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Continue to AI Builder
                  </>
                ) : (
                  "Create Site"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
