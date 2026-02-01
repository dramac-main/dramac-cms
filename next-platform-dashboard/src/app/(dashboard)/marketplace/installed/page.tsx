import Link from "next/link";
import { ArrowLeft, Package, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/page-header";

// This would fetch from the database for the selected site
// For now, showing empty state
export default function InstalledModulesPage() {
  const installedModules: unknown[] = []; // Would come from getInstalledModules(siteId)

  return (
    <div className="container py-6 max-w-5xl">
      {/* Back Link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Link>

      <PageHeader
        title="Installed Modules"
        description="Manage modules installed on your sites"
        actions={
          <Button asChild>
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        }
      />

      {installedModules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No Modules Installed</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Extend your sites with powerful modules from the marketplace.
              Install analytics, forms, e-commerce, and more.
            </p>
            <Button asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Would map over installedModules here */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-medium">Google Analytics 4</h3>
                  <p className="text-sm text-muted-foreground">
                    Installed 3 days ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Enabled</span>
                  <Switch checked={true} />
                </div>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
