"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Trash2, ChevronDown, Eraser } from "lucide-react";
import { toast } from "sonner";
import {
  clearSendLogByStateAction,
  clearSendLogOlderThanAction,
} from "@/lib/portal/actions/communications-actions";

interface CommunicationsToolbarProps {
  siteId: string;
  failedCount: number;
  skippedCount: number;
}

export function CommunicationsToolbar({
  siteId,
  failedCount,
  skippedCount,
}: CommunicationsToolbarProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState<null | "failed" | "skipped" | "old">(
    null,
  );

  const handleRefresh = () => {
    start(() => {
      router.refresh();
    });
  };

  const runClearFailed = () => {
    start(async () => {
      const r = await clearSendLogByStateAction(siteId, ["failed", "bounced", "dropped"]);
      if (r.ok) {
        toast.success(`Cleared ${r.deleted} failed entr${r.deleted === 1 ? "y" : "ies"}`);
        router.refresh();
      } else {
        toast.error(r.error || "Failed to clear entries");
      }
      setConfirmOpen(null);
    });
  };

  const runClearSkipped = () => {
    start(async () => {
      const r = await clearSendLogByStateAction(siteId, [
        "skipped_no_subscription",
        "skipped_preference",
      ]);
      if (r.ok) {
        toast.success(`Cleared ${r.deleted} skipped entr${r.deleted === 1 ? "y" : "ies"}`);
        router.refresh();
      } else {
        toast.error(r.error || "Failed to clear entries");
      }
      setConfirmOpen(null);
    });
  };

  const runClearOld = (days: number) => {
    start(async () => {
      const r = await clearSendLogOlderThanAction(siteId, days);
      if (r.ok) {
        toast.success(`Cleared ${r.deleted} entr${r.deleted === 1 ? "y" : "ies"} older than ${days} days`);
        router.refresh();
      } else {
        toast.error(r.error || "Failed to clear entries");
      }
      setConfirmOpen(null);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleRefresh}
        disabled={pending}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        Refresh
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            <Eraser className="mr-2 h-4 w-4" />
            Clean up
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Remove log entries</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={failedCount === 0 || pending}
            onClick={() => setConfirmOpen("failed")}
          >
            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
            Clear failed{" "}
            {failedCount > 0 && (
              <span className="ml-auto rounded bg-destructive/10 px-1.5 text-xs text-destructive">
                {failedCount}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={skippedCount === 0 || pending}
            onClick={() => setConfirmOpen("skipped")}
          >
            <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
            Clear skipped{" "}
            {skippedCount > 0 && (
              <span className="ml-auto rounded bg-muted px-1.5 text-xs">
                {skippedCount}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmOpen("old")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear entries older than 30 days
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmOpen !== null}
        onOpenChange={(open) => !open && setConfirmOpen(null)}
      >
        <AlertDialogTrigger asChild>
          <span className="sr-only">confirm</span>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmOpen === "failed" && "Clear failed entries?"}
              {confirmOpen === "skipped" && "Clear skipped entries?"}
              {confirmOpen === "old" && "Clear entries older than 30 days?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmOpen === "failed" &&
                `This will permanently remove ${failedCount} failed/bounced/dropped log entr${failedCount === 1 ? "y" : "ies"} for this site. The original messages are not affected.`}
              {confirmOpen === "skipped" &&
                `This will permanently remove ${skippedCount} skipped entr${skippedCount === 1 ? "y" : "ies"} for this site. These represent users who haven't enabled push notifications or have specific preferences.`}
              {confirmOpen === "old" &&
                `This will permanently remove every communication log entry on this site that's older than 30 days.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                if (confirmOpen === "failed") runClearFailed();
                else if (confirmOpen === "skipped") runClearSkipped();
                else if (confirmOpen === "old") runClearOld(30);
              }}
            >
              {pending ? "Clearing…" : "Clear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
