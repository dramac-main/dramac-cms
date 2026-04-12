# Marketing Module — Testing Guide

> **How to use:** Work through each section in order. Each step tells you exactly what to click, what to type, and what you should see. Check the box when it passes.
>
> **Prerequisites:** Log in as an Agency Owner/Admin. Go to **Sites → pick any site → Marketing tab → Open Marketing Dashboard**.

---

## 1. Marketing Hub (Main Dashboard)

**Route:** `/dashboard/sites/[siteId]/marketing`

- [ ] Page loads without errors
- [ ] You see stat cards: Campaigns, Subscribers, Sequences, Forms (numbers may be 0)
- [ ] "Recent Campaigns" section is visible (empty state or list)
- [ ] Quick action buttons are visible (New Campaign, New Sequence, etc.)
- [ ] Clicking each quick action button navigates to the correct page

---

## 2. Campaigns

### 2a. Campaign List

**Route:** `/dashboard/sites/[siteId]/marketing/campaigns`

- [ ] Page loads — shows campaign table or empty state
- [ ] "New Campaign" button is visible

### 2b. Create a Campaign

**Click "New Campaign"** → Route: `.../campaigns/new`

- [ ] Campaign wizard loads without errors
- [ ] Step 1 — Set campaign type (e.g., "Email"). Confirm type options appear
- [ ] Step 2 — Enter subject line: `Test Campaign Subject`
- [ ] Step 2 — Enter preview text: `This is a preview`
- [ ] Step 3 — Select audience/list (or skip if none exist yet)
- [ ] Step 4 — Choose "Send Later" or "Draft"
- [ ] Click **Create** → redirected to campaign list or detail
- [ ] New campaign appears in the list with status "Draft"

### 2c. View Campaign Detail

**Click the campaign you just created**

- [ ] Detail page loads — shows subject, status, content
- [ ] "Edit" or content editing area is accessible
- [ ] "Send Test Email" button is visible (may require Resend config to actually send)
- [ ] "Duplicate" action works — creates a copy in the campaign list
- [ ] "Delete" action works — campaign is removed from the list

### 2d. Campaign Actions

- [ ] If a campaign is in Draft, you can "Schedule" it (picks a date/time)
- [ ] If a campaign is Scheduled, you can "Pause" it
- [ ] If a campaign is Paused, you can "Resume" it

---

## 3. Subscribers

**Route:** `/dashboard/sites/[siteId]/marketing/subscribers`

### 3a. Subscriber List

- [ ] Page loads — shows subscriber table or empty state
- [ ] Search bar is visible and functional

### 3b. Add a Subscriber

- [ ] Click "Add Subscriber" (or similar button)
- [ ] Enter: Email `test@example.com`, First Name `Test`, Last Name `User`
- [ ] Click Save → subscriber appears in the list with status "Active"

### 3c. Tag a Subscriber

- [ ] Click on the subscriber you just created
- [ ] Add a tag: `vip`
- [ ] The tag displays on the subscriber record

### 3d. Delete a Subscriber

- [ ] Select the subscriber → Delete
- [ ] Subscriber is removed from the list

### 3e. Bulk Import (Optional)

- [ ] If there's an "Import" button, click it
- [ ] Upload a CSV with columns: email, first_name, last_name
- [ ] Imported subscribers appear in the list

---

## 4. Email Templates

**Route:** `/dashboard/sites/[siteId]/marketing/templates`

- [ ] Page loads — shows template library (system templates + custom)
- [ ] System templates are displayed (Welcome, Promotional, Newsletter, etc.)
- [ ] You can preview a template
- [ ] You can create a custom template (if "Create Template" button exists)
- [ ] You can search/filter templates by category

---

## 5. Sequences (Drip Automations)

### 5a. Sequence List

**Route:** `/dashboard/sites/[siteId]/marketing/sequences`

- [ ] Page loads — shows sequence table or empty state
- [ ] "New Sequence" button is visible

### 5b. Create a Sequence

**Click "New Sequence"** → Route: `.../sequences/new`

- [ ] Page loads WITHOUT the `Select.Item` error (this was the bug we just fixed)
- [ ] **Sequence Details** card: Enter Name `Welcome Series`, Description `Welcome new subscribers`
- [ ] **Trigger** card: Select trigger type "Manual Enrollment" (default)
- [ ] **Trigger** card: Switch to "Tag Added" → a "Tag Name" input appears. Enter `new-customer`
- [ ] **Trigger** card: Switch to "Form Submitted" → a "Form ID" input appears
- [ ] **Trigger** card: Switch to "Custom Event" → an "Event Name" input appears
- [ ] **Trigger** card: Switch back to "Manual Enrollment"
- [ ] **Settings** card: Enter Enrollment Limit `100` → "No limit" placeholder shows when empty
- [ ] **Settings** card: Toggle "Allow Re-enrollment" on and off
- [ ] **Conversion Goal** card: Select "No goal" (default) — should display the placeholder "No goal"
- [ ] **Conversion Goal** card: Select "Purchase" — no sub-fields appear except Window (hours)
- [ ] **Conversion Goal** card: Select "Custom Event" → "Event Name" input appears
- [ ] **Conversion Goal** card: Select "No goal" again — goal type clears properly

### 5c. Add Steps to Sequence

Still on the New Sequence page:

- [ ] Click **+ Email** → an Email step card appears. Expand it → subject, preview text, template ID fields show
- [ ] Click **+ Delay** → a Delay step card appears. Expand it → preset buttons (1 hour, 1 day, 1 week, etc.) and custom minutes input show
- [ ] Click **+ SMS** → an SMS step card appears. Expand it → SMS message textarea with character counter shows
- [ ] Click **+ WhatsApp** → a WhatsApp step card appears. Expand it → Template Name and Language Code fields show
- [ ] Click **+ Condition** → a Condition step card appears. Expand it → Field, Operator, Value dropdowns show
- [ ] Click **+ Action** → an Action step card appears. Expand it → Action Type dropdown (Add Tag, Remove Tag, Webhook, etc.) shows
- [ ] Click **+ Split** → a Split step card appears
- [ ] Steps can be **reordered** using up/down arrows
- [ ] Steps can be **renamed** by editing the "Step Name" field
- [ ] Steps can be **removed** using the trash icon
- [ ] Step numbers update correctly after reorder/removal

### 5d. Save the Sequence

- [ ] Enter a name (required) and click **Create Sequence**
- [ ] Redirected to the sequences list
- [ ] New sequence appears in the list

### 5e. Sequence Detail

**Click the sequence you just created**

- [ ] Detail page loads — shows steps, enrollment stats
- [ ] You can edit the sequence (add/remove/reorder steps)
- [ ] You can delete the sequence

---

## 6. Forms (Opt-In / Lead Capture)

### 6a. Form List

**Route:** `/dashboard/sites/[siteId]/marketing/forms`

- [ ] Page loads — shows form table or empty state
- [ ] "New Form" button is visible

### 6b. Create a Form

**Click "New Form"** → Route: `.../forms/new`

- [ ] Form builder loads without errors
- [ ] You can set a form name
- [ ] You can add fields (email, name, text, select, checkbox)
- [ ] You can configure success action (redirect URL or thank-you message)
- [ ] Click Save → form appears in the form list

### 6c. Form Detail

**Click the form you created**

- [ ] Detail page loads — shows form fields, submissions count
- [ ] You can edit the form fields
- [ ] You can view submissions (may be empty)
- [ ] You can delete the form

---

## 7. Landing Pages

### 7a. Landing Page List

**Route:** `/dashboard/sites/[siteId]/marketing/landing-pages`

- [ ] Page loads — shows landing page table or empty state
- [ ] "New Landing Page" button is visible

### 7b. Create a Landing Page

**Click "New Landing Page"** → Route: `.../landing-pages/new`

- [ ] Editor loads without errors
- [ ] You can set a page title: `Promo Page`
- [ ] You can set a URL slug: `promo-page`
- [ ] You can add content blocks (text, image, button, CTA, etc.)
- [ ] You can configure SEO settings (title, description, keywords)
- [ ] Click Save → page appears in the list with status "Draft"

### 7c. Publish / Unpublish

- [ ] On the landing page detail, click "Publish" → status changes to "Published"
- [ ] Click "Unpublish" → status changes back to "Draft"

### 7d. Delete

- [ ] Delete the landing page → removed from the list

---

## 8. Social Media

### 8a. Social Posts

**Route:** `/dashboard/sites/[siteId]/marketing/social`

- [ ] Page loads — shows social posts list or empty state
- [ ] You can compose a new post
- [ ] Platform selection is available (Facebook, Instagram, Twitter, TikTok)
- [ ] You can type post content and schedule it

### 8b. Content Calendar

**Route:** `/dashboard/sites/[siteId]/marketing/twitter` (or social calendar route)

- [ ] Calendar loads — shows month/week/day view
- [ ] Scheduled posts appear on the calendar (if any)

### 8c. Social Connections (Settings)

- [ ] You can navigate to social connection settings
- [ ] Connect/Disconnect buttons are visible for each platform
- [ ] Platforms listed: Meta (Facebook/Instagram), Twitter, TikTok, LinkedIn

---

## 9. SMS & WhatsApp

**Route:** `/dashboard/sites/[siteId]/marketing/sms`

- [ ] Page loads without errors
- [ ] SMS composer is visible
- [ ] You can type an SMS message — character counter updates
- [ ] Segment count displays (160 chars per segment)
- [ ] WhatsApp section is visible (template-based messaging)
- [ ] Provider settings section is accessible (Twilio SID, Meta Business ID)

---

## 10. Blog Marketing Integration

> Test these from the Blog section of the site (if blog posts exist).

- [ ] When editing a blog post, a "Share as Email" button is available
- [ ] When editing a blog post, inline CTA block can be added
- [ ] SEO score panel is visible on blog posts
- [ ] Subscribe widget can be embedded in blog posts

---

## 11. AI Marketing Features

> These require AI API configuration (Claude API key). If not configured, test that the buttons exist and show appropriate error messages.

### From Campaign Editor:

- [ ] "AI Suggest Subject Lines" button exists
- [ ] "AI Generate Preview Text" button exists
- [ ] "AI Generate Content" button exists (generates email body from brief)
- [ ] "AI Improve Text" button exists (rewrites selected text)

### From Campaign Scheduling:

- [ ] "AI Optimal Send Time" option exists (suggests best time based on engagement data)

### From Audience Selection:

- [ ] "AI Suggest Audiences" option exists

---

## 12. Analytics

### Campaign Analytics (from Campaign Detail):

- [ ] After sending a campaign, analytics section shows: sent, delivered, opened, clicked, bounced, unsubscribed counts
- [ ] Open rate and click rate percentages display

### Marketing Hub Stats:

- [ ] Hub dashboard at `/marketing` shows aggregate stats
- [ ] Stats update after creating campaigns/subscribers

---

## 13. Client Portal Access

> Log in as a **Client Portal User** (or switch to portal view).

**Route:** `/portal/sites/[siteId]/marketing`

- [ ] Marketing appears in portal sidebar navigation (if `canManageMarketing` permission is enabled)
- [ ] Portal marketing hub loads — shows simplified dashboard
- [ ] Portal campaigns page loads — can view campaigns
- [ ] Portal subscribers page loads — can view/import subscribers
- [ ] Portal sequences page loads — can view sequences
- [ ] Portal forms page loads — can view forms and submissions
- [ ] Portal analytics page loads — shows engagement metrics

---

## 14. Super Admin

> Log in as **Super Admin**.

**Route:** `/admin/marketing`

- [ ] Admin marketing health dashboard loads
- [ ] Platform-wide email volume stats are visible
- [ ] Top sites by volume are listed
- [ ] Safety thresholds are displayed (bounce rate, complaint rate)
- [ ] "Pause Marketing" action is available per site
- [ ] "Resume Marketing" action is available for paused sites
- [ ] Auto-safety enforcement status is visible

---

## 15. Module Access & Navigation

- [ ] On the site Modules tab, Marketing Suite shows with **"Open"** button, **"Configure"**, and **toggle**
- [ ] Clicking "Open" navigates to `/dashboard/sites/[siteId]/marketing`
- [ ] On the site detail page, the **Marketing** tab is visible when the module is enabled
- [ ] Clicking the Marketing tab shows an "Open Marketing Dashboard" button
- [ ] The button navigates to the marketing hub

---

## 16. API Endpoints (Advanced)

> Test with browser DevTools Network tab or a tool like Postman/curl.

### Form Embed

- [ ] `GET /api/marketing/forms/embed/[formId]` — returns embeddable form HTML

### Form Submit

- [ ] `POST /api/marketing/forms/submit/[formId]` with body `{ "email": "test@test.com" }` — returns success response

### Tracking (if campaign sent)

- [ ] `GET /api/marketing/track/open/[token]` — returns a 1x1 pixel (tracking pixel)
- [ ] `GET /api/marketing/track/click/[token]` — redirects to target URL

### Unsubscribe

- [ ] `GET /api/marketing/unsubscribe/[token]` — shows unsubscribe confirmation page

---

## Quick Summary Checklist

| Area | Status |
|------|--------|
| Marketing Hub Dashboard | ☐ |
| Campaigns CRUD | ☐ |
| Campaign Send/Schedule/Pause | ☐ |
| Subscribers CRUD + Tags | ☐ |
| Subscriber Import | ☐ |
| Email Templates | ☐ |
| Sequences CRUD + Steps | ☐ |
| Forms CRUD | ☐ |
| Landing Pages CRUD + Publish | ☐ |
| Social Media Posts + Calendar | ☐ |
| SMS / WhatsApp Composer | ☐ |
| Blog Marketing Integration | ☐ |
| AI Features (buttons exist) | ☐ |
| Analytics Display | ☐ |
| Client Portal Access | ☐ |
| Super Admin Health | ☐ |
| Module Access (Open button + Tab) | ☐ |
| API Endpoints | ☐ |
