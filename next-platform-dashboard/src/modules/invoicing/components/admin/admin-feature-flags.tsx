"use client";

/**
 * Admin Feature Flags (INV-12)
 *
 * Toggle switches for global invoicing features.
 */

import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  getInvoicingFeatureFlags,
  toggleInvoicingFeature,
} from "../../actions/admin-actions";
import type { InvoicingFeatureFlag } from "../../types";

const categoryLabels: Record<string, string> = {
  core: "Core Features",
  ai: "AI & Intelligence",
  integrations: "Integrations",
  advanced: "Advanced",
};

const categoryOrder = ["core", "integrations", "ai", "advanced"];

export function AdminFeatureFlags() {
  const [flags, setFlags] = useState<InvoicingFeatureFlag[]>([]);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getInvoicingFeatureFlags();
      setFlags(data);
    });
  }, []);

  async function handleToggle(key: string, enabled: boolean) {
    setTogglingKey(key);
    const result = await toggleInvoicingFeature(key, enabled);
    if (result.success) {
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, enabled } : f)),
      );
    }
    setTogglingKey(null);
  }

  if (isPending && flags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat] || cat,
      flags: flags.filter((f) => f.category === cat),
    }))
    .filter((g) => g.flags.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <Card key={group.category}>
          <CardHeader>
            <CardTitle className="text-base">{group.label}</CardTitle>
            <CardDescription>
              {group.category === "core" &&
                "Essential invoicing capabilities"}
              {group.category === "integrations" &&
                "Cross-module integrations"}
              {group.category === "ai" &&
                "AI-powered features"}
              {group.category === "advanced" &&
                "Advanced configuration options"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.flags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{flag.label}</span>
                    <Badge
                      variant={flag.enabled ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {flag.enabled ? "On" : "Off"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {flag.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {togglingKey === flag.key && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle(flag.key, checked)
                    }
                    disabled={togglingKey === flag.key}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
