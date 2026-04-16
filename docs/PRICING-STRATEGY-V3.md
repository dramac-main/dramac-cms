# DRAMAC CMS — Complete Pricing Strategy v3

## Table of Contents

1. [Platform Cost Analysis](#1-platform-cost-analysis)
2. [Per-Agency Variable Costs](#2-per-agency-variable-costs)
3. [Paddle Transaction Fee Impact](#3-paddle-transaction-fee-impact)
4. [Proposed Pricing Tiers](#4-proposed-pricing-tiers)
5. [Profit Projections](#5-profit-projections)
6. [Agency→Client Billing](#6-agencyclient-billing)
7. [Chiko AI Business Assistant](#7-chiko-ai-business-assistant)
8. [Key Design Decisions](#8-key-design-decisions)

---

## 1. Platform Cost Analysis

### What DRAMAC pays monthly to stay alive (fixed infrastructure):

| Service                | Plan             | Monthly Cost | What It Provides                                                                              |
| ---------------------- | ---------------- | ------------ | --------------------------------------------------------------------------------------------- |
| **Supabase**           | Pro              | **$25/mo**   | PostgreSQL DB (8GB disk), 100K MAU, 250GB egress, 100GB storage, email support, daily backups |
| **Vercel**             | Pro              | **$20/mo**   | Hosting, 1M edge requests, 100GB data transfer, 4hr active CPU, unlimited deploys, CI/CD      |
| **Resend**             | Free→Pro         | **$0–20/mo** | Free: 3K emails/mo (100/day limit). Pro $20: 50K emails/mo, no daily limit                    |
| **Cloudflare**         | Free             | **$0/mo**    | DNS management for custom domains — unlimited zones on free tier                              |
| **ResellerClub**       | Reseller Account | **$0/mo**    | No monthly fee — wholesale domain/email pricing, pay per purchase                             |
| **Google OAuth**       | Free             | **$0/mo**    | Social login for storefront customers                                                         |
| **TOTAL (Starting)**   |                  | **$45/mo**   | Using Resend free tier                                                                        |
| **TOTAL (Production)** |                  | **$65/mo**   | Using Resend Pro for reliable email delivery                                                  |

### When infrastructure scales with growth:

| Milestone     | Change Needed                         | New Cost              |
| ------------- | ------------------------------------- | --------------------- |
| 50+ agencies  | Supabase Medium compute ($60/mo)      | **$100/mo** total     |
| 100+ agencies | Resend Scale ($90/mo) for 100K emails | **$170/mo** total     |
| 250+ agencies | Supabase Large compute ($110/mo)      | **$220/mo** total     |
| 500+ agencies | Multiple Vercel seats, dedicated IPs  | **$350–500/mo** total |

---

## 2. Per-Agency Variable Costs

### AI Actions (the biggest variable cost)

DRAMAC uses **Claude Haiku 4.5** for AI actions (fastest, cheapest model):

| Component     | Cost                     |
| ------------- | ------------------------ |
| Input tokens  | $1.00 per million tokens |
| Output tokens | $5.00 per million tokens |

**Typical AI action** (content generation, business query, data analysis):

- Average input: ~800 tokens (prompt + context)
- Average output: ~400 tokens (response)
- **Cost per action: $0.003** (₈⁄₁₀ of a cent input + ²⁄₁₀ of a cent output)

| Plan Usage      | Actions/Month | AI Cost/Month |
| --------------- | ------------- | ------------- |
| Light (Starter) | 250           | **$0.75**     |
| Medium (Growth) | 1,000         | **$3.00**     |
| Heavy (Agency)  | 5,000         | **$15.00**    |

### Transactional Emails (Resend)

System emails per agency (password resets, notifications, invoice emails, dunning):

| Usage Level | Emails/Month | Cost per Email       | Monthly    |
| ----------- | ------------ | -------------------- | ---------- |
| Light       | 100          | ~$0.0004 (free tier) | **~$0.04** |
| Medium      | 500          | ~$0.0004             | **~$0.20** |
| Heavy       | 2,000        | ~$0.0004             | **~$0.80** |

### Database & Storage

- Each agency's data (CRM records, bookings, invoices, products): **~10-50MB** per agency
- File uploads (product images, documents): Included in Supabase storage quota
- Cost is amortized across all agencies — negligible per agency until 100+ agencies

### Total Variable Cost Per Agency:

| Agency Type     | AI     | Email | Storage | **Total Variable** |
| --------------- | ------ | ----- | ------- | ------------------ |
| Light (Starter) | $0.75  | $0.04 | $0.01   | **~$0.80/mo**      |
| Medium (Growth) | $3.00  | $0.20 | $0.05   | **~$3.25/mo**      |
| Heavy (Agency)  | $15.00 | $0.80 | $0.20   | **~$16.00/mo**     |

---

## 3. Paddle Transaction Fee Impact

Paddle charges **5% + $0.50 per checkout transaction**. This is critical for pricing low-cost plans:

| Plan Price | Paddle Fee | % Lost | You Keep |
| ---------- | ---------- | ------ | -------- |
| $9/mo      | $0.95      | 10.6%  | $8.05    |
| $15/mo     | $1.25      | 8.3%   | $13.75   |
| $19/mo     | $1.45      | 7.6%   | $17.55   |
| $29/mo     | $1.95      | 6.7%   | $27.05   |
| $39/mo     | $2.45      | 6.3%   | $36.55   |
| $49/mo     | $2.95      | 6.0%   | $46.05   |
| $69/mo     | $3.95      | 5.7%   | $65.05   |
| $79/mo     | $4.45      | 5.6%   | $74.55   |
| $99/mo     | $5.45      | 5.5%   | $93.55   |

**Key insight:** Plans under $15/mo lose 8%+ to Paddle. The $0.50 fixed fee punishes low prices disproportionately.

**Annual billing reduces this dramatically** (one transaction instead of 12):

| Annual Price           | Paddle Fee | % Lost | You Keep | vs Monthly Total           |
| ---------------------- | ---------- | ------ | -------- | -------------------------- |
| $90/yr ($9/mo equiv)   | $5.00      | 5.6%   | $85.00   | vs $96.60 from 12×monthly  |
| $290/yr ($29/mo equiv) | $15.00     | 5.2%   | $275.00  | vs $324.60 from 12×monthly |
| $690/yr ($69/mo equiv) | $35.00     | 5.1%   | $655.00  | vs $780.60 from 12×monthly |

---

## 4. Proposed Pricing Tiers

### Design Rules (from your feedback):

1. ✅ **All 7 modules on every plan** — CRM, Booking, E-Commerce, Live Chat, Social Media, Marketing, Invoicing
2. ✅ **Everything accessible** — differentiated by **numerical limits only**
3. ✅ **Sites and clients logically linked** — since `sites.client_id IS NOT NULL`, every site requires a client. Clients (CRM records) are unlimited; sites are the limited resource
4. ✅ **White-label is the only binary gate** (Agency plan only)
5. ✅ **Free trial on middle tier** — 14 days on Growth
6. ✅ **Zambia-affordable**

### Tier Structure:

| Feature                     | **Starter**                 | **Growth** ⭐               | **Agency**                  |
| --------------------------- | --------------------------- | --------------------------- | --------------------------- |
| **Monthly Price**           | **$9/mo**                   | **$29/mo**                  | **$69/mo**                  |
| **Annual Price**            | **$90/yr** (save $18)       | **$290/yr** (save $58)      | **$690/yr** (save $138)     |
|                             |                             | **14-day free trial**       |                             |
| **Websites**                | 3                           | 10                          | 25                          |
| **Clients** (CRM records)   | Unlimited                   | Unlimited                   | Unlimited                   |
| **Client Portal Access**    | ✅ Every client with a site | ✅ Every client with a site | ✅ Every client with a site |
| **Team Members**            | 2                           | 5                           | 15                          |
| **Modules**                 | All 7                       | All 7                       | All 7                       |
| **AI Actions/month**        | 250                         | 1,000                       | 5,000                       |
| **Chiko AI Assistant**      | ✅ (uses AI quota)          | ✅ (uses AI quota)          | ✅ (uses AI quota)          |
| **Automation Runs/month**   | 500                         | 5,000                       | 25,000                      |
| **API Calls/month**         | 5,000                       | 50,000                      | 250,000                     |
| **File Storage**            | 1 GB                        | 5 GB                        | 25 GB                       |
| **Custom Domains**          | ✅                          | ✅                          | ✅                          |
| **E-Commerce**              | Full                        | Full                        | Full                        |
| **Booking System**          | Full                        | Full                        | Full                        |
| **Live Chat**               | Full                        | Full                        | Full                        |
| **Social Media**            | Full                        | Full                        | Full                        |
| **Marketing Tools**         | Full                        | Full                        | Full                        |
| **Invoicing**               | Full                        | Full                        | Full                        |
| **Email Support**           | Community                   | Priority                    | Priority + Live Chat        |
| **White-Label**             | ❌ DRAMAC branding          | ❌ DRAMAC branding          | ✅ **Remove all branding**  |
| **Custom Dashboard Domain** | ❌                          | ❌                          | ✅ youragency.com/dashboard |

### Why these numbers work:

**Sites:**

- Starter (3 sites): A freelancer or small agency can serve 3 clients. E-commerce sites auto-install 3-4 modules but that's fine since ALL modules are included.
- Growth (10 sites): A growing agency managing 10 different client businesses.
- Agency (25 sites): A proper agency running many client websites.

**Client Portal:**

- NOT a separate limit. Every site has an owner (client). That client automatically gets portal access. No contradiction — sites and portals are 1:1.
- Unlimited CRM client records means agencies can manage leads, contacts, prospects without limits.

**Team Members:**

- These are **agency staff** — the people who work at the agency and log into the DRAMAC dashboard.
- NOT end-clients, NOT storefront customers, NOT client portal users.
- Starter (2): Owner + one helper. Growth (5): Small team. Agency (15): Full agency.

---

## 5. Profit Projections

### Per-Agency Profit Breakdown:

|                       | Starter ($9/mo) | Growth ($29/mo) | Agency ($69/mo) |
| --------------------- | --------------- | --------------- | --------------- |
| Revenue               | $9.00           | $29.00          | $69.00          |
| Paddle fee (5%+$0.50) | -$0.95          | -$1.95          | -$3.95          |
| Variable costs        | -$0.80          | -$3.25          | -$16.00         |
| **Net per agency**    | **$7.25**       | **$23.80**      | **$49.05**      |
| **Margin**            | **80.6%**       | **82.1%**       | **71.1%**       |

### Growth Scenarios (monthly):

#### 🔹 10 Agencies (Month 1-3)

| Mix                             | Revenue | Paddle | Variable | Fixed Infra | **Net Profit** |
| ------------------------------- | ------- | ------ | -------- | ----------- | -------------- |
| 5 Starter + 3 Growth + 2 Agency | $270    | $18.60 | $38.50   | $65         | **$147.90/mo** |

#### 🔹 25 Agencies (Month 3-6)

| Mix                              | Revenue | Paddle | Variable | Fixed Infra | **Net Profit** |
| -------------------------------- | ------- | ------ | -------- | ----------- | -------------- |
| 12 Starter + 8 Growth + 5 Agency | $685    | $45.60 | $103.85  | $65         | **$470.55/mo** |

#### 🔹 50 Agencies (Month 6-12)

| Mix                                | Revenue | Paddle | Variable | Fixed Infra | **Net Profit** |
| ---------------------------------- | ------- | ------ | -------- | ----------- | -------------- |
| 25 Starter + 15 Growth + 10 Agency | $1,350  | $89.50 | $197.50  | $100        | **$963.00/mo** |

#### 🔹 100 Agencies (Year 1-2)

| Mix                                | Revenue | Paddle  | Variable | Fixed Infra | **Net Profit**   |
| ---------------------------------- | ------- | ------- | -------- | ----------- | ---------------- |
| 50 Starter + 30 Growth + 20 Agency | $2,700  | $179.00 | $395.00  | $170        | **$1,956.00/mo** |

#### 🔹 500 Agencies (Year 2-3)

| Mix                                   | Revenue | Paddle  | Variable  | Fixed Infra | **Net Profit**    |
| ------------------------------------- | ------- | ------- | --------- | ----------- | ----------------- |
| 250 Starter + 150 Growth + 100 Agency | $13,500 | $895.00 | $1,975.00 | $500        | **$10,130.00/mo** |

### Annual Billing Bonus:

If 40% of agencies choose annual billing, Paddle fees drop significantly (~30% less Paddle fees total). At 500 agencies, this saves ~$250+/month in Paddle fees alone.

---

## 6. Agency→Client Billing

### Your Question: "Can my agency (Dramac Marketing Agency) bill end clients through the platform?"

**Current State:**

- ✅ The **Invoicing module** (14 phases complete, 18 database tables) lets agencies create invoices for clients
- ✅ **Recurring invoices** can be set up — they auto-generate on schedule (monthly, quarterly, yearly)
- ✅ Invoice emails are sent automatically to clients
- ❌ **Auto-charge is NOT implemented** — clients must pay manually and upload proof of payment
- ❌ Payment providers (Flutterwave, Pesapal, DPO Pay) are wired to e-commerce storefront checkout only, not to invoice payments

**How it works TODAY:**

1. Your agency creates an invoice for a client → $500 for web design
2. Set it as recurring → auto-generates a new $500 invoice every month
3. Client receives email with invoice
4. Client pays externally (bank transfer, mobile money, cash)
5. Client uploads payment proof OR agency marks invoice as paid

**What's needed for auto-charge (future feature):**

1. Client saves a payment method (card tokenization via Flutterwave/Pesapal)
2. Charge engine runs daily, attempts payment on due invoices
3. Webhook handlers confirm payment success/failure
4. Retry logic for failed payments (dunning)
5. Estimated development: 2-3 weeks

**Recommendation:** The current manual-payment + recurring-invoice system is **perfectly fine for Zambia** where mobile money (Airtel Money, MTN Money) and bank transfers are dominant. Most African businesses are used to this workflow. Auto-charge is a future nice-to-have, not a blocker.

---

## 7. Chiko AI Business Assistant

### Your Idea: An AI assistant that "fully caters for managers and business owners"

**Feasibility: ✅ ABSOLUTELY FEASIBLE AND CHEAP**

**How it would work:**

1. User asks Chiko: "What is my profit for the month?"
2. System queries the agency's database:
   - Invoicing: total invoiced, total paid, outstanding
   - E-commerce: total sales, refunds, net revenue
   - Bookings: total bookings, cancellations, revenue
   - CRM: new clients this month, churn
3. Context (~2,000 tokens) is passed to Claude Haiku 4.5 with the question
4. Claude responds with a natural language business insight

**Cost per question:**

- Input: ~2,000 tokens context + question → 2,000/1M × $1 = $0.002
- Output: ~500 tokens response → 500/1M × $5 = $0.0025
- **Total: ~$0.005 per question** (half a cent)

**Monthly cost examples:**
| Questions/Month | Cost to DRAMAC |
|----------------|---------------|
| 50 (casual user) | $0.25 |
| 200 (daily user) | $1.00 |
| 500 (power user) | $2.50 |

**Implementation approach:**

- Chiko queries count toward the **AI actions quota** (same pool as content generation, etc.)
- A Starter user with 250 AI actions/month can ask Chiko ~250 business questions
- No additional billing complexity needed — it's just another AI action

**What Chiko could answer:**

- "What's my total revenue this month?" → Queries invoicing + e-commerce
- "How many bookings do I have next week?" → Queries booking module
- "Which client owes me the most?" → Queries outstanding invoices
- "What are my top selling products?" → Queries e-commerce orders
- "How is my marketing campaign performing?" → Queries marketing module analytics
- "Show me a summary of my live chat conversations today" → Queries live chat logs
- "Compare this month's revenue to last month" → Historical queries

**Key technical requirement:** Chiko needs read access to all module data for the requesting agency. This is already built — all module data is scoped by `agency_id`.

---

## 8. Key Design Decisions

### Why Clients Are Unlimited (Not a Limit)

Clients are just rows in a database table — they cost fractions of a cent. Limiting them creates confusion and blocks CRM usage (the most basic function). GoHighLevel also doesn't limit contacts on base plans.

### Why Client Portal Is Not a Separate Limit

The database enforces `sites.client_id IS NOT NULL` — every site has exactly one owner-client. Portal access is opt-in per client. So portal access = "your clients who have sites can log into their portal." It's automatic with each site, not an independent counter.

### Why All 7 Modules Are Included

Each module is just server-side code — zero marginal cost. Limiting modules creates confusion when niches auto-install 3-4 modules by default (e-commerce needs E-Commerce + CRM + Marketing + sometimes Invoicing). The GoHighLevel model proves that "everything included, limits on scale" works.

### Why White-Label Is Agency-Only

White-labeling is the single most valuable feature for a real agency — it lets them present DRAMAC as their own platform. This justifies the price jump from Growth ($29) to Agency ($69). It's the classic "entry → professional → premium" gate.

### Why $9 / $29 / $69 (Not Higher)

- Zambia average SME budget for digital tools: $10-30/month
- A $9 entry point makes it accessible to solo freelancers and small businesses
- $29 is the sweet spot — affordable but substantial (matches the "free trial → convert" flow)
- $69 feels achievable for an established agency making real money from client work
- For comparison: GoHighLevel is $97/$297/$497 — we're targeting Africa, not silicon valley

### Overage Pricing (When Limits Are Exceeded)

Rather than hard-blocking, agencies can continue operating with overage charges:

| Item                  | Overage Rate                   |
| --------------------- | ------------------------------ |
| Extra AI Actions      | $0.01 each ($10 per 1,000)     |
| Extra Automation Runs | $0.002 each ($2 per 1,000)     |
| Extra API Calls       | $0.0002 each ($0.20 per 1,000) |
| Extra Storage         | $0.50 per GB/month             |
| Extra Sites           | $5 per additional site/month   |

This keeps DRAMAC profitable even on heavy users and creates a natural upsell path to the next tier.

---

## Next Steps

1. **Finalize pricing numbers** — Review this document, adjust if needed
2. **Update Paddle PLAN_CONFIGS** in `src/lib/paddle/client.ts`
3. **Redesign pricing page** at `src/app/pricing/page.tsx` for 3 tiers
4. **Create Paddle products/prices** in Paddle dashboard for each tier
5. **Implement trial management** — 14-day trial on Growth plan
6. **Build change-plan UI** — Let agencies upgrade/downgrade
7. **Build Chiko AI business assistant** — Integrate with module data
8. **Test end-to-end billing flow** — Subscribe → use → overage → upgrade → cancel
