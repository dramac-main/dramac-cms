import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PortalHeader } from "@/components/portal/portal-header";
import { AppsGrid } from "@/components/portal/apps/apps-grid";
import { EmptyAppsState } from "@/components/portal/apps/empty-apps-state";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteId } = await params;
  const supabase = await createClient();
  
  const { data: site } = await supabase
    .from("sites")
    .select("name")
    .eq("id", siteId)
    .single();

  return {
    title: `${site?.name || "Site"} Apps | Client Portal`,
    description: "Manage apps for this website",
  };
}

export default async function SiteAppsPage({ params }: PageProps) {
  const { siteId } = await params;
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;

  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get impersonating user info
  const { data: { user } } = await supabase.auth.getUser();

  // Get client info
  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", impersonatingClientId)
    .single();

  if (!client) {
    redirect("/dashboard");
  }

  // Verify site belongs to client
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("client_id", client.id)
    .single();

  if (siteError || !site) {
    notFound();
  }

  // Define the module type to match AppsGrid expectations
  interface InstalledModule {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    slug: string;
    category: string;
    installation_id: string;
    installed_at: string;
    settings: Record<string, unknown>;
  }

  // Get site-level module installations (separate queries - no FK relationship)
  // Note: custom_name/custom_icon don't exist in schema - removed from select
  const { data: rawInstallations } = await supabase
    .from("site_module_installations")
    .select("id, module_id, installed_at, settings")
    .eq("site_id", siteId)
    .eq("is_enabled", true)
    .order("installed_at", { ascending: false });

  // Fetch modules separately if there are installations
  let installedModules: InstalledModule[] = [];
  if (rawInstallations?.length) {
    const moduleIds = rawInstallations.map((i) => i.module_id);
    const { data: modules } = await supabase
      .from("modules_v2")
      .select("id, name, description, icon, slug, category")
      .in("id", moduleIds)
      .eq("status", "active");

    const moduleMap = new Map((modules || []).map((m) => [m.id, m]));
    
    installedModules = rawInstallations
      .filter((i) => moduleMap.has(i.module_id))
      .map((i) => {
        const mod = moduleMap.get(i.module_id)!;
        return {
          id: mod.id,
          name: mod.name,
          description: mod.description,
          icon: mod.icon || "📦",
          slug: mod.slug,
          category: mod.category,
          installation_id: i.id,
          installed_at: i.installed_at || new Date().toISOString(),
          settings: (i.settings || {}) as Record<string, unknown>,
        };
      });
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
          <div>
            <Link 
              href={`/portal/sites/${siteId}`} 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {site.name}
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Globe className="h-8 w-8" />
                  Site Apps
                </h1>
                <p className="text-muted-foreground">
                  Apps installed on {site.name}
                </p>
              </div>
            </div>
          </div>

          {/* Apps Grid */}
          {installedModules.length === 0 ? (
            <EmptyAppsState 
              title="No Site Apps"
              description="There are no apps installed specifically for this site. Contact your agency to add site-level functionality."
              showBrowseButton={false}
            />
          ) : (
            <AppsGrid
              modules={installedModules}
              basePath={`/portal/sites/${siteId}/apps`}
            />
          )}
        </div>
      </main>
    </div>
  );
}
