# Phase EM-32: Custom Domain Support

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 10-12 hours
> **Prerequisites**: EM-30, EM-31
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Enable modules to run on **custom domains** as standalone applications:
1. Custom domain mapping and verification
2. SSL certificate provisioning
3. Standalone module hosting
4. White-label branding
5. CDN and caching

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CUSTOM DOMAIN SYSTEM                              │
├────────────────┬─────────────────┬──────────────────────────────────┤
│   DOMAINS      │   SSL/TLS       │      ROUTING                     │
├────────────────┼─────────────────┼──────────────────────────────────┤
│ Domain Map     │ Cert Provision  │ DNS Resolution                   │
│ Verification   │ Auto-Renewal    │ Edge Routing                     │
│ DNS Config     │ Let's Encrypt   │ White-label                      │
│ Subdomain      │ Wildcard        │ CDN Cache                        │
└────────────────┴─────────────────┴──────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (30 mins)

```sql
-- migrations/em-32-custom-domains-schema.sql

-- Custom Domains
CREATE TABLE module_custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_module_id UUID NOT NULL REFERENCES site_modules(id) ON DELETE CASCADE,
  
  -- Domain info
  domain TEXT NOT NULL UNIQUE,           -- "app.clientbusiness.com"
  subdomain TEXT,                        -- if using *.dramac.app
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'verifying', 'verified', 'provisioning', 'active', 
    'failed', 'expired', 'disabled'
  )),
  
  -- Verification
  verification_method TEXT CHECK (verification_method IN (
    'cname', 'txt', 'file', 'meta'
  )),
  verification_token TEXT,
  verification_value TEXT,              -- Expected value
  verified_at TIMESTAMPTZ,
  
  -- SSL
  ssl_status TEXT DEFAULT 'none' CHECK (ssl_status IN (
    'none', 'pending', 'provisioning', 'active', 'expired', 'failed'
  )),
  ssl_provider TEXT DEFAULT 'letsencrypt',
  ssl_certificate TEXT,                 -- PEM certificate
  ssl_private_key_encrypted TEXT,       -- Encrypted private key
  ssl_expires_at TIMESTAMPTZ,
  ssl_auto_renew BOOLEAN DEFAULT true,
  
  -- Configuration
  config JSONB DEFAULT '{}',
  /*
  {
    "redirect_to_https": true,
    "force_www": false,
    "custom_headers": {},
    "cache_ttl": 3600,
    "enable_cdn": true
  }
  */
  
  -- White-label
  white_label JSONB DEFAULT '{}',
  /*
  {
    "logo_url": "...",
    "favicon_url": "...",
    "brand_name": "Client App",
    "brand_colors": { "primary": "#...", "secondary": "#..." },
    "hide_powered_by": true,
    "custom_css": "..."
  }
  */
  
  -- Analytics
  total_requests BIGINT DEFAULT 0,
  bandwidth_bytes BIGINT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_domain CHECK (
    domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]*[.][a-zA-Z0-9.-]+$'
  )
);

-- DNS Records for Verification
CREATE TABLE domain_dns_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES module_custom_domains(id) ON DELETE CASCADE,
  
  record_type TEXT NOT NULL,             -- 'A', 'CNAME', 'TXT'
  host TEXT NOT NULL,                    -- '@', 'www', '_dramac-verify'
  value TEXT NOT NULL,                   -- IP or target
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSL Certificate History
CREATE TABLE domain_ssl_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES module_custom_domains(id) ON DELETE CASCADE,
  
  -- Certificate info
  serial_number TEXT,
  issuer TEXT,
  subject TEXT,
  san TEXT[],                            -- Subject Alternative Names
  
  -- Dates
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active',
  revoked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domain Request Logs
CREATE TABLE domain_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL,
  
  -- Request info
  path TEXT,
  method TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  bytes_sent INTEGER,
  
  -- Client info
  ip_address INET,
  user_agent TEXT,
  country_code TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance
-- CREATE TABLE domain_request_logs_YYYY_MM PARTITION OF domain_request_logs ...

-- Indexes
CREATE INDEX idx_custom_domains_site_module ON module_custom_domains(site_module_id);
CREATE INDEX idx_custom_domains_domain ON module_custom_domains(domain);
CREATE INDEX idx_custom_domains_status ON module_custom_domains(status);
CREATE INDEX idx_domain_dns_records ON domain_dns_records(domain_id);
CREATE INDEX idx_domain_ssl_certs ON domain_ssl_certificates(domain_id);
CREATE INDEX idx_request_logs_domain_time ON domain_request_logs(domain_id, created_at DESC);

-- Function to get module by domain
CREATE OR REPLACE FUNCTION get_module_by_domain(p_domain TEXT)
RETURNS TABLE (
  site_module_id UUID,
  module_id UUID,
  site_id UUID,
  config JSONB,
  white_label JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mcd.site_module_id,
    sm.module_id,
    sm.site_id,
    mcd.config,
    mcd.white_label
  FROM module_custom_domains mcd
  JOIN site_modules sm ON mcd.site_module_id = sm.id
  WHERE mcd.domain = p_domain
    AND mcd.status = 'active'
    AND mcd.ssl_status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;
```

---

### Task 2: Domain Service (2 hours)

```typescript
// src/lib/modules/domains/domain-service.ts

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import dns from 'dns/promises';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CustomDomain {
  id: string;
  site_module_id: string;
  domain: string;
  subdomain: string | null;
  status: string;
  verification_method: string | null;
  verification_token: string | null;
  verified_at: string | null;
  ssl_status: string;
  ssl_expires_at: string | null;
  config: Record<string, any>;
  white_label: Record<string, any>;
  created_at: string;
}

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

export class DomainService {
  private siteModuleId: string;

  constructor(siteModuleId: string) {
    this.siteModuleId = siteModuleId;
  }

  /**
   * Add a custom domain
   */
  async addDomain(
    domain: string,
    verificationMethod: 'cname' | 'txt' = 'cname'
  ): Promise<CustomDomain> {
    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new Error('Invalid domain format');
    }

    // Check if domain already exists
    const { data: existing } = await supabase
      .from('module_custom_domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existing) {
      throw new Error('Domain already registered');
    }

    // Generate verification token
    const verificationToken = randomBytes(16).toString('hex');
    const verificationValue = this.getVerificationValue(domain, verificationMethod, verificationToken);

    // Create domain record
    const { data, error } = await supabase
      .from('module_custom_domains')
      .insert({
        site_module_id: this.siteModuleId,
        domain,
        status: 'pending',
        verification_method: verificationMethod,
        verification_token: verificationToken,
        verification_value: verificationValue
      })
      .select()
      .single();

    if (error) throw error;

    // Create required DNS records
    await this.createDNSRecords(data.id, domain, verificationMethod, verificationValue);

    return data;
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(domainId: string): Promise<boolean> {
    const { data: domain } = await supabase
      .from('module_custom_domains')
      .select('*')
      .eq('id', domainId)
      .single();

    if (!domain) {
      throw new Error('Domain not found');
    }

    await supabase
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
          verified = await this.verifyTXT(domain.domain, domain.verification_value);
          break;
        default:
          throw new Error('Unknown verification method');
      }
    } catch (err) {
      // DNS lookup failed
      verified = false;
    }

    if (verified) {
      await supabase
        .from('module_custom_domains')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', domainId);

      // Start SSL provisioning
      await this.provisionSSL(domainId);
    } else {
      await supabase
        .from('module_custom_domains')
        .update({ status: 'pending' })
        .eq('id', domainId);
    }

    return verified;
  }

  /**
   * Provision SSL certificate
   */
  async provisionSSL(domainId: string): Promise<void> {
    const { data: domain } = await supabase
      .from('module_custom_domains')
      .select('domain')
      .eq('id', domainId)
      .single();

    if (!domain) throw new Error('Domain not found');

    await supabase
      .from('module_custom_domains')
      .update({
        status: 'provisioning',
        ssl_status: 'provisioning'
      })
      .eq('id', domainId);

    try {
      // Request certificate from Let's Encrypt via ACME
      const certificate = await this.requestACMECertificate(domain.domain);

      // Store certificate
      await supabase
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
      await supabase.from('domain_ssl_certificates').insert({
        domain_id: domainId,
        serial_number: certificate.serialNumber,
        issuer: "Let's Encrypt",
        subject: domain.domain,
        san: [domain.domain],
        issued_at: new Date().toISOString(),
        expires_at: certificate.expiresAt
      });

    } catch (error: any) {
      await supabase
        .from('module_custom_domains')
        .update({
          status: 'failed',
          ssl_status: 'failed'
        })
        .eq('id', domainId);

      throw error;
    }
  }

  /**
   * Update domain configuration
   */
  async updateConfig(domainId: string, config: DomainConfig): Promise<void> {
    const { data: domain } = await supabase
      .from('module_custom_domains')
      .select('config')
      .eq('id', domainId)
      .single();

    if (!domain) throw new Error('Domain not found');

    await supabase
      .from('module_custom_domains')
      .update({
        config: { ...domain.config, ...config },
        updated_at: new Date().toISOString()
      })
      .eq('id', domainId);
  }

  /**
   * Update white-label settings
   */
  async updateWhiteLabel(domainId: string, whiteLabel: WhiteLabelConfig): Promise<void> {
    const { data: domain } = await supabase
      .from('module_custom_domains')
      .select('white_label')
      .eq('id', domainId)
      .single();

    if (!domain) throw new Error('Domain not found');

    await supabase
      .from('module_custom_domains')
      .update({
        white_label: { ...domain.white_label, ...whiteLabel },
        updated_at: new Date().toISOString()
      })
      .eq('id', domainId);
  }

  /**
   * Get all domains for a site module
   */
  async getDomains(): Promise<CustomDomain[]> {
    const { data, error } = await supabase
      .from('module_custom_domains')
      .select('*')
      .eq('site_module_id', this.siteModuleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete domain
   */
  async deleteDomain(domainId: string): Promise<void> {
    // Revoke SSL certificate first
    await this.revokeSSL(domainId);

    await supabase
      .from('module_custom_domains')
      .delete()
      .eq('id', domainId)
      .eq('site_module_id', this.siteModuleId);
  }

  /**
   * Check SSL expiry and renew if needed
   */
  static async checkAndRenewCertificates(): Promise<void> {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + 30); // 30 days before expiry

    const { data: domains } = await supabase
      .from('module_custom_domains')
      .select('id')
      .eq('ssl_status', 'active')
      .eq('ssl_auto_renew', true)
      .lt('ssl_expires_at', expiryThreshold.toISOString());

    for (const domain of domains || []) {
      const service = new DomainService(''); // ID not needed for renewal
      await service.provisionSSL(domain.id);
    }
  }

  // Helper methods
  private isValidDomain(domain: string): boolean {
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[.][a-zA-Z0-9.-]+$/;
    return pattern.test(domain);
  }

  private getVerificationValue(
    domain: string,
    method: string,
    token: string
  ): string {
    if (method === 'cname') {
      return `${domain}.dramac-verify.com`;
    }
    return `dramac-verify=${token}`;
  }

  private async createDNSRecords(
    domainId: string,
    domain: string,
    method: string,
    verificationValue: string
  ): Promise<void> {
    const records = [];

    // Main CNAME or A record
    records.push({
      domain_id: domainId,
      record_type: 'CNAME',
      host: '@',
      value: 'modules.dramac.app'
    });

    // Verification record
    if (method === 'txt') {
      records.push({
        domain_id: domainId,
        record_type: 'TXT',
        host: '_dramac-verify',
        value: verificationValue
      });
    }

    await supabase.from('domain_dns_records').insert(records);
  }

  private async verifyCNAME(domain: string): Promise<boolean> {
    try {
      const records = await dns.resolveCname(domain);
      return records.some(r => r.includes('dramac'));
    } catch {
      return false;
    }
  }

  private async verifyTXT(domain: string, expectedValue: string): Promise<boolean> {
    try {
      const records = await dns.resolveTxt(`_dramac-verify.${domain}`);
      const flatRecords = records.flat();
      return flatRecords.some(r => r === expectedValue);
    } catch {
      return false;
    }
  }

  private async requestACMECertificate(domain: string): Promise<{
    cert: string;
    encryptedKey: string;
    expiresAt: string;
    serialNumber: string;
  }> {
    // In production, use an ACME client like acme-client or certbot
    // This is a placeholder for the actual implementation
    
    // For now, we'll use a managed service like Cloudflare or AWS Certificate Manager
    // which handles the ACME challenge automatically
    
    throw new Error('ACME certificate provisioning not implemented');
  }

  private async revokeSSL(domainId: string): Promise<void> {
    await supabase
      .from('domain_ssl_certificates')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq('domain_id', domainId)
      .eq('status', 'active');
  }
}
```

---

### Task 3: Edge Router (2 hours)

```typescript
// src/lib/modules/domains/edge-router.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RouteResult {
  siteModuleId: string;
  moduleId: string;
  siteId: string;
  config: Record<string, any>;
  whiteLabel: Record<string, any>;
  ssl: {
    certificate: string;
    privateKey: string;
  } | null;
}

export class EdgeRouter {
  private static domainCache = new Map<string, { data: RouteResult; expiresAt: number }>();
  private static CACHE_TTL = 60 * 1000; // 1 minute

  /**
   * Route a request to the correct module
   */
  static async route(hostname: string): Promise<RouteResult | null> {
    // Check cache first
    const cached = this.domainCache.get(hostname);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Query database
    const { data, error } = await supabase
      .rpc('get_module_by_domain', { p_domain: hostname });

    if (error || !data || data.length === 0) {
      return null;
    }

    const domainData = data[0];

    // Get SSL certificate
    const { data: domainRecord } = await supabase
      .from('module_custom_domains')
      .select('ssl_certificate, ssl_private_key_encrypted')
      .eq('site_module_id', domainData.site_module_id)
      .eq('domain', hostname)
      .single();

    const result: RouteResult = {
      siteModuleId: domainData.site_module_id,
      moduleId: domainData.module_id,
      siteId: domainData.site_id,
      config: domainData.config,
      whiteLabel: domainData.white_label,
      ssl: domainRecord?.ssl_certificate ? {
        certificate: domainRecord.ssl_certificate,
        privateKey: await this.decryptPrivateKey(domainRecord.ssl_private_key_encrypted)
      } : null
    };

    // Cache result
    this.domainCache.set(hostname, {
      data: result,
      expiresAt: Date.now() + this.CACHE_TTL
    });

    return result;
  }

  /**
   * Get response headers based on domain config
   */
  static getResponseHeaders(config: Record<string, any>): Record<string, string> {
    const headers: Record<string, string> = {};

    // Security headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'SAMEORIGIN';
    headers['X-XSS-Protection'] = '1; mode=block';

    // Custom headers from config
    if (config.custom_headers) {
      Object.assign(headers, config.custom_headers);
    }

    // Cache control
    if (config.cache_ttl) {
      headers['Cache-Control'] = `public, max-age=${config.cache_ttl}`;
    }

    // CDN hint
    if (config.enable_cdn) {
      headers['CDN-Cache-Control'] = `max-age=${config.cache_ttl || 3600}`;
    }

    return headers;
  }

  /**
   * Check if request should redirect
   */
  static getRedirect(
    hostname: string,
    path: string,
    protocol: string,
    config: Record<string, any>
  ): string | null {
    // HTTPS redirect
    if (config.redirect_to_https && protocol !== 'https') {
      return `https://${hostname}${path}`;
    }

    // WWW redirect
    if (config.force_www && !hostname.startsWith('www.')) {
      return `${protocol}://www.${hostname}${path}`;
    }

    // Non-WWW redirect
    if (config.force_www === false && hostname.startsWith('www.')) {
      return `${protocol}://${hostname.replace('www.', '')}${path}`;
    }

    return null;
  }

  /**
   * Inject white-label branding into HTML
   */
  static injectWhiteLabel(html: string, whiteLabel: Record<string, any>): string {
    let result = html;

    // Replace favicon
    if (whiteLabel.favicon_url) {
      result = result.replace(
        /<link[^>]*rel=["']icon["'][^>]*>/gi,
        `<link rel="icon" href="${whiteLabel.favicon_url}" />`
      );
    }

    // Inject brand name in title
    if (whiteLabel.brand_name) {
      result = result.replace(
        /<title>([^<]*)<\/title>/i,
        `<title>$1 - ${whiteLabel.brand_name}</title>`
      );
    }

    // Inject custom CSS
    if (whiteLabel.custom_css) {
      result = result.replace(
        '</head>',
        `<style>${whiteLabel.custom_css}</style></head>`
      );
    }

    // Inject brand colors as CSS variables
    if (whiteLabel.brand_colors) {
      const colorCSS = `
        <style>
          :root {
            --brand-primary: ${whiteLabel.brand_colors.primary || '#3b82f6'};
            --brand-secondary: ${whiteLabel.brand_colors.secondary || '#6366f1'};
          }
        </style>
      `;
      result = result.replace('</head>', `${colorCSS}</head>`);
    }

    // Remove powered by if configured
    if (whiteLabel.hide_powered_by) {
      result = result.replace(/powered by dramac/gi, '');
      result = result.replace(/<[^>]*dramac-branding[^>]*>[^<]*<\/[^>]*>/gi, '');
    }

    return result;
  }

  private static async decryptPrivateKey(encryptedKey: string): Promise<string> {
    // Use server-side encryption key to decrypt
    const crypto = await import('crypto');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(process.env.SSL_ENCRYPTION_KEY!, 'hex'),
      Buffer.from(encryptedKey.slice(0, 24), 'hex')
    );
    
    const authTag = Buffer.from(encryptedKey.slice(-32), 'hex');
    decipher.setAuthTag(authTag);
    
    const encrypted = Buffer.from(encryptedKey.slice(24, -32), 'hex');
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Log request for analytics
   */
  static async logRequest(
    domainId: string,
    request: {
      path: string;
      method: string;
      statusCode: number;
      responseTimeMs: number;
      bytesSent: number;
      ipAddress: string;
      userAgent: string;
      countryCode?: string;
    }
  ): Promise<void> {
    // Use async insert for performance
    supabase
      .from('domain_request_logs')
      .insert({
        domain_id: domainId,
        path: request.path,
        method: request.method,
        status_code: request.statusCode,
        response_time_ms: request.responseTimeMs,
        bytes_sent: request.bytesSent,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        country_code: request.countryCode
      })
      .then(() => {
        // Update aggregate counters
        supabase.rpc('increment_domain_stats', {
          p_domain_id: domainId,
          p_requests: 1,
          p_bytes: request.bytesSent
        });
      });
  }
}
```

---

### Task 4: Domain Settings UI (2 hours)

```tsx
// src/components/modules/DomainSettings.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Badge,
  Switch,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Separator
} from '@/components/ui';
import { 
  Globe, 
  Shield, 
  Palette, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Copy,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Domain {
  id: string;
  domain: string;
  status: string;
  verification_method: string;
  verification_value: string;
  verified_at: string | null;
  ssl_status: string;
  ssl_expires_at: string | null;
  config: any;
  white_label: any;
}

interface DomainSettingsProps {
  siteModuleId: string;
}

export function DomainSettings({ siteModuleId }: DomainSettingsProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    try {
      const response = await fetch(`/api/modules/${siteModuleId}/domains`);
      const data = await response.json();
      setDomains(data.domains || []);
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addDomain() {
    if (!newDomain.trim()) return;
    
    setAdding(true);
    
    try {
      const response = await fetch(`/api/modules/${siteModuleId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setDomains([data.domain, ...domains]);
      setAddDialogOpen(false);
      setNewDomain('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setAdding(false);
    }
  }

  async function verifyDomain(domainId: string) {
    try {
      const response = await fetch(`/api/modules/${siteModuleId}/domains/${domainId}/verify`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.verified) {
        loadDomains();
      } else {
        alert('Verification failed. Please check your DNS settings.');
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  }

  async function deleteDomain(domainId: string) {
    if (!confirm('Are you sure you want to remove this domain?')) return;
    
    try {
      await fetch(`/api/modules/${siteModuleId}/domains/${domainId}`, {
        method: 'DELETE'
      });
      
      setDomains(domains.filter(d => d.id !== domainId));
    } catch (error) {
      console.error('Failed to delete domain:', error);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: AlertTriangle },
      verifying: { variant: 'secondary', icon: Loader2 },
      verified: { variant: 'outline', icon: CheckCircle },
      provisioning: { variant: 'secondary', icon: Loader2 },
      active: { variant: 'success', icon: CheckCircle },
      failed: { variant: 'destructive', icon: AlertTriangle }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === 'verifying' || status === 'provisioning' ? 'animate-spin' : ''}`} />
        {status}
      </Badge>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Custom Domains
          </h2>
          <p className="text-muted-foreground">
            Connect your own domain to this module
          </p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Domain Name</Label>
                <Input
                  placeholder="app.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter your domain or subdomain (e.g., app.yourcompany.com)
                </p>
              </div>
              
              <Button onClick={addDomain} disabled={adding || !newDomain.trim()} className="w-full">
                {adding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Domain
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domains List */}
      {domains.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Custom Domains</h3>
            <p className="text-muted-foreground mb-4">
              Add a custom domain to use this module on your own URL
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{domain.domain}</CardTitle>
                    {getStatusBadge(domain.status)}
                    {domain.ssl_status === 'active' && (
                      <Badge variant="outline" className="text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        SSL
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {domain.status === 'active' && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`https://${domain.domain}`} target="_blank" rel="noopener">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setSelectedDomain(domain)}>
                      <Palette className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteDomain(domain.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {domain.status === 'pending' && (
                <CardContent className="pt-0">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">DNS Configuration Required</p>
                      <p className="text-sm mb-3">
                        Add the following DNS record to verify ownership:
                      </p>
                      
                      <div className="bg-muted p-3 rounded-md space-y-2 text-sm font-mono">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span>{domain.verification_method === 'txt' ? 'TXT' : 'CNAME'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Host:</span>
                          <span>{domain.verification_method === 'txt' ? '_dramac-verify' : '@'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span>Value:</span>
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[200px]">{domain.verification_value}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => copyToClipboard(domain.verification_value)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button 
                        className="mt-4 w-full" 
                        onClick={() => verifyDomain(domain.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Verify DNS
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}

              {domain.status === 'active' && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Verified:</span>{' '}
                      {new Date(domain.verified_at!).toLocaleDateString()}
                    </div>
                    {domain.ssl_expires_at && (
                      <div>
                        <span className="text-muted-foreground">SSL Expires:</span>{' '}
                        {new Date(domain.ssl_expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* White-label Settings Dialog */}
      {selectedDomain && (
        <WhiteLabelDialog
          domain={selectedDomain}
          onClose={() => setSelectedDomain(null)}
          onSave={loadDomains}
          siteModuleId={siteModuleId}
        />
      )}
    </div>
  );
}

function WhiteLabelDialog({
  domain,
  onClose,
  onSave,
  siteModuleId
}: {
  domain: Domain;
  onClose: () => void;
  onSave: () => void;
  siteModuleId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState(domain.white_label || {});
  const [config, setConfig] = useState(domain.config || {});

  async function save() {
    setSaving(true);
    
    try {
      await fetch(`/api/modules/${siteModuleId}/domains/${domain.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ white_label: whiteLabel, config })
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Domain Settings - {domain.domain}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="branding">
          <TabsList>
            <TabsTrigger value="branding">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="config">
              <Shield className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input
                value={whiteLabel.brand_name || ''}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, brand_name: e.target.value })}
                placeholder="Your Company Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={whiteLabel.logo_url || ''}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input
                value={whiteLabel.favicon_url || ''}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, favicon_url: e.target.value })}
                placeholder="https://example.com/favicon.ico"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <Input
                  type="color"
                  value={whiteLabel.brand_colors?.primary || '#3b82f6'}
                  onChange={(e) => setWhiteLabel({
                    ...whiteLabel,
                    brand_colors: { ...whiteLabel.brand_colors, primary: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <Input
                  type="color"
                  value={whiteLabel.brand_colors?.secondary || '#6366f1'}
                  onChange={(e) => setWhiteLabel({
                    ...whiteLabel,
                    brand_colors: { ...whiteLabel.brand_colors, secondary: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={whiteLabel.hide_powered_by || false}
                onCheckedChange={(checked) => setWhiteLabel({ ...whiteLabel, hide_powered_by: checked })}
              />
              <Label>Hide "Powered by DRAMAC" branding</Label>
            </div>

            <div className="space-y-2">
              <Label>Custom CSS</Label>
              <textarea
                className="w-full h-24 p-2 border rounded-md font-mono text-sm"
                value={whiteLabel.custom_css || ''}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, custom_css: e.target.value })}
                placeholder=".custom-class { ... }"
              />
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Redirect HTTP to HTTPS</Label>
                <p className="text-sm text-muted-foreground">Always use secure connections</p>
              </div>
              <Switch
                checked={config.redirect_to_https !== false}
                onCheckedChange={(checked) => setConfig({ ...config, redirect_to_https: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable CDN Caching</Label>
                <p className="text-sm text-muted-foreground">Cache static assets on CDN edge</p>
              </div>
              <Switch
                checked={config.enable_cdn !== false}
                onCheckedChange={(checked) => setConfig({ ...config, enable_cdn: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Cache TTL (seconds)</Label>
              <Input
                type="number"
                value={config.cache_ttl || 3600}
                onChange={(e) => setConfig({ ...config, cache_ttl: parseInt(e.target.value) })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 5: API Routes (1 hour)

```typescript
// src/app/api/modules/[moduleId]/domains/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DomainService } from '@/lib/modules/domains/domain-service';

export async function GET(
  request: Request,
  { params }: { params: { moduleId: string } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = new DomainService(params.moduleId);
  const domains = await service.getDomains();

  return NextResponse.json({ domains });
}

export async function POST(
  request: Request,
  { params }: { params: { moduleId: string } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { domain } = await request.json();

  try {
    const service = new DomainService(params.moduleId);
    const newDomain = await service.addDomain(domain);
    
    return NextResponse.json({ domain: newDomain });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

```typescript
// src/app/api/modules/[moduleId]/domains/[domainId]/verify/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DomainService } from '@/lib/modules/domains/domain-service';

export async function POST(
  request: Request,
  { params }: { params: { moduleId: string; domainId: string } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = new DomainService(params.moduleId);
  const verified = await service.verifyDomain(params.domainId);

  return NextResponse.json({ verified });
}
```

---

## ✅ Verification Checklist

- [ ] Domains add correctly
- [ ] DNS verification works
- [ ] SSL certificates provision
- [ ] Domains route correctly
- [ ] White-label branding applies
- [ ] HTTPS redirects work
- [ ] CDN caching functions
- [ ] Request logging captures data
- [ ] SSL auto-renewal triggers
- [ ] Domain deletion cleans up

---

## 📍 Dependencies

- **Requires**: EM-30, EM-31 (embed system)
- **Required by**: White-label deployments
- **External**: DNS provider, Let's Encrypt/ACME
