# DRAMAC CMS — Complete Pricing Strategy v4 (Final)

> **Date:** July 2026
> **Supersedes:** PRICING-STRATEGY-V3.md
> **Prices:** $19 / $49 / $99 monthly | $190 / $490 / $990 annual (2 months free)
> **Billing Provider:** Paddle (5% + $0.50 per transaction)
> **Target Market:** African agencies, freelancers, SMEs (Zambia primary)

---

## Table of Contents

1. [Fixed Infrastructure Costs](#1-fixed-infrastructure-costs)
2. [Per-Client Resource Consumption Model](#2-per-client-resource-consumption-model)
3. [Per-Agency Cost Model (Bottom Up)](#3-per-agency-cost-model-bottom-up)
4. [Paddle Transaction Fee Analysis](#4-paddle-transaction-fee-analysis)
5. [Proposed Pricing Tiers ($19 / $49 / $99)](#5-proposed-pricing-tiers)
6. [Profitability at Realistic Usage (50%)](#6-profitability-at-realistic-usage)
7. [Profitability at Maximum Usage (Worst Case)](#7-profitability-at-maximum-usage)
8. [Growth Projections (10 → 500 Agencies)](#8-growth-projections)
9. [Annual Billing Impact](#9-annual-billing-impact)
10. [Additional Revenue Streams](#10-additional-revenue-streams)
11. [Agency→Client Billing Status](#11-agencyclient-billing-status)
12. [Chiko AI Business Assistant](#12-chiko-ai-business-assistant)
13. [Key Design Decisions](#13-key-design-decisions)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Fixed Infrastructure Costs

What DRAMAC pays monthly regardless of agency count:

| Service          | Plan                | Monthly Cost | What We Get                                                                                                                 | When to Upgrade                         |
| ---------------- | ------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Supabase**     | Pro (Micro compute) | **$25**      | 8GB disk, 100K MAU, 250GB egress, 100GB storage, daily backups, 60 direct / 200 pooler connections                          | 50+ agencies → Medium ($60) for 4GB RAM |
| **Vercel**       | Pro                 | **$20**      | 1M edge requests, 100GB fast data transfer, 10GB origin transfer, 4hr active CPU, 360 GB-hr memory, 1M function invocations | 200+ agencies → minor overages          |
| **Resend**       | Pro                 | **$20**      | 50K emails/mo, no daily limit, 10 domains, 5 team members                                                                   | 80+ agencies → Scale ($90) for 100K     |
| **Cloudflare**   | Free                | **$0**       | Unlimited DNS zones, DDoS protection                                                                                        | Never                                   |
| **ResellerClub** | Reseller            | **$0**       | Wholesale domain + email pricing, pay per purchase only                                                                     | Never                                   |
| **Google OAuth** | Free                | **$0**       | Social login for storefronts                                                                                                | Never                                   |
| **Anthropic**    | Pay-as-you-go       | **$0**       | Claude Haiku 4.5 — pure variable cost                                                                                       | Never                                   |
|                  |                     | **$65/mo**   |                                                                                                                             |                                         |

### Infrastructure Scaling Table

| Agency Count | Supabase                    | Vercel               | Resend               | Other | **Total Fixed** |
| ------------ | --------------------------- | -------------------- | -------------------- | ----- | --------------- |
| **1–25**     | $25 (Micro)                 | $20                  | $20 (Pro 50K)        | $0    | **$65**         |
| **25–75**    | $60 (Medium: 4GB, 120 conn) | $20                  | $20 (Pro 50K)        | $0    | **$100**        |
| **75–150**   | $60 (Medium)                | $20                  | $90 (Scale: 100K)    | $0    | **$170**        |
| **150–300**  | $110 (Large: 8GB, 160 conn) | $25 (minor overages) | $90 (Scale)          | $0    | **$225**        |
| **300–500**  | $210 (XL: 16GB, 240 conn)   | $35                  | $90 + overages       | $0    | **$350**        |
| **500+**     | $410 (2XL: 32GB)            | $50                  | $90 + ~$180 overages | $0    | **$730**        |

---

## 2. Per-Client Resource Consumption Model

Every agency has clients. Each client can own a site. Understanding what a **single client site** costs DRAMAC is the foundation for pricing.

### 2.1 What Each Client Site Consumes

| Resource                              | Source            | Light Site (service biz) | Medium Site (booking/e-comm) | Heavy Site (active e-comm) |
| ------------------------------------- | ----------------- | ------------------------ | ---------------------------- | -------------------------- |
| **Storefront page views/mo**          | Vercel CDN        | 200–1,000                | 1,000–5,000                  | 5,000–20,000               |
| **Edge requests/mo** (5-10 per page)  | Vercel            | 1,000–5,000              | 5,000–25,000                 | 25,000–100,000             |
| **SSR function invocations/mo**       | Vercel            | 100–500                  | 500–2,500                    | 2,500–10,000               |
| **Dashboard usage** (agency managing) | Vercel + Supabase | ~50 views, ~100 API      | ~100 views, ~300 API         | ~200 views, ~500 API       |
| **Database storage**                  | Supabase          | 0.5–2 MB                 | 2–10 MB                      | 10–50 MB                   |
| **Database queries/day**              | Supabase          | 50–200                   | 200–1,000                    | 1,000–5,000                |
| **File storage** (images, docs)       | Supabase Storage  | 10–50 MB                 | 50–200 MB                    | 200–1,000 MB               |
| **Real-time connections** (live chat) | Supabase Realtime | 0–1 concurrent           | 1–3 concurrent               | 3–10 concurrent            |

### 2.2 Emails Generated Per Client Site Per Month

This is the **most critical cost driver**. Marketing campaigns dominate email volume.

| Email Type                       | Light     | Medium        | Heavy           | Source Module |
| -------------------------------- | --------- | ------------- | --------------- | ------------- |
| Auth (signup, password reset)    | 1–3       | 3–5           | 5–10            | Auth          |
| Booking confirmations/reminders  | 0         | 5–20          | 20–50           | Booking       |
| Order confirmations/shipping     | 0         | 10–50         | 50–200          | E-Commerce    |
| Invoice sent + payment reminders | 1–3       | 3–10          | 10–30           | Invoicing     |
| Chat/support notifications       | 0         | 2–5           | 5–20            | Live Chat     |
| **Subtotal transactional**       | **2–6**   | **23–90**     | **90–310**      |               |
| **Marketing campaigns** ⚠️       | 0–100     | 100–1,000     | 1,000–5,000     | Marketing     |
| **TOTAL per client site**        | **2–106** | **123–1,090** | **1,090–5,310** |               |

> **⚠️ Marketing campaigns are the #1 cost risk.** The codebase sends in batches of 50 emails with 1-second delay, with NO per-agency quota enforcement currently. A single campaign to 5,000 contacts costs DRAMAC ~$4.50 in Resend fees. Email sends MUST be a metered resource.

### 2.3 AI Actions Per Client Site Per Month

| AI Action Type                      | Light    | Medium    | Heavy      |
| ----------------------------------- | -------- | --------- | ---------- |
| Content generation (products, blog) | 0–5      | 5–20      | 20–50      |
| Chiko business queries              | 2–10     | 10–30     | 30–100     |
| Marketing copy (subjects, CTAs)     | 0–5      | 5–15      | 15–30      |
| AI website designer actions         | 0–2      | 2–5       | 5–10       |
| **TOTAL per client site**           | **2–22** | **22–70** | **70–190** |

### 2.4 Cost Per Client Site to DRAMAC

Unit costs: AI = $0.003/action, Email = $0.0009/send, Vercel/Supabase amortized

| Cost Center               | Light Client   | Medium Client   | Heavy Client      |
| ------------------------- | -------------- | --------------- | ----------------- |
| AI actions                | $0.04 (12 avg) | $0.14 (46 avg)  | $0.39 (130 avg)   |
| Email sends               | $0.05 (54 avg) | $0.55 (607 avg) | $2.88 (3,200 avg) |
| Vercel (CDN + functions)  | $0.01          | $0.03           | $0.12             |
| Supabase (DB + storage)   | $0.01          | $0.02           | $0.08             |
| **TOTAL per client site** | **$0.11**      | **$0.74**       | **$3.47**         |

---

## 3. Per-Agency Cost Model (Bottom Up)

### 3.1 Typical Agency Profile by Plan

|                               | **Starter (3 sites)** | **Growth (10 sites)**        | **Agency (30 sites)**        |
| ----------------------------- | --------------------- | ---------------------------- | ---------------------------- |
| Active sites (% of limit)     | 2–3 (80%)             | 6–8 (70%)                    | 15–20 (60%)                  |
| Realistic site mix            | 2 light + 1 medium    | 3 light + 3 medium + 2 heavy | 5 light + 8 medium + 7 heavy |
| AI actions/month (realistic)  | ~120                  | ~700                         | ~3,500                       |
| Email sends/month (realistic) | ~300                  | ~2,500                       | ~18,000                      |
| Active team members           | 1–2                   | 3–4                          | 8–12                         |
| Total DB storage              | ~5 MB                 | ~40 MB                       | ~300 MB                      |
| Total file storage            | ~100 MB               | ~800 MB                      | ~5 GB                        |

### 3.2 Variable Cost Per Agency (Realistic Usage — ~50% of limits)

| Cost Center                        | Starter   | Growth    | Agency     | Calculation             |
| ---------------------------------- | --------- | --------- | ---------- | ----------------------- |
| **AI actions**                     | $0.36     | $2.10     | $10.50     | actions × $0.003        |
| **Email sends**                    | $0.27     | $2.25     | $16.20     | sends × $0.0009         |
| **Vercel share** (CDN + functions) | $0.05     | $0.20     | $1.00      | proportional to traffic |
| **Supabase share** (DB + storage)  | $0.03     | $0.12     | $0.70      | proportional to data    |
| **File storage**                   | $0.002    | $0.017    | $0.11      | Supabase $0.021/GB      |
| **Total variable**                 | **$0.71** | **$4.69** | **$28.51** |                         |
| **Paddle fee** (5% + $0.50)        | **$1.45** | **$2.95** | **$5.45**  |                         |
| **TOTAL COST PER AGENCY**          | **$2.16** | **$7.64** | **$33.96** |                         |

### 3.3 Variable Cost Per Agency (WORST CASE — 100% limit usage)

| Cost Center               | Starter   | Growth     | Agency     | Calculation                |
| ------------------------- | --------- | ---------- | ---------- | -------------------------- |
| **AI actions**            | $1.50     | $6.00      | $30.00     | 500 / 2K / 10K × $0.003    |
| **Email sends**           | $0.90     | $4.50      | $22.50     | 1K / 5K / 25K × $0.0009    |
| **Vercel share**          | $0.10     | $0.40      | $2.00      | peak traffic               |
| **Supabase share**        | $0.05     | $0.25      | $1.50      | peak data/queries          |
| **File storage**          | $0.04     | $0.21      | $1.05      | 2 / 10 / 50 GB @ $0.021/GB |
| **Total variable**        | **$2.59** | **$11.36** | **$57.05** |                            |
| **Paddle fee**            | **$1.45** | **$2.95**  | **$5.45**  |                            |
| **TOTAL COST PER AGENCY** | **$4.04** | **$14.31** | **$62.50** |                            |

---

## 4. Paddle Transaction Fee Analysis

Paddle is a Merchant of Record — handles all taxes, compliance, chargebacks. Fee: **5% + $0.50 per checkout transaction**.

### Monthly Billing

| Plan        | Price | Paddle Fee | % Lost | Net to DRAMAC |
| ----------- | ----- | ---------- | ------ | ------------- |
| **Starter** | $19   | $1.45      | 7.6%   | $17.55        |
| **Growth**  | $49   | $2.95      | 6.0%   | $46.05        |
| **Agency**  | $99   | $5.45      | 5.5%   | $93.55        |

### Annual Billing (1 transaction vs 12)

| Plan        | Annual | Paddle Fee | % Lost | Net/year | Monthly equiv net | Paddle saved vs monthly |
| ----------- | ------ | ---------- | ------ | -------- | ----------------- | ----------------------- |
| **Starter** | $190   | $10.00     | 5.3%   | $180.00  | $15.00            | $7.40/yr ($0.62/mo)     |
| **Growth**  | $490   | $25.00     | 5.1%   | $465.00  | $38.75            | $10.40/yr ($0.87/mo)    |
| **Agency**  | $990   | $50.00     | 5.1%   | $940.00  | $78.33            | $15.40/yr ($1.28/mo)    |

Annual billing benefits both sides: customer saves 2 months, DRAMAC saves on Paddle fees.

---

## 5. Proposed Pricing Tiers

### Design Rules

1. ✅ All 7 modules on every plan — CRM, Booking, E-Commerce, Live Chat, Social Media, Marketing, Invoicing
2. ✅ Differentiated by numerical limits only (except white-label)
3. ✅ Sites and clients logically linked (`sites.client_id IS NOT NULL`)
4. ✅ White-label is the only binary gate
5. ✅ Free trial on middle tier (14 days)
6. ✅ Email sends metered (marketing campaigns are the #1 cost driver)
7. ✅ Zambia-affordable with significant margins

### Complete Plan Feature Matrix

| Feature                     | **Starter**            | **Growth** ⭐           | **Agency**              |
| --------------------------- | ---------------------- | ----------------------- | ----------------------- |
| **Monthly**                 | **$19/mo**             | **$49/mo**              | **$99/mo**              |
| **Annual**                  | **$190/yr** (save $38) | **$490/yr** (save $118) | **$990/yr** (save $198) |
| **Free Trial**              | —                      | **14 days**             | —                       |
|                             |                        |                         |                         |
| **Websites**                | 3                      | 10                      | 30                      |
| **Clients (CRM records)**   | Unlimited              | Unlimited               | Unlimited               |
| **Client Portal Access**    | ✅ (auto per site)     | ✅ (auto per site)      | ✅ (auto per site)      |
| **Team Members**            | 2                      | 5                       | 15                      |
|                             |                        |                         |                         |
| **Modules**                 | All 7                  | All 7                   | All 7                   |
| CRM                         | ✅ Full                | ✅ Full                 | ✅ Full                 |
| Booking                     | ✅ Full                | ✅ Full                 | ✅ Full                 |
| E-Commerce                  | ✅ Full                | ✅ Full                 | ✅ Full                 |
| Live Chat                   | ✅ Full                | ✅ Full                 | ✅ Full                 |
| Social Media                | ✅ Full                | ✅ Full                 | ✅ Full                 |
| Marketing                   | ✅ Full                | ✅ Full                 | ✅ Full                 |
| Invoicing                   | ✅ Full                | ✅ Full                 | ✅ Full                 |
|                             |                        |                         |                         |
| **Metered Resources**       |                        |                         |                         |
| AI Actions/month            | 500                    | 2,000                   | 10,000                  |
| Email Sends/month           | 1,000                  | 5,000                   | 25,000                  |
| Automation Runs/month       | 1,000                  | 10,000                  | 50,000                  |
| File Storage                | 2 GB                   | 10 GB                   | 50 GB                   |
|                             |                        |                         |                         |
| **Chiko AI Assistant**      | ✅ (uses AI quota)     | ✅ (uses AI quota)      | ✅ (uses AI quota)      |
| **Custom Domains**          | ✅                     | ✅                      | ✅                      |
| **AI Website Designer**     | ✅                     | ✅                      | ✅                      |
| **Automation Workflows**    | ✅                     | ✅                      | ✅                      |
|                             |                        |                         |                         |
| **Support**                 | Community              | Priority Email          | Priority + Chat         |
| **White-Label**             | ❌ DRAMAC branded      | ❌ DRAMAC branded       | ✅ Full white-label     |
| **Custom Dashboard Domain** | ❌                     | ❌                      | ✅ youragency.com       |

### Overage Pricing (Soft Limits)

Agencies keep working when they exceed limits — they pay overages instead of being blocked.

| Resource              | Overage Rate              | Our Cost      | Our Margin |
| --------------------- | ------------------------- | ------------- | ---------- |
| Extra AI Actions      | $0.01/action ($10 per 1K) | $0.003        | 70%        |
| Extra Email Sends     | $2.00 per 1K              | $0.90 per 1K  | 55%        |
| Extra Automation Runs | $2.00 per 1K              | ~$0.10 per 1K | 95%        |
| Extra File Storage    | $0.50/GB/month            | $0.021/GB     | 96%        |
| Extra Websites        | $5.00/site/month          | ~$0.74/site   | 85%        |

### Why These Specific Limits

**Websites (3 / 10 / 30):**

- Starter (3): Freelancer or solo operator with 2–3 clients
- Growth (10): Small agency with a client portfolio
- Agency (30): Full agency operation — $99/mo for 30 sites = $3.30/site = incredible value

**Email Sends (1,000 / 5,000 / 25,000):**

- THE critical limit. Marketing campaigns are the #1 cost driver
- Codebase sends in batches of 50, 1s delay, NO per-agency quota enforcement currently
- A campaign to 500 contacts = 500 sends. Starter gets ~2 campaigns/mo, Growth ~10, Agency ~50
- System/transactional emails are only ~50–100/agency/month — the limit governs marketing

**AI Actions (500 / 2,000 / 10,000):**

- Each costs DRAMAC ~$0.003 (Claude Haiku 4.5)
- Includes: Chiko queries, content generation, AI website designer
- Starter (500): ~16/day — daily Chiko + occasional content gen
- Agency (10,000): ~330/day — heavy AI content factory operations

**Team Members (2 / 5 / 15):**

- Agency staff who log into the DRAMAC dashboard
- NOT end-clients, NOT storefront customers, NOT portal users
- Negligible cost impact — just dashboard API calls

---

## 6. Profitability at Realistic Usage

Realistic = 50–60% of plan limits (SaaS industry standard).

### Per-Agency Profit (Monthly Billing)

|                            | **Starter ($19)** | **Growth ($49)** | **Agency ($99)** |
| -------------------------- | ----------------- | ---------------- | ---------------- |
| Revenue                    | $19.00            | $49.00           | $99.00           |
| Paddle fee (5% + $0.50)    | −$1.45            | −$2.95           | −$5.45           |
| Variable costs (realistic) | −$0.71            | −$4.69           | −$28.51          |
| **NET PER AGENCY**         | **$16.84**        | **$41.36**       | **$65.04**       |
| **Margin**                 | **88.6%**         | **84.4%**        | **65.7%**        |

### Per-Agency Profit (Annual Billing)

|                              | **Starter ($190/yr)** | **Growth ($490/yr)** | **Agency ($990/yr)** |
| ---------------------------- | --------------------- | -------------------- | -------------------- |
| Revenue/month (amortized)    | $15.83                | $40.83               | $82.50               |
| Paddle fee/month (amortized) | −$0.83                | −$2.08               | −$4.17               |
| Variable costs/month         | −$0.71                | −$4.69               | −$28.51              |
| **NET PER AGENCY/MO**        | **$14.29**            | **$34.06**           | **$49.82**           |
| **Margin**                   | **90.3%**             | **83.4%**            | **60.4%**            |

---

## 7. Profitability at Maximum Usage

Every agency maxes every metric simultaneously. Extremely unlikely but the safety check.

### Per-Agency Worst-Case Profit

|                        | **Starter ($19)** | **Growth ($49)** | **Agency ($99)** |
| ---------------------- | ----------------- | ---------------- | ---------------- |
| Revenue                | $19.00            | $49.00           | $99.00           |
| Paddle fee             | −$1.45            | −$2.95           | −$5.45           |
| Variable costs (MAXED) | −$2.59            | −$11.36          | −$57.05          |
| **NET PER AGENCY**     | **$14.96**        | **$34.69**       | **$36.50**       |
| **Margin**             | **78.7%**         | **70.8%**        | **36.9%**        |

**Analysis:**

- Starter maxed out: 78.7% margin — very safe
- Growth maxed out: 70.8% margin — very safe
- Agency worst case: 36.9% — acceptable because:
  - Requires ALL 30 sites to be heavy e-commerce running max campaigns simultaneously
  - Real agencies have a mix of light/medium/heavy sites
  - Heavy users generate overage charges (extra revenue not shown above)
  - This scenario affects <1% of agencies

**No plan can lose money.** Even Agency at absolute worst case still nets $36.50/month.

---

## 8. Growth Projections

Assumed plan mix: 50% Starter, 30% Growth, 20% Agency (typical SaaS distribution).

### Monthly Net Profit by Agency Count

| Agencies | Mix (S/G/A) | Revenue | Paddle Fees | Variable Costs | Fixed Infra | **NET PROFIT** | **Margin** |
| -------- | ----------- | ------- | ----------- | -------------- | ----------- | -------------- | ---------- |
| **10**   | 5/3/2       | $340    | $22.50      | $20.93         | $65         | **$231.57**    | 68.1%      |
| **25**   | 13/7/5      | $837    | $55.40      | $51.33         | $65         | **$665.27**    | 79.5%      |
| **50**   | 25/15/10    | $1,690  | $111.25     | $105.15        | $100        | **$1,373.60**  | 81.3%      |
| **100**  | 50/30/20    | $3,380  | $222.50     | $210.30        | $170        | **$2,777.20**  | 82.2%      |
| **250**  | 125/75/50   | $8,450  | $556.25     | $525.75        | $225        | **$7,143.00**  | 84.5%      |
| **500**  | 250/150/100 | $16,900 | $1,112.50   | $1,051.50      | $350        | **$14,386.00** | 85.1%      |

### Key Milestones

| Milestone               | Agencies Needed | Monthly Revenue | Monthly Profit | Annual Profit |
| ----------------------- | --------------- | --------------- | -------------- | ------------- |
| **Break even on infra** | 4               | ~$136           | ~$55           | ~$660         |
| **$500/mo profit**      | 20              | ~$676           | ~$500          | ~$6,000       |
| **$1K/mo profit**       | 38              | ~$1,282         | ~$1,000        | ~$12,000      |
| **$2.5K/mo profit**     | 88              | ~$2,975         | ~$2,500        | ~$30,000      |
| **$5K/mo profit**       | 175             | ~$5,900         | ~$5,000        | ~$60,000      |
| **$10K/mo profit**      | 350             | ~$11,800        | ~$10,000       | ~$120,000     |
| **$50K/mo profit**      | ~1,750          | ~$59,000        | ~$50,000       | ~$600,000     |

---

## 9. Annual Billing Impact

If 40% of agencies choose annual billing:

| Agencies | Revenue/mo | Paddle Savings | Adjusted Net/mo | vs All Monthly |
| -------- | ---------- | -------------- | --------------- | -------------- |
| 100      | $3,380     | +$42/mo        | **$2,819**      | +$42           |
| 250      | $8,450     | +$105/mo       | **$7,248**      | +$105          |
| 500      | $16,900    | +$210/mo       | **$14,596**     | +$210          |

Additional annual billing benefits:

- **Cash flow upfront** — collect a full year immediately
- **Lower churn** — committed customers are stickier
- **Predictable revenue** for growth planning

---

## 10. Additional Revenue Streams

### 10.1 Domain Sales (ResellerClub, 30% Markup)

| Domain | Wholesale | Retail (30% markup) | Profit/sale |
| ------ | --------- | ------------------- | ----------- |
| .com   | ~$8.00    | ~$10.40             | $2.40       |
| .co.zm | ~$15.00   | ~$19.50             | $4.50       |
| .net   | ~$10.00   | ~$13.00             | $3.00       |

At 500 agencies, 30% buying 1 domain/yr: 150 × $3.00 avg = **$450/yr** bonus.

### 10.2 Email Hosting (Titan Mail)

ResellerClub wholesale: ~$0.60/mailbox/month. Sell at $2/mailbox:

- 50 agencies × 3 mailboxes = 150 × $1.40 = **$210/mo** bonus

### 10.3 Overage Revenue

- 10% agencies exceed AI by 500 actions: 50 × $5 = **$250/mo**
- 5% exceed email by 2K sends: 25 × $4 = **$100/mo**

### 10.4 Extra Site Add-ons

- 15% Growth agencies buy 1 extra site: 45 × $5 = **$225/mo**

**Total additional at 500 agencies: ~$800–1,500/month** beyond subscriptions.

---

## 11. Agency→Client Billing Status

### Current Capabilities

| Capability                  | Status       | Notes                                      |
| --------------------------- | ------------ | ------------------------------------------ |
| Create invoices for clients | ✅ Built     | Invoicing module (14 phases, 18 tables)    |
| Recurring invoices          | ✅ Built     | Auto-generates on schedule                 |
| Invoice email delivery      | ✅ Built     | Sent via Resend                            |
| Client manual payment       | ✅ Built     | Upload proof of payment                    |
| Auto-charge client card     | ❌ Not built | Payment providers wired to e-commerce only |

### Current Flow

```
Agency creates invoice → Set recurring → Auto-generates monthly →
Email sent to client → Client pays externally → Uploads proof / agency marks paid
```

### Zambia Market Assessment

The manual payment + recurring invoice system is **appropriate for Zambia**:

- Mobile money (Airtel Money, MTN, Zamtel Kwacha) is dominant
- Bank transfers are standard for B2B
- Auto-charge cards are less common in the region
- Most African SMEs use this workflow already

Auto-charge is a future feature (needs tokenization + charge engine — ~2-3 weeks dev), not a launch blocker.

---

## 12. Chiko AI Business Assistant

### Cost: ~$0.005 Per Question (Half a Cent)

| Component              | Detail                                     |
| ---------------------- | ------------------------------------------ |
| **Model**              | Claude Haiku 4.5 (fastest, cheapest)       |
| **Input cost**         | ~2,000 tokens × $1/MTok = $0.002           |
| **Output cost**        | ~500 tokens × $5/MTok = $0.0025            |
| **Total per question** | **~$0.005**                                |
| **Billing**            | Counts toward AI actions quota (same pool) |

### What Chiko Can Query

| Question                             | Data Source             | Example Response                                                                                        |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| "What's my revenue this month?"      | Invoicing + E-Commerce  | "Total: K12,500. Invoicing K8,000 (K6,500 paid, K1,500 outstanding). E-commerce K4,500 from 23 orders." |
| "Which client owes me the most?"     | Invoicing (outstanding) | "Zambia Mining Corp owes K3,200 across 2 overdue invoices."                                             |
| "How many bookings next week?"       | Booking                 | "7 bookings. Tuesday is busiest with 3."                                                                |
| "Top selling products?"              | E-Commerce orders       | "Top 3: Mining Helmets (45), High-Vis Vests (38), Steel-Toe Boots (22)"                                 |
| "Compare this month to last"         | All modules             | "Revenue up 15%. Bookings down 8%. 4 new clients, 0 churned."                                           |
| "Show me today's chat conversations" | Live Chat               | "12 conversations. 10 resolved, 2 waiting. Avg response: 3 min."                                        |

### Cost at Scale

| Usage           | Questions/Agency/Mo | Cost/Agency | At 500 agencies |
| --------------- | ------------------- | ----------- | --------------- |
| Casual (weekly) | 20                  | $0.10       | $50/mo          |
| Regular (daily) | 100                 | $0.50       | $250/mo         |
| Power user      | 300                 | $1.50       | $750/mo         |

Already included in AI action cost calculations — no separate infrastructure needed.

---

## 13. Key Design Decisions

### Why $19 / $49 / $99

| Factor                | Starter $19                   | Growth $49                        | Agency $99                            |
| --------------------- | ----------------------------- | --------------------------------- | ------------------------------------- |
| **Zambia context**    | Accessible to any SME (~K500) | Sweet spot for growing businesses | Real agency making money from clients |
| **Paddle efficiency** | 7.6% fee — acceptable         | 6.0% — efficient                  | 5.5% — optimal                        |
| **Jump ratio**        | —                             | 2.6× price for 3.3× sites         | 2× price for 3× sites + white-label   |
| **vs GoHighLevel**    | GHL $97 — we're 5× cheaper    | GHL $297 — 6× cheaper             | GHL $497 — 5× cheaper                 |
| **Worst-case margin** | 78.7%                         | 70.8%                             | 36.9%                                 |

### Why Email Sends Are a Metered Limit

Marketing campaigns send in batch (50/batch, 1s delay, unlimited). One campaign to 5K contacts costs $4.50 in Resend fees. Without limits, a single Agency user running 4 large campaigns costs $18 — eating 55% of our $33 variable budget. **Email sends are the #1 cost-control mechanism.**

### Why Clients Are Unlimited

CRM records cost fractions of a cent per row. Limiting contacts would block the CRM module's core value. GoHighLevel also doesn't limit base contacts.

### Why Client Portal Is Not a Separate Limit

`sites.client_id IS NOT NULL` → every site has one owner → that client gets portal access. Portals are 1:1 with sites. Limiting portals separately contradicts the data model.

### Why White-Label Is the Premium Gate

The most valuable differentiator for agencies. Zero marginal cost (just removes branding). Industry standard across all agency platforms. Justifies the $49→$99 jump.

---

## 14. Implementation Roadmap

See companion documents:

- **`/phases/PHASE-BIL-MASTER-GUIDE.md`** — Complete implementation specification (10 phases)
- **`/phases/PHASE-BIL-SESSION-BRIEF.md`** — Session prompts for executing the build

### Phase Summary

| Phase  | Name                           | Sessions  |
| ------ | ------------------------------ | --------- |
| BIL-01 | Pricing Configuration Rework   | Session 1 |
| BIL-02 | Pricing Page Redesign          | Session 1 |
| BIL-03 | Subscription Checkout & Trial  | Session 2 |
| BIL-04 | Billing Settings Dashboard     | Session 2 |
| BIL-05 | Usage Metering & Enforcement   | Session 3 |
| BIL-06 | Plan Upgrades & Downgrades     | Session 3 |
| BIL-07 | Payment Methods & Cancellation | Session 4 |
| BIL-08 | Overage Billing Engine         | Session 4 |
| BIL-09 | Super Admin Revenue Dashboard  | Session 5 |
| BIL-10 | Chiko AI Business Assistant    | Session 6 |

Estimated total: **6 sessions** across ~3 weeks of development.
