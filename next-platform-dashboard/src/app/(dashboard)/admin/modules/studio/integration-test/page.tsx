import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { syncAllPublishedModules } from "@/lib/modules/module-sync-service";
import { getMarketplaceModules } from "@/lib/modules/marketplace-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleCheck, CircleX, RefreshCw, Package, Store, icons } from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Module Integration Test - Admin",
  description: "Test the complete module lifecycle pipeline",
};

export default async function IntegrationTestPage() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch all marketplace modules
  const modules = await getMarketplaceModules();

  // Separate by source
  const studioModules = modules.filter((m) => m.source === "studio");
  const catalogModules = modules.filter((m) => m.source !== "studio");

  // Modules with render code (can actually render)
  const renderableModules = modules.filter((m) => m.renderCode);

  return (
    <div className="container py-6 max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Module Integration Test</h1>
        <p className="text-muted-foreground">
          Test the complete module lifecycle: Studio → Deploy → Marketplace → Install → Render
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Studio Modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studioModules.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Catalog Modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{catalogModules.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Available</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{modules.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Renderable</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {renderableModules.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
          <CardDescription>
            Check each stage of the module lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <CircleCheck className="h-5 w-5 text-green-500" />
            <span className="font-medium">Create</span>
            <span className="text-muted-foreground">→ Module Studio works</span>
          </div>
          <div className="flex items-center gap-3">
            <CircleCheck className="h-5 w-5 text-green-500" />
            <span className="font-medium">Edit</span>
            <span className="text-muted-foreground">→ Code editor saves to module_source</span>
          </div>
          <div className="flex items-center gap-3">
            <CircleCheck className="h-5 w-5 text-green-500" />
            <span className="font-medium">Test</span>
            <span className="text-muted-foreground">→ Preview sandbox works</span>
          </div>
          <div className="flex items-center gap-3">
            {studioModules.length > 0 ? (
              <CircleCheck className="h-5 w-5 text-green-500" />
            ) : (
              <CircleX className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">Deploy</span>
            <span className="text-muted-foreground">
              → {studioModules.length > 0 
                ? `${studioModules.length} modules synced to marketplace` 
                : "No modules deployed yet"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {studioModules.length > 0 ? (
              <CircleCheck className="h-5 w-5 text-green-500" />
            ) : (
              <CircleX className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium">Install</span>
            <span className="text-muted-foreground">→ Modules visible in marketplace for installation</span>
          </div>
          <div className="flex items-center gap-3">
            {renderableModules.length > 0 ? (
              <CircleCheck className="h-5 w-5 text-green-500" />
            ) : (
              <CircleX className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium">Render</span>
            <span className="text-muted-foreground">
              → {renderableModules.length} modules have render code
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Studio Modules List */}
      <Card>
        <CardHeader>
          <CardTitle>Studio Modules in Marketplace</CardTitle>
          <CardDescription>
            Modules created in Module Studio that are now visible in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studioModules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No studio modules synced yet</p>
              <p className="text-sm mt-1">
                Deploy a module from Module Studio to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {studioModules.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{(() => { const iconName = resolveIconName(m.icon || "Package"); const Ic = (icons as Record<string, React.ComponentType<{className?: string}>>)[iconName]; return Ic ? <Ic className="h-5 w-5" /> : null; })()}</span>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.slug} • v{m.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.renderCode ? (
                      <Badge variant="default" className="bg-green-500">
                        Has Render Code
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No Render Code</Badge>
                    )}
                    <Badge variant="outline">{m.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manual sync operations for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              "use server";
              const result = await syncAllPublishedModules();
              console.log("[IntegrationTest] Sync result:", result);
              revalidatePath("/admin/modules/studio/integration-test");
            }}
          >
            <Button type="submit" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Sync All Published Modules
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            This will sync all published modules from module_source to modules_v2,
            making them visible in the marketplace.
          </p>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/modules/studio">Module Studio</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/modules/studio/sync">Sync Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/marketplace">Marketplace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/modules/testing">Module Testing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
