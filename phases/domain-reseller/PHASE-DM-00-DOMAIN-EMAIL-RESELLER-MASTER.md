# Phase DM-00: Domain & Email Reseller Master Plan

> **Module ID**: Domain Management (DM)
> **Priority**: 🔴 HIGH - Revenue Generator
> **Estimated Total Time**: 80-100 hours across 10 phases
> **Dependencies**: Core Platform Complete, Paddle Billing (EM-59)
> **Status**: 📋 READY FOR IMPLEMENTATION

---

## 🎯 Executive Summary

Transform DRAMAC into a **full-service digital presence platform** by enabling agencies and clients to:

1. **Search, Register & Manage Domains** directly within the platform
2. **Purchase Professional Email** (Titan Mail) tied to their domains
3. **Auto-Configure DNS** via Cloudflare for seamless website publishing
4. **White-label Everything** so agencies can resell to their clients
5. **Automate the Entire Flow** from purchase to website launch

### Business Model
```
┌─────────────────────────────────────────────────────────────────────┐
│                      REVENUE STREAMS                                 │
├─────────────────────────────────────────────────────────────────────┤
│  1. Domain Registration (markup on wholesale)                       │
│  2. Domain Renewal (recurring revenue)                              │
│  3. Titan Mail Subscriptions (markup on wholesale)                  │
│  4. Premium DNS Features (advanced configurations)                  │
│  5. SSL Certificates (for custom domains)                           │
│  6. White-label Fees (agencies reselling to clients)                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DRAMAC DOMAIN & EMAIL SYSTEM                      │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  RESELLER      │  CLOUDFLARE    │  RESELLERCLUB  │  AUTOMATION      │
│  CLUB API      │  API           │  EELITE API    │  ENGINE          │
│  (Domains)     │  (DNS)         │  (Titan Mail)  │                  │
├────────────────┼────────────────┼────────────────┼──────────────────┤
│ Domain Search  │ DNS Zones      │ Email Orders   │ Auto DNS Setup   │
│ Registration   │ DNS Records    │ Email Accounts │ SSL Provisioning │
│ Transfers      │ SSL Certs      │ Mailboxes      │ Domain Connect   │
│ Renewals       │ Page Rules     │ Aliases        │ Health Checks    │
│ WHOIS Privacy  │ Security       │ Forwarders     │ Notifications    │
│ Pricing        │ Analytics      │ Admin Access   │ Scheduled Tasks  │
└────────────────┴────────────────┴────────────────┴──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (Supabase)                         │
├─────────────────────────────────────────────────────────────────────┤
│  • domains (registration, status, renewal dates)                     │
│  • domain_dns_records (synced with Cloudflare)                       │
│  • domain_email_accounts (Titan Mail accounts)                       │
│  • domain_pricing (agency markup configurations)                     │
│  • domain_orders (purchase history, invoices)                        │
│  • domain_transfers (incoming/outgoing transfers)                    │
│  • cloudflare_zones (zone management)                                │
│  • email_subscriptions (Titan Mail subscriptions)                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard Pages:                                                    │
│  • /dashboard/domains - Domain management hub                        │
│  • /dashboard/domains/search - Domain search & registration          │
│  • /dashboard/domains/[id] - Individual domain management            │
│  • /dashboard/domains/[id]/dns - DNS record management               │
│  • /dashboard/domains/[id]/email - Email accounts                    │
│  • /dashboard/domains/transfer - Domain transfer wizard              │
│  • /dashboard/email - Email management hub                           │
│  • /dashboard/settings/domains - Agency domain pricing settings      │
│  │
│  Client Portal:                                                      │
│  • /portal/domains - Client domain overview                          │
│  • /portal/email - Client email management                           │
│  │
│  Site Integration:                                                   │
│  • Site Settings > Domain - Connect domain to site                   │
│  • Site Settings > Email - Setup site email                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Phase Breakdown

### Wave 1: Foundation (3 Phases)
| Phase | Name | Time | Description |
|-------|------|------|-------------|
| DM-01 | ResellerClub Integration | 8h | API client, auth, core domain operations |
| DM-02 | Domain Database Schema | 4h | Tables, RLS, types, migrations |
| DM-03 | Cloudflare DNS Integration | 8h | Zone management, DNS automation |

### Wave 2: Core Features (3 Phases)
| Phase | Name | Time | Description |
|-------|------|------|-------------|
| DM-04 | Domain Search & Registration | 10h | Search UI, cart, checkout flow |
| DM-05 | Domain Management Dashboard | 8h | Overview, renewals, settings |
| DM-06 | DNS Management UI | 8h | Record editor, templates, one-click setup |

### Wave 3: Email Integration (2 Phases)
| Phase | Name | Time | Description |
|-------|------|------|-------------|
| DM-07 | Business Email Integration | 10h | ResellerClub EElite API, email provisioning |
| DM-08 | Email Management UI | 8h | Mailbox management, aliases, forwarders |

### Wave 4: Advanced Features (2 Phases)
| Phase | Name | Time | Description |
|-------|------|------|-------------|
| DM-09 | Domain Transfers & Automation | 10h | Transfer wizard, auto-renewals, health checks |
| DM-10 | White-Label & Pricing | 8h | Agency pricing, client reselling, billing integration |

---

## 🔧 Technical Requirements

### Environment Variables Required
```env
# ResellerClub API (Handles BOTH Domains AND Business Email/Titan)
RESELLERCLUB_RESELLER_ID=your_reseller_id
RESELLERCLUB_API_KEY=your_api_key
RESELLERCLUB_API_URL=https://httpapi.com/api
RESELLERCLUB_SANDBOX=false

# Cloudflare API (DNS Management)
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ZONE_ID=your_default_zone_id

# Platform Configuration
PLATFORM_NAMESERVERS=ns1.dramac.app,ns2.dramac.app
PLATFORM_DOMAIN=dramac.app
DEFAULT_CNAME_TARGET=cname.dramac.app
```

**IMPORTANT:** Business Email (Titan) is managed via ResellerClub's EElite API 
(`/api/eelite/`), NOT a separate Titan website/API. This unified approach 
simplifies integration and billing.

### NPM Packages Required
```json
{
  "dependencies": {
    "cloudflare": "^3.0.0",
    "node-fetch": "^3.0.0",
    "zod": "^3.22.0"
  }
}
```

---

## 📊 Database Schema Overview

### Core Tables
```sql
-- Primary domain registry
CREATE TABLE domains (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  client_id UUID REFERENCES clients(id),
  site_id UUID REFERENCES sites(id),
  
  -- Domain Info
  domain_name TEXT UNIQUE NOT NULL,
  tld TEXT NOT NULL,
  
  -- Registration
  resellerclub_order_id TEXT,
  registration_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'active', 'expired', 'transferred', 'cancelled')),
  
  -- DNS
  cloudflare_zone_id TEXT,
  nameservers TEXT[],
  dns_configured BOOLEAN DEFAULT false,
  
  -- Privacy & Lock
  whois_privacy BOOLEAN DEFAULT true,
  transfer_lock BOOLEAN DEFAULT true,
  
  -- Pricing (for reselling)
  wholesale_price DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email accounts per domain (via ResellerClub EElite API)
CREATE TABLE domain_email_accounts (
  id UUID PRIMARY KEY,
  domain_id UUID REFERENCES domains(id),
  
  -- Account Info
  email_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  mailbox_size_gb INTEGER DEFAULT 10,
  
  -- ResellerClub EElite Integration
  resellerclub_email_order_id TEXT,
  resellerclub_account_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',
  
  -- Pricing
  monthly_price DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🎨 UI/UX Requirements

### Design Principles
1. **Simplicity First** - Non-technical users must be able to register domains
2. **Wizard-Based Flows** - Step-by-step for complex operations
3. **Real-Time Feedback** - Show DNS propagation status, verification progress
4. **Automation Visible** - Show what's being automated, let users override
5. **Error Recovery** - Clear error messages with actionable fixes

### Key User Flows

#### Flow 1: Domain Search & Registration (3 steps)
```
[Search Box] → [Results with Pricing] → [Cart & Checkout] → [Success + Auto DNS Setup]
```

#### Flow 2: Connect Domain to Site (2 steps)
```
[Select Domain] → [Auto-Configure DNS] → [Verify & Activate]
```

#### Flow 3: Setup Email (3 steps)
```
[Choose Domain] → [Create Mailboxes] → [Access Webmail/Configure Client]
```

---

## 🔄 Automation Requirements

### Auto-DNS Configuration
When a domain is connected to a site:
1. Create Cloudflare zone (if not exists)
2. Add A record pointing to platform IP
3. Add CNAME for www subdomain
4. Add TXT verification record
5. Enable SSL (Cloudflare Full Strict)
6. Configure page rules (HTTPS redirect)

### Auto-Email Setup
When email is purchased for a domain:
1. Verify domain ownership
2. Order email service via ResellerClub EElite API
3. Add MX records to DNS (auto via ResellerClub)
4. Add SPF/DKIM/DMARC records (auto via ResellerClub)
5. Create email accounts via EElite API
6. Send welcome email with credentials/webmail link

### Health Monitoring
- Check DNS propagation every 5 minutes during setup
- Monitor domain expiry (30, 14, 7, 1 day warnings)
- Check SSL certificate validity
- Monitor email deliverability

---

## 💰 Pricing Structure

### Suggested Markup Model
```typescript
interface DomainPricing {
  // TLD-based wholesale from ResellerClub
  wholesale: {
    '.com': 9.99,
    '.net': 11.99,
    '.org': 12.99,
    '.io': 39.99,
    // ... etc
  };
  
  // Agency markup options
  agencyMarkup: {
    type: 'percentage' | 'fixed' | 'custom';
    value: number; // e.g., 30 for 30% or 5 for $5
  };
  
  // Platform fee (DRAMAC takes this)
  platformFee: number; // e.g., 10% of retail
}

interface EmailPricing {
  // Business Email via ResellerClub EElite API
  resellerclubWholesale: 1.50; // per mailbox/month (varies by plan)
  suggestedRetail: 5.00; // per mailbox/month
  agencyMarkup: 'configurable';
}
```

---

## 🔐 Security Considerations

1. **API Key Encryption** - Store ResellerClub/Cloudflare keys encrypted
2. **RLS Policies** - Agencies can only see their domains
3. **Rate Limiting** - Prevent domain search abuse
4. **Audit Logging** - Log all domain operations
5. **Two-Factor for Transfers** - Require 2FA for domain transfers
6. **WHOIS Privacy by Default** - Protect client information

---

## 📋 Implementation Order

```
Phase DM-01 → DM-02 → DM-03 → DM-04 → DM-05 → DM-06 → DM-07 → DM-08 → DM-09 → DM-10
   │            │         │         │         │         │         │         │         │
   │            │         │         │         │         │         │         │         └── White-label
   │            │         │         │         │         │         │         └── Email UI
   │            │         │         │         │         │         └── Titan Integration
   │            │         │         │         │         └── DNS UI
   │            │         │         │         └── Domain Dashboard
   │            │         │         └── Search & Registration
   │            │         └── Cloudflare Integration
   │            └── Database Schema
   └── ResellerClub API Client
```

---

## ✅ Success Criteria

1. **User can search and register a domain in under 2 minutes**
2. **DNS is automatically configured when connecting domain to site**
3. **Email accounts can be provisioned in under 1 minute**
4. **Agencies can set custom pricing for reselling**
5. **Zero manual intervention for standard operations**
6. **99.9% automation success rate**
7. **Clear error handling with recovery options**

---

## 🚀 Getting Started

To implement this system, start with **Phase DM-01** which establishes the ResellerClub API client foundation. Each subsequent phase builds upon the previous, creating a fully automated domain and email management system.

### AI Agent Instructions
When implementing each phase:
1. Read the memory bank files first
2. Follow the existing code patterns in systemPatterns.md
3. Use TypeScript strict mode
4. Create server actions in `src/lib/actions/`
5. Create API clients in `src/lib/` with proper error handling
6. Create UI components in `src/components/domains/` or `src/components/email/`
7. Add pages to `src/app/(dashboard)/dashboard/domains/`
8. Always run `npx tsc --noEmit` before committing
9. Update memory bank after each phase

---

## 📚 Reference Documentation

- [ResellerClub HTTP API Documentation](https://manage.resellerclub.com/kb/answer/744)
- [ResellerClub Business Email (EElite) API](https://manage.resellerclub.com/kb/answer/2155)
- [ResellerClub DNS API](https://manage.resellerclub.com/kb/answer/829)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [DRAMAC System Patterns](../../memory-bank/systemPatterns.md)
- [DRAMAC Tech Context](../../memory-bank/techContext.md)

---

## ⚠️ IMPORTANT NOTES

### ResellerClub Unified API
**ALL operations go through ResellerClub's unified HTTP API:**
- Base URL: `https://httpapi.com/api/`
- **Domains**: `/api/domains/` endpoints
- **Contacts**: `/api/contacts/` endpoints  
- **Business Email (Titan)**: `/api/eelite/` endpoints
- **DNS**: `/api/dns/` endpoints

**DO NOT** use separate Titan website/API - everything is handled via ResellerClub!

### Phase Independence
Each phase is designed to be implemented independently by different AI agents.
Ensure you:
1. Read ALL memory bank files before starting
2. Check for existing implementations to avoid conflicts
3. Follow established patterns in `systemPatterns.md`
4. Test in isolation before integration
