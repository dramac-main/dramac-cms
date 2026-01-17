"use client";

import { useState } from "react";
import { Globe, Loader2, ExternalLink, Copy, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { publishSite, unpublishSite } from "@/lib/publishing/publish-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PublishDialogProps {
  siteId: string;
  siteName: string;
  isPublished: boolean;
  siteUrl: string;
  onPublishChange?: (published: boolean) => void;
  children?: React.ReactNode;
  // Legacy props for backwards compatibility
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  siteSlug?: string;
  customDomain?: string | null;
  onPublish?: () => Promise<void>;
  onUnpublish?: () => Promise<void>;
}

export function PublishDialog({
  siteId,
  siteName,
  isPublished,
  siteUrl,
  onPublishChange,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onPublish: legacyOnPublish,
  onUnpublish: legacyOnUnpublish,
}: PublishDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  // Support both controlled and uncontrolled modes
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handlePublish = async () => {
    setLoading(true);
    setError(null);

    try {
      if (legacyOnPublish) {
        await legacyOnPublish();
        setJustPublished(true);
        onPublishChange?.(true);
        toast.success("Site published successfully!");
      } else {
        const result = await publishSite(siteId);

        if (result.success) {
          setJustPublished(true);
          onPublishChange?.(true);
          toast.success("Site published successfully!");
        } else {
          setError(result.error || "Failed to publish site");
        }
      }
    } catch (err) {
      setError("Failed to publish site");
    }

    setLoading(false);
  };

  const handleUnpublish = async () => {
    setLoading(true);
    setError(null);

    try {
      if (legacyOnUnpublish) {
        await legacyOnUnpublish();
        setJustPublished(false);
        onPublishChange?.(false);
        toast.success("Site unpublished");
        setOpen(false);
      } else {
        const result = await unpublishSite(siteId);

        if (result.success) {
          setJustPublished(false);
          onPublishChange?.(false);
          toast.success("Site unpublished");
          setOpen(false);
        } else {
          setError(result.error || "Failed to unpublish site");
        }
      }
    } catch (err) {
      setError("Failed to unpublish site");
    }

    setLoading(false);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success("URL copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleViewSite = () => {
    window.open(siteUrl, "_blank", "noopener,noreferrer");
  };

  const handleClose = () => {
    setError(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {isPublished || justPublished ? "Site Published!" : "Publish Site"}
          </DialogTitle>
          <DialogDescription>
            {isPublished || justPublished
              ? "Your site is live and accessible to the public."
              : `Make "${siteName}" accessible to the public.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isPublished || justPublished) ? (
          <div className="space-y-4">
            {/* Site URL */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your site is live at:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-background px-3 py-2 rounded border truncate">
                  {siteUrl}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleViewSite}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live Site
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                Publishing will make your site available at:
              </p>
              <code className="text-sm font-medium block mt-2">{siteUrl}</code>
            </div>

            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All pages will be publicly accessible</li>
              <li>• Changes made after publishing require re-publishing</li>
              <li>• You can unpublish at any time</li>
            </ul>
          </div>
        )}

        <DialogFooter className={cn("gap-2", (isPublished || justPublished) && "sm:justify-between")}>
          {(isPublished || justPublished) ? (
            <>
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={loading}
                className="text-destructive hover:text-destructive"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Unpublish Site
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish Now
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
