import { use } from "react";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/blog/post-form";
import { getPost, getUserPermissions } from "@/lib/blog/post-service";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ siteId: string; postId: string }>;
}) {
  const { siteId, postId } = use(params);

  return <EditPostContent siteId={siteId} postId={postId} />;
}

async function EditPostContent({ 
  siteId, 
  postId 
}: { 
  siteId: string; 
  postId: string;
}) {
  const [post, permissions] = await Promise.all([
    getPost(postId),
    getUserPermissions(),
  ]);

  if (!post) {
    notFound();
  }

  // Verify post belongs to this site
  if (post.siteId !== siteId) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PostForm 
        siteId={siteId} 
        post={post} 
        canPublish={permissions.canPublish} 
      />
    </div>
  );
}
