import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  Package, 
  Plus, 
  DollarSign, 
  MessageSquare, 
  BarChart3,
  TrendingUp,
  RefreshCw,
  TestTube2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { AdminModuleList } from "@/components/modules/admin/admin-module-list";
import { ModuleStatsCards } from "@/components/modules/admin/module-stats-cards";

export const metadata: Metadata = {
  title: "Module Management | Super Admin",
  description: "Manage platform modules and plugins",
};

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export default async function AdminModulesPage() {
  const supabase = await createClient() as AnySupabase;
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  
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

  // Get all modules from v2 table
  const { data: modules } = await supabase
    .from("modules_v2")
    .select("*")
    .order("created_at", { ascending: false });

  // Get subscription stats
  const { count: totalSubscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get pending requests count
  let pendingRequests = 0;
  try {
    const { count } = await supabase
      .from("module_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted");
    pendingRequests = count || 0;
  } catch {
    // Table may not exist yet
  }

  // Calculate revenue (sum of wholesale prices * active subscriptions)
  let monthlyRevenue = 0;
  try {
    const { data: revenueData } = await supabase
      .from("agency_module_subscriptions")
      .select(`
        module:modules_v2(wholesale_price_monthly)
      `)
      .eq("status", "active");

    monthlyRevenue = revenueData?.reduce((sum: number, sub: { module: { wholesale_price_monthly: number } | null }) => {
      return sum + (sub.module?.wholesale_price_monthly || 0);
    }, 0) || 0;
  } catch {
    // Table may not exist yet
  }

  const stats = {
    totalModules: modules?.length || 0,
    activeModules: modules?.filter((m: { status: string }) => m.status === "active").length || 0,
    draftModules: modules?.filter((m: { status: string }) => m.status === "draft").length || 0,
    totalSubscriptions: totalSubscriptions || 0,
    pendingRequests: pendingRequests,
    monthlyRevenue: monthlyRevenue / 100, // Convert cents to dollars
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and monitor platform modules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/modules/requests">
              <MessageSquare className="h-4 w-4 mr-2" />
              Requests
              {stats.pendingRequests > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingRequests}
                </span>
              )}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/modules/studio">
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <ModuleStatsCards stats={stats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/modules/studio">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Module Studio
              </CardTitle>
              <CardDescription>
                Create new modules with the visual builder
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/admin/modules/testing">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube2 className="h-5 w-5" />
                Module Testing
              </CardTitle>
              <CardDescription>
                Test sites, beta program, and test runs
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/admin/modules/pricing">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Wholesale Pricing
              </CardTitle>
              <CardDescription>
                Set platform pricing for all modules
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/admin/modules/analytics">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Module Analytics
              </CardTitle>
              <CardDescription>
                View usage, revenue, and performance
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Module List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Modules</CardTitle>
          <CardDescription>
            Manage your module catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All ({stats.totalModules})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({stats.activeModules})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Drafts ({stats.draftModules})
              </TabsTrigger>
              <TabsTrigger value="deprecated">
                Deprecated
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <AdminModuleList modules={modules || []} />
            </TabsContent>
            
            <TabsContent value="active" className="mt-4">
              <AdminModuleList modules={modules?.filter((m: { status: string }) => m.status === "active") || []} />
            </TabsContent>
            
            <TabsContent value="draft" className="mt-4">
              <AdminModuleList modules={modules?.filter((m: { status: string }) => m.status === "draft") || []} />
            </TabsContent>
            
            <TabsContent value="deprecated" className="mt-4">
              <AdminModuleList modules={modules?.filter((m: { status: string }) => m.status === "deprecated") || []} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
