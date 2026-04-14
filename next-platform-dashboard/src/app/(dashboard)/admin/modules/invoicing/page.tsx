import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Settings } from "lucide-react";
import Link from "next/link";
import { AdminInvoicingDashboard } from "@/modules/invoicing/components/admin/admin-invoicing-dashboard";
import { AdminSiteInvoicingTable } from "@/modules/invoicing/components/admin/admin-site-table";

export const metadata: Metadata = {
  title: "Invoicing Health | Super Admin",
  description: "Platform-wide invoicing overview and analytics",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export default async function AdminInvoicingPage() {
  const supabase = (await createClient()) as AnySupabase;

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
        title="Invoicing Health"
        description="Platform-wide invoicing usage, revenue, and site analytics"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/modules/invoicing/settings">
              <Settings className="h-4 w-4 mr-2" />
              Global Settings
            </Link>
          </Button>
        }
      />

      <AdminInvoicingDashboard />
      <AdminSiteInvoicingTable />
    </div>
  );
}
