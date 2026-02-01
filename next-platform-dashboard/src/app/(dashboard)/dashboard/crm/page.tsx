import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AgencyCRMDashboard } from "@/components/crm/agency-crm-dashboard";

export const metadata: Metadata = {
  title: "CRM | DRAMAC",
  description: "Customer Relationship Management across all your sites",
};

export default async function AgencyCRMPage() {
  const supabase = await createClient();

  // Get current user and agency
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    redirect("/dashboard");
  }

  // Get all sites for this agency
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, subdomain, custom_domain")
    .eq("agency_id", profile.agency_id)
    .order("name");

  return (
    <DashboardShell>
      <PageHeader
        title="CRM"
        description="Customer Relationship Management across all your sites"
      />
      
      <AgencyCRMDashboard agencyId={profile.agency_id} sites={sites || []} />
    </DashboardShell>
  );
}
