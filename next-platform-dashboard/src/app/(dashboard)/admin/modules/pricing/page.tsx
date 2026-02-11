import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { WholesalePricingTable } from "@/components/modules/admin/wholesale-pricing-table";

export const metadata: Metadata = {
  title: "Wholesale Pricing | Super Admin",
  description: "Set wholesale pricing for all modules",
};

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export default async function WholesalePricingPage() {
  const supabase = await createClient() as AnySupabase;
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get all modules with their pricing from v2 table
  const { data: modules } = await (supabase as any)
    .from("modules_v2")
    .select(`
      id, slug, name, icon, category, install_level, status,
      pricing_type, wholesale_price_monthly, wholesale_price_yearly,
      wholesale_price_one_time, suggested_retail_monthly, suggested_retail_yearly,
      lemon_product_id, lemon_variant_monthly_id, lemon_variant_yearly_id
    `)
    .order("name");

  // Calculate stats
  const freeModules = modules?.filter((m: { wholesale_price_monthly: number | null }) => 
    (m.wholesale_price_monthly || 0) === 0
  ).length || 0;
  
  const paidModules = modules?.filter((m: { wholesale_price_monthly: number | null }) => 
    (m.wholesale_price_monthly || 0) > 0
  ).length || 0;
  
  const totalWholesale = modules?.reduce((sum: number, m: { wholesale_price_monthly: number | null }) => 
    sum + (m.wholesale_price_monthly || 0), 0
  ) || 0;
  
  const avgWholesale = paidModules > 0 ? totalWholesale / paidModules / 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Link href="/admin/modules" className="hover:underline">
              Module Management
            </Link>
            <span>/</span>
            <span>Wholesale Pricing</span>
          </div>
          <h1 className="text-3xl font-bold">Wholesale Pricing</h1>
          <p className="text-muted-foreground">
            Set the prices agencies pay for each module
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Wholesale prices</strong> are what agencies pay the platform. 
          Agencies then add their own <strong>markup</strong> when selling to clients.
          Example: You set K250/mo wholesale → Agency adds 100% markup → Client pays K500/mo
        </AlertDescription>
      </Alert>

      {/* Pricing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Free Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{freeModules}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{paidModules}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Wholesale Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              K{avgWholesale.toFixed(2)}/mo
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Pricing</CardTitle>
          <CardDescription>
            Click on a price to edit. Changes save automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WholesalePricingTable modules={modules || []} />
        </CardContent>
      </Card>
    </div>
  );
}
