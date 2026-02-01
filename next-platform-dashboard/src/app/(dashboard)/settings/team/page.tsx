import { Metadata } from "next";
import { getSession } from "@/lib/actions/auth";
import { getAgencyTeam } from "@/lib/actions/team";
import { TeamMembersList } from "@/components/settings/team-members-list";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Team Management | DRAMAC",
};

export default async function TeamSettingsPage() {
  const session = await getSession();
  if (!session) {
    return <div>Please log in.</div>;
  }

  const team = await getAgencyTeam(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage your team members and their permissions"
        actions={<InviteMemberDialog />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {team?.members?.length || 0} member(s) in your agency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersList members={team?.members || []} />
        </CardContent>
      </Card>
    </div>
  );
}
