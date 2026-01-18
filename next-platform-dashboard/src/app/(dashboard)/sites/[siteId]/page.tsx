import { redirect } from "next/navigation";
import type { Metadata } from "next";

interface SiteDetailPageProps {
  params: Promise<{ siteId: string }>;
}

export const metadata: Metadata = {
  title: "Redirecting... | DRAMAC",
};

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  const { siteId } = await params;
  redirect(`/dashboard/sites/${siteId}`);
}
