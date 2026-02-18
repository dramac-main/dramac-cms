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
   *
   * @param zoneId      - Cloudflare zone ID
   * @param dkimValue   - DKIM public key value (optional, per-domain from Titan)
   * @param dmarcEmail  - Agency reporting email for DMARC rua tag (optional)
   *                      When omitted, DMARC is created without an rua tag.
   */
  async applyTitanEmailTemplate(
    zoneId: string,
    dkimValue?: string,
    dmarcEmail?: string
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

    // Build DMARC record — include rua only when the agency's email is known
    const dmarcBase = DNS_TEMPLATES.titanEmail.dmarcBaseRecord;
    const dmarcValue = dmarcEmail
      ? `${dmarcBase}; rua=mailto:${dmarcEmail}`
      : dmarcBase;

    records.push({
      type: 'TXT',
      name: '_dmarc',
      content: dmarcValue,
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
  // Zone File Export / Import
  // ============================================================================

  /**
   * Export all DNS records as a BIND-format zone file string.
   *
   * @param zoneId   - Cloudflare zone ID
   * @param zoneName - Domain name (e.g. "example.com")
   * @returns BIND zone file content as a string
   */
  async exportZoneFile(zoneId: string, zoneName: string): Promise<string> {
    const { records } = await this.listRecords(zoneId);
    const dateStr = new Date().toISOString().split('T')[0];

    const lines: string[] = [
      `; Zone file for ${zoneName}`,
      `; Generated by DRAMAC CMS on ${dateStr}`,
      `; Format: BIND zone file (RFC 1035)`,
      '',
      `$ORIGIN ${zoneName}.`,
      `$TTL 3600`,
      '',
    ];

    for (const record of records) {
      // Normalise name: strip zone suffix, use @ for apex
      let name = record.name;
      if (name === zoneName) {
        name = '@';
      } else if (name.endsWith(`.${zoneName}`)) {
        name = name.slice(0, -(zoneName.length + 1));
      }

      // Cloudflare "auto" TTL is represented as 1 — write as 3600 in zone file
      const ttl = record.ttl === 1 ? 3600 : record.ttl;

      const parts: string[] = [name, String(ttl), 'IN', record.type];

      if (record.type === 'MX') {
        parts.push(String(record.priority ?? 10));
        const host = record.content.endsWith('.') ? record.content : `${record.content}.`;
        parts.push(host);
      } else if (['CNAME', 'NS'].includes(record.type)) {
        const host = record.content.endsWith('.') ? record.content : `${record.content}.`;
        parts.push(host);
      } else if (record.type === 'TXT') {
        // Wrap value in quotes if not already
        const val = record.content.startsWith('"') ? record.content : `"${record.content}"`;
        parts.push(val);
      } else {
        parts.push(record.content);
      }

      lines.push(parts.join('\t'));
    }

    return lines.join('\n');
  }

  /**
   * Import DNS records from a BIND-format zone file string.
   *
   * Skips directives, comments, and unknown record types.
   * Continues on per-record errors (partial import).
   *
   * @param zoneId   - Cloudflare zone ID
   * @param content  - BIND zone file content
   * @param zoneName - Domain name used to normalise apex references
   * @returns BatchCreateResult with created records and per-record errors
   */
  async importZoneFile(
    zoneId: string,
    content: string,
    zoneName: string
  ): Promise<BatchCreateResult> {
    const records = this.parseZoneFile(content, zoneName);
    return this.createRecords(zoneId, records);
  }

  /**
   * Parse a BIND zone file into CreateDnsRecordParams array.
   * @internal
   */
  private parseZoneFile(
    content: string,
    zoneName: string
  ): Omit<CreateDnsRecordParams, 'zoneId'>[] {
    const records: Omit<CreateDnsRecordParams, 'zoneId'>[] = [];
    let defaultTtl = 3600;
    let origin = zoneName.replace(/\.$/, '');

    const SUPPORTED = new Set(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']);

    for (const rawLine of content.split('\n')) {
      // Strip inline comments and trim
      const line = rawLine.replace(/;.*$/, '').trim();
      if (!line) continue;

      // $TTL directive
      if (line.toUpperCase().startsWith('$TTL')) {
        const m = line.match(/\$TTL\s+(\d+)/i);
        if (m) defaultTtl = parseInt(m[1], 10);
        continue;
      }

      // $ORIGIN directive
      if (line.toUpperCase().startsWith('$ORIGIN')) {
        const m = line.match(/\$ORIGIN\s+(\S+)/i);
        if (m) origin = m[1].replace(/\.$/, '');
        continue;
      }

      // Tokenise
      const tokens = line.split(/\s+/);
      if (tokens.length < 3) continue;

      let idx = 0;

      // Name field
      let name = tokens[idx++];
      if (name === '@') {
        name = '@';
      } else if (name.endsWith('.')) {
        // Fully-qualified — strip origin suffix
        const fqdn = name.slice(0, -1);
        if (fqdn === origin) {
          name = '@';
        } else if (fqdn.endsWith(`.${origin}`)) {
          name = fqdn.slice(0, -(origin.length + 1));
        } else {
          name = fqdn; // external host
        }
      }

      // Optional TTL
      let ttl = defaultTtl;
      if (/^\d+$/.test(tokens[idx])) {
        ttl = parseInt(tokens[idx++], 10);
      }

      // Optional class (IN / CH / HS)
      if (/^(IN|CH|HS)$/i.test(tokens[idx] ?? '')) {
        idx++;
      }

      // Type
      const type = (tokens[idx++] ?? '').toUpperCase();
      if (!SUPPORTED.has(type)) continue;
      if (idx >= tokens.length) continue;

      try {
        if (type === 'A' || type === 'AAAA') {
          records.push({ type: type as 'A' | 'AAAA', name, content: tokens[idx], ttl, proxied: true });
        } else if (type === 'CNAME') {
          let target = tokens[idx].replace(/\.$/, '');
          if (target === origin) target = '@';
          else if (target.endsWith(`.${origin}`)) target = target.slice(0, -(origin.length + 1));
          records.push({ type: 'CNAME', name, content: target, ttl, proxied: true });
        } else if (type === 'MX') {
          const priority = parseInt(tokens[idx++], 10);
          const host = tokens[idx]?.replace(/\.$/, '') ?? '';
          if (host) records.push({ type: 'MX', name, content: host, ttl, priority });
        } else if (type === 'TXT') {
          // Rejoin and strip surrounding quotes
          const raw = tokens.slice(idx).join(' ').trim();
          const val = raw.replace(/^"(.*)"$/, '$1').replace(/""\s*"/g, '').replace(/"\s*"/g, ' ');
          records.push({ type: 'TXT', name, content: val, ttl });
        } else if (type === 'NS') {
          const host = tokens[idx].replace(/\.$/, '');
          records.push({ type: 'NS', name, content: host, ttl });
        } else {
          // SRV, CAA — pass remaining tokens as-is
          const content = tokens.slice(idx).join(' ').replace(/\.$/, '');
          records.push({ type: type as DnsRecordType, name, content, ttl });
        }
      } catch {
        // Skip malformed records silently
      }
    }

    return records;
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
