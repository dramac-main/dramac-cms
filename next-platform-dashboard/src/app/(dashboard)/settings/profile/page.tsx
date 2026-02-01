import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getProfile } from "@/lib/actions/profile";
import { ProfileForm } from "@/components/settings/profile-form";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Profile Settings | DRAMAC",
};

export default async function ProfileSettingsPage() {
  const session = await getSession();
  const profile = session ? await getProfile(session.user.id) : null;

  if (!profile) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information and preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a photo to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            userId={profile.id}
            currentAvatarUrl={profile.avatar_url}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
