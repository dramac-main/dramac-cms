import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";

interface SiteDetailPageProps {
  params: Promise<{ siteId: string }>;
}

export const metadata: Metadata = {
  title: `Redirecting... | ${PLATFORM.name}`,
};

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  const { siteId } = await params;
  redirect(`/dashboard/sites/${siteId}`);
}
