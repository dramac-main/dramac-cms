'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Generate and store screenshot for a site
 * Uses a third-party screenshot API and stores the URL
 */
export async function captureAndStoreSiteScreenshot(
  siteId: string,
  siteUrl: string
): Promise<{ success: boolean; screenshotUrl?: string; error?: string }> {
  try {
    // Use a reliable screenshot service (ScreenshotOne, ApiFlash, etc.)
    // For now, we'll use a simple API that returns instant results
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/noanimate/${encodeURIComponent(siteUrl)}`
    
    // Store in database
    const supabase = await createClient()
    const { error } = await supabase
      .from('sites')
      .update({ 
        screenshot_url: screenshotUrl,
        screenshot_updated_at: new Date().toISOString()
      } as any)
      .eq('id', siteId)

    if (error) {
      console.error('[Screenshot] Failed to store:', error)
      return { success: false, error: error.message }
    }

    return { success: true, screenshotUrl }
  } catch (error) {
    console.error('[Screenshot] Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Refresh screenshot for a site
 */
export async function refreshSiteScreenshot(siteId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  
  // Get site URL
  const { data: site } = await supabase
    .from('sites')
    .select('subdomain, custom_domain')
    .eq('id', siteId)
    .single()

  if (!site) {
    return { success: false, error: 'Site not found' }
  }

  const domain = site.custom_domain || `${site.subdomain}.sites.dramacagency.com`
  const url = `https://${domain}`

  return await captureAndStoreSiteScreenshot(siteId, url)
}
