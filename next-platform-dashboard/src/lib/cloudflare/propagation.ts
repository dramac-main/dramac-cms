// src/lib/cloudflare/propagation.ts
// DNS Propagation Checking Service

import type { 
  DnsRecordType, 
  PropagationStatus, 
  PropagationRecord, 
  PropagationServer,
  ExpectedDnsRecord,
  NameserverPropagationStatus,
} from './types';

/**
 * Public DNS servers to check propagation against
 * Each server has its own DoH endpoint for accurate per-resolver results
 */
const DNS_SERVERS = [
  { name: 'Google', ip: '8.8.8.8', location: 'US', dohEndpoint: 'https://dns.google/resolve' },
  { name: 'Cloudflare', ip: '1.1.1.1', location: 'Global', dohEndpoint: 'https://cloudflare-dns.com/dns-query' },
  { name: 'OpenDNS', ip: '208.67.222.222', location: 'US', dohEndpoint: 'https://doh.opendns.com/dns-query' },
  { name: 'Quad9', ip: '9.9.9.9', location: 'Global', dohEndpoint: 'https://dns.quad9.net/dns-query' },
] as const;

/**
 * DNS-over-HTTPS endpoint for browser-compatible lookups
 * Using Cloudflare's DoH service
 */
const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';

/**
 * DNS Propagation Checking Service
 * 
 * Provides methods to check if DNS changes have propagated globally.
 * Uses DNS-over-HTTPS for browser compatibility.
 * 
 * @example
 * ```typescript
 * import { propagationService } from '@/lib/cloudflare';
 * 
 * // Check propagation
 * const status = await propagationService.checkPropagation(
 *   'example.com',
 *   [{ type: 'A', name: '@', content: '192.168.1.1' }]
 * );
 * 
 * console.log(status.allPropagated); // true/false
 * ```
 */
export class PropagationService {
  /**
   * Check propagation status for a domain's DNS records
   * 
   * @param domain - Domain name to check
   * @param expectedRecords - Expected DNS records to verify
   * @returns Propagation status with detailed per-server results
   */
  async checkPropagation(
    domain: string,
    expectedRecords: ExpectedDnsRecord[]
  ): Promise<PropagationStatus> {
    const records: PropagationRecord[] = [];
    
    for (const expected of expectedRecords) {
      const fullName = expected.name === '@' 
        ? domain 
        : `${expected.name}.${domain}`;
      
      const servers: PropagationServer[] = [];
      let anyPropagated = false;
      
      for (const server of DNS_SERVERS) {
        try {
          const resolved = await this.resolveRecord(
            fullName,
            expected.type,
            server.dohEndpoint
          );
          
          const propagated = this.matchesExpected(resolved, expected.content);
          if (propagated) anyPropagated = true;
          
          servers.push({
            location: server.location,
            server: server.name,
            resolved,
            propagated,
          });
        } catch {
          servers.push({
            location: server.location,
            server: server.name,
            resolved: null,
            propagated: false,
          });
        }
      }
      
      const actual = servers.find(s => s.resolved)?.resolved || null;
      
      records.push({
        type: expected.type,
        name: expected.name,
        expected: expected.content,
        actual,
        propagated: anyPropagated,
        servers,
      });
    }
    
    return {
      domain,
      records,
      allPropagated: records.every(r => r.propagated),
      lastChecked: new Date().toISOString(),
    };
  }
  
  /**
   * Check if nameservers are pointing to expected values
   */
  async checkNameserverPropagation(
    domain: string,
    expectedNameservers: string[]
  ): Promise<NameserverPropagationStatus> {
    try {
      const current = await this.resolveNameservers(domain);
      const normalizedCurrent = current.map(ns => ns.toLowerCase().replace(/\.$/, ''));
      const normalizedExpected = expectedNameservers.map(ns => ns.toLowerCase().replace(/\.$/, ''));
      
      // Check if at least some expected nameservers are present
      const propagated = normalizedExpected.some(ns => 
        normalizedCurrent.some(c => c.includes(ns) || ns.includes(c))
      );
      
      return {
        propagated,
        current: normalizedCurrent,
        expected: normalizedExpected,
      };
    } catch {
      return {
        propagated: false,
        current: [],
        expected: expectedNameservers,
      };
    }
  }
  
  /**
   * Wait for DNS propagation with polling
   * 
   * @param domain - Domain to check
   * @param expectedRecords - Records to wait for
   * @param options - Polling options
   * @returns Final propagation status
   */
  async waitForPropagation(
    domain: string,
    expectedRecords: ExpectedDnsRecord[],
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (attempt: number, status: PropagationStatus) => void;
    } = {}
  ): Promise<PropagationStatus> {
    const { maxAttempts = 30, intervalMs = 10000, onProgress } = options;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.checkPropagation(domain, expectedRecords);
      
      onProgress?.(attempt, status);
      
      if (status.allPropagated) {
        return status;
      }
      
      if (attempt < maxAttempts) {
        await this.delay(intervalMs);
      }
    }
    
    // Return final status even if not fully propagated
    return this.checkPropagation(domain, expectedRecords);
  }
  
  /**
   * Quick check if a single record has propagated
   */
  async isRecordPropagated(
    domain: string,
    type: DnsRecordType,
    name: string,
    content: string
  ): Promise<boolean> {
    const status = await this.checkPropagation(domain, [
      { type, name, content }
    ]);
    return status.allPropagated;
  }
  
  /**
   * Get current DNS records for a domain
   * 
   * @param domain - Domain to query
   * @param type - Record type to fetch
   * @returns Array of resolved values
   */
  async getCurrentRecords(
    domain: string,
    type: DnsRecordType
  ): Promise<string[]> {
    try {
      const response = await this.dohQuery(domain, type);
      return response;
    } catch {
      return [];
    }
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  /**
   * Resolve a DNS record using DNS-over-HTTPS
   */
  private async resolveRecord(
    hostname: string,
    type: DnsRecordType,
    dohEndpoint?: string
  ): Promise<string | null> {
    try {
      const results = await this.dohQuery(hostname, type, dohEndpoint);
      return results[0] || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Resolve nameservers for a domain
   */
  private async resolveNameservers(domain: string): Promise<string[]> {
    return this.dohQuery(domain, 'NS');
  }
  
  /**
   * DNS-over-HTTPS query — accepts an optional resolver endpoint
   */
  private async dohQuery(
    name: string,
    type: DnsRecordType | 'NS',
    dohEndpoint?: string
  ): Promise<string[]> {
    const endpoint = dohEndpoint || DOH_ENDPOINT;
    const url = new URL(endpoint);
    url.searchParams.set('name', name);
    url.searchParams.set('type', type);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/dns-json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`DoH query failed: ${response.status}`);
    }
    
    const data = await response.json() as DoHResponse;
    
    if (!data.Answer || data.Answer.length === 0) {
      return [];
    }
    
    // Extract values based on record type
    return data.Answer
      .filter(a => this.mapDoHType(a.type) === type)
      .map(a => {
        // MX records have priority prefix
        if (type === 'MX') {
          const parts = a.data.split(' ');
          return parts.length > 1 ? parts.slice(1).join(' ') : a.data;
        }
        // TXT records may have quotes
        if (type === 'TXT') {
          return a.data.replace(/^"|"$/g, '');
        }
        return a.data;
      });
  }
  
  /**
   * Map DoH numeric type to record type string
   */
  private mapDoHType(numericType: number): DnsRecordType | 'NS' | 'unknown' {
    const typeMap: Record<number, DnsRecordType | 'NS'> = {
      1: 'A',
      2: 'NS',
      5: 'CNAME',
      15: 'MX',
      16: 'TXT',
      28: 'AAAA',
      33: 'SRV',
      257: 'CAA',
    };
    return typeMap[numericType] || 'unknown';
  }
  
  /**
   * Check if resolved value matches expected
   */
  private matchesExpected(actual: string | null, expected: string): boolean {
    if (!actual) return false;
    
    const normalizedActual = actual.toLowerCase().replace(/\.$/, '').trim();
    const normalizedExpected = expected.toLowerCase().replace(/\.$/, '').trim();
    
    // Exact match
    if (normalizedActual === normalizedExpected) return true;
    
    // Partial match (for cases like "example.com" matching "example.com.")
    if (normalizedActual.includes(normalizedExpected)) return true;
    if (normalizedExpected.includes(normalizedActual)) return true;
    
    return false;
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * DNS-over-HTTPS response format
 */
interface DoHResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{
    name: string;
    type: number;
  }>;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
}

// Export singleton instance
export const propagationService = new PropagationService();
