'use client'

/**
 * Media Library Component
 * 
 * PHASE SM-05: Full media management with grid/list views,
 * folder navigation, upload, search, bulk actions, and detail panel.
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Search,
  Grid3X3,
  List,
  FolderPlus,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Music,
  Trash2,
  MoreHorizontal,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Tag,
  Eye,
  ArrowRight,
  ChevronDown,
  FileImage,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { MediaLibraryItem, MediaFolder, MediaFileType, SocialPlatform } from '../types'
import { PLATFORM_CONFIGS } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface MediaLibraryProps {
  items: MediaLibraryItem[]
  folders: MediaFolder[]
  total: number
  siteId: string
  onUpload: (files: Array<{ name: string; type: string; size: number; base64: string }>, folderId?: string) => Promise<void>
  onDelete: (mediaIds: string[]) => Promise<void>
  onCreateFolder: (name: string, parentId?: string) => Promise<void>
  onRenameFolder: (folderId: string, name: string) => Promise<void>
  onDeleteFolder: (folderId: string) => Promise<void>
  onMoveToFolder: (mediaIds: string[], folderId: string | null) => Promise<void>
  onUpdateMetadata: (mediaId: string, updates: { altText?: string; tags?: string[]; caption?: string }) => Promise<void>
  onSearch: (query: string) => void
  onFilterType: (type: MediaFileType | 'all') => void
  onSort: (sort: string) => void
  onPageChange: (page: number) => void
  currentPage: number
  isLoading?: boolean
}

type ViewMode = 'grid' | 'list'

// ============================================================================
// HELPERS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: MediaFileType) {
  switch (type) {
    case 'image': return <ImageIcon className="h-5 w-5" />
    case 'gif': return <FileImage className="h-5 w-5" />
    case 'video': return <Video className="h-5 w-5" />
    case 'audio': return <Music className="h-5 w-5" />
    default: return <ImageIcon className="h-5 w-5" />
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaLibrary({
  items,
  folders,
  total,
  siteId,
  onUpload,
  onDelete,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
  onUpdateMetadata,
  onSearch,
  onFilterType,
  onSort,
  onPageChange,
  currentPage,
  isLoading = false,
}: MediaLibraryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [detailAltText, setDetailAltText] = useState('')
  const [detailTags, setDetailTags] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Toggle item selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }, [])

  // Select all
  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(i => i.id))
    }
  }, [items, selectedItems])

  // Search handler
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }, [onSearch])

  // File upload handler
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    try {
      const fileData = await Promise.all(
        files.map(async (file) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            base64,
          }
        })
      )
      await onUpload(fileData, activeFolder || undefined)
    } finally {
      setIsUploading(false)
      setShowUploadDialog(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [onUpload, activeFolder])

  // Create folder handler
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return
    await onCreateFolder(newFolderName.trim(), activeFolder || undefined)
    setNewFolderName('')
    setShowFolderDialog(false)
  }, [newFolderName, activeFolder, onCreateFolder])

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    await onDelete(selectedItems)
    setSelectedItems([])
    setShowDeleteAlert(false)
  }, [onDelete, selectedItems])

  // Open detail panel
  const openDetail = useCallback((item: MediaLibraryItem) => {
    setSelectedItem(item)
    setDetailAltText(item.altText || '')
    setDetailTags(item.tags.join(', '))
  }, [])

  // Save metadata
  const handleSaveMetadata = useCallback(async () => {
    if (!selectedItem) return
    await onUpdateMetadata(selectedItem.id, {
      altText: detailAltText,
      tags: detailTags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setSelectedItem(null)
  }, [selectedItem, detailAltText, detailTags, onUpdateMetadata])

  // Copy URL
  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
  }, [])

  return (
    <div className="flex h-[calc(100vh-12rem)]">
      {/* Left Sidebar - Folders */}
      <div className="w-56 border-r flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-sm font-medium">Folders</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowFolderDialog(true)}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <button
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                activeFolder === null ? 'bg-secondary' : 'hover:bg-muted'
              )}
              onClick={() => setActiveFolder(null)}
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              All Media
              <Badge variant="secondary" className="ml-auto text-xs">{total}</Badge>
            </button>
            {folders.map(folder => (
              <div key={folder.id} className="group relative">
                <button
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    activeFolder === folder.id ? 'bg-secondary' : 'hover:bg-muted'
                  )}
                  onClick={() => setActiveFolder(folder.id)}
                >
                  <Folder className="h-4 w-4" style={{ color: folder.color || '#6366f1' }} />
                  <span className="truncate">{folder.name}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      const name = prompt('Rename folder:', folder.name)
                      if (name) onRenameFolder(folder.id, name)
                    }}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDeleteFolder(folder.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select onValueChange={(v) => onFilterType(v as any)} defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="gif">GIFs</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={onSort} defaultValue="created_at">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="file_name">Name</SelectItem>
              <SelectItem value="file_size">Size</SelectItem>
              <SelectItem value="usage_count">Most Used</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Bulk actions bar */}
        {selectedItems.length > 0 && (
          <div className="p-2 border-b bg-muted/50 flex items-center gap-3">
            <Checkbox
              checked={selectedItems.length === items.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Move to folder
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onMoveToFolder(selectedItems, null as any)}>
                  Root (no folder)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map(f => (
                  <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(selectedItems, f.id)}>
                    <Folder className="h-4 w-4 mr-2" style={{ color: f.color || '#6366f1' }} />
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}

        {/* Content area */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No media found</p>
              <p className="text-muted-foreground mb-4">
                Upload images, videos, or GIFs to get started
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div
                    key={item.id}
                    className={cn(
                      'group relative rounded-lg border overflow-hidden cursor-pointer transition-shadow hover:shadow-md',
                      selectedItems.includes(item.id) && 'ring-2 ring-primary'
                    )}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => openDetail(item)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-muted relative">
                      {item.fileType === 'image' || item.fileType === 'gif' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnailUrl || item.originalUrl}
                          alt={item.altText || item.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getFileIcon(item.fileType)}
                        </div>
                      )}

                      {/* Selection checkbox */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(e) => {
                            e && typeof e === 'object' && (e as any).stopPropagation?.()
                            toggleSelection(item.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Type badge */}
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          {item.fileType.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Actions on hover */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyUrl(item.originalUrl)
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{item.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(item.fileSize)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* List View */
            <div className="divide-y">
              {items.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors',
                    selectedItems.includes(item.id) && 'bg-primary/5'
                  )}
                  onClick={() => openDetail(item)}
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                    {item.fileType === 'image' || item.fileType === 'gif' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl || item.originalUrl}
                        alt={item.altText || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getFileIcon(item.fileType)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.fileName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.fileType}</span>
                      <span>{formatFileSize(item.fileSize)}</span>
                      {item.width && item.height && (
                        <span>{item.width}×{item.height}</span>
                      )}
                      <span>Used in {item.usageCount} posts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.tags.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {item.tags.length}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 30 && (
            <div className="p-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(total / 30)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= Math.ceil(total / 30)}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="w-[400px] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle>Media Details</SheetTitle>
            <SheetDescription>View and edit media metadata</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <div className="space-y-6 mt-4">
              {/* Preview */}
              <div className="rounded-lg border overflow-hidden bg-muted">
                {selectedItem.fileType === 'image' || selectedItem.fileType === 'gif' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedItem.originalUrl}
                    alt={selectedItem.altText || selectedItem.fileName}
                    className="w-full max-h-64 object-contain"
                  />
                ) : selectedItem.fileType === 'video' ? (
                  <video
                    src={selectedItem.originalUrl}
                    controls
                    className="w-full max-h-64"
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center">
                    {getFileIcon(selectedItem.fileType)}
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filename</span>
                  <span className="font-medium">{selectedItem.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{selectedItem.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span>{formatFileSize(selectedItem.fileSize)}</span>
                </div>
                {selectedItem.width && selectedItem.height && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span>{selectedItem.width}×{selectedItem.height}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Used in</span>
                  <span>{selectedItem.usageCount} posts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uploaded</span>
                  <span>{new Date(selectedItem.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Platform compatibility */}
              <div>
                <p className="text-sm font-medium mb-2">Platform Compatibility</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(PLATFORM_CONFIGS) as [SocialPlatform, any][]).map(([platform, config]) => {
                    const status = selectedItem.platformStatus?.[platform]
                    const isValid = status?.valid !== false
                    return (
                      <Badge
                        key={platform}
                        variant={isValid ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {isValid ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {config.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              {/* URL copy */}
              <div>
                <p className="text-sm font-medium mb-2">URL</p>
                <div className="flex gap-2">
                  <Input
                    value={selectedItem.originalUrl}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyUrl(selectedItem.originalUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Editable metadata */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Alt Text</label>
                  <Textarea
                    value={detailAltText}
                    onChange={(e) => setDetailAltText(e.target.value)}
                    placeholder="Describe this image for accessibility..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <Input
                    value={detailTags}
                    onChange={(e) => setDetailTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSaveMetadata} className="w-full">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Organize your media into folders
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.length} item(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected media from storage.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
