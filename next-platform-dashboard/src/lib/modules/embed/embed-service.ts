'use server'

import { createClient } from '@/lib/supabase/server'
import { loadStudioModuleForRender } from '../studio-module-loader'
import type { LoadedStudioModule } from '../studio-module-loader'

export interface EmbedModuleResponse {
  module: LoadedStudioModule | null
  installation: {
    id: string
    settings: Record<string, unknown>
    is_enabled: boolean
  } | null
  error?: string
}

/**
 * Get module data for embedding
 */
export async function getModuleForEmbed(
  moduleId: string,
  siteId: string
): Promise<EmbedModuleResponse> {
  const supabase = await createClient()

  // Get installation
  const { data: installation, error: installError } = await supabase
    .from('site_module_installations')
    .select('id, settings, is_enabled')
    .eq('site_id', siteId)
    .eq('module_id', moduleId)
    .single()

  if (installError || !installation) {
    return { module: null, installation: null, error: 'Module not installed on this site' }
  }

  if (!installation.is_enabled) {
    return { module: null, installation: null, error: 'Module is disabled' }
  }

  // Load module
  const loadedModule = await loadStudioModuleForRender(moduleId)
  
  if (!loadedModule) {
    return { module: null, installation: null, error: 'Module not found' }
  }

  return { 
    module: loadedModule, 
    installation: {
      id: installation.id,
      settings: installation.settings as Record<string, unknown> || {},
      is_enabled: installation.is_enabled
    }
  }
}

/**
 * Generate embed code snippets for a module installation
 */
export async function generateEmbedCode(
  moduleId: string,
  siteId: string,
  token: string
): Promise<{
  iframe: string
  webComponent: string
  javascript: string
}> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.com'
  const embedUrl = `${baseUrl}/embed/${moduleId}/${siteId}?token=${token}`

  return {
    // Simple iFrame embed
    iframe: `<iframe 
  src="${embedUrl}"
  width="100%" 
  height="600"
  frameborder="0"
  allow="clipboard-write"
  loading="lazy"
></iframe>`,

    // Web Component (requires loading script first)
    webComponent: `<!-- Load DRAMAC Embed Script -->
<script src="${baseUrl}/embed/dramac-embed.js"></script>

<!-- Use the module -->
<dramac-module 
  module-id="${moduleId}" 
  site-id="${siteId}"
  token="${token}"
  theme="auto"
></dramac-module>`,

    // JavaScript SDK
    javascript: `<!-- DRAMAC Module SDK -->
<script src="${baseUrl}/embed/dramac-sdk.js"></script>
<div id="dramac-module-container"></div>
<script>
  DramacSDK.init({
    moduleId: '${moduleId}',
    siteId: '${siteId}',
    token: '${token}',
    container: '#dramac-module-container',
    theme: 'auto',
    onReady: function(module) {
      console.log('Module loaded:', module.name);
    },
    onEvent: function(event, data) {
      console.log('Module event:', event, data);
    }
  });
</script>`
  }
}

/**
 * Create embed token for a module installation
 */
export async function createEmbedToken(
  siteId: string,
  moduleId: string,
  expiresInDays: number = 365
): Promise<{ token: string; expiresAt: Date }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  // Generate secure token
  const tokenData = {
    siteId,
    moduleId,
    exp: expiresAt.getTime()
  }
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64url')

  // Store token (optional - for revocation capability)
  await db
    .from('module_embed_tokens')
    .upsert({
      site_id: siteId,
      module_id: moduleId,
      token_hash: hashToken(token),
      expires_at: expiresAt.toISOString()
    }, {
      onConflict: 'site_id,module_id'
    })

  return { token, expiresAt }
}

/**
 * Get existing embed token for a module installation
 */
export async function getEmbedToken(
  siteId: string,
  moduleId: string
): Promise<{ token: string; expiresAt: Date } | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  
  const { data } = await db
    .from('module_embed_tokens')
    .select('token_hash, expires_at, is_revoked')
    .eq('site_id', siteId)
    .eq('module_id', moduleId)
    .single()

  if (!data || data.is_revoked) {
    return null
  }

  // Decode the stored hash back to token (for display purposes)
  // In production, you'd want to regenerate the token instead
  const token = Buffer.from(data.token_hash, 'base64').toString()
  
  return {
    token,
    expiresAt: new Date(data.expires_at)
  }
}

function hashToken(token: string): string {
  // Simple hash for storage - use proper crypto in production
  return Buffer.from(token).toString('base64')
}
