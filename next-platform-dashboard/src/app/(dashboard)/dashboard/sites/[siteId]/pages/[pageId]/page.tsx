import { redirect } from "next/navigation";

interface PageDetailPageProps {
  params: Promise<{ siteId: string; pageId: string }>;
}

// Redirect to the page editor where page settings can be accessed
export default async function PageDetailPage({ params }: PageDetailPageProps) {
  const { siteId, pageId } = await params;
  redirect(`/dashboard/sites/${siteId}/editor/${pageId}`);
}
