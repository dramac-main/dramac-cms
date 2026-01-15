"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSiteAction } from "@/lib/actions/sites";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface DeleteSiteButtonProps {
  siteId: string;
  siteName: string;
  onSuccess?: () => void;
}

export function DeleteSiteButton({ siteId, siteName, onSuccess }: DeleteSiteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText === siteName;

  const handleDelete = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteSiteAction(siteId);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Site deleted successfully");
        setOpen(false);
        onSuccess?.();
        router.refresh();
      }
    } catch (_error) {
      toast.error("Failed to delete site");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button className="flex w-full items-center text-danger px-2 py-1.5 text-sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Site</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the site
            <strong className="text-foreground"> &quot;{siteName}&quot;</strong> and all its pages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Type <strong>{siteName}</strong> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={siteName}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Site
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
