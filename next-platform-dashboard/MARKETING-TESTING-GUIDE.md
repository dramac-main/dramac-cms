# Marketing Module — Walkthrough Testing Guide

> Follow this step-by-step. Just do exactly what it says. If something breaks or doesn't match, that's a bug — note it and keep going.

---

## Getting In

1. Log in to the dashboard
2. Click **Sites** in the left sidebar
3. Click on any site (e.g., "Jacktest Ltd")
4. You should see tabs along the top: Overview, Pages, Blog, Modules, Analytics, etc.
5. Click the **Marketing** tab
6. You should see a card with a Mail icon, title "Marketing Suite", a short description, and an **"Open Marketing Dashboard"** button
7. Click **"Open Marketing Dashboard"**
8. ✅ You're now on the Marketing Hub — you should see stat cards (Campaigns, Subscribers, etc.) and quick action buttons

**Also verify the other way in:**

9. Go back to the site page, click the **Modules** tab
10. Find "Marketing Suite" in the module list
11. It should have an **"Open"** button, a **"Configure"** button, and a toggle
12. Click **"Open"** — it should take you to the same Marketing Hub

---

## Part 1: Add Your First Subscriber

1. From the Marketing Hub, click **Subscribers** (in the sidebar or a quick action)
2. You should see a subscriber list (probably empty)
3. Click **"Add Subscriber"**
4. Type in:
   - Email: `jack@testcompany.com`
   - First Name: `Jack`
   - Last Name: `Banda`
5. Click **Save**
6. ✅ Jack should appear in the list with status "Active"
7. Click on Jack's row to open his details
8. Look for a "Tags" section — add the tag: `vip`
9. ✅ The tag `vip` should display on his record
10. Go back to the subscriber list

**Add one more subscriber** (we'll need two for audiences later):

11. Click **"Add Subscriber"** again
12. Type in:
    - Email: `mary@testcompany.com`
    - First Name: `Mary`
    - Last Name: `Mwale`
13. Click **Save**
14. ✅ Both Jack and Mary should be in the list

---

## Part 2: Browse Email Templates

1. Click **Templates** in the marketing sidebar
2. You should see a library of templates — system ones like Welcome, Promotional, Newsletter, etc.
3. Click on any template to preview it
4. ✅ Preview loads and shows the template layout
5. Go back to the template list

---

## Part 3: Create Your First Campaign

1. Click **Campaigns** in the sidebar
2. You should see the campaign list (empty or with any previous ones)
3. Click **"New Campaign"**
4. The campaign wizard should load — follow the steps:
   - **Type:** Select "Email"
   - **Subject line:** Type `Welcome to Our Newsletter`
   - **Preview text:** Type `Big things are coming your way`
   - **Audience:** Pick any list or segment available (or skip if none)
   - **Schedule:** Choose "Save as Draft"
5. Click **Create**
6. ✅ You should be redirected back to the campaign list
7. ✅ Your new campaign should appear with status **"Draft"**
8. Click on the campaign to open its detail page
9. ✅ You should see the subject line, content area, and action buttons
10. Look for these buttons and click each one:
    - **"Send Test Email"** — click it (it may show an error if Resend isn't configured, that's OK — just confirm the button works and doesn't crash)
    - **"Duplicate"** — click it, then go back to the list
    - ✅ You should now see two campaigns (original + copy)
11. Click the **duplicated** campaign → click **"Delete"**
12. ✅ The duplicate is removed, only the original remains

---

## Part 4: Schedule & Manage a Campaign

1. Open your "Welcome to Our Newsletter" campaign
2. Look for a **"Schedule"** button
3. Click it → pick any future date and time → confirm
4. ✅ Campaign status should change to **"Scheduled"**
5. Now click **"Pause"**
6. ✅ Status should change to **"Paused"**
7. Click **"Resume"**
8. ✅ Status should go back to **"Scheduled"**

---

## Part 5: Build a Drip Sequence

1. Click **Sequences** in the sidebar
2. Click **"New Sequence"**
3. ✅ The page should load without any errors (we just fixed a crash here)

**Fill in the details on the left side:**

4. **Name:** Type `Welcome Series`
5. **Description:** Type `Onboards new subscribers over 7 days`
6. **Trigger:** It should default to "Manual Enrollment" — leave it for now
7. **Enrollment Limit:** Type `500`
8. **Allow Re-enrollment:** Toggle it ON, then OFF again

**Test the Conversion Goal dropdown (this is what was broken):**

9. The **Conversion Goal** dropdown should show "No goal" by default
10. Click it → select **"Purchase"** → a "Window (hours)" field should appear
11. Click it → select **"Custom Event"** → an "Event Name" field should appear
12. Click it → select **"No goal"** → the extra fields should disappear
13. ✅ No crashes at any point

**Now build the workflow on the right side:**

14. Click **+ Email** button at the bottom → a blue Email step card appears
15. Click the expand arrow on the step → fill in:
    - Step Name: `Welcome Email`
    - Subject Line: `Welcome aboard, {{first_name}}!`
16. Click **+ Delay** → an amber Delay step appears
17. Expand it → click the **"1 day"** preset button
18. Click **+ Email** → another Email step appears
19. Expand it → set Subject Line: `Here's what you can do next`
20. Click **+ Condition** → a purple Condition step appears
21. Expand it → set Field: `Email Opened`, Operator: `Is True`
22. Click **+ SMS** → a green SMS step appears
23. Expand it → type a message: `Hey {{first_name}}, check your email!`
24. ✅ You should now have 5 steps: Email → Delay → Email → Condition → SMS

**Test reorder and delete:**

25. On the SMS step, click the **up arrow** twice — it should move up in the list
26. Click the **down arrow** — it should move back down
27. Click the **trash icon** on the SMS step → it should be removed
28. ✅ You now have 4 steps, numbered 1–4 correctly

**Save it:**

29. Click **"Create Sequence"** at the top
30. ✅ You should be redirected to the sequence list
31. ✅ "Welcome Series" should appear in the list

**Verify the detail page:**

32. Click on "Welcome Series" in the list
33. ✅ The detail page loads showing your steps and enrollment stats

---

## Part 6: Create an Opt-In Form

1. Click **Forms** in the sidebar
2. Click **"New Form"**
3. ✅ The form builder loads
4. Set the form name: `Newsletter Signup`
5. Add these fields:
   - Email (should be there by default)
   - First Name
6. Set the success message to: `Thanks for subscribing!`
7. Click **Save**
8. ✅ The form appears in the form list
9. Click on it → the detail page shows fields and a submissions count (0)

---

## Part 7: Create a Landing Page

1. Click **Landing Pages** in the sidebar
2. Click **"New Landing Page"**
3. ✅ The editor loads
4. Set the title: `Summer Sale`
5. Set the slug: `summer-sale`
6. Add a text block with: `50% off everything this week only`
7. Add a button block or CTA
8. Click **Save**
9. ✅ The page appears in the list with status "Draft"
10. Open it → click **"Publish"**
11. ✅ Status changes to "Published"
12. Click **"Unpublish"**
13. ✅ Status changes back to "Draft"

---

## Part 8: Social Media

1. Click **Social** in the sidebar (or navigate to the social posts page)
2. ✅ Page loads — shows post list or empty state
3. Try composing a new post:
   - Type content: `Exciting news coming soon! Stay tuned 🚀`
   - Select a platform (Facebook, Twitter, etc.) if available
4. Look for a **Content Calendar** link or tab — click it
5. ✅ A calendar view loads showing month/week/day options
6. Look for **Social Connections** or settings
7. ✅ You should see connect/disconnect buttons for platforms: Meta, Twitter, TikTok, LinkedIn

---

## Part 9: SMS & WhatsApp

1. Navigate to the **SMS** section in marketing
2. ✅ Page loads — you see an SMS composer
3. Type a message: `Hi {{first_name}}, your order is ready for pickup!`
4. ✅ Character counter updates as you type (should show count / 1600, and segment count)
5. Look for WhatsApp settings — you should see fields for Template Name and provider config
6. Look for provider settings — fields for Twilio SID, Auth Token, or Meta Business ID should exist

---

## Part 10: Check the Marketing Hub Stats

1. Go back to the **Marketing Hub** (main marketing dashboard)
2. ✅ The stat cards should now show updated numbers:
   - Subscribers: **2** (Jack and Mary)
   - Campaigns: **1** (the one you created)
   - Sequences: **1** (Welcome Series)
   - Forms: **1** (Newsletter Signup)
3. ✅ Your campaign should appear under "Recent Campaigns"

---

## Part 11: AI Features (Quick Check)

> These need API keys configured to actually work. Just verify the buttons exist.

1. Go back to your campaign → open the editor
2. Look for any of these AI buttons:
   - **"AI Suggest Subject Lines"**
   - **"AI Generate Preview Text"**
   - **"AI Generate Content"**
   - **"AI Improve Text"**
3. ✅ At least some of these buttons should be visible
4. Click one — it should either work (if API key is set) or show a helpful error message (not crash)

---

## Part 12: Client Portal View

> You need a portal user with marketing permissions for this.

1. Log out and log in as a **client portal user**, OR open the portal URL in an incognito window
2. Navigate to the site's marketing section: **Portal → Marketing**
3. ✅ Marketing should appear in the portal sidebar
4. ✅ A simplified dashboard loads (fewer options than the agency view)
5. Click through:
   - **Campaigns** → can see the campaign list
   - **Subscribers** → can see subscribers
   - **Sequences** → can see sequences
   - **Forms** → can see forms
   - **Analytics** → shows engagement charts/stats
6. ✅ All pages load without errors

---

## Part 13: Super Admin Health Check

> You need to be a Super Admin for this.

1. Log in as **Super Admin**
2. Navigate to **Admin → Marketing** (or `/admin/marketing`)
3. ✅ Platform health dashboard loads
4. You should see:
   - Email volume stats (platform-wide)
   - Top sites by volume
   - Safety thresholds (bounce rate, complaint rate limits)
5. Look for **"Pause Marketing"** action next to a site — click it
6. ✅ The site's marketing should show as paused
7. Click **"Resume Marketing"**
8. ✅ The site's marketing is active again

---

## Part 14: Clean Up

1. Go back to the agency dashboard → Marketing
2. Delete the test landing page ("Summer Sale")
3. Delete the test form ("Newsletter Signup")
4. Delete the test sequence ("Welcome Series")
5. Delete the test campaign ("Welcome to Our Newsletter")
6. Delete the test subscribers (Jack Banda, Mary Mwale)
7. ✅ Everything deletes cleanly, no orphan data errors

---

## Done!

If you made it through all 14 parts without any crashes or broken pages, the Marketing Module is working. Note any spots where:
- A page crashed or showed an error
- A button did nothing when clicked
- Data didn't save or didn't show up
- Navigation went to a 404 page

Those are bugs to report.
