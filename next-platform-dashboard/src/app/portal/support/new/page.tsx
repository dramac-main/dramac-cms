import { Metadata } from "next";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSites } from "@/lib/portal/portal-service";
import { NewTicketForm } from "@/components/portal/new-ticket-form";

export const metadata: Metadata = {
  title: "New Ticket | Support | Client Portal",
  description: "Create a new support ticket",
};

export default async function NewTicketPage() {
  const user = await requirePortalAuth();
  const sites = await getClientSites(user.clientId);

  return <NewTicketForm user={user} sites={sites} />;
}
