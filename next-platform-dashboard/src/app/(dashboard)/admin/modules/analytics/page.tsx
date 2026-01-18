import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Users, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Module Analytics | Super Admin",
  description: "View module usage and revenue analytics",
};

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export default async function ModuleAnalyticsPage() {
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

  // Get modules with subscription counts
  let modules: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    category: string;
    wholesale_price_monthly: number;
    status: string;
    install_count: number;
  }> = [];
  
  try {
    const { data } = await supabase
      .from("modules_v2")
      .select("id, name, slug, icon, category, wholesale_price_monthly, status, install_count")
      .eq("status", "active")
      .order("install_count", { ascending: false });
    
    modules = data || [];
  } catch {
    // Table may not exist yet
  }

  // Get subscription stats
  let totalSubscriptions = 0;
  let activeSubscriptions = 0;
  let monthlyRevenue = 0;

  try {
    // Total subscriptions
    const { count: total } = await (supabase as any)
      .from("agency_module_subscriptions")
      .select("*", { count: "exact", head: true });
    totalSubscriptions = total || 0;

    // Active subscriptions
    const { count: active } = await (supabase as any)
      .from("agency_module_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    activeSubscriptions = active || 0;

    // Revenue calculation
    const { data: revenueData } = await (supabase as any)
      .from("agency_module_subscriptions")
      .select(`
        module:modules_v2(wholesale_price_monthly)
      `)
      .eq("status", "active");

    monthlyRevenue = revenueData?.reduce((sum: number, sub: { module: { wholesale_price_monthly: number } | null }) => {
      return sum + (sub.module?.wholesale_price_monthly || 0);
    }, 0) || 0;
  } catch {
    // Tables may not exist yet
  }

  // Get installation counts by level
  let agencyInstalls = 0;
  let clientInstalls = 0;
  let siteInstalls = 0;

  try {
    const [agency, client, site] = await Promise.all([
      (supabase as any).from("agency_module_installations").select("*", { count: "exact", head: true }),
      (supabase as any).from("client_module_installations").select("*", { count: "exact", head: true }),
      (supabase as any).from("site_module_installations").select("*", { count: "exact", head: true }),
    ]);
    
    agencyInstalls = agency.count || 0;
    clientInstalls = client.count || 0;
    siteInstalls = site.count || 0;
  } catch {
    // Tables may not exist yet
  }

  const totalInstalls = agencyInstalls + clientInstalls + siteInstalls;

  // Get top modules by revenue
  const topModules = modules
    .filter(m => m.wholesale_price_monthly > 0)
    .slice(0, 5);

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
            <span>Analytics</span>
          </div>
          <h1 className="text-3xl font-bold">Module Analytics</h1>
          <p className="text-muted-foreground">
            Usage, revenue, and performance metrics
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(monthlyRevenue / 100).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              From wholesale subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {totalSubscriptions} total all time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Installations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInstalls}</div>
            <p className="text-xs text-muted-foreground">
              Across all levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground">
              Published in marketplace
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Installation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Agency Installations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{agencyInstalls}</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-purple-600 rounded-full"
                style={{ width: totalInstalls > 0 ? `${(agencyInstalls / totalInstalls) * 100}%` : "0%" }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Client Installations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{clientInstalls}</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full"
                style={{ width: totalInstalls > 0 ? `${(clientInstalls / totalInstalls) * 100}%` : "0%" }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Site Installations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{siteInstalls}</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-green-600 rounded-full"
                style={{ width: totalInstalls > 0 ? `${(siteInstalls / totalInstalls) * 100}%` : "0%" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Modules by Installs</CardTitle>
            <CardDescription>Most popular modules by installation count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modules.slice(0, 5).map((module, index) => (
                <div key={module.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-medium w-4">{index + 1}</span>
                    <span className="text-xl">{module.icon || "📦"}</span>
                    <div>
                      <Link 
                        href={`/admin/modules/${module.id}`}
                        className="font-medium hover:underline"
                      >
                        {module.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{module.category}</p>
                    </div>
                  </div>
                  <span className="font-medium">{module.install_count || 0}</span>
                </div>
              ))}
              {modules.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No modules yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Revenue Modules</CardTitle>
            <CardDescription>Highest revenue generating modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topModules.map((module, index) => (
                <div key={module.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-medium w-4">{index + 1}</span>
                    <span className="text-xl">{module.icon || "📦"}</span>
                    <div>
                      <Link 
                        href={`/admin/modules/${module.id}`}
                        className="font-medium hover:underline"
                      >
                        {module.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        ${(module.wholesale_price_monthly / 100).toFixed(2)}/mo wholesale
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-green-600">
                    ${((module.wholesale_price_monthly * (module.install_count || 0)) / 100).toFixed(0)}
                  </span>
                </div>
              ))}
              {topModules.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No paid modules yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Module Categories</CardTitle>
          <CardDescription>Distribution of modules across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(
              modules.reduce((acc: Record<string, number>, m) => {
                acc[m.category] = (acc[m.category] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="capitalize">{category}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(count / modules.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            {modules.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No modules yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
