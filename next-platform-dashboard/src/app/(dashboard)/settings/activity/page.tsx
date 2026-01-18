import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed } from "@/components/activity";

export const metadata: Metadata = {
  title: "Activity Log",
  description: "View recent activity across your agency",
};

export default async function ActivityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    redirect("/onboarding");
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">
          View recent activity across your agency
        </p>
      </div>

      <ActivityFeed 
        agencyId={profile.agency_id} 
        limit={50} 
        showRefresh={true}
        title="All Activity"
      />
    </div>
  );
}
