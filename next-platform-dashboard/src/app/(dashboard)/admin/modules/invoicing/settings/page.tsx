import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminFeatureFlags } from "@/modules/invoicing/components/admin/admin-feature-flags";

export const metadata: Metadata = {
  title: "Invoicing Settings | Super Admin",
  description: "Global invoicing defaults and feature flags",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export default async function AdminInvoicingSettingsPage() {
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
        title="Invoicing Global Settings"
        description="Platform-wide defaults and feature flags for the invoicing module"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/modules/invoicing">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Link>
          </Button>
        }
      />

      <AdminFeatureFlags />
    </div>
  );
}
