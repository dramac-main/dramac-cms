"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ModuleInstallButtonProps {
  moduleId: string;
  moduleName: string;
  isFree: boolean;
}

export function ModuleInstallButton({ moduleId, moduleName, isFree }: ModuleInstallButtonProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const router = useRouter();

  const handleInstall = async () => {
    // For now, just redirect to subscriptions page to select a site
    // In a full implementation, this would open a dialog to select site/client
    router.push(`/marketplace/subscriptions?install=${moduleId}`);
  };

  return (
    <Button 
      className="w-full" 
      size="lg"
      onClick={handleInstall}
      disabled={isInstalling}
    >
      {isInstalling ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Installing...
        </>
      ) : (
        isFree ? "Install Module" : "Purchase & Install"
      )}
    </Button>
  );
}
