import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgencyCRMDashboard } from "@/components/crm/agency-crm-dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
    <div className="space-y-4">
      {/* Back Navigation */}
      <div className="px-1">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <AgencyCRMDashboard agencyId={profile.agency_id} sites={sites || []} />
    </div>
  );
}
