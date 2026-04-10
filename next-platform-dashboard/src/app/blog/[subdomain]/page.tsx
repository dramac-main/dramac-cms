import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/service";

const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";

/**
 * Old blog listing - redirects to the site-domain blog.
 * If the site has a verified custom domain, redirect there instead.
 */
export default async function PublicBlogPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

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

  redirect(`https://${host}/blog`);
}
import { redirect } from "next/navigation";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";

/**
 * Old blog listing � redirects to the site-domain blog.
 */
export default async function PublicBlogPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  redirect(`https://${subdomain}.${BASE_DOMAIN}/blog`);
}
