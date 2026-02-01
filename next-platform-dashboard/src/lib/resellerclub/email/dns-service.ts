// src/lib/resellerclub/email/dns-service.ts
// Email DNS Service - Generate and manage email DNS records

import { dnsService } from '@/lib/cloudflare';
import { businessEmailApi } from './client';
import type { EmailDnsRecords } from './types';

// ============================================================================
// Default Email DNS Records (for Titan/Business Email)
// ============================================================================

/**
 * Default MX records for Titan Email
 * Used when API doesn't return specific records
 */
export const DEFAULT_MX_RECORDS = [
  { priority: 10, host: 'mx1.titan.email', ttl: 3600 },
  { priority: 20, host: 'mx2.titan.email', ttl: 3600 },
];

/**
 * Default SPF record for Titan Email
 */
export const DEFAULT_SPF_RECORD = {
  host: '@',
  value: 'v=spf1 include:spf.titan.email ~all',
  ttl: 3600,
};

// ============================================================================
// Email DNS Service
// ============================================================================

export const emailDnsService = {
  /**
   * Get required DNS records for an email order
   */
  async getDnsRecords(orderId: string): Promise<EmailDnsRecords> {
    try {
      return await businessEmailApi.getDnsRecords(orderId);
    } catch {
      // Return defaults if API fails
      return {
        mx: DEFAULT_MX_RECORDS,
        spf: DEFAULT_SPF_RECORD,
      };
    }
  },

  /**
   * Apply email DNS records to a Cloudflare zone
   */
  async applyDnsRecords(
    cloudflareZoneId: string,
    records: EmailDnsRecords
  ): Promise<{ success: boolean; created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    // Add MX records
    for (const mx of records.mx) {
      try {
        await dnsService.createRecord({
          zoneId: cloudflareZoneId,
          type: 'MX',
          name: '@',
          content: mx.host,
          priority: mx.priority,
          ttl: mx.ttl,
        });
        created++;
      } catch (error) {
        errors.push(`Failed to create MX record for ${mx.host}: ${(error as Error).message}`);
      }
    }

    // Add SPF record
    try {
      await dnsService.createRecord({
        zoneId: cloudflareZoneId,
        type: 'TXT',
        name: records.spf.host,
        content: records.spf.value,
        ttl: records.spf.ttl,
      });
      created++;
    } catch (error) {
      errors.push(`Failed to create SPF record: ${(error as Error).message}`);
    }

    // Add DKIM record if available
    if (records.dkim) {
      try {
        await dnsService.createRecord({
          zoneId: cloudflareZoneId,
          type: 'TXT',
          name: records.dkim.host,
          content: records.dkim.value,
          ttl: records.dkim.ttl,
        });
        created++;
      } catch (error) {
        errors.push(`Failed to create DKIM record: ${(error as Error).message}`);
      }
    }

    return {
      success: errors.length === 0,
      created,
      errors,
    };
  },

  /**
   * Apply default Titan email DNS records
   */
  async applyDefaultRecords(
    cloudflareZoneId: string
  ): Promise<{ success: boolean; created: number; errors: string[] }> {
    return this.applyDnsRecords(cloudflareZoneId, {
      mx: DEFAULT_MX_RECORDS,
      spf: DEFAULT_SPF_RECORD,
    });
  },

  /**
   * Check if email DNS is properly configured
   */
  async verifyDnsRecords(
    cloudflareZoneId: string
  ): Promise<{
    mxConfigured: boolean;
    spfConfigured: boolean;
    dkimConfigured: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // Get existing records
    const { records } = await dnsService.listRecords(cloudflareZoneId);
    
    // Check MX records
    const mxRecords = records.filter(r => r.type === 'MX');
    const hasTitanMx = mxRecords.some(r => 
      r.content.includes('titan.email') || r.content.includes('titan.email')
    );
    
    if (!hasTitanMx) {
      issues.push('Missing MX records for Titan Email');
    }
    
    // Check SPF record
    const txtRecords = records.filter(r => r.type === 'TXT');
    const hasSpf = txtRecords.some(r => 
      r.content.includes('spf.titan.email')
    );
    
    if (!hasSpf) {
      issues.push('Missing SPF record for Titan Email');
    }
    
    // Check DKIM (optional but recommended)
    const hasDkim = txtRecords.some(r => 
      r.name.includes('dkim') || r.name.includes('titan')
    );
    
    return {
      mxConfigured: hasTitanMx,
      spfConfigured: hasSpf,
      dkimConfigured: hasDkim,
      issues,
    };
  },

  /**
   * Generate DMARC record value
   */
  generateDmarcRecord(
    _domain: string,
    options: {
      policy?: 'none' | 'quarantine' | 'reject';
      reportEmail?: string;
    } = {}
  ): { host: string; value: string; ttl: number } {
    const { policy = 'none', reportEmail } = options;
    
    let value = `v=DMARC1; p=${policy}`;
    if (reportEmail) {
      value += `; rua=mailto:${reportEmail}`;
    }
    
    return {
      host: '_dmarc',
      value,
      ttl: 3600,
    };
  },
};
