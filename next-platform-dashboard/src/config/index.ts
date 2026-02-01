/**
 * Configuration Barrel Export
 * 
 * Central export point for all configuration files.
 * Import from '@/config' for cleaner imports.
 */

// Layout constants
export { LAYOUT, combineLayout, type LayoutKey, type LayoutValue } from './layout';

// Navigation configs
export { adminNavigationItems, type AdminNavItem } from './admin-navigation';
export { 
  settingsNavigation, 
  getFlatSettingsNav,
  type SettingsNavSection, 
  type SettingsNavItem 
} from './settings-navigation';
export { 
  getPortalNavigation,
  type PortalNavItem,
  type PortalUserPermissions 
} from './portal-navigation';

// Re-export existing navigation config
export * from './navigation';
