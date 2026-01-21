/**
 * @dramac/sdk - Testing Mocks
 * 
 * Mock factories for testing Dramac modules
 */

import type { ModuleContext } from '../types/database';

/**
 * Create a mock module context for testing
 */
export function createMockContext(overrides?: Partial<ModuleContext>): ModuleContext {
  return {
    moduleId: 'test-module-id',
    siteId: 'test-site-id',
    userId: 'test-user-id',
    ...overrides,
  };
}

/**
 * Mock Supabase query builder
 */
function createMockQuery(mockData: Record<string, unknown[]>, tableName: string) {
  let filters: Record<string, unknown> = {};
  let selectColumns = '*';
  let orderColumn: string | null = null;
  let orderAsc = true;
  let limitCount: number | null = null;
  let offsetCount: number | null = null;

  const query = {
    select(columns = '*') {
      selectColumns = columns;
      return query;
    },
    eq(column: string, value: unknown) {
      filters[column] = value;
      return query;
    },
    neq(column: string, value: unknown) {
      filters[`${column}:neq`] = value;
      return query;
    },
    gt(column: string, value: unknown) {
      filters[`${column}:gt`] = value;
      return query;
    },
    gte(column: string, value: unknown) {
      filters[`${column}:gte`] = value;
      return query;
    },
    lt(column: string, value: unknown) {
      filters[`${column}:lt`] = value;
      return query;
    },
    lte(column: string, value: unknown) {
      filters[`${column}:lte`] = value;
      return query;
    },
    like(column: string, pattern: string) {
      filters[`${column}:like`] = pattern;
      return query;
    },
    ilike(column: string, pattern: string) {
      filters[`${column}:ilike`] = pattern;
      return query;
    },
    is(column: string, value: unknown) {
      filters[`${column}:is`] = value;
      return query;
    },
    in(column: string, values: unknown[]) {
      filters[`${column}:in`] = values;
      return query;
    },
    contains(column: string, value: unknown) {
      filters[`${column}:contains`] = value;
      return query;
    },
    containedBy(column: string, value: unknown) {
      filters[`${column}:containedBy`] = value;
      return query;
    },
    overlaps(column: string, values: unknown[]) {
      filters[`${column}:overlaps`] = values;
      return query;
    },
    order(column: string, options: { ascending?: boolean } = {}) {
      orderColumn = column;
      orderAsc = options.ascending !== false;
      return query;
    },
    limit(count: number) {
      limitCount = count;
      return query;
    },
    range(from: number, to: number) {
      offsetCount = from;
      limitCount = to - from + 1;
      return query;
    },
    single() {
      const data = applyFilters(mockData[tableName] || [], filters)[0] || null;
      return Promise.resolve({ data, error: null });
    },
    maybeSingle() {
      const data = applyFilters(mockData[tableName] || [], filters)[0] || null;
      return Promise.resolve({ data, error: null });
    },
    then(resolve: (result: { data: unknown[]; error: null }) => void) {
      let data = applyFilters(mockData[tableName] || [], filters);

      if (orderColumn) {
        data = data.sort((a: any, b: any) => {
          const aVal = a[orderColumn!];
          const bVal = b[orderColumn!];
          if (aVal < bVal) return orderAsc ? -1 : 1;
          if (aVal > bVal) return orderAsc ? 1 : -1;
          return 0;
        });
      }

      if (offsetCount !== null) {
        data = data.slice(offsetCount);
      }

      if (limitCount !== null) {
        data = data.slice(0, limitCount);
      }

      return resolve({ data, error: null });
    },
    insert(data: unknown | unknown[]) {
      const records = Array.isArray(data) ? data : [data];
      const inserted = records.map((r) => ({
        id: generateUUID(),
        created_at: new Date().toISOString(),
        ...r,
      }));
      mockData[tableName] = [...(mockData[tableName] || []), ...inserted];
      return {
        select() {
          return Promise.resolve({ data: inserted, error: null });
        },
      };
    },
    update(data: unknown) {
      const updated = (mockData[tableName] || []).map((item: any) => {
        if (matchesFilters(item, filters)) {
          return { ...item, ...(data as object), updated_at: new Date().toISOString() };
        }
        return item;
      });
      mockData[tableName] = updated;
      return {
        select() {
          return {
            single() {
              const item = updated.find((item: any) => matchesFilters(item, filters));
              return Promise.resolve({ data: item, error: null });
            },
          };
        },
      };
    },
    upsert(data: unknown) {
      const record = data as Record<string, unknown>;
      const existing = (mockData[tableName] || []).find(
        (item: any) => item.id === record.id
      );
      
      if (existing) {
        return this.update(data);
      } else {
        return this.insert(data);
      }
    },
    delete() {
      mockData[tableName] = (mockData[tableName] || []).filter(
        (item: any) => !matchesFilters(item, filters)
      );
      return Promise.resolve({ error: null });
    },
  };

  return query;
}

/**
 * Apply filters to data array
 */
function applyFilters(data: unknown[], filters: Record<string, unknown>): unknown[] {
  return data.filter((item: any) => matchesFilters(item, filters));
}

/**
 * Check if item matches all filters
 */
function matchesFilters(item: any, filters: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(filters)) {
    if (key.endsWith(':neq')) {
      if (item[key.slice(0, -4)] === value) return false;
    } else if (key.endsWith(':gt')) {
      if (!(item[key.slice(0, -3)] > (value as number))) return false;
    } else if (key.endsWith(':gte')) {
      if (!(item[key.slice(0, -4)] >= (value as number))) return false;
    } else if (key.endsWith(':lt')) {
      if (!(item[key.slice(0, -3)] < (value as number))) return false;
    } else if (key.endsWith(':lte')) {
      if (!(item[key.slice(0, -4)] <= (value as number))) return false;
    } else if (key.endsWith(':like')) {
      const pattern = (value as string).replace(/%/g, '.*');
      if (!new RegExp(`^${pattern}$`).test(item[key.slice(0, -5)])) return false;
    } else if (key.endsWith(':ilike')) {
      const pattern = (value as string).replace(/%/g, '.*');
      if (!new RegExp(`^${pattern}$`, 'i').test(item[key.slice(0, -6)])) return false;
    } else if (key.endsWith(':is')) {
      if (item[key.slice(0, -3)] !== value) return false;
    } else if (key.endsWith(':in')) {
      if (!(value as unknown[]).includes(item[key.slice(0, -3)])) return false;
    } else {
      if (item[key] !== value) return false;
    }
  }
  return true;
}

/**
 * Generate a mock UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabase() {
  const mockData: Record<string, unknown[]> = {};

  return {
    from: (tableName: string) => createMockQuery(mockData, tableName),
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      getSession: () => Promise.resolve({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: () => Promise.resolve({ error: null }),
    },
    rpc: (fnName: string, params?: Record<string, unknown>) =>
      Promise.resolve({ data: null, error: null }),
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve({ data: { path: 'test/path' }, error: null }),
        download: () => Promise.resolve({ data: new Blob(), error: null }),
        remove: () => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.com/${bucket}/${path}` },
        }),
      }),
    },
    _mockData: mockData,
    _seed(table: string, data: unknown[]) {
      mockData[table] = data;
    },
    _clear() {
      Object.keys(mockData).forEach((key) => delete mockData[key]);
    },
  };
}

/**
 * Create a mock module auth context for testing
 */
export function createMockAuth(overrides?: {
  user?: { id: string; email: string } | null;
  permissions?: string[];
  roles?: string[];
}) {
  const permissions = overrides?.permissions || ['*'];
  const roles = overrides?.roles || ['admin'];

  return {
    user: overrides?.user ?? { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
    isAuthenticated: !!overrides?.user || overrides?.user === undefined,
    moduleId: 'test-module-id',
    siteId: 'test-site-id',
    roles: roles.map((r) => ({ slug: r, permissions: [] })),
    permissions,
    hasPermission: (p: string) => permissions.includes('*') || permissions.includes(p),
    hasAnyPermission: (ps: string[]) =>
      permissions.includes('*') || ps.some((p) => permissions.includes(p)),
    hasAllPermissions: (ps: string[]) =>
      permissions.includes('*') || ps.every((p) => permissions.includes(p)),
    hasRole: (r: string) => roles.includes(r),
    isAtLeastRole: () => true,
    refresh: () => Promise.resolve(),
  };
}

/**
 * Create mock API response
 */
export function createMockResponse<T>(data: T, options?: {
  status?: number;
  ok?: boolean;
  headers?: Record<string, string>;
}): Response {
  const { status = 200, ok = true, headers = {} } = options || {};

  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: () => createMockResponse(data, options),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic',
    url: '',
  } as Response;
}

/**
 * Create mock fetch function
 */
export function createMockFetch(
  handlers: Record<string, (req: { url: string; method: string; body?: unknown }) => unknown>
) {
  return async (url: string, options?: RequestInit): Promise<Response> => {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.parse(options.body as string) : undefined;

    for (const [pattern, handler] of Object.entries(handlers)) {
      const regex = new RegExp(`^${pattern.replace(/:\w+/g, '[^/]+')}$`);
      if (regex.test(url)) {
        const data = handler({ url, method, body });
        return createMockResponse(data);
      }
    }

    return createMockResponse({ error: 'Not found' }, { status: 404, ok: false });
  };
}
