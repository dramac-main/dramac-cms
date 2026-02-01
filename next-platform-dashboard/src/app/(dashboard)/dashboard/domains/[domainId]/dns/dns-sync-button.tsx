"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncDnsRecords } from "@/lib/actions/dns";
import { toast } from "sonner";

interface DnsSyncButtonProps {
  domainId: string;
}

export function DnsSyncButton({ domainId }: DnsSyncButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncDnsRecords(domainId);
      
      if (result.success && result.data) {
        const { synced, added, removed } = result.data;
        toast.success("DNS records synced", {
          description: `${synced} records synced (${added} added, ${removed} removed)`,
        });
      } else {
        toast.error(result.error || "Failed to sync DNS records");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={isPending}>
      <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? "Syncing..." : "Sync"}
    </Button>
  );
}
