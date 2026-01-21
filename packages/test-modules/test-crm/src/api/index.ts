/**
 * API Routes for Test Crm
 * 
 * This file handles API requests to /api/modules/test-crm/
 * 
 * Each exported function handles a specific HTTP method:
 * - get: GET requests
 * - post: POST requests
 * - put: PUT requests
 * - delete: DELETE requests
 */

interface RequestContext {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  db: any; // Supabase client
  user: { id: string };
  site: { id: string };
}

/**
 * GET /api/modules/test-crm/
 * Returns module status and info
 */
export async function get(ctx: RequestContext) {
  return {
    message: 'Hello from Test Crm!',
    module: 'test-crm',
    siteId: ctx.site.id,
    userId: ctx.user.id,
    timestamp: new Date().toISOString()
  };
}

/**
 * POST /api/modules/test-crm/
 * Example create endpoint
 */
export async function post(ctx: RequestContext) {
  const { body, site, user } = ctx;
  
  // Example: Insert into a module table
  // const { data, error } = await ctx.db
  //   .from('test-crm_items')
  //   .insert({
  //     ...body,
  //     site_id: site.id,
  //     created_by: user.id
  //   })
  //   .select()
  //   .single();
  
  return {
    success: true,
    message: 'Item created',
    data: body
  };
}

/**
 * PUT /api/modules/test-crm/
 * Example update endpoint
 */
export async function put(ctx: RequestContext) {
  const { body } = ctx;
  
  return {
    success: true,
    message: 'Item updated',
    data: body
  };
}

/**
 * DELETE /api/modules/test-crm/
 * Example delete endpoint
 */
// export async function delete(ctx: RequestContext) {
//   const { query } = ctx;
//   const id = query?.id;
//   
//   if (!id) {
//     throw new Error('ID is required');
//   }
//   
//   return {
//     success: true,
//     message: 'Item deleted',
//     id
//   };
// }
