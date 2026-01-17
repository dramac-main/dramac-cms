import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { RequestList } from "@/components/modules/admin/request-list";

export const metadata: Metadata = {
  title: "Module Requests | Super Admin",
  description: "Review agency module requests",
};

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export default async function ModuleRequestsPage() {
  const supabase = await createClient() as AnySupabase;
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get all requests with agency info
  let requests: Array<{
    id: string;
    title: string;
    description: string;
    use_case: string | null;
    target_audience: string | null;
    suggested_install_level: string;
    suggested_category: string | null;
    priority: string;
    budget_range: string | null;
    willing_to_fund: boolean;
    status: string;
    upvotes: number;
    submitted_at: string;
    agency: { id: string; name: string } | null;
    submitter: { id: string; name: string | null; email: string } | null;
  }> = [];
  
  try {
    const { data } = await supabase
      .from("module_requests")
      .select(`
        *,
        agency:agencies(id, name),
        submitter:profiles!submitted_by(id, name, email)
      `)
      .order("submitted_at", { ascending: false });
    
    requests = data || [];
  } catch {
    // Table may not exist yet
  }

  const stats = {
    total: requests.length,
    submitted: requests.filter(r => r.status === "submitted").length,
    reviewing: requests.filter(r => r.status === "reviewing").length,
    approved: requests.filter(r => r.status === "approved").length,
    inProgress: requests.filter(r => r.status === "in_progress").length,
    completed: requests.filter(r => r.status === "completed").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

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
            <span>Requests</span>
          </div>
          <h1 className="text-3xl font-bold">Module Requests</h1>
          <p className="text-muted-foreground">
            Review and manage module requests from agencies
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
            <p className="text-xs text-muted-foreground">Reviewing</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Building</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Click on a request to view details and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new">
            <TabsList>
              <TabsTrigger value="new">
                New ({stats.submitted})
              </TabsTrigger>
              <TabsTrigger value="reviewing">
                Reviewing ({stats.reviewing})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats.approved + stats.inProgress})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({stats.rejected})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="mt-4">
              <RequestList requests={requests.filter(r => r.status === "submitted")} />
            </TabsContent>
            
            <TabsContent value="reviewing" className="mt-4">
              <RequestList requests={requests.filter(r => r.status === "reviewing")} />
            </TabsContent>
            
            <TabsContent value="approved" className="mt-4">
              <RequestList requests={requests.filter(r => ["approved", "in_progress"].includes(r.status))} />
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              <RequestList requests={requests.filter(r => r.status === "completed")} />
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-4">
              <RequestList requests={requests.filter(r => r.status === "rejected")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
