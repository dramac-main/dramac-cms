import { use } from "react";
import { redirect } from "next/navigation";
import { PostForm } from "@/components/blog/post-form";
import { getUserPermissions } from "@/lib/blog/post-service";

export default function PortalNewPostPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  return <NewPostContent siteId={siteId} />;
}

async function NewPostContent({ siteId }: { siteId: string }) {
  const permissions = await getUserPermissions();

  if (!permissions.canEditContent) {
    redirect(`/portal/sites/${siteId}/blog`);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PostForm
        siteId={siteId}
        canPublish={permissions.canPublish}
        basePath={`/portal/sites/${siteId}/blog`}
      />
    </div>
  );
}
