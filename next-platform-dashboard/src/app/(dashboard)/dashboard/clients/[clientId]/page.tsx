import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { PageHeader } from "@/components/layout/page-header";
import { ClientOverview } from "@/components/clients/client-overview";
import { ClientSitesList } from "@/components/clients/client-sites-list";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";

interface ClientDetailPageProps {
  params: { clientId: string };
}

export async function generateMetadata({
  params,
}: ClientDetailPageProps): Promise<Metadata> {
  const client = await getClient(params.clientId).catch(() => null);
  return {
    title: client ? `${client.name} | DRAMAC` : "Client Not Found",
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const client = await getClient(params.clientId).catch(() => null);

  if (!client) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.company || "Client account"}
      >
        <Link href={`/dashboard/sites/new?clientId=${client.id}`}>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Site
          </Button>
        </Link>
        <EditClientDialog client={client}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
        </EditClientDialog>
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sites">
            Sites ({client.sites?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClientOverview client={client} />
        </TabsContent>

        <TabsContent value="sites">
          <ClientSitesList clientId={client.id} sites={client.sites || []} />
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Activity timeline coming in Phase 15
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
