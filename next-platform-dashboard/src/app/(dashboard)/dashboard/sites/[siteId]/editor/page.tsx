import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ page?: string; pageId?: string }>;
}

/**
 * Legacy Editor Redirect
 * 
 * Redirects old Puck editor URLs to the new DRAMAC Studio.
 * Handles both ?page=X and ?pageId=X query params.
 * 
 * Old format: /dashboard/sites/[siteId]/editor?page=[pageId]
 * New format: /studio/[siteId]/[pageId]
 * 
 * @phase STUDIO-27 - Platform Integration & Puck Removal
 */
export default async function LegacyEditorRedirect({ 
  params, 
  searchParams,
}: PageProps) {
  const { siteId } = await params;
  const { page, pageId } = await searchParams;
  
  // Get the page ID from either query param
  const targetPageId = page || pageId;
  
  if (targetPageId) {
    // Redirect to Studio with the page
    redirect(`/studio/${siteId}/${targetPageId}`);
  }
  
  // No page specified - try to find the homepage
  try {
    const supabase = await createClient();
    
    const { data: homepage } = await supabase
      .from("pages")
      .select("id")
      .eq("site_id", siteId)
      .eq("is_homepage", true)
      .single();
    
    if (homepage?.id) {
      redirect(`/studio/${siteId}/${homepage.id}`);
    }
  } catch {
    // Ignore errors and fallback to pages list
  }
  
  // Fallback: redirect to site pages list
  redirect(`/dashboard/sites/${siteId}/pages`);
}
