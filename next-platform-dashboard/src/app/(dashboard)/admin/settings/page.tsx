import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import {
  Settings,
  Mail,
  Bell,
  Shield,
  Database,
  Globe,
  Construction,
} from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Admin Settings | ${PLATFORM.name}`,
  description: "Configure platform settings",
};

export default async function AdminSettingsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Configure global platform settings and preferences"
      />

      {/* Coming Soon Banner */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <Construction className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Settings are under development
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Configuration changes are not yet available. These controls will be functional in a future update.
          </p>
        </div>
      </div>

      {/* General Settings */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>General Settings</CardTitle>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </div>
          <CardDescription>
            Basic platform configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                defaultValue="DRAMAC"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                defaultValue="support@dramac.app"
                disabled
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform-url">Platform URL</Label>
            <Input
              id="platform-url"
              defaultValue={process.env.NEXT_PUBLIC_APP_URL || "https://dramac.app"}
              disabled
            />
          </div>
          <Button disabled>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <CardTitle>Email Settings</CardTitle>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
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
            <Switch defaultChecked disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Site Published Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Notify agencies when sites are published
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Billing Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send billing reminder emails
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Admin Notifications</CardTitle>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
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
            <Switch defaultChecked disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Failed Payments</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about failed payment attempts
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about security-related events
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Security Settings</CardTitle>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
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
            <Switch disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Auto-logout after 1 hour of inactivity
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>IP Allowlist</Label>
              <p className="text-sm text-muted-foreground">
                Restrict admin access to specific IPs
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Database & Maintenance */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <CardTitle>Database & Maintenance</CardTitle>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </div>
          <CardDescription>
            Database management and maintenance options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Database Backup</p>
              <p className="text-sm text-muted-foreground">
                Create a manual backup of the database
              </p>
            </div>
            <Button variant="outline" disabled>Create Backup</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Clear Cache</p>
              <p className="text-sm text-muted-foreground">
                Clear all cached data and regenerate
              </p>
            </div>
            <Button variant="outline" disabled>Clear Cache</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                Put the platform in maintenance mode
              </p>
            </div>
            <Button variant="outline" disabled>Enable</Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain Settings */}
      <Card className="opacity-60 pointer-events-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle>Domain Settings</CardTitle>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </div>
          <CardDescription>
            Configure custom domain settings for rendered sites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
    </div>
  );
}
