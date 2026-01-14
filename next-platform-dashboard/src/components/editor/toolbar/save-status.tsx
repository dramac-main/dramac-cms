"use client";

import { Check, Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveStatusProps {
  status: "saved" | "saving" | "unsaved" | "error";
  lastSaved?: Date | null;
}

const statusConfig = {
  saved: {
    icon: Check,
    label: "All changes saved",
    color: "text-success",
  },
  saving: {
    icon: Loader2,
    label: "Saving...",
    color: "text-muted-foreground",
  },
  unsaved: {
    icon: Cloud,
    label: "Unsaved changes",
    color: "text-warning",
  },
  error: {
    icon: CloudOff,
    label: "Failed to save",
    color: "text-destructive",
  },
};

export function SaveStatus({ status, lastSaved }: SaveStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        className={cn(
          "h-4 w-4",
          config.color,
          status === "saving" && "animate-spin"
        )}
      />
      <span className={cn("text-muted-foreground", config.color)}>
        {config.label}
      </span>
      {status === "saved" && lastSaved && (
        <span className="text-xs text-muted-foreground">
          {formatTime(lastSaved)}
        </span>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
