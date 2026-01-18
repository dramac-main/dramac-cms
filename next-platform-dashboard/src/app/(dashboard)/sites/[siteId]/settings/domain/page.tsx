import { redirect } from "next/navigation";
import { use } from "react";

interface DomainSettingsPageProps {
  params: Promise<{ siteId: string }>;
}

// Domains are now a tab within the main settings page
export default function DomainSettingsPage({ params }: DomainSettingsPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/settings`);
}
