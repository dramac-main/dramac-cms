# Marketing Module — Walkthrough Testing Guide

> Follow this step-by-step. Do exactly what it says. If something breaks or doesn't match what's described, that's a bug — note it and keep going.

## How Navigation Works

The Marketing module has a **persistent navigation bar** at the top — similar to the Live Chat module. Here's what you see:

- **Sticky header** at the very top with:
  - A **"Back to Site"** button (top-left) — takes you back to the site dashboard
  - The module title **"Marketing"**
  - Quick action buttons: **"New Campaign"** and **"New Sequence"** (top-right)
- **Horizontal nav tabs** below the header with 10 sections: **Overview, Campaigns, Sequences, Subscribers, Landing Pages, Forms, Templates, Social, Calendar, SMS**
- The nav highlights whichever section you're in — clicking any tab navigates directly

You **never** need to type URLs manually. Every section is accessible from the nav bar at all times.

---

## Getting In

1. Log in to the dashboard
2. Click **Sites** in the left sidebar
3. Click on any site (e.g., "Jacktest Ltd")
4. You should see tabs along the top: Overview, Pages, Blog, Modules, Analytics, etc.
5. Click the **Marketing** tab
6. You should see a card with a Mail icon, title "Marketing Suite", a short description, and an **"Open Marketing Dashboard"** button
7. Click **"Open Marketing Dashboard"**
8. ✅ You're now on the **Marketing Hub** (Overview page)

**What you should see:**

- **Sticky top bar:** "Back to Site" button (left), "Marketing" title, "New Campaign" and "New Sequence" buttons (right)
- **Nav bar below:** Overview (active/highlighted), Campaigns, Sequences, Subscribers, Landing Pages, Forms, Templates, Social, Calendar, SMS
- **Page content:**
  - Title **"Marketing Hub"** with subtitle "Manage campaigns, sequences, and subscriber engagement"
  - **4 stat cards:** Active Subscribers, Total Emails Sent, Open Rate, Click Rate
  - **9 Quick Action cards** in a 3×3 grid: Campaigns, Sequences, Subscribers, Landing Pages, Opt-In Forms, Templates, Social Media, Content Calendar, SMS Campaigns
  - **Recent Campaigns** section (with "View All" link)
  - **Active Sequences** section (with "View All" link)
  - **Performance Overview** section (open rate, click rate, bounce rate)
  - **AI Insights** section with "Generate Insights" button

**Also verify the other way in:**

9. Click **"Back to Site"** at the top-left to return to the site page
10. Click the **Modules** tab
11. Find "Marketing Suite" in the module list
12. It should have an **"Open"** button, a **"Configure"** button, and a toggle
13. Click **"Open"** — it should take you to the same Marketing Hub

---

## Part 1: Add Your First Subscriber

1. Click **"Subscribers"** in the nav bar (or click the Subscribers card on the Hub)
2. ✅ The Subscribers page loads. The nav bar highlights **"Subscribers"**
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
12. Click **"Add"**
13. ✅ Both Jack and Mary should be in the table
14. Try the search box — type `jack` in the **"Search by email or name..."** field
15. ✅ Only Jack's row should show
16. Clear the search box

**Test the mailing lists:**

17. Click the **"Lists"** tab
18. You should see an empty state: "No mailing lists" / "Create lists to organize your subscribers"
19. Click **"New List"** (+ icon)
20. Fill in:
    - **Name:** `Newsletter`
    - **Description:** `Main newsletter subscribers`
21. Click create/save
22. ✅ The "Newsletter" list appears as a card showing "0 subscribers"

**Verify hub update:**

23. Click **"Overview"** in the nav bar
24. ✅ You're back on the Marketing Hub. The "Active Subscribers" stat card should show **2**

---

## Part 2: Browse Email Templates

1. Click **"Templates"** in the nav bar (or click the Templates card on the Hub)
2. ✅ The Email Templates page loads. The nav bar highlights **"Templates"**
3. You should see a template library — browse through what's available
4. ✅ Page loads without errors
5. Click **"Overview"** in the nav bar to return to the Hub

---

## Part 3: Create Your First Campaign

1. Click **"Campaigns"** in the nav bar (or click the Campaigns card on the Hub)
   - OR click the **"New Campaign"** button in the top-right of the sticky header (this goes directly to the new campaign wizard)
2. If you clicked the nav tab: ✅ The Campaigns list page loads. The nav bar highlights **"Campaigns"**
3. Click **"New Campaign"** (+ icon, top-right of the page — or use the header button)
4. ✅ The campaign wizard loads

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
26. ✅ The detail page loads
27. Look for a **three-dot menu** (⋮) or action buttons on the campaign
28. Find and click **"Duplicate"** (Copy icon) — go back to the list
29. ✅ You should see two campaigns now
30. Click the duplicated campaign → from the three-dot menu, click **"Delete"** (Trash icon)
31. ✅ Only the original remains

**Verify hub update:**

32. Click **"Overview"** in the nav bar
33. ✅ You're on the Hub. "Recent Campaigns" section should show your campaign

---

## Part 4: Build a Drip Sequence

1. Click **"Sequences"** in the nav bar (or click the Sequences card on the Hub)
   - OR click the **"New Sequence"** button in the top-right of the sticky header
2. If you clicked the nav tab: ✅ The Sequences list loads. The nav bar highlights **"Sequences"**
3. Click **"New Sequence"** (+ icon)
4. ✅ The sequence builder page loads. No crashes!

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
18. ✅ No crashes at any point

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

**Verify hub update:**

39. Click **"Overview"** in the nav bar
40. ✅ Hub should now show "Welcome Series" under "Active Sequences"

---

## Part 5: Create an Opt-In Form

1. Click **"Forms"** in the nav bar (or click the Opt-In Forms card on the Hub)
2. ✅ The Opt-In Forms page loads. The nav bar highlights **"Forms"**
3. Click **"New Form"** (+ icon)
4. ✅ The form builder loads

**The form builder has 3 tabs: Details, Fields, Behavior**

**Details tab (shows first):**

5. Fill in:
   - **Form Name:** `Newsletter Signup`
   - **Form Type:** Leave as "Inline (embedded in page)"
   - **Description:** `Main newsletter signup form`
   - **Button Text:** Leave as "Submit" (or change to "Subscribe")
   - **Button Color:** Leave default or pick a color

**Fields tab:**

6. Click the **"Fields"** tab
7. ✅ An **Email Address** field is already there by default (type: email, required: ✅)
8. Click **"+ Add Field"** at the bottom to add a custom field
9. A new field card appears — configure it:
   - **Type:** Select **"Text"**
   - **Label:** Change to `First Name`
   - **Placeholder:** Type `Your first name`
   - Toggle **Required** on
10. ✅ You should now have 2 fields: Email Address and First Name

**Behavior tab (optional):**

11. Click the **"Behavior"** tab
12. You should see the **"Success Action"** section
13. ✅ Default is "Show message" with "Thank you!" — leave as-is or customize

**Save it:**

14. Click **"Save"** (top-right, with save icon)
15. ✅ You should be redirected to the form detail page
16. ✅ "Newsletter Signup" appears with the fields you configured

---

## Part 6: Create a Landing Page (Deep Test)

> The landing page editor is a full block-based page builder. Test it thoroughly.

1. Click **"Landing Pages"** in the nav bar (or click the Landing Pages card on the Hub)
2. ✅ The Landing Pages list loads. The nav bar highlights **"Landing Pages"**
3. Click **"New Landing Page"** (+ icon)
4. ✅ The landing page editor loads

**The editor has 4 tabs: Content, Blocks, SEO, Templates**

**Content tab (shows first):**

5. Fill in:
   - **Title:** `Summer Sale 2025`
   - **Slug:** Should auto-generate to `summer-sale-2025` (or set it manually)
   - **Description:** `Our biggest sale of the year`
6. ✅ Verify the fields accept input without errors

**Blocks tab — this is the page builder:**

7. Click the **"Blocks"** tab
8. You should see an empty state or a list of content blocks
9. Look for an **"Add Block"** dropdown or button with block types:
   - Hero, Features, Testimonials, CTA, Opt-In Form, Video, Gallery, Countdown, FAQ, Pricing, Social Proof
10. Add a **Hero** block — fill in:
    - **Heading:** `Summer Sale — 50% Off Everything`
    - **Subheading:** `Limited time only`
11. Add a **CTA** block — fill in:
    - **Button Text:** `Shop Now`
    - **Button Link:** `https://example.com/shop`
12. Add a **Testimonials** block — enter some sample testimonial text
13. Add an **FAQ** block — add a question/answer pair
14. ✅ All blocks render in the editor without crashes
15. Try reordering blocks if drag/drop or arrows are available
16. Try deleting one block
17. ✅ Block operations work smoothly

**SEO tab:**

18. Click the **"SEO"** tab
19. You should see fields for:
    - **Meta Title** (or auto-filled from the page title)
    - **Meta Description**
    - **OG Image** (optional)
20. Fill in:
    - **Meta Title:** `Summer Sale 2025 - 50% Off`
    - **Meta Description:** `Don't miss our biggest sale of the year. 50% off everything.`
21. ✅ SEO fields save correctly

**Templates tab:**

22. Click the **"Templates"** tab
23. You should see pre-built landing page templates you can start from
24. ✅ Template list loads (may be empty or have starter templates)

**Save and publish:**

25. Click **"Save"** (or "Save Draft")
26. ✅ The page saves — you should see a success toast
27. If there's a **"Publish"** button, click it
28. ✅ The landing page status changes to published
29. Go back to the Landing Pages list (click **"Landing Pages"** in the nav)
30. ✅ "Summer Sale 2025" appears in the list with its status

---

## Part 7: Social Media

> Social Media is now accessible directly from the nav bar — no URL typing needed.

1. Click **"Social"** in the nav bar (or click the Social Media card on the Hub)
2. ✅ The Social Media page loads. The nav bar highlights **"Social"**
3. You should see two tabs: **"Posts"** and **"Connections"**

**Posts tab:**

4. You should see an empty state or a list of social posts
5. Look for a **"New Post"** or **"Create Post"** button
6. If available, click it to go to the post composer
7. ✅ The social post composer loads with platform selection options

**Connections tab:**

8. Click the **"Connections"** tab
9. ✅ You should see social platform connection options (Facebook, Twitter/X, LinkedIn, etc.)
10. ✅ The connections settings page loads without errors

---

## Part 8: Content Calendar

> Content Calendar is now accessible directly from the nav bar.

1. Click **"Calendar"** in the nav bar (or click the Content Calendar card on the Hub)
2. ✅ The Content Calendar page loads. The nav bar highlights **"Calendar"**
3. ✅ You should see a month-view calendar showing your marketing content
4. The calendar should show any campaigns, social posts, or sequences you've created
5. Try clicking on different dates or navigating between months
6. ✅ Calendar interactions work without errors

---

## Part 9: SMS Campaigns

> SMS Campaigns is now accessible directly from the nav bar.

1. Click **"SMS"** in the nav bar (or click the SMS Campaigns card on the Hub)
2. ✅ The SMS Campaigns page loads. The nav bar highlights **"SMS"**
3. You should see either:
   - An empty state: "No SMS campaigns yet" with a "Create SMS Campaign" button
   - Or a list of existing SMS campaigns
4. Click **"New SMS Campaign"** (+ icon)
5. ✅ The SMS composer loads with:
   - **Campaign Name** field
   - **Message** text area with character counter
   - **Audience** selection
6. Fill in:
   - **Name:** `Order Ready Notification`
   - **SMS Message:** `Hi {{first_name}}, your order is ready for pickup!`
7. ✅ Character counter updates as you type (shows count / 1600 and segment count)
8. ✅ Helper text shows personalization variables
9. Click **"Save"** (or "Save as Draft")
10. ✅ You're redirected — the campaign should appear in the campaigns list

---

## Part 10: Check the Marketing Hub Stats

1. Click **"Overview"** in the nav bar
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
8. ✅ All 9 Quick Action cards are clickable and go to the correct section

**Test navigation round-trip:**

9. Click each nav tab one by one: Campaigns, Sequences, Subscribers, Landing Pages, Forms, Templates, Social, Calendar, SMS
10. ✅ Each page loads correctly and the nav highlights the active tab
11. ✅ The "New Campaign" and "New Sequence" buttons in the header remain visible at all times

---

## Part 11: Client Portal View

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

## Part 12: Super Admin Health Check

> You need to be a Super Admin for this. Navigate to `/admin/marketing`.

1. Log in as **Super Admin**
2. Navigate to `/admin/marketing`
3. ✅ Platform health dashboard loads
4. You should see platform-wide marketing stats and site-level data
5. ✅ Page loads without errors

---

## Part 13: Clean Up

1. Click **"Campaigns"** in the nav bar
2. Delete the test campaign ("Welcome to Our Newsletter")
3. Click **"Sequences"** in the nav bar
4. Delete the test sequence ("Welcome Series")
5. Click **"Landing Pages"** in the nav bar
6. Delete the test landing page ("Summer Sale 2025")
7. Click **"Forms"** in the nav bar
8. Delete the test form ("Newsletter Signup")
9. Click **"Subscribers"** in the nav bar
10. Delete Jack Banda and Mary Mwale
11. ✅ Everything deletes cleanly

---

## Done!

If you made it through all 13 parts without crashes or broken pages, the Marketing Module is working. Note any spots where:

- A page crashed or showed an error
- A button did nothing when clicked
- Data didn't save or didn't show up
- Navigation went to a wrong page or 404
- The nav bar didn't highlight the correct tab
- A quick action card on the Hub went to the wrong place

Those are bugs to report.
