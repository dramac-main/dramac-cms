// src/lib/cloudflare/config.ts
// Cloudflare API Configuration and Constants

/**
 * Cloudflare Configuration
 * 
 * Environment variables required:
 * - CLOUDFLARE_API_TOKEN: API token with Zone and DNS permissions
 * - CLOUDFLARE_ACCOUNT_ID: (optional) Cloudflare account ID for zone creation
 * - PLATFORM_IP: IP address for A records (defaults to Vercel)
 * - DEFAULT_CNAME_TARGET: CNAME target for subdomains
 * - PLATFORM_NAMESERVERS: Comma-separated nameserver list
 */
export const CLOUDFLARE_CONFIG = {
  // API Configuration
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  
  // Platform Configuration
  platformIp: process.env.PLATFORM_IP || '76.76.21.21', // Vercel IP
  platformCname: process.env.DEFAULT_CNAME_TARGET || 'cname.dramac.app',
  platformNameservers: (
    process.env.PLATFORM_NAMESERVERS || 'ns1.dramac.app,ns2.dramac.app'
  ).split(','),
  
  // Default Settings
  defaultTtl: 3600, // 1 hour
  defaultProxied: true, // Enable Cloudflare proxy by default
  defaultSslMode: 'full' as const,
  
  // Rate Limiting
  maxRequestsPerMinute: 1200,
  requestTimeout: 30000, // 30 seconds
} as const;

/**
 * Check if Cloudflare is properly configured
 */
export function isCloudflareConfigured(): boolean {
  return !!CLOUDFLARE_CONFIG.apiToken;
}

/**
 * DNS Record Templates for different scenarios
 * 
 * These templates define the standard DNS configurations
 * for various use cases within the DRAMAC platform.
 */
export const DNS_TEMPLATES = {
  /**
   * Basic site hosting template
   * Creates A record for root and CNAME for www
   */
  site: {
    records: [
      { type: 'A', name: '@', proxied: true },
      { type: 'CNAME', name: 'www', content: '@', proxied: true },
    ],
  },
  
  /**
   * Titan Mail email configuration
   * MX records, SPF, DKIM setup for professional email
   */
  titanEmail: {
    records: [
      { type: 'MX', name: '@', content: 'mx1.titan.email', priority: 10 },
      { type: 'MX', name: '@', content: 'mx2.titan.email', priority: 20 },
      { type: 'TXT', name: '@', content: 'v=spf1 include:spf.titan.email ~all' },
      // DKIM is added per-domain with specific values
    ],
    dkimSelector: 'titan._domainkey',
    dmarcRecord: 'v=DMARC1; p=none; rua=mailto:dmarc@dramac.app',
  },
  
  /**
   * Google Workspace email configuration
   * Full MX record setup for Google Workspace
   */
  googleWorkspace: {
    records: [
      { type: 'MX', name: '@', content: 'ASPMX.L.GOOGLE.COM', priority: 1 },
      { type: 'MX', name: '@', content: 'ALT1.ASPMX.L.GOOGLE.COM', priority: 5 },
      { type: 'MX', name: '@', content: 'ALT2.ASPMX.L.GOOGLE.COM', priority: 5 },
      { type: 'MX', name: '@', content: 'ALT3.ASPMX.L.GOOGLE.COM', priority: 10 },
      { type: 'MX', name: '@', content: 'ALT4.ASPMX.L.GOOGLE.COM', priority: 10 },
      { type: 'TXT', name: '@', content: 'v=spf1 include:_spf.google.com ~all' },
    ],
  },
  
  /**
   * Microsoft 365 email configuration
   */
  microsoft365: {
    records: [
      { type: 'MX', name: '@', content: '{domain}.mail.protection.outlook.com', priority: 0 },
      { type: 'TXT', name: '@', content: 'v=spf1 include:spf.protection.outlook.com ~all' },
      { type: 'CNAME', name: 'autodiscover', content: 'autodiscover.outlook.com' },
    ],
  },
  
  /**
   * DRAMAC verification record
   * Used to verify domain ownership
   */
  verification: {
    prefix: '_dramac-verify',
  },
  
  /**
   * Vercel deployment configuration
   */
  vercel: {
    records: [
      { type: 'A', name: '@', content: '76.76.21.21', proxied: true },
      { type: 'CNAME', name: 'www', content: 'cname.vercel-dns.com', proxied: true },
    ],
  },
} as const;

/**
 * SSL/TLS Mode descriptions
 */
export const SSL_MODE_INFO = {
  off: {
    name: 'Off',
    description: 'No encryption. Not recommended.',
    icon: 'x',
  },
  flexible: {
    name: 'Flexible',
    description: 'Encrypts traffic between browser and Cloudflare only.',
    icon: 'alert',
  },
  full: {
    name: 'Full',
    description: 'Encrypts end-to-end but allows self-signed certificates.',
    icon: 'check',
  },
  strict: {
    name: 'Full (Strict)',
    description: 'Encrypts end-to-end with valid certificates only.',
    icon: 'shield',
  },
} as const;

/**
 * Common DNS record type descriptions
 */
export const DNS_RECORD_INFO = {
  A: {
    name: 'A Record',
    description: 'Points domain to IPv4 address',
    example: '192.168.1.1',
    canProxy: true,
  },
  AAAA: {
    name: 'AAAA Record',
    description: 'Points domain to IPv6 address',
    example: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    canProxy: true,
  },
  CNAME: {
    name: 'CNAME Record',
    description: 'Alias for another domain',
    example: 'www.example.com',
    canProxy: true,
  },
  MX: {
    name: 'MX Record',
    description: 'Mail server for email delivery',
    example: 'mail.example.com',
    canProxy: false,
  },
  TXT: {
    name: 'TXT Record',
    description: 'Text record for verification/SPF/DKIM',
    example: 'v=spf1 include:_spf.google.com ~all',
    canProxy: false,
  },
  NS: {
    name: 'NS Record',
    description: 'Nameserver delegation',
    example: 'ns1.example.com',
    canProxy: false,
  },
  SRV: {
    name: 'SRV Record',
    description: 'Service location record',
    example: '_sip._tcp.example.com',
    canProxy: false,
  },
  CAA: {
    name: 'CAA Record',
    description: 'Certificate authority authorization',
    example: '0 issue "letsencrypt.org"',
    canProxy: false,
  },
  PTR: {
    name: 'PTR Record',
    description: 'Reverse DNS lookup',
    example: '1.168.192.in-addr.arpa',
    canProxy: false,
  },
} as const;
