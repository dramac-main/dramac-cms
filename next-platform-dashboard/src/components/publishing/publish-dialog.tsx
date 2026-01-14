"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Loader2, ExternalLink } from "lucide-react";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
  siteSlug: string;
  isPublished: boolean;
  customDomain?: string | null;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
}

export function PublishDialog({
  open,
  onOpenChange,
  siteName,
  siteSlug,
  isPublished,
  customDomain,
  onPublish,
  onUnpublish,
}: PublishDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; url?: string } | null>(null);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "platform.com";
  const liveUrl = customDomain || `${siteSlug}.${baseDomain}`;

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await onPublish();
      setResult({ success: true, url: `https://${liveUrl}` });
    } catch (_error) {
      setResult({ success: false });
    }
    setIsLoading(false);
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    try {
      await onUnpublish();
      setResult(null);
      onOpenChange(false);
    } catch (_error) {
      // Handle error
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {isPublished ? "Site Published" : "Publish Site"}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? `${siteName} is live and accessible to visitors.`
              : `Publish ${siteName} to make it accessible to visitors.`}
          </DialogDescription>
        </DialogHeader>

        {result?.success ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Published Successfully!</h3>
            <p className="text-muted-foreground mb-4">Your site is now live at:</p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              {result.url}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="py-4">
            <div className="rounded-lg border p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Site URL</span>
                <Badge variant={isPublished ? "default" : "secondary"}>
                  {isPublished ? "Live" : "Draft"}
                </Badge>
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                https://{liveUrl}
              </code>
            </div>

            {!isPublished && (
              <div className="text-sm text-muted-foreground">
                <p>Before publishing, make sure:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>At least one page is marked as published</li>
                  <li>Your homepage is set correctly</li>
                  <li>All content is reviewed and ready</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result?.success ? (
            <Button onClick={handleClose}>Done</Button>
          ) : isPublished ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnpublish}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Unpublish Site
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish Now
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
