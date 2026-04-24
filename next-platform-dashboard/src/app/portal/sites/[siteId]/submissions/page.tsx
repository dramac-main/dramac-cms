import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSite } from "@/lib/portal/portal-service";
import { SubmissionsClient } from "./submissions-client";

export const metadata: Metadata = {
  title: "Form Submissions | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function PortalSubmissionsPage({ params }: PageProps) {
  const { siteId } = await params;
  const user = await requirePortalAuth();
  const site = await getClientSite(user.clientId, siteId);
  if (!site) notFound();
  return <SubmissionsClient siteId={siteId} />;
}
