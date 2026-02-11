'use client'

/**
 * Media Library Wrapper
 * 
 * PHASE SM-05: Client wrapper that bridges server actions
 * to the MediaLibrary component.
 */

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MediaLibrary } from './MediaLibrary'
import { uploadSocialMedia, getMediaLibrary } from '../lib/media-upload-service'
import {
  createMediaFolder,
  renameMediaFolder,
  deleteMediaFolder,
  moveMediaToFolder,
  updateMediaMetadata,
  bulkDeleteMedia,
} from '../actions/media-actions'
import type { MediaLibraryItem, MediaFolder, MediaFileType } from '../types'

interface MediaLibraryWrapperProps {
  initialItems: MediaLibraryItem[]
  initialFolders: MediaFolder[]
  initialTotal: number
  siteId: string
  tenantId: string
}

export function MediaLibraryWrapper({
  initialItems,
  initialFolders,
  initialTotal,
  siteId,
  tenantId,
}: MediaLibraryWrapperProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState(initialItems)
  const [folders, setFolders] = useState(initialFolders)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentFilter, setCurrentFilter] = useState<MediaFileType | 'all'>('all')
  const [currentSort, setCurrentSort] = useState('created_at')
  const [currentSearch, setCurrentSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Reload media from server
  const reloadMedia = useCallback(async (options?: {
    page?: number
    fileType?: MediaFileType | 'all'
    sort?: string
    search?: string
  }) => {
    setIsLoading(true)
    try {
      const page = options?.page || currentPage
      const fileType = options?.fileType || currentFilter
      const sort = options?.sort || currentSort
      const search = options?.search ?? currentSearch

      const result = await getMediaLibrary(siteId, {
        page,
        fileType: fileType === 'all' ? undefined : fileType,
        sort: sort as any,
        search: search || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        setItems(result.items)
        setTotal(result.total)
      }
    } finally {
      setIsLoading(false)
    }
  }, [siteId, currentPage, currentFilter, currentSort, currentSearch])

  // Upload
  const handleUpload = useCallback(async (
    files: Array<{ name: string; type: string; size: number; base64: string }>,
    folderId?: string
  ) => {
    let uploaded = 0
    let failed = 0

    for (const file of files) {
      const result = await uploadSocialMedia({
        siteId,
        tenantId,
        file,
        folderId,
      })

      if (result.error) {
        toast.error(`Failed to upload ${file.name}: ${result.error}`)
        failed++
      } else {
        uploaded++
      }
    }

    if (uploaded > 0) {
      toast.success(`Uploaded ${uploaded} file(s)`)
      await reloadMedia()
    }
  }, [siteId, tenantId, reloadMedia])

  // Delete
  const handleDelete = useCallback(async (mediaIds: string[]) => {
    const result = await bulkDeleteMedia(mediaIds, siteId)
    if (result.errors.length > 0) {
      toast.error(`${result.errors.length} deletion(s) failed`)
    }
    if (result.deleted > 0) {
      toast.success(`Deleted ${result.deleted} file(s)`)
      await reloadMedia()
    }
  }, [siteId, reloadMedia])

  // Create folder
  const handleCreateFolder = useCallback(async (name: string, parentId?: string) => {
    const result = await createMediaFolder(siteId, name, parentId)
    if (result.error) {
      toast.error(result.error)
    } else if (result.folder) {
      toast.success(`Folder "${name}" created`)
      setFolders(prev => [...prev, result.folder!])
    }
  }, [siteId])

  // Rename folder
  const handleRenameFolder = useCallback(async (folderId: string, name: string) => {
    const result = await renameMediaFolder(folderId, name)
    if (result.error) {
      toast.error(result.error)
    } else {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f))
    }
  }, [])

  // Delete folder
  const handleDeleteFolder = useCallback(async (folderId: string) => {
    const result = await deleteMediaFolder(folderId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Folder deleted')
      setFolders(prev => prev.filter(f => f.id !== folderId))
      await reloadMedia()
    }
  }, [reloadMedia])

  // Move to folder
  const handleMoveToFolder = useCallback(async (mediaIds: string[], folderId: string | null) => {
    const result = await moveMediaToFolder(mediaIds, folderId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Moved ${mediaIds.length} item(s)`)
      await reloadMedia()
    }
  }, [reloadMedia])

  // Update metadata
  const handleUpdateMetadata = useCallback(async (
    mediaId: string,
    updates: { altText?: string; tags?: string[]; caption?: string }
  ) => {
    const result = await updateMediaMetadata(mediaId, updates)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Metadata updated')
      setItems(prev => prev.map(i => i.id === mediaId ? {
        ...i,
        altText: updates.altText !== undefined ? updates.altText : i.altText,
        tags: updates.tags !== undefined ? updates.tags : i.tags,
        caption: updates.caption !== undefined ? updates.caption ?? i.caption : i.caption,
      } : i))
    }
  }, [])

  // Search
  const handleSearch = useCallback((query: string) => {
    setCurrentSearch(query)
    startTransition(() => {
      reloadMedia({ search: query, page: 1 })
    })
  }, [reloadMedia])

  // Filter type
  const handleFilterType = useCallback((type: MediaFileType | 'all') => {
    setCurrentFilter(type)
    startTransition(() => {
      reloadMedia({ fileType: type, page: 1 })
    })
  }, [reloadMedia])

  // Sort
  const handleSort = useCallback((sort: string) => {
    setCurrentSort(sort)
    startTransition(() => {
      reloadMedia({ sort, page: 1 })
    })
  }, [reloadMedia])

  // Page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    startTransition(() => {
      reloadMedia({ page })
    })
  }, [reloadMedia])

  return (
    <MediaLibrary
      items={items}
      folders={folders}
      total={total}
      siteId={siteId}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onCreateFolder={handleCreateFolder}
      onRenameFolder={handleRenameFolder}
      onDeleteFolder={handleDeleteFolder}
      onMoveToFolder={handleMoveToFolder}
      onUpdateMetadata={handleUpdateMetadata}
      onSearch={handleSearch}
      onFilterType={handleFilterType}
      onSort={handleSort}
      onPageChange={handlePageChange}
      currentPage={currentPage}
      isLoading={isLoading || isPending}
    />
  )
}
