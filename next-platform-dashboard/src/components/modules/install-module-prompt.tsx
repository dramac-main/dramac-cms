"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Loader2, CircleCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function InstallModulePrompt() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleSlug = searchParams.get("install");
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!moduleSlug || dismissed) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const response = await fetch("/api/modules/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Already subscribed to this module") {
          toast.info("You're already subscribed to this module!");
          setDismissed(true);
          router.push("/dashboard/modules/subscriptions");
          return;
        }
        throw new Error(data.error || "Failed to install module");
      }

      if (data.requiresPayment) {
        toast.info("This module requires payment. Redirecting to checkout...");
        router.push(data.checkoutUrl);
        return;
      }

      setIsSuccess(true);
      toast.success(`${data.module?.name || moduleSlug} installed successfully!`);
      
      // Refresh the page after a moment to show the new subscription
      setTimeout(() => {
        router.push("/dashboard/modules/subscriptions");
        router.refresh();
      }, 1500);

    } catch (error) {
      console.error("Installation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to install module");
      setIsInstalling(false);
    }
  };

  if (isSuccess) {
    return (
      <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
        <CircleCheck className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700 dark:text-green-300">Module Installed!</AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-400">
          The module has been added to your agency. Redirecting...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6 border-primary bg-primary/5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Install Module</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          You're about to install <strong>{moduleSlug}</strong>. This will add the module to your agency subscription.
          After installation, you can deploy it to any of your clients' sites.
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm"
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              "Install for Agency"
            )}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setDismissed(true);
              router.push("/dashboard/modules/subscriptions");
            }}
            disabled={isInstalling}
          >
            Cancel
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
