import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, Info, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { MarkupPricingList } from "@/components/modules/agency/markup-pricing-list";

export const metadata: Metadata = {
  title: "Module Pricing | DRAMAC",
  description: "Set your markup pricing for clients",
};

export default async function ModulePricingPage() {
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

  // Get agency's subscriptions with module details
  const { data: subscriptions } = await supabase
    .from("agency_module_subscriptions" as any)
    .select(`
      *,
      module:modules_v2(*)
    `)
    .eq("agency_id", profile.agency_id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Filter to client/site level modules only (agency modules don't need markup)
  const resellableModules = (subscriptions as any[] || []).filter((sub: any) => {
    const level = (sub.module as any)?.install_level;
    return level === "client" || level === "site";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/dashboard/modules/subscriptions" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Modules
        </Link>
        <h1 className="text-3xl font-bold">Pricing Settings</h1>
        <p className="text-muted-foreground">
          Set your markup to determine what clients pay
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How markup works:</strong> You pay the wholesale price, add your markup, 
          and clients pay your retail price. You keep 100% of the markup as profit!
        </AlertDescription>
      </Alert>

      {resellableModules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No resellable modules</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to client-level or site-level modules to configure pricing
            </p>
            <Link href="/marketplace/v2" className="text-primary hover:underline">
              Browse Marketplace
            </Link>
          </CardContent>
        </Card>
      ) : (
        <MarkupPricingList subscriptions={resellableModules} />
      )}
    </div>
  );
}
