/**
 * DRAMAC Studio Editor Page
 * 
 * Full-screen website editor at /studio/[siteId]/[pageId]
 * This is the main entry point for the visual page builder.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudioProvider } from "@/components/studio/core";
import { StudioEditor } from "@/components/studio/studio-editor";

interface StudioPageProps {
  params: Promise<{
    siteId: string;
    pageId: string;
  }>;
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { siteId, pageId } = await params;
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Verify site access
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, agency_id")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    redirect("/dashboard/sites");
  }

  // Verify page exists and get content (content is in page_content table)
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select(`
      id,
      name,
      slug,
      page_content(content)
    `)
    .eq("id", pageId)
    .eq("site_id", siteId)
    .single();

  if (pageError || !page) {
    redirect(`/dashboard/sites/${siteId}/pages`);
  }

  // Extract content from page_content relation
  let content: Record<string, unknown> | null = null;
  if (page.page_content) {
    if (Array.isArray(page.page_content) && page.page_content.length > 0) {
      content = (page.page_content[0] as { content: Record<string, unknown> }).content;
    } else if (typeof page.page_content === 'object' && 'content' in page.page_content) {
      content = (page.page_content as { content: Record<string, unknown> }).content;
    }
  }

  return (
    <StudioProvider
      siteId={siteId}
      pageId={pageId}
      siteName={site.name}
      pageName={page.name}
      initialData={content}
    >
      <StudioEditor
        siteName={site.name}
        pageName={page.name}
        siteId={siteId}
        pageId={pageId}
        pageSlug={page.slug}
      />
    </StudioProvider>
  );
}
