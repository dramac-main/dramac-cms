# Phase EM-30: Universal Module Embedding System

> **Priority**: 🟠 HIGH
> **Estimated Time**: 10-12 hours
> **Prerequisites**: EM-01 (Module Lifecycle), EM-10 (Type System)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a **Universal Embedding System** that allows modules to work on ANY website - whether built on DRAMAC or not. This is critical for making modules truly valuable as standalone products.

### Deployment Options

| Option | Use Case | Integration Effort |
|--------|----------|-------------------|
| **iFrame Embed** | External sites, WordPress, any HTML | Minimal (1 line) |
| **Web Component** | Modern sites, React/Vue/Angular | Minimal (1 script) |
| **JavaScript SDK** | Deep integration, custom styling | Medium |
| **API-Only** | Headless, custom frontend | Full control |
| **Standalone App** | Custom domain, white-label | Zero integration |

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL WEBSITE                              │
│                                                                  │
│  ┌─────────────────┐   ┌─────────────────┐   ┌──────────────┐  │
│  │   iFrame Embed  │   │  Web Component  │   │   SDK Call   │  │
│  │   <iframe>      │   │  <dramac-crm>   │   │  DramacSDK() │  │
│  └────────┬────────┘   └────────┬────────┘   └──────┬───────┘  │
│           │                     │                    │          │
└───────────┼─────────────────────┼────────────────────┼──────────┘
            │                     │                    │
            ▼                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DRAMAC EMBED SERVICE                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /embed/:moduleId/:siteId                                │   │
│  │  - Authentication via token                               │   │
│  │  - Settings from installation                            │   │
│  │  - Responsive rendering                                  │   │
│  │  - PostMessage communication                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MODULE RUNTIME                         │   │
│  │  - Sandboxed execution                                   │   │
│  │  - API proxy                                              │   │
│  │  - Event bridging                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Embed Route & Controller (2 hours)

```typescript
// src/app/embed/[moduleId]/[siteId]/page.tsx

import { notFound } from 'next/navigation'
import { getModuleForEmbed } from '@/lib/modules/embed/embed-service'
import { ModuleEmbedRenderer } from '@/components/modules/embed/module-embed-renderer'
import { validateEmbedToken } from '@/lib/modules/embed/embed-auth'

interface EmbedPageProps {
  params: Promise<{ moduleId: string; siteId: string }>
  searchParams: Promise<{ 
    token?: string
    theme?: 'light' | 'dark' | 'auto'
    width?: string
    height?: string
  }>
}

export default async function ModuleEmbedPage({ params, searchParams }: EmbedPageProps) {
  const { moduleId, siteId } = await params
  const { token, theme = 'auto', width, height } = await searchParams

  // Validate embed token
  const isValid = await validateEmbedToken(token || '', siteId, moduleId)
  if (!isValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <h1 className="text-xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">Invalid or expired embed token</p>
        </div>
      </div>
    )
  }

  // Load module and settings
  const { module, installation, error } = await getModuleForEmbed(moduleId, siteId)

  if (error || !module) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <h1 className="text-xl font-bold text-destructive">Module Not Available</h1>
          <p className="text-muted-foreground mt-2">{error || 'Module not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : ''}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{module.name} - Embedded</title>
        <style>{`
          html, body { 
            margin: 0; 
            padding: 0; 
            background: transparent;
            ${width ? `width: ${width};` : ''}
            ${height ? `min-height: ${height};` : 'min-height: 100vh;'}
          }
          #embed-root {
            width: 100%;
            height: 100%;
          }
        `}</style>
      </head>
      <body>
        <div id="embed-root">
          <ModuleEmbedRenderer
            module={module}
            settings={installation?.settings || {}}
            siteId={siteId}
            theme={theme}
          />
        </div>
        {/* PostMessage bridge for parent communication */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Notify parent that module is ready
          window.parent.postMessage({
            type: 'DRAMAC_MODULE_READY',
            moduleId: '${moduleId}',
            siteId: '${siteId}'
          }, '*');

          // Listen for messages from parent
          window.addEventListener('message', (event) => {
            if (event.data.type === 'DRAMAC_SETTINGS_UPDATE') {
              // Handle settings update
              window.dispatchEvent(new CustomEvent('dramac:settings', { 
                detail: event.data.settings 
              }));
            }
            if (event.data.type === 'DRAMAC_THEME_CHANGE') {
              document.documentElement.className = event.data.theme;
            }
          });

          // Auto-resize iframe
          const observer = new ResizeObserver(entries => {
            const height = entries[0].contentRect.height;
            window.parent.postMessage({
              type: 'DRAMAC_RESIZE',
              moduleId: '${moduleId}',
              height: height
            }, '*');
          });
          observer.observe(document.body);
        `}} />
      </body>
    </html>
  )
}
```

---

### Task 2: Embed Service (2 hours)

```typescript
// src/lib/modules/embed/embed-service.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { loadStudioModuleForRender } from '../studio-module-loader'
import type { LoadedStudioModule } from '../studio-module-loader'

export interface EmbedModuleResponse {
  module: LoadedStudioModule | null
  installation: {
    id: string
    settings: Record<string, unknown>
    is_enabled: boolean
  } | null
  error?: string
}

/**
 * Get module data for embedding
 */
export async function getModuleForEmbed(
  moduleId: string,
  siteId: string
): Promise<EmbedModuleResponse> {
  const supabase = await createClient()

  // Get installation
  const { data: installation, error: installError } = await supabase
    .from('site_module_installations')
    .select('id, settings, is_enabled')
    .eq('site_id', siteId)
    .eq('module_id', moduleId)
    .single()

  if (installError || !installation) {
    return { module: null, installation: null, error: 'Module not installed on this site' }
  }

  if (!installation.is_enabled) {
    return { module: null, installation: null, error: 'Module is disabled' }
  }

  // Load module
  const module = await loadStudioModuleForRender(moduleId)
  
  if (!module) {
    return { module: null, installation: null, error: 'Module not found' }
  }

  return { 
    module, 
    installation: {
      id: installation.id,
      settings: installation.settings as Record<string, unknown> || {},
      is_enabled: installation.is_enabled
    }
  }
}

/**
 * Generate embed code snippets for a module installation
 */
export async function generateEmbedCode(
  moduleId: string,
  siteId: string,
  token: string
): Promise<{
  iframe: string
  webComponent: string
  javascript: string
}> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.com'
  const embedUrl = `${baseUrl}/embed/${moduleId}/${siteId}?token=${token}`

  return {
    // Simple iFrame embed
    iframe: `<iframe 
  src="${embedUrl}"
  width="100%" 
  height="600"
  frameborder="0"
  allow="clipboard-write"
  loading="lazy"
></iframe>`,

    // Web Component (requires loading script first)
    webComponent: `<!-- Load DRAMAC Embed Script -->
<script src="${baseUrl}/embed/dramac-embed.js"></script>

<!-- Use the module -->
<dramac-module 
  module-id="${moduleId}" 
  site-id="${siteId}"
  token="${token}"
  theme="auto"
></dramac-module>`,

    // JavaScript SDK
    javascript: `<!-- DRAMAC Module SDK -->
<script src="${baseUrl}/embed/dramac-sdk.js"></script>
<div id="dramac-module-container"></div>
<script>
  DramacSDK.init({
    moduleId: '${moduleId}',
    siteId: '${siteId}',
    token: '${token}',
    container: '#dramac-module-container',
    theme: 'auto',
    onReady: function(module) {
      console.log('Module loaded:', module.name);
    },
    onEvent: function(event, data) {
      console.log('Module event:', event, data);
    }
  });
</script>`
  }
}

/**
 * Create embed token for a module installation
 */
export async function createEmbedToken(
  siteId: string,
  moduleId: string,
  expiresInDays: number = 365
): Promise<{ token: string; expiresAt: Date }> {
  const supabase = await createClient()
  
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  // Generate secure token
  const tokenData = {
    siteId,
    moduleId,
    exp: expiresAt.getTime()
  }
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64url')

  // Store token (optional - for revocation capability)
  await supabase
    .from('module_embed_tokens')
    .upsert({
      site_id: siteId,
      module_id: moduleId,
      token_hash: hashToken(token),
      expires_at: expiresAt.toISOString()
    }, {
      onConflict: 'site_id,module_id'
    })

  return { token, expiresAt }
}

function hashToken(token: string): string {
  // Simple hash for storage - use proper crypto in production
  return Buffer.from(token).toString('base64')
}
```

---

### Task 3: Embed Authentication (1 hour)

```typescript
// src/lib/modules/embed/embed-auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Validate an embed token
 */
export async function validateEmbedToken(
  token: string,
  siteId: string,
  moduleId: string
): Promise<boolean> {
  if (!token) return false

  try {
    // Decode token
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
    
    // Check expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return false
    }

    // Verify siteId and moduleId match
    if (decoded.siteId !== siteId || decoded.moduleId !== moduleId) {
      return false
    }

    // Optional: Check against stored tokens for revocation
    const supabase = await createClient()
    const { data: storedToken } = await supabase
      .from('module_embed_tokens')
      .select('id, is_revoked')
      .eq('site_id', siteId)
      .eq('module_id', moduleId)
      .single()

    if (storedToken?.is_revoked) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Revoke an embed token
 */
export async function revokeEmbedToken(
  siteId: string,
  moduleId: string
): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('module_embed_tokens')
    .update({ is_revoked: true })
    .eq('site_id', siteId)
    .eq('module_id', moduleId)

  return !error
}
```

---

### Task 4: Web Component Script (2 hours)

```typescript
// public/embed/dramac-embed.js

(function() {
  'use strict';

  // Define the custom element
  class DramacModule extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._iframe = null;
      this._ready = false;
    }

    static get observedAttributes() {
      return ['module-id', 'site-id', 'token', 'theme', 'width', 'height'];
    }

    connectedCallback() {
      this.render();
      this.setupMessageListener();
    }

    disconnectedCallback() {
      window.removeEventListener('message', this._messageHandler);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this._iframe) {
        this.render();
      }
    }

    render() {
      const moduleId = this.getAttribute('module-id');
      const siteId = this.getAttribute('site-id');
      const token = this.getAttribute('token');
      const theme = this.getAttribute('theme') || 'auto';
      const width = this.getAttribute('width') || '100%';
      const height = this.getAttribute('height') || '500px';

      if (!moduleId || !siteId || !token) {
        this.shadowRoot.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #ef4444;">
            Missing required attributes: module-id, site-id, token
          </div>
        `;
        return;
      }

      const baseUrl = this.getAttribute('base-url') || 'https://app.dramac.com';
      const embedUrl = `${baseUrl}/embed/${moduleId}/${siteId}?token=${token}&theme=${theme}`;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: ${width};
            min-height: ${height};
          }
          iframe {
            width: 100%;
            height: 100%;
            min-height: ${height};
            border: none;
            background: transparent;
          }
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: ${height};
            color: #666;
          }
        </style>
        <div class="loading" id="loading">Loading module...</div>
        <iframe 
          src="${embedUrl}"
          allow="clipboard-write"
          loading="lazy"
          style="display: none;"
        ></iframe>
      `;

      this._iframe = this.shadowRoot.querySelector('iframe');
    }

    setupMessageListener() {
      this._messageHandler = (event) => {
        const data = event.data;
        
        if (data.type === 'DRAMAC_MODULE_READY') {
          this._ready = true;
          const loading = this.shadowRoot.getElementById('loading');
          if (loading) loading.style.display = 'none';
          if (this._iframe) this._iframe.style.display = 'block';
          
          this.dispatchEvent(new CustomEvent('ready', { 
            detail: { moduleId: data.moduleId }
          }));
        }

        if (data.type === 'DRAMAC_RESIZE') {
          if (this._iframe) {
            this._iframe.style.height = data.height + 'px';
          }
        }

        if (data.type === 'DRAMAC_EVENT') {
          this.dispatchEvent(new CustomEvent('module-event', {
            detail: data.payload
          }));
        }
      };

      window.addEventListener('message', this._messageHandler);
    }

    // Public API
    updateSettings(settings) {
      if (this._iframe && this._ready) {
        this._iframe.contentWindow.postMessage({
          type: 'DRAMAC_SETTINGS_UPDATE',
          settings
        }, '*');
      }
    }

    setTheme(theme) {
      if (this._iframe && this._ready) {
        this._iframe.contentWindow.postMessage({
          type: 'DRAMAC_THEME_CHANGE',
          theme
        }, '*');
      }
    }
  }

  // Register the custom element
  if (!customElements.get('dramac-module')) {
    customElements.define('dramac-module', DramacModule);
  }
})();
```

---

### Task 5: JavaScript SDK (2 hours)

```typescript
// public/embed/dramac-sdk.js

(function(global) {
  'use strict';

  const DramacSDK = {
    _instances: new Map(),
    _baseUrl: 'https://app.dramac.com',

    /**
     * Initialize a module
     */
    init: function(options) {
      const {
        moduleId,
        siteId,
        token,
        container,
        theme = 'auto',
        width = '100%',
        height = '500px',
        onReady,
        onEvent,
        onError
      } = options;

      if (!moduleId || !siteId || !token) {
        console.error('DramacSDK: Missing required options');
        if (onError) onError(new Error('Missing required options'));
        return null;
      }

      const containerEl = typeof container === 'string' 
        ? document.querySelector(container)
        : container;

      if (!containerEl) {
        console.error('DramacSDK: Container not found');
        if (onError) onError(new Error('Container not found'));
        return null;
      }

      // Create instance
      const instanceId = `dramac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const instance = {
        id: instanceId,
        moduleId,
        siteId,
        container: containerEl,
        iframe: null,
        ready: false,
        callbacks: { onReady, onEvent, onError }
      };

      // Create iframe
      const iframe = document.createElement('iframe');
      const embedUrl = `${this._baseUrl}/embed/${moduleId}/${siteId}?token=${token}&theme=${theme}`;
      
      iframe.src = embedUrl;
      iframe.style.cssText = `
        width: ${width};
        min-height: ${height};
        border: none;
        background: transparent;
      `;
      iframe.allow = 'clipboard-write';
      iframe.loading = 'lazy';
      iframe.id = instanceId;

      instance.iframe = iframe;
      this._instances.set(instanceId, instance);

      // Setup message listener
      this._setupMessageListener(instance);

      // Add to DOM
      containerEl.appendChild(iframe);

      return {
        id: instanceId,
        
        updateSettings: (settings) => {
          this.updateSettings(instanceId, settings);
        },
        
        setTheme: (theme) => {
          this.setTheme(instanceId, theme);
        },
        
        destroy: () => {
          this.destroy(instanceId);
        },
        
        sendMessage: (type, payload) => {
          this.sendMessage(instanceId, type, payload);
        }
      };
    },

    /**
     * Setup message listener for an instance
     */
    _setupMessageListener: function(instance) {
      const handler = (event) => {
        const data = event.data;

        // Verify message is from our iframe
        if (event.source !== instance.iframe?.contentWindow) return;

        switch (data.type) {
          case 'DRAMAC_MODULE_READY':
            instance.ready = true;
            if (instance.callbacks.onReady) {
              instance.callbacks.onReady({
                moduleId: data.moduleId,
                siteId: data.siteId
              });
            }
            break;

          case 'DRAMAC_RESIZE':
            if (instance.iframe) {
              instance.iframe.style.height = data.height + 'px';
            }
            break;

          case 'DRAMAC_EVENT':
            if (instance.callbacks.onEvent) {
              instance.callbacks.onEvent(data.event, data.payload);
            }
            break;

          case 'DRAMAC_ERROR':
            if (instance.callbacks.onError) {
              instance.callbacks.onError(new Error(data.message));
            }
            break;
        }
      };

      window.addEventListener('message', handler);
      instance._messageHandler = handler;
    },

    /**
     * Update module settings
     */
    updateSettings: function(instanceId, settings) {
      const instance = this._instances.get(instanceId);
      if (instance?.ready && instance.iframe) {
        instance.iframe.contentWindow.postMessage({
          type: 'DRAMAC_SETTINGS_UPDATE',
          settings
        }, '*');
      }
    },

    /**
     * Set theme
     */
    setTheme: function(instanceId, theme) {
      const instance = this._instances.get(instanceId);
      if (instance?.ready && instance.iframe) {
        instance.iframe.contentWindow.postMessage({
          type: 'DRAMAC_THEME_CHANGE',
          theme
        }, '*');
      }
    },

    /**
     * Send custom message to module
     */
    sendMessage: function(instanceId, type, payload) {
      const instance = this._instances.get(instanceId);
      if (instance?.ready && instance.iframe) {
        instance.iframe.contentWindow.postMessage({
          type: 'DRAMAC_CUSTOM_MESSAGE',
          customType: type,
          payload
        }, '*');
      }
    },

    /**
     * Destroy an instance
     */
    destroy: function(instanceId) {
      const instance = this._instances.get(instanceId);
      if (instance) {
        window.removeEventListener('message', instance._messageHandler);
        if (instance.iframe && instance.iframe.parentNode) {
          instance.iframe.parentNode.removeChild(instance.iframe);
        }
        this._instances.delete(instanceId);
      }
    },

    /**
     * Configure SDK
     */
    configure: function(options) {
      if (options.baseUrl) this._baseUrl = options.baseUrl;
    }
  };

  // Export to global
  global.DramacSDK = DramacSDK;

})(typeof window !== 'undefined' ? window : this);
```

---

### Task 6: Database Schema for Tokens (30 minutes)

```sql
-- migrations/20260119000002_module_embed_tokens.sql

CREATE TABLE IF NOT EXISTS module_embed_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  module_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, module_id)
);

CREATE INDEX idx_embed_tokens_site ON module_embed_tokens(site_id);
CREATE INDEX idx_embed_tokens_module ON module_embed_tokens(module_id);
CREATE INDEX idx_embed_tokens_expires ON module_embed_tokens(expires_at);

-- RLS
ALTER TABLE module_embed_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "embed_tokens_site_access" ON module_embed_tokens
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE am.user_id = auth.uid()
    )
  );
```

---

### Task 7: Embed Code Generator UI (2 hours)

```tsx
// src/components/modules/embed/embed-code-generator.tsx
'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Code2, Globe, Braces } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateEmbedCode, createEmbedToken } from '@/lib/modules/embed/embed-service'
import { toast } from 'sonner'

interface EmbedCodeGeneratorProps {
  moduleId: string
  siteId: string
  moduleName: string
}

export function EmbedCodeGenerator({ moduleId, siteId, moduleName }: EmbedCodeGeneratorProps) {
  const [embedCodes, setEmbedCodes] = useState<{
    iframe: string
    webComponent: string
    javascript: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    async function loadEmbedCodes() {
      setLoading(true)
      try {
        // Generate token
        const { token } = await createEmbedToken(siteId, moduleId, 365)
        
        // Generate codes
        const codes = await generateEmbedCode(moduleId, siteId, token)
        setEmbedCodes(codes)
      } catch (error) {
        toast.error('Failed to generate embed codes')
      } finally {
        setLoading(false)
      }
    }

    loadEmbedCodes()
  }, [moduleId, siteId])

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            Loading embed codes...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!embedCodes) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-destructive">
            Failed to generate embed codes
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Embed {moduleName}
        </CardTitle>
        <CardDescription>
          Use any of these methods to embed this module on external websites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="iframe">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="iframe" className="gap-2">
              <Globe className="h-4 w-4" />
              iFrame
            </TabsTrigger>
            <TabsTrigger value="webcomponent" className="gap-2">
              <Code2 className="h-4 w-4" />
              Web Component
            </TabsTrigger>
            <TabsTrigger value="javascript" className="gap-2">
              <Braces className="h-4 w-4" />
              JavaScript SDK
            </TabsTrigger>
          </TabsList>

          <TabsContent value="iframe" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The simplest way to embed. Works on any website including WordPress, Wix, Squarespace, etc.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{embedCodes.iframe}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedCodes.iframe, 'iframe')}
                >
                  {copied === 'iframe' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webcomponent" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use Web Components for better integration with modern frameworks like React, Vue, or Angular.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{embedCodes.webComponent}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedCodes.webComponent, 'webcomponent')}
                >
                  {copied === 'webcomponent' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="javascript" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Full SDK for deep integration with event handling, settings updates, and more control.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{embedCodes.javascript}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedCodes.javascript, 'javascript')}
                >
                  {copied === 'javascript' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-medium text-amber-800 dark:text-amber-200">Security Note</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            The embed token expires in 1 year. You can regenerate it anytime from settings.
            If you suspect the token has been compromised, revoke it immediately.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## ✅ Verification Checklist

After implementing all tasks:

- [ ] `/embed/:moduleId/:siteId` route works
- [ ] Token validation blocks invalid requests
- [ ] iFrame embed renders module correctly
- [ ] Web Component loads and functions
- [ ] JavaScript SDK provides full API
- [ ] PostMessage communication works
- [ ] Auto-resize adjusts iframe height
- [ ] Theme switching works
- [ ] Settings can be updated from parent
- [ ] Embed code generator UI works
- [ ] Token can be revoked

---

## 🔒 Security Considerations

1. **Token Security**: Tokens should be treated as API keys - never commit to public repos
2. **CORS**: Embed endpoints should have proper CORS configuration
3. **CSP**: Content Security Policy should allow frame-ancestors from any origin
4. **Rate Limiting**: Embed endpoints should be rate limited
5. **Referrer Checking**: Optional - validate allowed referrer domains

---

## 📝 Next Phase

After EM-30, proceed to **PHASE-EM-31-STANDALONE-MODULE-HOSTING.md** for:
- Custom domain support for modules
- White-label standalone deployments
- SSL certificate management

