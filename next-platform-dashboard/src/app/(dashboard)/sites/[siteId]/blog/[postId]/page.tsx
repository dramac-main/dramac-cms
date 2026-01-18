import { redirect } from "next/navigation";
import { use } from "react";

interface PostDetailPageProps {
  params: Promise<{ siteId: string; postId: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { siteId, postId } = use(params);
  redirect(`/dashboard/sites/${siteId}/blog/${postId}`);
}
