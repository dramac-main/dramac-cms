import { redirect } from "next/navigation";
import { use } from "react";

interface BlogPageProps {
  params: Promise<{ siteId: string }>;
}

export default function BlogPage({ params }: BlogPageProps) {
  const { siteId } = use(params);
  redirect(`/dashboard/sites/${siteId}/blog`);
}
