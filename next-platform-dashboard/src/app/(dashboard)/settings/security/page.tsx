import { Metadata } from "next";
import { PasswordChangeForm } from "@/components/settings/password-change-form";
import { SessionsManager } from "@/components/settings/sessions-manager";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Security Settings | DRAMAC",
};

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        description="Manage your password and security settings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password regularly to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices where you&apos;re currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsManager />
        </CardContent>
      </Card>
    </div>
  );
}
