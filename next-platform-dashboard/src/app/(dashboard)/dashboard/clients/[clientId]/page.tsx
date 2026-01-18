import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { PageHeader } from "@/components/layout/page-header";
import { ClientDetailTabs } from "@/components/clients/client-detail-tabs";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { ImpersonateClientButton } from "@/components/clients/impersonate-client-button";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import type { ClientStatus } from "@/types/client";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export async function generateMetadata({
  params,
}: ClientDetailPageProps): Promise<Metadata> {
  const { clientId } = await params;
  const client = await getClient(clientId).catch(() => null);
  return {
    title: client ? `${client.name} | DRAMAC` : "Client Not Found",
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  const client = await getClient(clientId).catch(() => null);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={client.company || client.email || "No contact info"}
        backHref="/dashboard/clients"
      >
        <div className="flex items-center gap-2">
          <ClientStatusBadge status={client.status as ClientStatus} />
          {client.has_portal_access && (
            <ImpersonateClientButton clientId={client.id} clientName={client.name} />
          )}
          <EditClientDialog client={client}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </EditClientDialog>
        </div>
      </PageHeader>

      <ClientDetailTabs client={client} />
    </div>
  );
}
