import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Package, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Apps | Client Portal",
  description: "Access your apps and tools",
};

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

  if (error || !client || !client.agency_id) {
    redirect("/dashboard");
  }

  // Get agency's active module subscriptions
  const { data: subscriptions } = await supabase
    .from("module_subscriptions")
    .select(`
      id,
      module:modules(id, slug, name, description, icon, category)
    `)
    .eq("agency_id", client.agency_id)
    .eq("status", "active");

  // Filter to only items with valid modules
  const installedModules = (subscriptions || []).filter(
    (item): item is typeof item & { module: NonNullable<typeof item.module> } => 
      item.module !== null && typeof item.module === "object" && "id" in item.module
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Apps</h1>
        <p className="text-muted-foreground mt-1">
          Access your tools and applications
        </p>
      </div>

      {installedModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installedModules.map((item) => (
            <Link key={item.id} href={`/portal/apps/${item.module.slug}`}>
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{item.module.icon || '📦'}</span>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {item.module.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {item.module.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {item.module.description}
                  </p>
                  <Button variant="ghost" className="p-0 h-auto group-hover:text-primary">
                    Open App
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No apps available</h3>
            <p className="text-sm text-muted-foreground">
              Your agency hasn&apos;t set up any apps for you yet. 
              Contact them to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
