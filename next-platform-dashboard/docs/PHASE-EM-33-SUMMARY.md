# Phase EM-33: API-Only Mode - Implementation Summary

**Completed**: January 23, 2026  
**Status**: ✅ COMPLETE  
**TypeScript**: ✅ Compiles without errors

## Overview

Phase EM-33 enables modules to run in headless/API-only mode for programmatic access. This allows external applications to interact with module data through REST APIs, GraphQL, and receive real-time notifications via webhooks.

## Features Implemented

### 1. REST API Generator
- Dynamic REST endpoints for all module entities
- Full CRUD operations (GET, POST, PUT, DELETE)
- Scoped access control based on API consumer permissions
- Pagination, filtering, and sorting support
- Response time logging

**Endpoints:**
- `GET /api/modules/{moduleId}/data/{entity}` - List entities
- `GET /api/modules/{moduleId}/data/{entity}/{id}` - Get single entity
- `POST /api/modules/{moduleId}/data/{entity}` - Create entity
- `PUT /api/modules/{moduleId}/data/{entity}/{id}` - Update entity
- `DELETE /api/modules/{moduleId}/data/{entity}/{id}` - Delete entity

### 2. GraphQL API
- Auto-generated schema from module entity definitions
- Query and mutation support
- Type-safe operations
- Variable support
- Introspection support

**Endpoint:**
- `POST /api/modules/{moduleId}/graphql`

### 3. API Consumer Management
- Create API consumers with unique keys (`dk_` prefix)
- Scope-based access control
- Endpoint whitelisting
- Rate limiting (per-minute and per-day)
- IP address whitelisting
- Key rotation without downtime
- Usage statistics and analytics

**Endpoints:**
- `GET /api/modules/{moduleId}/api-consumers` - List consumers
- `POST /api/modules/{moduleId}/api-consumers` - Create consumer
- `GET /api/modules/{moduleId}/api-consumers/{id}` - Get consumer
- `PATCH /api/modules/{moduleId}/api-consumers/{id}` - Update consumer
- `DELETE /api/modules/{moduleId}/api-consumers/{id}` - Delete consumer
- `POST /api/modules/{moduleId}/api-consumers/{id}/rotate-key` - Rotate API key
- `GET /api/modules/{moduleId}/api-consumers/{id}/usage` - Get usage stats

### 4. Webhook System
- Register webhooks for module events
- HMAC-SHA256 payload signing (`whsec_` secret prefix)
- Custom headers support
- Retry logic with exponential backoff (3 attempts)
- Delivery history tracking
- Test webhook functionality

**Endpoints:**
- `GET /api/modules/{moduleId}/webhooks` - List webhooks
- `POST /api/modules/{moduleId}/webhooks` - Register webhook
- `GET /api/modules/{moduleId}/webhooks/{id}` - Get webhook
- `PATCH /api/modules/{moduleId}/webhooks/{id}` - Update webhook
- `DELETE /api/modules/{moduleId}/webhooks/{id}` - Delete webhook
- `GET /api/modules/{moduleId}/webhooks/{id}/deliveries` - Get delivery history
- `POST /api/modules/{moduleId}/webhooks/{id}/test` - Send test delivery

### 5. SDK Generation
- TypeScript SDK with full type safety
- JavaScript SDK with JSDoc comments
- Python SDK with type hints
- Configurable base URL

**Endpoint:**
- `GET /api/modules/{moduleId}/sdk?language={ts|js|python}&siteModuleInstallationId={id}`

### 6. API Documentation
- OpenAPI 3.0 specification (JSON/YAML)
- Markdown documentation
- Postman collection export
- Authentication instructions included

**Endpoint:**
- `GET /api/modules/{moduleId}/docs?format={openapi|markdown|postman}&siteModuleInstallationId={id}`

## Database Schema

New tables created:

```sql
-- API Consumers
CREATE TABLE module_api_consumers (
  id UUID PRIMARY KEY,
  site_module_installation_id UUID REFERENCES site_module_installations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  api_key_hash VARCHAR(255) NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  allowed_endpoints TEXT[] DEFAULT '{}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  allowed_ips TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- API Request Logs
CREATE TABLE module_api_requests (
  id UUID PRIMARY KEY,
  consumer_id UUID REFERENCES module_api_consumers(id),
  site_module_installation_id UUID,
  method VARCHAR(10),
  path TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  graphql_operation TEXT,
  graphql_variables JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE module_api_webhooks (
  id UUID PRIMARY KEY,
  site_module_installation_id UUID REFERENCES site_module_installations(id),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255) NOT NULL,
  custom_headers JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Webhook Deliveries
CREATE TABLE module_api_webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID REFERENCES module_api_webhooks(id),
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20),
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Files Created

### Core Library (`src/lib/modules/api-mode/`)
- `rest-api-generator.ts` - REST API generation and handling
- `graphql-generator.ts` - GraphQL schema/resolver generation
- `sdk-generator.ts` - Client SDK code generation
- `docs-generator.ts` - API documentation generation
- `consumer-service.ts` - API consumer management
- `webhook-delivery.ts` - Webhook delivery service
- `index.ts` - Module exports

### API Routes (`src/app/api/modules/[moduleId]/`)
- `data/[...path]/route.ts` - REST data endpoints
- `graphql/route.ts` - GraphQL endpoint
- `sdk/route.ts` - SDK download endpoint
- `docs/route.ts` - Documentation endpoint
- `api-consumers/route.ts` - Consumer list/create
- `api-consumers/[consumerId]/route.ts` - Consumer CRUD
- `api-consumers/[consumerId]/rotate-key/route.ts` - Key rotation
- `api-consumers/[consumerId]/usage/route.ts` - Usage stats
- `webhooks/route.ts` - Webhook list/create
- `webhooks/[webhookId]/route.ts` - Webhook CRUD
- `webhooks/[webhookId]/deliveries/route.ts` - Delivery history
- `webhooks/[webhookId]/test/route.ts` - Test delivery

### Migration
- `migrations/em-33-api-mode.sql` - Database schema

## Usage Examples

### Creating an API Consumer
```typescript
const response = await fetch('/api/modules/{moduleId}/api-consumers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteModuleInstallationId: 'uuid',
    name: 'My Integration',
    scopes: ['read:products', 'write:products'],
    rateLimitPerMinute: 100,
    rateLimitPerDay: 5000
  })
});

const { apiKey } = await response.json();
// Store apiKey securely - it cannot be retrieved later!
```

### Making API Requests
```typescript
// REST API
const products = await fetch('/api/modules/{moduleId}/data/products', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

// GraphQL
const result = await fetch('/api/modules/{moduleId}/graphql', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `query { products(first: 10) { id name price } }`
  })
});
```

### Registering a Webhook
```typescript
const response = await fetch('/api/modules/{moduleId}/webhooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteModuleInstallationId: 'uuid',
    name: 'Order Notifications',
    targetUrl: 'https://example.com/webhooks',
    events: ['order.created', 'order.updated']
  })
});

const { signingSecret } = await response.json();
// Store signingSecret to verify webhook signatures
```

### Verifying Webhook Signatures
```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expected;
}
```

## Technical Notes

### Supabase Type Casting
The new tables (`module_api_consumers`, `module_api_webhooks`, etc.) are not in the generated Supabase types. All queries use the pattern:

```typescript
const { data } = await (supabase as any)
  .from('module_api_consumers')
  .select('*')
  .eq('id', consumerId)
  .single();
```

This casts the Supabase client before the `.from()` call to bypass strict type checking.

### API Key Format
- API keys use `dk_` prefix (DRAMAC Key)
- Webhook secrets use `whsec_` prefix
- Keys are hashed with bcrypt before storage

### Rate Limiting
Rate limiting uses a sliding window algorithm with in-memory caching. For production, consider:
- Redis for distributed rate limiting
- Database-backed counters for persistence

### Webhook Retry Logic
- 3 retry attempts with exponential backoff
- Delays: 30 seconds, 2 minutes, 10 minutes
- Failed deliveries logged with error messages

## Next Steps

1. **Run Migration**: Execute `migrations/em-33-api-mode.sql` in Supabase
2. **Regenerate Types**: Run `pnpm supabase:types` to update TypeScript types
3. **Test Endpoints**: Create an API consumer and test the REST/GraphQL APIs
4. **Configure Webhooks**: Set up webhook endpoints for event notifications

## Related Phases

- EM-31: External Integration (domain verification, OAuth)
- EM-32: Custom Domains (domain mapping, SSL)
- EM-30: Universal Embed (embed SDK)
