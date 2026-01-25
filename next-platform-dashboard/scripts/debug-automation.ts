/**
 * Debug script to trace the automation event pipeline
 * 
 * This script checks:
 * 1. Workflow exists and is active
 * 2. Workflow has correct trigger_config with event_type
 * 3. Event subscription exists in automation_event_subscriptions
 * 4. Events are being logged to automation_events_log
 * 5. Workflow executions are being created
 * 
 * Usage: npx tsx scripts/debug-automation.ts <site-id>
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugAutomation(siteId?: string) {
  console.log('\n🔍 AUTOMATION DEBUG SCAN\n')
  console.log('=' .repeat(60))

  // 1. Get all sites or specific site
  if (!siteId) {
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(5)
    
    console.log('\n📍 Available sites:')
    sites?.forEach(s => console.log(`   - ${s.id}: ${s.name}`))
    
    if (sites && sites.length > 0) {
      siteId = sites[0].id
      console.log(`\n   Using first site: ${siteId}`)
    }
  }

  if (!siteId) {
    console.error('No site found!')
    return
  }

  // 2. Check workflows for this site
  console.log('\n\n📋 WORKFLOWS for site:', siteId)
  console.log('-'.repeat(60))
  
  const { data: workflows, error: wfError } = await supabase
    .from('automation_workflows')
    .select('id, name, is_active, trigger_type, trigger_config')
    .eq('site_id', siteId)
  
  if (wfError) {
    console.error('   ❌ Error fetching workflows:', wfError.message)
  } else if (!workflows || workflows.length === 0) {
    console.log('   ⚠️  No workflows found for this site')
  } else {
    for (const wf of workflows) {
      console.log(`\n   📦 Workflow: ${wf.name}`)
      console.log(`      ID: ${wf.id}`)
      console.log(`      Active: ${wf.is_active ? '✅ YES' : '❌ NO'}`)
      console.log(`      Trigger Type: ${wf.trigger_type}`)
      console.log(`      Trigger Config:`, JSON.stringify(wf.trigger_config, null, 2).split('\n').map(l => '      ' + l).join('\n'))
      
      // Check if trigger_config has event_type
      const config = wf.trigger_config as Record<string, unknown>
      if (wf.trigger_type === 'event' && !config?.event_type) {
        console.log(`      ⚠️  WARNING: trigger_type is 'event' but no event_type in trigger_config!`)
      }
    }
  }

  // 3. Check event subscriptions
  console.log('\n\n📡 EVENT SUBSCRIPTIONS')
  console.log('-'.repeat(60))
  
  const { data: subs, error: subError } = await supabase
    .from('automation_event_subscriptions')
    .select('*')
    .eq('site_id', siteId)
  
  if (subError) {
    console.error('   ❌ Error fetching subscriptions:', subError.message)
    console.error('   (Table might not exist - run em-57 migration)')
  } else if (!subs || subs.length === 0) {
    console.log('   ⚠️  NO EVENT SUBSCRIPTIONS FOUND!')
    console.log('   This means workflows won\'t trigger on events.')
    console.log('   Subscriptions should be created when workflow is activated.')
    console.log('')
    console.log('   🔧 FIX: Toggle the workflow to Inactive, Save, then back to Active, Save.')
  } else {
    for (const sub of subs) {
      console.log(`\n   📡 Subscription: ${sub.id}`)
      console.log(`      Event Type: ${sub.event_type}`)
      console.log(`      Workflow ID: ${sub.workflow_id}`)
      console.log(`      Active: ${sub.is_active ? '✅ YES' : '❌ NO'}`)
      console.log(`      Events Received: ${sub.events_received || 0}`)
      console.log(`      Last Event: ${sub.last_event_at || 'Never'}`)
    }
  }

  // 4. Check recent events
  console.log('\n\n📝 RECENT EVENTS (last 10)')
  console.log('-'.repeat(60))
  
  const { data: events, error: eventError } = await supabase
    .from('automation_events_log')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (eventError) {
    console.error('   ❌ Error fetching events:', eventError.message)
    console.error('   (Table might not exist - run em-57 migration)')
  } else if (!events || events.length === 0) {
    console.log('   ⚠️  No events logged yet')
    console.log('   Events should be logged when CRM contacts are created.')
  } else {
    for (const event of events) {
      console.log(`\n   📝 Event: ${event.event_type}`)
      console.log(`      ID: ${event.id}`)
      console.log(`      Created: ${event.created_at}`)
      console.log(`      Processed: ${event.processed ? '✅' : '❌'}`)
      console.log(`      Workflows Triggered: ${event.workflows_triggered || 0}`)
      console.log(`      Source: ${event.source_module || 'unknown'}`)
    }
  }

  // 5. Check workflow executions
  console.log('\n\n⚡ WORKFLOW EXECUTIONS (last 10)')
  console.log('-'.repeat(60))
  
  const { data: executions, error: execError } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (execError) {
    console.error('   ❌ Error fetching executions:', execError.message)
  } else if (!executions || executions.length === 0) {
    console.log('   ⚠️  No workflow executions yet')
  } else {
    for (const exec of executions) {
      console.log(`\n   ⚡ Execution: ${exec.id}`)
      console.log(`      Workflow ID: ${exec.workflow_id}`)
      console.log(`      Status: ${exec.status}`)
      console.log(`      Trigger Type: ${exec.trigger_type}`)
      console.log(`      Created: ${exec.created_at}`)
    }
  }

  // 6. Summary and recommendations
  console.log('\n\n📊 DIAGNOSIS SUMMARY')
  console.log('=' .repeat(60))
  
  const activeWorkflows = workflows?.filter(w => w.is_active) || []
  const eventWorkflows = activeWorkflows.filter(w => w.trigger_type === 'event')
  const subsCount = subs?.length || 0
  const eventsCount = events?.length || 0
  
  console.log(`   Active Workflows: ${activeWorkflows.length}`)
  console.log(`   Event-triggered Workflows: ${eventWorkflows.length}`)
  console.log(`   Event Subscriptions: ${subsCount}`)
  console.log(`   Events Logged: ${eventsCount}`)
  
  if (eventWorkflows.length > 0 && subsCount === 0) {
    console.log('\n   🚨 PROBLEM: Event workflows exist but NO subscriptions!')
    console.log('   The activateWorkflow() function is not creating subscriptions.')
    console.log('')
    console.log('   SOLUTION:')
    console.log('   1. Check that activateWorkflow in automation-actions.ts')
    console.log('      is correctly calling upsert on automation_event_subscriptions')
    console.log('   2. Toggle workflow off and back on to create subscription')
  }
  
  if (subsCount > 0 && eventsCount === 0) {
    console.log('\n   🚨 PROBLEM: Subscriptions exist but NO events logged!')
    console.log('   The CRM is not calling logAutomationEvent() on contact creation.')
    console.log('')
    console.log('   SOLUTION:')
    console.log('   1. Check crm-actions.ts createContact() calls logAutomationEvent')
    console.log('   2. Verify the import is correct')
  }
  
  if (eventsCount > 0 && (executions?.length || 0) === 0) {
    console.log('\n   🚨 PROBLEM: Events logged but NO executions created!')
    console.log('   The processEventImmediately() function is not triggering workflows.')
    console.log('')
    console.log('   SOLUTION:')
    console.log('   1. Check if event_type matches between event and subscription')
    console.log('   2. Check if subscription is_active = true')
    console.log('   3. Check if workflow is_active = true')
  }
  
  console.log('\n')
}

// Run with optional site ID from command line
const siteId = process.argv[2]
debugAutomation(siteId).catch(console.error)
