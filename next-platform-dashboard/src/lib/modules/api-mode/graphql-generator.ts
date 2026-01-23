/**
 * Phase EM-33: GraphQL Schema Generator
 * 
 * Generates GraphQL schemas from module entity configurations:
 * - Type definitions
 * - Query operations
 * - Mutation operations
 * - Input types
 * - Connection types for pagination
 * 
 * @see phases/enterprise-modules/PHASE-EM-33-API-ONLY-MODE.md
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EntityConfig, FieldConfig, FieldType } from './rest-api-generator';

// ============================================================
// TYPES
// ============================================================

export interface GraphQLSchemaOptions {
  includeSubscriptions?: boolean;
  includeRelay?: boolean;
  customScalars?: boolean;
}

export interface GeneratedSchema {
  sdl: string;
  types: string[];
  queries: string[];
  mutations: string[];
}

// ============================================================
// SERVICE CLIENT
// ============================================================

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// GRAPHQL SCHEMA GENERATOR CLASS
// ============================================================

export class GraphQLSchemaGenerator {
  private moduleId: string;
  private entities: EntityConfig[];
  private options: GraphQLSchemaOptions;
  private supabase: SupabaseClient;

  constructor(
    moduleId: string,
    entities: EntityConfig[],
    options: GraphQLSchemaOptions = {},
    supabaseClient?: SupabaseClient
  ) {
    this.moduleId = moduleId;
    this.entities = entities;
    this.options = {
      includeSubscriptions: false,
      includeRelay: false,
      customScalars: true,
      ...options
    };
    this.supabase = supabaseClient || getServiceClient();
  }

  /**
   * Generate complete GraphQL SDL schema
   */
  generateSchema(): GeneratedSchema {
    const parts: string[] = [];
    const types: string[] = [];
    const queries: string[] = [];
    const mutations: string[] = [];

    // Add custom scalars if enabled
    if (this.options.customScalars) {
      parts.push(this.generateScalars());
    }

    // Add common types
    parts.push(this.generateCommonTypes());

    // Generate type definitions
    for (const entity of this.entities) {
      const typeName = this.toPascalCase(entity.name);
      types.push(typeName);
      
      parts.push(this.generateType(entity));
      parts.push(this.generateInputTypes(entity));
      parts.push(this.generateConnectionType(entity));
    }

    // Generate Query type
    const queryType = this.generateQueryType();
    parts.push(queryType.sdl);
    queries.push(...queryType.operations);

    // Generate Mutation type
    const mutationType = this.generateMutationType();
    parts.push(mutationType.sdl);
    mutations.push(...mutationType.operations);

    // Generate Subscription type if enabled
    if (this.options.includeSubscriptions) {
      parts.push(this.generateSubscriptionType());
    }

    return {
      sdl: parts.filter(Boolean).join('\n\n'),
      types,
      queries,
      mutations
    };
  }

  /**
   * Generate custom scalar definitions
   */
  private generateScalars(): string {
    return `# Custom Scalars
scalar DateTime
scalar JSON
scalar UUID`;
  }

  /**
   * Generate common types (enums, pagination, etc.)
   */
  private generateCommonTypes(): string {
    const connectionTypes = this.entities.map(entity => {
      const typeName = this.toPascalCase(entity.name);
      return `type ${typeName}Connection {
  edges: [${typeName}Edge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ${typeName}Edge {
  node: ${typeName}!
  cursor: String!
}`;
    }).join('\n\n');

    return `# Common Types
enum SortOrder {
  ASC
  DESC
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Pagination {
  page: Int!
  limit: Int!
  total: Int!
  totalPages: Int!
}

type DeleteResult {
  success: Boolean!
  id: ID!
}

type BatchDeleteResult {
  success: Boolean!
  deletedCount: Int!
  ids: [ID!]!
}

${connectionTypes}`;
  }

  /**
   * Generate type definition for entity
   */
  private generateType(entity: EntityConfig): string {
    const typeName = this.toPascalCase(entity.name);
    const fields = entity.fields
      .filter(f => !f.hidden)
      .map(f => {
        const gqlType = this.mapFieldTypeToGraphQL(f);
        const description = this.getFieldDescription(f);
        return description 
          ? `  """${description}"""\n  ${f.name}: ${gqlType}`
          : `  ${f.name}: ${gqlType}`;
      })
      .join('\n');

    // Add relation fields
    const relationFields = (entity.relations || [])
      .map(rel => {
        const relTypeName = this.toPascalCase(rel.entity);
        if (rel.type === 'one-to-many') {
          return `  ${rel.name}: [${relTypeName}!]!`;
        }
        return `  ${rel.name}: ${relTypeName}`;
      })
      .join('\n');

    const allFields = [fields, relationFields].filter(Boolean).join('\n');

    return `"""
${typeName} entity
"""
type ${typeName} {
${allFields}
}`;
  }

  /**
   * Generate input types for mutations
   */
  private generateInputTypes(entity: EntityConfig): string {
    const typeName = this.toPascalCase(entity.name);

    // Create input (required fields marked)
    const createFields = entity.fields
      .filter(f => !f.readonly && !f.hidden && f.name !== 'id')
      .map(f => {
        const gqlType = this.mapFieldTypeToGraphQL(f, false);
        const required = f.required && f.default === undefined;
        return `  ${f.name}: ${required ? gqlType.replace('!', '') + '!' : gqlType.replace('!', '')}`;
      })
      .join('\n');

    // Update input (all fields optional)
    const updateFields = entity.fields
      .filter(f => !f.readonly && !f.hidden && f.name !== 'id')
      .map(f => `  ${f.name}: ${this.mapFieldTypeToGraphQL(f, false).replace('!', '')}`)
      .join('\n');

    // Filter input
    const filterFields = (entity.filters || [])
      .map(f => {
        const field = entity.fields.find(ef => ef.name === f);
        if (!field) return null;
        const baseType = this.mapFieldTypeToGraphQL(field, false).replace('!', '');
        return `  ${f}: ${baseType}
  ${f}_eq: ${baseType}
  ${f}_ne: ${baseType}
  ${f}_in: [${baseType}!]
  ${f}_gt: ${baseType}
  ${f}_gte: ${baseType}
  ${f}_lt: ${baseType}
  ${f}_lte: ${baseType}`;
      })
      .filter(Boolean)
      .join('\n');

    // Sort input
    const sortableFields = entity.sortable || ['created_at'];
    const sortEnumValues = sortableFields
      .map(f => `  ${f.toUpperCase()}`)
      .join('\n');

    return `input Create${typeName}Input {
${createFields}
}

input Update${typeName}Input {
${updateFields}
}

input ${typeName}FilterInput {
${filterFields || '  _empty: Boolean'}
  search: String
}

enum ${typeName}SortField {
${sortEnumValues}
}

input ${typeName}SortInput {
  field: ${typeName}SortField!
  order: SortOrder = DESC
}`;
  }

  /**
   * Generate connection type for pagination
   */
  private generateConnectionType(entity: EntityConfig): string {
    const typeName = this.toPascalCase(entity.name);
    
    return `type ${typeName}List {
  data: [${typeName}!]!
  pagination: Pagination!
}`;
  }

  /**
   * Generate Query type
   */
  private generateQueryType(): { sdl: string; operations: string[] } {
    const operations: string[] = [];
    
    const queries = this.entities.map(entity => {
      const name = entity.name;
      const typeName = this.toPascalCase(name);
      const entityQueries: string[] = [];
      
      if (entity.operations.includes('read')) {
        operations.push(`${name}`);
        entityQueries.push(`  """
  Get a single ${typeName} by ID
  """
  ${name}(id: ID!): ${typeName}`);
      }
      
      if (entity.operations.includes('list')) {
        operations.push(`${name}s`);
        entityQueries.push(`  """
  List ${typeName}s with pagination, filtering, and sorting
  """
  ${name}s(
    page: Int = 1
    limit: Int = 20
    filter: ${typeName}FilterInput
    sort: ${typeName}SortInput
  ): ${typeName}List!`);

        // Relay-style connection if enabled
        if (this.options.includeRelay) {
          operations.push(`${name}Connection`);
          entityQueries.push(`  """
  ${typeName} connection (Relay style)
  """
  ${name}Connection(
    first: Int
    after: String
    last: Int
    before: String
    filter: ${typeName}FilterInput
    sort: ${typeName}SortInput
  ): ${typeName}Connection!`);
        }
      }
      
      return entityQueries.join('\n\n');
    }).filter(Boolean).join('\n\n');

    return {
      sdl: `type Query {
${queries}
}`,
      operations
    };
  }

  /**
   * Generate Mutation type
   */
  private generateMutationType(): { sdl: string; operations: string[] } {
    const operations: string[] = [];
    
    const mutations = this.entities.map(entity => {
      const name = entity.name;
      const typeName = this.toPascalCase(name);
      const entityMutations: string[] = [];
      
      if (entity.operations.includes('create')) {
        operations.push(`create${typeName}`);
        entityMutations.push(`  """
  Create a new ${typeName}
  """
  create${typeName}(input: Create${typeName}Input!): ${typeName}!`);
      }
      
      if (entity.operations.includes('update')) {
        operations.push(`update${typeName}`);
        entityMutations.push(`  """
  Update an existing ${typeName}
  """
  update${typeName}(id: ID!, input: Update${typeName}Input!): ${typeName}!`);
      }
      
      if (entity.operations.includes('delete')) {
        operations.push(`delete${typeName}`);
        entityMutations.push(`  """
  Delete a ${typeName}
  """
  delete${typeName}(id: ID!): DeleteResult!`);

        // Batch delete
        operations.push(`delete${typeName}s`);
        entityMutations.push(`  """
  Delete multiple ${typeName}s
  """
  delete${typeName}s(ids: [ID!]!): BatchDeleteResult!`);
      }
      
      return entityMutations.join('\n\n');
    }).filter(Boolean).join('\n\n');

    return {
      sdl: `type Mutation {
${mutations}
}`,
      operations
    };
  }

  /**
   * Generate Subscription type
   */
  private generateSubscriptionType(): string {
    const subscriptions = this.entities.map(entity => {
      const name = entity.name;
      const typeName = this.toPascalCase(name);
      const subs: string[] = [];

      if (entity.operations.includes('create')) {
        subs.push(`  ${name}Created: ${typeName}!`);
      }
      if (entity.operations.includes('update')) {
        subs.push(`  ${name}Updated: ${typeName}!`);
      }
      if (entity.operations.includes('delete')) {
        subs.push(`  ${name}Deleted: DeleteResult!`);
      }

      return subs.join('\n');
    }).filter(Boolean).join('\n');

    return `type Subscription {
${subscriptions}
}`;
  }

  /**
   * Map field type to GraphQL type
   */
  private mapFieldTypeToGraphQL(field: FieldConfig, includeRequired: boolean = true): string {
    const typeMap: Record<FieldType, string> = {
      uuid: 'ID',
      string: 'String',
      text: 'String',
      integer: 'Int',
      number: 'Float',
      decimal: 'Float',
      boolean: 'Boolean',
      timestamp: 'DateTime',
      timestamptz: 'DateTime',
      date: 'String',
      array: '[String]',
      jsonb: 'JSON',
      object: 'JSON'
    };

    const gqlType = typeMap[field.type] || 'String';
    return includeRequired && field.required ? `${gqlType}!` : gqlType;
  }

  /**
   * Get field description for documentation
   */
  private getFieldDescription(field: FieldConfig): string | null {
    const descriptions: Record<string, string> = {
      id: 'Unique identifier',
      created_at: 'Creation timestamp',
      updated_at: 'Last update timestamp',
      site_id: 'Associated site ID'
    };
    return descriptions[field.name] || null;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Save schema to database
   */
  async saveSchema(version: string): Promise<string> {
    const generated = this.generateSchema();

    // Deactivate existing active schemas
    await this.supabase
      .from('module_graphql_schemas')
      .update({ is_active: false })
      .eq('module_id', this.moduleId)
      .eq('is_active', true);

    // Insert new schema
    const { data, error } = await this.supabase
      .from('module_graphql_schemas')
      .insert({
        module_id: this.moduleId,
        version,
        sdl: generated.sdl,
        is_active: true,
        generated_from: {
          entities: this.entities.map(e => ({
            name: e.name,
            operations: e.operations,
            fields: e.fields.length
          })),
          options: this.options
        }
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Get active schema for module
   */
  async getActiveSchema(): Promise<{ sdl: string; version: string } | null> {
    const { data, error } = await this.supabase
      .from('module_graphql_schemas')
      .select('sdl, version')
      .eq('module_id', this.moduleId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return { sdl: data.sdl, version: data.version };
  }

  /**
   * Generate introspection result
   */
  generateIntrospection(): object {
    const generated = this.generateSchema();
    
    // Simplified introspection result
    return {
      __schema: {
        queryType: { name: 'Query' },
        mutationType: { name: 'Mutation' },
        subscriptionType: this.options.includeSubscriptions ? { name: 'Subscription' } : null,
        types: generated.types.map(t => ({
          kind: 'OBJECT',
          name: t
        })),
        directives: []
      }
    };
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

/**
 * Create a GraphQL schema generator for a module
 */
export function createGraphQLSchema(
  moduleId: string,
  entities: EntityConfig[],
  options?: GraphQLSchemaOptions
): GraphQLSchemaGenerator {
  return new GraphQLSchemaGenerator(moduleId, entities, options);
}
