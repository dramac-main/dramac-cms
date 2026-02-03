import { redirect } from "next/navigation";
import { use } from "react";

interface EditorPageProps {
  params: Promise<{ siteId: string }>;
}

// Redirect to site pages list since we need a pageId for Studio
export default function EditorRedirectPage({ params }: EditorPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/pages`);
}
