import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ModuleSandbox } from "@/lib/modules/runtime/module-sandbox";
import { ModuleErrorBoundary } from "@/lib/modules/runtime/module-error-boundary";
import type { ModuleManifest } from "@/lib/modules/types/module-manifest";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("modules")
    .select("name, description")
    .eq("slug", slug)
    .single();

  return {
    title: `${module?.name || "App"} | Client Portal`,
    description: module?.description || "Use your app",
  };
}

// Create a minimal manifest from database module data
function createModuleManifest(module: { id: string; slug: string; name: string; description: string | null; version: string }): ModuleManifest {
  return {
    id: module.id,
    slug: module.slug,
    name: module.name,
    version: module.version || "1.0.0",
    description: module.description || undefined,
    installLevel: "site",
    entryPoints: {},
    hooks: [],
    permissions: [],
    settingsSchema: { type: "object", properties: {} },
    defaultSettings: {},
  };
}

export default async function PortalAppPage({ params }: PageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;

  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get the module
  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (moduleError || !module) {
    notFound();
  }

  // Verify client has access through module_subscriptions (via agency)
  const { data: clientData } = await supabase
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", impersonatingClientId)
    .single();

  if (!clientData) {
    redirect("/portal/apps");
  }

  // Check if the client's agency has this module
  const { data: subscription, error: subError } = await supabase
    .from("module_subscriptions")
    .select("*, module:modules(*)")
    .eq("agency_id", clientData.agency_id)
    .eq("module_id", module.id)
    .eq("status", "active")
    .single();

  if (subError || !subscription) {
    redirect("/portal/apps");
  }

  const manifest = createModuleManifest(module);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/apps">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Apps
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{module.icon || '📦'}</span>
              <div>
                <h1 className="font-semibold">{module.name}</h1>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <ModuleErrorBoundary
          moduleId={module.id}
          moduleName={module.name}
          moduleSlug={module.slug}
        >
          <ModuleSandbox
            module={{
              id: module.id,
              name: module.name,
              slug: module.slug,
              packageUrl: '',
              manifest,
            }}
            settings={{}}
            context={{
              clientId: clientData?.id,
              agencyId: clientData?.agency_id,
            }}
            permissions={[]}
          />
        </ModuleErrorBoundary>
      </div>
    </div>
  );
}
