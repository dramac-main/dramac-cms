import { use } from "react";
import { PostForm } from "@/components/blog/post-form";
import { getUserPermissions, getSitePublicInfo, getUserAgencyIdForBlog } from "@/lib/blog/post-service";

export default function NewPostPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  return <NewPostContent siteId={siteId} />;
}

async function NewPostContent({ siteId }: { siteId: string }) {
  const [permissions, siteInfo, agencyId] = await Promise.all([
    getUserPermissions(),
    getSitePublicInfo(siteId),
    getUserAgencyIdForBlog(),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <PostForm
        siteId={siteId}
        canPublish={permissions.canPublish}
        subdomain={siteInfo?.subdomain}
        sitePublished={siteInfo?.isPublished}
        agencyId={agencyId || undefined}
      />
    </div>
  );
}
