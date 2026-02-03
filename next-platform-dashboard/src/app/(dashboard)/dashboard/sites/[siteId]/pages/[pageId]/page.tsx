import { redirect } from "next/navigation";

interface PageDetailPageProps {
  params: Promise<{ siteId: string; pageId: string }>;
}

// Redirect to Studio where page settings can be accessed
export default async function PageDetailPage({ params }: PageDetailPageProps) {
  const { siteId, pageId } = await params;
  redirect(`/studio/${siteId}/${pageId}`);
}
