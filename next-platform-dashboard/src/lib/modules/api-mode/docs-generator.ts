/**
 * Phase EM-33: API Documentation Generator
 * 
 * Generates API documentation in multiple formats:
 * - OpenAPI 3.0 specification
 * - Markdown documentation
 * - Postman collection
 * 
 * @see phases/enterprise-modules/PHASE-EM-33-API-ONLY-MODE.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { EntityConfig, FieldConfig, FieldType } from './rest-api-generator';

// ============================================================
// TYPES
// ============================================================

export interface DocsOptions {
  includeExamples?: boolean;
  includeSchemas?: boolean;
  serverDescription?: string;
  contactEmail?: string;
  licenseUrl?: string;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: { email: string };
    license?: { name: string; url: string };
  };
  servers: Array<{ url: string; description: string }>;
  security: Array<{ [key: string]: string[] }>;
  components: {
    securitySchemes: Record<string, any>;
    schemas: Record<string, any>;
  };
  paths: Record<string, any>;
  tags: Array<{ name: string; description: string }>;
}

// ============================================================
// API DOCS GENERATOR CLASS
// ============================================================

export class APIDocsGenerator {
  private moduleName: string;
  private version: string;
  private baseUrl: string;
  private entities: EntityConfig[];
  private options: DocsOptions;

  constructor(
    moduleName: string,
    version: string,
    baseUrl: string,
    entities: EntityConfig[],
    options: DocsOptions = {}
  ) {
    this.moduleName = moduleName;
    this.version = version;
    this.baseUrl = baseUrl;
    this.entities = entities;
    this.options = {
      includeExamples: true,
      includeSchemas: true,
      serverDescription: 'API Server',
      ...options
    };
  }

  // ============================================================
  // OPENAPI SPECIFICATION
  // ============================================================

  /**
   * Generate OpenAPI 3.0 specification
   */
  generateOpenAPI(): OpenAPISpec {
    return {
      openapi: '3.0.3',
      info: {
        title: `${this.moduleName} API`,
        version: this.version,
        description: `REST API for the ${this.moduleName} module.\n\n## Authentication\nAll API requests require a valid API key passed in the Authorization header as a Bearer token.`,
        ...(this.options.contactEmail && { contact: { email: this.options.contactEmail } }),
        ...(this.options.licenseUrl && { license: { name: 'MIT', url: this.options.licenseUrl } })
      },
      servers: [
        { url: this.baseUrl, description: this.options.serverDescription || 'API Server' }
      ],
      security: [
        { bearerAuth: [] }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API Key',
            description: 'API key authentication. Use your API key as the Bearer token.'
          }
        },
        schemas: this.generateSchemas()
      },
      paths: this.generatePaths(),
      tags: this.entities.map(e => ({
        name: this.toPascalCase(e.name),
        description: `Operations for ${this.toPascalCase(e.name)} resources`
      }))
    };
  }

  /**
   * Generate component schemas
   */
  private generateSchemas(): Record<string, any> {
    const schemas: Record<string, any> = {
      // Common schemas
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 }
        },
        required: ['page', 'limit', 'total', 'totalPages']
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Error message' },
          details: {
            type: 'array',
            items: { type: 'string' },
            description: 'Detailed error messages'
          }
        },
        required: ['error']
      },
      DeleteResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true }
        },
        required: ['success']
      }
    };

    // Entity schemas
    for (const entity of this.entities) {
      const name = this.toPascalCase(entity.name);
      
      // Main entity schema
      schemas[name] = {
        type: 'object',
        properties: this.fieldsToProperties(
          entity.fields.filter(f => !f.hidden)
        ),
        required: entity.fields
          .filter(f => f.required && !f.hidden)
          .map(f => f.name)
      };

      // Create input schema
      schemas[`Create${name}Input`] = {
        type: 'object',
        properties: this.fieldsToProperties(
          entity.fields.filter(f => !f.hidden && !f.readonly && f.name !== 'id')
        ),
        required: entity.fields
          .filter(f => f.required && !f.hidden && !f.readonly && f.name !== 'id' && f.default === undefined)
          .map(f => f.name)
      };

      // Update input schema
      schemas[`Update${name}Input`] = {
        type: 'object',
        properties: this.fieldsToProperties(
          entity.fields.filter(f => !f.hidden && !f.readonly && f.name !== 'id')
        )
      };

      // List response schema
      schemas[`${name}ListResponse`] = {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: `#/components/schemas/${name}` }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        },
        required: ['data', 'pagination']
      };

      // Single item response schema
      schemas[`${name}Response`] = {
        type: 'object',
        properties: {
          data: { $ref: `#/components/schemas/${name}` }
        },
        required: ['data']
      };
    }

    return schemas;
  }

  /**
   * Generate API paths
   */
  private generatePaths(): Record<string, any> {
    const paths: Record<string, any> = {};

    for (const entity of this.entities) {
      const name = entity.name;
      const typeName = this.toPascalCase(name);

      // Collection endpoints (list/create)
      if (entity.operations.includes('list') || entity.operations.includes('create')) {
        paths[`/${name}`] = {};

        if (entity.operations.includes('list')) {
          paths[`/${name}`].get = this.generateListEndpoint(entity, typeName);
        }

        if (entity.operations.includes('create')) {
          paths[`/${name}`].post = this.generateCreateEndpoint(entity, typeName);
        }
      }

      // Item endpoints (read/update/delete)
      if (entity.operations.includes('read') || 
          entity.operations.includes('update') || 
          entity.operations.includes('delete')) {
        paths[`/${name}/{id}`] = {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: `The ${typeName} ID`
            }
          ]
        };

        if (entity.operations.includes('read')) {
          paths[`/${name}/{id}`].get = this.generateReadEndpoint(entity, typeName);
        }

        if (entity.operations.includes('update')) {
          paths[`/${name}/{id}`].patch = this.generateUpdateEndpoint(entity, typeName);
        }

        if (entity.operations.includes('delete')) {
          paths[`/${name}/{id}`].delete = this.generateDeleteEndpoint(entity, typeName);
        }
      }
    }

    return paths;
  }

  private generateListEndpoint(entity: EntityConfig, typeName: string): any {
    const parameters = [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1, minimum: 1 },
        description: 'Page number'
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
        description: 'Items per page'
      },
      {
        name: 'sort',
        in: 'query',
        schema: { type: 'string', enum: entity.sortable || ['created_at'] },
        description: 'Field to sort by'
      },
      {
        name: 'order',
        in: 'query',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        description: 'Sort order'
      },
      {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Search query'
      },
      ...(entity.filters || []).map(f => ({
        name: f,
        in: 'query',
        schema: { type: 'string' },
        description: `Filter by ${f}`
      }))
    ];

    return {
      summary: `List ${typeName}s`,
      description: `Retrieve a paginated list of ${typeName}s with optional filtering and sorting.`,
      tags: [typeName],
      parameters,
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${typeName}ListResponse` }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    };
  }

  private generateCreateEndpoint(entity: EntityConfig, typeName: string): any {
    return {
      summary: `Create ${typeName}`,
      description: `Create a new ${typeName}.`,
      tags: [typeName],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/Create${typeName}Input` }
          }
        }
      },
      responses: {
        201: {
          description: 'Created successfully',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${typeName}Response` }
            }
          }
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    };
  }

  private generateReadEndpoint(entity: EntityConfig, typeName: string): any {
    return {
      summary: `Get ${typeName}`,
      description: `Retrieve a single ${typeName} by ID.`,
      tags: [typeName],
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${typeName}Response` }
            }
          }
        },
        404: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    };
  }

  private generateUpdateEndpoint(entity: EntityConfig, typeName: string): any {
    return {
      summary: `Update ${typeName}`,
      description: `Update an existing ${typeName}.`,
      tags: [typeName],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/Update${typeName}Input` }
          }
        }
      },
      responses: {
        200: {
          description: 'Updated successfully',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${typeName}Response` }
            }
          }
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    };
  }

  private generateDeleteEndpoint(entity: EntityConfig, typeName: string): any {
    return {
      summary: `Delete ${typeName}`,
      description: `Delete a ${typeName} by ID.`,
      tags: [typeName],
      responses: {
        200: {
          description: 'Deleted successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeleteResponse' }
            }
          }
        },
        404: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    };
  }

  // ============================================================
  // MARKDOWN DOCUMENTATION
  // ============================================================

  /**
   * Generate Markdown documentation
   */
  generateMarkdown(): string {
    const sections = this.entities.map(e => this.generateEntityDocs(e)).join('\n\n---\n\n');

    return `# ${this.moduleName} API Documentation

Version: ${this.version}

Base URL: \`${this.baseUrl}\`

## Authentication

All API requests require authentication using an API key. Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Rate Limiting

- **Per minute:** 60 requests per API key
- **Per day:** 10,000 requests per API key

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining in current window
- \`X-RateLimit-Reset\`: Time when the rate limit resets (Unix timestamp)

## Response Format

All responses are JSON formatted:

### Success Response
\`\`\`json
{
  "data": { ... }
}
\`\`\`

### List Response
\`\`\`json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
\`\`\`

### Error Response
\`\`\`json
{
  "error": "Error message",
  "details": ["Field validation error 1", "Field validation error 2"]
}
\`\`\`

## HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters or validation error |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Server Error - Something went wrong |

---

${sections}

---

## Webhooks

Configure webhooks to receive real-time notifications when events occur.

### Event Types

${this.entities.map(e => {
  const events = [];
  if (e.operations.includes('create')) events.push(`- \`${e.name}.created\` - When a ${e.name} is created`);
  if (e.operations.includes('update')) events.push(`- \`${e.name}.updated\` - When a ${e.name} is updated`);
  if (e.operations.includes('delete')) events.push(`- \`${e.name}.deleted\` - When a ${e.name} is deleted`);
  return events.join('\n');
}).join('\n')}
- \`*\` - Subscribe to all events

### Webhook Payload

\`\`\`json
{
  "event": "product.created",
  "data": { ... },
  "timestamp": "2026-01-23T12:00:00Z"
}
\`\`\`

### Verifying Webhooks

All webhooks include an \`X-Signature\` header containing an HMAC-SHA256 signature:

\`\`\`
X-Signature: sha256=<signature>
\`\`\`

Verify the signature by computing HMAC-SHA256 of the raw request body using your webhook secret.
`;
  }

  /**
   * Generate documentation for a single entity
   */
  private generateEntityDocs(entity: EntityConfig): string {
    const name = entity.name;
    const typeName = this.toPascalCase(name);

    const fieldsTable = entity.fields
      .filter(f => !f.hidden)
      .map(f => `| \`${f.name}\` | ${this.mapOpenAPIType(f.type)} | ${f.required ? '✓' : ''} | ${f.readonly ? 'Read-only' : ''} |`)
      .join('\n');

    let docs = `## ${typeName}

### Fields

| Name | Type | Required | Notes |
|------|------|----------|-------|
${fieldsTable}

### Endpoints
`;

    if (entity.operations.includes('list')) {
      const filters = entity.filters || [];
      docs += `
#### List ${typeName}s

\`\`\`http
GET /${name}
\`\`\`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| \`page\` | integer | 1 | Page number |
| \`limit\` | integer | 20 | Items per page (max: 100) |
| \`sort\` | string | created_at | Field to sort by |
| \`order\` | string | desc | Sort order (asc/desc) |
| \`search\` | string | - | Search query |
${filters.map(f => `| \`${f}\` | string | - | Filter by ${f} |`).join('\n')}

**Example:**
\`\`\`bash
curl -X GET "${this.baseUrl}/${name}?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`
`;
    }

    if (entity.operations.includes('read')) {
      docs += `
#### Get ${typeName}

\`\`\`http
GET /${name}/{id}
\`\`\`

**Example:**
\`\`\`bash
curl -X GET "${this.baseUrl}/${name}/UUID" \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`
`;
    }

    if (entity.operations.includes('create')) {
      const createFields = entity.fields
        .filter(f => !f.readonly && !f.hidden && f.name !== 'id')
        .slice(0, 3)
        .map(f => `  "${f.name}": "${this.getExampleValue(f)}"`)
        .join(',\n');

      docs += `
#### Create ${typeName}

\`\`\`http
POST /${name}
\`\`\`

**Request Body:**
\`\`\`json
{
${createFields}
}
\`\`\`

**Example:**
\`\`\`bash
curl -X POST "${this.baseUrl}/${name}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ ... }'
\`\`\`
`;
    }

    if (entity.operations.includes('update')) {
      docs += `
#### Update ${typeName}

\`\`\`http
PATCH /${name}/{id}
\`\`\`

**Request Body:** JSON object with fields to update

**Example:**
\`\`\`bash
curl -X PATCH "${this.baseUrl}/${name}/UUID" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "field": "new value" }'
\`\`\`
`;
    }

    if (entity.operations.includes('delete')) {
      docs += `
#### Delete ${typeName}

\`\`\`http
DELETE /${name}/{id}
\`\`\`

**Example:**
\`\`\`bash
curl -X DELETE "${this.baseUrl}/${name}/UUID" \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`
`;
    }

    return docs;
  }

  // ============================================================
  // POSTMAN COLLECTION
  // ============================================================

  /**
   * Generate Postman collection
   */
  generatePostmanCollection(): object {
    const items = this.entities.flatMap(entity => {
      const name = entity.name;
      const typeName = this.toPascalCase(name);
      const entityItems: any[] = [];

      if (entity.operations.includes('list')) {
        entityItems.push({
          name: `List ${typeName}s`,
          request: {
            method: 'GET',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}' }
            ],
            url: {
              raw: `{{baseUrl}}/${name}?page=1&limit=20`,
              host: ['{{baseUrl}}'],
              path: [name],
              query: [
                { key: 'page', value: '1' },
                { key: 'limit', value: '20' }
              ]
            }
          }
        });
      }

      if (entity.operations.includes('read')) {
        entityItems.push({
          name: `Get ${typeName}`,
          request: {
            method: 'GET',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}' }
            ],
            url: {
              raw: `{{baseUrl}}/${name}/{{${name}Id}}`,
              host: ['{{baseUrl}}'],
              path: [name, `{{${name}Id}}`]
            }
          }
        });
      }

      if (entity.operations.includes('create')) {
        const body = Object.fromEntries(
          entity.fields
            .filter(f => !f.readonly && !f.hidden && f.name !== 'id')
            .map(f => [f.name, this.getExampleValue(f)])
        );

        entityItems.push({
          name: `Create ${typeName}`,
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(body, null, 2)
            },
            url: {
              raw: `{{baseUrl}}/${name}`,
              host: ['{{baseUrl}}'],
              path: [name]
            }
          }
        });
      }

      if (entity.operations.includes('update')) {
        entityItems.push({
          name: `Update ${typeName}`,
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}' },
              { key: 'Content-Type', value: 'application/json' }
            ],
            body: {
              mode: 'raw',
              raw: '{}'
            },
            url: {
              raw: `{{baseUrl}}/${name}/{{${name}Id}}`,
              host: ['{{baseUrl}}'],
              path: [name, `{{${name}Id}}`]
            }
          }
        });
      }

      if (entity.operations.includes('delete')) {
        entityItems.push({
          name: `Delete ${typeName}`,
          request: {
            method: 'DELETE',
            header: [
              { key: 'Authorization', value: 'Bearer {{apiKey}}' }
            ],
            url: {
              raw: `{{baseUrl}}/${name}/{{${name}Id}}`,
              host: ['{{baseUrl}}'],
              path: [name, `{{${name}Id}}`]
            }
          }
        });
      }

      return {
        name: typeName,
        item: entityItems
      };
    });

    return {
      info: {
        name: `${this.moduleName} API`,
        description: `API collection for ${this.moduleName}`,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      variable: [
        { key: 'baseUrl', value: this.baseUrl },
        { key: 'apiKey', value: 'YOUR_API_KEY' }
      ],
      item: items
    };
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private fieldsToProperties(fields: FieldConfig[]): Record<string, any> {
    const properties: Record<string, any> = {};
    
    for (const field of fields) {
      properties[field.name] = {
        type: this.mapOpenAPIType(field.type),
        ...(this.options.includeExamples && { example: this.getExampleValue(field) })
      };

      if (field.type === 'array') {
        properties[field.name].items = { type: 'string' };
      }
    }
    
    return properties;
  }

  private mapOpenAPIType(type: FieldType): string {
    const map: Record<FieldType, string> = {
      uuid: 'string',
      string: 'string',
      text: 'string',
      integer: 'integer',
      number: 'number',
      decimal: 'number',
      boolean: 'boolean',
      timestamp: 'string',
      timestamptz: 'string',
      date: 'string',
      array: 'array',
      jsonb: 'object',
      object: 'object'
    };
    return map[type] || 'string';
  }

  private getExampleValue(field: FieldConfig): any {
    switch (field.type) {
      case 'uuid':
        return '550e8400-e29b-41d4-a716-446655440000';
      case 'string':
      case 'text':
        return `Example ${field.name}`;
      case 'integer':
        return 1;
      case 'number':
      case 'decimal':
        return 1.5;
      case 'boolean':
        return true;
      case 'timestamp':
      case 'timestamptz':
      case 'date':
        return '2026-01-23T12:00:00Z';
      case 'array':
        return ['item1', 'item2'];
      case 'jsonb':
      case 'object':
        return { key: 'value' };
      default:
        return 'example';
    }
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

/**
 * Create an API documentation generator
 */
export function createAPIDocsGenerator(
  moduleName: string,
  version: string,
  baseUrl: string,
  entities: EntityConfig[],
  options?: DocsOptions
): APIDocsGenerator {
  return new APIDocsGenerator(moduleName, version, baseUrl, entities, options);
}
