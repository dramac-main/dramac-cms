import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSite } from "@/lib/portal/portal-service";
import { MediaClient } from "./media-client";

export const metadata: Metadata = {
  title: "Media Library | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function PortalMediaPage({ params }: PageProps) {
  const { siteId } = await params;
  const user = await requirePortalAuth();
  const site = await getClientSite(user.clientId, siteId);
  if (!site) notFound();
  return <MediaClient siteId={siteId} />;
}
