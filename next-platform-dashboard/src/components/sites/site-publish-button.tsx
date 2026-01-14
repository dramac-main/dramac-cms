"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, GlobeLock } from "lucide-react";
import { toast } from "sonner";
import { publishSiteAction } from "@/lib/actions/sites";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Site } from "@/types/site";

interface SitePublishButtonProps {
  site: Site;
}

export function SitePublishButton({ site }: SitePublishButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const isPublished = site.published;

  const handlePublish = async () => {
    setIsPending(true);

    try {
      const result = await publishSiteAction(site.id, !isPublished);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isPublished ? "Site unpublished" : "Site published successfully!");
        router.refresh();
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  if (isPublished) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <GlobeLock className="mr-2 h-4 w-4" />
            Unpublish
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Site</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the site inaccessible to visitors. You can publish it again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>Unpublish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Button onClick={handlePublish} disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <Globe className="mr-2 h-4 w-4" />
      Publish Site
    </Button>
  );
}
