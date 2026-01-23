/**
 * Quick script to check current database schema
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  // Check what module-related tables exist
  const { data: tables, error: tablesError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name LIKE '%module%'
        ORDER BY table_name;
      `
    })
    .single();

  if (tablesError) {
    console.error('❌ Error checking tables:', tablesError);
    
    // Try direct query instead
    console.log('\n📋 Checking site_modules table:');
    const { data: sm, error: smError } = await supabase
      .from('site_modules')
      .select('*')
      .limit(1);
    console.log('site_modules exists:', !smError);
    if (smError) console.log('Error:', smError.message);

    console.log('\n📋 Checking site_module_installations table:');
    const { data: smi, error: smiError } = await supabase
      .from('site_module_installations')
      .select('*')
      .limit(1);
    console.log('site_module_installations exists:', !smiError);
    if (smiError) console.log('Error:', smiError.message);

    // Check columns if table exists
    if (!smiError) {
      const { data: cols, error: colsError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'site_module_installations'
            ORDER BY ordinal_position;
          `
        })
        .single();
      
      if (!colsError && cols) {
        console.log('\n📊 site_module_installations columns:');
        console.log(cols);
      }
    }

    return;
  }

  console.log('📊 Module-related tables:', tables);
  
  // Check site_module_installations structure
  console.log('\n📋 Checking site_module_installations structure...');
  const { data: structure } = await supabase
    .from('site_module_installations')
    .select('*')
    .limit(1);
  
  if (structure) {
    console.log('✅ site_module_installations exists');
    console.log('Columns:', Object.keys(structure[0] || {}));
  }
}

checkSchema().catch(console.error);
