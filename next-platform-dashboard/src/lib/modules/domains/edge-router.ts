/**
 * Phase EM-32: Edge Router
 * Routes requests to modules based on custom domains
 * Handles caching, white-label injection, and request logging
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  CustomDomain, 
  DomainConfig, 
  WhiteLabelConfig,
  decryptPrivateKey 
} from './custom-domain-service';

// ================================================================
// Types
// ================================================================

export interface RouteResult {
  siteModuleInstallationId: string;
  moduleId: string;
  siteId: string;
  config: DomainConfig;
  whiteLabel: WhiteLabelConfig;
  ssl: {
    certificate: string;
    privateKey: string;
  } | null;
}

export interface RequestLogEntry {
  path: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  bytesSent: number;
  ipAddress: string;
  userAgent: string;
  countryCode?: string;
}

interface CachedRoute {
  data: RouteResult;
  expiresAt: number;
}

// ================================================================
// Service Client
// ================================================================

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ================================================================
// Edge Router
// ================================================================

export class EdgeRouter {
  private static domainCache = new Map<string, CachedRoute>();
  private static CACHE_TTL = 60 * 1000; // 1 minute

  /**
   * Route a request to the correct module based on hostname
   */
  static async route(hostname: string): Promise<RouteResult | null> {
    // Check cache first
    const cached = this.domainCache.get(hostname);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const supabase = getServiceClient();

    // Query using the optimized function
    const { data, error } = await supabase
      .rpc('get_module_by_domain', { p_domain: hostname });

    if (error || !data || data.length === 0) {
      return null;
    }

    const domainData = data[0];

    // Get SSL certificate if needed
    const { data: domainRecord } = await supabase
      .from('module_custom_domains')
      .select('ssl_certificate, ssl_private_key_encrypted')
      .eq('site_module_id', domainData.site_module_id)
      .eq('domain', hostname)
      .single();

    let ssl: RouteResult['ssl'] = null;
    
    if (domainRecord?.ssl_certificate && domainRecord?.ssl_private_key_encrypted) {
      try {
        ssl = {
          certificate: domainRecord.ssl_certificate,
          privateKey: decryptPrivateKey(domainRecord.ssl_private_key_encrypted)
        };
      } catch (err) {
        console.error('Failed to decrypt SSL private key:', err);
      }
    }

    const result: RouteResult = {
      siteModuleInstallationId: domainData.site_module_installation_id,
      moduleId: domainData.module_id,
      siteId: domainData.site_id,
      config: domainData.config || {},
      whiteLabel: domainData.white_label || {},
      ssl
    };

    // Cache result
    this.domainCache.set(hostname, {
      data: result,
      expiresAt: Date.now() + this.CACHE_TTL
    });

    return result;
  }

  /**
   * Invalidate cache for a specific domain
   */
  static invalidateCache(hostname: string): void {
    this.domainCache.delete(hostname);
  }

  /**
   * Clear entire domain cache
   */
  static clearCache(): void {
    this.domainCache.clear();
  }

  /**
   * Get response headers based on domain config
   */
  static getResponseHeaders(config: DomainConfig): Record<string, string> {
    const headers: Record<string, string> = {};

    // Security headers (always apply)
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'SAMEORIGIN';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    
    // HSTS if HTTPS redirect is enabled
    if (config.redirect_to_https !== false) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    // Custom headers from config
    if (config.custom_headers) {
      Object.assign(headers, config.custom_headers);
    }

    // Cache control
    if (config.cache_ttl && config.cache_ttl > 0) {
      headers['Cache-Control'] = `public, max-age=${config.cache_ttl}`;
    } else {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    // CDN cache hint
    if (config.enable_cdn) {
      headers['CDN-Cache-Control'] = `max-age=${config.cache_ttl || 3600}`;
      headers['Surrogate-Control'] = `max-age=${config.cache_ttl || 3600}`;
    }

    return headers;
  }

  /**
   * Check if request should redirect and return redirect URL
   */
  static getRedirect(
    hostname: string,
    path: string,
    protocol: 'http' | 'https',
    config: DomainConfig
  ): string | null {
    // HTTPS redirect
    if (config.redirect_to_https !== false && protocol === 'http') {
      return `https://${hostname}${path}`;
    }

    // WWW redirect
    if (config.force_www === true && !hostname.startsWith('www.')) {
      return `${protocol}://www.${hostname}${path}`;
    }

    // Non-WWW redirect
    if (config.force_www === false && hostname.startsWith('www.')) {
      const nonWwwHostname = hostname.replace(/^www\./, '');
      return `${protocol}://${nonWwwHostname}${path}`;
    }

    return null;
  }

  /**
   * Inject white-label branding into HTML response
   */
  static injectWhiteLabel(html: string, whiteLabel: WhiteLabelConfig): string {
    let result = html;

    // Replace favicon
    if (whiteLabel.favicon_url) {
      // Remove existing favicon links
      result = result.replace(
        /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/gi,
        ''
      );
      // Add new favicon before </head>
      result = result.replace(
        '</head>',
        `<link rel="icon" href="${this.escapeHtml(whiteLabel.favicon_url)}" />\n</head>`
      );
    }

    // Inject/modify title with brand name
    if (whiteLabel.brand_name) {
      const brandName = this.escapeHtml(whiteLabel.brand_name);
      // Add brand name as suffix to existing title
      result = result.replace(
        /<title>([^<]*)<\/title>/i,
        (match, title) => {
          const cleanTitle = title.trim();
          if (cleanTitle && !cleanTitle.includes(brandName)) {
            return `<title>${cleanTitle} | ${brandName}</title>`;
          }
          return `<title>${brandName}</title>`;
        }
      );
    }

    // Inject logo URL as meta tag for JS access
    if (whiteLabel.logo_url) {
      result = result.replace(
        '</head>',
        `<meta name="brand-logo" content="${this.escapeHtml(whiteLabel.logo_url)}" />\n</head>`
      );
    }

    // Inject custom CSS
    if (whiteLabel.custom_css) {
      const sanitizedCSS = this.sanitizeCSS(whiteLabel.custom_css);
      result = result.replace(
        '</head>',
        `<style id="white-label-css">${sanitizedCSS}</style>\n</head>`
      );
    }

    // Inject brand colors as CSS variables
    if (whiteLabel.brand_colors) {
      const primary = whiteLabel.brand_colors.primary || '#3b82f6';
      const secondary = whiteLabel.brand_colors.secondary || '#6366f1';
      
      const colorCSS = `
<style id="brand-colors">
:root {
  --brand-primary: ${this.sanitizeColor(primary)};
  --brand-secondary: ${this.sanitizeColor(secondary)};
  --brand-primary-foreground: #ffffff;
  --brand-secondary-foreground: #ffffff;
}
</style>`;
      result = result.replace('</head>', `${colorCSS}\n</head>`);
    }

    // Remove "Powered by DRAMAC" branding if configured
    if (whiteLabel.hide_powered_by) {
      // Remove powered by text
      result = result.replace(/powered\s+by\s+dramac/gi, '');
      // Remove elements with dramac-branding class
      result = result.replace(
        /<[^>]*class=["'][^"']*dramac-branding[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi,
        ''
      );
      // Remove data attributes
      result = result.replace(/\s*data-dramac-branding=["'][^"']*["']/gi, '');
    }

    return result;
  }

  /**
   * Log a request for analytics
   */
  static async logRequest(
    domainId: string,
    request: RequestLogEntry
  ): Promise<void> {
    const supabase = getServiceClient();

    // Fire and forget for performance
    Promise.all([
      // Insert log entry
      supabase.from('domain_request_logs').insert({
        domain_id: domainId,
        path: request.path,
        method: request.method,
        status_code: request.statusCode,
        response_time_ms: request.responseTimeMs,
        bytes_sent: request.bytesSent,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        country_code: request.countryCode
      }),
      // Update aggregate counters
      supabase.rpc('increment_domain_stats', {
        p_domain_id: domainId,
        p_requests: 1,
        p_bytes: request.bytesSent
      })
    ]).catch(err => {
      console.error('Failed to log request:', err);
    });
  }

  /**
   * Get domain analytics
   */
  static async getAnalytics(
    domainId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalRequests: number;
    totalBandwidth: number;
    requestsByPath: Array<{ path: string; count: number }>;
    requestsByStatus: Array<{ status: number; count: number }>;
    avgResponseTime: number;
  }> {
    const supabase = getServiceClient();

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get aggregated data
    const { data: domain } = await supabase
      .from('module_custom_domains')
      .select('total_requests, bandwidth_bytes')
      .eq('id', domainId)
      .single();

    // Get detailed logs for period
    const { data: logs } = await supabase
      .from('domain_request_logs')
      .select('path, status_code, response_time_ms, bytes_sent')
      .eq('domain_id', domainId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000);

    // Aggregate logs
    const pathCounts = new Map<string, number>();
    const statusCounts = new Map<number, number>();
    let totalResponseTime = 0;

    for (const log of logs || []) {
      pathCounts.set(log.path, (pathCounts.get(log.path) || 0) + 1);
      statusCounts.set(log.status_code, (statusCounts.get(log.status_code) || 0) + 1);
      totalResponseTime += log.response_time_ms || 0;
    }

    return {
      totalRequests: domain?.total_requests || 0,
      totalBandwidth: domain?.bandwidth_bytes || 0,
      requestsByPath: Array.from(pathCounts.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      requestsByStatus: Array.from(statusCounts.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      avgResponseTime: logs?.length ? totalResponseTime / logs.length : 0
    };
  }

  // ----------------------------------------------------------------
  // Private Helper Methods
  // ----------------------------------------------------------------

  private static escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
  }

  private static sanitizeCSS(css: string): string {
    // Remove potentially dangerous CSS
    return css
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/@import/gi, '')
      .replace(/behavior\s*:/gi, '')
      .replace(/-moz-binding/gi, '');
  }

  private static sanitizeColor(color: string): string {
    // Only allow valid hex colors or named colors
    if (/^#[0-9A-Fa-f]{3,8}$/.test(color)) {
      return color;
    }
    if (/^[a-zA-Z]+$/.test(color)) {
      return color;
    }
    if (/^rgb\(\d+,\s*\d+,\s*\d+\)$/.test(color)) {
      return color;
    }
    if (/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/.test(color)) {
      return color;
    }
    return '#3b82f6'; // Default fallback
  }
}

export default EdgeRouter;
