/**
 * Admin Landing Pages Health Page
 *
 * Phase LPB-10: Super Admin Health View
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLPPlatformStats } from "@/modules/marketing/actions/admin-landing-pages";
import { LPAdminDashboard } from "@/modules/marketing/components/admin/lp-admin-dashboard";

export const metadata: Metadata = {
  title: "Landing Pages Health — Admin",
};

export default async function AdminLandingPagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") redirect("/dashboard");

  const stats = await getLPPlatformStats();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Landing Pages — Platform Health</h1>
        <p className="text-muted-foreground">
          Monitor landing page usage, performance, and migration status across
          all sites.
        </p>
      </div>
      <LPAdminDashboard stats={stats} />
    </div>
  );
}
