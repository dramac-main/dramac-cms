"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { installAppAction } from "@/app/portal/sites/[siteId]/apps/_actions";

interface MarketplaceInstallButtonProps {
  siteId: string;
  moduleId: string;
  moduleName: string;
  canManage: boolean;
}

export function MarketplaceInstallButton({
  siteId,
  moduleId,
  moduleName,
  canManage,
}: MarketplaceInstallButtonProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [installed, setInstalled] = useState(false);

  if (!canManage) {
    return (
      <Button size="sm" variant="outline" disabled>
        Request access
      </Button>
    );
  }

  if (installed) {
    return (
      <Button size="sm" variant="outline" disabled>
        Installed
      </Button>
    );
  }

  const onClick = () => {
    start(async () => {
      const r = await installAppAction(siteId, moduleId);
      if (r.ok) {
        toast.success(`${moduleName} installed`);
        setInstalled(true);
        router.refresh();
      } else {
        toast.error(r.error || "Install failed");
      }
    });
  };

  return (
    <Button size="sm" onClick={onClick} disabled={pending}>
      {pending ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Plus className="mr-1.5 h-3.5 w-3.5" />
      )}
      Install
    </Button>
  );
}
