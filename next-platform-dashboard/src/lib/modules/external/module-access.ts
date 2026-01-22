// Helper functions for module access verification

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Get module and verify user has access
 */
export async function getModuleAndVerifyAccess(
  moduleId: string,
  userId: string
): Promise<{ module: any; member: any } | { error: string }> {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component - cannot set cookies
          }
        },
      },
    }
  );

  // Get module from modules_v2 table
  const { data: module, error: moduleError } = await supabase
    .from('modules_v2')
    .select('id, site_id, name, slug')
    .eq('id', moduleId)
    .single();

  if (moduleError || !module) {
    return { error: 'Module not found' };
  }

  // Check if user has access to the site
  const { data: siteAccess, error: accessError } = await supabase
    .from('sites')
    .select('id, owner_id')
    .eq('id', module.site_id)
    .single();

  if (accessError || !siteAccess) {
    return { error: 'Access denied' };
  }

  // Create member object based on ownership
  const member = {
    user_id: userId,
    site_id: module.site_id,
    role: siteAccess.owner_id === userId ? 'owner' : 'member'
  };

  // If not owner, check if they're a member
  if (siteAccess.owner_id !== userId) {
    return { error: 'Access denied - only site owners can manage external integrations' };
  }

  return { module, member };
}
