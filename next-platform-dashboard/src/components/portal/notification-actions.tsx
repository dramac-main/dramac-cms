"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/portal/notification-service";

interface NotificationMarkReadButtonProps {
  notificationId: string;
  clientId: string;
}

export function NotificationMarkReadButton({ notificationId, clientId }: NotificationMarkReadButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleMarkRead() {
    startTransition(async () => {
      try {
        const result = await markNotificationRead(notificationId, clientId);
        if (result.error) {
          toast.error(result.error);
        } else {
          router.refresh();
        }
      } catch {
        toast.error("Failed to mark notification as read");
      }
    });
  }

  return (
    <button
      onClick={handleMarkRead}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 disabled:opacity-50"
    >
      <Check className="h-3 w-3" />
      Mark as read
    </button>
  );
}

interface NotificationMarkAllReadButtonProps {
  clientId: string;
}

export function NotificationMarkAllReadButton({ clientId }: NotificationMarkAllReadButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleMarkAllRead() {
    startTransition(async () => {
      try {
        const result = await markAllNotificationsRead(clientId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("All notifications marked as read");
          router.refresh();
        }
      } catch {
        toast.error("Failed to mark all as read");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAllRead}
      disabled={isPending}
    >
      <CheckCheck className="h-4 w-4 mr-2" />
      {isPending ? "Marking..." : "Mark All Read"}
    </Button>
  );
}
