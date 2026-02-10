import { DEFAULT_LOCALE, DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
/**
 * Module Utility Functions
 * 
 * Helper functions for module-related operations
 */

/**
 * Format price from cents to display string
 */
export function formatPrice(priceInCents: number, includeCurrency = true): string {
  const dollars = priceInCents / 100;
  const formatted = dollars.toFixed(2);
  return includeCurrency ? `${DEFAULT_CURRENCY_SYMBOL}${formatted}` : formatted;
}

/**
 * Format price with billing period
 */
export function formatPriceWithPeriod(
  priceInCents: number, 
  period: 'monthly' | 'yearly' = 'monthly'
): string {
  const price = formatPrice(priceInCents);
  const suffix = period === 'monthly' ? '/mo' : '/yr';
  return `${price}${suffix}`;
}

/**
 * Calculate markup price
 */
export function calculateMarkupPrice(
  wholesalePriceCents: number,
  markupType: 'percentage' | 'fixed' | 'custom',
  markupValue: number,
  customPriceCents?: number
): number {
  switch (markupType) {
    case 'percentage':
      return Math.round(wholesalePriceCents * (1 + markupValue / 100));
    case 'fixed':
      return wholesalePriceCents + markupValue;
    case 'custom':
      return customPriceCents || wholesalePriceCents;
    default:
      return wholesalePriceCents;
  }
}

/**
 * Calculate profit from markup
 */
export function calculateProfit(
  wholesalePriceCents: number,
  clientPriceCents: number
): number {
  return clientPriceCents - wholesalePriceCents;
}

/**
 * Format module category for display
 */
export function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    productivity: 'Productivity',
    analytics: 'Analytics',
    marketing: 'Marketing',
    communication: 'Communication',
    finance: 'Finance',
    crm: 'CRM',
    content: 'Content',
    ecommerce: 'E-Commerce',
    seo: 'SEO',
    forms: 'Forms',
    blog: 'Blog',
    other: 'Other',
  };
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Format install level for display
 */
export function formatInstallLevel(level: string): string {
  const levelMap: Record<string, string> = {
    agency: 'Agency',
    client: 'Client',
    site: 'Site',
  };
  return levelMap[level] || level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Format module status for display
 */
export function formatModuleStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    draft: 'Draft',
    review: 'In Review',
    deprecated: 'Deprecated',
    inactive: 'Inactive',
  };
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get status color class
 */
export function getStatusColorClass(status: string): string {
  const colorMap: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    deprecated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return colorMap[status] || colorMap.draft;
}

/**
 * Generate module slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Validate module slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/**
 * Calculate yearly price from monthly (with discount)
 */
export function calculateYearlyPrice(monthlyPriceCents: number, discountPercent = 16.67): number {
  const yearlyFull = monthlyPriceCents * 12;
  const discount = yearlyFull * (discountPercent / 100);
  return Math.round(yearlyFull - discount);
}

/**
 * Format date for display
 */
export function formatModuleDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString(DEFAULT_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Module permission descriptions
 */
export const permissionDescriptions: Record<string, string> = {
  'database:read': 'Read data from the database',
  'database:write': 'Write data to the database',
  'storage:read': 'Read files from storage',
  'storage:write': 'Upload files to storage',
  'email:send': 'Send emails',
  'api:external': 'Make external API calls',
  'analytics:read': 'Access analytics data',
  'analytics:write': 'Track analytics events',
  'billing:read': 'View billing information',
  'billing:write': 'Manage billing/payments',
  'users:read': 'View user information',
  'users:write': 'Modify user data',
  'sites:read': 'Access site data',
  'sites:write': 'Modify site content',
  'clients:read': 'View client information',
  'clients:write': 'Modify client data',
};

/**
 * Get permission description
 */
export function getPermissionDescription(permission: string): string {
  return permissionDescriptions[permission] || permission;
}

/**
 * Group permissions by category
 */
export function groupPermissions(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  
  permissions.forEach(perm => {
    const [category] = perm.split(':');
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(perm);
  });
  
  return groups;
}
