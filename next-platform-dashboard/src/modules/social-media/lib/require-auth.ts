'use server'

/**
 * Authentication guard for social media server actions
 * 
 * Throws an error if the user is not authenticated.
 * Since all server actions use try/catch, this will be caught
 * and returned as { error: 'Unauthorized' } naturally.
 */

import { createClient } from '@/lib/supabase/server'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return { supabase, user }
}
