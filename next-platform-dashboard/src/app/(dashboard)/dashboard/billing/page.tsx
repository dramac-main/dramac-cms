/**
 * Dashboard Billing Page
 * 
 * Phase EM-59B: Paddle Billing Integration
 * 
 * Billing overview page in the dashboard area.
 * Shows subscription status and handles success/cancelled redirects from Paddle.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PaddleSubscriptionCard } from "@/components/billing/paddle-subscription-card";
import { UsageDashboard } from "@/components/billing/usage-dashboard";
import { PaddleInvoiceHistory } from "@/components/billing/paddle-invoice-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Billing | DRAMAC",
  description: "Manage your subscription and view billing history",
};

interface BillingPageProps {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const showSuccess = params.success === 'true';
  const showCancelled = params.cancelled === 'true';
  
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const supabase = await createClient();
  
  // Get user's agency
  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", session.user.id)
    .single();

  if (!member) {
    redirect("/dashboard");
  }

  return (
    <div className="container py-8">
      {/* Success Alert - shown after successful Paddle checkout */}
      {showSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Payment Successful!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Thank you for your subscription! Your account has been upgraded. 
            It may take a few moments for all features to become available.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Cancelled Alert - shown if user cancelled checkout */}
      {showCancelled && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <XCircle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Checkout Cancelled
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Your checkout was cancelled. No charges were made. 
            You can try again anytime from the pricing page.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and view billing history
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pricing">
            <CreditCard className="w-4 h-4 mr-2" />
            View Plans
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-[280px]" />}>
              <PaddleSubscriptionCard agencyId={member.agency_id} />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[280px]" />}>
              <UsageDashboard agencyId={member.agency_id} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <PaddleInvoiceHistory />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
