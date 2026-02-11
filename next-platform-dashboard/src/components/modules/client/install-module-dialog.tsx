"use client";

import { useState } from "react";
import { Loader2, Download, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/locale-config";
import { ModuleIconContainer } from "@/components/modules/shared/module-icon-container";

interface InstallModuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  module: {
    id: string;
    name: string;
    icon: string;
    description: string | null;
    wholesale_price_monthly: number | null;
  };
  clientId: string;
  clientName: string;
  agencyId: string;
  clientPrice: number;
  onSuccess?: () => void;
}

export function InstallModuleDialog({
  isOpen,
  onClose,
  module,
  clientId,
  clientName,
  agencyId,
  clientPrice,
  onSuccess,
}: InstallModuleDialogProps) {
  const [isInstalling, setIsInstalling] = useState(false);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `${formatCurrency(cents / 100)}/mo`;
  };

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: module.id,
          agencyId,
          pricePaid: clientPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to install module");
      }

      toast.success("Module installed successfully!", {
        description: `${module.name} is now available for ${clientName}.`,
      });
      
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Install error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to install module");
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ModuleIconContainer icon={module.icon} size="sm" />
            Install {module.name}
          </DialogTitle>
          <DialogDescription>
            Add this module to {clientName}'s account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {module.description}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Module</span>
              <span className="font-medium">{module.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Client</span>
              <span className="font-medium">{clientName}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-medium">Price</span>
              <span className="font-bold text-primary">{formatPrice(clientPrice)}</span>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The client will be able to access this module immediately after installation.
              You can disable it anytime from the client's module settings.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isInstalling}>
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={isInstalling}>
            {isInstalling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Install Module
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
