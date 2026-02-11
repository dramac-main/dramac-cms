/**
 * Social Media - Media Library Page
 * 
 * PHASE SM-05: Server component that fetches media data
 * and renders the MediaLibraryWrapper client component.
 */

import { redirect } from 'next/navigation'
import { getMediaLibrary, getMediaFolders } from '@/modules/social-media/actions/media-actions'
import { MediaLibraryWrapper } from '@/modules/social-media/components/MediaLibraryWrapper'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function MediaLibraryPage({ params }: PageProps) {
  const { siteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant_id from sites table (agency_id)
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()

  const tenantId = site?.agency_id || ''

  // Fetch initial data
  const [mediaResult, foldersResult] = await Promise.all([
    getMediaLibrary(siteId, { page: 1, limit: 30, sort: 'created_at', order: 'desc' }),
    getMediaFolders(siteId),
  ])

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="text-muted-foreground">
          Manage your social media images, videos, and files
        </p>
      </div>

      <MediaLibraryWrapper
        initialItems={mediaResult.items}
        initialFolders={foldersResult.folders}
        initialTotal={mediaResult.total}
        siteId={siteId}
        tenantId={tenantId}
      />
    </div>
  )
}
