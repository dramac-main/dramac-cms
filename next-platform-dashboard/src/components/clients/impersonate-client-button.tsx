"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { impersonateClient } from "@/lib/actions/clients";

interface ImpersonateClientButtonProps {
  clientId: string;
  clientName: string;
}

export function ImpersonateClientButton({ clientId, clientName }: ImpersonateClientButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const result = await impersonateClient(clientId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Now viewing as ${clientName}`);
      setOpen(false);
      // Redirect to client portal view
      router.push("/portal");
    } catch (_error) {
      toast.error("Failed to impersonate client");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <LogIn className="mr-2 h-4 w-4" />
          View as Client
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>View as Client</AlertDialogTitle>
          <AlertDialogDescription>
            You will see the platform from <strong>{clientName}&apos;s</strong> perspective.
            This is useful for troubleshooting or demonstrating features.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleImpersonate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
