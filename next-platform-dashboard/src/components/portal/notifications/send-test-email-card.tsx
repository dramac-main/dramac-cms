"use client";

/**
 * Section 5 — Send-test-email card.
 *
 * Renders below the notification preference toggles. Lets the portal user
 * pick a template, fire a test send to their own inbox, and see the most
 * recent attempts (newest first).
 */

import { useState, useTransition } from "react";
import { Mail, Send, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  sendPortalTestEmail,
  type PortalTestEmailHistoryRow,
} from "@/app/portal/settings/notifications/test-email-actions";

interface TemplateOption {
  type: string;
  label: string;
  category: string;
}

interface Props {
  templates: ReadonlyArray<TemplateOption>;
  recipient: string;
  initialHistory: PortalTestEmailHistoryRow[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function SendTestEmailCard({
  templates,
  recipient,
  initialHistory,
}: Props) {
  const [selected, setSelected] = useState<string>(templates[0]?.type ?? "");
  const [history, setHistory] =
    useState<PortalTestEmailHistoryRow[]>(initialHistory);
  const [pending, startTransition] = useTransition();

  // Group templates by category for the picker.
  const byCategory: Record<string, TemplateOption[]> = {};
  for (const t of templates) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category]!.push(t);
  }

  function fire() {
    if (!selected) return;
    startTransition(async () => {
      const result = await sendPortalTestEmail(selected as any, recipient);
      if (result.ok) {
        toast.success(`Test email sent to ${recipient}`);
      } else {
        toast.error(`Send failed: ${result.error || "Unknown error"}`);
      }
      // Optimistically prepend a row so the user sees it immediately.
      setHistory((prev) => [
        {
          id: `pending-${Date.now()}`,
          emailType: selected,
          recipient,
          success: result.ok,
          error: result.ok ? null : result.error ?? null,
          sentAt: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ]);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" /> Send a test email
        </CardTitle>
        <CardDescription>
          Pick a template and send a sample to your own inbox
          (<span className="font-mono">{recipient}</span>) so you can preview
          how it looks. Tests use placeholder data; nothing is sent to real
          customers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={pending}
            className="min-w-65 rounded-md border bg-background px-3 py-2 text-sm"
            aria-label="Test template"
          >
            {Object.entries(byCategory).map(([cat, opts]) => (
              <optgroup key={cat} label={cat}>
                {opts.map((o) => (
                  <option key={o.type} value={o.type}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Button onClick={fire} disabled={pending || !selected} size="sm">
            {pending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {pending ? "Sending..." : "Send test"}
          </Button>
        </div>

        {history.length > 0 && (
          <div className="rounded-md border">
            <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              Recent test sends
            </div>
            <ul className="divide-y">
              {history.slice(0, 10).map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {row.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono text-xs">{row.emailType}</span>
                    {!row.success && row.error && (
                      <Badge variant="destructive" className="text-xs">
                        {row.error.length > 40
                          ? row.error.slice(0, 40) + "…"
                          : row.error}
                      </Badge>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(row.sentAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
