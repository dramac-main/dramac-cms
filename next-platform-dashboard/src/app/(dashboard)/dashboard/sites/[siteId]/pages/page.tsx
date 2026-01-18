import { redirect } from "next/navigation";

interface PagesListPageProps {
  params: Promise<{ siteId: string }>;
}

// Redirect to site detail page with pages tab active
export default async function PagesListPage({ params }: PagesListPageProps) {
  const { siteId } = await params;
  redirect(`/dashboard/sites/${siteId}?tab=pages`);
}
