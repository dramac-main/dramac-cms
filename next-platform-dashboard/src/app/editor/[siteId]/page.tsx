import { redirect } from "next/navigation";
import { use } from "react";

interface EditorPageProps {
  params: Promise<{ siteId: string }>;
}

export default function EditorRedirectPage({ params }: EditorPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/editor`);
}
