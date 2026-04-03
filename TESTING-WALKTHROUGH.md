# DRAMAC CMS — Full User Experience Walkthrough

> **Purpose:** Walk through the entire platform as 3 different users to verify everything works end-to-end.
> **Date:** March 22, 2026
> **URL:** https://app.dramacagency.com

---

## Who You'll Be Testing As

| #   | Role                             | What They Do                                                           |
| --- | -------------------------------- | ---------------------------------------------------------------------- |
| 1   | **Agency Owner**                 | Signs up, creates the agency, builds a client site with a shop         |
| 2   | **Client** (the agency's tenant) | Logs into the Client Portal to view their site                         |
| 3   | **Customer** (end buyer)         | Visits the shop, browses products, places an order or requests a quote |

---

## PART 1: Agency Owner — Signup, Setup & Build

### Step 1: Create Your Agency Account

1. Open **https://app.dramacagency.com/signup** in your browser
2. Fill in:
   - **Email** — use a real email you can check (you'll get notification emails later)
   - **Password** — at least 6 characters
3. Click **"Sign Up"**
4. You'll see a **"Check your email"** message — open your email inbox and look for the confirmation email from Dramac
5. Click the **confirm link** in the email
6. After confirming, you'll be redirected to the **Onboarding Wizard** at `/onboarding`

### Step 2: Complete Onboarding (6 steps)

You'll see a step-by-step wizard. Fill in each step:

| Step                   | What to Fill In                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **1. Your Profile**    | Your full name, job title (e.g. "Owner")                                                       |
| **2. Agency**          | Agency name (e.g. "Test Agency"), description, website (optional)                              |
| **3. Goals**           | Pick what you want to do (select any — this is just preferences)                               |
| **4. Industry**        | Pick your industry (select any)                                                                |
| **5. First Client**    | Enter a client name (e.g. "Demo Store Client") and their email, then click **"Create Client"** |
| **6. You're All Set!** | Click **"Go to Dashboard"**                                                                    |

> **Important:** Do NOT skip Step 5 (First Client). You need at least one client before you can create a site. If you skip this, you'll need to add a client manually before proceeding.

After clicking "Go to Dashboard", you'll land on the **Agency Dashboard** at `/dashboard`.

**What you should see on the dashboard:**

- A **Welcome notification** in-app: "Welcome to DRAMAC! Your account is all set up."
- **Quick Actions** panel with buttons: "Add Client", "Create Site", "AI Builder", "Upload Media", "Browse Modules", "Settings"

---

### Step 3: Create a New Site

1. On the dashboard, click **"Create Site"** (or **"AI Builder"**) in the Quick Actions panel
   - Alternatively: click **"Sites"** in the left sidebar → click **"+ New Site"** button (top right)
2. You'll land on the **"Create New Site"** page
3. Fill in the form:
   - **Client** — select the client you created during onboarding (e.g. "Demo Store Client")
   - **Site Name** — e.g. "Demo Shop" (the subdomain auto-fills based on this)
   - **Subdomain** — auto-generated (e.g. `demo-shop`). A green ✅ means it's available, red ❌ means it's taken
   - **Description** — optional
4. **Choose your Build Mode** — you'll see two radio options:
   - ✨ **"Generate with AI"** (selected by default) — "Describe your business and let AI build it"
   - ✏️ **"Start from Scratch"** — "Build manually with the visual editor"
   - **Leave "Generate with AI" selected** — this is the recommended path
5. Click **"Create Site"**

> **Write down your subdomain!** Your live site URL will be: **https://YOUR-SUBDOMAIN.sites.dramacagency.com**
> (e.g. `https://demo-shop.sites.dramacagency.com`)

**What happens next:** The site is created and you're automatically redirected to the **AI Website Designer** page.

---

### Step 4: Generate Your Website with AI

You're now on the **AI Website Designer** page. Here's what you see:

- A heading: **"Build Your Website with AI"**
- Feature selection chips
- A prompt text area

**Follow these steps:**

1. **Select features** using the toggle chips at the top:
   - Click **"Online Store"** 🛒 — this tells the AI to include a full shop with product grids, cart, and checkout
   - Optionally click **"Booking System"** 📅, **"Blog"** 📄, or **"Live Chat"** 💬 if you want those too
   - A chip turns **blue with a checkmark** when selected
     > **You MUST select "Online Store" for this walkthrough** — it ensures the AI generates proper e-commerce pages.

2. **Write your prompt** in the text area (labeled "What kind of website do you want?"):
   - Example: _"I need a professional website for my fashion store in Lusaka called 'Demo Shop'. We sell clothing, shoes, and accessories. Include a hero section, featured products, about section, testimonials, and contact form. Use a modern dark theme."_
   - Be specific — include your business name, location, and what you offer

3. Click **"Generate Website"** (the big blue button at the bottom)

4. **Wait for generation** — you'll see:
   - A progress bar filling up with percentage
   - Status messages cycling through: "Analyzing your requirements...", "Generating page 1/5: Homepage...", etc.
   - Elapsed time counter
   - This typically takes **1-2 minutes**

5. **Preview your site** — once generation completes, you'll see:
   - A **device preview** showing your generated site (desktop/tablet/mobile toggle)
   - **Page tabs** at the top — click through each page (Homepage, About, Shop, Contact, etc.)
   - A **"Page Details"** sidebar on the right showing the page structure
   - A green status bar at the bottom: "X pages • Y components • Ready to apply"

6. **Review each page** by clicking the tabs. Make sure the shop page has product grids, the homepage has featured products, etc.

7. Click **"Apply & Edit"** (the green button at the top right) to save everything

**What happens when you click "Apply & Edit":**

- All generated pages are saved to your site
- Design tokens (colors, fonts) are applied to your site theme
- **E-Commerce module is automatically installed** (because the AI detected shop/cart/checkout components)
- **Your site is automatically published** — it's live right away!
- You'll see a toast notification: _"Website published! X pages live at demo-shop.sites.dramacagency.com"_
- You're redirected to the **Site Detail page** with the **Pages** tab active

> **No marketplace visit needed!** The AI Designer auto-installs all the modules your site uses. You don't need to go to the Marketplace manually.

---

### Step 5: Explore Your Site Dashboard

After "Apply & Edit", you're on the **Site Detail page**. Here's what you should see:

1. **Header area:**
   - Your site name (e.g. "Demo Shop")
   - Your site URL shown below the name (e.g. `demo-shop.sites.dramacagency.com`)
   - Buttons: **"Edit Pages"**, **"AI Designer"**, **"View Live"** (this appears because your site is now published)

2. **Tabs across the page:**
   - **Overview** — site info, status, page count
   - **Pages** — list of all generated pages (currently active tab)
   - **Blog**
   - **Modules** — shows installed modules with on/off toggles
   - **Analytics**
   - **E-Commerce** — this tab appears because the AI auto-installed the e-commerce module!
   - (Other module tabs may appear if you selected Booking, Live Chat, etc.)

3. **Verify E-Commerce is installed:** Click the **"E-Commerce"** tab
   - You should see a card with a shopping cart icon: **"E-Commerce Store"**
   - Description: "Manage products, orders, inventory, discounts, and your online storefront."
   - Click **"Open Store Dashboard"** — this takes you to the full e-commerce management area

> **If you don't see the E-Commerce tab**, refresh the page (F5). The auto-install writes to the database and the tab appears on the next page load.

---

### Step 6: Add Products to Your Store

1. From the **E-Commerce** tab, click **"Open Store Dashboard"**
   - You're now in the E-Commerce dashboard with a sidebar showing: Dashboard, Products, Orders, Customers, Categories, Inventory, Discounts, Quotes, and more
2. Click **"Products"** in the sidebar (or use the **"+"** button in the sidebar header)
3. Click the **"+"** button or **"Add Product"** to open the **"Add New Product"** dialog
4. Fill in the product details:
   - **Product Name** — e.g. "Premium T-Shirt" (URL slug auto-generates)
   - **Price** — e.g. `250` (this is in your site's currency)
   - **Short Description** — a one-liner
   - **Full Description** — detailed product info
   - **Product Images** — upload up to 10 images (optional but recommended)
   - **Status** — change from "Draft" to **"Active"** (⚠️ important! Draft products won't show on the shop)
   - **Featured Product** — toggle ON for at least one product (it shows in the featured section)
5. Click **"Create Product"**
6. You'll see a toast: _"Product created successfully"_ and the dialog closes
7. **Repeat** to add 2-3 more products so the shop looks populated:
   - e.g. "Running Shoes" at K450, status: Active
   - e.g. "Leather Wallet" at K180, status: Active
   - e.g. "Sunglasses" at K320, status: Active, Featured: ON

---

### Step 7: (Optional) Create Product Categories

1. Click **"Categories"** in the e-commerce sidebar
2. Click the **"+"** button to open the **Create Category** dialog
3. Create a few categories: e.g. "Clothing", "Accessories", "Footwear"
4. Go back to **Products**, edit each product, and assign them to categories

---

### Step 8: Visit Your Live Storefront

Your site was auto-published when you clicked "Apply & Edit" in Step 4. Time to see it!

1. Open a **new browser tab** (or incognito window)
2. Go to: **https://YOUR-SUBDOMAIN.sites.dramacagency.com**
   - e.g. `https://demo-shop.sites.dramacagency.com`
   - Or from the Site Detail page, click the **"View Live"** button in the header
3. You should see your AI-generated website with:
   - [ ] A styled hero section
   - [ ] Featured products section (if you marked products as featured)
   - [ ] A **"Shop"** link in the navigation
   - [ ] Your brand colors and design applied consistently
4. Click **"Shop"** in the navigation to see the shop page:
   - [ ] All your **Active** products displayed with images and prices
   - [ ] Product cards are clickable

> **This is what your customers will see!** Browse around, click on products, try the search and filters.

---

## PART 2: Testing the Customer Shopping Experience

> For this part, use a **different browser** or an **incognito/private window** so you're not logged into the agency dashboard.

### Step 9: Browse the Shop

1. Go to **https://YOUR-SUBDOMAIN.sites.dramacagency.com/shop**
2. Verify you can see:
   - [ ] All your active products with images and prices
   - [ ] Product cards are clickable
   - [ ] Filters and sorting work (if using the full catalog)
   - [ ] Search works

### Step 10: View a Product

1. Click on any product card
2. You should land on the product detail page (e.g. `/products/premium-t-shirt`)
3. Verify you can see:
   - [ ] Product images
   - [ ] Product name and price (in your currency)
   - [ ] Description
   - [ ] **"Add to Cart"** button
   - [ ] Quantity selector (+ and - buttons)

### Step 11: Add to Cart & Checkout (Normal Purchase Mode)

1. Click **"Add to Cart"** on a product
2. You should see a cart notification or the cart icon updating
3. Click the **cart icon** in the header (or go to `/cart`)
4. Verify the cart page shows:
   - [ ] The product you added with correct name and price
   - [ ] Quantity controls (you can adjust it)
   - [ ] Subtotal and total
   - [ ] A **"Checkout"** button
5. Click **"Checkout"**
6. Fill in the checkout form:
   - **Email** — use a different email than your agency account (this simulates a real customer)
   - **Name** — e.g. "Test Customer"
   - **Phone** — any number
   - **Shipping address** — fill in address fields
7. Choose a payment method (if available) and complete the order
8. You should see the **Order Confirmation** page

> **Check your agency dashboard** — go back to your agency browser tab, navigate to the E-Commerce dashboard → **"Orders"** in the sidebar. You should see the new order!

---

## PART 3: Testing Quotation Mode (B2B Flow)

> This tests the quote-instead-of-purchase flow. Do this after testing normal shopping.

### Step 12: Enable Quotation Mode

1. Go back to your **agency dashboard** browser (logged in as agency owner)
2. In the E-Commerce dashboard sidebar, click **"Settings"**
3. Click the **"Quotes"** tab
4. Find the big **"Quotation Mode"** toggle and **turn it ON**
5. You'll see options appear:
   - **Button Label** — leave as "Request a Quote" or change it
   - **Hide Prices** — toggle ON if you want to test price hiding
6. The settings save automatically

### Step 13: Test the Customer's Quote Experience

1. Go back to your **customer browser** (incognito/private window)
2. **Refresh** the shop page: **https://YOUR-SUBDOMAIN.sites.dramacagency.com/shop**
3. Verify the changes:
   - [ ] "Add to Cart" buttons now say **"Add to Quote"** (or your custom label)
   - [ ] If you turned on "Hide Prices" — prices should be hidden
   - [ ] Cart icon in header still shows (it tracks your quote items)
4. Click **"Add to Quote"** on any product
   - The product is added to your quote cart (just like adding to a normal cart)
   - You should see a toast: "Added to quote"
   - The cart badge updates with the item count
5. **Add more products** — click "Add to Quote" on 2-3 more products to build a multi-item quote
6. Click the **cart icon** in the header (or go to `/cart`)
7. Verify the cart page shows:
   - [ ] Title says **"Your Quote Items"**
   - [ ] All products you added with correct names and images
   - [ ] Quantity controls (you can adjust quantities — changes are instant, no loading delay)
   - [ ] A **"Submit Quote Request"** button (instead of "Checkout")
8. Click **"Submit Quote Request"**
   - You'll be taken to the **Quote Submission page** (`/quotes`)
   - Your cart items are automatically loaded into the quote form
9. Fill in the quote request form:
   - **Your Name** — e.g. "Quote Customer"
   - **Your Email** — use a real email (you'll receive quote notifications here)
   - **Message/Notes** — e.g. "I'd like a bulk order of 50 units"
10. Click **"Submit Quote Request"** to submit
    - You should see a success message: "Quote Request Submitted!" with your quote reference number
    - Your cart is automatically cleared
    - You'll see two buttons: **"Download Quote Summary"** (saves a text file) and **"Chat With Us"**
    - After ~2 seconds, the **live chat widget auto-opens** in the bottom-right corner
    - Chiko (the AI assistant) will **automatically greet you** with context about your quote — e.g. "I see you've just submitted a quote request with 4 items..."
    - This is a **dedicated quote conversation** — if you come back later, it picks up where you left off
    - Chiko provides progressive guidance: what happens next, estimated response time, and how to check your quote status

### Step 14: Check That Notifications Fired

1. **Agency Owner Dashboard:**
   - Click the **bell icon** (🔔) at the top of the dashboard
   - You should see an **in-app notification** about the new quote request
   - Check the **email inbox** for your agency owner account — you should receive a "New Quote Request" email
   - The email should include a **table of items** (product name, quantity, unit price) and the total

2. **Customer Email:**
   - Check the email inbox for the email you used in the quote form
   - You should receive a **confirmation email** saying "Your quote request has been received"
   - The email should list the items you requested (product name and quantity)

3. **Live Chat (if active):**
   - If the customer had an active chat session, Chiko should have posted a proactive message about the quote submission

### Step 15: Process the Quote (as Agency Owner)

1. In the E-Commerce dashboard sidebar, click **"Quotes"**
2. You should see the new quote with status **"Pending"**
3. Click on the quote to view details
4. Review the quote items and customer info
5. Click **"Send Quote"** to send a formal quote to the customer
   - The customer will receive an email with a link to view the quote
6. Check the customer's email — they should receive the quote email with a **View Quote** link

### Step 16: Accept or Reject the Quote (as Customer)

1. In the customer email, click the **View Quote** link
   - This opens a page like: `https://app.dramacagency.com/quote/SOME-TOKEN`
2. **Email Verification Gate** — You'll see a verification form first (NOT the quote)
   - [ ] Form shows the quote reference number (e.g. "Quote QUO-1008")
   - [ ] Enter the **same email** the quote was sent to
   - [ ] Click "Verify & View Quote"
   - [ ] If wrong email → error message appears
   - [ ] If correct → quote portal loads (cookie valid for 7 days)
3. The customer can now see:
   - [ ] Quote number and details
   - [ ] All line items and pricing
   - [ ] **"Accept Quote"** and **"Reject Quote"** buttons
   - [ ] Email field in accept form is pre-filled and locked with a "✓ Verified" badge
4. **Test Accept:** Click "Accept Quote"
   - Enter your name and signature (email is already filled)
   - Click confirm
   - Both parties should get notifications (in-app for owner + emails for both)
5. **(OR) Test Reject:** Click "Reject Quote"
   - Enter a reason (optional)
   - Click confirm
   - The agency owner gets a notification about the rejection
6. **(OR) Test Request Changes:** Click "Request Changes"
   - Enter amendment notes
   - Click submit
   - **Customer chat** shows: "Your change request for QUO-XXXX has been submitted! ✅"
   - **Agency owner** gets an in-app notification AND email about the amendment request

### Step 17: Turn Off Quotation Mode

1. Go back to E-Commerce dashboard → **"Settings"** → **"Quotes"** tab
2. Turn **OFF** the "Quotation Mode" toggle
3. Refresh the storefront — "Add to Cart" buttons should be back to normal

---

## PART 4: Client Portal (Agency's Client Access)

> This tests whether the client you created can log in and see their site.

### Step 18: Enable Client Portal Access

1. In your agency dashboard, click **"Clients"** in the left sidebar
2. Click on the client you created (e.g. "Demo Store Client")
3. Look for **Portal Access** settings
4. Make sure **"Has Portal Access"** is enabled
5. Set permissions:
   - Can Edit Content: ON or OFF (your choice)
   - Can View Analytics: ON
   - Can View Invoices: ON

### Step 19: Client Logs Into Portal

1. Open a **third browser** or another incognito window
2. Go to: **https://app.dramacagency.com/portal/login**
3. Log in with the **client's email** (the one you used when creating the client)
   - The client would have received a portal invitation email with login instructions
   - If they don't have a separate account, they may need to sign up first
4. After login, the client should see:
   - [ ] Their assigned site(s)
   - [ ] Analytics (if enabled)
   - [ ] Invoices (if enabled)

---

## Checklist Summary

After completing all steps, verify these worked:

### Agency Owner Setup

- [ ] Signup completed smoothly — no flash errors
- [ ] Confirmation email received and link worked
- [ ] Onboarding wizard completed all 6 steps
- [ ] Dashboard loaded at `/dashboard` with Quick Actions visible
- [ ] Client was created during onboarding

### Site Creation & AI Generation

- [ ] "Create Site" page showed Build Mode selector
- [ ] "Generate with AI" was the default selection
- [ ] After clicking "Create Site", landed on AI Designer page
- [ ] Feature chips visible (Online Store, Booking, Blog, Live Chat)
- [ ] "Online Store" chip toggled on with checkmark
- [ ] Prompt accepted and "Generate Website" started
- [ ] Progress bar showed generation steps
- [ ] Preview displayed all generated pages
- [ ] "Apply & Edit" saved pages, installed modules, and published the site
- [ ] Toast appeared confirming publication
- [ ] Redirected to Site Detail page with Pages tab

### E-Commerce Setup

- [ ] E-Commerce tab visible on Site Detail page (auto-installed by AI)
- [ ] "Open Store Dashboard" navigated to e-commerce dashboard
- [ ] Products created successfully via the dialog
- [ ] Products set to "Active" status
- [ ] At least one product marked as "Featured"
- [ ] Categories created and assigned (optional)

### Live Storefront

- [ ] Site accessible at `https://YOUR-SUBDOMAIN.sites.dramacagency.com`
- [ ] AI-generated design looks good (hero, layout, colors)
- [ ] Shop page loads with all active products
- [ ] Product cards are clickable → product detail pages work
- [ ] "Add to Cart" works — cart icon updates
- [ ] Cart page shows correct items and totals
- [ ] Checkout form works and order is placed
- [ ] Order confirmation page appears
- [ ] Order shows up in agency's E-Commerce dashboard → Orders

### Quotation Mode

- [ ] Toggling quotation mode changes all "Add to Cart" to "Request a Quote"
- [ ] "Hide Prices" works (if enabled)
- [ ] Cart icon disappears in quotation mode
- [ ] Clicking "Request a Quote" goes to quote page with product pre-loaded
- [ ] Quote submission works
- [ ] Agency owner gets in-app notification (bell icon)
- [ ] Agency owner gets email notification
- [ ] Customer gets confirmation email
- [ ] Quote appears in E-Commerce dashboard → Quotes
- [ ] "Send Quote" sends email to customer with a link
- [ ] Customer can view, accept, or reject the quote via the email link
- [ ] Accept/reject triggers proper notifications

### Branding & Responsiveness

- [ ] Colors on the storefront match the AI-generated design
- [ ] Shop page looks good on mobile (try resizing browser or use phone)
- [ ] Product cards are responsive (stack on mobile, grid on desktop)
- [ ] Checkout form is readable on mobile

---

## Troubleshooting

| Problem                                    | What to Check                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| E-Commerce tab not showing                 | Refresh the page (F5). The auto-install writes to DB; tab appears on next page load                 |
| Shop page is blank                         | Make sure E-Commerce module is installed AND enabled (check the Modules tab on site detail)         |
| No products showing                        | Make sure products are set to **"Active"** status (not Draft)                                       |
| Can't access storefront                    | Check the subdomain URL is correct: `https://YOUR-SUBDOMAIN.sites.dramacagency.com`                 |
| "View Live" button not showing             | The site might not be published — click the Publish button on the site detail page                  |
| No emails arriving                         | Check spam/junk folder. Emails come from `noreply@app.dramacagency.com`                             |
| "Add to Cart" instead of "Request a Quote" | Refresh the page — quotation mode settings may take a moment to propagate                           |
| Quote page doesn't load the product        | Make sure you clicked "Request a Quote" on a specific product (not navigated directly to `/quotes`) |
| Client can't log into portal               | Make sure "Has Portal Access" is enabled in the client's settings                                   |
| Order not in dashboard                     | Make sure you're in the correct site's E-Commerce dashboard                                         |
| AI generation failed                       | Try again with a simpler prompt, or check the browser console for errors                            |
| "Create Site" button is disabled           | You need at least one client first — go to Clients → Add Client                                     |
