# Phase EM-30: Universal Module Embedding System - Implementation Summary

> **Status**: ✅ IMPLEMENTED  
> **Completed**: January 22, 2026

---

## 📋 Implementation Overview

This phase implements a **Universal Embedding System** that allows DRAMAC modules to be embedded on ANY website - whether built on DRAMAC or not.

---

## 🗂️ Files Created

### Core Embedding Service
| File | Purpose |
|------|---------|
| [src/lib/modules/embed/embed-service.ts](src/lib/modules/embed/embed-service.ts) | Main embed service with token generation and code generation |
| [src/lib/modules/embed/embed-auth.ts](src/lib/modules/embed/embed-auth.ts) | Token validation, revocation, and status checking |
| [src/lib/modules/embed/index.ts](src/lib/modules/embed/index.ts) | Barrel exports for embed module |

### Embed Page Route
| File | Purpose |
|------|---------|
| [src/app/embed/[moduleId]/[siteId]/page.tsx](src/app/embed/[moduleId]/[siteId]/page.tsx) | Dynamic route for rendering embedded modules |
| [src/app/embed/layout.tsx](src/app/embed/layout.tsx) | Minimal layout without dashboard chrome |

### UI Components
| File | Purpose |
|------|---------|
| [src/components/modules/embed/module-embed-renderer.tsx](src/components/modules/embed/module-embed-renderer.tsx) | Client component that renders modules in iframe |
| [src/components/modules/embed/embed-code-generator.tsx](src/components/modules/embed/embed-code-generator.tsx) | UI for generating and managing embed codes |
| [src/components/modules/embed/index.ts](src/components/modules/embed/index.ts) | Barrel exports for embed components |

### Public Scripts
| File | Purpose |
|------|---------|
| [public/embed/dramac-embed.js](public/embed/dramac-embed.js) | Web Component (`<dramac-module>`) for embedding |
| [public/embed/dramac-sdk.js](public/embed/dramac-sdk.js) | Full JavaScript SDK with event handling |

### Database Migration
| File | Purpose |
|------|---------|
| [migrations/em-30-module-embed-tokens.sql](migrations/em-30-module-embed-tokens.sql) | Creates `module_embed_tokens` table |

### Middleware
| File | Purpose |
|------|---------|
| [middleware.ts](middleware.ts) | Root middleware handling CORS and embed route headers |

---

## 🚀 Features Implemented

### 1. Token-Based Authentication
- Secure Base64URL encoded tokens with expiration
- Token storage in database for revocation capability
- Token validation on each embed request
- Regeneration and revocation support

### 2. Three Embedding Methods

#### iFrame Embed (Simplest)
```html
<iframe 
  src="https://app.dramac.com/embed/{moduleId}/{siteId}?token={token}"
  width="100%" 
  height="600"
  frameborder="0"
></iframe>
```

#### Web Component (Modern)
```html
<script src="https://app.dramac.com/embed/dramac-embed.js"></script>
<dramac-module 
  module-id="{moduleId}" 
  site-id="{siteId}"
  token="{token}"
  theme="auto"
></dramac-module>
```

#### JavaScript SDK (Full Control)
```javascript
DramacSDK.init({
  moduleId: '{moduleId}',
  siteId: '{siteId}',
  token: '{token}',
  container: '#container',
  onReady: (info) => console.log('Ready!'),
  onEvent: (event, data) => console.log('Event:', event)
});
```

### 3. PostMessage Communication
- Module ready events
- Auto-resize support
- Settings updates from parent
- Theme switching
- Custom events from modules

### 4. Security Features
- CORS headers for embed routes
- CSP allowing framing from any origin
- Token expiration (default 1 year)
- Token revocation capability
- RLS policies for token management

---

## 📊 Database Schema

```sql
CREATE TABLE module_embed_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  module_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  allowed_domains TEXT[] DEFAULT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, module_id)
);
```

---

## 🔧 Usage Guide

### Generating Embed Codes

The `EmbedCodeGenerator` component can be used in any module settings page:

```tsx
import { EmbedCodeGenerator } from '@/components/modules/embed'

<EmbedCodeGenerator
  moduleId="module-uuid"
  siteId="site-uuid"
  moduleName="My Module"
  onTokenRevoked={() => console.log('Token revoked')}
/>
```

### Programmatic Token Management

```typescript
import { 
  createEmbedToken, 
  generateEmbedCode 
} from '@/lib/modules/embed/embed-service'

import { 
  validateEmbedToken, 
  revokeEmbedToken,
  checkTokenStatus 
} from '@/lib/modules/embed/embed-auth'

// Create a new token
const { token, expiresAt } = await createEmbedToken(siteId, moduleId, 365)

// Generate embed codes
const codes = await generateEmbedCode(moduleId, siteId, token)

// Validate a token
const isValid = await validateEmbedToken(token, siteId, moduleId)

// Revoke a token
await revokeEmbedToken(siteId, moduleId)

// Check token status
const status = await checkTokenStatus(siteId, moduleId)
```

---

## ✅ Verification Checklist

- [x] `/embed/:moduleId/:siteId` route works
- [x] Token validation blocks invalid requests
- [x] iFrame embed renders module correctly
- [x] Web Component loads and functions
- [x] JavaScript SDK provides full API
- [x] PostMessage communication works
- [x] Auto-resize adjusts iframe height
- [x] Theme switching works
- [x] Settings can be updated from parent
- [x] Embed code generator UI works
- [x] Token can be revoked

---

## 🔄 Migration Required

Run the following migration to create the `module_embed_tokens` table:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL editor
# Copy contents of migrations/em-30-module-embed-tokens.sql
```

---

## 📝 Next Steps

After EM-30, proceed to **PHASE-EM-31-STANDALONE-MODULE-HOSTING.md** for:
- Custom domain support for modules
- White-label standalone deployments
- SSL certificate management
