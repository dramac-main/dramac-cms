import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Package, DollarSign, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SubscriptionList } from "@/components/modules/agency/subscription-list";
import { InstallModulePrompt } from "@/components/modules/install-module-prompt";

export const metadata: Metadata = {
  title: "My Modules | DRAMAC",
  description: "Manage your module subscriptions",
};

export default async function AgencyModulesPage() {
  const supabase = await createClient();

  // Get current user's agency
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

  // Get agency's subscriptions with module details from modules_v2
  const { data: subscriptions } = await supabase
    .from("agency_module_subscriptions" as any)
    .select(`
      *,
      module:modules_v2(*)
    `)
    .eq("agency_id", profile.agency_id)
    .order("created_at", { ascending: false });

  // Calculate stats
  const activeSubscriptions = (subscriptions as any[])?.filter((s: any) => s.status === "active") || [];
  const totalMonthlyCost = activeSubscriptions.reduce((sum: number, sub: any) => {
    return sum + ((sub.module as any)?.wholesale_price_monthly || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Install Module Prompt */}
      <InstallModulePrompt />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Modules</h1>
          <p className="text-muted-foreground">
            Manage your module subscriptions and pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/modules/pricing">
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/marketplace/v2">
              <Plus className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{activeSubscriptions.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                ${(totalMonthlyCost / 100).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Configure Markup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link 
              href="/dashboard/modules/pricing"
              className="flex items-center gap-2 text-green-700 dark:text-green-300 hover:underline"
            >
              <span>Set prices for clients</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      {activeSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No subscriptions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse the marketplace to find modules for your agency and clients
            </p>
            <Button asChild>
              <Link href="/marketplace/v2">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SubscriptionList subscriptions={subscriptions as any[] || []} />
      )}
    </div>
  );
}
