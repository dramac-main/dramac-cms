import { redirect } from "next/navigation";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";

/**
 * Old blog listing — redirects to the site-domain blog.
 */
export default async function PublicBlogPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  redirect(`https://${subdomain}.${BASE_DOMAIN}/blog`);
}
