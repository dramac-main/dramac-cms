"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Mail,
  Bell,
  Shield,
  Database,
  Globe,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PLATFORM } from "@/lib/constants/platform";
import {
  saveAdminSetting,
  type AdminSettingsMap,
} from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeneralSettings {
  platformName: string;
  supportEmail: string;
  platformUrl: string;
}

interface EmailSettings {
  welcomeEmails: boolean;
  sitePublishedNotifications: boolean;
  billingReminders: boolean;
}

interface NotificationSettings {
  newAgencySignups: boolean;
  failedPayments: boolean;
  securityAlerts: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  ipAllowlist: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminSettingsClient({
  initialSettings,
}: {
  initialSettings: AdminSettingsMap;
}) {
  // --- General ---
  const initGeneral = (initialSettings.general ?? {}) as Partial<GeneralSettings>;
  const [general, setGeneral] = useState<GeneralSettings>({
    platformName: initGeneral.platformName ?? PLATFORM.name ?? "DRAMAC",
    supportEmail: initGeneral.supportEmail ?? "support@dramac.app",
    platformUrl:
      initGeneral.platformUrl ??
      (typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_APP_URL || "https://dramac.app"
        : "https://dramac.app"),
  });

  // --- Email ---
  const initEmail = (initialSettings.email ?? {}) as Partial<EmailSettings>;
  const [email, setEmail] = useState<EmailSettings>({
    welcomeEmails: initEmail.welcomeEmails ?? true,
    sitePublishedNotifications: initEmail.sitePublishedNotifications ?? true,
    billingReminders: initEmail.billingReminders ?? true,
  });

  // --- Notifications ---
  const initNotif = (initialSettings.notifications ?? {}) as Partial<NotificationSettings>;
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newAgencySignups: initNotif.newAgencySignups ?? true,
    failedPayments: initNotif.failedPayments ?? true,
    securityAlerts: initNotif.securityAlerts ?? true,
  });

  // --- Security ---
  const initSecurity = (initialSettings.security ?? {}) as Partial<SecuritySettings>;
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: initSecurity.twoFactorAuth ?? false,
    sessionTimeout: initSecurity.sessionTimeout ?? true,
    ipAllowlist: initSecurity.ipAllowlist ?? false,
  });

  // --- Saving state ---
  const [isPending, startTransition] = useTransition();
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const handleSave = (section: string, value: Record<string, unknown>) => {
    setSavingSection(section);
    startTransition(async () => {
      const result = await saveAdminSetting(section, value);
      if (result.success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`);
      } else {
        toast.error(`Failed to save ${section} settings: ${result.error}`);
      }
      setSavingSection(null);
    });
  };

  const isSaving = (section: string) => isPending && savingSection === section;

  return (
    <>
      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                value={general.platformName}
                onChange={(e) =>
                  setGeneral((s) => ({ ...s, platformName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={general.supportEmail}
                onChange={(e) =>
                  setGeneral((s) => ({ ...s, supportEmail: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform-url">Platform URL</Label>
            <Input
              id="platform-url"
              value={general.platformUrl}
              onChange={(e) =>
                setGeneral((s) => ({ ...s, platformUrl: e.target.value }))
              }
            />
          </div>
          <Button
            onClick={() => handleSave("general", general as unknown as Record<string, unknown>)}
            disabled={isSaving("general")}
          >
            {isSaving("general") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <CardTitle>Email Settings</CardTitle>
          </div>
          <CardDescription>
            Configure email notifications and templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Welcome Emails</Label>
              <p className="text-sm text-muted-foreground">
                Send welcome emails to new users
              </p>
            </div>
            <Switch
              checked={email.welcomeEmails}
              onCheckedChange={(v) =>
                setEmail((s) => ({ ...s, welcomeEmails: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Site Published Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Notify agencies when sites are published
              </p>
            </div>
            <Switch
              checked={email.sitePublishedNotifications}
              onCheckedChange={(v) =>
                setEmail((s) => ({ ...s, sitePublishedNotifications: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Billing Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send billing reminder emails
              </p>
            </div>
            <Switch
              checked={email.billingReminders}
              onCheckedChange={(v) =>
                setEmail((s) => ({ ...s, billingReminders: v }))
              }
            />
          </div>
          <div className="pt-2">
            <Button
              onClick={() => handleSave("email", email as unknown as Record<string, unknown>)}
              disabled={isSaving("email")}
            >
              {isSaving("email") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Email Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Admin Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure notifications for platform administrators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Agency Signups</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new agencies sign up
              </p>
            </div>
            <Switch
              checked={notifications.newAgencySignups}
              onCheckedChange={(v) =>
                setNotifications((s) => ({ ...s, newAgencySignups: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Failed Payments</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about failed payment attempts
              </p>
            </div>
            <Switch
              checked={notifications.failedPayments}
              onCheckedChange={(v) =>
                setNotifications((s) => ({ ...s, failedPayments: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about security-related events
              </p>
            </div>
            <Switch
              checked={notifications.securityAlerts}
              onCheckedChange={(v) =>
                setNotifications((s) => ({ ...s, securityAlerts: v }))
              }
            />
          </div>
          <div className="pt-2">
            <Button
              onClick={() =>
                handleSave("notifications", notifications as unknown as Record<string, unknown>)
              }
              disabled={isSaving("notifications")}
            >
              {isSaving("notifications") && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>
            Configure platform security options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for admin accounts
              </p>
            </div>
            <Switch
              checked={security.twoFactorAuth}
              onCheckedChange={(v) =>
                setSecurity((s) => ({ ...s, twoFactorAuth: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Auto-logout after 1 hour of inactivity
              </p>
            </div>
            <Switch
              checked={security.sessionTimeout}
              onCheckedChange={(v) =>
                setSecurity((s) => ({ ...s, sessionTimeout: v }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>IP Allowlist</Label>
              <p className="text-sm text-muted-foreground">
                Restrict admin access to specific IPs
              </p>
            </div>
            <Switch
              checked={security.ipAllowlist}
              onCheckedChange={(v) =>
                setSecurity((s) => ({ ...s, ipAllowlist: v }))
              }
            />
          </div>
          <div className="pt-2">
            <Button
              onClick={() =>
                handleSave("security", security as unknown as Record<string, unknown>)
              }
              disabled={isSaving("security")}
            >
              {isSaving("security") && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database & Maintenance — disabled (requires infrastructure) */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <CardTitle>Database & Maintenance</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Requires infrastructure setup
            </Badge>
          </div>
          <CardDescription>
            Database management and maintenance options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-muted-foreground text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Database backup, cache clearing, and maintenance mode require
              additional infrastructure setup and are not yet available.
            </span>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Database Backup</p>
              <p className="text-sm text-muted-foreground">
                Create a manual backup of the database
              </p>
            </div>
            <Button variant="outline" disabled>
              Create Backup
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Clear Cache</p>
              <p className="text-sm text-muted-foreground">
                Clear all cached data and regenerate
              </p>
            </div>
            <Button variant="outline" disabled>
              Clear Cache
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                Put the platform in maintenance mode
              </p>
            </div>
            <Button variant="outline" disabled>
              Enable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain Settings — disabled (requires DNS integration) */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle>Domain Settings</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Requires DNS integration
            </Badge>
          </div>
          <CardDescription>
            Configure custom domain settings for rendered sites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-muted-foreground text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Custom domain management requires DNS integration and is not yet
              available.
            </span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-domain">Default Domain</Label>
            <Input
              id="default-domain"
              defaultValue="sites.dramac.app"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Sites will be accessible at [slug].sites.dramac.app by default
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Custom Domains</Label>
              <p className="text-sm text-muted-foreground">
                Allow agencies to use custom domains
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <Button disabled>Save Domain Settings</Button>
        </CardContent>
      </Card>
    </>
  );
}
