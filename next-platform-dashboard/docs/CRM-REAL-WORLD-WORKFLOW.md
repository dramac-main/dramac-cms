# CRM Real-World Workflow Guide

**Last Updated**: January 24, 2026  
**Module**: CRM Module (crmmod01)

This guide shows **actual workflows** agencies would use with the CRM system, from initial setup through daily operations.

---

## Scenario: Digital Marketing Agency - "Acme Digital"

**Agency Profile:**
- **Name**: Acme Digital
- **Team**: 8 people (Owner, 2 Account Managers, 3 Developers, 2 Designers)
- **Clients**: 15 active clients, each with 1-3 websites
- **Sites**: 28 total sites managed
- **Business Model**: Web design, development, maintenance, SEO services

---

## Week 1: Initial Setup

### Day 1 - Monday: Agency Owner Sets Up CRM

**Sarah (Owner) logs in:**

1. **Discovers CRM**
   - Logs into DRAMAC dashboard
   - Sees "CRM" in the sidebar (new feature!)
   - Clicks CRM → Sees agency overview page
   - Views: "You have 28 sites. Click on a site to access its CRM"

2. **Chooses First Site to Test**
   - Clicks on "Bright Solutions Website" (their biggest client)
   - Navigates to `/dashboard/abc-123-site-id/crm`
   - CRM auto-initializes:
     - Creates "Sales Pipeline"
     - Adds 6 stages: Lead → Qualified → Proposal → Negotiation → Won → Lost
   - Sees empty CRM dashboard with "Add your first contact" prompt

3. **Imports Existing Client Data**
   - Clicks "Contacts" tab
   - Has 15 contacts in spreadsheet from old CRM
   - Manually adds first contact: **John Davis** (CEO at Bright Solutions)
     - Name: John Davis
     - Email: john@brightsolutions.com
     - Phone: +1-555-0123
     - Company: Creates new company "Bright Solutions"
     - Job Title: CEO
     - Tags: ["Decision Maker", "Web Design Client"]
     - Notes: "Great relationship, referred us to 3 other companies"

4. **Adds More Contacts**
   - Adds **Lisa Chen** (Marketing Director) - same company
   - Adds **Mike Roberts** (IT Manager) - same company
   - Total: 3 contacts linked to Bright Solutions company

### Day 2 - Tuesday: Account Manager Starts Using CRM

**Tom (Account Manager) logs in:**

1. **Gets Onboarded**
   - Sarah shows Tom the CRM during morning standup
   - Tom clicks CRM in sidebar → Sees all 28 sites
   - Clicks on "Tech Startup Co Website" (his main account)
   - Sees empty CRM - adds his contacts

2. **Adds Multiple Companies**
   - **Tech Startup Co** (existing client)
     - 2 contacts: Founder + CTO
     - Status: Active customer
   
   - **Green Energy Corp** (prospective client)
     - 1 contact: Sarah Martinez (CMO)
     - Status: Prospect
     - Lead Source: LinkedIn outreach
   
   - **Local Restaurant Group** (existing client)
     - 3 contacts: Owner + 2 managers
     - Status: Active customer

3. **Creates First Deal**
   - Contact: Sarah Martinez from Green Energy Corp
   - Deal: "Website Redesign Project"
   - Value: $15,000
   - Stage: "Lead" (just reached out last week)
   - Expected Close: March 15, 2026
   - Notes: "Interested in full rebrand + SEO services. Follow up next week."

---

## Week 2-3: Daily Operations

### Real Workflow: New Lead Comes In

**Wednesday, 9:30 AM - New Lead from Website Contact Form**

**Tom (Account Manager):**

1. **Receives Email Notification**
   - Contact form submission from website
   - Name: Jennifer Park
   - Company: Urban Retail Solutions
   - Message: "Looking for e-commerce solution for 5 locations"

2. **Adds to CRM Immediately**
   - Goes to: Sites → Tech Startup Co (his main site's CRM)
   - Clicks "Companies" → "New Company"
     - Name: Urban Retail Solutions
     - Industry: Retail
     - Employee Count: 50-100
     - Account Type: Prospect
   
   - Clicks "Contacts" → "New Contact"
     - Name: Jennifer Park
     - Email: jennifer.park@urbanretail.com
     - Company: Urban Retail Solutions
     - Lead Source: Website Contact Form
     - Lead Status: New

3. **Creates Deal**
   - Clicks "Deals" → "New Deal"
   - Title: "Urban Retail E-commerce Platform"
   - Company: Urban Retail Solutions
   - Contact: Jennifer Park
   - Value: $45,000 (estimated)
   - Stage: "Lead"
   - Expected Close: April 30, 2026
   - Description: "Multi-location e-commerce with inventory sync. 5 locations. Needs mobile app integration."

4. **Logs Activity**
   - Clicks on Jennifer Park contact
   - Adds Activity: "Phone Call Scheduled"
   - Type: Call
   - Date: Today, 2:00 PM
   - Description: "Initial discovery call to discuss requirements and timeline"

**Wednesday, 2:00 PM - Discovery Call**

**Tom conducts call and updates CRM:**

1. **After Call, Opens Contact Record**
   - Navigation: CRM → Contacts → Jennifer Park
   - Clicks "Edit"
   - Updates:
     - Phone: +1-555-0199
     - Job Title: Director of Operations
     - Lead Status: "Contacted" (was "New")

2. **Logs Call Activity**
   - Adds Activity: "Discovery Call Completed"
   - Type: Call
   - Duration: 45 minutes
   - Outcome: Positive
   - Notes: 
     ```
     Key Requirements:
     - 5 locations need unified inventory
     - Current POS system: Square
     - Want mobile app for customers
     - Timeline: Launch before Black Friday
     - Budget: $40-50k confirmed
     - Decision makers: Jennifer + CEO (Mark)
     - Next steps: Send proposal by Friday
     ```

3. **Moves Deal Forward**
   - Goes to: Pipeline (Kanban view)
   - Drags "Urban Retail E-commerce Platform" card
   - From: "Lead" → To: "Qualified"
   - Deal probability auto-updates: 25%

4. **Creates Follow-Up Task**
   - Adds Activity: "Send Proposal"
   - Type: Task
   - Due Date: Friday, January 26, 2026
   - Assigned To: Self
   - Description: "Send detailed proposal including timeline, tech stack, and pricing"

**Friday, 11:00 AM - Sending Proposal**

**Tom sends proposal:**

1. **Updates Deal**
   - Opens deal: "Urban Retail E-commerce Platform"
   - Edits:
     - Stage: "Proposal" (from "Qualified")
     - Value: $47,000 (refined after requirements)
     - Expected Close: April 15, 2026 (moved up)
   - Probability: Now 50%

2. **Logs Activity**
   - Activity: "Proposal Sent"
   - Type: Email
   - Attachments: proposal-urban-retail-v1.pdf
   - Notes: "Sent detailed proposal via email. Included 3 design concepts and timeline breakdown."

3. **Sets Reminder**
   - Activity: "Follow Up on Proposal"
   - Type: Task
   - Due: Tuesday, January 30, 2026 (5 business days)
   - Description: "Check if Jennifer received proposal and answer questions"

---

## Week 4: Deal Progression

### Real Workflow: Moving Deal Through Pipeline

**Tuesday, Jan 30 - Follow-Up Call**

**Tom's morning routine:**

1. **Checks CRM Dashboard**
   - Opens: CRM sidebar → Tech Startup Co site
   - Sees: 3 tasks due today (including "Follow Up on Proposal")
   - Views Pipeline: 8 active deals across all stages

2. **Reviews Deal Before Call**
   - Opens: Urban Retail deal
   - Reviews all activities and notes
   - Sees: Last interaction was proposal sent Friday
   - Prepares for call

3. **Call with Jennifer - Good News!**
   - Jennifer: "CEO approved the proposal! Few questions on timeline..."
   - Tom answers questions
   - Jennifer: "We'll move forward. Can you start next week?"

4. **Updates CRM Immediately After Call**
   - **Deal Update:**
     - Stage: "Negotiation" (from "Proposal")
     - Probability: 75%
     - Notes: "CEO approved! Start date: Feb 5. Need to finalize contract."
   
   - **Activity Log:**
     - Type: Call
     - Duration: 20 minutes
     - Notes: "CEO approved project. Minor timeline adjustments needed. Sending contract today."
   
   - **New Task:**
     - Title: "Send Contract"
     - Due: Today, 4:00 PM
     - Priority: High

5. **Adds New Contact**
   - Jennifer mentioned CEO: Mark Thompson
   - Adds: Mark Thompson
     - Title: CEO
     - Company: Urban Retail Solutions
     - Email: mark.thompson@urbanretail.com
     - Tags: ["Decision Maker", "C-Suite"]
     - Relationship: Works with Jennifer Park

**Wednesday, Feb 7 - Contract Signed!**

**Tom receives signed contract:**

1. **Closes the Deal**
   - Opens: Urban Retail E-commerce deal
   - **Stage: "Won"** 🎉
   - Probability: 100%
   - Actual Value: $47,000
   - Close Date: February 7, 2026
   - Notes: "Contract signed! Project kickoff meeting scheduled for Feb 12."

2. **Updates Contact Status**
   - Jennifer Park: Lead Status → "Converted"
   - Mark Thompson: Lead Status → "Converted"
   - Urban Retail Solutions: Account Type → "Customer" (from "Prospect")

3. **Logs Activity**
   - Activity: "Contract Signed"
   - Type: Meeting
   - Date: February 7, 2026
   - Notes: "Signed contract via DocuSign. 50% deposit received. Project starts Feb 12."

4. **Creates Project Tasks**
   - Activity: "Kickoff Meeting"
     - Due: February 12, 9:00 AM
     - Assigned: Tom + Dev Team
   
   - Activity: "Requirements Doc"
     - Due: February 14
     - Assigned: Tom

---

## Month 2-3: Ongoing CRM Usage

### Sarah (Owner) - Weekly Pipeline Review

**Every Monday, 9:00 AM:**

1. **Agency-Wide CRM Overview**
   - Clicks: **CRM in Sidebar** (agency level)
   - Views:
     - Total Contacts: 127 (across all 28 sites)
     - Total Companies: 43
     - Active Deals: 15
     - Pipeline Value: $312,000
   
2. **Drills Into Team Performance**
   - Clicks on each account manager's main sites
   - Reviews their pipelines
   - **Tom's Pipeline:**
     - 8 deals, $187k value
     - 3 in Negotiation stage (good!)
     - 2 stuck in Proposal stage for 2+ weeks (flag for discussion)
   
   - **Maria's Pipeline:**
     - 7 deals, $125k value
     - 4 in Qualified stage
     - Needs help moving to proposal stage

3. **Team Meeting Agenda**
   - Uses CRM data to prepare 1-on-1s
   - Tom: "Great job on Urban Retail! What's blocking the 2 proposal-stage deals?"
   - Maria: "Let's work together on those 4 qualified leads. Need proposal templates?"

### Tom (Account Manager) - Daily Workflow

**Every Morning (15 minutes):**

1. **Check Today's Tasks**
   - CRM → Activities tab
   - Views tasks due today
   - Prioritizes: Calls > Emails > Follow-ups

2. **Review Pipeline**
   - Opens Kanban board
   - Looks for deals:
     - Not updated in 7+ days (need attention)
     - In Negotiation stage (close to winning!)
     - Stuck in one stage too long

**After Each Client Interaction:**

1. **Log Activity** (takes 2 minutes)
   - Type: Call/Email/Meeting
   - Notes: Key points discussed
   - Next steps: What needs to happen next

2. **Update Deal** (if applicable)
   - Move to new stage if progressed
   - Update value if changed
   - Adjust close date if needed

**End of Day (5 minutes):**

1. **Set Tomorrow's Tasks**
   - Review activities logged today
   - Create follow-up tasks
   - Set reminders for next week

---

## Real-World Scenarios

### Scenario 1: Client Referral

**Existing client refers new prospect:**

1. **Jenny (Designer) gets referral**
   - Current client (Bright Solutions) refers friend
   - Friend: David Lee, owns "Summit Consulting"

2. **Jenny adds to CRM**
   - Goes to: Bright Solutions site CRM (where relationship exists)
   - Adds Company: Summit Consulting
   - Adds Contact: David Lee
     - Lead Source: "Referral - John Davis (Bright Solutions)"
     - Tags: ["Warm Lead", "Referral"]
   
3. **Creates Deal**
   - Title: "Summit Consulting Website"
   - Stage: "Lead"
   - Value: $8,000 (estimated)
   - Notes: "Referred by John Davis. Mentioned in email: needs corporate website refresh."

4. **Hands Off to Account Manager**
   - Assigns Activity to Tom: "Initial Call with David Lee"
   - Notes: "This is a referral from our best client. High priority!"

### Scenario 2: Lost Deal Follow-Up

**Deal didn't close - maintaining relationship:**

1. **Maria loses deal**
   - Prospect: "Fusion Tech Solutions"
   - Deal: "Corporate Website Redesign"
   - Reason: Budget constraints, went with cheaper option

2. **Marks Deal as Lost**
   - Stage: "Lost"
   - Lost Reason: "Budget - chose competitor"
   - Notes: "Went with cheaper freelancer. Said to follow up in Q3 when budget refreshes."

3. **Sets 3-Month Follow-Up**
   - Activity: "Q3 Follow-Up - Fusion Tech"
   - Due Date: July 15, 2026 (3 months)
   - Type: Task
   - Notes: "Check if freelancer project worked out. Offer to help with maintenance or new projects."

4. **Keeps Contact Active**
   - Contact: Sarah Kim (CMO)
   - Status: Keep as "Active" (not archived)
   - Tags: Add "Future Opportunity"
   - Notes: "Great rapport. Budget issue only. Strong chance for future work."

### Scenario 3: Upsell to Existing Client

**Client asks about additional services:**

1. **Tom on support call with existing client**
   - Client: "Tech Startup Co" (their site is live)
   - Call topic: Monthly maintenance check-in
   - Client mentions: "Our site traffic is growing. Can you help with SEO?"

2. **Immediately after call, adds new deal**
   - Goes to: Tech Startup Co CRM
   - Creates Deal: "SEO Services - Tech Startup Co"
   - Stage: "Qualified" (already customer, warm lead)
   - Value: $2,500/month (recurring)
   - Contact: James Wilson (CTO)
   - Notes: "Expressed interest during maintenance call. Traffic growing 20% monthly. Want to rank for 'startup tech solutions' keywords."

3. **Logs Activity**
   - Activity: "SEO Interest Discussion"
   - Type: Call
   - Notes: "Client asked about SEO during maintenance call. Very interested. Send SEO proposal by Friday."

4. **Creates Task**
   - Task: "Prepare SEO Proposal - Tech Startup"
   - Due: Friday
   - Description: "3-month SEO package, competitor analysis, keyword research."

---

## Cross-Site CRM Usage

### Scenario: Client with Multiple Sites

**Reality:** Most clients have 2-3 sites (main site, blog, e-commerce)

**Example: Bright Solutions**
- Site 1: "Bright Solutions Corporate" (main website)
- Site 2: "Bright Solutions Store" (e-commerce)
- Site 3: "Bright Solutions Blog" (content marketing)

**How to handle:**

1. **Choose Primary Site for CRM**
   - Use: "Bright Solutions Corporate" as main CRM
   - All contacts, companies, deals live here
   - Rationale: This is where the business relationship lives

2. **Reference Other Sites**
   - In deal notes: "This deal includes work on all 3 sites"
   - In company notes: "Client has 3 sites with us - see Corporate site CRM for all data"

3. **Agency-Level View**
   - Sarah (owner) uses agency CRM dashboard
   - Can see all Bright Solutions contacts/deals
   - Even though spread across 3 site CRMs
   - (Future feature: Will aggregate automatically)

---

## Monthly Reports & Analytics

### End of Month Review

**Sarah (Owner) generates insights:**

1. **Pipeline Health**
   - Agency CRM → Views all deals
   - Metrics:
     - Total deals: 22
     - Won this month: 5 ($87k)
     - Lost this month: 2 ($15k)
     - Active pipeline: $312k
     - Conversion rate: 23% (5 won / 22 total)

2. **Team Performance**
   - Tom: 5 deals closed, $187k pipeline
   - Maria: 3 deals closed, $125k pipeline
   - Jenny: 0 deals closed (designer, does proposals only)

3. **Lead Source Analysis**
   - Manually reviews tags/sources:
     - Referrals: 35% of new leads
     - Website forms: 40%
     - LinkedIn: 15%
     - Cold outreach: 10%
   - Decision: Invest more in referral program (highest close rate)

4. **Follow-Up on Stale Deals**
   - Identifies deals not updated in 14+ days
   - Asks account managers: "What's blocking these?"
   - Either move forward or close as lost

---

## Best Practices from Real Usage

### Daily Habits (5-10 minutes)

✅ **Morning:**
- Check today's tasks in Activities
- Review pipeline for urgent deals
- Prioritize 3 most important calls/emails

✅ **After Each Interaction:**
- Log activity immediately (memory fades!)
- Update deal stage if progressed
- Set next follow-up task

✅ **End of Day:**
- Clear completed tasks
- Set tomorrow's priorities
- Review any deals needing attention

### Weekly Habits (30 minutes)

✅ **Pipeline Review:**
- Look at each deal stage
- Move deals forward or mark lost
- Identify blockers

✅ **Contact Cleanup:**
- Archive old contacts
- Update contact info if changed
- Add missing notes/tags

✅ **Activity Planning:**
- Schedule next week's calls
- Set follow-up reminders
- Create recurring tasks

### Monthly Habits (1 hour)

✅ **Performance Review:**
- Calculate win rate
- Identify best lead sources
- Review average deal size

✅ **Pipeline Forecast:**
- Estimate monthly revenue
- Check if on track for goals
- Adjust sales strategy

✅ **Data Cleanup:**
- Archive inactive contacts
- Close lost deals
- Update company information

---

## Integration with Daily Work

### How CRM Fits into Existing Workflow

**Before CRM:**
- Contacts in Gmail/Outlook
- Deals tracked in spreadsheet
- Notes scattered in Slack, email, notebooks
- No visibility into team's pipeline
- Hard to follow up on time

**After CRM:**
- All client data in one place
- Pipeline visible to entire team
- Automatic reminders for follow-ups
- Owner sees team performance
- Easy to generate reports

**Time Investment:**
- Setup: 2-3 hours (import existing contacts)
- Daily: 5-10 minutes (log activities)
- Weekly: 30 minutes (pipeline review)
- **ROI**: Never miss a follow-up, close more deals, better team coordination

---

## Tips for Success

### 1. **Keep It Simple**
- Don't overthink - just start adding contacts
- Log activities as you go (takes 30 seconds)
- Review pipeline once a week minimum

### 2. **Be Consistent**
- Make it a habit after each client interaction
- Team buys in when they see the value
- Owner should lead by example

### 3. **Use Tags Effectively**
- Create standard tags: "Hot Lead", "Referral", "Decision Maker"
- Tag contacts for easy filtering
- Review tags monthly, remove unused ones

### 4. **Clean Data Regularly**
- Archive inactive contacts quarterly
- Close lost deals promptly
- Update contact info when it changes

### 5. **Leverage Activities**
- Set follow-up reminders religiously
- Log every client interaction (even quick calls)
- Review overdue tasks weekly

---

## Next Steps

**New to CRM?** Start here:
1. Add your top 10 contacts
2. Create 2-3 active deals
3. Use for 1 week, see how it feels
4. Gradually add more data

**Growing Your CRM:**
1. Import all client contacts
2. Train team on daily habits
3. Create standard tags/processes
4. Review pipeline weekly as team

**Maximizing Value:**
1. Use for sales forecasting
2. Track lead sources
3. Calculate team performance
4. Identify growth opportunities

---

## Support

**Questions?**
- Check the [CRM Module User Guide](./CRM-MODULE-USER-GUIDE.md)
- Review [Technical Documentation](./PHASE-EM-50-CRM-SUMMARY.md)
- Contact: support@dramac.io

**Feature Requests?**
- We're always improving the CRM
- Share your workflow challenges
- Vote on upcoming features

---

*Last Updated: January 24, 2026*  
*DRAMAC CMS - Enterprise Platform*
