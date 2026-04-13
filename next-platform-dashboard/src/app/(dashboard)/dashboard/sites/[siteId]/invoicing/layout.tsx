/**
 * Invoicing Module Layout
 *
 * Persistent navigation for all invoicing pages.
 * Follows the marketing module layout pattern:
 * sticky header with back button, title, and horizontal nav tabs.
 */
import { redirect, notFound } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isModuleEnabledForSite } from "@/lib/actions/sites";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { InvoicingNav } from "@/modules/invoicing/components/invoicing-nav";

interface InvoicingLayoutProps {
  children: ReactNode;
  params: Promise<{ siteId: string }>;
}

function NavSkeleton() {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 w-20" />
      ))}
    </div>
  );
}

export default async function InvoicingLayout({
  children,
  params,
}: InvoicingLayoutProps) {
  const { siteId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: site } = await supabase
    .from("sites")
    .select("id, name")
    .eq("id", siteId)
    .single();

  if (!site) notFound();

  const hasAccess = await isModuleEnabledForSite(siteId, "invoicing");
  if (!hasAccess) {
    redirect(
      `/dashboard/sites/${siteId}?tab=modules&message=invoicing_not_installed`,
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container">
          {/* Row 1: Back + Title + Quick actions */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/sites/${siteId}?tab=invoicing`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-lg font-semibold">Invoicing &amp; Finance</h1>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/dashboard/sites/${siteId}/invoicing/invoices/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
              </Link>
            </div>
          </div>

          {/* Row 2: Navigation tabs */}
          <div className="flex items-center -mb-px overflow-x-auto scrollbar-thin scrollbar-thumb-muted">
            <Suspense fallback={<NavSkeleton />}>
              <InvoicingNav siteId={siteId} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
