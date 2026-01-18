import { redirect } from "next/navigation";
import { use } from "react";

interface SeoPageProps {
  params: Promise<{ siteId: string }>;
}

export default function SeoPage({ params }: SeoPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/seo`);
}
