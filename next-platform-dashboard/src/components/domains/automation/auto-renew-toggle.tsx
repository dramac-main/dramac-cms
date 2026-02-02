"use client";

// src/components/domains/automation/auto-renew-toggle.tsx
// Auto-renewal toggle component for domains

import { useTransition, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2, Calendar } from "lucide-react";
import { setAutoRenew } from "@/lib/actions/automation";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface AutoRenewToggleProps {
  domainId: string;
  enabled: boolean;
  expiryDate: string;
}

export function AutoRenewToggle({ domainId, enabled, expiryDate }: AutoRenewToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(enabled);

  const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
  const isExpiringSoon = daysUntilExpiry <= 30;

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await setAutoRenew(domainId, checked);
      if (result.success) {
        setIsEnabled(checked);
        toast.success(`Auto-renewal ${checked ? 'enabled' : 'disabled'}`);
      } else {
        toast.error(result.error || "Failed to update auto-renewal");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Auto-Renewal
        </CardTitle>
        <CardDescription>
          Automatically renew this domain before it expires
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-renew" className="font-medium">Enable Auto-Renewal</Label>
            <p className="text-sm text-muted-foreground">
              Your domain will be renewed automatically 14 days before expiry
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="auto-renew"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isPending}
            />
          </div>
        </div>

        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          isExpiringSoon
            ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800'
            : 'bg-muted/50'
        }`}>
          <Calendar className={`h-5 w-5 ${isExpiringSoon ? 'text-yellow-600' : 'text-muted-foreground'}`} />
          <div>
            <p className={`font-medium ${isExpiringSoon ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
              Expires: {format(new Date(expiryDate), 'PPP')}
            </p>
            <p className={`text-sm ${isExpiringSoon ? 'text-yellow-600 dark:text-yellow-300' : 'text-muted-foreground'}`}>
              {daysUntilExpiry > 0
                ? `${daysUntilExpiry} days until expiry`
                : daysUntilExpiry === 0
                  ? 'Expires today!'
                  : `Expired ${Math.abs(daysUntilExpiry)} days ago`
              }
            </p>
          </div>
        </div>

        {!isEnabled && isExpiringSoon && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Auto-renewal is disabled and your domain expires soon. Consider enabling it to prevent losing your domain.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
