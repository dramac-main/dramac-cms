import { redirect } from "next/navigation";
import { use } from "react";

interface NewPostPageProps {
  params: Promise<{ siteId: string }>;
}

export default function NewPostPage({ params }: NewPostPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/blog/new`);
}
