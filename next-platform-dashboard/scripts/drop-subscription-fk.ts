/**
 * Script to drop FK constraint on agency_module_subscriptions
 * Allows subscriptions to testing modules in module_source
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dropFKConstraint() {
  console.log('Dropping FK constraint on agency_module_subscriptions...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.agency_module_subscriptions 
      DROP CONSTRAINT IF EXISTS agency_module_subscriptions_module_id_fkey;
      
      COMMENT ON COLUMN public.agency_module_subscriptions.module_id IS 
        'References either modules_v2.id (published) or module_source.id (testing). No FK constraint - validated in app code.';
    `
  });

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  console.log('✅ Migration complete! Subscriptions can now reference testing modules.');
}

dropFKConstraint();
