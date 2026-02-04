/**
 * Image Helpers
 * 
 * Utilities for handling image values from fields
 */

export interface ImageValue {
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Normalize image value to URL string
 * Handles both string URLs and ImageValue objects from image fields
 */
export function getImageUrl(value: string | ImageValue | undefined | null): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || '';
}

/**
 * Normalize image alt text
 * Extracts alt from ImageValue or returns default
 */
export function getImageAlt(value: string | ImageValue | undefined | null, fallback: string = 'Image'): string {
  if (!value) return fallback;
  if (typeof value === 'string') return fallback;
  return value.alt || fallback;
}

/**
 * Check if image value is valid (has a URL)
 */
export function hasImage(value: string | ImageValue | undefined | null): boolean {
  return Boolean(getImageUrl(value));
}
