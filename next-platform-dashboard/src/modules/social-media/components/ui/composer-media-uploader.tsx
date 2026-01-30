'use client'

/**
 * Composer Media Uploader Component
 * 
 * Phase UI-11B: Drag-and-drop media upload zone with
 * previews and progress indicators
 */

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Upload,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  AlertCircle,
  GripVertical,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { PostMedia } from '../../types'

// ============================================================================
// TYPES
// ============================================================================

interface ComposerMediaUploaderProps {
  media: PostMedia[]
  onUpload: (files: File[]) => Promise<void>
  onRemove: (mediaId: string) => void
  onReorder: (media: PostMedia[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  className?: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  error?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getMediaType(file: File): 'image' | 'video' | 'gif' {
  if (file.type.startsWith('image/gif')) return 'gif'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'image'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ComposerMediaUploader({
  media,
  onUpload,
  onRemove,
  onReorder,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  acceptedTypes = ['image/*', 'video/*', 'image/gif'],
  className,
}: ComposerMediaUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = media.length + uploadingFiles.length < maxFiles

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '')
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })
    if (!isValidType) {
      return `Invalid file type: ${file.type}`
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File too large: ${formatFileSize(file.size)} (max: ${maxFileSize}MB)`
    }

    return null
  }, [acceptedTypes, maxFileSize])

  const processFiles = useCallback(async (files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    // Validate each file
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }

    // Check max files limit
    const availableSlots = maxFiles - media.length - uploadingFiles.length
    const filesToUpload = validFiles.slice(0, availableSlots)

    if (validFiles.length > availableSlots) {
      errors.push(`Only ${availableSlots} more file(s) can be added`)
    }

    if (filesToUpload.length === 0) return

    // Create uploading state
    const newUploadingFiles: UploadingFile[] = filesToUpload.map(file => ({
      id: `uploading-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      progress: 0,
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Simulate upload progress (in real app, track actual progress)
    for (const uploadingFile of newUploadingFiles) {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        )
      }, 100)

      try {
        await onUpload([uploadingFile.file])
        
        clearInterval(progressInterval)
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id))
      } catch (error) {
        clearInterval(progressInterval)
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, error: 'Upload failed', progress: 0 }
              : f
          )
        )
      }
    }
  }, [media.length, maxFiles, uploadingFiles.length, validateFile, onUpload])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    await processFiles(files)
  }, [processFiles])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await processFiles(files)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [processFiles])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <motion.div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          'hover:border-primary/50 hover:bg-accent/30',
          isDragOver && 'border-primary bg-primary/10',
          !canAddMore && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={canAddMore ? handleDragOver : undefined}
        onDragLeave={handleDragLeave}
        onDrop={canAddMore ? handleDrop : undefined}
        animate={{ scale: isDragOver ? 1.02 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleFileSelect}
          disabled={!canAddMore}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center mb-3',
            isDragOver ? 'bg-primary/20' : 'bg-muted'
          )}>
            <Upload className={cn(
              'h-6 w-6',
              isDragOver ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          
          <p className="text-sm font-medium">
            {isDragOver ? 'Drop files here' : 'Drag & drop media here'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {media.length}/{maxFiles} files • Max {maxFileSize}MB per file
          </p>
        </div>
      </motion.div>

      {/* Uploading files */}
      <AnimatePresence>
        {uploadingFiles.map(file => (
          <motion.div
            key={file.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
              {file.error ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.file.name}</p>
              {file.error ? (
                <p className="text-xs text-destructive">{file.error}</p>
              ) : (
                <Progress value={file.progress} className="h-1 mt-1" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setUploadingFiles(prev => prev.filter(f => f.id !== file.id))}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Media grid (reorderable) */}
      {media.length > 0 && (
        <Reorder.Group
          axis="x"
          values={media}
          onReorder={onReorder}
          className="flex flex-wrap gap-2"
        >
          <AnimatePresence>
            {media.map((item) => (
              <Reorder.Item
                key={item.id || item.url}
                value={item}
                className="relative group"
              >
                <motion.div
                  className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted cursor-grab active:cursor-grabbing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileDrag={{ scale: 1.1, zIndex: 50 }}
                >
                  {item.type === 'image' || item.type === 'gif' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute bottom-1 left-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-5 h-5 rounded bg-black/50 flex items-center justify-center">
                          {item.type === 'video' ? (
                            <Video className="h-3 w-3 text-white" />
                          ) : item.type === 'gif' ? (
                            <span className="text-[8px] font-bold text-white">GIF</span>
                          ) : (
                            <ImageIcon className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{item.type}</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Drag handle */}
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-5 h-5 rounded bg-black/50 flex items-center justify-center">
                      <GripVertical className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(item.id || item.url)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              </Reorder.Item>
            ))}
          </AnimatePresence>

          {/* Add more button */}
          {canAddMore && (
            <motion.button
              className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center hover:border-primary hover:bg-accent/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </motion.button>
          )}
        </Reorder.Group>
      )}
    </div>
  )
}
