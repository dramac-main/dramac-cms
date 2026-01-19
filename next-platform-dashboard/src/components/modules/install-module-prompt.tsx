"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function InstallModulePrompt() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleSlug = searchParams.get("install");
  const [dismissed, setDismissed] = useState(false);

  if (!moduleSlug || dismissed) return null;

  return (
    <Alert className="mb-6 border-primary bg-primary/5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Ready to Install Module</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          You're about to install <strong>{moduleSlug}</strong>. This is an agency-level subscription.
          Once installed, you can deploy it to your clients' sites from the Sites page.
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm"
            onClick={() => {
              // TODO: Implement actual installation
              alert("Module installation coming soon! For now, this is a placeholder.");
              setDismissed(true);
            }}
          >
            Install for Agency
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setDismissed(true);
              router.push("/dashboard/modules/subscriptions");
            }}
          >
            Cancel
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
