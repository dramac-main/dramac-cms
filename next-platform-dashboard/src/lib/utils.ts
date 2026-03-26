import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
  formatCurrency as localeFormatCurrency,
  formatNumber as localeFormatNumber,
  formatDate as localeFormatDate,
  formatDateRange as localeFormatDateRange,
} from "@/lib/locale-config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return localeFormatDate(date, DEFAULT_LOCALE);
}

export function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return localeFormatCurrency(amount, currency, DEFAULT_LOCALE);
}

export function formatNumber(num: number): string {
  return localeFormatNumber(num, DEFAULT_LOCALE);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  return localeFormatDateRange(start, end, DEFAULT_LOCALE);
}

/**
 * Ensure a URL string has a protocol prefix.
 * Prevents bare domains (e.g. "example.com") from being treated as relative paths.
 */
export function ensureAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Also handle protocol-relative URLs
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}
