"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateNotificationPreferences } from "@/lib/actions/notifications";
import type { NotificationPreferences } from "@/types/notifications";

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences | null;
}

const defaultPreferences: NotificationPreferences = {
  user_id: "",
  email_marketing: false,
  email_security: true,
  email_updates: true,
  email_team: true,
  email_billing: true,
  push_enabled: true,
  digest_frequency: "realtime",
};

const emailOptions = [
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

const digestOptions = [
  { value: "realtime", label: "Real-time" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
  { value: "none", label: "No email notifications" },
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

  const handleDigestChange = (value: string) => {
    setPrefs((prev) => ({
      ...prev,
      digest_frequency: value as "realtime" | "daily" | "weekly" | "none",
    }));
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
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Email Notification Settings */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Email Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Choose which types of emails you&apos;d like to receive
          </p>
        </div>
        
        {emailOptions.map((option) => (
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
              checked={prefs[option.id as keyof NotificationPreferences] as boolean}
              onCheckedChange={() =>
                handleToggle(option.id as keyof NotificationPreferences)
              }
            />
          </div>
        ))}
      </div>

      {/* Digest Frequency */}
      <div className="space-y-4 pt-4 border-t">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Email Frequency</h3>
          <p className="text-sm text-muted-foreground">
            How often would you like to receive email notifications?
          </p>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="digest_frequency">Notification frequency</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications immediately or as a digest
            </p>
          </div>
          <Select
            value={prefs.digest_frequency}
            onValueChange={handleDigestChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {digestOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="space-y-4 pt-4 border-t">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">In-App Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage notifications within the application
          </p>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="push_enabled">Enable notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show notification badge and popover in the header
            </p>
          </div>
          <Switch
            id="push_enabled"
            checked={prefs.push_enabled}
            onCheckedChange={() => handleToggle("push_enabled")}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
