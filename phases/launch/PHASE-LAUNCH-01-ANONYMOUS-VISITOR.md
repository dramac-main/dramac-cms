# PHASE LAUNCH-01: Anonymous Visitor & Published Sites E2E

**User Journeys Covered**: 2.1 (Browse Website), 2.2 (Make Booking), 2.3 (Shop & Checkout), 2.4 (Submit Form), 2.5 (View Public Quote), 2.6 (Read Blog)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Shares public-facing components with LAUNCH-08 (Booking) and LAUNCH-09 (E-Commerce)

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md (Auth Client Pattern section)
memory-bank/techContext.md (Environment Variables section)
docs/USER-JOURNEYS.md (Section 2 — Anonymous Visitor)
```

---

## Context

Anonymous visitors access published client sites via:
- Subdomain: `{subdomain}.sites.dramacagency.com`
- Custom domain: `www.clientbusiness.com`
- Embed widgets: `/embed/booking/[siteId]`
- Direct blog: `/blog/[subdomain]/[slug]`

All data is fetched via `createAdminClient()` (service-role, bypasses RLS) because visitors have no auth cookies.

---

## Task 1: Published Site Rendering Verification

### Files to Audit
- `src/app/site/[domain]/[[...slug]]/page.tsx`
- `src/app/site/[domain]/layout.tsx`
- `src/proxy.ts`
- `src/middleware.ts`
- `src/lib/studio/engine/renderer.tsx`

### Requirements
1. **Verify subdomain routing works**: `middleware.ts` detects `*.sites.dramacagency.com` and rewrites to `/site/[domain]/[[...slug]]`
2. **Verify custom domain routing works**: `proxy.ts` looks up custom domains in `site_domains` table
3. **Verify page data loading**: The `page.tsx` fetches site data and page content using `createAdminClient()`
4. **Verify StudioRenderer**: All studio components render correctly in forced light mode
5. **Verify static assets**: `assetPrefix` in `next.config.ts` serves `_next/static` from `app.dramacagency.com`
6. **Verify SEO**: Meta tags, Open Graph, and canonical URLs render correctly from site/page data
7. **Verify navigation**: Header/footer links resolve correctly between pages

### What to Fix
- If `page.tsx` uses `createClient()` instead of `createAdminClient()` — change it
- If any page data query returns mock/demo data — replace with real DB query
- If meta tags have hardcoded values — pull from `sites` and `pages` table data
- If 404 page doesn't show properly for non-existent slugs — add proper not-found handling
- Ensure `robots.txt` and `sitemap.xml` routes serve real data from `sites` and `pages` tables

### Verification
```
□ Visit a subdomain URL → Homepage renders with correct content
□ Navigate to inner pages → Pages render with correct studio content
□ Visit a non-existent page → 404 page shows
□ Check page source → Meta tags, OG tags present
□ Check /sitemap.xml → Real pages listed
□ Check /robots.txt → Correct directives
```

---

## Task 2: Blog System E2E

### Files to Audit
- `src/app/blog/[subdomain]/page.tsx` — Blog listing
- `src/app/blog/[subdomain]/[slug]/page.tsx` — Blog post detail
- Blog-related API routes and server actions

### Requirements
1. **Blog listing page**: Fetches published posts from `blog_posts` table for the site, using `createAdminClient()`
2. **Blog post page**: Fetches single post by slug, renders TipTap content
3. **Category filtering**: Categories fetched from `blog_categories` table
4. **Post metadata**: Shows author, published date, reading time, featured image
5. **SEO per post**: Meta title, description, OG image from post data (not hardcoded)
6. **Pagination**: Works with real data counts
7. **Related posts**: Shows actual related posts from same category

### What to Fix
- If blog uses `createClient()` — change to `createAdminClient()`
- If posts show mock/placeholder content — query real DB
- If category filter doesn't work — wire to real `blog_categories` table
- If reading time is fake — calculate from actual post content length
- If pagination uses hardcoded page counts — use real `count` from Supabase
- Ensure empty state shows "No posts yet" instead of demo posts

### Verification
```
□ Visit /blog/[subdomain] → Shows real published posts (or empty state)
□ Click a post → Full content renders
□ Filter by category → Correct posts shown
□ Check SEO tags on post → Real title, description, OG
□ Pagination works with >10 posts
□ Empty blog → Shows "No posts yet" message
```

---

## Task 3: Form Submission E2E

### Files to Audit
- `src/app/api/forms/submit/route.ts`
- `src/lib/forms/notification-service.ts`
- `src/lib/email/send-email.ts`
- Form-related studio components

### Requirements
1. **Form submission API**: `POST /api/forms/submit` saves to `form_submissions` table using `createAdminClient()`
2. **Email notification**: Owner receives email via `sendEmail()` with `form_submission_owner` template
3. **Form validation**: Required fields validated server-side
4. **Success feedback**: Returns success response to client
5. **Spam protection**: Basic protection (honeypot field or rate limiting)
6. **Form data storage**: All submitted fields stored as JSON in submission record

### What to Fix
- If submission uses `createClient()` — change to `createAdminClient()`
- If email notification is stubbed — wire to real `sendEmail()`
- If form data isn't stored — ensure JSON is saved to `form_submissions`
- If no rate limiting exists — add basic IP-based rate limiting

### Verification
```
□ Submit a form on published site → Data saved to DB
□ Site owner receives email notification
□ Form validation works (required fields)
□ Success message shows after submission
□ Submission appears in dashboard /submissions page
```

---

## Task 4: Public Quote Page E2E

### Files to Audit
- `src/app/quote/[token]/page.tsx`
- `src/app/quote/[token]/loading.tsx`
- Quote-related server actions and types
- `src/modules/ecommerce/components/portal/quote-accept-form.tsx`

### Requirements
1. **Quote page loads**: Fetches quote data by token using `createAdminClient()`
2. **Quote display**: Shows line items, pricing, tax, total — all with `formatCurrency()` from locale-config
3. **Accept/Decline**: Client can accept or decline quote
4. **Signature**: Accept form captures client signature
5. **Email notifications**: Quote acceptance/rejection triggers email to owner
6. **Expired quotes**: Shows expiry message for expired quotes
7. **Loading state**: Clean loading (no "Loading preview..." text)

### What to Fix
- If quote pricing shows `$` — change to `formatCurrency()` from locale-config
- If accept/decline doesn't save — wire to real server action
- If email on accept/reject is stubbed — wire to `sendEmail()` with `quote_accepted_owner`/`quote_rejected_owner`
- If expired quote doesn't show message — add expiry check

### Verification
```
□ Open /quote/[validToken] → Quote details render with correct pricing
□ Pricing shows in ZMW (K) not USD ($)
□ Accept quote → Status updates in DB + owner email sent
□ Decline quote → Status updates in DB + owner email sent
□ Expired quote → Shows "Quote expired" message
□ Invalid token → Shows error page
```

---

## Task 5: Booking Widget on Published Site

### Files to Audit
- `src/modules/booking/studio/components/ServiceSelectorBlock.tsx`
- `src/modules/booking/studio/components/StaffGridBlock.tsx`
- `src/modules/booking/studio/components/BookingCalendarBlock.tsx`
- `src/modules/booking/studio/components/BookingFormBlock.tsx`
- `src/modules/booking/actions/public-booking-actions.ts`
- `src/modules/booking/hooks/useBookingServices.ts`
- `src/modules/booking/hooks/useBookingStaff.ts`
- `src/modules/booking/hooks/useBookingSlots.ts`
- `src/modules/booking/hooks/useCreateBooking.ts`
- `src/app/embed/booking/[siteId]/page.tsx`

### Requirements
1. **Service selection**: `getPublicServices()` returns real services from DB
2. **Staff selection**: `getPublicStaff()` returns real staff from DB
3. **Calendar/slots**: `getPublicAvailableSlots()` returns real availability
4. **Booking form**: Collects name, email, phone, notes
5. **Booking creation**: `createPublicAppointment()` saves to `mod_booking_appointments` table
6. **Confirmation**: Shows "Confirmed" or "Submitted" based on `require_confirmation` setting
7. **Notifications**: Triggers `notifyNewBooking()` → in-app + emails to owner and customer
8. **Embed page**: `/embed/booking/[siteId]` works with `createAdminClient()`
9. **Demo data**: ONLY when `!siteId` (Studio editor preview), NEVER on published sites

### What to Fix
- If any booking hook uses `createClient()` — it should import from `public-booking-actions.ts`
- If demo data shows on published sites — check `siteId` guard
- If notification not triggered — ensure `notifyNewBooking()` is called after appointment creation
- If embed page uses wrong auth client — fix to `createAdminClient()`

### Verification
```
□ Booking widget on published site → Shows real services
□ Select service → Shows real staff
□ Select date → Shows real available slots
□ Fill form and submit → Booking saved to DB
□ Owner receives in-app notification + email
□ Customer receives confirmation email
□ /embed/booking/[siteId] → Works same as on-site widget
□ Studio preview (no siteId) → Shows demo data
```

---

## Task 6: E-Commerce Storefront on Published Site

### Files to Audit
- `src/modules/ecommerce/studio/components/product-grid-block.tsx`
- `src/modules/ecommerce/studio/components/product-card-block.tsx`
- `src/modules/ecommerce/hooks/useStorefrontProducts.ts`
- `src/modules/ecommerce/hooks/useStorefrontCart.ts`
- `src/modules/ecommerce/hooks/useStorefrontSearch.ts`
- `src/modules/ecommerce/hooks/useStorefrontWishlist.ts`
- `src/modules/ecommerce/actions/public-ecommerce-actions.ts`
- `src/app/api/modules/ecommerce/checkout/route.ts`
- `src/app/api/webhooks/payment/route.ts` (if exists, or check under specific providers)

### Requirements
1. **Product listing**: `getPublicProducts()` returns real products from DB
2. **Product detail**: `getPublicProductBySlug()` returns real product data
3. **Category filtering**: Real categories from DB
4. **Search**: `useStorefrontSearch` works with real data
5. **Cart**: `addToPublicCart()`, `getPublicCart()`, `updatePublicCartItem()` work with admin client
6. **Checkout**: Collects shipping/billing info, processes payment
7. **Payment providers**: Paddle, Flutterwave, Pesapal, DPO Pay, Manual — all webhook-safe
8. **Order creation**: `createPublicOrderFromCart()` saves order to DB
9. **Notifications**: `notifyNewOrder()` → in-app + emails
10. **Pricing**: All in `formatCurrency()` from locale-config (ZMW)
11. **Demo data**: ONLY when `!siteId` (Studio editor), NEVER on published sites

### What to Fix
- If any storefront hook uses `createClient()` — should use `public-ecommerce-actions.ts`
- If product prices show `$` — change to `formatCurrency()`
- If checkout route uses `createClient()` — change to `createAdminClient()`
- If payment webhooks use `createClient()` — change to `createAdminClient()`
- If demo products show on live store — check `siteId` guard
- If discount code validation is mocked — wire to real DB

### Verification
```
□ Product grid on published site → Shows real products
□ Product prices in ZMW (K) format
□ Search works → Returns matching products
□ Add to cart → Cart updates correctly
□ Discount code → Validates against real discount records
□ Checkout → Payment flow works
□ Order created → Saved to DB
□ Owner receives order notification + email
□ Customer receives order confirmation email
□ Empty store → Shows "No products yet"
```

---

## Task 7: Published Site Performance & Polish

### Requirements
1. **Loading states**: No visible "Loading..." text, spinners use `text-muted-foreground`
2. **Light mode forced**: All published content renders in light mode (no dark mode bleed)
3. **Responsive**: All components render properly on mobile, tablet, desktop
4. **Error boundaries**: Broken components don't crash entire page
5. **Favicon**: Uses site's custom favicon if set
6. **Custom fonts**: If site has custom fonts, they load properly
7. **Page transitions**: Smooth navigation between pages
8. **Images**: Proper alt text, lazy loading, responsive sizes

### Verification
```
□ No "Loading..." text visible on published site
□ All content in light mode
□ Mobile view works correctly
□ Tablet view works correctly
□ Desktop view works correctly
□ Broken component → Shows fallback, not crash
□ Custom favicon displays
□ Images load with proper sizing
```

---

## Summary: Files to Create/Modify

### New Files (if needed)
- None expected — this phase is mostly audit and fix

### Files to Modify (potential)
- `src/app/site/[domain]/[[...slug]]/page.tsx` — Ensure admin client, real data
- `src/app/blog/[subdomain]/page.tsx` — Ensure admin client, real data
- `src/app/blog/[subdomain]/[slug]/page.tsx` — Ensure admin client, SEO
- `src/app/api/forms/submit/route.ts` — Ensure admin client, email
- `src/app/quote/[token]/page.tsx` — Currency, accept/decline
- Booking studio components — siteId guards
- Ecommerce studio components — siteId guards
- `src/app/embed/booking/[siteId]/page.tsx` — Admin client

### Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 7 tasks verified
□ No mock/demo data on published sites
□ All currency in ZMW format
□ All dates in Africa/Lusaka timezone
□ All notifications trigger correctly
□ Empty states show correctly
```
