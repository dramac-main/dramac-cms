"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, ShoppingCart, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

interface IntegrationToggle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  featureFlagKey: string;
}

const INTEGRATIONS: IntegrationToggle[] = [
  {
    id: "crm",
    name: "CRM Integration",
    description: "Show financial profiles on contacts, create invoices from deals",
    icon: <Users className="h-5 w-5" />,
    featureFlagKey: "invoicing_crm_integration",
  },
  {
    id: "ecommerce",
    name: "E-Commerce Integration",
    description: "Create invoices from orders, credit notes from refunds",
    icon: <ShoppingCart className="h-5 w-5" />,
    featureFlagKey: "invoicing_ecommerce_integration",
  },
  {
    id: "booking",
    name: "Booking Integration",
    description: "Create invoices from appointments, link deposit payments",
    icon: <Calendar className="h-5 w-5" />,
    featureFlagKey: "invoicing_booking_integration",
  },
];

interface IntegrationSettingsProps {
  siteId: string;
  featureFlags?: Record<string, boolean>;
  onToggle?: (flagKey: string, enabled: boolean) => Promise<void>;
}

export function IntegrationSettings({
  siteId,
  featureFlags = {},
  onToggle,
}: IntegrationSettingsProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>(featureFlags);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setFlags(featureFlags);
  }, [featureFlags]);

  const handleToggle = useCallback(
    async (flagKey: string, enabled: boolean) => {
      setLoading(flagKey);
      try {
        if (onToggle) {
          await onToggle(flagKey, enabled);
        }
        setFlags((prev) => ({ ...prev, [flagKey]: enabled }));
        toast.success(`Integration ${enabled ? "enabled" : "disabled"}`);
      } catch {
        toast.error("Failed to update integration setting");
      } finally {
        setLoading(null);
      }
    },
    [onToggle],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Module Integrations
        </CardTitle>
        <CardDescription>
          Enable or disable invoicing integrations with other platform modules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {INTEGRATIONS.map((integration) => {
          const isEnabled = flags[integration.featureFlagKey] ?? false;
          const isLoading = loading === integration.featureFlagKey;

          return (
            <div
              key={integration.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">{integration.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={integration.id} className="font-medium">
                      {integration.name}
                    </Label>
                    <Badge variant={isEnabled ? "default" : "secondary"}>
                      {isEnabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {integration.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Switch
                  id={integration.id}
                  checked={isEnabled}
                  onCheckedChange={(checked) =>
                    handleToggle(integration.featureFlagKey, checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
