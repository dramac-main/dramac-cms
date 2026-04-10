import { use } from "react";
import { notFound, redirect } from "next/navigation";
import { PostForm } from "@/components/blog/post-form";
import { getPost, getUserPermissions, getSitePublicInfo } from "@/lib/blog/post-service";
import { getPortalAgencyId } from "@/lib/portal/portal-media-service";

export default function PortalEditPostPage({
  params,
}: {
  params: Promise<{ siteId: string; postId: string }>;
}) {
  const { siteId, postId } = use(params);

  return <EditPostContent siteId={siteId} postId={postId} />;
}

async function EditPostContent({
  siteId,
  postId,
}: {
  siteId: string;
  postId: string;
}) {
  const [post, permissions, agencyId, siteInfo] = await Promise.all([
    getPost(postId),
    getUserPermissions(),
    getPortalAgencyId(),
    getSitePublicInfo(siteId),
  ]);

  if (!permissions.canEditContent) {
    redirect(`/portal/sites/${siteId}/blog`);
  }

  if (!post) {
    notFound();
  }

  if (post.siteId !== siteId) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PostForm
        siteId={siteId}
        post={post}
        canPublish={permissions.canPublish}
        basePath={`/portal/sites/${siteId}/blog`}
        agencyId={agencyId || undefined}
        subdomain={siteInfo?.subdomain}
        sitePublished={siteInfo?.isPublished}
      />
    </div>
  );
}
