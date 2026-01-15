import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import {
  Settings,
  Mail,
  Bell,
  Shield,
  Database,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Settings | DRAMAC",
  description: "Configure platform settings",
};

export default async function AdminSettingsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure global platform settings and preferences
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
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
                placeholder="Enter platform name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                defaultValue="support@dramac.app"
                placeholder="support@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform-url">Platform URL</Label>
            <Input
              id="platform-url"
              defaultValue={process.env.NEXT_PUBLIC_APP_URL || "https://dramac.app"}
              placeholder="https://your-platform.com"
            />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Settings
          </CardTitle>
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
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Site Published Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Notify agencies when sites are published
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Billing Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send billing reminder emails
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Admin Notifications
          </CardTitle>
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
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Failed Payments</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about failed payment attempts
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about security-related events
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
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
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Auto-logout after 1 hour of inactivity
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>IP Allowlist</Label>
              <p className="text-sm text-muted-foreground">
                Restrict admin access to specific IPs
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Database & Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database & Maintenance
          </CardTitle>
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
            <Button variant="outline">Create Backup</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Clear Cache</p>
              <p className="text-sm text-muted-foreground">
                Clear all cached data and regenerate
              </p>
            </div>
            <Button variant="outline">Clear Cache</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                Put the platform in maintenance mode
              </p>
            </div>
            <Button variant="outline" className="text-yellow-600">
              Enable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Domain Settings
          </CardTitle>
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
              placeholder="sites.yourdomain.com"
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
            <Switch defaultChecked />
          </div>
          <Button>Save Domain Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
