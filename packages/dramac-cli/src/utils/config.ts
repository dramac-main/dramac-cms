import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'esbuild-register/dist/node.js';

export interface DramacConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  category?: string;
  type?: 'app' | 'custom' | 'system';
  entry?: {
    dashboard?: string;
    settings?: string;
    embed?: string;
    api?: string;
  };
  database?: {
    tables: TableConfig[];
    migrations?: string;
  };
  permissions?: PermissionConfig[];
  roles?: RoleConfig[];
  routes?: RouteConfig[];
}

export interface TableConfig {
  name: string;
  columns?: ColumnConfig[];
}

export interface ColumnConfig {
  name: string;
  type: string;
  nullable?: boolean;
  default?: any;
  references?: string;
}

export interface PermissionConfig {
  key: string;
  name: string;
  description?: string;
  category?: string;
}

export interface RoleConfig {
  slug: string;
  name: string;
  permissions: string[];
  hierarchyLevel: number;
  isDefault?: boolean;
}

export interface RouteConfig {
  path: string;
  component: string;
  name?: string;
  icon?: string;
}

let registered = false;

export async function loadConfig(cwd: string): Promise<DramacConfig> {
  // Register TypeScript support (only once)
  if (!registered) {
    register({
      target: 'node18',
    });
    registered = true;
  }
  
  const configPath = path.join(cwd, 'dramac.config.ts');
  
  // Clear cache for hot reloading
  const configUrl = `file://${configPath}?t=${Date.now()}`;
  
  try {
    // Import the config file
    const module = await import(configPath);
    const config = module.default || module;
    
    // Validate required fields
    if (!config.id || !config.name || !config.version) {
      throw new Error('Config must have id, name, and version');
    }
    
    return config;
  } catch (error: any) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'MODULE_NOT_FOUND') {
      throw new Error(`Config file not found: ${configPath}`);
    }
    throw error;
  }
}

export function validateConfigId(id: string): boolean {
  return /^[a-z][a-z0-9-]*[a-z0-9]$/.test(id);
}

export function validateConfigVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/.test(version);
}
