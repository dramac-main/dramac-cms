"use client";

// src/components/domains/automation/expiry-notifications.tsx
// Expiry notification settings component

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Bell, Loader2, Save } from "lucide-react";
import { updateExpiryNotifications } from "@/lib/actions/automation";
import { toast } from "sonner";

interface ExpiryNotificationsProps {
  domainId: string;
  settings?: {
    notify_30_days?: boolean;
    notify_14_days?: boolean;
    notify_7_days?: boolean;
    notify_1_day?: boolean;
  };
}

export function ExpiryNotifications({
  domainId,
  settings = {
    notify_30_days: true,
    notify_14_days: true,
    notify_7_days: true,
    notify_1_day: true,
  }
}: ExpiryNotificationsProps) {
  const [isPending, startTransition] = useTransition();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key: keyof typeof localSettings, checked: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: checked }));
    setHasChanges(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateExpiryNotifications(domainId, localSettings);
      if (result.success) {
        setHasChanges(false);
        toast.success("Notification settings saved");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    });
  };

  const notificationOptions = [
    { key: 'notify_30_days' as const, label: '30 days before expiry', description: 'Get an early reminder' },
    { key: 'notify_14_days' as const, label: '14 days before expiry', description: 'Two weeks warning' },
    { key: 'notify_7_days' as const, label: '7 days before expiry', description: 'One week warning' },
    { key: 'notify_1_day' as const, label: '1 day before expiry', description: 'Final reminder' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Expiry Notifications
        </CardTitle>
        <CardDescription>
          Choose when to receive domain expiry reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {notificationOptions.map((option) => (
            <div key={option.key} className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id={option.key}
                checked={localSettings[option.key] ?? true}
                onCheckedChange={(checked) => handleChange(option.key, checked as boolean)}
                disabled={isPending}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor={option.key} className="font-medium cursor-pointer">
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
