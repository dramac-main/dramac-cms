# Domain & Email Module - Quick Testing Guide

## Prerequisites

1. **Start the development server:**
   ```bash
   cd next-platform-dashboard
   pnpm dev
   ```
   Open: http://localhost:3000

2. **Login** with your test credentials

---

## 🧭 Navigation Testing

### Test 1: Sidebar Navigation
1. Look at the left sidebar
2. ✅ Verify **"Domains & Email"** section appears with:
   - **Domains** (Server icon)
   - **Business Email** (Mail icon)
   - **Transfers** (Arrow icon)

### Test 2: Click Each Nav Item
| Click | Expected URL | What You Should See |
|-------|--------------|---------------------|
| Domains | `/dashboard/domains` | Domain list with stats |
| Business Email | `/dashboard/email` | Email orders list |
| Transfers | `/dashboard/domains/transfer` | Transfer list page |

---

## 📦 Domains Testing

### Test 3: Domain List Page
1. Go to: `/dashboard/domains`
2. ✅ Verify:
   - Stats cards (Total, Expiring Soon, Auto-Renewal, Email Accounts)
   - "Search Domains" button works
   - Domain list table displays correctly

### Test 4: Domain Search
1. Click **"Search Domains"** button
2. ✅ Verify: Search page loads at `/dashboard/domains/search`
3. Try searching for a domain (e.g., "testdomain")
4. ✅ Verify: Results show with availability and pricing

### Test 5: Domain Detail Page
1. Click on any domain in the list
2. ✅ Verify URL: `/dashboard/domains/[domainId]`
3. ✅ Check these buttons work:
   - **DNS** → goes to `/dashboard/domains/[domainId]/dns`
   - **Email** → goes to `/dashboard/domains/[domainId]/email`
   - **Settings** → goes to `/dashboard/domains/[domainId]/settings`
   - **Renew Domain** → goes to `/dashboard/domains/[domainId]/renew`

### Test 6: DNS Management
1. From domain detail, click **DNS**
2. ✅ Verify:
   - Nameservers section shows
   - DNS records table displays
   - "Add Record" button visible
   - Template dropdown works

### Test 7: Domain Renewal
1. From domain detail, click **Renew Domain**
2. ✅ Verify:
   - Renewal period options (1, 2, 3, 5 years)
   - Price calculation updates
   - New expiry date shown

---

## 📧 Email Testing

### Test 8: Email Orders Page
1. Go to: `/dashboard/email`
2. ✅ Verify:
   - Stats cards show
   - "Purchase Email" button works
   - Email orders list displays

### Test 9: Purchase Email
1. Click **"Purchase Email"**
2. ✅ Verify: Wizard loads at `/dashboard/email/purchase`
3. ✅ Features preview shows

### Test 10: Email Order Detail
1. Click on any email order
2. ✅ Verify:
   - Order details display
   - Account management section
   - **Open Webmail** button → opens `https://app.titan.email`

### Test 11: Domain Email Integration
1. Go to a domain detail page → click **Email** tab
2. ✅ If no email: "Purchase Email" prompt shows
3. ✅ If has email: Account management shows

---

## 🔄 Transfers Testing

### Test 12: Transfers Page
1. Go to: `/dashboard/domains/transfer`
2. ✅ Verify:
   - "Transfer Domain" button works
   - Quick action cards (Transfer In / Transfer Out)
   - Transfer list (if any exist)

### Test 13: New Transfer Wizard
1. Click **"Transfer Domain"**
2. ✅ Verify: Wizard loads at `/dashboard/domains/transfer/new`
3. ✅ Form fields present for domain and auth code

---

## ⚙️ Settings Testing

### Test 14: Domain Settings (Per Domain)
1. Go to any domain → click **Settings**
2. ✅ Verify toggles work:
   - Transfer Lock
   - WHOIS Privacy
   - Auto-Renew
3. ✅ Contact form saves correctly

### Test 15: Domain Settings (Agency-Level)
1. Go to: `/dashboard/settings/domains`
2. ✅ Verify navigation cards:
   - **Pricing Configuration** → `/dashboard/settings/domains/pricing`
   - **White-Label Branding** → `/dashboard/settings/domains/branding`
   - **Billing Integration** → `/dashboard/settings/domains/billing`

---

## 🔗 Link Verification Checklist

| Component | Expected Link | Status |
|-----------|---------------|--------|
| Connected Site in domain list | `/dashboard/sites/[siteId]` | ✅ |
| Connected Site in domain detail | `/dashboard/sites/[siteId]` | ✅ |
| Webmail links | `https://app.titan.email` | ✅ |
| Back to Domain from DNS | `/dashboard/domains/[domainId]` | ✅ |
| Back to Domains list | `/dashboard/domains` | ✅ |
| Email DNS setup link | `/dashboard/domains/[domainId]/dns` | ✅ |

---

## 🛠️ Quick Debug Commands

```bash
# Check TypeScript
cd next-platform-dashboard
npx tsc --noEmit

# View build errors
pnpm build

# Clear cache and restart
rm -rf .next
pnpm dev
```

---

## ✅ Testing Complete Checklist

- [ ] Sidebar shows Domains & Email section
- [ ] All navigation links work
- [ ] Domain list page loads with stats
- [ ] Domain search works
- [ ] Domain detail page shows all info
- [ ] DNS management accessible
- [ ] Domain renewal page works
- [ ] Email orders list loads
- [ ] Email purchase wizard accessible
- [ ] Transfers page works
- [ ] All webmail links go to app.titan.email
- [ ] Site links go to correct URLs (/dashboard/sites/...)
- [ ] Settings pages accessible
