"use client";

import type { InvoiceActivity } from "../types";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Send,
  Eye,
  CreditCard,
  Ban,
  Edit,
  Copy,
  Clock,
} from "lucide-react";

interface InvoiceActivityLogProps {
  activities: InvoiceActivity[];
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  created: FileText,
  updated: Edit,
  sent: Send,
  marked_sent: Send,
  viewed: Eye,
  payment_recorded: CreditCard,
  voided: Ban,
  duplicated: Copy,
};

export function InvoiceActivityLog({ activities }: InvoiceActivityLogProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => {
        const Icon = ACTION_ICONS[activity.action] || Clock;
        const isLast = idx === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-6 flex-1 min-w-0">
              <p className="text-sm font-medium">
                {activity.description || activity.action}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {activity.actorName && (
                  <span className="text-xs text-muted-foreground">
                    by {activity.actorName}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
