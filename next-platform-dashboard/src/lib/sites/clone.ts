import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils/site-url";

export interface CloneOptions {
  newName: string;
  newSubdomain: string;
  clonePages: boolean;
  cloneSettings: boolean;
  cloneModules: boolean;
  clientId: string;
  agencyId: string;
}

export interface CloneResult {
  success: boolean;
  newSiteId?: string;
  newSiteUrl?: string;
  error?: string;
  details?: {
    pagesCloned: number;
    modulesCloned: number;
  };
}

/**
 * Clone an entire site with all its data
 */
export async function cloneSite(
  sourceSiteId: string,
  options: CloneOptions
): Promise<CloneResult> {
  const supabase = await createClient();

  try {
    // 1. Get source site
    const { data: sourceSite, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', sourceSiteId)
      .single();

    if (siteError || !sourceSite) {
      return { success: false, error: 'Source site not found' };
    }

    // 2. Check if subdomain is available
    const { data: existingSubdomain } = await supabase
      .from('sites')
      .select('id')
      .eq('subdomain', options.newSubdomain)
      .single();

    if (existingSubdomain) {
      return { success: false, error: 'Subdomain already exists' };
    }

    // 3. Create new site
    const { data: newSite, error: createError } = await supabase
      .from('sites')
      .insert({
        client_id: options.clientId,
        agency_id: options.agencyId,
        name: options.newName,
        subdomain: options.newSubdomain,
        custom_domain: null, // Don't clone custom domain
        published: false,
        settings: options.cloneSettings ? sourceSite.settings : {},
        seo_title: sourceSite.seo_title,
        seo_description: sourceSite.seo_description,
        seo_image: sourceSite.seo_image,
      })
      .select()
      .single();

    if (createError || !newSite) {
      return { success: false, error: `Failed to create site: ${createError?.message}` };
    }

    let pagesCloned = 0;
    let modulesCloned = 0;

    // 4. Clone pages if requested
    if (options.clonePages) {
      const { data: sourcePages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('site_id', sourceSiteId);

      if (!pagesError && sourcePages) {
        for (const page of sourcePages) {
          // Create the page
          const { data: newPage, error: pageCreateError } = await supabase
            .from('pages')
            .insert({
              site_id: newSite.id,
              slug: page.slug,
              name: page.name,
              seo_title: page.seo_title,
              seo_description: page.seo_description,
              seo_image: page.seo_image,
              is_homepage: page.is_homepage,
              sort_order: page.sort_order,
            })
            .select()
            .single();

          if (!pageCreateError && newPage) {
            pagesCloned++;
            
            // Clone page content
            const { data: sourceContent } = await supabase
              .from('page_content')
              .select('content')
              .eq('page_id', page.id)
              .single();
              
            if (sourceContent) {
              await supabase
                .from('page_content')
                .insert({
                  page_id: newPage.id,
                  content: sourceContent.content,
                });
            }
          }
        }
      }
    }

    // 5. Clone modules if requested
    if (options.cloneModules) {
      const { data: sourceModules, error: modulesError } = await supabase
        .from('site_modules')
        .select('*')
        .eq('site_id', sourceSiteId);

      if (!modulesError && sourceModules) {
        for (const mod of sourceModules) {
          const { error: modCreateError } = await supabase
            .from('site_modules')
            .insert({
              site_id: newSite.id,
              module_id: mod.module_id,
              settings: mod.settings,
              is_enabled: mod.is_enabled,
            });

          if (!modCreateError) {
            modulesCloned++;
          }
        }
      }
    }

    return {
      success: true,
      newSiteId: newSite.id,
      newSiteUrl: getSiteUrl(options.newSubdomain),
      details: {
        pagesCloned,
        modulesCloned,
      },
    };
  } catch (error) {
    console.error('Site clone error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Clone failed',
    };
  }
}

/**
 * Clone a single page to another site
 */
export async function clonePage(
  sourcePageId: string,
  targetSiteId: string,
  newSlug?: string
): Promise<{ success: boolean; newPageId?: string; error?: string }> {
  const supabase = await createClient();

  try {
    // Get source page
    const { data: sourcePage, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', sourcePageId)
      .single();

    if (pageError || !sourcePage) {
      return { success: false, error: 'Source page not found' };
    }

    // Create cloned page
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        site_id: targetSiteId,
        slug: newSlug || `${sourcePage.slug}-copy`,
        name: `${sourcePage.name} (Copy)`,
        seo_title: sourcePage.seo_title,
        seo_description: sourcePage.seo_description,
        seo_image: sourcePage.seo_image,
        is_homepage: false,
        sort_order: sourcePage.sort_order,
      })
      .select()
      .single();

    if (createError || !newPage) {
      return { success: false, error: `Failed to clone page: ${createError?.message}` };
    }

    // Clone page content
    const { data: sourceContent } = await supabase
      .from('page_content')
      .select('content')
      .eq('page_id', sourcePageId)
      .single();
      
    if (sourceContent) {
      await supabase
        .from('page_content')
        .insert({
          page_id: newPage.id,
          content: sourceContent.content,
        });
    }

    return { success: true, newPageId: newPage.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Page clone failed',
    };
  }
}

/**
 * Clone site from template
 */
export async function cloneFromTemplate(
  templateId: string,
  options: Omit<CloneOptions, 'clonePages' | 'cloneSettings' | 'cloneModules'>
): Promise<CloneResult> {
  // Templates always clone everything
  return cloneSite(templateId, {
    ...options,
    clonePages: true,
    cloneSettings: true,
    cloneModules: true,
  });
}

/**
 * Get clone-friendly subdomain from name
 */
export function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 63); // Max subdomain length
}

/**
 * Check if subdomain is available
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('sites')
    .select('id')
    .eq('subdomain', subdomain)
    .single();
    
  return !data;
}

/**
 * Clone page within the same site
 */
export async function duplicatePage(
  pageId: string
): Promise<{ success: boolean; newPageId?: string; error?: string }> {
  const supabase = await createClient();

  try {
    // Get source page
    const { data: sourcePage, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (pageError || !sourcePage) {
      return { success: false, error: 'Source page not found' };
    }

    // Generate unique slug
    let newSlug = `${sourcePage.slug}-copy`;
    let counter = 1;
    
    // Check for existing slugs
    while (true) {
      const { data: existing } = await supabase
        .from('pages')
        .select('id')
        .eq('site_id', sourcePage.site_id)
        .eq('slug', newSlug)
        .single();
        
      if (!existing) break;
      
      counter++;
      newSlug = `${sourcePage.slug}-copy-${counter}`;
    }

    // Create cloned page
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        site_id: sourcePage.site_id,
        slug: newSlug,
        name: `${sourcePage.name} (Copy)`,
        seo_title: sourcePage.seo_title,
        seo_description: sourcePage.seo_description,
        seo_image: sourcePage.seo_image,
        is_homepage: false,
        sort_order: (sourcePage.sort_order || 0) + 1,
      })
      .select()
      .single();

    if (createError || !newPage) {
      return { success: false, error: `Failed to duplicate page: ${createError?.message}` };
    }

    // Clone page content
    const { data: sourceContent } = await supabase
      .from('page_content')
      .select('content')
      .eq('page_id', pageId)
      .single();
      
    if (sourceContent) {
      await supabase
        .from('page_content')
        .insert({
          page_id: newPage.id,
          content: sourceContent.content,
        });
    }

    return { success: true, newPageId: newPage.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Page duplication failed',
    };
  }
}
