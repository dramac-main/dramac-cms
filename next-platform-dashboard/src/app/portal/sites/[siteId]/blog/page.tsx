import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSite } from "@/lib/portal/portal-service";
import { BlogClient } from "./blog-client";

export const metadata: Metadata = {
  title: "Blog | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function PortalBlogPage({ params }: PageProps) {
  const { siteId } = await params;
  const user = await requirePortalAuth();
  const site = await getClientSite(user.clientId, siteId);
  if (!site) notFound();
  return <BlogClient siteId={siteId} />;
}
