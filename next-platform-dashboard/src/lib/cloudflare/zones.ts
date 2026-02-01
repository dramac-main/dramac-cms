// src/lib/cloudflare/zones.ts
// Cloudflare Zone Management Service

import { getCloudflareClient, CloudflareApiError } from './client';
import { CLOUDFLARE_CONFIG } from './config';
import type { 
  CloudflareZone, 
  CreateZoneParams, 
  SslMode,
  TlsVersion,
  CloudflareZoneResponse,
  ZoneActivationStatus,
  ZoneStatus,
} from './types';

/**
 * Zone Management Service
 * 
 * Handles Cloudflare zone (domain) operations including:
 * - Zone creation and deletion
 * - Zone settings management
 * - SSL/TLS configuration
 * - Security defaults
 * 
 * @example
 * ```typescript
 * import { zoneService } from '@/lib/cloudflare';
 * 
 * // Create a new zone
 * const zone = await zoneService.createZone({ name: 'example.com' });
 * 
 * // Apply security defaults
 * await zoneService.applySecurityDefaults(zone.id);
 * ```
 */
export class ZoneService {
  /**
   * Create a new zone (add domain to Cloudflare)
   * 
   * @param params - Zone creation parameters
   * @returns Created zone details
   */
  async createZone(params: CreateZoneParams): Promise<CloudflareZone> {
    const client = getCloudflareClient();
    
    const body: Record<string, unknown> = {
      name: params.name.toLowerCase(),
      jump_start: params.jumpStart ?? true,
      type: params.type ?? 'full',
    };
    
    // Add account ID if provided or configured
    const accountId = params.accountId || CLOUDFLARE_CONFIG.accountId;
    if (accountId) {
      body.account = { id: accountId };
    }
    
    const response = await client.post<CloudflareZoneResponse>('/zones', body);
    return this.mapZone(response);
  }
  
  /**
   * Get zone by ID
   */
  async getZone(zoneId: string): Promise<CloudflareZone> {
    const client = getCloudflareClient();
    const response = await client.get<CloudflareZoneResponse>(`/zones/${zoneId}`);
    return this.mapZone(response);
  }
  
  /**
   * Get zone by domain name
   * 
   * @param name - Domain name to search for
   * @returns Zone if found, null otherwise
   */
  async getZoneByName(name: string): Promise<CloudflareZone | null> {
    const client = getCloudflareClient();
    
    const response = await client.get<CloudflareZoneResponse[]>('/zones', {
      name: name.toLowerCase(),
    });
    
    if (!response || response.length === 0) {
      return null;
    }
    
    return this.mapZone(response[0]);
  }
  
  /**
   * List all zones (with pagination)
   * 
   * @param page - Page number (1-indexed)
   * @param perPage - Results per page (max 50)
   */
  async listZones(
    page = 1, 
    perPage = 50
  ): Promise<{ zones: CloudflareZone[]; total: number }> {
    const client = getCloudflareClient();
    
    const response = await client.get<CloudflareZoneResponse[]>('/zones', {
      page,
      per_page: perPage,
    });
    
    return {
      zones: response.map(z => this.mapZone(z)),
      total: response.length,
    };
  }
  
  /**
   * Delete a zone
   * 
   * @param zoneId - Zone ID to delete
   */
  async deleteZone(zoneId: string): Promise<{ id: string }> {
    const client = getCloudflareClient();
    return client.delete(`/zones/${zoneId}`);
  }
  
  /**
   * Check zone activation status
   * 
   * Returns whether the zone is active and what nameservers are assigned.
   */
  async checkActivation(zoneId: string): Promise<ZoneActivationStatus> {
    const zone = await this.getZone(zoneId);
    return {
      activated: zone.status === 'active',
      nameservers: zone.nameServers,
      originalNameservers: zone.originalNameServers,
    };
  }
  
  /**
   * Get or create zone for a domain
   * 
   * First checks if zone exists, creates if not.
   * Handles "zone already exists" errors gracefully.
   */
  async getOrCreateZone(domainName: string): Promise<CloudflareZone> {
    // Check if zone already exists
    const existing = await this.getZoneByName(domainName);
    if (existing) {
      return existing;
    }
    
    // Create new zone
    try {
      return await this.createZone({ name: domainName });
    } catch (error) {
      // If zone was created between check and create, fetch it
      if (error instanceof CloudflareApiError && error.isZoneAlreadyExists()) {
        const zone = await this.getZoneByName(domainName);
        if (zone) return zone;
      }
      throw error;
    }
  }
  
  /**
   * Purge zone cache
   */
  async purgeCache(
    zoneId: string, 
    options?: { purgeEverything?: boolean; files?: string[] }
  ): Promise<void> {
    const client = getCloudflareClient();
    
    const body: Record<string, unknown> = {};
    if (options?.purgeEverything) {
      body.purge_everything = true;
    } else if (options?.files?.length) {
      body.files = options.files;
    }
    
    await client.post(`/zones/${zoneId}/purge_cache`, body);
  }
  
  // ============================================================================
  // Zone Settings
  // ============================================================================
  
  /**
   * Set SSL mode for zone
   */
  async setSslMode(zoneId: string, mode: SslMode): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/ssl`, {
      value: mode,
    });
  }
  
  /**
   * Get SSL mode for zone
   */
  async getSslMode(zoneId: string): Promise<SslMode> {
    const client = getCloudflareClient();
    const response = await client.get<{ value: SslMode }>(
      `/zones/${zoneId}/settings/ssl`
    );
    return response.value;
  }
  
  /**
   * Enable Always Use HTTPS
   */
  async enableAlwaysHttps(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/always_use_https`, {
      value: 'on',
    });
  }
  
  /**
   * Disable Always Use HTTPS
   */
  async disableAlwaysHttps(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/always_use_https`, {
      value: 'off',
    });
  }
  
  /**
   * Set minimum TLS version
   */
  async setMinTlsVersion(zoneId: string, version: TlsVersion): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/min_tls_version`, {
      value: version,
    });
  }
  
  /**
   * Enable automatic HTTPS rewrites
   */
  async enableAutoHttpsRewrites(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/automatic_https_rewrites`, {
      value: 'on',
    });
  }
  
  /**
   * Disable automatic HTTPS rewrites
   */
  async disableAutoHttpsRewrites(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/automatic_https_rewrites`, {
      value: 'off',
    });
  }
  
  /**
   * Enable HTTP/2
   */
  async enableHttp2(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/http2`, {
      value: 'on',
    });
  }
  
  /**
   * Enable Browser Integrity Check
   */
  async enableBrowserCheck(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/browser_check`, {
      value: 'on',
    });
  }
  
  /**
   * Set security level
   */
  async setSecurityLevel(
    zoneId: string, 
    level: 'off' | 'essentially_off' | 'low' | 'medium' | 'high' | 'under_attack'
  ): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/security_level`, {
      value: level,
    });
  }
  
  /**
   * Enable Rocket Loader
   */
  async enableRocketLoader(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/rocket_loader`, {
      value: 'on',
    });
  }
  
  /**
   * Enable Email Obfuscation
   */
  async enableEmailObfuscation(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/settings/email_obfuscation`, {
      value: 'on',
    });
  }
  
  /**
   * Apply recommended security defaults
   * 
   * Sets up recommended security settings for production sites:
   * - SSL Mode: Full
   * - Always Use HTTPS: On
   * - Minimum TLS: 1.2
   * - Auto HTTPS Rewrites: On
   * - HTTP/2: On
   * - Browser Check: On
   */
  async applySecurityDefaults(zoneId: string): Promise<void> {
    await Promise.all([
      this.setSslMode(zoneId, 'full'),
      this.enableAlwaysHttps(zoneId),
      this.setMinTlsVersion(zoneId, '1.2'),
      this.enableAutoHttpsRewrites(zoneId),
      this.enableHttp2(zoneId),
      this.enableBrowserCheck(zoneId),
    ]);
  }
  
  /**
   * Apply performance optimizations
   * 
   * Sets up performance-focused settings:
   * - Rocket Loader: On
   * - Email Obfuscation: On (security + performance)
   */
  async applyPerformanceDefaults(zoneId: string): Promise<void> {
    await Promise.all([
      this.enableRocketLoader(zoneId),
      this.enableEmailObfuscation(zoneId),
    ]);
  }
  
  // ============================================================================
  // Universal SSL
  // ============================================================================
  
  /**
   * Get Universal SSL settings
   */
  async getUniversalSsl(zoneId: string): Promise<{ enabled: boolean }> {
    const client = getCloudflareClient();
    return client.get(`/zones/${zoneId}/ssl/universal/settings`);
  }
  
  /**
   * Enable Universal SSL
   */
  async enableUniversalSsl(zoneId: string): Promise<void> {
    const client = getCloudflareClient();
    await client.patch(`/zones/${zoneId}/ssl/universal/settings`, {
      enabled: true,
    });
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  /**
   * Map Cloudflare API response to CloudflareZone
   */
  private mapZone(data: CloudflareZoneResponse): CloudflareZone {
    return {
      id: data.id,
      name: data.name,
      status: data.status as ZoneStatus,
      paused: data.paused,
      type: data.type,
      nameServers: data.name_servers || [],
      originalNameServers: data.original_name_servers || [],
      createdOn: data.created_on,
      modifiedOn: data.modified_on,
      activatedOn: data.activated_on,
      plan: {
        id: data.plan?.id || 'free',
        name: data.plan?.name || 'Free',
      },
    };
  }
}

// Export singleton instance
export const zoneService = new ZoneService();
