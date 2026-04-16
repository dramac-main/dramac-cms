# DRAMAC CMS — Complete Pricing Strategy v5 (Final)

> **Date:** July 2026
> **Supersedes:** PRICING-STRATEGY-V4.md
> **Prices:** $29 / $79 / $149 monthly | $290 / $790 / $1,490 annual (2 months free)
> **Billing Provider:** Paddle (5% + $0.50 per transaction)
> **Target Market:** African agencies, freelancers, SMEs (Zambia primary)

---

## Table of Contents

1. [Why V5 — Price Increase Rationale](#1-why-v5--price-increase-rationale)
2. [Phased Infrastructure Costs](#2-phased-infrastructure-costs)
3. [Per-Client Resource Consumption Model](#3-per-client-resource-consumption-model)
4. [Per-Agency Cost Model (Bottom Up)](#4-per-agency-cost-model-bottom-up)
5. [Paddle Transaction Fee Analysis](#5-paddle-transaction-fee-analysis)
6. [Proposed Pricing Tiers ($29 / $79 / $149)](#6-proposed-pricing-tiers)
7. [Profitability at Realistic Usage (50%)](#7-profitability-at-realistic-usage)
8. [Profitability at Maximum Usage (Worst Case)](#8-profitability-at-maximum-usage)
9. [Growth Projections (Phased Infrastructure)](#9-growth-projections)
10. [Annual Billing Impact](#10-annual-billing-impact)
11. [Domain & Email Hosting Clarification](#11-domain--email-hosting-clarification)
12. [Additional Revenue Streams](#12-additional-revenue-streams)
13. [Agency→Client Billing Status](#13-agencyclient-billing-status)
14. [Chiko AI Business Assistant](#14-chiko-ai-business-assistant)
15. [Industry Comparison](#15-industry-comparison)
16. [Key Design Decisions](#16-key-design-decisions)
17. [V4 vs V5 Profit Comparison](#17-v4-vs-v5-profit-comparison)
18. [Implementation Roadmap](#18-implementation-roadmap)

---

## 1. Why V5 — Price Increase Rationale

V4 priced at $19/$49/$99. After analysis, this undervalues the platform:

| Factor                   | Assessment                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Value delivered**      | 7 full modules + AI + Client Portal + Website Builder = $200+/mo if purchased individually |
| **Industry positioning** | V4 was cheaper than Systeme.io ($27/$47/$97) despite offering 3× the functionality         |
| **Sustainability**       | Need margins for future office, employees, marketing, and growth                           |
| **Market perception**    | Too cheap = perceived as low quality or hobby-grade                                        |
| **Competitive space**    | GoHighLevel ($97/$297/$497) charges $497 for white-label alone; DRAMAC offers it at $149   |
| **Zambia accessibility** | $29/mo (~K780) is accessible for any agency making K2,000+/mo from clients                 |

**V5 prices: $29 / $79 / $149** — still 70% cheaper than leading competitors, now with stronger margins.

---

## 2. Phased Infrastructure Costs

**Key insight:** We start on FREE plans and upgrade only when traffic demands it. No fixed costs until we have paying agencies covering them.

### Service Free Tier Limits

| Service          | Free Tier Includes                                               | Upgrade Trigger                                                |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| **Supabase**     | 500 MB DB, 1 GB storage, 50K MAU, 2 Realtime connections         | Approaching 300 MB DB or need connection pooler (~15 agencies) |
| **Vercel**       | Hobby: unlimited deploys, 100 GB bandwidth, serverless functions | Commercial use at scale (~10 agencies)                         |
| **Resend**       | 3,000 emails/mo, 100/day limit                                   | >3K emails/mo or need no daily limit (~20 agencies)            |
| **Cloudflare**   | Unlimited DNS zones, DDoS protection                             | Never                                                          |
| **ResellerClub** | Wholesale pricing, pay per purchase                              | Never                                                          |
| **Anthropic**    | Pay-as-you-go, no minimum                                        | Never (pure variable)                                          |

### Phased Cost Scaling

| Phase          | Agencies | Supabase     | Vercel             | Resend         | **Total Fixed** |
| -------------- | -------- | ------------ | ------------------ | -------------- | --------------- |
| **Launch**     | 0–5      | Free ($0)    | Free ($0)          | Free ($0)      | **$0/mo**       |
| **Early**      | 6–15     | Free ($0)    | Pro ($20)          | Free ($0)      | **$20/mo**      |
| **Traction**   | 16–30    | Pro ($25)    | Pro ($20)          | Free→Pro       | **$45–65/mo**   |
| **Growth**     | 31–50    | Pro ($25)    | Pro ($20)          | Pro ($20)      | **$65/mo**      |
| **Scale**      | 51–100   | Medium ($60) | Pro ($20)          | Pro ($20)      | **$100/mo**     |
| **Expand**     | 100–250  | Medium ($60) | Pro ($20)          | Scale ($90)    | **$170/mo**     |
| **Enterprise** | 250–500  | Large ($110) | Pro+overages ($25) | Scale ($90)    | **$225/mo**     |
| **500+**       | 500+     | XL ($210)    | Pro+overages ($35) | Scale+overages | **$350/mo**     |

### Why This Matters

- **Break-even with 0 fixed costs**: 1 Starter agency = $29 revenue − $2.89 total cost = **$26.11 profit from day 1**
- **First $65/mo fixed cost** doesn't hit until ~31 agencies, when you're making ~$1,500+/mo
- **Infrastructure costs never exceed 3% of revenue** at any scale

---

## 3. Per-Client Resource Consumption Model

Every agency has clients. Each client can own a site. Understanding what a **single client site** costs DRAMAC is the foundation for pricing.

### 3.1 What Each Client Site Consumes

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

### 3.2 Emails Generated Per Client Site Per Month

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

### 3.3 AI Actions Per Client Site Per Month

| AI Action Type                      | Light    | Medium    | Heavy      |
| ----------------------------------- | -------- | --------- | ---------- |
| Content generation (products, blog) | 0–5      | 5–20      | 20–50      |
| Chiko business queries              | 2–10     | 10–30     | 30–100     |
| Marketing copy (subjects, CTAs)     | 0–5      | 5–15      | 15–30      |
| AI website designer actions         | 0–2      | 2–5       | 5–10       |
| **TOTAL per client site**           | **2–22** | **22–70** | **70–190** |

### 3.4 Cost Per Client Site to DRAMAC

Unit costs: AI = $0.003/action, Email = $0.0009/send, Vercel/Supabase amortized

| Cost Center               | Light Client   | Medium Client   | Heavy Client      |
| ------------------------- | -------------- | --------------- | ----------------- |
| AI actions                | $0.04 (12 avg) | $0.14 (46 avg)  | $0.39 (130 avg)   |
| Email sends               | $0.05 (54 avg) | $0.55 (607 avg) | $2.88 (3,200 avg) |
| Vercel (CDN + functions)  | $0.01          | $0.03           | $0.12             |
| Supabase (DB + storage)   | $0.01          | $0.02           | $0.08             |
| **TOTAL per client site** | **$0.11**      | **$0.74**       | **$3.47**         |

---

## 4. Per-Agency Cost Model (Bottom Up)

### 4.1 Typical Agency Profile by Plan

|                               | **Starter (5 sites)** | **Growth (15 sites)**        | **Agency (30 sites)**         |
| ----------------------------- | --------------------- | ---------------------------- | ----------------------------- |
| Active sites (% of limit)     | 3 (60%)               | 10 (67%)                     | 20 (67%)                      |
| Realistic site mix            | 2 light + 1 medium    | 3 light + 5 medium + 2 heavy | 5 light + 10 medium + 5 heavy |
| AI actions/month (realistic)  | ~130                  | ~700                         | ~3,500                        |
| Email sends/month (realistic) | ~700                  | ~5,000                       | ~18,000                       |
| Active team members           | 1–2                   | 4–6                          | 10–15                         |
| Total DB storage              | ~5 MB                 | ~50 MB                       | ~400 MB                       |
| Total file storage            | ~150 MB               | ~1.2 GB                      | ~7 GB                         |

### 4.2 Variable Cost Per Agency (Realistic Usage — ~50–60% of limits)

| Cost Center                        | Starter   | Growth     | Agency     | Calculation             |
| ---------------------------------- | --------- | ---------- | ---------- | ----------------------- |
| **AI actions**                     | $0.39     | $2.10      | $10.50     | actions × $0.003        |
| **Email sends**                    | $0.63     | $4.50      | $16.20     | sends × $0.0009         |
| **Vercel share** (CDN + functions) | $0.05     | $0.20      | $1.00      | proportional to traffic |
| **Supabase share** (DB + storage)  | $0.03     | $0.15      | $0.80      | proportional to data    |
| **File storage**                   | $0.003    | $0.025     | $0.15      | Supabase $0.021/GB      |
| **Total variable**                 | **$1.11** | **$6.98**  | **$28.65** |                         |
| **Paddle fee** (5% + $0.50)        | **$1.95** | **$4.45**  | **$7.95**  |                         |
| **TOTAL COST PER AGENCY**          | **$3.06** | **$11.43** | **$36.60** |                         |

### 4.3 Variable Cost Per Agency (WORST CASE — 100% limit usage, all sites heavy)

| Cost Center               | Starter   | Growth     | Agency     | Calculation                |
| ------------------------- | --------- | ---------- | ---------- | -------------------------- |
| **AI actions**            | $3.00     | $9.00      | $45.00     | 1K / 3K / 15K × $0.003     |
| **Email sends**           | $1.80     | $9.00      | $36.00     | 2K / 10K / 40K × $0.0009   |
| **Automation runs**       | $0.10     | $0.75      | $3.75      | 2K / 15K / 75K × $0.00005  |
| **Vercel share**          | $0.15     | $0.60      | $2.00      | peak traffic               |
| **Supabase share**        | $0.10     | $0.40      | $1.50      | peak data/queries          |
| **File storage**          | $0.11     | $0.42      | $1.58      | 5 / 20 / 75 GB × $0.021/GB |
| **Total variable**        | **$5.26** | **$20.17** | **$89.83** |                            |
| **Paddle fee**            | **$1.95** | **$4.45**  | **$7.95**  |                            |
| **TOTAL COST PER AGENCY** | **$7.21** | **$24.62** | **$97.78** |                            |

---

## 5. Paddle Transaction Fee Analysis

Paddle is a Merchant of Record — handles all taxes, compliance, chargebacks. Fee: **5% + $0.50 per checkout transaction**.

### Monthly Billing

| Plan        | Price | Paddle Fee | % Lost | Net to DRAMAC |
| ----------- | ----- | ---------- | ------ | ------------- |
| **Starter** | $29   | $1.95      | 6.7%   | $27.05        |
| **Growth**  | $79   | $4.45      | 5.6%   | $74.55        |
| **Agency**  | $149  | $7.95      | 5.3%   | $141.05       |

### Annual Billing (1 transaction vs 12)

| Plan        | Annual | Paddle Fee | % Lost | Net/year  | Monthly equiv net | Paddle saved vs monthly |
| ----------- | ------ | ---------- | ------ | --------- | ----------------- | ----------------------- |
| **Starter** | $290   | $15.00     | 5.2%   | $275.00   | $22.92            | $8.40/yr ($0.70/mo)     |
| **Growth**  | $790   | $40.00     | 5.1%   | $750.00   | $62.50            | $13.40/yr ($1.12/mo)    |
| **Agency**  | $1,490 | $75.00     | 5.0%   | $1,415.00 | $117.92           | $20.40/yr ($1.70/mo)    |

Annual billing benefits both sides: customer saves 2 months, DRAMAC saves on Paddle fees and churn.

---

## 6. Proposed Pricing Tiers

### Design Rules

1. ✅ All 7 modules on every plan — CRM, Booking, E-Commerce, Live Chat, Social Media, Marketing, Invoicing
2. ✅ Differentiated by numerical limits only (except white-label)
3. ✅ Sites and clients logically linked (`sites.client_id IS NOT NULL`)
4. ✅ White-label is the only binary gate (Agency plan exclusive)
5. ✅ Free trial on middle tier (14 days)
6. ✅ Email sends metered (marketing campaigns are the #1 cost driver)
7. ✅ Zambia-affordable with strong margins for growth

### Complete Plan Feature Matrix

| Feature                     | **Starter**            | **Growth** ⭐           | **Agency**                |
| --------------------------- | ---------------------- | ----------------------- | ------------------------- |
| **Monthly**                 | **$29/mo**             | **$79/mo**              | **$149/mo**               |
| **Annual**                  | **$290/yr** (save $58) | **$790/yr** (save $158) | **$1,490/yr** (save $298) |
| **Free Trial**              | —                      | **14 days**             | —                         |
|                             |                        |                         |                           |
| **Websites**                | 5                      | 15                      | 30                        |
| **Clients (CRM records)**   | Unlimited              | Unlimited               | Unlimited                 |
| **Client Portal Access**    | ✅ (auto per site)     | ✅ (auto per site)      | ✅ (auto per site)        |
| **Team Members**            | 3                      | 8                       | 20                        |
|                             |                        |                         |                           |
| **Modules**                 | All 7                  | All 7                   | All 7                     |
| CRM                         | ✅ Full                | ✅ Full                 | ✅ Full                   |
| Booking                     | ✅ Full                | ✅ Full                 | ✅ Full                   |
| E-Commerce                  | ✅ Full                | ✅ Full                 | ✅ Full                   |
| Live Chat                   | ✅ Full                | ✅ Full                 | ✅ Full                   |
| Social Media                | ✅ Full                | ✅ Full                 | ✅ Full                   |
| Marketing                   | ✅ Full                | ✅ Full                 | ✅ Full                   |
| Invoicing                   | ✅ Full                | ✅ Full                 | ✅ Full                   |
|                             |                        |                         |                           |
| **Metered Resources**       |                        |                         |                           |
| AI Actions/month            | 1,000                  | 3,000                   | 15,000                    |
| Email Sends/month           | 2,000                  | 10,000                  | 40,000                    |
| Automation Runs/month       | 2,000                  | 15,000                  | 75,000                    |
| File Storage                | 5 GB                   | 20 GB                   | 75 GB                     |
|                             |                        |                         |                           |
| **Chiko AI Assistant**      | ✅ (uses AI quota)     | ✅ (uses AI quota)      | ✅ (uses AI quota)        |
| **Custom Domains**          | ✅                     | ✅                      | ✅                        |
| **AI Website Designer**     | ✅                     | ✅                      | ✅                        |
| **Automation Workflows**    | ✅                     | ✅                      | ✅                        |
|                             |                        |                         |                           |
| **Support**                 | Community              | Priority Email          | Priority + Chat           |
| **White-Label**             | ❌ DRAMAC branded      | ❌ DRAMAC branded       | ✅ Full white-label       |
| **Custom Dashboard Domain** | ❌                     | ❌                      | ✅ youragency.com         |

### Domain & Email Hosting (NOT Included — See Section 11)

Domains and email hosting are **separate products** purchased through the platform. Agencies resell these to clients for additional revenue.

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

**Websites (5 / 15 / 30):**

- Starter (5): Freelancer or solo operator with a small portfolio
- Growth (15): Growing agency with a client portfolio
- Agency (30): Full agency operation — $149/mo for 30 sites = $4.97/site = incredible value

**Email Sends (2,000 / 10,000 / 40,000):**

- THE critical limit. Marketing campaigns are the #1 cost driver
- A campaign to 500 contacts = 500 sends. Starter gets ~4 campaigns/mo, Growth ~20, Agency ~80
- System/transactional emails are only ~50–100/agency/month — the limit governs marketing

**AI Actions (1,000 / 3,000 / 15,000):**

- Each costs DRAMAC ~$0.003 (Claude Haiku 4.5)
- Includes: Chiko queries, content generation, AI website designer
- Starter (1,000): ~33/day — daily Chiko + content gen
- Agency (15,000): ~500/day — heavy AI content factory operations

**Team Members (3 / 8 / 20):**

- Agency staff who log into the DRAMAC dashboard
- NOT end-clients, NOT storefront customers, NOT portal users
- Negligible cost impact — just dashboard API calls

---

## 7. Profitability at Realistic Usage

Realistic = 50–60% of plan limits (SaaS industry standard).

### Per-Agency Profit (Monthly Billing)

|                            | **Starter ($29)** | **Growth ($79)** | **Agency ($149)** |
| -------------------------- | ----------------- | ---------------- | ----------------- |
| Revenue                    | $29.00            | $79.00           | $149.00           |
| Paddle fee (5% + $0.50)    | −$1.95            | −$4.45           | −$7.95            |
| Variable costs (realistic) | −$1.11            | −$6.98           | −$28.65           |
| **NET PER AGENCY**         | **$25.94**        | **$67.57**       | **$112.40**       |
| **Margin**                 | **89.4%**         | **85.5%**        | **75.4%**         |

### Per-Agency Profit (Annual Billing)

|                              | **Starter ($290/yr)** | **Growth ($790/yr)** | **Agency ($1,490/yr)** |
| ---------------------------- | --------------------- | -------------------- | ---------------------- |
| Revenue/month (amortized)    | $24.17                | $65.83               | $124.17                |
| Paddle fee/month (amortized) | −$1.25                | −$3.33               | −$6.25                 |
| Variable costs/month         | −$1.11                | −$6.98               | −$28.65                |
| **NET PER AGENCY/MO**        | **$21.81**            | **$55.52**           | **$89.27**             |
| **Margin**                   | **90.2%**             | **84.4%**            | **71.9%**              |

---

## 8. Profitability at Maximum Usage

Every agency maxes every metric simultaneously. Extremely unlikely but the safety check.

### Per-Agency Worst-Case Profit

|                        | **Starter ($29)** | **Growth ($79)** | **Agency ($149)** |
| ---------------------- | ----------------- | ---------------- | ----------------- |
| Revenue                | $29.00            | $79.00           | $149.00           |
| Paddle fee             | −$1.95            | −$4.45           | −$7.95            |
| Variable costs (MAXED) | −$5.26            | −$20.17          | −$89.83           |
| **NET PER AGENCY**     | **$21.79**        | **$54.38**       | **$51.22**        |
| **Margin**             | **75.1%**         | **68.8%**        | **34.4%**         |

**Analysis:**

- Starter maxed out: 75.1% margin — very safe
- Growth maxed out: 68.8% margin — very safe
- Agency worst case: 34.4% — acceptable because:
  - Requires ALL 30 sites to be heavy e-commerce running max campaigns simultaneously
  - Real agencies have a mix of light/medium/heavy sites
  - Heavy users generate overage charges (extra revenue not counted above)
  - This scenario affects <1% of agencies

**No plan can lose money.** Even Agency at absolute worst case still nets $51.22/month.

---

## 9. Growth Projections (Phased Infrastructure)

Assumed plan mix: 50% Starter, 30% Growth, 20% Agency (typical SaaS distribution).

### Monthly Revenue & Profit by Phase

| Phase          | Agencies | Mix (S/G/A) | Revenue | All Costs | Fixed Infra | **NET PROFIT** | **Margin** |
| -------------- | -------- | ----------- | ------- | --------- | ----------- | -------------- | ---------- |
| **Launch**     | 5        | 3/1/1       | $315    | $55.63    | $0          | **$259**       | 82.3%      |
| **Early**      | 15       | 8/4/3       | $995    | $174.49   | $20         | **$800**       | 80.4%      |
| **Traction**   | 30       | 15/9/6      | $2,040  | $356.58   | $45         | **$1,638**     | 80.3%      |
| **Growth**     | 50       | 25/15/10    | $3,400  | $594.30   | $65         | **$2,741**     | 80.6%      |
| **Scale**      | 100      | 50/30/20    | $6,800  | $1,188.60 | $100        | **$5,511**     | 81.0%      |
| **Expand**     | 250      | 125/75/50   | $17,000 | $2,971.50 | $170        | **$13,859**    | 81.5%      |
| **Enterprise** | 500      | 250/150/100 | $34,000 | $5,943.00 | $300        | **$27,757**    | 81.6%      |

### Timeline Projections (Conservative Growth)

| Month  | Agencies | Revenue/mo | Fixed Infra | Total Costs | **Net Profit/mo** | **Annual Run Rate** |
| ------ | -------- | ---------- | ----------- | ----------- | ----------------- | ------------------- |
| **1**  | 2        | $108       | $0          | $17         | **$91**           | $1,092              |
| **3**  | 5        | $315       | $0          | $56         | **$259**          | $3,108              |
| **6**  | 15       | $995       | $20         | $195        | **$800**          | $9,600              |
| **9**  | 28       | $1,876     | $45         | $345        | **$1,486**        | $17,832             |
| **12** | 40       | $2,720     | $65         | $540        | **$2,115**        | $25,380             |
| **18** | 80       | $5,440     | $100        | $1,051      | **$4,289**        | $51,468             |
| **24** | 150      | $10,200    | $170        | $1,953      | **$8,077**        | $96,924             |
| **36** | 300      | $20,400    | $250        | $3,910      | **$16,240**       | $194,880            |

### Key Milestones

| Milestone          | Agencies Needed | Timeline (est.) | Monthly Revenue  |
| ------------------ | --------------- | --------------- | ---------------- |
| **First profit**   | 1               | Day 1           | $29 → $26.11 net |
| **$500/mo profit** | ~12             | Month 4         | ~$800            |
| **$1K/mo profit**  | ~20             | Month 6         | ~$1,350          |
| **$2K/mo profit**  | ~35             | Month 10        | ~$2,400          |
| **$5K/mo profit**  | ~95             | Month 17        | ~$6,500          |
| **$10K/mo profit** | ~180            | Month 26        | ~$12,300         |
| **$25K/mo profit** | ~450            | Month 34        | ~$30,600         |

---

## 10. Annual Billing Impact

If 40% of agencies choose annual billing:

| Agencies | Monthly Revenue | Annual Mix Adjustment | Paddle Savings | **Adjusted Net/mo** |
| -------- | --------------- | --------------------- | -------------- | ------------------- |
| 50       | $3,400          | −$340 (discount)      | +$14           | **$2,415**          |
| 100      | $6,800          | −$680                 | +$28           | **$4,859**          |
| 250      | $17,000         | −$1,700               | +$70           | **$12,229**         |
| 500      | $34,000         | −$3,400               | +$140          | **$24,497**         |

**Note**: Revenue dips from annual discount, but benefits include:

- **Cash flow upfront** — collect a full year immediately
- **Lower churn** — committed customers are 3–5× stickier
- **Predictable revenue** for hiring and growth planning

---

## 11. Domain & Email Hosting Clarification

### What's INCLUDED in Every Plan

| Feature                      | Details                                                | Cost to DRAMAC            |
| ---------------------------- | ------------------------------------------------------ | ------------------------- |
| **Email sending** (Resend)   | Transactional + marketing emails per plan quota        | Variable (see Section 3)  |
| **Custom domain connection** | Point any owned domain to agency sites via DNS         | $0 (Cloudflare DNS)       |
| **Chiko AI assistant**       | Business intelligence queries (counts toward AI quota) | Variable (see Section 14) |
| **All 7 modules**            | Full functionality on every plan                       | $0 (platform code)        |

### What's NOT Included (Purchased Separately)

| Product                       | How It Works                                                                             | Agency Revenue Opportunity                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Domain registration**       | Purchased through the platform via ResellerClub wholesale                                | Agency sets markup (default 30%). E.g., .com at $10.40 vs wholesale $8 = $2.40 profit |
| **Email hosting (mailboxes)** | Titan Mail via ResellerClub. Professional ($4.99), Business ($9.99), Enterprise ($19.99) | Agency resells at markup to clients. E.g., 5 mailboxes × $2 markup = $10/mo           |
| **SSL certificates**          | Free via Cloudflare/Let's Encrypt                                                        | Already included at no cost                                                           |

### Why This Model

This matches the industry standard:

- **GoHighLevel**: Domains not included, purchased separately
- **Webflow**: Domains purchased separately ($10–30/yr add-on)
- **Shopify**: Domains purchased separately
- **HubSpot**: Email hosting not included

**Domains and email hosting are REVENUE STREAMS for agencies**, not costs. By not including them, we keep base subscription prices low AND agencies earn from reselling.

---

## 12. Additional Revenue Streams

### 12.1 Domain Sales (ResellerClub, 30% Markup)

| Domain | Wholesale | Retail (30% markup) | Profit/sale |
| ------ | --------- | ------------------- | ----------- |
| .com   | ~$8.00    | ~$10.40             | $2.40       |
| .co.zm | ~$15.00   | ~$19.50             | $4.50       |
| .net   | ~$10.00   | ~$13.00             | $3.00       |

At 500 agencies, 30% buying 1 domain/yr: 150 × $3.00 avg = **$450/yr** bonus.

### 12.2 Email Hosting (Titan Mail)

ResellerClub wholesale: ~$0.60/mailbox/month. Sell at $2/mailbox:

- 50 agencies × 3 mailboxes = 150 × $1.40 = **$210/mo** bonus

### 12.3 Overage Revenue

- 10% agencies exceed AI by 500 actions: 50 × $5 = **$250/mo**
- 5% exceed email by 2K sends: 25 × $4 = **$100/mo**

### 12.4 Extra Site Add-ons

- 15% Growth agencies buy 1 extra site: 45 × $5 = **$225/mo**

**Total additional at 500 agencies: ~$1,000–1,800/month** beyond subscriptions.

---

## 13. Agency→Client Billing Status

### Current Capabilities

| Capability                  | Status       | Notes                                      |
| --------------------------- | ------------ | ------------------------------------------ |
| Create invoices for clients | ✅ Built     | Invoicing module (14 phases, 18 tables)    |
| Recurring invoices          | ✅ Built     | Auto-generates on schedule                 |
| Invoice email delivery      | ✅ Built     | Sent via Resend                            |
| Client manual payment       | ✅ Built     | Upload proof of payment                    |
| Auto-charge client card     | ❌ Not built | Payment providers wired to e-commerce only |

### Zambia Market Assessment

The manual payment + recurring invoice system is **appropriate for Zambia**:

- Mobile money (Airtel Money, MTN, Zamtel Kwacha) is dominant
- Bank transfers are standard for B2B
- Most African SMEs use this workflow already

---

## 14. Chiko AI Business Assistant

### Cost: ~$0.005 Per Question (Half a Cent)

| Component              | Detail                                     |
| ---------------------- | ------------------------------------------ |
| **Model**              | Claude Haiku 4.5 (fastest, cheapest)       |
| **Input cost**         | ~2,000 tokens × $1/MTok = $0.002           |
| **Output cost**        | ~500 tokens × $5/MTok = $0.0025            |
| **Total per question** | **~$0.005**                                |
| **Billing**            | Counts toward AI actions quota (same pool) |

### Cost at Scale

| Usage           | Questions/Agency/Mo | Cost/Agency | At 500 agencies |
| --------------- | ------------------- | ----------- | --------------- |
| Casual (weekly) | 20                  | $0.10       | $50/mo          |
| Regular (daily) | 100                 | $0.50       | $250/mo         |
| Power user      | 300                 | $1.50       | $750/mo         |

Already included in AI action cost calculations — no separate infrastructure needed.

---

## 15. Industry Comparison

### All-in-One Platform Pricing

| Platform        | Entry      | Mid        | Top         | What's Included                        | White-Label    |
| --------------- | ---------- | ---------- | ----------- | -------------------------------------- | -------------- |
| **GoHighLevel** | $97/mo     | $297/mo    | $497/mo     | CRM, Marketing, Funnels, Website       | $497 plan only |
| **Kartra**      | $119/mo    | $229/mo    | $549/mo     | Marketing, E-com, Membership, Video    | $549 plan only |
| **Kajabi**      | $149/mo    | $199/mo    | $399/mo     | Courses, Marketing, Website, Community | Not available  |
| **Systeme.io**  | $27/mo     | $47/mo     | $97/mo      | Marketing, E-com, Courses, Funnels     | $97 plan only  |
| **Duda**        | $25/mo     | $39/mo     | $74/mo      | Website builder only (per site)        | Add-on fee     |
|                 |            |            |             |                                        |                |
| **DRAMAC**      | **$29/mo** | **$79/mo** | **$149/mo** | **7 modules + AI + Portal + Builder**  | **$149 plan**  |

### Value Analysis

| What You Get                       | If Purchased Separately | DRAMAC Price   |
| ---------------------------------- | ----------------------- | -------------- |
| CRM (cf. HubSpot Starter)          | ~$20/mo                 | Included       |
| E-Commerce (cf. Shopify Basic)     | ~$39/mo                 | Included       |
| Booking (cf. Calendly Pro)         | ~$12/mo                 | Included       |
| Live Chat (cf. Intercom Starter)   | ~$74/mo                 | Included       |
| Marketing (cf. Mailchimp Standard) | ~$20/mo                 | Included       |
| Automation (cf. Zapier Starter)    | ~$20/mo                 | Included       |
| Invoicing (cf. FreshBooks Lite)    | ~$19/mo                 | Included       |
| Website Builder (cf. Squarespace)  | ~$23/mo                 | Included       |
| AI Assistant                       | No direct comparable    | Included       |
| Client Portal                      | No direct comparable    | Included       |
| **Total separate cost**            | **~$227+/mo**           | **$29–149/mo** |

DRAMAC at $29/mo delivers ~$227/mo of value. Even at $149/mo (Agency), it's **65% cheaper** than buying equivalent tools separately.

---

## 16. Key Design Decisions

### Why $29 / $79 / $149

| Factor                | Starter $29                  | Growth $79                      | Agency $149                           |
| --------------------- | ---------------------------- | ------------------------------- | ------------------------------------- |
| **Zambia context**    | Accessible (~K780/mo)        | Sweet spot for growing agencies | Full-service agencies making money    |
| **Paddle efficiency** | 6.7% fee                     | 5.6% — efficient                | 5.3% — optimal                        |
| **Jump ratio**        | —                            | 2.7× price for 3× sites + trial | 1.9× price for 2× sites + white-label |
| **vs GoHighLevel**    | GHL $97 — we're 3.3× cheaper | GHL $297 — 3.8× cheaper         | GHL $497 — 3.3× cheaper               |
| **Worst-case margin** | 75.1%                        | 68.8%                           | 34.4%                                 |
| **Realistic margin**  | 89.4%                        | 85.5%                           | 75.4%                                 |

### Why Email Sends Are a Metered Limit

Marketing campaigns send in batch (50/batch, 1s delay, unlimited). One campaign to 5K contacts costs $4.50 in Resend fees. Without limits, a single Agency user running 4 large campaigns costs $18 — eating significant variable budget. **Email sends are the #1 cost-control mechanism.**

### Why Clients Are Unlimited

CRM records cost fractions of a cent per row. Limiting contacts would block the CRM module's core value.

### Why Client Portal Is Not a Separate Limit

`sites.client_id IS NOT NULL` → every site has one owner → that client gets portal access. Portals are 1:1 with sites.

### Why White-Label Is the Premium Gate

The most valuable differentiator for agencies. Zero marginal cost. Justifies the $79→$149 jump.

---

## 17. V4 vs V5 Profit Comparison

| Metric                     | V4 ($19/$49/$99) | V5 ($29/$79/$149) | Difference                |
| -------------------------- | ---------------- | ----------------- | ------------------------- |
| **Starter per-agency net** | $16.84           | $25.94            | +$9.10 (+54%)             |
| **Growth per-agency net**  | $41.36           | $67.57            | +$26.21 (+63%)            |
| **Agency per-agency net**  | $65.04           | $112.40           | +$47.36 (+73%)            |
| **50 agencies profit**     | ~$1,374          | ~$2,741           | +$1,367 (+100%)           |
| **100 agencies profit**    | ~$2,777          | ~$5,511           | +$2,734 (+98%)            |
| **250 agencies profit**    | ~$7,143          | ~$13,859          | +$6,716 (+94%)            |
| **500 agencies profit**    | ~$14,386         | ~$27,757          | +$13,371 (+93%)           |
| **Break-even agencies**    | 4 (at $65 fixed) | 1 (at $0 fixed)   | **Instant profitability** |

The price increase nearly **doubles profit at every scale** while prices remain well below competitors.

---

## 18. Implementation Roadmap

See companion documents:

- **`/phases/PHASE-BIL-MASTER-GUIDE.md`** — Complete implementation specification (10 phases)
- **`/phases/PHASE-BIL-SESSION-BRIEF.md`** — Session prompts for executing the build

### Phase Summary

| Phase  | Name                           | Session   |
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
