/**
 * Admin Billing Dashboard
 *
 * Phase BIL-09: Super Admin Revenue Dashboard
 *
 * Platform administrator dashboard for billing oversight:
 * - MRR/ARR/Agencies/Churn stat cards
 * - Revenue chart (MRR history)
 * - Plan distribution
 * - Trial funnel
 * - Billing activity feed
 * - Cancellation reasons
 * - Platform costs vs revenue
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { AdminRevenueOverview } from "@/components/admin/admin-revenue-overview";

export const metadata = {
  title: "Billing Overview - Admin",
  description: "Platform billing and revenue metrics",
};

export default async function AdminBillingPage() {
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

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing Overview"
        description="Revenue metrics, subscription analytics, and platform financials"
      >
        <Link href="/admin/billing/revenue">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Deep Analytics
          </Button>
        </Link>
      </PageHeader>

      <Suspense fallback={<AdminBillingSkeleton />}>
        <AdminRevenueOverview />
      </Suspense>
    </div>
  );
}

function AdminBillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-60" />
        <Skeleton className="h-60" />
      </div>
    </div>
  );
}
