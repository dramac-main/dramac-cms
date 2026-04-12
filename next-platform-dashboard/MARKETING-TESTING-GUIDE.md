# Marketing Module — Walkthrough Testing Guide

> Follow this step-by-step. Do exactly what it says. If something breaks or doesn't match what's described, that's a bug — note it and keep going.

## How Navigation Works

There is **no marketing sidebar**. Navigation works like this:

- The **Marketing Hub** is the home page — it has 6 clickable cards that take you to each section
- Each section page has a **back button** (top-left arrow) that takes you back to the Marketing Hub
- The Hub also has two buttons at the top-right: **"New Campaign"** and **"New Sequence"**

Think of it as a hub-and-spoke pattern: Hub → Section → Back to Hub.

---

## Getting In

1. Log in to the dashboard
2. Click **Sites** in the left sidebar
3. Click on any site (e.g., "Jacktest Ltd")
4. You should see tabs along the top: Overview, Pages, Blog, Modules, Analytics, etc.
5. Click the **Marketing** tab
6. You should see a card with a Mail icon, title "Marketing Suite", a short description, and an **"Open Marketing Dashboard"** button
7. Click **"Open Marketing Dashboard"**
8. ✅ You're now on the **Marketing Hub**

**What you should see on the Marketing Hub:**

- **Top bar:** A back arrow button (goes to the site page) and the title "Marketing Hub" with subtitle "Manage campaigns, sequences, and subscriber engagement"
- **Top-right buttons:** "New Campaign" (+ icon) and "New Sequence" (branch icon)
- **4 stat cards:** Active Subscribers, Total Emails Sent, Open Rate, Click Rate
- **6 Quick Action cards:** Campaigns, Sequences, Subscribers, Landing Pages, Opt-In Forms, Templates
- **Recent Campaigns** section (with "View All" link)
- **Active Sequences** section (with "View All" link)

**Also verify the other way in:**

9. Go back to the site page (click the back arrow at the top), then click the **Modules** tab
10. Find "Marketing Suite" in the module list
11. It should have an **"Open"** button, a **"Configure"** button, and a toggle
12. Click **"Open"** — it should take you to the same Marketing Hub

---

## Part 1: Add Your First Subscriber

1. From the Marketing Hub, click the **"Subscribers"** card (Users icon, shows "X active")
2. ✅ The Subscribers page loads. Top-left has a back button labeled **"Marketing Hub"**
3. You should see the title **"Subscribers"** with subtitle "Manage your email subscribers and mailing lists"
4. There are two tabs: **"Subscribers (0)"** and **"Lists (0)"** — you should be on the Subscribers tab
5. Click **"Add Subscriber"** (UserPlus icon, top-right)
6. A dialog pops up titled **"Add Subscriber"**. Fill in:
   - **Email:** `jack@testcompany.com`
   - **First Name:** `Jack`
   - **Last Name:** `Banda`
   - **Tags:** `vip`
7. Click the **"Add Subscriber"** button in the dialog
8. ✅ Jack should appear in the table with columns: Email, Name, Status, Engagement, Tags, Added
9. ✅ Status should show "Active" and the tag "vip" should be visible

**Add one more subscriber** (we'll need two for audiences later):

10. Click **"Add Subscriber"** again
11. Fill in:
    - **Email:** `mary@testcompany.com`
    - **First Name:** `Mary`
    - **Last Name:** `Mwale`
12. Click **"Add "**
13. ✅ Both Jack and Mary should be in the table
14. Try the search box — type `jack` in the **"Search by email or name..."** field
15. ✅ Only Jack's row should show
16. Clear the search box

**Test the mailing listsSubscriber:**

17. Click the **"Lists"** tab
18. You should see an empty state: "No mailing lists" / "Create lists to organize your subscribers"
19. Click **"New List"** (+ icon)
20. Fill in:
    - **Name:** `Newsletter`
    - **Description:** `Main newsletter subscribers`
21. Click create/save
22. ✅ The "Newsletter" list appears as a card showing "0 subscribers"

**Go back to the Hub:**

23. Click the **"Marketing Hub"** back button (top-left, arrow icon)
24. ✅ You're back on the Marketing Hub. The "Active Subscribers" stat card should show **2**

---

## Part 2: Browse Email Templates

1. From the Marketing Hub, click the **"Templates"** card (BarChart3 icon, shows "Email library")
2. ✅ The Email Templates page loads. Top-left has a back button labeled **"Marketing Hub"**
3. You should see a template library — browse through what's available
4. ✅ Page loads without errors
5. Click the **"Marketing Hub"** back button to return

---

## Part 3: Create Your First Campaign

1. From the Marketing Hub, click the **"Campaigns"** card (Mail icon, shows "X total")
   - OR click the **"New Campaign"** button at the top-right of the Hub (this goes directly to the new campaign wizard)
2. If you clicked the Campaigns card: ✅ The Campaigns list page loads. Top-left has **"Marketing Hub"** back button. Top-right has **"New Campaign"** (+ icon) button
3. Click **"New Campaign"**
4. ✅ The campaign wizard loads. Top-left has **"Back to Campaigns"** back button

**The wizard has 4 steps shown at the top: Details → Audience → Content → Review**

**Step 1 — Details:**

5. You should see the heading **"Campaign Details"** with "Set the basic information for your campaign"
6. Fill in:
   - **Campaign Name:** `Welcome to Our Newsletter`
   - **Description:** `Test campaign for walkthrough`
   - **Campaign Type:** Select **"Email"** (should be default)
   - **Subject Line:** `Welcome to Our Newsletter`
   - **Preview Text:** `Big things are coming your way`
   - Leave From Name, From Email, Reply-To as defaults
7. Click **"Next"** (bottom-right, with arrow icon)

**Step 2 — Audience:**

8. You should see **"Select Audience"** with "Choose who will receive this campaign"
9. **Audience Type** options: All Subscribers, All Contacts, Mailing List, Segment
10. Select **"All Subscribers"** — you should see helper text: "Send to all active subscribers"
11. Click **"Next"**

**Step 3 — Content:**

12. You should see **"Email Content"** with "Compose your email content"
13. There's a large text area labeled **"Email Body (HTML)"**
14. Type or paste: `<h1>Hello {{first_name}}</h1><p>Welcome to our newsletter!</p>`
15. ✅ You should see helper text: "Use {{variable}} syntax for merge variables. Available: {{first_name}}, {{last_name}}, {{email}}, {{unsubscribe_url}}"
16. **Tags:** Type `newsletter, welcome` in the tags field
17. Click **"Next"**

**Step 4 — Review:**

18. You should see **"Review & Send"** with "Review your campaign before sending"
19. ✅ Verify the review shows: Campaign Name, Type, Subject Line, Audience, From, Tags
20. There should be a **"Content Preview"** section showing your HTML rendered
21. Two buttons at the bottom: **"Save as Draft"** and **"Create & Send"**
22. Click **"Save as Draft"**
23. ✅ You should be redirected back to the campaign list
24. ✅ Your "Welcome to Our Newsletter" campaign should appear with status **"Draft"**

**Test campaign actions:**

25. Click on your campaign row to open the detail page
26. ✅ The detail page loads with **"Back to Campaigns"** back button at top-left
27. Look for a **three-dot menu** (⋮) or action buttons on the campaign
28. Find and click **"Duplicate"** (Copy icon) — go back to the list
29. ✅ You should see two campaigns now
30. Click the duplicated campaign → from the three-dot menu, click **"Delete"** (Trash icon)
31. ✅ Only the original remains

**Go back to the Hub:**

32. Click **"Back to Campaigns"** → then click **"Marketing Hub"** back button
33. ✅ You're on the Hub. "Recent Campaigns" section should show your campaign

---

## Part 4: Build a Drip Sequence

1. From the Marketing Hub, click the **"Sequences"** card (Zap icon, shows "X total")
   - OR click the **"New Sequence"** button at the top-right of the Hub
2. If you clicked the Sequences card: ✅ The Sequences list loads. Top-left has **"Marketing Hub"** back button. Top-right has **"New Sequence"** (+ icon) button
3. Click **"New Sequence"**
4. ✅ The page loads with **"Back to Sequences"** link at top-left and the title **"New Sequence"**. No crashes!

**The sequence builder has a left panel (details) and a bottom section (steps).**

**Left panel — Sequence Details card:**

5. Fill in:
   - **Name:** `Welcome Series`
   - **Description:** `Onboards new subscribers over 7 days`

**Trigger card:**

6. You should see **"Trigger"** with "When should subscribers enter this sequence?"
7. **Trigger Type** dropdown — options: Subscriber Added, Tag Added, Form Submitted, Custom Event, Manual Enrollment
8. Select **"Tag Added"** → a **"Tag Name"** field should appear (placeholder: "e.g., new-customer")
9. Type: `new-signup`
10. Switch to **"Form Submitted"** → field changes to **"Form ID"**
11. Switch back to **"Manual Enrollment"** → extra field disappears

**Settings card:**

12. **Enrollment Limit** field (placeholder: "No limit") — type `500`

**Test the Conversion Goal dropdown (this was the bug we fixed):**

13. Scroll down to find the Conversion Goal section
14. The dropdown should show **"No goal"** by default
15. Click it → select **"Purchase"** → a "Window (hours)" field should appear
16. Click it → select **"Custom Event"** → an "Event Name" field should appear
17. Click it → select **"No goal"** → the extra fields disappear
18. ✅ No crashes at any point — this was the Select.Item bug we fixed

**Build the workflow steps (bottom section):**

19. You should see step-type buttons: Email (blue), SMS (green), WhatsApp (teal), Delay (amber), Condition (purple), Action (emerald), Split (pink)
20. Click the **Email** button → a blue Email step card appears
21. Expand it and fill in:
    - **Subject Line:** `Welcome aboard, {{first_name}}!`
22. Click the **Delay** button → an amber Delay step appears
23. Expand it → click the **"1 day"** preset button
24. Click the **Email** button → another blue Email step
25. Expand it → set Subject Line: `Here's what you can do next`
26. Click the **Condition** button → a purple Condition step appears
27. Click the **SMS** button → a green SMS step appears
28. Expand it → type message: `Hey {{first_name}}, check your email!`
29. ✅ You should now have 5 steps in order

**Test reorder and delete:**

30. On the SMS step, click the **up arrow** (ChevronUp) — it should move up
31. Click the **down arrow** (ChevronDown) — it should move back down
32. Click the **trash icon** (Trash2) on the SMS step → it should be removed
33. ✅ You now have 4 steps

**Save it:**

34. Click **"Create Sequence"** button (top-right of the page)
35. ✅ You should be redirected to the sequence list
36. ✅ "Welcome Series" should appear in the list

**Verify the detail page:**

37. Click on "Welcome Series" in the list
38. ✅ The detail page loads showing your steps

**Go back to the Hub:**

39. Use the back button to go to Sequences list → then **"Marketing Hub"** back button
40. ✅ Hub should now show "Welcome Series" under "Active Sequences"

---

## Part 5: Create an Opt-In Form

1. From the Marketing Hub, click the **"Opt-In Forms"** card (FormInput icon, shows "Embed & popup")
2. ✅ The Opt-In Forms page loads. Top-left has **"Marketing Hub"** back button. Top-right has **"New Form"** (+ icon)
3. Click **"New Form"**
4. ✅ The form builder loads with **"Back to Forms"** back button
5. Set the form name: `Newsletter Signup`
6. Configure the form fields (Email should be there by default, add First Name if possible)
7. Click **Save**
8. ✅ You're back on the forms list, "Newsletter Signup" appears
9. Click on it → the detail page loads

**Go back to the Hub:**

10. Use back buttons to return to the Marketing Hub

---

## Part 6: Create a Landing Page

1. From the Marketing Hub, click the **"Landing Pages"** card (FileText icon, shows "Lead capture")
2. ✅ The Landing Pages list loads. Top-left has **"Marketing Hub"** back button. Top-right has **"New Landing Page"** (+ icon)
3. Click **"New Landing Page"**
4. ✅ The editor loads with **"Back to Landing Pages"** back button
5. Set the title: `Summer Sale`
6. Add content: `50% off everything this week only`
7. Click **Save**
8. ✅ The page appears in the list

**Go back to the Hub:**

9. Use back buttons to return to the Marketing Hub

---

## Part 7: Social Media & Calendar

**Social Media:**

1. The Marketing Hub doesn't have a direct card for Social Media. Navigate to it via the URL: append `/social` to your marketing URL
   - Example: `/dashboard/sites/YOUR-SITE-ID/marketing/social`
2. ✅ The Social Media page loads. Top-left has **"Marketing Hub"** back button
3. You should see two tabs: **"Posts"** and **"Connections"**
4. Click the **"Connections"** tab → you should see platform connection options
5. Click the **"Posts"** tab → compose area or empty state

**Content Calendar:**

6. Navigate to: append `/calendar` to your marketing URL
   - Example: `/dashboard/sites/YOUR-SITE-ID/marketing/calendar`
7. ✅ The Content Calendar page loads. Top-left has **"Marketing Hub"** back button
8. ✅ Calendar view displays

**Go back to the Hub:**

9. Click the **"Marketing Hub"** back button

---

## Part 8: SMS Campaign

1. Navigate to the SMS composer: append `/sms/new` to your marketing URL
   - Example: `/dashboard/sites/YOUR-SITE-ID/marketing/sms/new`
2. ✅ The page loads showing the **"New SMS Campaign"** composer
3. You should see a **"Back to Campaigns"** link at the top-left (inside the component, not in a header bar)
4. Fill in:
   - **Campaign Name** (if available)
   - **SMS Message:** `Hi {{first_name}}, your order is ready for pickup!`
5. ✅ Character counter updates as you type (shows count / 1600 and segment count)
6. ✅ Helper text shows: "Use {{first_name}}, {{last_name}} for merge variables"
7. Click the **"Back to Campaigns"** link to return to the campaigns list

---

## Part 9: Check the Marketing Hub Stats

1. Navigate back to the Marketing Hub
2. ✅ The stat cards should reflect what you've created:
   - **Active Subscribers:** 2 (Jack and Mary)
3. ✅ The Quick Action cards should show updated counts:
   - Campaigns: shows total count
   - Sequences: shows total count
   - Subscribers: shows active count
4. ✅ **"Recent Campaigns"** section should show your "Welcome to Our Newsletter" campaign
5. ✅ **"Active Sequences"** section should show your "Welcome Series"
6. Try clicking **"View All"** next to Recent Campaigns → ✅ goes to the Campaigns list
7. Try clicking **"View All"** next to Active Sequences → ✅ goes to the Sequences list

---

## Part 10: Client Portal View

> You need a portal user with marketing permissions. Portal has its own marketing pages at `/portal/sites/[siteId]/marketing/`.

1. Log in as a **client portal user**, or open the portal URL in incognito
2. Navigate to Marketing in the portal
3. ✅ The Marketing Hub loads (same hub component, but in portal context)
4. Click through each available section:
   - **Campaigns** → campaigns list loads
   - **Subscribers** → subscriber list loads
   - **Sequences** → sequences list loads
   - **Forms** → forms list loads
   - **Analytics** → engagement stats page loads
5. ✅ All pages load without errors

> **Known limitation:** Landing Pages, Social, Calendar, and Templates pages don't exist in the portal yet. If you click those hub cards, you may get a 404.

---

## Part 11: Super Admin Health Check

> You need to be a Super Admin for this. Navigate to `/admin/marketing`.

1. Log in as **Super Admin**
2. Navigate to `/admin/marketing`
3. ✅ Platform health dashboard loads
4. You should see platform-wide marketing stats and site-level data
5. ✅ Page loads without errors

---

## Part 12: Clean Up

1. Go to the Marketing Hub → click **"Campaigns"** card
2. Delete the test campaign ("Welcome to Our Newsletter")
3. **"Marketing Hub"** back button → click **"Sequences"** card
4. Delete the test sequence ("Welcome Series")
5. **"Marketing Hub"** back button → click **"Landing Pages"** card
6. Delete the test landing page ("Summer Sale")
7. **"Marketing Hub"** back button → click **"Opt-In Forms"** card
8. Delete the test form ("Newsletter Signup")
9. **"Marketing Hub"** back button → click **"Subscribers"** card
10. Delete Jack Banda and Mary Mwale
11. ✅ Everything deletes cleanly

---

## Done!

If you made it through all 12 parts without crashes or broken pages, the Marketing Module is working. Note any spots where:

- A page crashed or showed an error
- A button did nothing when clicked
- Data didn't save or didn't show up
- Navigation went to a wrong page or 404
- A back button was missing or went to the wrong place

Those are bugs to report.
