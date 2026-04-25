"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteSendLogEntryAction } from "./_actions";

interface CommunicationsRowDeleteProps {
  siteId: string;
  id: string;
}

export function CommunicationsRowDelete({
  siteId,
  id,
}: CommunicationsRowDeleteProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
      title="Remove this log entry"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const r = await deleteSendLogEntryAction(siteId, id);
          if (r.ok) {
            toast.success("Entry removed");
            router.refresh();
          } else {
            toast.error(r.error || "Failed to remove entry");
          }
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
