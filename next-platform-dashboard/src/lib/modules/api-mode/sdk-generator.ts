/**
 * Phase EM-33: SDK Generator
 * 
 * Generates client SDKs for module APIs in multiple languages:
 * - TypeScript (with full type definitions)
 * - JavaScript (CommonJS & ESM)
 * - Python (with dataclasses)
 * 
 * @see phases/enterprise-modules/PHASE-EM-33-API-ONLY-MODE.md
 */

import { EntityConfig, FieldConfig, FieldType } from './rest-api-generator';

// ============================================================
// TYPES
// ============================================================

export type SDKLanguage = 'typescript' | 'javascript' | 'python';

export interface SDKOptions {
  includeComments?: boolean;
  includeExamples?: boolean;
  moduleVersion?: string;
}

export interface GeneratedSDK {
  language: SDKLanguage;
  filename: string;
  content: string;
}

// ============================================================
// SDK GENERATOR CLASS
// ============================================================

export class SDKGenerator {
  private moduleName: string;
  private baseUrl: string;
  private entities: EntityConfig[];
  private options: SDKOptions;

  constructor(
    moduleName: string,
    baseUrl: string,
    entities: EntityConfig[],
    options: SDKOptions = {}
  ) {
    this.moduleName = moduleName;
    this.baseUrl = baseUrl;
    this.entities = entities;
    this.options = {
      includeComments: true,
      includeExamples: false,
      ...options
    };
  }

  /**
   * Generate SDK for specified language
   */
  generate(language: SDKLanguage): GeneratedSDK {
    let content: string;
    let filename: string;

    switch (language) {
      case 'typescript':
        content = this.generateTypeScript();
        filename = `${this.toKebabCase(this.moduleName)}-sdk.ts`;
        break;
      case 'javascript':
        content = this.generateJavaScript();
        filename = `${this.toKebabCase(this.moduleName)}-sdk.js`;
        break;
      case 'python':
        content = this.generatePython();
        filename = `${this.toSnakeCase(this.moduleName)}_sdk.py`;
        break;
    }

    return { language, filename, content };
  }

  /**
   * Generate SDKs for all languages
   */
  generateAll(): GeneratedSDK[] {
    return ['typescript', 'javascript', 'python'].map(lang => 
      this.generate(lang as SDKLanguage)
    );
  }

  // ============================================================
  // TYPESCRIPT SDK
  // ============================================================

  private generateTypeScript(): string {
    const clientName = `${this.toPascalCase(this.moduleName)}Client`;
    const interfaces = this.entities.map(e => this.generateTSInterface(e)).join('\n\n');
    const clientMethods = this.entities.map(e => this.generateTSClientMethods(e)).join('\n');

    return `/**
 * ${this.moduleName} SDK
 * Auto-generated TypeScript client for the ${this.moduleName} API
 * ${this.options.moduleVersion ? `Version: ${this.options.moduleVersion}` : ''}
 * 
 * @example
 * \`\`\`typescript
 * const client = new ${clientName}({ apiKey: 'your-api-key' });
 * const items = await client.list${this.toPascalCase(this.entities[0]?.name || 'Items')}();
 * \`\`\`
 */

// ============================================================
// CONFIGURATION
// ============================================================

export interface SDKConfig {
  /** Your API key for authentication */
  apiKey: string;
  /** Base URL for API requests (optional, uses default if not provided) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom headers to include with all requests */
  headers?: Record<string, string>;
}

// ============================================================
// COMMON TYPES
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page (max 100) */
  limit?: number;
  /** Field to sort by */
  sort?: string;
  /** Sort order */
  order?: 'asc' | 'desc';
  /** Search query */
  search?: string;
  /** Additional filters */
  [key: string]: any;
}

export interface APIError {
  error: string;
  details?: string[];
  status: number;
}

// ============================================================
// ENTITY TYPES
// ============================================================

${interfaces}

// ============================================================
// SDK CLIENT
// ============================================================

export class ${clientName} {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private customHeaders: Record<string, string>;

  constructor(config: SDKConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || '${this.baseUrl}';
    this.timeout = config.timeout || 30000;
    this.customHeaders = config.headers || {};
  }

  /**
   * Make an HTTP request to the API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.customHeaders
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || \`HTTP \${response.status}\`);
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // ============================================================
  // API METHODS
  // ============================================================
${clientMethods}
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default ${clientName};
`;
  }

  /**
   * Generate TypeScript interface for entity
   */
  private generateTSInterface(entity: EntityConfig): string {
    const typeName = this.toPascalCase(entity.name);
    
    const typeFields = entity.fields
      .filter(f => !f.hidden)
      .map(f => {
        const comment = this.options.includeComments ? this.getTSFieldComment(f) : '';
        return `${comment}  ${f.name}${f.required ? '' : '?'}: ${this.mapTSType(f.type)};`;
      })
      .join('\n');

    const createFields = entity.fields
      .filter(f => !f.readonly && !f.hidden && f.name !== 'id')
      .map(f => {
        const required = f.required && f.default === undefined;
        return `  ${f.name}${required ? '' : '?'}: ${this.mapTSType(f.type)};`;
      })
      .join('\n');

    const updateFields = entity.fields
      .filter(f => !f.readonly && !f.hidden && f.name !== 'id')
      .map(f => `  ${f.name}?: ${this.mapTSType(f.type)};`)
      .join('\n');

    return `/** ${typeName} entity */
export interface ${typeName} {
${typeFields}
}

/** Input for creating a ${typeName} */
export interface Create${typeName}Input {
${createFields}
}

/** Input for updating a ${typeName} */
export interface Update${typeName}Input {
${updateFields}
}`;
  }

  /**
   * Generate TypeScript client methods for entity
   */
  private generateTSClientMethods(entity: EntityConfig): string {
    const name = entity.name;
    const typeName = this.toPascalCase(name);
    const methods: string[] = [];

    if (entity.operations.includes('list')) {
      methods.push(`
  /**
   * List ${typeName}s with pagination and filtering
   * @param params - Query parameters
   */
  async list${typeName}s(params?: ListParams): Promise<PaginatedResponse<${typeName}>> {
    return this.request('GET', '/${name}', undefined, params);
  }`);
    }

    if (entity.operations.includes('read')) {
      methods.push(`
  /**
   * Get a single ${typeName} by ID
   * @param id - The ${typeName} ID
   */
  async get${typeName}(id: string): Promise<{ data: ${typeName} }> {
    return this.request('GET', \`/${name}/\${id}\`);
  }`);
    }

    if (entity.operations.includes('create')) {
      methods.push(`
  /**
   * Create a new ${typeName}
   * @param data - The ${typeName} data
   */
  async create${typeName}(data: Create${typeName}Input): Promise<{ data: ${typeName} }> {
    return this.request('POST', '/${name}', data);
  }`);
    }

    if (entity.operations.includes('update')) {
      methods.push(`
  /**
   * Update an existing ${typeName}
   * @param id - The ${typeName} ID
   * @param data - The fields to update
   */
  async update${typeName}(id: string, data: Update${typeName}Input): Promise<{ data: ${typeName} }> {
    return this.request('PATCH', \`/${name}/\${id}\`, data);
  }`);
    }

    if (entity.operations.includes('delete')) {
      methods.push(`
  /**
   * Delete a ${typeName}
   * @param id - The ${typeName} ID
   */
  async delete${typeName}(id: string): Promise<{ success: boolean }> {
    return this.request('DELETE', \`/${name}/\${id}\`);
  }`);
    }

    return methods.join('\n');
  }

  // ============================================================
  // JAVASCRIPT SDK
  // ============================================================

  private generateJavaScript(): string {
    const clientName = `${this.toPascalCase(this.moduleName)}Client`;
    const clientMethods = this.entities.map(e => this.generateJSClientMethods(e)).join('\n');

    return `/**
 * ${this.moduleName} SDK
 * Auto-generated JavaScript client for the ${this.moduleName} API
 * ${this.options.moduleVersion ? `Version: ${this.options.moduleVersion}` : ''}
 * 
 * @example
 * const ${clientName} = require('./${this.toKebabCase(this.moduleName)}-sdk');
 * const client = new ${clientName}({ apiKey: 'your-api-key' });
 * const items = await client.list${this.toPascalCase(this.entities[0]?.name || 'Items')}();
 */

class ${clientName} {
  /**
   * Create a new SDK client
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - Your API key
   * @param {string} [config.baseUrl] - Base URL (optional)
   * @param {number} [config.timeout=30000] - Request timeout in ms
   */
  constructor(config) {
    if (!config || !config.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || '${this.baseUrl}';
    this.timeout = config.timeout || 30000;
    this.customHeaders = config.headers || {};
  }

  /**
   * Make an HTTP request to the API
   * @private
   */
  async request(method, path, body, params) {
    const url = new URL(path, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.customHeaders
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || \`HTTP \${response.status}\`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
${clientMethods}
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${clientName};
}

// ES Module export
export default ${clientName};
`;
  }

  private generateJSClientMethods(entity: EntityConfig): string {
    const name = entity.name;
    const typeName = this.toPascalCase(name);
    const methods: string[] = [];

    if (entity.operations.includes('list')) {
      methods.push(`
  /**
   * List ${typeName}s with pagination
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>} Paginated response
   */
  async list${typeName}s(params) {
    return this.request('GET', '/${name}', undefined, params);
  }`);
    }

    if (entity.operations.includes('read')) {
      methods.push(`
  /**
   * Get a single ${typeName}
   * @param {string} id - The ${typeName} ID
   * @returns {Promise<Object>}
   */
  async get${typeName}(id) {
    return this.request('GET', \`/${name}/\${id}\`);
  }`);
    }

    if (entity.operations.includes('create')) {
      methods.push(`
  /**
   * Create a new ${typeName}
   * @param {Object} data - The ${typeName} data
   * @returns {Promise<Object>}
   */
  async create${typeName}(data) {
    return this.request('POST', '/${name}', data);
  }`);
    }

    if (entity.operations.includes('update')) {
      methods.push(`
  /**
   * Update a ${typeName}
   * @param {string} id - The ${typeName} ID
   * @param {Object} data - The fields to update
   * @returns {Promise<Object>}
   */
  async update${typeName}(id, data) {
    return this.request('PATCH', \`/${name}/\${id}\`, data);
  }`);
    }

    if (entity.operations.includes('delete')) {
      methods.push(`
  /**
   * Delete a ${typeName}
   * @param {string} id - The ${typeName} ID
   * @returns {Promise<Object>}
   */
  async delete${typeName}(id) {
    return this.request('DELETE', \`/${name}/\${id}\`);
  }`);
    }

    return methods.join('\n');
  }

  // ============================================================
  // PYTHON SDK
  // ============================================================

  private generatePython(): string {
    const clientName = `${this.toPascalCase(this.moduleName)}Client`;
    const classes = this.entities.map(e => this.generatePythonClass(e)).join('\n\n');
    const methods = this.entities.map(e => this.generatePythonMethods(e)).join('\n');

    return `"""
${this.moduleName} SDK
Auto-generated Python client for the ${this.moduleName} API
${this.options.moduleVersion ? `Version: ${this.options.moduleVersion}` : ''}

Example:
    client = ${clientName}(api_key='your-api-key')
    items = client.list_${this.toSnakeCase(this.entities[0]?.name || 'items')}()
"""

import requests
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, TypeVar, Generic
from datetime import datetime

T = TypeVar('T')


# ============================================================
# COMMON TYPES
# ============================================================

@dataclass
class Pagination:
    """Pagination metadata"""
    page: int
    limit: int
    total: int
    total_pages: int


@dataclass
class PaginatedResponse(Generic[T]):
    """Paginated response wrapper"""
    data: List[T]
    pagination: Pagination


class APIError(Exception):
    """API error exception"""
    def __init__(self, message: str, status_code: int, details: List[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details or []


# ============================================================
# ENTITY TYPES
# ============================================================

${classes}


# ============================================================
# SDK CLIENT
# ============================================================

class ${clientName}:
    """
    ${this.moduleName} API Client
    
    Args:
        api_key: Your API key for authentication
        base_url: Base URL for API requests (optional)
        timeout: Request timeout in seconds (default: 30)
    """
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "${this.baseUrl}",
        timeout: int = 30
    ):
        if not api_key:
            raise ValueError("API key is required")
        
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

    def _request(
        self,
        method: str,
        path: str,
        json: Dict[str, Any] = None,
        params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Make an HTTP request to the API
        
        Args:
            method: HTTP method
            path: API path
            json: Request body
            params: Query parameters
            
        Returns:
            Response data as dictionary
            
        Raises:
            APIError: If the request fails
        """
        url = f"{self.base_url}{path}"
        
        # Filter out None values from params
        if params:
            params = {k: v for k, v in params.items() if v is not None}
        
        try:
            response = self.session.request(
                method,
                url,
                json=json,
                params=params,
                timeout=self.timeout
            )
            
            if not response.ok:
                try:
                    error_data = response.json()
                    message = error_data.get('error', f'HTTP {response.status_code}')
                    details = error_data.get('details', [])
                except:
                    message = f'HTTP {response.status_code}'
                    details = []
                
                raise APIError(message, response.status_code, details)
            
            return response.json()
            
        except requests.exceptions.Timeout:
            raise APIError("Request timeout", 408)
        except requests.exceptions.ConnectionError:
            raise APIError("Connection error", 0)

${methods}


# ============================================================
# MODULE EXPORTS
# ============================================================

__all__ = [
    '${clientName}',
    'APIError',
    'Pagination',
    'PaginatedResponse',
${this.entities.map(e => `    '${this.toPascalCase(e.name)}',`).join('\n')}
]
`;
  }

  private generatePythonClass(entity: EntityConfig): string {
    const name = this.toPascalCase(entity.name);
    const fields = entity.fields
      .filter(f => !f.hidden)
      .map(f => `    ${f.name}: ${this.mapPythonType(f.type, !f.required)}`)
      .join('\n');

    return `@dataclass
class ${name}:
    """${name} entity"""
${fields}`;
  }

  private generatePythonMethods(entity: EntityConfig): string {
    const name = entity.name;
    const snakeName = this.toSnakeCase(name);
    const typeName = this.toPascalCase(name);
    const methods: string[] = [];

    if (entity.operations.includes('list')) {
      methods.push(`
    def list_${snakeName}s(
        self,
        page: int = 1,
        limit: int = 20,
        sort: str = None,
        order: str = None,
        search: str = None,
        **filters
    ) -> Dict[str, Any]:
        """
        List ${typeName}s with pagination
        
        Args:
            page: Page number (1-indexed)
            limit: Items per page (max 100)
            sort: Field to sort by
            order: Sort order ('asc' or 'desc')
            search: Search query
            **filters: Additional filter parameters
            
        Returns:
            Paginated response with data and pagination info
        """
        params = {
            "page": page,
            "limit": limit,
            "sort": sort,
            "order": order,
            "search": search,
            **filters
        }
        return self._request("GET", "/${name}", params=params)`);
    }

    if (entity.operations.includes('read')) {
      methods.push(`
    def get_${snakeName}(self, id: str) -> Dict[str, Any]:
        """
        Get a single ${typeName} by ID
        
        Args:
            id: The ${typeName} ID
            
        Returns:
            The ${typeName} data
        """
        return self._request("GET", f"/${name}/{id}")`);
    }

    if (entity.operations.includes('create')) {
      methods.push(`
    def create_${snakeName}(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new ${typeName}
        
        Args:
            data: The ${typeName} data
            
        Returns:
            The created ${typeName}
        """
        return self._request("POST", "/${name}", json=data)`);
    }

    if (entity.operations.includes('update')) {
      methods.push(`
    def update_${snakeName}(self, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing ${typeName}
        
        Args:
            id: The ${typeName} ID
            data: The fields to update
            
        Returns:
            The updated ${typeName}
        """
        return self._request("PATCH", f"/${name}/{id}", json=data)`);
    }

    if (entity.operations.includes('delete')) {
      methods.push(`
    def delete_${snakeName}(self, id: str) -> Dict[str, Any]:
        """
        Delete a ${typeName}
        
        Args:
            id: The ${typeName} ID
            
        Returns:
            Success status
        """
        return self._request("DELETE", f"/${name}/{id}")`);
    }

    return methods.join('\n');
  }

  // ============================================================
  // TYPE MAPPING HELPERS
  // ============================================================

  private mapTSType(type: FieldType): string {
    const map: Record<FieldType, string> = {
      uuid: 'string',
      string: 'string',
      text: 'string',
      integer: 'number',
      number: 'number',
      decimal: 'number',
      boolean: 'boolean',
      timestamp: 'string',
      timestamptz: 'string',
      date: 'string',
      array: 'string[]',
      jsonb: 'Record<string, any>',
      object: 'Record<string, any>'
    };
    return map[type] || 'any';
  }

  private mapPythonType(type: FieldType, optional: boolean): string {
    const map: Record<FieldType, string> = {
      uuid: 'str',
      string: 'str',
      text: 'str',
      integer: 'int',
      number: 'float',
      decimal: 'float',
      boolean: 'bool',
      timestamp: 'str',
      timestamptz: 'str',
      date: 'str',
      array: 'List[str]',
      jsonb: 'Dict[str, Any]',
      object: 'Dict[str, Any]'
    };
    const pyType = map[type] || 'Any';
    return optional ? `Optional[${pyType}] = None` : pyType;
  }

  private getTSFieldComment(field: FieldConfig): string {
    if (!this.options.includeComments) return '';
    
    const comments: string[] = [];
    if (field.readonly) comments.push('Read-only');
    if (field.required) comments.push('Required');
    
    return comments.length > 0 
      ? `  /** ${comments.join(', ')} */\n` 
      : '';
  }

  // ============================================================
  // STRING CONVERSION HELPERS
  // ============================================================

  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

/**
 * Create an SDK generator for a module
 */
export function createSDKGenerator(
  moduleName: string,
  baseUrl: string,
  entities: EntityConfig[],
  options?: SDKOptions
): SDKGenerator {
  return new SDKGenerator(moduleName, baseUrl, entities, options);
}
