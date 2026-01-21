/**
 * @dramac/sdk - Test Fixtures
 * 
 * Factories for creating test data
 */

/**
 * Create a fixture factory with support for overrides and batches
 */
export function createFixtures<T extends Record<string, unknown>>(
  factory: (overrides?: Partial<T>, index?: number) => T
) {
  return {
    /**
     * Create a single fixture
     */
    create(overrides?: Partial<T>): T {
      return factory(overrides, 0);
    },

    /**
     * Create multiple fixtures
     */
    createMany(count: number, overrides?: Partial<T> | ((index: number) => Partial<T>)): T[] {
      return Array.from({ length: count }, (_, i) => {
        const itemOverrides = typeof overrides === 'function' ? overrides(i) : overrides;
        return factory(itemOverrides, i);
      });
    },

    /**
     * Create fixtures with specific overrides for each
     */
    createEach(overridesList: Array<Partial<T>>): T[] {
      return overridesList.map((overrides, i) => factory(overrides, i));
    },
  };
}

/**
 * Generate a random UUID
 */
export function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a random string
 */
export function randomString(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Generate a random email
 */
export function randomEmail(domain = 'example.com'): string {
  return `${randomString(8).toLowerCase()}@${domain}`;
}

/**
 * Generate a random integer
 */
export function randomInt(min = 0, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random date within a range
 */
export function randomDate(start?: Date, end?: Date): Date {
  const startTime = start?.getTime() ?? Date.now() - 365 * 24 * 60 * 60 * 1000;
  const endTime = end?.getTime() ?? Date.now();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

/**
 * Pick a random item from an array
 */
export function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Generate a sequence of values
 */
export function sequence(prefix: string) {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
}

// Common fixture factories

/**
 * User fixture factory
 */
export const userFixture = createFixtures((overrides, index) => ({
  id: randomUUID(),
  email: randomEmail(),
  name: `User ${(index ?? 0) + 1}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
}));

/**
 * Site fixture factory
 */
export const siteFixture = createFixtures((overrides, index) => ({
  id: randomUUID(),
  name: `Site ${(index ?? 0) + 1}`,
  slug: `site-${(index ?? 0) + 1}`,
  owner_id: randomUUID(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
}));

/**
 * Module fixture factory
 */
export const moduleFixture = createFixtures((overrides) => ({
  id: randomUUID(),
  slug: `module-${randomString(6).toLowerCase()}`,
  name: `Test Module`,
  version: '1.0.0',
  description: 'A test module',
  type: 'app' as const,
  category: 'utility' as const,
  is_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
}));

/**
 * Permission fixture factory
 */
export const permissionFixture = createFixtures((overrides, index) => ({
  key: `permission.${(index ?? 0) + 1}`,
  name: `Permission ${(index ?? 0) + 1}`,
  description: `Description for permission ${(index ?? 0) + 1}`,
  category: 'general',
  ...overrides,
}));

/**
 * Role fixture factory
 */
export const roleFixture = createFixtures((overrides, index) => ({
  slug: `role-${(index ?? 0) + 1}`,
  name: `Role ${(index ?? 0) + 1}`,
  description: `Description for role ${(index ?? 0) + 1}`,
  permissions: [],
  hierarchy_level: (index ?? 0) + 1,
  is_default: false,
  ...overrides,
}));
