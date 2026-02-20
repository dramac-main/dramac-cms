/**
 * Image Upload Component
 * 
 * Reusable image upload with drag & drop and Supabase Storage integration
 */
'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, Link as LinkIcon, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  onRemove?: () => void
  siteId: string
  folder?: string
  label?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait'
  maxSizeMB?: number
  acceptedTypes?: string[]
}

const ASPECT_RATIOS = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[2/1]',
  portrait: 'aspect-[3/4]'
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  siteId,
  folder = 'products',
  label = 'Image',
  className,
  aspectRatio = 'video',
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Memoize Supabase client to prevent re-creation on every render
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const uploadFile = useCallback(async (file: File) => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Accepted: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size: ${maxSizeMB}MB`)
      return
    }

    setIsUploading(true)

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop()
      const filename = `${siteId}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('ecommerce')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        // If bucket doesn't exist, try to create it
        if (error.message.includes('not found') || error.message.includes('Bucket')) {
          // Try creating the bucket (this may fail if RLS is strict)
          const { error: bucketError } = await supabase.storage.createBucket('ecommerce', {
            public: true,
            fileSizeLimit: maxSizeMB * 1024 * 1024
          })
          
          if (!bucketError) {
            // Retry upload
            const { data: retryData, error: retryError } = await supabase.storage
              .from('ecommerce')
              .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
              })
            
            if (retryError) throw retryError
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('ecommerce')
              .getPublicUrl(retryData.path)
            
            onChange(urlData.publicUrl)
            toast.success('Image uploaded successfully')
            return
          }
        }
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ecommerce')
        .getPublicUrl(data.path)

      onChange(urlData.publicUrl)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image. You can use a URL instead.')
      setShowUrlInput(true)
    } finally {
      setIsUploading(false)
    }
  }, [siteId, folder, maxSizeMB, acceptedTypes, onChange, supabase.storage])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }, [uploadFile])

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      // Basic URL validation
      try {
        new URL(urlInput.trim())
        onChange(urlInput.trim())
        setUrlInput('')
        setShowUrlInput(false)
        toast.success('Image URL added')
      } catch {
        toast.error('Please enter a valid URL')
      }
    }
  }

  const handleRemove = () => {
    onChange('')
    onRemove?.()
  }

  if (value) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && <Label>{label}</Label>}
        <div className={cn('relative w-full border rounded-lg overflow-hidden bg-muted', ASPECT_RATIOS[aspectRatio])}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded image"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder on error
              e.currentTarget.src = `https://placehold.co/400x300/f0f0f0/999999?text=Image+Error`
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg bg-muted/50 transition-colors cursor-pointer',
          ASPECT_RATIOS[aspectRatio],
          isDragOver && 'border-primary bg-primary/5',
          isUploading && 'pointer-events-none opacity-70'
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="p-3 rounded-full bg-muted">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Click to upload</p>
              <p className="text-xs text-muted-foreground">or drag and drop</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {/* URL Input Toggle */}
      {!isUploading && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation()
              setShowUrlInput(!showUrlInput)
            }}
          >
            <LinkIcon className="h-3 w-3 mr-1" />
            {showUrlInput ? 'Hide URL input' : 'Use URL instead'}
          </Button>
        </div>
      )}

      {/* URL Input Field */}
      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleUrlSubmit}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  )
}

// Multi-image gallery upload
interface ImageGalleryUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  siteId: string
  folder?: string
  label?: string
  maxImages?: number
  className?: string
}

export function ImageGalleryUpload({
  value = [],
  onChange,
  siteId,
  folder = 'products',
  label = 'Images',
  maxImages = 10,
  className
}: ImageGalleryUploadProps) {
  const addImage = (url: string) => {
    if (value.length < maxImages) {
      onChange([...value, url])
    }
  }

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const moveImage = (from: number, to: number) => {
    const newImages = [...value]
    const [removed] = newImages.splice(from, 1)
    newImages.splice(to, 0, removed)
    onChange(newImages)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <span className="text-xs text-muted-foreground">{value.length}/{maxImages} images</span>
        </div>
      )}
      
      {/* Existing Images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square border rounded-lg overflow-hidden bg-muted group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/200x200/f0f0f0/999999?text=${index + 1}`
                }}
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                  Main
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveImage(index, 0)}
                    title="Set as main image"
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add More */}
      {value.length < maxImages && (
        <ImageUpload
          value=""
          onChange={addImage}
          siteId={siteId}
          folder={folder}
          label=""
          aspectRatio="square"
        />
      )}
    </div>
  )
}
