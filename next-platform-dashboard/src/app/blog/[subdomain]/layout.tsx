import { redirect } from "next/navigation";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";

/**
 * Old blog layout — redirects to the site-domain blog.
 * Blog is now served via the site renderer at [subdomain].sites.dramacagency.com/blog
 */
export default async function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  redirect(`https://${subdomain}.${BASE_DOMAIN}/blog`);
}
