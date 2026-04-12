/**
 * Admin Marketing Health Page
 *
 * Phase MKT-10: Super Admin Marketing View
 *
 * Platform-wide marketing health monitoring for super admins.
 */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { AdminMarketingDashboard } from "@/modules/marketing/components/admin/admin-marketing-dashboard";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Marketing Health | ${PLATFORM.name} Admin`,
  description: "Platform email marketing health monitoring and safety controls",
};

export default async function AdminMarketingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Health"
        description="Platform-wide email marketing health monitoring and safety controls"
      />
      <AdminMarketingDashboard />
    </div>
  );
}
