import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findAllWorkflows() {
  console.log('\n🔍 FINDING ALL WORKFLOWS IN DATABASE\n')
  
  const { data: workflows, error } = await supabase
    .from('automation_workflows')
    .select('id, name, is_active, trigger_type, trigger_config, site_id')
  
  if (error) {
    console.error('Error:', error.message)
    return
  }
  
  if (!workflows || workflows.length === 0) {
    console.log('❌ NO WORKFLOWS FOUND IN DATABASE!')
    console.log('   User needs to create a workflow first.')
    return
  }
  
  console.log(`Found ${workflows.length} workflow(s):\n`)
  
  for (const w of workflows) {
    console.log(`📋 Workflow: ${w.name}`)
    console.log(`   ID: ${w.id}`)
    console.log(`   Site ID: ${w.site_id}`)
    console.log(`   Active: ${w.is_active ? '✅ YES' : '❌ NO'}`)
    console.log(`   Trigger Type: ${w.trigger_type}`)
    console.log(`   Trigger Config:`, JSON.stringify(w.trigger_config, null, 2))
    console.log()
  }
  
  // Also check subscriptions
  const { data: subs } = await supabase
    .from('automation_event_subscriptions')
    .select('*')
  
  console.log('\n📡 ALL EVENT SUBSCRIPTIONS:')
  if (!subs || subs.length === 0) {
    console.log('   ❌ NO SUBSCRIPTIONS FOUND!')
  } else {
    for (const s of subs) {
      console.log(`   - ${s.event_type} -> workflow ${s.workflow_id} (active: ${s.is_active})`)
    }
  }
  
  // Check events
  const { data: events } = await supabase
    .from('automation_events_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log('\n📝 RECENT EVENTS:')
  if (!events || events.length === 0) {
    console.log('   No events logged')
  } else {
    for (const e of events) {
      console.log(`   - ${e.event_type} at ${e.created_at} (processed: ${e.processed})`)
    }
  }
}

findAllWorkflows().catch(console.error)
