/**
 * Media Upload Service - Pure Utilities
 * 
 * PHASE SM-05: Platform constraint definitions and validation utilities.
 * This file contains NO server imports - safe to import from client components.
 * 
 * Server functions (upload, delete, getLibrary) live in ../actions/media-actions.ts
 */

import type { SocialPlatform, MediaFileType } from '../types'

// Platform-specific media constraints
export const PLATFORM_CONSTRAINTS: Record<SocialPlatform, {
  maxImageSize: number
  maxVideoSize: number
  maxImageDimension: number
  allowedImageFormats: string[]
  allowedVideoFormats: string[]
  aspectRatios: { min: number; max: number }[]
}> = {
  facebook: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 10 * 1024 * 1024 * 1024,
    maxImageDimension: 8192,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoFormats: ['video/mp4', 'video/mov', 'video/avi'],
    aspectRatios: [{ min: 0.5625, max: 1.91 }],
  },
  instagram: {
    maxImageSize: 8 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxImageDimension: 1440,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    aspectRatios: [
      { min: 0.5625, max: 0.5625 },
      { min: 0.8, max: 1.0 },
      { min: 1.91, max: 1.91 },
    ],
  },
  twitter: {
    maxImageSize: 5 * 1024 * 1024,
    maxVideoSize: 512 * 1024 * 1024,
    maxImageDimension: 4096,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoFormats: ['video/mp4'],
    aspectRatios: [{ min: 0.5, max: 3 }],
  },
  linkedin: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 5 * 1024 * 1024 * 1024,
    maxImageDimension: 4096,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif'],
    allowedVideoFormats: ['video/mp4'],
    aspectRatios: [{ min: 0.5625, max: 2.4 }],
  },
  tiktok: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 4 * 1024 * 1024 * 1024,
    maxImageDimension: 1080,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/webm'],
    aspectRatios: [{ min: 0.5625, max: 0.5625 }],
  },
  youtube: {
    maxImageSize: 2 * 1024 * 1024,
    maxVideoSize: 256 * 1024 * 1024 * 1024,
    maxImageDimension: 2560,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    aspectRatios: [{ min: 1.33, max: 1.78 }],
  },
  pinterest: {
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 2 * 1024 * 1024 * 1024,
    maxImageDimension: 10000,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif'],
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    aspectRatios: [{ min: 0.5, max: 1.5 }],
  },
  threads: {
    maxImageSize: 8 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxImageDimension: 1440,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4', 'video/quicktime'],
    aspectRatios: [{ min: 0.5625, max: 1.91 }],
  },
  bluesky: {
    maxImageSize: 1 * 1024 * 1024,
    maxVideoSize: 50 * 1024 * 1024,
    maxImageDimension: 2000,
    allowedImageFormats: ['image/jpeg', 'image/png'],
    allowedVideoFormats: ['video/mp4'],
    aspectRatios: [{ min: 0.5, max: 2.5 }],
  },
  mastodon: {
    maxImageSize: 16 * 1024 * 1024,
    maxVideoSize: 40 * 1024 * 1024,
    maxImageDimension: 4096,
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoFormats: ['video/mp4', 'video/webm', 'video/ogg'],
    aspectRatios: [{ min: 0.3, max: 3.0 }],
  },
}

export function getFileType(mimeType: string): MediaFileType {
  if (mimeType === 'image/gif') return 'gif'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'image'
}

/**
 * Validate a file against a single platform's constraints
 */
export function validateSinglePlatform(
  file: { type: string; size: number; width?: number; height?: number },
  platform: SocialPlatform
): { valid: boolean; error?: string } {
  const constraints = PLATFORM_CONSTRAINTS[platform]
  if (!constraints) return { valid: true }

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  if (isImage) {
    if (file.size > constraints.maxImageSize) {
      return { valid: false, error: `Image too large (max ${Math.round(constraints.maxImageSize / 1024 / 1024)}MB)` }
    }
    if (!constraints.allowedImageFormats.includes(file.type)) {
      return { valid: false, error: `Image format ${file.type} not supported` }
    }
    if (file.width && file.width > constraints.maxImageDimension) {
      return { valid: false, error: `Image width exceeds ${constraints.maxImageDimension}px` }
    }
    if (file.height && file.height > constraints.maxImageDimension) {
      return { valid: false, error: `Image height exceeds ${constraints.maxImageDimension}px` }
    }
  }

  if (isVideo) {
    if (file.size > constraints.maxVideoSize) {
      return { valid: false, error: `Video too large (max ${Math.round(constraints.maxVideoSize / 1024 / 1024)}MB)` }
    }
    if (!constraints.allowedVideoFormats.includes(file.type)) {
      return { valid: false, error: `Video format ${file.type} not supported` }
    }
  }

  return { valid: true }
}

/**
 * Validate a file against platform constraints (public)
 */
export function validateMediaForPlatforms(
  file: { type: string; size: number; width?: number; height?: number },
  platforms: SocialPlatform[]
): Record<SocialPlatform, { valid: boolean; errors: string[] }> {
  const results = {} as Record<SocialPlatform, { valid: boolean; errors: string[] }>

  for (const platform of platforms) {
    const result = validateSinglePlatform(file, platform)
    results[platform] = {
      valid: result.valid,
      errors: result.error ? [result.error] : [],
    }
  }

  return results
}
