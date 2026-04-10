import { use } from "react";
import { redirect } from "next/navigation";
import { PostForm } from "@/components/blog/post-form";
import { getUserPermissions } from "@/lib/blog/post-service";
import { getPortalAgencyId } from "@/lib/portal/portal-media-service";

export default function PortalNewPostPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  return <NewPostContent siteId={siteId} />;
}

async function NewPostContent({ siteId }: { siteId: string }) {
  const [permissions, agencyId] = await Promise.all([
    getUserPermissions(),
    getPortalAgencyId(),
  ]);

  if (!permissions.canEditContent) {
    redirect(`/portal/sites/${siteId}/blog`);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PostForm
        siteId={siteId}
        canPublish={permissions.canPublish}
        basePath={`/portal/sites/${siteId}/blog`}
        agencyId={agencyId || undefined}
      />
    </div>
  );
}
