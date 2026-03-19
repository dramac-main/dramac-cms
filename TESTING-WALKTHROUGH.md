# DRAMAC CMS — Full User Experience Walkthrough

> **Purpose:** Walk through the entire platform as 3 different users to verify everything works.
> **Date:** March 19, 2026
> **URL:** https://app.dramacagency.com

---

## Who You'll Be Testing As

| #   | Role                             | What They Do                                                           |
| --- | -------------------------------- | ---------------------------------------------------------------------- |
| 1   | **Agency Owner**                 | Signs up, creates the agency, builds a client site with a shop         |
| 2   | **Client** (the agency's tenant) | Logs into the Client Portal to view their site                         |
| 3   | **Customer** (end buyer)         | Visits the shop, browses products, places an order or requests a quote |

---

## PART 1: Agency Owner — Signup & Setup

### Step 1: Create Your Agency Account

1. Open **https://app.dramacagency.com/signup** in your browser
2. Fill in:
   - **Email** — use a real email you can check (you'll get notification emails later)
   - **Password** — at least 6 characters
3. Click **Sign Up**
4. Check your email inbox for a **confirmation email** from Dramac and click the confirm link
5. After confirming, you'll be redirected to the **Onboarding Wizard**

### Step 2: Complete Onboarding (6 steps)

You'll see a step-by-step wizard. Fill in each step:

| Step                | What to Fill In                                                   |
| ------------------- | ----------------------------------------------------------------- |
| **1. Your Profile** | Your full name, job title (e.g. "Owner")                          |
| **2. Agency**       | Agency name (e.g. "Test Agency"), description, website (optional) |
| **3. Goals**        | Pick what you want to do (select any — this is just preferences)  |
| **4. Industry**     | Pick your industry (select any)                                   |
| **5. First Client** | Enter a client name (e.g. "Demo Store Client") and their email    |
| **6. All Set!**     | Click **Go to Dashboard**                                         |

> **Note:** You can also click "Skip" on any step if you want to fill it in later.

After completing onboarding, you'll land on the **Agency Dashboard** at `/dashboard`.

---

### Step 3: Create a Site for Your Client

1. From the dashboard, click **Sites** in the left sidebar
2. Click the **"+ New Site"** button (top right)
3. Fill in the form:
   - **Site Name** — e.g. "Demo Shop"
   - **Subdomain** — this auto-fills based on the name (e.g. `demo-shop`). This becomes the live URL: `demo-shop.sites.dramacagency.com`
   - **Client** — select the client you created during onboarding (e.g. "Demo Store Client")
4. Click **Create Site**
5. You'll be redirected to the site's dashboard

> **Write down your subdomain!** You'll need it later to visit the storefront.
> Your shop URL will be: **https://YOUR-SUBDOMAIN.sites.dramacagency.com**

---

### Step 4: Install the E-Commerce Module

1. From the left sidebar, click **Marketplace** (or go to `/dashboard/marketplace`)
2. Browse or search for **"E-Commerce"**
3. Click on the E-Commerce module card
4. Click **"Install Module"** (or "Purchase & Install" if it's paid)
5. You'll be taken to the subscriptions page with a blue prompt at the top
6. Click **"Install for Agency"**
7. Wait for the success message — the module is now installed for your agency

---

### Step 5: Enable E-Commerce on Your Site

1. Go back to your site: **Sites** (sidebar) → click on your site (e.g. "Demo Shop")
2. In the site sidebar, look for **Modules** and activate E-Commerce for this site
3. Once enabled, you'll see a new **E-Commerce** section appear in the site sidebar with sub-items:
   - Products, Orders, Customers, Categories, Quotes, Settings, etc.

> **What happens automatically:** The system creates all your shop pages (`/shop`, `/cart`, `/checkout`, `/order-confirmation`, product detail pages, category pages, and `/quotes`). A "Shop" link is added to your site navigation.

---

### Step 6: Add Products

1. Click **Products** in the E-Commerce sidebar section
2. Click **"+ Add Product"** (top right)
3. Fill in the product:
   - **Product Name** — e.g. "Premium T-Shirt"
   - **Price** — e.g. `250` (this is in ZMW — Zambian Kwacha)
   - **Description** — add a short description
   - **Status** — set to **"Active"** (important! Draft products won't show on the shop)
   - Upload a **product image** if you have one (optional but makes it look better)
4. Click **Create Product**
5. **Repeat** to add 2-3 more products so the shop looks populated:
   - e.g. "Running Shoes" at K450
   - e.g. "Leather Wallet" at K180
   - e.g. "Sunglasses" at K320

> **Tip:** Mark at least one product as **"Featured"** using the toggle — it'll appear in the featured section on the shop page.

---

### Step 7: (Optional) Create Product Categories

1. Click **Categories** in the E-Commerce sidebar
2. Click **"+ Add Category"**
3. Create a few categories:
   - e.g. "Clothing", "Accessories", "Footwear"
4. Go back to your products and assign them to categories

---

### Step 8: (Optional) Try the AI Website Designer

If you want AI to style your entire site automatically:

1. In the site sidebar, click **AI Designer** (or go to `/dashboard/sites/YOUR-SITE-ID/ai-designer`)
2. Describe what kind of website you want (e.g. "A modern e-commerce store selling fashion items with dark theme and elegant design")
3. Click **Generate** and wait for AI to create your pages
4. Review the generated pages and click **Save** to apply them

> The AI Designer will automatically create styled versions of all your pages including the shop, product pages, cart, checkout, etc.

---

### Step 9: Visit Your Live Storefront

1. Open a **new browser tab** (or incognito window)
2. Go to: **https://YOUR-SUBDOMAIN.sites.dramacagency.com**
   - Replace `YOUR-SUBDOMAIN` with the subdomain you chose in Step 3 (e.g. `demo-shop`)
3. You should see your live shop with:
   - A hero section with a search bar
   - Featured/bestselling products
   - Categories section
   - Full product catalog with filters and sorting
   - A "Shop" link in the navigation

> **This is what your customers will see!** Browse around, click on products, try the search and filters.

---

## PART 2: Testing the Customer Shopping Experience

> For this part, use a **different browser** or an **incognito/private window** so you're not logged into the agency dashboard.

### Step 10: Browse the Shop

1. Go to **https://YOUR-SUBDOMAIN.sites.dramacagency.com/shop**
2. Verify you can see:
   - [ ] All your active products with images and prices
   - [ ] Product cards are clickable
   - [ ] Filters and sorting work (if using the full catalog)
   - [ ] Search works

### Step 11: View a Product

1. Click on any product card
2. You should land on the product detail page (e.g. `/products/premium-t-shirt`)
3. Verify you can see:
   - [ ] Product images
   - [ ] Product name and price (in K — Kwacha)
   - [ ] Description
   - [ ] **"Add to Cart"** button
   - [ ] Quantity selector (+ and - buttons)

### Step 12: Add to Cart & Checkout (Normal Purchase Mode)

1. Click **"Add to Cart"** on a product
2. You should see a cart notification or the cart icon updating
3. Click the **cart icon** in the header (or go to `/cart`)
4. Verify the cart page shows:
   - [ ] The product you added with correct name and price
   - [ ] Quantity (you can adjust it)
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

> **Check your agency dashboard** — go back to your agency browser tab, click **Orders** in the E-Commerce sidebar. You should see the new order!

---

## PART 3: Testing Quotation Mode (B2B Flow)

> This tests the quote-instead-of-purchase flow. Do this after testing normal shopping.

### Step 13: Enable Quotation Mode

1. Go back to your **agency dashboard** browser (logged in as agency owner)
2. Navigate to your site's **E-Commerce → Settings**
3. Click the **"Quotes"** tab (or the Settings sub-section for quotes)
4. Find the big **"Quotation Mode"** toggle and **turn it ON**
5. You'll see options appear:
   - **Button Label** — leave as "Request a Quote" or change it
   - **Hide Prices** — toggle ON if you want to test price hiding
6. The settings save automatically

### Step 14: Test the Customer's Quote Experience

1. Go back to your **customer browser** (incognito/private window)
2. **Refresh** the shop page: **https://YOUR-SUBDOMAIN.sites.dramacagency.com/shop**
3. Verify the changes:
   - [ ] "Add to Cart" buttons now say **"Request a Quote"** (or your custom label)
   - [ ] If you turned on "Hide Prices" — prices should be hidden
   - [ ] Cart icon in header should be gone (cart is disabled in quotation mode)
4. Click **"Request a Quote"** on any product
5. You'll be redirected to the **Quote Request page** (`/quotes`)
6. The product you clicked should be pre-loaded in the quote builder
7. Fill in the quote request form:
   - **Your Name** — e.g. "Quote Customer"
   - **Your Email** — use a real email (you'll receive quote notifications here)
   - **Message/Notes** — e.g. "I'd like a bulk order of 50 units"
8. Submit the quote request

### Step 15: Check That Notifications Fired

1. **Agency Owner Dashboard:**
   - Click the **bell icon** (notifications) at the top of the dashboard
   - You should see an **in-app notification** about the new quote request
   - Check the **email inbox** for your agency owner account — you should receive a "New Quote Request" email

2. **Customer Email:**
   - Check the email inbox for the email you used in the quote form
   - You should receive a **confirmation email** saying "Your quote request has been received"

### Step 16: Process the Quote (as Agency Owner)

1. In the agency dashboard, go to **E-Commerce → Quotes**
2. You should see the new quote with status **"Pending"**
3. Click on the quote to view details
4. Review the quote items and customer info
5. Click **"Send Quote"** to send a formal quote to the customer
   - The customer will receive an email with a link to view the quote
6. Check the customer's email — they should receive the quote email with a **View Quote** link

### Step 17: Accept or Reject the Quote (as Customer)

1. In the customer email, click the **View Quote** link
   - This opens a page like: `https://app.dramacagency.com/quote/SOME-TOKEN`
2. The customer can see:
   - [ ] Quote number and details
   - [ ] All line items and pricing
   - [ ] **"Accept Quote"** and **"Reject Quote"** buttons
3. **Test Accept:** Click "Accept Quote"
   - Enter your name and signature
   - Click confirm
   - Both parties should get notifications (in-app for owner + emails for both)
4. **(OR) Test Reject:** Click "Reject Quote"
   - Enter a reason (optional)
   - Click confirm
   - The agency owner gets a notification about the rejection

### Step 18: Turn Off Quotation Mode

1. Go back to **E-Commerce → Settings → Quotes**
2. Turn **OFF** the "Quotation Mode" toggle
3. Refresh the storefront — "Add to Cart" buttons should be back to normal

---

## PART 4: Client Portal (Agency's Client Access)

> This tests whether the client you created can log in and see their site.

### Step 19: Enable Client Portal Access

1. In your agency dashboard, go to **Clients** (sidebar)
2. Click on the client you created (e.g. "Demo Store Client")
3. Look for **Portal Access** settings
4. Make sure **"Has Portal Access"** is enabled
5. Set permissions:
   - Can Edit Content: ON or OFF (your choice)
   - Can View Analytics: ON
   - Can View Invoices: ON

### Step 20: Client Logs Into Portal

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

### Agency Owner

- [ ] Signup and onboarding completed smoothly
- [ ] Dashboard is accessible at `/dashboard`
- [ ] Created a client successfully
- [ ] Created a site with a subdomain
- [ ] Installed the E-Commerce module
- [ ] Added products (with prices, images, descriptions)
- [ ] Products show as "Active" status
- [ ] Storefront is accessible at the subdomain URL

### Storefront (Customer View)

- [ ] Shop page loads with products
- [ ] Product cards are clickable and navigate to product detail
- [ ] Product detail page shows all info correctly
- [ ] "Add to Cart" works — cart icon updates
- [ ] Cart page shows correct items and totals
- [ ] Checkout form works and order is placed
- [ ] Order confirmation page appears
- [ ] Order shows up in agency dashboard

### Quotation Mode

- [ ] Toggling quotation mode changes all "Add to Cart" to "Request a Quote"
- [ ] "Hide Prices" works (if enabled)
- [ ] Cart icon disappears in quotation mode
- [ ] Clicking "Request a Quote" goes to quote page with product pre-loaded
- [ ] Quote submission works
- [ ] Agency owner gets in-app notification (bell icon)
- [ ] Agency owner gets email notification
- [ ] Customer gets confirmation email
- [ ] Quote appears in E-Commerce → Quotes
- [ ] "Send Quote" sends email to customer with a link
- [ ] Customer can view, accept, or reject the quote via the email link
- [ ] Accept/reject triggers proper notifications

### Branding & Responsiveness

- [ ] Colors on the storefront match the site's brand (not random hardcoded colors)
- [ ] Shop page looks good on mobile (try resizing browser or use phone)
- [ ] Product cards are responsive (stack on mobile, grid on desktop)
- [ ] Checkout form is readable on mobile

---

## Troubleshooting

| Problem                                    | What to Check                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Shop page is blank                         | Make sure E-Commerce module is installed AND enabled on the site                                    |
| No products showing                        | Make sure products are set to **"Active"** status (not Draft)                                       |
| Can't access storefront                    | Check the subdomain URL is correct: `https://YOUR-SUBDOMAIN.sites.dramacagency.com`                 |
| No emails arriving                         | Check spam/junk folder. Emails come from `noreply@app.dramacagency.com`                             |
| "Add to Cart" instead of "Request a Quote" | Refresh the page — quotation mode settings may take a moment to propagate                           |
| Quote page doesn't load the product        | Make sure you clicked "Request a Quote" on a specific product (not navigated directly to `/quotes`) |
| Client can't log into portal               | Make sure "Has Portal Access" is enabled in the client's settings                                   |
| Order not in dashboard                     | Check the correct site is selected in the sidebar                                                   |
