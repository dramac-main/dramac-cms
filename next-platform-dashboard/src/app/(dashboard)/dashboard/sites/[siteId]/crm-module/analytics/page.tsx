/**
 * CRM Analytics Dashboard Page
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Comprehensive analytics for CRM module with pipeline, deals, contacts, activities, and revenue
 */

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CRMAnalyticsDashboard } from "./crm-analytics-dashboard";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `CRM Analytics | ${PLATFORM.name}`,
  description: "CRM Analytics - Pipeline metrics, deal velocity, contact insights, and revenue tracking",
};

function AnalyticsLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      
      {/* Tabs */}
      <Skeleton className="h-10 w-full max-w-md" />
      
      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>
    </div>
  );
}

interface CRMAnalyticsPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function CRMAnalyticsPage({ params }: CRMAnalyticsPageProps) {
  const { siteId } = await params;

  return (
    <div className="flex flex-col h-full">
      {/* Back Navigation */}
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/crm-module`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to CRM
          </Button>
        </Link>
      </div>

      {/* Analytics Dashboard */}
      <Suspense fallback={<AnalyticsLoadingSkeleton />}>
        <CRMAnalyticsDashboard siteId={siteId} />
      </Suspense>
    </div>
  );
}
