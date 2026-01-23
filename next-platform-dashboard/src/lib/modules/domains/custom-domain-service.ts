/**
 * Phase EM-32: Custom Domain Service
 * Manages custom domain mapping, verification, SSL, and white-label settings
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes, createCipheriv, createDecipheriv, randomUUID } from 'crypto';

// ================================================================
// Types
// ================================================================

export interface CustomDomain {
  id: string;
  site_module_installation_id: string;
  domain: string;
  subdomain: string | null;
  status: DomainStatus;
  verification_method: VerificationMethod | null;
  verification_token: string | null;
  verification_value: string | null;
  verified_at: string | null;
  ssl_status: SSLStatus;
  ssl_provider: string;
  ssl_certificate: string | null;
  ssl_private_key_encrypted: string | null;
  ssl_expires_at: string | null;
  ssl_auto_renew: boolean;
  config: DomainConfig;
  white_label: WhiteLabelConfig;
  total_requests: number;
  bandwidth_bytes: number;
  created_at: string;
  updated_at: string;
}

export type DomainStatus = 
  | 'pending' 
  | 'verifying' 
  | 'verified' 
  | 'provisioning' 
  | 'active' 
  | 'failed' 
  | 'expired' 
  | 'disabled';

export type SSLStatus = 
  | 'none' 
  | 'pending' 
  | 'provisioning' 
  | 'active' 
  | 'expired' 
  | 'failed';

export type VerificationMethod = 'cname' | 'txt' | 'file' | 'meta';

export interface DomainConfig {
  redirect_to_https?: boolean;
  force_www?: boolean;
  custom_headers?: Record<string, string>;
  cache_ttl?: number;
  enable_cdn?: boolean;
}

export interface WhiteLabelConfig {
  logo_url?: string;
  favicon_url?: string;
  brand_name?: string;
  brand_colors?: {
    primary?: string;
    secondary?: string;
  };
  hide_powered_by?: boolean;
  custom_css?: string;
}

export interface DNSRecord {
  id: string;
  domain_id: string;
  record_type: string;
  host: string;
  value: string;
  is_verified: boolean;
  last_checked_at: string | null;
  created_at: string;
}

export interface SSLCertificate {
  id: string;
  domain_id: string;
  serial_number: string | null;
  issuer: string | null;
  subject: string | null;
  san: string[];
  issued_at: string | null;
  expires_at: string | null;
  status: 'active' | 'expired' | 'revoked';
  revoked_at: string | null;
  created_at: string;
}

export interface AddDomainInput {
  domain: string;
  verificationMethod?: VerificationMethod;
}

export interface ACMECertificate {
  cert: string;
  encryptedKey: string;
  expiresAt: string;
  serialNumber: string;
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
// Encryption Utilities
// ================================================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.SSL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('SSL_ENCRYPTION_KEY environment variable not set');
  }
  return Buffer.from(key, 'hex');
}

export function encryptPrivateKey(privateKey: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv (24 hex) + encrypted + authTag (32 hex)
  return iv.toString('hex') + encrypted + authTag.toString('hex');
}

export function decryptPrivateKey(encryptedData: string): string {
  const key = getEncryptionKey();
  
  const iv = Buffer.from(encryptedData.slice(0, 24), 'hex');
  const authTag = Buffer.from(encryptedData.slice(-32), 'hex');
  const encrypted = Buffer.from(encryptedData.slice(24, -32), 'hex');
  
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

// ================================================================
// Custom Domain Service
// ================================================================

export class CustomDomainService {
  private siteModuleInstallationId: string;
  private supabase: SupabaseClient;

  constructor(siteModuleInstallationId: string, supabaseClient?: SupabaseClient) {
    this.siteModuleInstallationId = siteModuleInstallationId;
    this.supabase = supabaseClient || getServiceClient();
  }

  // ----------------------------------------------------------------
  // Domain Management
  // ----------------------------------------------------------------

  /**
   * Add a custom domain
   */
  async addDomain(input: AddDomainInput): Promise<CustomDomain> {
    const domain = this.normalizeDomain(input.domain);
    const verificationMethod = input.verificationMethod || 'cname';

    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new Error('Invalid domain format. Domain must be a valid hostname.');
    }

    // Check if domain already exists
    const { data: existing } = await this.supabase
      .from('module_custom_domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existing) {
      throw new Error('Domain is already registered');
    }

    // Generate verification token
    const verificationToken = randomBytes(16).toString('hex');
    const verificationValue = this.generateVerificationValue(
      domain, 
      verificationMethod, 
      verificationToken
    );

    // Create domain record
    const { data, error } = await this.supabase
      .from('module_custom_domains')
      .insert({
        site_module_installation_id: this.siteModuleInstallationId,
        domain,
        status: 'pending',
        verification_method: verificationMethod,
        verification_token: verificationToken,
        verification_value: verificationValue,
        config: {
          redirect_to_https: true,
          enable_cdn: true,
          cache_ttl: 3600
        },
        white_label: {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add domain: ${error.message}`);
    }

    // Create required DNS records for setup
    await this.createDNSRecords(data.id, domain, verificationMethod, verificationValue);

    return data as CustomDomain;
  }

  /**
   * Get all domains for this site module
   */
  async getDomains(): Promise<CustomDomain[]> {
    const { data, error } = await this.supabase
      .from('module_custom_domains')
      .select('*')
      .eq('site_module_installation_id', this.siteModuleInstallationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get domains: ${error.message}`);
    }

    return (data || []) as CustomDomain[];
  }

  /**
   * Get a single domain by ID
   */
  async getDomain(domainId: string): Promise<CustomDomain | null> {
    const { data, error } = await this.supabase
      .from('module_custom_domains')
      .select('*')
      .eq('id', domainId)
      .eq('site_module_installation_id', this.siteModuleInstallationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get domain: ${error.message}`);
    }

    return data as CustomDomain;
  }

  /**
   * Delete a domain
   */
  async deleteDomain(domainId: string): Promise<void> {
    // Revoke SSL certificate first
    await this.revokeSSL(domainId);

    const { error } = await this.supabase
      .from('module_custom_domains')
      .delete()
      .eq('id', domainId)
      .eq('site_module_installation_id', this.siteModuleInstallationId);

    if (error) {
      throw new Error(`Failed to delete domain: ${error.message}`);
    }
  }

  // ----------------------------------------------------------------
  // Domain Verification
  // ----------------------------------------------------------------

  /**
   * Verify domain ownership
   */
  async verifyDomain(domainId: string): Promise<boolean> {
    const domain = await this.getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    // Update status to verifying
    await this.supabase
      .from('module_custom_domains')
      .update({ status: 'verifying' })
      .eq('id', domainId);

    let verified = false;

    try {
      switch (domain.verification_method) {
        case 'cname':
          verified = await this.verifyCNAME(domain.domain);
          break;
        case 'txt':
          verified = await this.verifyTXT(domain.domain, domain.verification_value!);
          break;
        case 'meta':
          verified = await this.verifyMeta(domain.domain, domain.verification_value!);
          break;
        default:
          throw new Error('Unknown verification method');
      }
    } catch (err) {
      console.error('Domain verification failed:', err);
      verified = false;
    }

    if (verified) {
      await this.supabase
        .from('module_custom_domains')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', domainId);

      // Update DNS record status
      await this.supabase
        .from('domain_dns_records')
        .update({ 
          is_verified: true,
          last_checked_at: new Date().toISOString()
        })
        .eq('domain_id', domainId);

      // Start SSL provisioning automatically
      this.provisionSSL(domainId).catch(err => {
        console.error('SSL provisioning failed:', err);
      });
    } else {
      await this.supabase
        .from('module_custom_domains')
        .update({ status: 'pending' })
        .eq('id', domainId);

      // Update DNS record check time
      await this.supabase
        .from('domain_dns_records')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('domain_id', domainId);
    }

    return verified;
  }

  /**
   * Get DNS records for setup instructions
   */
  async getDNSRecords(domainId: string): Promise<DNSRecord[]> {
    const { data, error } = await this.supabase
      .from('domain_dns_records')
      .select('*')
      .eq('domain_id', domainId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get DNS records: ${error.message}`);
    }

    return (data || []) as DNSRecord[];
  }

  // ----------------------------------------------------------------
  // SSL Certificate Management
  // ----------------------------------------------------------------

  /**
   * Provision SSL certificate for domain
   */
  async provisionSSL(domainId: string): Promise<void> {
    const domain = await this.getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    if (domain.status !== 'verified') {
      throw new Error('Domain must be verified before provisioning SSL');
    }

    await this.supabase
      .from('module_custom_domains')
      .update({
        status: 'provisioning',
        ssl_status: 'provisioning'
      })
      .eq('id', domainId);

    try {
      // In production, this would call Let's Encrypt ACME or a managed service
      const certificate = await this.requestACMECertificate(domain.domain);

      // Store certificate
      await this.supabase
        .from('module_custom_domains')
        .update({
          status: 'active',
          ssl_status: 'active',
          ssl_certificate: certificate.cert,
          ssl_private_key_encrypted: certificate.encryptedKey,
          ssl_expires_at: certificate.expiresAt
        })
        .eq('id', domainId);

      // Save certificate history
      await this.supabase.from('domain_ssl_certificates').insert({
        domain_id: domainId,
        serial_number: certificate.serialNumber,
        issuer: "Let's Encrypt",
        subject: domain.domain,
        san: [domain.domain],
        issued_at: new Date().toISOString(),
        expires_at: certificate.expiresAt,
        status: 'active'
      });

    } catch (error: unknown) {
      await this.supabase
        .from('module_custom_domains')
        .update({
          status: 'failed',
          ssl_status: 'failed'
        })
        .eq('id', domainId);

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`SSL provisioning failed: ${message}`);
    }
  }

  /**
   * Get SSL certificate history
   */
  async getSSLCertificates(domainId: string): Promise<SSLCertificate[]> {
    const { data, error } = await this.supabase
      .from('domain_ssl_certificates')
      .select('*')
      .eq('domain_id', domainId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get SSL certificates: ${error.message}`);
    }

    return (data || []) as SSLCertificate[];
  }

  /**
   * Revoke SSL certificate
   */
  private async revokeSSL(domainId: string): Promise<void> {
    await this.supabase
      .from('domain_ssl_certificates')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq('domain_id', domainId)
      .eq('status', 'active');
  }

  /**
   * Check and renew certificates nearing expiry (static method for cron jobs)
   */
  static async checkAndRenewCertificates(daysBeforeExpiry: number = 30): Promise<void> {
    const supabase = getServiceClient();

    const { data: domains } = await supabase
      .rpc('get_domains_for_ssl_renewal', { p_days_before_expiry: daysBeforeExpiry });

    for (const domain of domains || []) {
      try {
        const service = new CustomDomainService(domain.site_module_installation_id);
        await service.provisionSSL(domain.id);
        console.log(`Renewed SSL certificate for ${domain.domain}`);
      } catch (error) {
        console.error(`Failed to renew SSL for ${domain.domain}:`, error);
      }
    }
  }

  // ----------------------------------------------------------------
  // Configuration
  // ----------------------------------------------------------------

  /**
   * Update domain configuration
   */
  async updateConfig(domainId: string, config: Partial<DomainConfig>): Promise<void> {
    const domain = await this.getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const newConfig = { ...domain.config, ...config };

    const { error } = await this.supabase
      .from('module_custom_domains')
      .update({ config: newConfig })
      .eq('id', domainId)
      .eq('site_module_installation_id', this.siteModuleInstallationId)

    if (error) {
      throw new Error(`Failed to update config: ${error.message}`);
    }
  }

  /**
   * Update white-label settings
   */
  async updateWhiteLabel(domainId: string, whiteLabel: Partial<WhiteLabelConfig>): Promise<void> {
    const domain = await this.getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const newWhiteLabel = { ...domain.white_label, ...whiteLabel };

    const { error } = await this.supabase
      .from('module_custom_domains')
      .update({ white_label: newWhiteLabel })
      .eq('id', domainId)
      .eq('site_module_installation_id', this.siteModuleInstallationId)

    if (error) {
      throw new Error(`Failed to update white-label settings: ${error.message}`);
    }
  }

  /**
   * Enable or disable a domain
   */
  async setEnabled(domainId: string, enabled: boolean): Promise<void> {
    const domain = await this.getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const newStatus = enabled ? 
      (domain.ssl_status === 'active' ? 'active' : 'verified') : 
      'disabled';

    const { error } = await this.supabase
      .from('module_custom_domains')
      .update({ status: newStatus })
      .eq('id', domainId)
      .eq('site_module_installation_id', this.siteModuleInstallationId);

    if (error) {
      throw new Error(`Failed to update domain status: ${error.message}`);
    }
  }

  // ----------------------------------------------------------------
  // Static Methods for Domain Lookup
  // ----------------------------------------------------------------

  /**
   * Get domain by hostname (for routing)
   */
  static async getByHostname(hostname: string): Promise<CustomDomain | null> {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('module_custom_domains')
      .select('*')
      .eq('domain', hostname)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get domain: ${error.message}`);
    }

    return data as CustomDomain;
  }

  // ----------------------------------------------------------------
  // Private Helper Methods
  // ----------------------------------------------------------------

  private normalizeDomain(domain: string): string {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');
  }

  private isValidDomain(domain: string): boolean {
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)+$/;
    return pattern.test(domain) && domain.length <= 253;
  }

  private generateVerificationValue(
    domain: string,
    method: VerificationMethod,
    token: string
  ): string {
    if (method === 'cname') {
      return 'modules.dramac.app';
    }
    return `dramac-verify=${token}`;
  }

  private async createDNSRecords(
    domainId: string,
    domain: string,
    method: VerificationMethod,
    verificationValue: string
  ): Promise<void> {
    const records: Array<{
      domain_id: string;
      record_type: string;
      host: string;
      value: string;
    }> = [];

    // Main CNAME record (always required)
    records.push({
      domain_id: domainId,
      record_type: 'CNAME',
      host: '@',
      value: 'modules.dramac.app'
    });

    // Verification record based on method
    if (method === 'txt') {
      records.push({
        domain_id: domainId,
        record_type: 'TXT',
        host: '_dramac-verify',
        value: verificationValue
      });
    }

    await this.supabase.from('domain_dns_records').insert(records);
  }

  private async verifyCNAME(domain: string): Promise<boolean> {
    try {
      // Dynamic import for dns module (Node.js only)
      const dns = await import('dns');
      const { promisify } = await import('util');
      const resolveCname = promisify(dns.resolveCname);
      
      const records = await resolveCname(domain);
      return records.some(r => r.includes('dramac'));
    } catch (error) {
      console.error('CNAME verification error:', error);
      return false;
    }
  }

  private async verifyTXT(domain: string, expectedValue: string): Promise<boolean> {
    try {
      const dns = await import('dns');
      const { promisify } = await import('util');
      const resolveTxt = promisify(dns.resolveTxt);
      
      const records = await resolveTxt(`_dramac-verify.${domain}`);
      const flatRecords = records.flat();
      return flatRecords.some(r => r === expectedValue);
    } catch (error) {
      console.error('TXT verification error:', error);
      return false;
    }
  }

  private async verifyMeta(domain: string, expectedValue: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}`);
      const html = await response.text();
      
      // Look for meta tag: <meta name="dramac-verify" content="...">
      const metaPattern = /<meta[^>]*name=["']dramac-verify["'][^>]*content=["']([^"']+)["']/i;
      const match = html.match(metaPattern);
      
      return match !== null && match[1] === expectedValue;
    } catch (error) {
      console.error('Meta verification error:', error);
      return false;
    }
  }

  private async requestACMECertificate(domain: string): Promise<ACMECertificate> {
    // In production, implement actual ACME client
    // Options:
    // 1. Use Vercel's automatic SSL (if hosting there)
    // 2. Use Cloudflare's API for SSL
    // 3. Use AWS Certificate Manager
    // 4. Implement ACME client directly (acme-client npm package)
    
    // For now, we'll use a placeholder that simulates the process
    // This should be replaced with actual implementation based on hosting provider
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use the actual SSL provider
      const sslProvider = process.env.SSL_PROVIDER || 'vercel';
      
      switch (sslProvider) {
        case 'vercel':
          // Vercel handles SSL automatically for custom domains
          return this.requestVercelSSL(domain);
        case 'cloudflare':
          return this.requestCloudflareSSL(domain);
        default:
          throw new Error(`Unsupported SSL provider: ${sslProvider}`);
      }
    }

    // Development/testing: return mock certificate
    console.log(`[DEV] Would provision SSL for: ${domain}`);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    return {
      cert: '-----BEGIN CERTIFICATE-----\nMOCK_CERTIFICATE\n-----END CERTIFICATE-----',
      encryptedKey: 'mock_encrypted_key',
      expiresAt: expiresAt.toISOString(),
      serialNumber: randomUUID()
    };
  }

  private async requestVercelSSL(domain: string): Promise<ACMECertificate> {
    // Vercel automatically provisions SSL for verified custom domains
    // The certificate is managed by Vercel, so we just mark it as active
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    return {
      cert: 'vercel_managed',
      encryptedKey: 'vercel_managed',
      expiresAt: expiresAt.toISOString(),
      serialNumber: `vercel_${randomUUID()}`
    };
  }

  private async requestCloudflareSSL(domain: string): Promise<ACMECertificate> {
    // Would integrate with Cloudflare SSL API
    throw new Error('Cloudflare SSL integration not implemented');
  }
}

export default CustomDomainService;
