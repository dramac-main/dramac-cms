# Automation Engine Testing Guide

**Phase EM-57 Complete** | **January 26, 2026** | **Marketplace Integrated**

This guide provides step-by-step real-world walkthroughs to test all automation features with exact field values.

---

## 🚀 Quick Start

**Prerequisites:**
- Dashboard running: `pnpm dev` in `next-platform-dashboard/`
- Supabase running: `npx supabase start`
- At least one site created in your account
- Automation module subscribed (see Setup below)

---

## 📦 Module Setup (First Time)

The Automation module is now in the marketplace and must be subscribed before testing.

### Step 1: Subscribe to Automation Module

1. **Navigate to Marketplace**
   - Go to: `http://localhost:3000/marketplace`
   - Or click **"Browse Modules"** in the sidebar

2. **Find Automation Module**
   - Look for **"Automation Engine"** card with ⚡ icon
   - Or search: "automation"
   - Status should show: **FREE** (for testing)

3. **Subscribe**
   - Click on the Automation Engine card
   - Click **"Subscribe"** button
   - No payment required (module is free for testing)
   - Confirmation: "Successfully subscribed to Automation Engine"

### Step 2: Enable on a Site

1. **Go to Site Details**
   - Navigate to: `http://localhost:3000/dashboard/sites`
   - Click on any site you want to test with

2. **Enable Module**
   - Click the **"Modules"** tab
   - Find **"Automation Engine"** in the list
   - Toggle the switch to **ON** (enable)
   - Status should change to "Enabled"

3. **Open Automation Dashboard**
   - Click the **"Open"** button next to Automation Engine
   - Or navigate to: `http://localhost:3000/dashboard/[siteId]/automation`
   - Replace `[siteId]` with your actual site ID

✅ **You're now ready to test!**

---

## 🧪 Test Environment

- **Main Dashboard**: `http://localhost:3000/dashboard/[siteId]/automation`
- **Workflows List**: `http://localhost:3000/dashboard/[siteId]/automation/workflows`
- **Templates**: `http://localhost:3000/dashboard/[siteId]/automation/templates`
- **Analytics**: `http://localhost:3000/dashboard/[siteId]/automation/analytics`
- **Connections**: `http://localhost:3000/dashboard/[siteId]/automation/connections`

---

## Test Scenario 1: Welcome Email Automation

**Goal:** Create a workflow that sends a welcome email when a new contact is created in CRM.

### Understanding the Workflow Builder

Before we start, here's how the workflow builder is laid out:

**Left Panel** (Sidebar):
- **Top**: Trigger configuration with tabs (Event, Schedule, Webhook, Manual)
- **Bottom**: Actions palette with draggable actions organized by category

**Center**: Canvas where you build your workflow by dragging actions

**Right Panel** (appears when you click a step): Step configuration panel with detailed settings

**Top Bar**: Workflow name, status badges, and action buttons (Settings, Test Run, Save)

---

### Step 1: Create the Workflow

1. Go to **Automation Dashboard** (`/dashboard/[siteId]/automation`)
2. Click **"New Workflow"** or **"Create Workflow"** button
3. A dialog will appear. Fill in the form:
   ```
   Name: Welcome New Contacts
   Description: Send welcome email to new CRM contacts
   ```
4. Click **"Continue"**
5. The workflow builder will open with your new workflow

### Step 2: Configure Event Trigger

The trigger panel is already visible on the left side of the workflow builder.

1. In the **Trigger** section (left panel), the **"Event"** tab should already be selected
2. Click the **"Event Type"** dropdown (it says "Select an event...")
3. Scroll down to the **"👤 CRM"** section
4. Select **"Contact created"** from the list (this is `crm.contact.created`)
5. (Optional) In the **"Filter (Optional)"** field, you can add JSON conditions to filter which contacts trigger the workflow
   - For now, leave this empty to trigger for all new contacts
6. The trigger is automatically saved as you make changes

### Step 3: Add Email Step

Now we'll add an action to send a welcome email.

1. Look at the **"Actions"** panel on the left side (below the Trigger section)
2. Scroll down to the **"📧 Communication"** category
3. Find **"📧 Send Email"** in the list
4. **Drag** the "Send Email" action from the panel and **drop** it onto the canvas (the center area with "Drag actions here to build your workflow")
5. The action will appear as a step card on the canvas
6. **Click on the step card** you just added
7. The **Step Config Panel** will open on the right side
8. Configure the email step with these values:

   **Basic Info:**
   - **Name**: `Send Welcome Email` (replace default name)
   - **Description**: `Sends welcome email to new contacts` (optional)

   **Email Settings (scroll down in the config panel):**
   - **To**: `{{trigger.email}}` (this uses the contact's email from the trigger)
   - **Subject**: `Welcome to DRAMAC! 👋`
   - **Body**: 
     ```
     Hi {{trigger.first_name}},
     
     Welcome to DRAMAC! We're excited to have you join us.
     
     Your contact details:
     - Email: {{trigger.email}}
     - Phone: {{trigger.phone}}
     
     Best regards,
     The DRAMAC Team
     ```
   - **From Name**: `DRAMAC CRM Team`
   - **Reply To**: Leave blank (optional)

9. The step configuration is automatically saved as you type
10. Click the **X** or close button to close the config panel

### Step 4: Save and Activate Workflow

1. Look at the **top left** of the workflow builder - you'll see a **"Back"** button to return to the automation dashboard
2. Look at the **top right** of the workflow builder
3. Click the **"Save Workflow"** button (has a save icon 💾)
4. A toast notification will appear: "Workflow saved successfully"
5. To activate the workflow, click the **"Settings"** button (gear icon ⚙️)
6. In the settings panel on the right, find the **"Active"** section
7. Click the button to change it from **"Inactive"** to **"Active"**
8. The workflow status badge at the top should now show a green **"Active"** badge
9. Click **"Save Workflow"** again to save the active status
10. The active status will now persist (fixed in latest update!)

**Alternative: Activate from Workflows List**
1. Navigate to **All Workflows** (`/dashboard/[siteId]/automation/workflows`)
2. Find your workflow in the list
3. Click the **⋮** (three dots) menu on the right
4. Select **"Activate"** from the dropdown
5. The status badge will change from "Paused" to "Active"

### Step 5: Test the Workflow

1. Navigate to **CRM Module** (`/dashboard/[siteId]/crm/contacts`)
2. Click **"Add Contact"**
3. Fill in contact details:
   ```
   First Name: John
   Last Name: Doe
   Email: john.doe@example.com
   Phone: (555) 123-4567
   Company: Test Company
   ```
4. Click **"Save Contact"**

### Step 6: Verify Execution

1. Return to **Automation Dashboard**
2. Click **"Executions"** button in Quick Actions or go to `/dashboard/[siteId]/automation/executions`
3. You should see a new execution with:
   ```
   Workflow: Welcome New Contacts
   Status: Completed (green)
   Trigger: Event
   Duration: ~2-5 seconds
   Steps: 1/1
   ```
4. Click **"View Details"** button on the execution row
5. The execution detail page will show:
   - **Execution Status**: Completed with green badge
   - **Trigger Type**: Event Trigger
   - **Duration**: Actual execution time in seconds
   - **Steps**: 1/1 completed
   - **Trigger Data**: Full JSON of the contact that was created
   - **Step Execution Logs**: Detailed log for the "Send Welcome Email" step
6. Expand the step log to see:
   - **Input Data**: Email configuration with resolved variables ({{trigger.email}}, etc.)
   - **Output Data**: Email sending result with success status
   - **Duration**: How long the step took to execute
   - **Status**: Completed with green checkmark icon
7. Verify the email step shows:
   ```json
   Input: { 
     "to": "john.doe@example.com", 
     "subject": "Welcome to DRAMAC! 👋",
     "body": "Hi John,\n\nWelcome to DRAMAC!...",
     "from_name": "DRAMAC CRM Team"
   }
   Output: { 
     "success": true, 
     "message_id": "msg_abc123...",
     "provider": "resend"
   }
   ```

---

## Test Scenario 2: Abandoned Cart Recovery

**Goal:** Send an email 24 hours after a cart is abandoned in e-commerce.

### Step 1: Create Workflow from Template

1. Go to **Templates** (`/dashboard/[siteId]/automation/templates`)
2. Search for: **"Abandoned Cart"**
3. Click on **"Abandoned Cart Recovery"** template
4. Preview the template (shows 3 steps):
   - Trigger: ecommerce.cart_abandoned
   - Delay: 24 hours
   - Action: Send recovery email
5. Click **"Use Template"**
6. Workflow is created automatically

### Step 2: Customize the Email

1. Click on the **"Send Recovery Email"** step
2. Modify the email body:
   ```
   Subject: Don't forget your items! 🛒
   
   Body:
   Hi {{trigger.customer_name}},
   
   You left some great items in your cart:
   
   {{#each trigger.cart_items}}
   - {{this.name}} - ${{this.price}}
   {{/each}}
   
   Total: ${{trigger.cart_total}}
   
   Complete your purchase now and get 10% off with code: COMEBACK10
   
   [Complete Purchase]({{trigger.checkout_url}})
   ```
3. Click **"Save Step"**

### Step 3: Activate and Test

1. Toggle workflow to **Active**
2. Go to E-commerce module
3. Add items to cart but don't complete purchase
4. Wait 24 hours (or modify delay to 2 minutes for testing)
5. Check executions for the triggered workflow

---

## Test Scenario 3: CRM Deal Stage Notifications

**Goal:** Notify team via Slack when a deal reaches "Proposal Sent" stage.

### Step 1: Create Slack Connection

1. Go to **Connections** (`/dashboard/[siteId]/automation/connections`)
2. Click **"Add Connection"**
3. Select service: **"Slack"**
4. Fill in connection details:
   ```
   Connection Name: Team Slack Workspace
   Webhook URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   Channel: #sales-notifications
   ```
5. Click **"Test Connection"** (should send test message to Slack)
6. Click **"Save Connection"**

### Step 2: Create Workflow

1. Create new workflow:
   ```
   Name: Deal Stage - Proposal Sent Alert
   Description: Notify sales team when deal reaches proposal stage
   ```

### Step 3: Configure Trigger

The trigger panel is already visible on the left side.

1. In the **Trigger** section (left panel), ensure **"Event"** tab is selected
2. Click the **"Event Type"** dropdown
3. Scroll to **"👤 CRM"** section
4. Select **"Deal stage_changed"** (this is `crm.deal.stage_changed`)
5. In the **"Filter (Optional)"** field, enter:
   ```json
   {"new_stage": "proposal_sent"}
   ```
   This ensures the workflow only triggers when deals move to "Proposal Sent" stage
6. The trigger is automatically saved

### Step 4: Add Condition Step

1. In the **Actions** panel (left side), scroll to **"🔀 Flow Control"**
2. **Drag** the **"Condition (If/Else)"** action onto the canvas
3. **Click** the condition step card on the canvas
4. In the **Step Config Panel** (right side), configure:
   - **Name**: `Check Deal Value`
   - Add a condition:
     - **Field**: `{{trigger.deal_value}}`
     - **Operator**: `greater_than` (select from dropdown)
     - **Value**: `10000`
5. This ensures we only notify for deals over $10k
6. Close the config panel

### Step 5: Add Slack Notification
In the **Actions** panel, scroll to **"📧 Communication"**
2. **Drag** the **"Send to Slack"** action onto the canvas (below the condition)
3. **Click** the Slack notification step
4. In the **Step Config Panel**, configure:
   - **Name**: `Notify Sales Team`
   - **Webhook URL**: Your Slack webhook URL (or select from connections)
   - **Channel**: `#sales-notifications`
   - **Message**:
     ```
     🎯 High-Value Proposal Sent!
     
     Deal: {{trigger.deal_name}}
     Value: ${{trigger.deal_value}}
     Company: {{trigger.company_name}}
     Owner: {{trigger.owner_name}}
     
     Stage: Proposal Sent → Negotiation
     
     [View Deal](https://app.dramac.com/crm/deals/{{trigger.deal_id}})
     ```
5. Close the config panel
6. Click **"Save Workflow"** at the top
4. Click **"Save Step"**

### Step 6: Test Workflow

1. Activate the workflow
2. Go to CRM Deals
3. Move a deal worth >$10k to "Proposal Sent" stage
4. Check Slack channel for notification
5. Verify execution logs in automation dashboard

---

## Test Scenario 4: Scheduled Daily Report

**Goal:** Send a daily report of new contacts at 9 AM every weekday.

### Step 1: Create Scheduled Workflow

1. Create new workflow:
   ```
   Name: Daily Contact Report
   Description: Morning report of yesterday's new contacts
   ```

### Step 2: Configure Schedule Trigger

1. Set trigger type: **"Schedule"**
2. Configure schedule:
   ```
   Cron Expression: 0 9 * * 1-5
   (Every weekday at 9:00 AM)
   
   Timezone: America/New_York
   ```

### Step 3: Add Data Lookup Step

1. Add step: **"Data Lookup"**
2. Configure:
   ```
   Step Name: Get Yesterday's Contacts
   
   Table: crm_contacts
   Filters:
   {
     "created_at": {
       "gte": "{{yesterday_start}}",
       "lt": "{{today_start}}"
     }
   }
   Order By: created_at DESC
   Limit: 100
   
   Output Key: new_contacts
   ```

### Step 4: Add Transform Step

1. Add step: **"Transform Data"**
2. Configure:
   ```
   Step Name: Format Contact List
   
   Transform Type: template
   
   Template:
   {{#each steps.lookup_contacts.output}}
   - {{this.name}} ({{this.email}}) - {{this.company}}
   {{/each}}
   
   Output Key: formatted_list
   ```

### Step 5: Add Email Report

1. Add step: **"Send Email"**
2. Configure:
   ```
   To Email: sales@yourcompany.com
   Subject: 📊 Daily Contact Report - {{date}}
   
   Body:
   Good morning!
   
   Yesterday we added {{steps.lookup_contacts.output.length}} new contacts:
   
   {{steps.format_list.output}}
   
   Total contacts in database: {{total_contacts}}
   ```

### Step 6: Test Workflow

1. Activate workflow
2. Click **"Test Run"** (manual trigger)
3. Verify email is received
4. Check execution logs
5. Wait for scheduled run next morning

---

## Test Scenario 5: Multi-Step Lead Nurturing

**Goal:** 3-email sequence for new leads over 5 days.

### Step 1: Use Template

1. Go to Templates
2. Select **"Lead Nurturing - 5 Day Sequence"**
3. Click **"Use Template"**

### Step 2: Review Workflow Structure

The template creates:
```
1. Trigger: form.submitted (lead capture form)
2. Step 1: Send Welcome Email (immediate)
3. Delay: 2 days
4. Step 2: Send Educational Content
5. Delay: 3 days
6. Step 3: Send Case Study + Call to Action
```

### Step 3: Customize Emails

**Email 1 - Welcome (Day 0):**
```
Subject: Thanks for your interest! 🎉

Hi {{trigger.first_name}},

Thanks for downloading our guide. Here's what's next...

[Your content here]
```

**Email 2 - Educational (Day 2):**
```
Subject: Here's how [Feature] can help you

Hi {{trigger.first_name}},

Based on your industry ({{trigger.industry}}), here are 3 ways we can help...

[Your content here]
```

**Email 3 - Case Study (Day 5):**
```
Subject: See how {{trigger.industry}} companies succeed

Hi {{trigger.first_name}},

Companies like yours are seeing 3x ROI...

[Case study + CTA]

[Schedule a Demo]({{demo_booking_link}})
```

### Step 4: Add CRM Integration

1. After Email 1, add step: **"Update CRM Contact"**
2. Configure:
   ```
   Action: Add Tag
   Contact Email: {{trigger.email}}
   Tag: lead-nurture-enrolled
   ```

### Step 5: Test the Sequence

1. Activate workflow
2. Submit a form (or manually trigger)
3. Check email 1 arrives immediately
4. Modify delays to 1 minute for testing
5. Verify all 3 emails arrive in sequence
6. Check CRM contact has correct tag

---

## Test Scenario 6: API Webhook Integration

**Goal:** Trigger workflow from external service via webhook.

### Step 1: Create Webhook Endpoint

1. Go to **Connections** tab
2. Click **"Create Webhook"**
3. Configure:
   ```
   Name: Zapier Integration
   Description: Receive events from Zapier
   ```
4. Click **"Create"**
5. Copy the generated webhook URL:
   ```
   https://your-domain.com/api/webhooks/automation/abc123xyz
   ```
6. Copy the secret key (for signature verification)

### Step 2: Create Webhook Workflow

1. Create new workflow:
   ```
   Name: Process Zapier Webhook
   Description: Handle incoming webhook events
   ```

### Step 3: Configure Webhook Trigger

1. Set trigger type: **"Webhook"**
2. Select webhook endpoint: **"Zapier Integration"**
3. Configure payload validation:
   ```
   Required Fields:
   - event_type
   - user_email
   - data
   ```

### Step 4: Add Conditional Processing

1. Add step: **"Condition"**
2. Configure:
   ```
   Condition: {{trigger.event_type}} equals "user_signup"
   ```

### Step 5: Add CRM Action

1. Add step (if condition true): **"Create CRM Contact"**
2. Configure:
   ```
   First Name: {{trigger.data.first_name}}
   Last Name: {{trigger.data.last_name}}
   Email: {{trigger.user_email}}
   Source: Zapier Webhook
   Tags: webhook-import, {{trigger.event_type}}
   ```

### Step 6: Test Webhook

Use curl or Postman:
```bash
curl -X POST https://your-domain.com/api/webhooks/automation/abc123xyz \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: YOUR_SECRET_KEY" \
  -d '{
    "event_type": "user_signup",
    "user_email": "test@example.com",
    "data": {
      "first_name": "Jane",
      "last_name": "Smith",
      "company": "Tech Corp"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "execution_id": "uuid-here",
  "message": "Workflow triggered successfully"
}
```

---

## Test Scenario 7: Conditional Branching

**Goal:** Route contacts to different sequences based on industry.

### Step 1: Create Workflow

```
Name: Industry-Based Routing
Description: Send different content based on contact industry
```

### Step 2: Event Trigger

```
Event Type: crm.contact_created
```

### Step 3: Add First Condition

1. Add step: **"Condition"**
2. Configure:
   ```
   Name: Check if Tech Industry
   Condition: {{trigger.industry}} equals "Technology"
   ```

### Step 4: Branch A - Tech Industry

If condition is TRUE:
1. Add step: **"Send Email"**
   ```
   Subject: Tech Solutions for {{trigger.company}}
   Body: [Tech-specific content]
   ```
2. Add step: **"Add Tag"**
   ```
   Tag: tech-industry
   ```

### Step 5: Branch B - Other Industries

If condition is FALSE:
1. Add another condition: **"Check if Healthcare"**
   ```
   Condition: {{trigger.industry}} equals "Healthcare"
   ```
2. If TRUE:
   ```
   Send Healthcare-specific email
   Tag: healthcare-industry
   ```
3. If FALSE:
   ```
   Send Generic email
   Tag: general-industry
   ```

### Step 6: Test All Branches

1. Create contact with industry: "Technology"
   - Verify tech email sent
   - Verify tech-industry tag added

2. Create contact with industry: "Healthcare"
   - Verify healthcare email sent
   - Verify healthcare-industry tag added

3. Create contact with industry: "Retail"
   - Verify generic email sent
   - Verify general-industry tag added

---

## Test Scenario 8: Error Handling & Retries

**Goal:** Test workflow recovery from failures.

### Step 1: Create Test Workflow

```
Name: Error Handling Test
Description: Test retry and error branch logic
```

### Step 2: Add Failing Step

1. Add step: **"Send Webhook"**
2. Configure with invalid URL:
   ```
   URL: https://invalid-domain-that-doesnt-exist.com/api
   Method: POST
   Timeout: 5 seconds
   
   Error Handling:
   On Error: retry
   Max Retries: 3
   Retry Delay: 10 seconds
   ```

### Step 3: Add Error Branch

1. Add step (runs on error): **"Send Notification"**
2. Configure:
   ```
   Type: Email
   To: admin@yourcompany.com
   Subject: ⚠️ Workflow Failed
   Body: Workflow {{workflow.name}} failed after 3 retries
   ```

### Step 4: Test Failure Handling

1. Activate workflow
2. Trigger manually
3. Watch execution logs:
   ```
   Attempt 1: Failed (connection timeout)
   Wait 10 seconds...
   Attempt 2: Failed (connection timeout)
   Wait 10 seconds...
   Attempt 3: Failed (connection timeout)
   → Error branch triggered
   → Notification sent to admin
   ```
4. Verify final status: **"Failed"** with error details

---

## Test Scenario 9: Data Transformation

**Goal:** Transform and enrich data before sending to external system.

### Step 1: Create Workflow

```
Name: Contact Data Enrichment
Trigger: crm.contact_created
```

### Step 2: Add Transform Steps

**Step 1: Format Phone Number**
```
Type: Transform - Template
Input: {{trigger.phone}}
Template: {{trigger.phone | replace: '(', '' | replace: ')', '' | replace: '-', '' | replace: ' ', ''}}
Output Key: clean_phone
```

**Step 2: Generate Full Name**
```
Type: Transform - Template
Template: {{trigger.first_name}} {{trigger.last_name}}
Output Key: full_name
```

**Step 3: Calculate Lead Score**
```
Type: Transform - Math
Operation: add
Values:
- {{trigger.company_size > 100 ? 20 : 0}}
- {{trigger.budget > 50000 ? 30 : 0}}
- {{trigger.decision_maker ? 25 : 0}}
Output Key: lead_score
```

### Step 3: Add Conditional Logic

```
Condition: {{steps.calculate_score.output}} >= 50
```

If TRUE:
```
- Create deal in CRM with high priority
- Assign to senior sales rep
- Send immediate notification
```

If FALSE:
```
- Add to nurture sequence
- Assign to SDR team
```

### Step 4: Test Transformation

Input data:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "(555) 123-4567",
  "company_size": 150,
  "budget": 75000,
  "decision_maker": true
}
```

Expected output:
```json
{
  "clean_phone": "5551234567",
  "full_name": "John Doe",
  "lead_score": 75,
  "action": "create_high_priority_deal"
}
```

---

## Common Testing Scenarios

### Scenario 10: Analytics Dashboard Verification

1. Navigate to **Analytics** (`/dashboard/[siteId]/automation/analytics`)
2. Verify displayed metrics:
   ```
   Total Executions: [number]
   Success Rate: [percentage]
   Avg Duration: [time in ms]
   Active Workflows: [count]
   ```
3. Check charts load:
   - Executions Over Time (line chart)
   - Hourly Distribution (bar chart)
   - Category Distribution (pie chart)
4. Verify **Top Workflows** table shows workflows by execution count
5. Verify **Recent Failures** table shows failed executions with retry button

### Scenario 11: Connection Testing

**Test Each Service Type:**

1. **Slack**
   - Connection URL: Slack webhook URL
   - Test: Send test message
   - Verify: Message appears in Slack channel

2. **Discord**
   - Connection URL: Discord webhook URL
   - Test: Send test embed
   - Verify: Message appears in Discord channel

3. **Twilio**
   - Account SID, Auth Token, From Number
   - Test: Send test SMS
   - Verify: SMS received

4. **SendGrid**
   - API Key
   - Test: Send test email
   - Verify: Email received

5. **Paddle** (Platform Billing)
   - API Key (test mode - sandbox)
   - Test: Fetch subscription list
   - Verify: Connection successful
   - Note: Paddle is used for platform billing (Zambia-compatible payouts via Payoneer/Wise)

6. **Custom Webhook**
   - URL, Method, Headers
   - Test: Send test payload
   - Verify: Endpoint responds 200

---

## Testing Checklist

### Core Functionality
- [ ] Create workflow from scratch
- [ ] Create workflow from template
- [ ] Duplicate existing workflow
- [ ] Edit workflow steps
- [ ] Reorder workflow steps
- [ ] Delete workflow steps
- [ ] Activate/deactivate workflows
- [ ] Delete workflows

### Trigger Types
- [ ] Event trigger (CRM, forms, etc.)
- [ ] Schedule trigger (cron)
- [ ] Webhook trigger
- [ ] Manual trigger

### Step Types
- [ ] Action steps (email, CRM, etc.)
- [ ] Condition steps (if/else)
- [ ] Delay steps (wait)
- [ ] Transform steps (data manipulation)
- [ ] Loop steps (iterate arrays)

### Error Handling
- [ ] Retry on failure (max retries)
- [ ] Continue on error
- [ ] Error branch execution
- [ ] Timeout handling

### Integrations
- [ ] CRM actions (create, update, delete)
- [ ] Email sending (custom & templates)
- [ ] Slack notifications
- [ ] Discord notifications
- [ ] Webhook POST/GET requests
- [ ] Database CRUD operations

### Execution Management
- [ ] View execution history
- [ ] View execution details
- [ ] Cancel running execution
- [ ] Retry failed execution
- [ ] Filter by status
- [ ] Search executions

### Analytics & Monitoring
- [ ] View dashboard stats
- [ ] Execution charts load
- [ ] Top workflows table
- [ ] Recent failures table
- [ ] Export execution logs

---

## Troubleshooting Common Issues

### Issue: Create Workflow dialog doesn't appear

**Symptoms:**
- Clicking "New Workflow" or "Create Workflow" button does nothing
- No dialog/popup appears

**Check:**
1. Browser console for JavaScript errors
2. Button is clickable (not disabled)
3. Dialog component loaded correctly

**Solution:**
1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Check console errors - may indicate missing component
3. Verify CreateWorkflowButton and CreateWorkflowDialog are exported from automation module
4. Try clearing browser cache

### Issue: Can't find Automation in marketplace

**Check:**
1. Module is registered in `modules_v2` table
2. Status is `active`
3. Run the registration migration: `em-57-register-automation-module.sql`

**Solution:**
```sql
-- Check module exists
SELECT id, name, slug, status 
FROM modules_v2 
WHERE slug = 'automation';

-- If missing, run migration
-- migrations/em-57-register-automation-module.sql
```

### Issue: "Subscribe" button doesn't work

**Check:**
1. You're logged in with an agency account
2. Module pricing_type is set (should be "free" for testing)
3. No existing subscription conflicts

**Solution:**
```sql
-- Check existing subscriptions
SELECT * FROM agency_module_subscriptions 
WHERE agency_id = 'your-agency-id' 
  AND module_slug = 'automation';

-- Make module free if needed
npx tsx scripts/make-module-free-for-testing.ts automation
```

### Issue: Module not appearing in Site > Modules tab

**Check:**
1. Agency has subscribed to the module
2. `agency_module_subscriptions` record exists
3. Module status is "active"

**Solution:**
```sql
-- Check subscription
SELECT ams.*, m.name, m.status
FROM agency_module_subscriptions ams
JOIN modules_v2 m ON m.slug = ams.module_slug
WHERE ams.agency_id = 'your-agency-id'
  AND ams.module_slug = 'automation';
```

### Issue: "Open" button doesn't appear after enabling

**Check:**
1. Module slug is `automation` (exactly)
2. `site-modules-tab.tsx` includes automation in Open button logic
3. Browser cache (try hard refresh: Ctrl+Shift+R)

**Solution:**
- Verify line 147 in `site-modules-tab.tsx` includes `|| module.slug === 'automation'`
- Clear browser cache and refresh

### Issue: Workflow doesn't trigger

**Check:**
1. Workflow is activated (`is_active = true`)
2. Event subscription exists in `automation_event_subscriptions` table
3. Event is being emitted by source module
4. RLS policies allow access to workflow

**Solution:**
```sql
-- Check workflow status
SELECT id, name, is_active, trigger_type 
FROM automation_workflows 
WHERE id = 'your-workflow-id';

-- Check event subscriptions
SELECT * FROM automation_event_subscriptions 
WHERE workflow_id = 'your-workflow-id';
```

### Issue: Step fails with "Permission denied"

**Check:**
1. User has permissions for the action
2. RLS policies allow the operation
3. API keys/credentials are valid

**Solution:**
```sql
-- Check user permissions
SELECT * FROM user_permissions 
WHERE user_id = auth.uid();

-- Test with service_role temporarily
```

### Issue: Variables not resolving

**Check:**
1. Variable syntax: `{{trigger.field}}` or `{{steps.step_name.output.field}}`
2. Field exists in trigger data
3. Previous step output contains expected data

**Solution:**
```
Add a Transform step to log data:
Input: {{trigger}}
Output: debug_trigger
Check execution logs for actual data structure
```

### Issue: Execution stuck in "pending"

**Check:**
1. Execution engine is running
2. No infinite loops in workflow
3. Database connections are healthy

**Solution:**
```sql
-- Check pending executions
SELECT * FROM workflow_executions 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- Cancel stuck execution
UPDATE workflow_executions 
SET status = 'cancelled' 
WHERE id = 'stuck-execution-id';
```

---

## Performance Testing

### Load Test: High Volume Triggers

```javascript
// Simulate 1000 contact creations
for (let i = 0; i < 1000; i++) {
  await createContact({
    first_name: `Test${i}`,
    last_name: `User`,
    email: `test${i}@example.com`
  });
}
```

**Expected:**
- All workflows trigger correctly
- No executions fail due to concurrency
- Average execution time < 5 seconds
- Queue processes efficiently

### Stress Test: Complex Workflows

Create workflow with:
- 20+ steps
- Multiple conditions
- Data transformations
- External API calls

**Expected:**
- Execution completes successfully
- Memory usage stays reasonable
- No timeouts
- All steps logged correctly

---

## Next Steps

After completing these tests:

1. **Monitor Production**
   - Set up error alerts
   - Track execution metrics
   - Review failed workflows daily

2. **Document Custom Workflows**
   - Create templates for common patterns
   - Share with team
   - Build workflow library

3. **Optimize Performance**
   - Identify slow steps
   - Add caching where appropriate
   - Optimize database queries

4. **Extend Functionality**
   - Add custom actions
   - Create new integrations
   - Build advanced templates

---

## Support & Resources

- **Documentation**: `/docs/AUTOMATION-MODULE.md`
- **Phase Docs**: `/phases/enterprise-modules/PHASE-EM-57A-AUTOMATION-ENGINE.md`
- **Migration File**: `/migrations/em-57-automation-engine.sql`
- **Code**: `/src/modules/automation/`

For issues or questions, check the execution logs first. Most problems show clear error messages in the step execution logs.
