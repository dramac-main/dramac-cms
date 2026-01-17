import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Package, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    title: `Modules - ${client?.name || "Client"} | DRAMAC`,
    description: "Manage modules for this client",
  };
}

export default async function ClientModulesPage({ params }: PageProps) {
  const { clientId } = await params;
  const supabase = await createClient();

  // Get client details
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(`
      *,
      agency:agencies(id, name)
    `)
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Get agency's module subscriptions (what's available)
  const { data: agencyModules } = await supabase
    .from("module_subscriptions")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("agency_id", client.agency_id)
    .eq("status", "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Link href="/dashboard/clients" className="hover:underline">
              Clients
            </Link>
            <span>/</span>
            <Link href={`/dashboard/clients/${clientId}`} className="hover:underline">
              {client.name}
            </Link>
            <span>/</span>
            <span>Modules</span>
          </div>
          <h1 className="text-3xl font-bold">Client Modules</h1>
          <p className="text-muted-foreground">
            Manage apps and tools for {client.name}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-4">
          <p className="text-sm">
            <strong>Client modules</strong> provide additional functionality that you can enable for this client.
            Modules are managed at the agency level - visit your{" "}
            <Link href="/dashboard/modules" className="text-primary underline">agency modules</Link>
            {" "}page to subscribe to new modules.
          </p>
        </CardContent>
      </Card>

      {/* Available Modules */}
      {agencyModules && agencyModules.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agencyModules.map((sub) => (
            <Card key={sub.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.module?.icon || "📦"}</span>
                  <div>
                    <CardTitle className="text-lg">{sub.module?.name}</CardTitle>
                    <CardDescription>{sub.module?.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {sub.module?.description}
                </p>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No modules available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to modules at the agency level to make them available for clients.
            </p>
            <Button asChild>
              <Link href="/dashboard/modules">Browse Modules</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
