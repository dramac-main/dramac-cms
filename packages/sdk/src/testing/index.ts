/**
 * @dramac/sdk - Testing Module Index
 * 
 * Export all testing utilities
 */

export {
  createMockContext,
  createMockSupabase,
  createMockAuth,
  createMockResponse,
  createMockFetch,
} from './mocks';

export {
  createFixtures,
  randomUUID,
  randomString,
  randomEmail,
  randomInt,
  randomDate,
  randomPick,
  sequence,
  userFixture,
  siteFixture,
  moduleFixture,
  permissionFixture,
  roleFixture,
} from './fixtures';

export {
  createModuleWrapper,
  waitForAsync,
  waitFor,
  mockFetch,
  mockLocalStorage,
  createSpy,
  assertShape,
  createDeferred,
  catchError,
  type ModuleRenderOptions,
} from './helpers';
