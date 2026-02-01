// src/lib/cloudflare/dns.ts
// Cloudflare DNS Record Management Service

import { getCloudflareClient, CloudflareApiError } from './client';
import { CLOUDFLARE_CONFIG, DNS_TEMPLATES } from './config';
import type { 
  DnsRecord, 
  DnsRecordType, 
  CreateDnsRecordParams, 
  UpdateDnsRecordParams,
  ListDnsRecordsFilters,
  DnsRecordResponse,
  BatchCreateResult,
  BatchDeleteResult,
} from './types';

/**
 * DNS Record Management Service
 * 
 * Handles all DNS record operations including:
 * - CRUD operations for DNS records
 * - Batch operations
 * - Template-based configurations
 * - Utility methods for common operations
 * 
 * @example
 * ```typescript
 * import { dnsService } from '@/lib/cloudflare';
 * 
 * // Create a record
 * const record = await dnsService.createRecord({
 *   zoneId: 'zone123',
 *   type: 'A',
 *   name: '@',
 *   content: '192.168.1.1',
 * });
 * 
 * // Apply site template
 * const records = await dnsService.applySiteTemplate('zone123');
 * ```
 */
export class DnsService {
  // ============================================================================
  // CRUD Operations
  // ============================================================================
  
  /**
   * Create a DNS record
   */
  async createRecord(params: CreateDnsRecordParams): Promise<DnsRecord> {
    const client = getCloudflareClient();
    
    const body: Record<string, unknown> = {
      type: params.type,
      name: params.name,
      content: params.content,
      ttl: params.ttl ?? CLOUDFLARE_CONFIG.defaultTtl,
    };
    
    // Add priority for MX and SRV records
    if (params.priority !== undefined) {
      body.priority = params.priority;
    }
    
    // Only certain record types can be proxied
    if (['A', 'AAAA', 'CNAME'].includes(params.type)) {
      body.proxied = params.proxied ?? CLOUDFLARE_CONFIG.defaultProxied;
    }
    
    const response = await client.post<DnsRecordResponse>(
      `/zones/${params.zoneId}/dns_records`,
      body
    );
    
    return this.mapRecord(response);
  }
  
  /**
   * Get a DNS record by ID
   */
  async getRecord(zoneId: string, recordId: string): Promise<DnsRecord> {
    const client = getCloudflareClient();
    const response = await client.get<DnsRecordResponse>(
      `/zones/${zoneId}/dns_records/${recordId}`
    );
    return this.mapRecord(response);
  }
  
  /**
   * Update a DNS record
   */
  async updateRecord(params: UpdateDnsRecordParams): Promise<DnsRecord> {
    const client = getCloudflareClient();
    
    const body: Record<string, unknown> = {
      type: params.type,
      name: params.name,
      content: params.content,
      ttl: params.ttl ?? CLOUDFLARE_CONFIG.defaultTtl,
    };
    
    if (params.priority !== undefined) {
      body.priority = params.priority;
    }
    
    if (['A', 'AAAA', 'CNAME'].includes(params.type)) {
      body.proxied = params.proxied ?? CLOUDFLARE_CONFIG.defaultProxied;
    }
    
    const response = await client.put<DnsRecordResponse>(
      `/zones/${params.zoneId}/dns_records/${params.recordId}`,
      body
    );
    
    return this.mapRecord(response);
  }
  
  /**
   * Delete a DNS record
   */
  async deleteRecord(zoneId: string, recordId: string): Promise<{ id: string }> {
    const client = getCloudflareClient();
    return client.delete(`/zones/${zoneId}/dns_records/${recordId}`);
  }
  
  /**
   * List all DNS records for a zone
   */
  async listRecords(
    zoneId: string,
    filters?: ListDnsRecordsFilters
  ): Promise<{ records: DnsRecord[]; total: number }> {
    const client = getCloudflareClient();
    
    const params: Record<string, string | number> = {
      page: filters?.page ?? 1,
      per_page: filters?.perPage ?? 100,
    };
    
    if (filters?.type) params.type = filters.type;
    if (filters?.name) params.name = filters.name;
    if (filters?.content) params.content = filters.content;
    
    const response = await client.get<DnsRecordResponse[]>(
      `/zones/${zoneId}/dns_records`,
      params
    );
    
    return {
      records: response.map(r => this.mapRecord(r)),
      total: response.length,
    };
  }
  
  // ============================================================================
  // Batch Operations
  // ============================================================================
  
  /**
   * Create multiple DNS records
   * 
   * Continues on error, returns both successes and failures.
   */
  async createRecords(
    zoneId: string,
    records: Omit<CreateDnsRecordParams, 'zoneId'>[]
  ): Promise<BatchCreateResult> {
    const created: DnsRecord[] = [];
    const errors: { record: typeof records[0]; error: string }[] = [];
    
    for (const record of records) {
      try {
        const result = await this.createRecord({ ...record, zoneId });
        created.push(result);
      } catch (error) {
        errors.push({
          record,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return { created, errors };
  }
  
  /**
   * Delete multiple DNS records
   */
  async deleteRecords(
    zoneId: string,
    recordIds: string[]
  ): Promise<BatchDeleteResult> {
    const deleted: string[] = [];
    const errors: { id: string; error: string }[] = [];
    
    for (const recordId of recordIds) {
      try {
        await this.deleteRecord(zoneId, recordId);
        deleted.push(recordId);
      } catch (error) {
        errors.push({
          id: recordId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return { deleted, errors };
  }
  
  // ============================================================================
  // Template Operations
  // ============================================================================
  
  /**
   * Apply site hosting DNS template
   * 
   * Creates A record for root and CNAME for www.
   */
  async applySiteTemplate(
    zoneId: string,
    options?: { ipAddress?: string; cname?: string }
  ): Promise<DnsRecord[]> {
    const ip = options?.ipAddress || CLOUDFLARE_CONFIG.platformIp;
    
    const records: Omit<CreateDnsRecordParams, 'zoneId'>[] = [
      {
        type: 'A',
        name: '@',
        content: ip,
        proxied: true,
      },
      {
        type: 'CNAME',
        name: 'www',
        content: '@',
        proxied: true,
      },
    ];
    
    const result = await this.createRecords(zoneId, records);
    return result.created;
  }
  
  /**
   * Apply Titan Mail DNS template
   * 
   * Sets up MX, SPF, DKIM, and DMARC records for Titan email.
   */
  async applyTitanEmailTemplate(
    zoneId: string,
    dkimValue?: string
  ): Promise<DnsRecord[]> {
    const records: Omit<CreateDnsRecordParams, 'zoneId'>[] = [
      // MX Records
      {
        type: 'MX',
        name: '@',
        content: 'mx1.titan.email',
        priority: 10,
      },
      {
        type: 'MX',
        name: '@',
        content: 'mx2.titan.email',
        priority: 20,
      },
      // SPF Record
      {
        type: 'TXT',
        name: '@',
        content: 'v=spf1 include:spf.titan.email ~all',
      },
    ];
    
    // Add DKIM if provided
    if (dkimValue) {
      records.push({
        type: 'TXT',
        name: DNS_TEMPLATES.titanEmail.dkimSelector,
        content: dkimValue,
      });
    }
    
    // Add DMARC
    records.push({
      type: 'TXT',
      name: '_dmarc',
      content: DNS_TEMPLATES.titanEmail.dmarcRecord,
    });
    
    const result = await this.createRecords(zoneId, records);
    return result.created;
  }
  
  /**
   * Apply Google Workspace email template
   */
  async applyGoogleWorkspaceTemplate(zoneId: string): Promise<DnsRecord[]> {
    const template = DNS_TEMPLATES.googleWorkspace;
    
    const records: Omit<CreateDnsRecordParams, 'zoneId'>[] = template.records.map(r => ({
      type: r.type as DnsRecordType,
      name: r.name,
      content: r.content,
      ...('priority' in r ? { priority: r.priority } : {}),
    }));
    
    const result = await this.createRecords(zoneId, records);
    return result.created;
  }
  
  /**
   * Apply Vercel deployment template
   */
  async applyVercelTemplate(zoneId: string): Promise<DnsRecord[]> {
    const template = DNS_TEMPLATES.vercel;
    
    const records: Omit<CreateDnsRecordParams, 'zoneId'>[] = template.records.map(r => ({
      type: r.type as DnsRecordType,
      name: r.name,
      content: r.content,
      proxied: r.proxied,
    }));
    
    const result = await this.createRecords(zoneId, records);
    return result.created;
  }
  
  /**
   * Add domain verification TXT record
   */
  async addVerificationRecord(
    zoneId: string,
    token: string
  ): Promise<DnsRecord> {
    return this.createRecord({
      zoneId,
      type: 'TXT',
      name: DNS_TEMPLATES.verification.prefix,
      content: token,
    });
  }
  
  /**
   * Remove domain verification TXT record
   */
  async removeVerificationRecord(zoneId: string): Promise<void> {
    const { records } = await this.listRecords(zoneId, {
      type: 'TXT',
      name: DNS_TEMPLATES.verification.prefix,
    });
    
    if (records.length > 0) {
      await this.deleteRecord(zoneId, records[0].id);
    }
  }
  
  // ============================================================================
  // Helper Methods
  // ============================================================================
  
  /**
   * Check if a record exists
   */
  async recordExists(
    zoneId: string,
    type: DnsRecordType,
    name: string
  ): Promise<boolean> {
    const { records } = await this.listRecords(zoneId, { type, name });
    return records.length > 0;
  }
  
  /**
   * Get or create a record
   * 
   * If record exists and content differs, updates it.
   */
  async getOrCreateRecord(params: CreateDnsRecordParams): Promise<DnsRecord> {
    const { records } = await this.listRecords(params.zoneId, {
      type: params.type,
      name: params.name,
    });
    
    if (records.length > 0) {
      // Update if content differs
      if (records[0].content !== params.content) {
        return this.updateRecord({
          ...params,
          recordId: records[0].id,
        });
      }
      return records[0];
    }
    
    // Create new record
    try {
      return await this.createRecord(params);
    } catch (error) {
      // Handle race condition
      if (error instanceof CloudflareApiError && error.isRecordAlreadyExists()) {
        const { records: existingRecords } = await this.listRecords(params.zoneId, {
          type: params.type,
          name: params.name,
        });
        if (existingRecords.length > 0) {
          return existingRecords[0];
        }
      }
      throw error;
    }
  }
  
  /**
   * Delete records by type and name pattern
   */
  async deleteRecordsByPattern(
    zoneId: string,
    type: DnsRecordType,
    namePattern: string
  ): Promise<number> {
    const { records } = await this.listRecords(zoneId, { type });
    const toDelete = records.filter(r => r.name.includes(namePattern));
    
    const { deleted } = await this.deleteRecords(
      zoneId,
      toDelete.map(r => r.id)
    );
    
    return deleted.length;
  }
  
  /**
   * Delete all records of a specific type
   */
  async deleteRecordsByType(
    zoneId: string,
    type: DnsRecordType
  ): Promise<number> {
    const { records } = await this.listRecords(zoneId, { type });
    
    const { deleted } = await this.deleteRecords(
      zoneId,
      records.map(r => r.id)
    );
    
    return deleted.length;
  }
  
  /**
   * Get all MX records for a zone
   */
  async getMxRecords(zoneId: string): Promise<DnsRecord[]> {
    const { records } = await this.listRecords(zoneId, { type: 'MX' });
    return records.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }
  
  /**
   * Get all TXT records for a zone
   */
  async getTxtRecords(zoneId: string): Promise<DnsRecord[]> {
    const { records } = await this.listRecords(zoneId, { type: 'TXT' });
    return records;
  }
  
  /**
   * Check if domain has email records configured
   */
  async hasEmailRecords(zoneId: string): Promise<boolean> {
    const mxRecords = await this.getMxRecords(zoneId);
    return mxRecords.length > 0;
  }
  
  /**
   * Toggle proxy status for a record
   */
  async toggleProxy(
    zoneId: string,
    recordId: string,
    proxied: boolean
  ): Promise<DnsRecord> {
    const record = await this.getRecord(zoneId, recordId);
    
    if (!record.proxiable) {
      throw new Error(`Record type ${record.type} cannot be proxied`);
    }
    
    return this.updateRecord({
      recordId,
      zoneId,
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      priority: record.priority,
      proxied,
    });
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  /**
   * Map Cloudflare API response to DnsRecord
   */
  private mapRecord(data: DnsRecordResponse): DnsRecord {
    return {
      id: data.id,
      zoneId: data.zone_id,
      zoneName: data.zone_name,
      type: data.type as DnsRecordType,
      name: data.name,
      content: data.content,
      proxiable: data.proxiable,
      proxied: data.proxied,
      ttl: data.ttl,
      locked: data.locked,
      priority: data.priority,
      createdOn: data.created_on,
      modifiedOn: data.modified_on,
    };
  }
}

// Export singleton instance
export const dnsService = new DnsService();
