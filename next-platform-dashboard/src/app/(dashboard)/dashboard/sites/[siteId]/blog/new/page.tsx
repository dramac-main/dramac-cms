import { use } from "react";
import { PostForm } from "@/components/blog/post-form";
import { getUserPermissions, getSitePublicInfo } from "@/lib/blog/post-service";

export default function NewPostPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  return <NewPostContent siteId={siteId} />;
}

async function NewPostContent({ siteId }: { siteId: string }) {
  const [permissions, siteInfo] = await Promise.all([
    getUserPermissions(),
    getSitePublicInfo(siteId),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <PostForm
        siteId={siteId}
        canPublish={permissions.canPublish}
        subdomain={siteInfo?.subdomain}
        sitePublished={siteInfo?.isPublished}
      />
    </div>
  );
}
