import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Grid3x3, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppsGrid } from "@/components/portal/apps/apps-grid";
import { EmptyAppsState } from "@/components/portal/apps/empty-apps-state";
import { PortalHeader } from "@/components/portal/portal-header";

export const metadata: Metadata = {
  title: "My Apps | Client Portal",
  description: "Access your installed apps and modules",
};

interface ClientInstallation {
  id: string;
  installed_at: string;
  settings: Record<string, unknown>;
  custom_name: string | null;
  custom_icon: string | null;
  module: Record<string, unknown>;
}

export default async function PortalAppsPage() {
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
  
  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get client with their agency
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", impersonatingClientId)
    .single();

  if (error || !client) {
    redirect("/dashboard");
  }

  // Get impersonating user info
  const { data: { user } } = await supabase.auth.getUser();

  // First try to get client-level module installations using type assertion
  const { data: clientInstallations } = await supabase
    .from("client_module_installations")
    .select(`
      *,
      module:modules_v2(*)
    `)
    .eq("client_id", client.id)
    .eq("is_active", true)
    .order("installed_at", { ascending: false }) as unknown as { data: ClientInstallation[] | null };

  // Map client installations to module format
  let installedModules = (clientInstallations || []).map(i => ({
    ...(i.module as Record<string, unknown>),
    installation_id: i.id,
    installed_at: i.installed_at,
    settings: i.settings || {},
    custom_name: i.custom_name,
    custom_icon: i.custom_icon,
  }));

  // If no client installations, fall back to agency subscriptions (legacy support)
  if (installedModules.length === 0 && client.agency_id) {
    // Check agency_module_subscriptions
    const { data: subscriptions } = await supabase
      .from("agency_module_subscriptions")
      .select(`
        id,
        module:modules_v2(id, slug, name, description, icon, category)
      `)
      .eq("agency_id", client.agency_id)
      .eq("status", "active");

    // Map subscription modules
    const allSubs = subscriptions || [];

    installedModules = allSubs
      .filter((item): item is typeof item & { module: NonNullable<typeof item.module> } => 
        item.module !== null && typeof item.module === "object" && "id" in item.module
      )
      .map(item => ({
        ...(item.module as unknown as Record<string, unknown>),
        installation_id: item.id,
        installed_at: new Date().toISOString(),
        settings: {},
        custom_name: null,
        custom_icon: null,
      }));
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader 
        clientName={client.name} 
        isImpersonating={true}
        impersonatorEmail={user?.email}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Grid3x3 className="h-8 w-8" />
                My Apps
              </h1>
              <p className="text-muted-foreground">
                Access your business tools and applications
              </p>
            </div>
            <Button asChild>
              <Link href="/portal/apps/browse">
                <Plus className="h-4 w-4 mr-2" />
                Browse Apps
              </Link>
            </Button>
          </div>

          {/* Search */}
          {installedModules.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your apps..."
                className="pl-10"
              />
            </div>
          )}

          {/* Apps Grid */}
          {installedModules.length === 0 ? (
            <EmptyAppsState />
          ) : (
            <AppsGrid modules={installedModules as Parameters<typeof AppsGrid>[0]["modules"]} />
          )}
        </div>
      </main>
    </div>
  );
}
