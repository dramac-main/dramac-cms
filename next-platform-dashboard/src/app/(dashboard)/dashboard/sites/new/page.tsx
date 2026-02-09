import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CreateSiteForm } from "@/components/sites/create-site-form";
import { getClients } from "@/lib/actions/clients";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Create Site | ${PLATFORM.name}`,
  description: "Create a new website",
};

interface CreateSitePageProps {
  searchParams: Promise<{
    clientId?: string;
  }>;
}

export default async function CreateSitePage({ searchParams }: CreateSitePageProps) {
  const params = await searchParams;
  const clients = await getClients({ status: "active" });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create New Site"
        description="Set up a new website for your client."
      />

      <CreateSiteForm clients={clients || []} defaultClientId={params.clientId} />
    </div>
  );
}
