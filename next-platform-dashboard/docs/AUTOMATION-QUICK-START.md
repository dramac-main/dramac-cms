# Automation Engine - Quick Start Guide

**Phase EM-57B Complete** | **Production Ready** | **Zero TypeScript Errors**

---

## 🎯 What's Been Delivered

### Phase EM-57A: Core Infrastructure ✅
- **10 Database Tables** - Workflows, steps, executions, logs, connections
- **Migration Applied** - `em-57-automation-engine.sql` deployed to Supabase
- **RLS Policies** - Row-level security with site access control
- **Execution Engine** - Step-by-step workflow processor
- **Action Executor** - 40+ actions (CRM, email, webhooks, data, AI)
- **Event System** - Cross-module event subscriptions

### Phase EM-57B: Dashboard UI ✅
- **7 Dashboard Pages** - Complete workflow management interface
- **5 Builder Components** - Drag-and-drop visual workflow builder
- **3 Major Features** - Templates, Analytics, Connections
- **14 Service Integrations** - Slack, Discord, Twilio, SendGrid, etc.
- **20+ Workflow Templates** - Pre-built common automation patterns
- **8 AI Actions** - OpenAI-powered content generation & analysis

### Quality Assurance ✅
- **Zero TypeScript Errors** - Full type safety verified
- **Build Passes** - Production build succeeds
- **Schema Aligned** - Code matches database exactly
- **Testing Guide** - 50-page comprehensive documentation
- **10 Test Scenarios** - Real-world walkthroughs with exact fields

---

## 🚀 Getting Started (5 Minutes)

### 1. Access Automation Dashboard
```
http://localhost:3000/dashboard/[siteId]/automation
```

### 2. Create Your First Workflow
1. Click **"Create Workflow"**
2. Choose **"Welcome New Contacts"** template
3. Click **"Use Template"**
4. Toggle **Active** switch
5. Done! ✨

### 3. Test It
1. Go to CRM → Add Contact
2. Fill in name and email
3. Save contact
4. Return to Automation → View execution log
5. See successful execution with email sent

---

## 📋 What You Can Build

### Event-Triggered Workflows
- Welcome emails on new contact creation
- Deal stage change notifications
- Form submission follow-ups
- Booking confirmations
- Order status updates

### Scheduled Workflows
- Daily/weekly reports
- Recurring reminders
- Cleanup jobs
- Data synchronization
- Backup automation

### Multi-Step Sequences
- Lead nurturing campaigns
- Onboarding flows
- Customer education series
- Re-engagement campaigns
- Win-back sequences

### Integration Workflows
- CRM → Email Marketing sync
- Forms → CRM contact creation
- E-commerce → Fulfillment
- Booking → Calendar sync
- Payment → Invoice generation

---

## 🔗 Key Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **Testing Guide** | 10 real-world test scenarios | `/docs/AUTOMATION-TESTING-GUIDE.md` |
| **Phase EM-57A** | Core infrastructure specs | `/phases/PHASE-EM-57A-AUTOMATION-ENGINE.md` |
| **Phase EM-57B** | UI implementation specs | `/phases/PHASE-EM-57B-AUTOMATION-ENGINE.md` |
| **Migration SQL** | Database schema | `/migrations/em-57-automation-engine.sql` |
| **Source Code** | Implementation | `/src/modules/automation/` |

---

## 📊 Testing Scenarios (Quick Reference)

### Scenario 1: Welcome Email (5 min)
**Test:** Event trigger → Send email
1. Create workflow with `crm.contact_created` trigger
2. Add "Send Email" step with `{{trigger.email}}`
3. Activate workflow
4. Create CRM contact
5. Verify execution log shows success

### Scenario 2: Abandoned Cart (5 min)
**Test:** Template → Delay → Email
1. Use "Abandoned Cart" template
2. Set delay to 2 minutes (testing)
3. Trigger with cart event
4. Wait 2 minutes
5. Verify recovery email sent

### Scenario 3: Slack Notifications (5 min)
**Test:** Connection → Notification
1. Add Slack connection with webhook URL
2. Create workflow: `crm.deal_stage_changed` → Slack
3. Move deal to new stage
4. Check Slack for notification
5. Verify execution log

### Scenario 4: Scheduled Report (5 min)
**Test:** Cron trigger → Data lookup → Email
1. Create workflow with cron `*/5 * * * *` (every 5 min)
2. Add data lookup step
3. Add email report step
4. Activate and wait 5 minutes
5. Verify email received

### Scenario 5: Webhook Integration (5 min)
**Test:** External trigger → CRM action
1. Create webhook endpoint
2. Create workflow with webhook trigger
3. Add CRM "Create Contact" step
4. Test with curl/Postman
5. Verify contact created

---

## 🛠️ Common Workflows (Copy-Paste Ready)

### Welcome Email
```yaml
Name: Welcome New Contacts
Trigger: crm.contact_created
Steps:
  1. Send Email
     - To: {{trigger.email}}
     - Subject: Welcome to DRAMAC! 👋
     - Body: Hi {{trigger.name}}, welcome aboard!
```

### Deal Notification
```yaml
Name: High-Value Deal Alert
Trigger: crm.deal_stage_changed
Steps:
  1. Condition: {{trigger.deal_value}} > 10000
  2. Send Slack Notification (if true)
     - Channel: #sales
     - Message: "🎯 Deal: {{trigger.deal_name}} - ${{trigger.deal_value}}"
```

### Daily Report
```yaml
Name: Morning Contact Report
Trigger: Schedule (0 9 * * 1-5)
Steps:
  1. Data Lookup
     - Table: crm_contacts
     - Filter: created_at >= yesterday
  2. Send Email
     - To: team@company.com
     - Subject: Daily Contact Report
     - Body: Found {{steps.lookup.output.length}} new contacts
```

### Lead Nurturing
```yaml
Name: 5-Day Lead Sequence
Trigger: form.submitted
Steps:
  1. Send Welcome Email
  2. Delay: 2 days
  3. Send Educational Content
  4. Delay: 3 days
  5. Send Case Study + CTA
```

---

## 🎨 Visual Workflow Builder

### Creating Workflows
- **Drag & Drop** - Add steps from action palette
- **Visual Canvas** - See workflow flow diagram
- **Step Configuration** - Click step to configure
- **Variable Mapping** - Use `{{trigger.field}}` or `{{steps.stepName.output.field}}`
- **Conditional Logic** - Add if/else branches
- **Error Handling** - Configure retry/continue/fail

### Variable Reference
```javascript
// Trigger data
{{trigger.email}}
{{trigger.name}}
{{trigger.deal_value}}

// Previous step output
{{steps.lookup_contact.output.company}}
{{steps.calculate_score.output}}

// System variables
{{workflow.id}}
{{workflow.name}}
{{execution.id}}
{{now}}
```

---

## 🔍 Monitoring & Debugging

### View Executions
```
/dashboard/[siteId]/automation/executions
```
Filter by:
- Status (completed, failed, running)
- Workflow
- Date range

### Execution Details
Click execution to see:
- Overall status and duration
- Each step's input/output
- Error messages (if failed)
- Timeline visualization

### Common Issues

**Workflow doesn't trigger:**
- Check workflow is active (`is_active = true`)
- Verify event subscription exists
- Check RLS policies allow access

**Step fails:**
- Review step execution log
- Check variable syntax: `{{trigger.field}}`
- Verify connections are active
- Test connection separately

**Variables not resolving:**
- Ensure field exists in trigger data
- Check previous step output structure
- Use Debug transform to log data

---

## 📈 Analytics Dashboard

View metrics at:
```
/dashboard/[siteId]/automation/analytics
```

**Key Metrics:**
- Total executions
- Success rate %
- Average duration
- Active workflows count

**Charts:**
- Executions over time (line chart)
- Hourly distribution (bar chart)
- Category breakdown (pie chart)
- Top workflows table
- Recent failures table

---

## 🔐 Security & Permissions

### Row-Level Security
- All automation tables use RLS
- Access controlled via `can_access_site(site_id)`
- Service role bypass for background execution

### API Keys & Secrets
- Stored in `automation_connections` table
- Encrypted at rest (for sensitive fields)
- Never exposed in logs
- Tested before saving

### Webhook Security
- Each endpoint has unique secret key
- Signature verification required
- IP whitelisting supported
- Rate limiting enabled

---

## 🚀 Production Deployment

### Pre-Deploy Checklist
- ✅ TypeScript compilation passes
- ✅ Production build succeeds
- ✅ Database migration applied
- ✅ RLS policies verified
- ✅ Environment variables set
- ✅ External services connected

### Environment Variables
```env
# OpenAI (for AI actions)
OPENAI_API_KEY=sk-...

# External Services
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=SG...
```

### Monitoring Setup
1. Enable error alerts
2. Set up execution metrics dashboard
3. Configure log retention (30 days default)
4. Review failed workflows daily
5. Monitor execution performance

---

## 💡 Tips & Best Practices

### Performance
- Keep workflows under 20 steps
- Use conditions to exit early
- Set appropriate timeouts
- Limit external API calls
- Use delays wisely

### Error Handling
- Always configure retry logic
- Set max retries (default: 3)
- Add error notification steps
- Use error branches for recovery
- Log errors for debugging

### Variable Usage
- Test variable resolution first
- Use descriptive step names
- Validate data before using
- Handle null/undefined cases
- Document complex mappings

### Testing
- Test workflows in development first
- Use short delays for testing
- Verify with real data
- Check all branches
- Monitor first production runs

---

## 🎓 Next Steps

1. **Run Test Scenarios** - Follow testing guide
2. **Create First Workflow** - Use template
3. **Set Up Integrations** - Connect services
4. **Monitor Executions** - Review analytics
5. **Build Custom Workflows** - Match business needs

---

## 📞 Support Resources

- **Testing Guide**: Comprehensive 50-page walkthrough
- **Phase Docs**: Detailed implementation specs
- **Source Code**: `/src/modules/automation/`
- **Database Schema**: `/migrations/em-57-automation-engine.sql`
- **Memory Bank**: Context and decisions

---

## 🎉 Success!

Phase EM-57B is complete and production-ready. The automation engine is fully functional with:
- ✅ Visual workflow builder
- ✅ 14 external integrations
- ✅ 20+ pre-built templates
- ✅ Comprehensive testing docs
- ✅ Zero TypeScript errors

**Ready to automate your business workflows!** 🚀
