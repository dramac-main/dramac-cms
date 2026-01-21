# Phase EM-31: External Website Integration

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 10-12 hours
> **Prerequisites**: EM-30 (Universal Embed), EM-12 (API Gateway)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Enable modules to be embedded on **external websites** (not built on Dramac):
1. CDN-hosted embed scripts
2. Secure cross-origin communication
3. Dynamic widget loading
4. External API access
5. OAuth for external apps

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATION                            │
├───────────────┬────────────────┬───────────────────────────────────┤
│   EMBED SDK   │   API ACCESS   │      SECURITY                     │
├───────────────┼────────────────┼───────────────────────────────────┤
│ CDN Scripts   │ OAuth 2.0      │ CORS Policies                     │
│ Loader        │ API Keys       │ Domain Allowlist                  │
│ PostMessage   │ Webhooks       │ Rate Limiting                     │
│ Iframe Comms  │ REST/GraphQL   │ Content Security                  │
└───────────────┴────────────────┴───────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Domain Allowlist & Verification (2 hours)

```sql
-- migrations/em-31-external-domains.sql

-- Allowed domains for external embedding
CREATE TABLE module_allowed_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES site_modules(id) ON DELETE CASCADE,
  
  domain TEXT NOT NULL,               -- "example.com" or "*.example.com"
  verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  
  -- Settings
  allow_embed BOOLEAN DEFAULT true,
  allow_api BOOLEAN DEFAULT true,
  
  -- Restrictions
  embed_types TEXT[] DEFAULT '{}',    -- Empty = all, or ['widget', 'popup']
  rate_limit INTEGER DEFAULT 1000,    -- Requests per hour
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, module_id, domain)
);

-- API access tokens for external apps
CREATE TABLE module_external_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES site_modules(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,           -- Hashed token
  token_prefix TEXT NOT NULL,         -- First 8 chars for identification
  
  -- Permissions
  scopes TEXT[] DEFAULT '{}',         -- ['read', 'write', 'delete']
  
  -- Restrictions
  allowed_domains TEXT[],             -- null = any domain
  allowed_ips TEXT[],                 -- null = any IP
  rate_limit INTEGER DEFAULT 100,     -- Requests per minute
  
  -- Tracking
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External request logs
CREATE TABLE module_external_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  module_id UUID NOT NULL,
  token_id UUID REFERENCES module_external_tokens(id),
  
  -- Request info
  method TEXT,
  path TEXT,
  origin TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_external_requests_created ON module_external_requests(created_at);
CREATE INDEX idx_external_requests_site ON module_external_requests(site_id, created_at);

-- RLS
ALTER TABLE module_allowed_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_external_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_isolation" ON module_allowed_domains
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
  
CREATE POLICY "site_isolation" ON module_external_tokens
  FOR ALL USING (site_id = current_setting('app.site_id', true)::uuid);
```

```typescript
// src/lib/modules/external/domain-service.ts

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
}

export class DomainService {
  private siteId: string;
  private moduleId: string;

  constructor(siteId: string, moduleId: string) {
    this.siteId = siteId;
    this.moduleId = moduleId;
  }

  /**
   * Add allowed domain
   */
  async addDomain(domain: string): Promise<AllowedDomain> {
    // Normalize domain
    const normalizedDomain = this.normalizeDomain(domain);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const { data, error } = await supabase
      .from('module_allowed_domains')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        domain: normalizedDomain,
        verification_token: verificationToken
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Verify domain ownership via DNS TXT record or meta tag
   */
  async verifyDomain(domainId: string, method: 'dns' | 'meta'): Promise<boolean> {
    const { data: domain, error } = await supabase
      .from('module_allowed_domains')
      .select('*')
      .eq('id', domainId)
      .single();

    if (error || !domain) throw new Error('Domain not found');

    let verified = false;

    if (method === 'dns') {
      verified = await this.verifyDnsTxt(domain.domain, domain.verification_token);
    } else if (method === 'meta') {
      verified = await this.verifyMetaTag(domain.domain, domain.verification_token);
    }

    if (verified) {
      await supabase
        .from('module_allowed_domains')
        .update({
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', domainId);
    }

    return verified;
  }

  /**
   * Verify DNS TXT record
   */
  private async verifyDnsTxt(domain: string, token: string): Promise<boolean> {
    try {
      const dns = await import('dns/promises');
      const records = await dns.resolveTxt(`_dramac-verify.${domain}`);
      
      return records.some(record => 
        record.some(txt => txt === `dramac-site-verification=${token}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Verify meta tag on website
   */
  private async verifyMetaTag(domain: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}`, {
        headers: { 'User-Agent': 'DramacBot/1.0' }
      });
      
      const html = await response.text();
      const metaMatch = html.match(
        /<meta\s+name="dramac-site-verification"\s+content="([^"]+)"/i
      );
      
      return metaMatch?.[1] === token;
    } catch {
      return false;
    }
  }

  /**
   * Check if origin is allowed
   */
  async isOriginAllowed(origin: string): Promise<{ allowed: boolean; domain?: AllowedDomain }> {
    const hostname = new URL(origin).hostname;

    const { data: domains } = await supabase
      .from('module_allowed_domains')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('verified', true);

    if (!domains || domains.length === 0) {
      return { allowed: false };
    }

    for (const domain of domains) {
      if (this.matchesDomain(hostname, domain.domain)) {
        return { allowed: true, domain };
      }
    }

    return { allowed: false };
  }

  /**
   * Match hostname against domain pattern (supports wildcards)
   */
  private matchesDomain(hostname: string, pattern: string): boolean {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return hostname === suffix || hostname.endsWith('.' + suffix);
    }
    return hostname === pattern;
  }

  /**
   * Get all allowed domains
   */
  async getDomains(): Promise<AllowedDomain[]> {
    const { data, error } = await supabase
      .from('module_allowed_domains')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Remove domain
   */
  async removeDomain(domainId: string): Promise<void> {
    const { error } = await supabase
      .from('module_allowed_domains')
      .delete()
      .eq('id', domainId)
      .eq('module_id', this.moduleId);

    if (error) throw error;
  }

  private normalizeDomain(domain: string): string {
    return domain.toLowerCase().replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
  }
}
```

---

### Task 2: CDN Embed SDK (3 hours)

```typescript
// cdn/embed-sdk.ts
// This gets bundled and served from CDN

interface DramacEmbedConfig {
  siteId: string;
  moduleId: string;
  container?: string | HTMLElement;
  type?: 'widget' | 'popup' | 'inline';
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: string;
  height?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (message: any) => void;
}

interface DramacEmbed {
  open: () => void;
  close: () => void;
  toggle: () => void;
  send: (action: string, data?: any) => void;
  destroy: () => void;
}

(function() {
  const EMBED_API_URL = 'https://embed.dramac.io';
  const CDN_URL = 'https://cdn.dramac.io';

  // Queue for commands before SDK is ready
  const commandQueue: Array<{ method: string; args: any[] }> = [];

  class DramacEmbedSDK {
    private config: DramacEmbedConfig;
    private iframe: HTMLIFrameElement | null = null;
    private container: HTMLElement | null = null;
    private isOpen: boolean = false;
    private messageHandlers: Map<string, Function[]> = new Map();
    private ready: boolean = false;

    constructor(config: DramacEmbedConfig) {
      this.config = {
        type: 'widget',
        theme: 'light',
        position: 'bottom-right',
        ...config
      };

      this.init();
    }

    private async init() {
      try {
        // Verify origin is allowed
        const allowed = await this.checkOrigin();
        if (!allowed) {
          throw new Error('This domain is not authorized to embed this module');
        }

        // Load styles
        this.injectStyles();

        // Create container
        this.createContainer();

        // Create iframe
        this.createIframe();

        // Setup message handler
        window.addEventListener('message', this.handleMessage.bind(this));

        this.ready = true;
        this.config.onReady?.();

        // Process queued commands
        this.processQueue();
      } catch (error) {
        this.config.onError?.(error as Error);
        console.error('[Dramac] Embed initialization failed:', error);
      }
    }

    private async checkOrigin(): Promise<boolean> {
      const response = await fetch(`${EMBED_API_URL}/api/embed/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: this.config.siteId,
          moduleId: this.config.moduleId,
          origin: window.location.origin
        })
      });

      const data = await response.json();
      return data.allowed;
    }

    private injectStyles() {
      if (document.getElementById('dramac-embed-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'dramac-embed-styles';
      styles.textContent = `
        .dramac-embed-container {
          position: fixed;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .dramac-embed-container.bottom-right {
          bottom: 20px;
          right: 20px;
        }
        .dramac-embed-container.bottom-left {
          bottom: 20px;
          left: 20px;
        }
        .dramac-embed-container.top-right {
          top: 20px;
          right: 20px;
        }
        .dramac-embed-container.top-left {
          top: 20px;
          left: 20px;
        }
        .dramac-embed-widget {
          width: 400px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - 40px);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          overflow: hidden;
          opacity: 0;
          transform: scale(0.9) translateY(20px);
          transition: all 0.3s ease;
          pointer-events: none;
        }
        .dramac-embed-widget.open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }
        .dramac-embed-widget iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .dramac-embed-trigger {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #0066FF;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .dramac-embed-trigger:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        .dramac-embed-trigger svg {
          width: 24px;
          height: 24px;
          fill: white;
        }
        .dramac-embed-inline {
          width: 100%;
          border: none;
          border-radius: 8px;
          overflow: hidden;
        }
        @media (max-width: 480px) {
          .dramac-embed-widget {
            width: 100vw;
            height: 100vh;
            max-width: none;
            max-height: none;
            border-radius: 0;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    private createContainer() {
      if (this.config.type === 'inline') {
        // Use provided container
        if (typeof this.config.container === 'string') {
          this.container = document.querySelector(this.config.container);
        } else {
          this.container = this.config.container || document.body;
        }
      } else {
        // Create floating container
        this.container = document.createElement('div');
        this.container.className = `dramac-embed-container ${this.config.position}`;
        document.body.appendChild(this.container);
      }
    }

    private createIframe() {
      const iframeUrl = new URL(`${EMBED_API_URL}/embed/${this.config.moduleId}`);
      iframeUrl.searchParams.set('site', this.config.siteId);
      iframeUrl.searchParams.set('origin', window.location.origin);
      iframeUrl.searchParams.set('theme', this.config.theme || 'light');
      iframeUrl.searchParams.set('type', this.config.type || 'widget');

      this.iframe = document.createElement('iframe');
      this.iframe.src = iframeUrl.toString();
      this.iframe.allow = 'clipboard-write; payment; camera; microphone';
      
      if (this.config.type === 'inline') {
        this.iframe.className = 'dramac-embed-inline';
        this.iframe.style.width = this.config.width || '100%';
        this.iframe.style.height = this.config.height || '500px';
        this.container?.appendChild(this.iframe);
      } else {
        // Create widget wrapper
        const widgetWrapper = document.createElement('div');
        widgetWrapper.className = 'dramac-embed-widget';
        widgetWrapper.appendChild(this.iframe);

        // Create trigger button
        const trigger = document.createElement('button');
        trigger.className = 'dramac-embed-trigger';
        trigger.innerHTML = `
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        `;
        trigger.onclick = () => this.toggle();

        this.container?.appendChild(widgetWrapper);
        this.container?.appendChild(trigger);
      }
    }

    private handleMessage(event: MessageEvent) {
      // Verify origin
      if (!event.origin.includes('dramac.io')) return;

      const { type, payload } = event.data;

      // Handle built-in messages
      switch (type) {
        case 'dramac:ready':
          this.ready = true;
          break;
        case 'dramac:close':
          this.close();
          break;
        case 'dramac:resize':
          if (this.iframe && payload.height) {
            this.iframe.style.height = `${payload.height}px`;
          }
          break;
      }

      // Call custom handler
      this.config.onMessage?.({ type, payload });

      // Call registered handlers
      const handlers = this.messageHandlers.get(type);
      handlers?.forEach(handler => handler(payload));
    }

    private processQueue() {
      while (commandQueue.length > 0) {
        const cmd = commandQueue.shift();
        if (cmd && (this as any)[cmd.method]) {
          (this as any)[cmd.method](...cmd.args);
        }
      }
    }

    // Public API
    open() {
      if (this.config.type === 'inline') return;
      
      const widget = this.container?.querySelector('.dramac-embed-widget');
      widget?.classList.add('open');
      this.isOpen = true;
      this.send('open');
    }

    close() {
      if (this.config.type === 'inline') return;
      
      const widget = this.container?.querySelector('.dramac-embed-widget');
      widget?.classList.remove('open');
      this.isOpen = false;
      this.send('close');
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    send(action: string, data?: any) {
      if (!this.iframe?.contentWindow) return;
      
      this.iframe.contentWindow.postMessage({
        type: `dramac:${action}`,
        payload: data
      }, EMBED_API_URL);
    }

    on(event: string, handler: Function) {
      if (!this.messageHandlers.has(event)) {
        this.messageHandlers.set(event, []);
      }
      this.messageHandlers.get(event)!.push(handler);
    }

    off(event: string, handler?: Function) {
      if (!handler) {
        this.messageHandlers.delete(event);
      } else {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) handlers.splice(index, 1);
        }
      }
    }

    destroy() {
      window.removeEventListener('message', this.handleMessage);
      this.container?.remove();
      this.iframe = null;
      this.container = null;
    }
  }

  // Expose to window
  (window as any).Dramac = {
    embed: (config: DramacEmbedConfig): DramacEmbed => {
      return new DramacEmbedSDK(config) as unknown as DramacEmbed;
    },
    version: '1.0.0'
  };

  // Auto-init from data attributes
  document.addEventListener('DOMContentLoaded', () => {
    const autoEmbeds = document.querySelectorAll('[data-dramac-embed]');
    autoEmbeds.forEach(el => {
      const config: DramacEmbedConfig = {
        siteId: el.getAttribute('data-site-id') || '',
        moduleId: el.getAttribute('data-dramac-embed') || '',
        container: el as HTMLElement,
        type: 'inline'
      };
      (window as any).Dramac.embed(config);
    });
  });
})();
```

---

### Task 3: External API OAuth (2 hours)

```typescript
// src/lib/modules/external/oauth-service.ts

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface OAuthClient {
  id: string;
  site_id: string;
  module_id: string;
  name: string;
  client_id: string;
  client_secret_hash: string;
  redirect_uris: string[];
  scopes: string[];
  created_at: string;
}

export interface AccessToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export class OAuthService {
  private siteId: string;
  private moduleId: string;

  constructor(siteId: string, moduleId: string) {
    this.siteId = siteId;
    this.moduleId = moduleId;
  }

  /**
   * Create OAuth client
   */
  async createClient(name: string, redirectUris: string[], scopes: string[]): Promise<{
    client: OAuthClient;
    clientSecret: string;
  }> {
    const clientId = `dram_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

    const { data, error } = await supabase
      .from('module_oauth_clients')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        name,
        client_id: clientId,
        client_secret_hash: secretHash,
        redirect_uris: redirectUris,
        scopes
      })
      .select()
      .single();

    if (error) throw error;

    return {
      client: data,
      clientSecret // Only returned once!
    };
  }

  /**
   * Validate client credentials
   */
  async validateClient(clientId: string, clientSecret: string): Promise<OAuthClient | null> {
    const secretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

    const { data, error } = await supabase
      .from('module_oauth_clients')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('client_id', clientId)
      .eq('client_secret_hash', secretHash)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Generate authorization code
   */
  async generateAuthCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    scopes: string[]
  ): Promise<string> {
    // Validate client and redirect URI
    const { data: client } = await supabase
      .from('module_oauth_clients')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('client_id', clientId)
      .single();

    if (!client) throw new Error('Invalid client');
    if (!client.redirect_uris.includes(redirectUri)) {
      throw new Error('Invalid redirect URI');
    }

    // Validate scopes
    const invalidScopes = scopes.filter(s => !client.scopes.includes(s));
    if (invalidScopes.length > 0) {
      throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
    }

    // Generate code
    const code = crypto.randomBytes(32).toString('hex');
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    // Store code (expires in 10 minutes)
    await supabase
      .from('module_oauth_codes')
      .insert({
        code_hash: codeHash,
        client_id: clientId,
        user_id: userId,
        redirect_uri: redirectUri,
        scopes,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    return code;
  }

  /**
   * Exchange code for tokens
   */
  async exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<AccessToken> {
    // Validate client
    const client = await this.validateClient(clientId, clientSecret);
    if (!client) throw new Error('Invalid client credentials');

    // Find and validate code
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    const { data: authCode, error } = await supabase
      .from('module_oauth_codes')
      .select('*')
      .eq('code_hash', codeHash)
      .eq('client_id', clientId)
      .eq('redirect_uri', redirectUri)
      .single();

    if (error || !authCode) throw new Error('Invalid authorization code');
    if (new Date(authCode.expires_at) < new Date()) {
      throw new Error('Authorization code expired');
    }

    // Delete used code
    await supabase
      .from('module_oauth_codes')
      .delete()
      .eq('code_hash', codeHash);

    // Generate tokens
    return this.generateTokens(authCode.user_id, authCode.scopes, clientId);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    scopes: string[],
    clientId: string
  ): Promise<AccessToken> {
    const accessToken = jwt.sign(
      {
        sub: userId,
        scope: scopes.join(' '),
        client_id: clientId,
        site_id: this.siteId,
        module_id: this.moduleId,
        type: 'access'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        sub: userId,
        client_id: clientId,
        type: 'refresh'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    // Store refresh token
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await supabase
      .from('module_oauth_refresh_tokens')
      .insert({
        token_hash: refreshHash,
        client_id: clientId,
        user_id: userId,
        scopes,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: scopes.join(' ')
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, clientId: string, clientSecret: string): Promise<AccessToken> {
    // Validate client
    const client = await this.validateClient(clientId, clientSecret);
    if (!client) throw new Error('Invalid client credentials');

    // Validate refresh token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const { data: storedToken, error } = await supabase
      .from('module_oauth_refresh_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('client_id', clientId)
      .single();

    if (error || !storedToken) throw new Error('Invalid refresh token');
    if (new Date(storedToken.expires_at) < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Generate new tokens
    return this.generateTokens(storedToken.user_id, storedToken.scopes, clientId);
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: string): {
    valid: boolean;
    userId?: string;
    scopes?: string[];
    error?: string;
  } {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'access') {
        return { valid: false, error: 'Invalid token type' };
      }
      
      if (decoded.module_id !== this.moduleId) {
        return { valid: false, error: 'Token not valid for this module' };
      }

      return {
        valid: true,
        userId: decoded.sub,
        scopes: decoded.scope.split(' ')
      };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }

  /**
   * Revoke tokens
   */
  async revokeToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    await supabase
      .from('module_oauth_refresh_tokens')
      .delete()
      .eq('token_hash', tokenHash);
  }
}
```

---

### Task 4: CORS Middleware (1 hour)

```typescript
// src/lib/modules/external/cors-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { DomainService } from './domain-service';

export interface CorsConfig {
  siteId: string;
  moduleId: string;
}

/**
 * CORS middleware for external module API requests
 */
export async function corsMiddleware(
  request: NextRequest,
  config: CorsConfig
): Promise<NextResponse | null> {
  const origin = request.headers.get('origin');
  
  // No origin = same-origin request, allow it
  if (!origin) {
    return null;
  }

  const domainService = new DomainService(config.siteId, config.moduleId);
  const { allowed, domain } = await domainService.isOriginAllowed(origin);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    if (!allowed) {
      return new NextResponse(null, {
        status: 403,
        statusText: 'CORS Not Allowed'
      });
    }

    return new NextResponse(null, {
      status: 200,
      headers: getCorsHeaders(origin, domain)
    });
  }

  // For actual requests, return headers to be added
  if (!allowed) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string,
  domain?: any
): NextResponse {
  const headers = getCorsHeaders(origin, domain);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

function getCorsHeaders(origin: string, domain?: any): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'X-Rate-Limit': domain?.rate_limit?.toString() || '1000'
  };
}

/**
 * Rate limiting for external requests
 */
export async function checkRateLimit(
  siteId: string,
  moduleId: string,
  origin: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number; reset: Date }> {
  const key = `ratelimit:${siteId}:${moduleId}:${origin}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const reset = new Date(windowStart + windowMs);

  // In production, use Redis
  // This is a simplified in-memory version
  const cache = (globalThis as any).__rateLimitCache || new Map();
  (globalThis as any).__rateLimitCache = cache;

  const current = cache.get(key) || { count: 0, windowStart };
  
  // Reset if new window
  if (current.windowStart !== windowStart) {
    current.count = 0;
    current.windowStart = windowStart;
  }

  current.count++;
  cache.set(key, current);

  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    reset
  };
}
```

---

### Task 5: Webhook Service (2 hours)

```typescript
// src/lib/modules/external/webhook-service.ts

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Webhook {
  id: string;
  site_id: string;
  module_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  headers: Record<string, string>;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: any;
  status: 'pending' | 'success' | 'failed';
  status_code: number | null;
  response: string | null;
  attempts: number;
  next_retry_at: string | null;
  created_at: string;
}

export class WebhookService {
  private siteId: string;
  private moduleId: string;

  constructor(siteId: string, moduleId: string) {
    this.siteId = siteId;
    this.moduleId = moduleId;
  }

  /**
   * Register webhook
   */
  async createWebhook(input: {
    name: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
  }): Promise<{ webhook: Webhook; secret: string }> {
    const secret = crypto.randomBytes(32).toString('hex');

    const { data, error } = await supabase
      .from('module_webhooks')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        name: input.name,
        url: input.url,
        secret,
        events: input.events,
        headers: input.headers || {},
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return { webhook: data, secret };
  }

  /**
   * Trigger webhook event
   */
  async trigger(event: string, payload: any): Promise<void> {
    // Find all webhooks subscribed to this event
    const { data: webhooks } = await supabase
      .from('module_webhooks')
      .select('*')
      .eq('module_id', this.moduleId)
      .eq('is_active', true)
      .contains('events', [event]);

    if (!webhooks || webhooks.length === 0) return;

    // Queue deliveries
    const deliveries = webhooks.map(webhook => ({
      webhook_id: webhook.id,
      event,
      payload,
      status: 'pending',
      attempts: 0
    }));

    await supabase.from('module_webhook_deliveries').insert(deliveries);

    // Process immediately (in production, use a queue)
    for (const webhook of webhooks) {
      await this.deliver(webhook, event, payload);
    }
  }

  /**
   * Deliver webhook
   */
  private async deliver(webhook: Webhook, event: string, payload: any): Promise<void> {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(webhook.secret, timestamp, payload);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
      ...webhook.headers
    };

    let status: 'success' | 'failed' = 'failed';
    let statusCode: number | null = null;
    let responseBody: string | null = null;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      statusCode = response.status;
      responseBody = await response.text();
      status = response.ok ? 'success' : 'failed';
    } catch (error: any) {
      responseBody = error.message;
    }

    // Update delivery record
    await supabase
      .from('module_webhook_deliveries')
      .update({
        status,
        status_code: statusCode,
        response: responseBody?.slice(0, 1000),
        attempts: 1
      })
      .eq('webhook_id', webhook.id)
      .eq('event', event)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(secret: string, timestamp: string, payload: any): string {
    const data = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  static verifySignature(
    secret: string,
    signature: string,
    timestamp: string,
    payload: any,
    tolerance = 300 // 5 minutes
  ): boolean {
    // Check timestamp to prevent replay attacks
    const now = Date.now();
    const ts = parseInt(timestamp, 10);
    if (Math.abs(now - ts) > tolerance * 1000) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${JSON.stringify(payload)}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  /**
   * Get webhooks
   */
  async getWebhooks(): Promise<Webhook[]> {
    const { data, error } = await supabase
      .from('module_webhooks')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get delivery history
   */
  async getDeliveries(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    const { data, error } = await supabase
      .from('module_webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    const { data: delivery } = await supabase
      .from('module_webhook_deliveries')
      .select('*, webhook:module_webhooks(*)')
      .eq('id', deliveryId)
      .single();

    if (!delivery || !delivery.webhook) {
      throw new Error('Delivery not found');
    }

    await this.deliver(delivery.webhook, delivery.event, delivery.payload);
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const { error } = await supabase
      .from('module_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('module_id', this.moduleId);

    if (error) throw error;
  }
}
```

---

## ✅ Verification Checklist

- [ ] Domain allowlist works
- [ ] Domain verification (DNS/meta) works
- [ ] Embed SDK loads on external sites
- [ ] Widget opens/closes correctly
- [ ] PostMessage communication works
- [ ] OAuth flow completes
- [ ] Access tokens validate
- [ ] CORS headers are correct
- [ ] Rate limiting works
- [ ] Webhooks deliver

---

## 📍 Dependencies

- **Requires**: EM-30 (Embed), EM-12 (API Gateway)
- **Required by**: External integrations, third-party apps
