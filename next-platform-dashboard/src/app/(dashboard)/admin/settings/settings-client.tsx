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

      {/* Database & Maintenance — informational (requires Supabase Dashboard) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <CardTitle>Database & Maintenance</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Managed via Supabase
            </Badge>
          </div>
          <CardDescription>
            Database management and maintenance operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Database backups are managed automatically by Supabase. For manual backups, cache management, or maintenance mode, use the{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:no-underline"
              >
                Supabase Dashboard
              </a>.
            </span>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
            <div>
              <p className="font-medium">Database Backup</p>
              <p className="text-sm text-muted-foreground">
                Automatic daily backups via Supabase Pro plan
              </p>
            </div>
            <Badge variant="outline">Automatic</Badge>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
            <div>
              <p className="font-medium">Clear Cache</p>
              <p className="text-sm text-muted-foreground">
                Application cache clears automatically on deploy
              </p>
            </div>
            <Badge variant="outline">On Deploy</Badge>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                Configure via Vercel environment variables
              </p>
            </div>
            <Badge variant="outline">Via Vercel</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Domain Settings — informational (managed via Vercel + Supabase) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle>Domain Settings</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Managed via Vercel
            </Badge>
          </div>
          <CardDescription>
            Custom domain settings for rendered sites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Custom domains are configured per-site in the Sites dashboard. Platform-level domain settings are managed via{' '}
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:no-underline"
              >
                Vercel Dashboard
              </a>.
            </span>
          </div>
          <div className="space-y-2 opacity-60">
            <Label>Default Domain</Label>
            <Input
              defaultValue={PLATFORM.domain}
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Sites are accessible at [slug].{PLATFORM.domain} by default
            </p>
          </div>
          <div className="flex items-center justify-between opacity-60">
            <div className="space-y-0.5">
              <Label>Custom Domains</Label>
              <p className="text-sm text-muted-foreground">
                Agencies can add custom domains per site
              </p>
            </div>
            <Badge variant="outline">Enabled</Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
