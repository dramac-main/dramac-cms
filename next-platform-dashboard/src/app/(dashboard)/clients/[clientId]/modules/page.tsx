import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Package, ArrowLeft, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientModulesList } from "@/components/modules/client/client-modules-list";
import { AvailableModulesGrid } from "@/components/modules/client/available-modules-grid";
import { PLATFORM } from "@/lib/constants/platform";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { clientId } = await params;
  const supabase = await createClient();
  
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  return {
    title: `Modules - ${client?.name || "Client"} | ${PLATFORM.name}`,
    description: "Manage modules for this client",
  };
}

export default async function ClientModulesPage({ params }: PageProps) {
  const { clientId } = await params;
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

  // Get client details
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(`
      *,
      agency:agencies(id, name)
    `)
    .eq("id", clientId)
    .eq("agency_id", profile.agency_id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Get client's installed modules (separate queries - FK was dropped)
  const { data: rawInstalled } = await supabase
    .from("client_module_installations" as any)
    .select("*")
    .eq("client_id", clientId);

  // Get agency's subscriptions
  const { data: rawSubscriptions } = await supabase
    .from("agency_module_subscriptions" as any)
    .select("*")
    .eq("agency_id", profile.agency_id)
    .eq("status", "active");

  // Fetch all needed modules in one query
  const allModuleIds = [
    ...((rawInstalled as any[]) || []).map((i: any) => i.module_id),
    ...((rawSubscriptions as any[]) || []).map((s: any) => s.module_id),
  ];
  const uniqueModuleIds = [...new Set(allModuleIds)];

  let moduleMap = new Map();
  if (uniqueModuleIds.length > 0) {
    const { data: modules } = await supabase
      .from("modules_v2")
      .select("*")
      .in("id", uniqueModuleIds);
    moduleMap = new Map((modules || []).map((m: any) => [m.id, m]));
  }

  const installedModulesList = ((rawInstalled as any[]) || []).map((i: any) => ({
    ...i,
    module: moduleMap.get(i.module_id) || null,
  }));
  const installedModuleIds = new Set(installedModulesList.map((m: any) => m.module_id));

  const agencySubscriptions = ((rawSubscriptions as any[]) || []).map((s: any) => ({
    ...s,
    module: moduleMap.get(s.module_id) || null,
  }));

  // Filter to client-level modules that aren't already installed
  const availableSubscriptions = agencySubscriptions.filter((sub: any) => {
    const level = (sub.module as any)?.install_level;
    return level === "client" && !installedModuleIds.has(sub.module_id);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href={`/dashboard/clients/${clientId}`} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {client.name}
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.name} - Modules</h1>
              <p className="text-muted-foreground">
                Manage apps and tools available to this client
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/marketplace/v2">
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
              Installed Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{installedModulesList.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {installedModulesList.filter((m: any) => m.is_enabled).length}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available to Install
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{availableSubscriptions.length}</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Installed/Available */}
      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed">
            Installed ({installedModulesList.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availableSubscriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-4">
          <ClientModulesList 
            modules={installedModulesList} 
            clientId={clientId} 
          />
        </TabsContent>

        <TabsContent value="available" className="mt-4">
          {availableSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No modules available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Subscribe to client-level modules in the marketplace to make them available here
                </p>
                <Button asChild>
                  <Link href="/marketplace/v2">Browse Marketplace</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AvailableModulesGrid 
              subscriptions={availableSubscriptions}
              clientId={clientId}
              agencyId={profile.agency_id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
