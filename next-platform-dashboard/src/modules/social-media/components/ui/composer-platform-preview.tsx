'use client'

/**
 * Composer Platform Preview Component
 * 
 * Phase UI-11B: Live preview showing how post will appear
 * on each platform
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  ThumbsUp,
  Send,
  Repeat2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import type { SocialAccount, SocialPlatform, PostMedia } from '../../types'
import { PLATFORM_CONFIGS } from '../../types'

// ============================================================================
// TYPES
// ============================================================================

interface ComposerPlatformPreviewProps {
  platform: SocialPlatform
  content: string
  media: PostMedia[]
  account: SocialAccount
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getCharacterLimit(platform: SocialPlatform): number {
  switch (platform) {
    case 'twitter': return 280
    case 'linkedin': return 3000
    case 'facebook': return 63206
    case 'instagram': return 2200
    case 'tiktok': return 2200
    case 'pinterest': return 500
    case 'youtube': return 5000
    default: return 2000
  }
}

// ============================================================================
// PLATFORM PREVIEWS
// ============================================================================

function TwitterPreview({ 
  content, 
  media, 
  account 
}: { 
  content: string
  media: PostMedia[]
  account: SocialAccount 
}) {
  const charLimit = 280
  const remaining = charLimit - content.length
  const isOverLimit = remaining < 0

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={account.accountAvatar || undefined} />
          <AvatarFallback>{account.accountHandle?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm truncate">{account.accountName}</span>
            <span className="text-muted-foreground text-sm">@{account.accountHandle}</span>
          </div>
          <p className={cn(
            'text-sm mt-1 whitespace-pre-wrap break-words',
            isOverLimit && 'text-destructive'
          )}>
            {content || <span className="text-muted-foreground italic">Your post will appear here...</span>}
          </p>
          
          {/* Media grid */}
          {media.length > 0 && (
            <div className={cn(
              'mt-3 rounded-xl overflow-hidden border',
              media.length === 1 && 'aspect-video',
              media.length === 2 && 'grid grid-cols-2 gap-0.5',
              media.length >= 3 && 'grid grid-cols-2 gap-0.5'
            )}>
              {media.slice(0, 4).map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    'bg-muted overflow-hidden',
                    media.length === 1 && 'aspect-video',
                    media.length >= 2 && 'aspect-square',
                    media.length === 3 && i === 0 && 'row-span-2'
                  )}
                >
                  {m.type === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  )}
                  {m.type === 'video' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Video</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <Repeat2 className="h-4 w-4" />
            <Heart className="h-4 w-4" />
            <Bookmark className="h-4 w-4" />
            <Share2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Character count */}
      <div className={cn(
        'text-right text-xs',
        remaining < 20 && remaining >= 0 && 'text-yellow-500',
        isOverLimit && 'text-destructive font-medium'
      )}>
        {remaining} characters remaining
      </div>
    </div>
  )
}

function LinkedInPreview({ 
  content, 
  media, 
  account 
}: { 
  content: string
  media: PostMedia[]
  account: SocialAccount 
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={account.accountAvatar || undefined} />
          <AvatarFallback>{account.accountName?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{account.accountName}</p>
          <p className="text-xs text-muted-foreground">Just now • 🌐</p>
        </div>
        <MoreHorizontal className="h-5 w-5 ml-auto text-muted-foreground" />
      </div>

      <p className="text-sm whitespace-pre-wrap">
        {content || <span className="text-muted-foreground italic">Your post will appear here...</span>}
      </p>

      {/* Media */}
      {media.length > 0 && (
        <div className="rounded-lg overflow-hidden border">
          {media[0].type === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media[0].url} alt="" className="w-full aspect-video object-cover" />
          )}
        </div>
      )}

      {/* Engagement bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" /> Like
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" /> Comment
        </span>
        <span className="flex items-center gap-1">
          <Repeat2 className="h-3 w-3" /> Repost
        </span>
        <span className="flex items-center gap-1">
          <Send className="h-3 w-3" /> Send
        </span>
      </div>
    </div>
  )
}

function InstagramPreview({ 
  content, 
  media, 
  account 
}: { 
  content: string
  media: PostMedia[]
  account: SocialAccount 
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Avatar className="h-8 w-8 ring-2 ring-pink-500 ring-offset-2">
          <AvatarImage src={account.accountAvatar || undefined} />
          <AvatarFallback>{account.accountHandle?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm">{account.accountHandle}</span>
        <MoreHorizontal className="h-5 w-5 ml-auto" />
      </div>

      {/* Media */}
      <div className="aspect-square bg-muted">
        {media.length > 0 ? (
          media[0].type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Video Preview</span>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Add media to preview</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6" />
            <MessageCircle className="h-6 w-6" />
            <Send className="h-6 w-6" />
          </div>
          <Bookmark className="h-6 w-6" />
        </div>

        {/* Caption */}
        <p className="text-sm">
          <span className="font-semibold">{account.accountHandle}</span>{' '}
          {content || <span className="text-muted-foreground italic">Your caption...</span>}
        </p>
      </div>
    </div>
  )
}

function FacebookPreview({ 
  content, 
  media, 
  account 
}: { 
  content: string
  media: PostMedia[]
  account: SocialAccount 
}) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={account.accountAvatar || undefined} />
          <AvatarFallback>{account.accountName?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{account.accountName}</p>
          <p className="text-xs text-muted-foreground">Just now • 🌐</p>
        </div>
      </div>

      <p className="text-sm whitespace-pre-wrap">
        {content || <span className="text-muted-foreground italic">What's on your mind?</span>}
      </p>

      {media.length > 0 && (
        <div className="rounded-lg overflow-hidden">
          {media[0].type === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media[0].url} alt="" className="w-full" />
          )}
        </div>
      )}

      <div className="flex items-center justify-around pt-3 border-t text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4" /> Like
        </span>
        <span className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> Comment
        </span>
        <span className="flex items-center gap-2">
          <Share2 className="h-4 w-4" /> Share
        </span>
      </div>
    </div>
  )
}

function GenericPreview({ 
  platform,
  content, 
  media, 
  account 
}: { 
  platform: SocialPlatform
  content: string
  media: PostMedia[]
  account: SocialAccount 
}) {
  const config = PLATFORM_CONFIGS[platform]
  const charLimit = getCharacterLimit(platform)
  const remaining = charLimit - content.length

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: config?.color + '20' }}
        >
          {config?.icon}
        </div>
        <div>
          <p className="font-semibold text-sm">{account.accountName}</p>
          <p className="text-xs text-muted-foreground">@{account.accountHandle}</p>
        </div>
      </div>

      <p className="text-sm whitespace-pre-wrap">
        {content || <span className="text-muted-foreground italic">Your post preview...</span>}
      </p>

      {media.length > 0 && (
        <div className="rounded-lg overflow-hidden border bg-muted aspect-video flex items-center justify-center">
          {media[0].type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm text-muted-foreground">Media preview</span>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground text-right">
        {remaining} / {charLimit} characters
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComposerPlatformPreview({
  platform,
  content,
  media,
  account,
  className,
}: ComposerPlatformPreviewProps) {
  const platformConfig = PLATFORM_CONFIGS[platform]

  const PreviewComponent = useMemo(() => {
    switch (platform) {
      case 'twitter':
        return <TwitterPreview content={content} media={media} account={account} />
      case 'linkedin':
        return <LinkedInPreview content={content} media={media} account={account} />
      case 'instagram':
        return <InstagramPreview content={content} media={media} account={account} />
      case 'facebook':
        return <FacebookPreview content={content} media={media} account={account} />
      default:
        return <GenericPreview platform={platform} content={content} media={media} account={account} />
    }
  }, [platform, content, media, account])

  return (
    <motion.div
      className={cn('rounded-lg border bg-card overflow-hidden', className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Platform header */}
      <div 
        className="px-4 py-2 flex items-center gap-2 border-b"
        style={{ backgroundColor: platformConfig?.color + '10' }}
      >
        {platformConfig?.icon && (
          <span className="text-sm">{platformConfig.icon}</span>
        )}
        <span className="text-sm font-medium">{platformConfig?.name} Preview</span>
      </div>

      {/* Preview content */}
      {PreviewComponent}
    </motion.div>
  )
}
