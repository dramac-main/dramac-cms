import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  Package, 
  Plus, 
  DollarSign, 
  MessageSquare, 
  BarChart3,
  Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { AdminModuleList } from "@/components/modules/admin/admin-module-list";

export const metadata: Metadata = {
  title: "Module Management | Admin",
  description: "Manage platform modules and plugins",
};

export default async function AdminModulesPage() {
  const supabase = await createClient();
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get module stats
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: totalSubscriptions } = await supabase
    .from("module_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Count trialing/incomplete subscriptions as "pending"
  let pendingRequests = 0;
  try {
    const { count } = await supabase
      .from("module_subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["trialing", "incomplete"]);
    pendingRequests = count || 0;
  } catch {
    // Table may not exist
  }

  const stats = {
    totalModules: modules?.length || 0,
    activeModules: modules?.filter(m => m.is_active).length || 0,
    totalSubscriptions: totalSubscriptions || 0,
    pendingRequests: pendingRequests,
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
              Requests ({stats.pendingRequests})
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalModules}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.activeModules}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalSubscriptions}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.pendingRequests}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/modules/studio">
          <Card className="hover:border-primary transition-colors cursor-pointer">
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
        
        <Link href="/admin/modules/pricing">
          <Card className="hover:border-primary transition-colors cursor-pointer">
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
          <Card className="hover:border-primary transition-colors cursor-pointer">
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

      {/* Module List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Modules</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <AdminModuleList modules={modules || []} />
        </TabsContent>
        
        <TabsContent value="active" className="mt-4">
          <AdminModuleList modules={modules?.filter(m => m.is_active) || []} />
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-4">
          <AdminModuleList modules={modules?.filter(m => !m.is_active) || []} />
        </TabsContent>
        
        <TabsContent value="featured" className="mt-4">
          <AdminModuleList modules={modules?.filter(m => m.is_featured) || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
