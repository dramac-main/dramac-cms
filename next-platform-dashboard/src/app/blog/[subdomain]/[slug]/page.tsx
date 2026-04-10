import { redirect } from "next/navigation";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";

/**
 * Old blog post page — redirects to the site-domain blog post.
 */
export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  redirect(`https://${subdomain}.${BASE_DOMAIN}/blog/${slug}`);
}
