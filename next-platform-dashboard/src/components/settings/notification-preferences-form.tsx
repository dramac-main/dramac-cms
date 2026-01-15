"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateNotificationPreferences } from "@/lib/actions/notifications";

interface NotificationPreferences {
  email_marketing: boolean;
  email_security: boolean;
  email_updates: boolean;
  email_team: boolean;
  email_billing: boolean;
}

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences | null;
}

const defaultPreferences: NotificationPreferences = {
  email_marketing: false,
  email_security: true,
  email_updates: true,
  email_team: true,
  email_billing: true,
};

const notificationOptions = [
  {
    id: "email_security",
    label: "Security alerts",
    description: "Get notified about login attempts and security changes",
  },
  {
    id: "email_billing",
    label: "Billing notifications",
    description: "Invoices, payment confirmations, and subscription updates",
  },
  {
    id: "email_team",
    label: "Team activity",
    description: "When team members join or leave, or roles change",
  },
  {
    id: "email_updates",
    label: "Product updates",
    description: "New features, improvements, and announcements",
  },
  {
    id: "email_marketing",
    label: "Marketing emails",
    description: "Tips, best practices, and promotional content",
  },
];

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    preferences || defaultPreferences
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateNotificationPreferences(prefs);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Preferences saved");
      }
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {notificationOptions.map((option) => (
        <div
          key={option.id}
          className="flex items-center justify-between gap-4"
        >
          <div className="space-y-0.5">
            <Label htmlFor={option.id}>{option.label}</Label>
            <p className="text-sm text-muted-foreground">
              {option.description}
            </p>
          </div>
          <Switch
            id={option.id}
            checked={prefs[option.id as keyof NotificationPreferences]}
            onCheckedChange={() =>
              handleToggle(option.id as keyof NotificationPreferences)
            }
          />
        </div>
      ))}

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
