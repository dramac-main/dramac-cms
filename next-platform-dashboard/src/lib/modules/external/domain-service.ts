/**
 * Phase EM-31: Domain Service
 * Manages allowed domains for external embedding and API access
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface AllowedDomain {
  id: string;
  site_id: string;
  module_id: string;
  domain: string;
  verified: boolean;
  verification_token: string | null;
  verified_at: string | null;
  allow_embed: boolean;
  allow_api: boolean;
  embed_types: string[];
  rate_limit: number;
  created_at: string;
  updated_at: string;
}

export interface AddDomainInput {
  domain: string;
  allowEmbed?: boolean;
  allowApi?: boolean;
  embedTypes?: string[];
  rateLimit?: number;
}

export interface UpdateDomainInput {
  allowEmbed?: boolean;
  allowApi?: boolean;
  embedTypes?: string[];
  rateLimit?: number;
}

export interface VerificationResult {
  verified: boolean;
  method: 'dns' | 'meta';
  error?: string;
}

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export class DomainService {
  private siteId: string;
  private moduleId: string;
  private supabase: SupabaseClient;

  constructor(siteId: string, moduleId: string, supabaseClient?: SupabaseClient) {
    this.siteId = siteId;
    this.moduleId = moduleId;
    this.supabase = supabaseClient || getServiceClient();
  }

  /**
   * Add an allowed domain
   */
  async addDomain(input: AddDomainInput): Promise<AllowedDomain> {
    // Normalize domain
    const normalizedDomain = this.normalizeDomain(input.domain);
    
    // Validate domain format
    if (!this.isValidDomain(normalizedDomain)) {
      throw new Error('Invalid domain format');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const { data, error } = await this.supabase
      .from('module_allowed_domains')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        domain: normalizedDomain,
        verification_token: verificationToken,
        allow_embed: input.allowEmbed ?? true,
        allow_api: input.allowApi ?? true,
        embed_types: input.embedTypes ?? [],
        rate_limit: input.rateLimit ?? 1000
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Domain already exists for this module');
      }
      throw error;
    }
    
    return data;
  }

  /**
   * Get domain by ID
   */
  async getDomain(domainId: string): Promise<AllowedDomain | null> {
    const { data, error } = await this.supabase
      .from('module_allowed_domains')
      .select('*')
      .eq('id', domainId)
      .eq('module_id', this.moduleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return data;
  }

  /**
   * Get all allowed domains for the module
   */
  async getDomains(): Promise<AllowedDomain[]> {
    const { data, error } = await this.supabase
      .from('module_allowed_domains')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get only verified domains
   */
  async getVerifiedDomains(): Promise<AllowedDomain[]> {
    const { data, error } = await this.supabase
      .from('module_allowed_domains')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('verified', true)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Update domain settings
   */
  async updateDomain(domainId: string, input: UpdateDomainInput): Promise<AllowedDomain> {
    const updateData: Record<string, any> = {};
    
    if (input.allowEmbed !== undefined) updateData.allow_embed = input.allowEmbed;
    if (input.allowApi !== undefined) updateData.allow_api = input.allowApi;
    if (input.embedTypes !== undefined) updateData.embed_types = input.embedTypes;
    if (input.rateLimit !== undefined) updateData.rate_limit = input.rateLimit;

    const { data, error } = await this.supabase
      .from('module_allowed_domains')
      .update(updateData)
      .eq('id', domainId)
      .eq('module_id', this.moduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove a domain
   */
  async removeDomain(domainId: string): Promise<void> {
    const { error } = await this.supabase
      .from('module_allowed_domains')
      .delete()
      .eq('id', domainId)
      .eq('module_id', this.moduleId);

    if (error) throw error;
  }

  /**
   * Verify domain ownership via DNS TXT record or meta tag
   */
  async verifyDomain(domainId: string, method: 'dns' | 'meta'): Promise<VerificationResult> {
    const domain = await this.getDomain(domainId);
    if (!domain) {
      return { verified: false, method, error: 'Domain not found' };
    }

    if (!domain.verification_token) {
      return { verified: false, method, error: 'No verification token' };
    }

    let verified = false;
    let verifyError: string | undefined;

    try {
      if (method === 'dns') {
        verified = await this.verifyDnsTxt(domain.domain, domain.verification_token);
        if (!verified) {
          verifyError = 'DNS TXT record not found or does not match';
        }
      } else if (method === 'meta') {
        verified = await this.verifyMetaTag(domain.domain, domain.verification_token);
        if (!verified) {
          verifyError = 'Meta tag not found or does not match';
        }
      }
    } catch (err: any) {
      verified = false;
      verifyError = err.message;
    }

    if (verified) {
      await this.supabase
        .from('module_allowed_domains')
        .update({
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', domainId);
    }

    return { verified, method, error: verifyError };
  }

  /**
   * Get verification instructions for a domain
   */
  getVerificationInstructions(domain: AllowedDomain): {
    dns: { record: string; value: string };
    meta: { tag: string };
  } {
    const token = domain.verification_token || '';
    
    return {
      dns: {
        record: `_dramac-verify.${domain.domain}`,
        value: `dramac-site-verification=${token}`
      },
      meta: {
        tag: `<meta name="dramac-site-verification" content="${token}">`
      }
    };
  }

  /**
   * Check if an origin is allowed for this module
   */
  async isOriginAllowed(origin: string): Promise<{ 
    allowed: boolean; 
    domain?: AllowedDomain;
    reason?: string;
  }> {
    let hostname: string;
    
    try {
      hostname = new URL(origin).hostname;
    } catch {
      return { allowed: false, reason: 'Invalid origin URL' };
    }

    const { data: domains } = await this.supabase
      .from('module_allowed_domains')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('verified', true);

    if (!domains || domains.length === 0) {
      return { allowed: false, reason: 'No verified domains configured' };
    }

    for (const domain of domains) {
      if (this.matchesDomain(hostname, domain.domain)) {
        return { allowed: true, domain };
      }
    }

    return { allowed: false, reason: 'Origin not in allowlist' };
  }

  /**
   * Check if an origin is allowed for embedding
   */
  async isEmbedAllowed(origin: string, embedType?: string): Promise<{
    allowed: boolean;
    domain?: AllowedDomain;
    reason?: string;
  }> {
    const { allowed, domain, reason } = await this.isOriginAllowed(origin);
    
    if (!allowed) {
      return { allowed, reason };
    }

    if (!domain!.allow_embed) {
      return { allowed: false, reason: 'Embedding not allowed for this domain' };
    }

    // Check embed type restriction
    if (embedType && domain!.embed_types.length > 0 && !domain!.embed_types.includes(embedType)) {
      return { allowed: false, reason: `Embed type '${embedType}' not allowed for this domain` };
    }

    return { allowed: true, domain };
  }

  /**
   * Check if an origin is allowed for API access
   */
  async isApiAllowed(origin: string): Promise<{
    allowed: boolean;
    domain?: AllowedDomain;
    reason?: string;
  }> {
    const { allowed, domain, reason } = await this.isOriginAllowed(origin);
    
    if (!allowed) {
      return { allowed, reason };
    }

    if (!domain!.allow_api) {
      return { allowed: false, reason: 'API access not allowed for this domain' };
    }

    return { allowed: true, domain };
  }

  /**
   * Verify DNS TXT record
   */
  private async verifyDnsTxt(domain: string, token: string): Promise<boolean> {
    try {
      const dns = await import('dns/promises');
      const recordName = `_dramac-verify.${domain}`;
      const records = await dns.resolveTxt(recordName);
      
      return records.some(record => 
        record.some(txt => txt === `dramac-site-verification=${token}`)
      );
    } catch (err: any) {
      // ENOTFOUND means the DNS record doesn't exist
      if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
        return false;
      }
      throw err;
    }
  }

  /**
   * Verify meta tag on website
   */
  private async verifyMetaTag(domain: string, token: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://${domain}`, {
        headers: { 
          'User-Agent': 'DramacBot/1.0 (+https://dramac.io/bot)',
          'Accept': 'text/html'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const html = await response.text();
      
      // Look for the meta tag in the HTML
      const metaPatterns = [
        /<meta\s+name=["']dramac-site-verification["']\s+content=["']([^"']+)["']/i,
        /<meta\s+content=["']([^"']+)["']\s+name=["']dramac-site-verification["']/i
      ];

      for (const pattern of metaPatterns) {
        const match = html.match(pattern);
        if (match && match[1] === token) {
          return true;
        }
      }

      return false;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout while verifying domain');
      }
      throw err;
    }
  }

  /**
   * Match hostname against domain pattern (supports wildcards)
   */
  private matchesDomain(hostname: string, pattern: string): boolean {
    // Normalize both to lowercase
    hostname = hostname.toLowerCase();
    pattern = pattern.toLowerCase();

    // Handle wildcard patterns
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      // Match both the suffix itself and any subdomain
      return hostname === suffix || hostname.endsWith('.' + suffix);
    }
    
    // Exact match
    return hostname === pattern;
  }

  /**
   * Normalize domain string
   */
  private normalizeDomain(domain: string): string {
    return domain
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?/, '') // Remove protocol
      .replace(/\/.*$/, '')            // Remove path
      .replace(/:\d+$/, '');           // Remove port
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    // Allow wildcard domains
    const domainToCheck = domain.startsWith('*.') ? domain.slice(2) : domain;
    
    // Basic domain validation
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
    
    if (!domainRegex.test(domainToCheck)) {
      return false;
    }

    // Check for minimum TLD length
    const parts = domainToCheck.split('.');
    if (parts.length < 2) {
      return false;
    }

    const tld = parts[parts.length - 1];
    if (tld.length < 2) {
      return false;
    }

    return true;
  }
}

/**
 * Standalone function to check origin without instantiating the service
 */
export async function checkOriginAllowed(
  moduleId: string,
  origin: string
): Promise<{ allowed: boolean; domain?: AllowedDomain; rateLimit?: number }> {
  const supabase = getServiceClient();
  
  let hostname: string;
  try {
    hostname = new URL(origin).hostname.toLowerCase();
  } catch {
    return { allowed: false };
  }

  const { data: domains } = await supabase
    .from('module_allowed_domains')
    .select('*')
    .eq('module_id', moduleId)
    .eq('verified', true);

  if (!domains || domains.length === 0) {
    return { allowed: false };
  }

  for (const domain of domains) {
    const pattern = domain.domain.toLowerCase();
    
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      if (hostname === suffix || hostname.endsWith('.' + suffix)) {
        return { allowed: true, domain, rateLimit: domain.rate_limit };
      }
    } else if (hostname === pattern) {
      return { allowed: true, domain, rateLimit: domain.rate_limit };
    }
  }

  return { allowed: false };
}
