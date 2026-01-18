import { redirect } from "next/navigation";
import { use } from "react";

interface SitemapPageProps {
  params: Promise<{ siteId: string }>;
}

export default function SitemapPage({ params }: SitemapPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/seo/sitemap`);
}
