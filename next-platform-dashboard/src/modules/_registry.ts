/**
 * Module Registry
 * 
 * Central registry of all module manifests.
 * Used for module discovery, navigation injection, and manifest lookup.
 */

import type { ModuleManifest } from './_types'
import { CRMModuleManifest } from './crm/manifest'
import { BookingModuleManifest } from './booking/manifest'
import { EcommerceModuleManifest } from './ecommerce/manifest'
import { LiveChatModuleManifest } from './live-chat/manifest'

// Registry map: slug → manifest
export const moduleRegistry = new Map<string, ModuleManifest>([
  ['crm', CRMModuleManifest],
  ['booking', BookingModuleManifest],
  ['ecommerce', EcommerceModuleManifest],
  ['live-chat', LiveChatModuleManifest],
])

// Note: social-media and automation use custom manifest types (not ModuleManifest)
// They are registered separately when needed via their own exports.

/**
 * Get a module manifest by slug
 */
export function getModuleManifest(slug: string): ModuleManifest | undefined {
  return moduleRegistry.get(slug)
}

/**
 * Get all registered module slugs
 */
export function getRegisteredModuleSlugs(): string[] {
  return Array.from(moduleRegistry.keys())
}

/**
 * Check if a module is registered
 */
export function isModuleRegistered(slug: string): boolean {
  return moduleRegistry.has(slug)
}
