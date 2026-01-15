import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CreateSiteForm } from "@/components/sites/create-site-form";
import { getClients } from "@/lib/actions/clients";

export const metadata: Metadata = {
  title: "Create Site | DRAMAC",
  description: "Create a new website",
};

export default async function NewSitePage() {
  const clients = await getClients();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Site"
        description="Set up a new website for a client"
        backHref="/dashboard/sites"
      />

      <div className="max-w-2xl">
        <CreateSiteForm clients={clients || []} />
      </div>
    </div>
  );
}
