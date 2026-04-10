import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/service";

const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";

/**
 * Old blog post page - redirects to the site-domain blog post.
 * If the site has a verified custom domain, redirect there instead.
 */
export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;

  const supabase = createAdminClient();
  const { data: site } = await supabase
    .from("sites")
    .select("custom_domain, custom_domain_verified")
    .eq("subdomain", subdomain)
    .single();

  const host =
    site?.custom_domain && site?.custom_domain_verified
      ? site.custom_domain
      : `${subdomain}.${BASE_DOMAIN}`;

  redirect(`https://${host}/blog/${slug}`);
}
import { redirect } from "next/navigation";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";

/**
 * Old blog post page � redirects to the site-domain blog post.
 */
export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  redirect(`https://${subdomain}.${BASE_DOMAIN}/blog/${slug}`);
}
