# CRM Module - User Guide

**Module ID**: `crmmod01`  
**Status**: ✅ Production Ready  
**Route**: `/dashboard/{siteId}/crm`  
**Type**: Built-in Platform Module (No Module Studio required)

## Quick Start

### Step 1: Access the CRM Dashboard

Navigate to: `http://localhost:3000/dashboard/{your-site-id}/crm`

**That's it!** The CRM automatically initializes on first access:
- Creates a default "Sales Pipeline"
- Adds 6 pipeline stages: Lead → Qualified → Proposal → Negotiation → Won → Lost
- Sets up all necessary database tables

### Step 2: Start Using the CRM

You'll see the CRM dashboard with:

- **Key Metrics** (top cards):
  - Total Contacts
  - Active Deals
  - Pipeline Value (sum of open deals)
  - Conversion Rate

- **Tabs**:
  - Contacts
  - Companies
  - Deals
  - Pipeline (Kanban board)
  - Activities
  - Reports
  - Settings

## Working with Contacts

### Create a Contact

1. Click the **Contacts** tab
2. Click **"+ New Contact"** button
3. Fill in the form:
   - **Basic Info**: First name, last name, email, phone, mobile
   - **Company**: Select an existing company or leave blank
   - **Job Details**: Job title, department
   - **Address**: Full address fields
   - **Status**: Active (default), Inactive, Archived
   - **Lead Status**: New, Contacted, Qualified, Unqualified, Converted
   - **Source**: Where the contact came from (e.g., "Website", "Referral")
   - **Social**: LinkedIn, Twitter, website URLs
   - **Lead Score**: 0-100 numerical score
4. Click **"Create Contact"**

### View/Edit Contact Details

1. Click on any contact in the list
2. A detail sheet slides in from the right showing:
   - Contact information
   - Associated company
   - Recent activities
   - Open deals
3. Click the **Edit** icon to modify
4. Click **Save** to update

### Search and Filter Contacts

- Use the search bar to find contacts by name or email
- Filter by:
  - Status (Active, Inactive, Archived)
  - Lead Status
  - Company
  - Tags

## Working with Companies

### Create a Company

1. Click the **Companies** tab
2. Click **"+ New Company"** button
3. Fill in the form:
   - **Basic Info**: Company name, industry, website, phone
   - **Size**: Employee count, annual revenue
   - **Address**: Full address fields
   - **Status**: Active (default), Inactive, Archived
   - **Account Type**: Prospect, Customer, Partner, Competitor, Other
4. Click **"Create Company"**

### View Company Details

1. Click on any company in the list
2. The detail sheet shows:
   - Company information
   - All contacts at this company
   - All deals with this company
   - Recent activities
3. Edit as needed

## Working with Deals

### Create a Deal

1. Click the **Deals** tab (or **Pipeline** for Kanban view)
2. Click **"+ New Deal"** button
3. Fill in the form:
   - **Deal Name**: e.g., "Q1 Contract Renewal"
   - **Contact**: Select the primary contact
   - **Company**: Select the company
   - **Amount**: Deal value (e.g., 50000)
   - **Currency**: USD (default)
   - **Pipeline**: Select a pipeline
   - **Stage**: Select initial stage
   - **Probability**: Auto-filled based on stage (editable)
   - **Expected Close Date**: Target closing date
   - **Description**: Additional details
4. Click **"Create Deal"**

### Manage Deals in Pipeline (Kanban Board)

1. Click the **Pipeline** tab
2. You'll see a Kanban board with columns for each stage:
   ```
   Lead → Qualified → Proposal → Negotiation → Won / Lost
   ```
3. **Drag and drop** deals between stages
4. The deal automatically updates its:
   - Stage
   - Probability (based on stage)
   - Status (moves to "won" or "lost" when dropped in those stages)
5. Click on a deal card to view/edit details

### Deal Stages Explained

| Stage | Probability | Description |
|-------|-------------|-------------|
| Lead | 10% | Initial contact, not qualified yet |
| Qualified | 25% | Lead is qualified and shows interest |
| Proposal | 50% | Proposal or quote sent |
| Negotiation | 75% | In active negotiations |
| Won | 100% | Deal closed successfully ✅ |
| Lost | 0% | Deal closed unsuccessfully ❌ |

## Working with Activities

### Log an Activity

1. Click the **Activities** tab
2. Click **"+ Log Activity"** button
3. Select activity type:
   - **Call**: Phone conversation
   - **Email**: Email communication
   - **Meeting**: In-person or virtual meeting
   - **Task**: To-do item
   - **Note**: General note
   - **SMS**: Text message
   - **Chat**: Live chat conversation
4. Fill in details:
   - **Subject**: Brief summary
   - **Description**: Full details
   - **Related To**: Link to contact, company, or deal
   - **Date/Time**: When it occurred/scheduled
   - **Outcome**: Result of the activity
5. **Type-specific fields**:
   - **Call**: Duration, direction (inbound/outbound)
   - **Task**: Due date, priority, completion status
   - **Meeting**: Location, attendees
6. Click **"Log Activity"**

### View Activity Timeline

- Activities appear in chronological order
- Each activity shows:
  - Type icon
  - Subject and description
  - Related entities (contact, company, deal)
  - Timestamp
  - Created by user
- Filter by:
  - Activity type
  - Date range
  - Related entity

## Reports & Analytics

### View Reports

1. Click the **Reports** tab
2. Available reports:
   - **Pipeline Report**:
     - Total deals by stage
     - Deal value by stage
     - Conversion rates between stages
     - Average deal size
   - **Revenue Over Time**:
     - Monthly revenue trends
     - Won deals chart
     - Forecast projections
   - **Contact Sources**:
     - Where contacts are coming from
     - Source effectiveness
   - **Top Performers**:
     - Deals by owner
     - Activity metrics per user

### Export Data

- Click **"Export"** button on reports
- Download as CSV for Excel/Google Sheets
- Includes all filtered data

## Settings & Customization

### Manage Pipelines

1. Click the **Settings** tab
2. Go to **Pipelines** section
3. **Create New Pipeline**:
   - Click **"+ New Pipeline"**
   - Enter name and description
   - Add stages with colors and probabilities
   - Set as default (optional)
4. **Edit Existing Pipeline**:
   - Click on pipeline name
   - Modify stages
   - Reorder by dragging
   - Delete unused stages

### Custom Fields

1. Go to **Settings** → **Custom Fields**
2. Click **"+ Add Custom Field"**
3. Configure:
   - **Entity Type**: Contact, Company, or Deal
   - **Field Name**: Display label
   - **Field Type**: Text, Number, Boolean, Date, Select, URL, Email, Phone
   - **Required**: Make it mandatory
   - **Options**: For select/multiselect types
4. Custom fields appear on create/edit forms

### Tags

1. Go to **Settings** → **Tags**
2. Click **"+ New Tag"**
3. Enter:
   - **Tag Name**: e.g., "VIP", "Hot Lead", "Enterprise"
   - **Color**: For visual identification
   - **Entity Type**: Where the tag can be used
4. Apply tags to contacts, companies, or deals

## Tips & Best Practices

### Lead Management

1. **Qualify Leads Quickly**: Move leads to "Qualified" or "Unqualified" within 24 hours
2. **Use Lead Scoring**: Assign scores based on fit and engagement
3. **Track Source**: Always log where leads come from for attribution

### Deal Management

1. **Keep Pipeline Moving**: Review deals weekly, move forward or disqualify
2. **Update Regularly**: Log activities and update expected close dates
3. **Use Probability**: Adjust manually if stage probability doesn't fit
4. **Close Reasons**: Always log why deals are won or lost for learning

### Activity Tracking

1. **Log Everything**: All customer interactions should be recorded
2. **Be Specific**: Include context and outcomes
3. **Link Activities**: Always connect activities to deals/contacts/companies
4. **Set Tasks**: Convert action items into tasks with due dates

### Reporting

1. **Review Weekly**: Check pipeline health every Monday
2. **Track Trends**: Watch conversion rates between stages
3. **Identify Bottlenecks**: Look for stages where deals get stuck
4. **Forecast Accurately**: Use probability-weighted pipeline value

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Create new (context-aware) |
| `S` | Search/focus search bar |
| `Esc` | Close dialog/sheet |
| `Tab` | Navigate between tabs |
| `Arrow Keys` | Navigate list items |

## Permissions

### Role-Based Access

- **Owner/Admin**: Full access to all CRM features
- **Member**: Can create, view, edit own records; view all records
- **Viewer**: Read-only access to CRM data

### Data Isolation

- CRM data is isolated per site
- Users can only access CRM data for sites they have access to
- RLS policies enforce security at database level

## Troubleshooting

### CRM initializes automatically

The CRM automatically sets up when you first visit `/dashboard/{siteId}/crm`. If you see any issues:

**Check:**
- You have access to the site (at least Member role)
- Site ID in the URL is correct
- Database migration was applied successfully

**Manual initialization (if needed):**
If auto-initialization fails, you can manually run:
```sql
SELECT mod_crmmod01_init_site('your-site-id');
```

### Can't see CRM menu

**Possible causes**:
- Site not initialized
- Insufficient permissions (need at least Member role)
- Module not enabled for your site

### Pipeline not showing deals

**Check**:
- Is the pipeline set as default?
- Are deals assigned to this pipeline?
- Try switching between pipelines in the dropdown

### Activities not appearing

**Verify**:
- Activity is linked to correct entity
- Date filter isn't excluding the activity
- You have permission to view the related entity

## API Integration

The CRM module exposes REST API endpoints at:

```
GET    /api/modules/crm/contacts
POST   /api/modules/crm/contacts
GET    /api/modules/crm/contacts/:id
PUT    /api/modules/crm/contacts/:id
DELETE /api/modules/crm/contacts/:id

GET    /api/modules/crm/companies
POST   /api/modules/crm/companies
GET    /api/modules/crm/companies/:id
PUT    /api/modules/crm/companies/:id
DELETE /api/modules/crm/companies/:id

GET    /api/modules/crm/deals
POST   /api/modules/crm/deals
GET    /api/modules/crm/deals/:id
PUT    /api/modules/crm/deals/:id
DELETE /api/modules/crm/deals/:id
POST   /api/modules/crm/deals/:id/move

GET    /api/modules/crm/pipelines
POST   /api/modules/crm/pipelines
GET    /api/modules/crm/pipelines/:id/stages

GET    /api/modules/crm/activities
POST   /api/modules/crm/activities

GET    /api/modules/crm/search?q=query
GET    /api/modules/crm/reports/pipeline
```

All endpoints require authentication and return JSON.

## Support

For issues or feature requests:
1. Check this guide first
2. Review [PHASE-EM-50-CRM-SUMMARY.md](./PHASE-EM-50-CRM-SUMMARY.md) for technical details
3. Contact support or create a GitHub issue
