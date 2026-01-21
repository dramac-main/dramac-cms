# Database Schema Reference for AI Agents

> ⚠️ **CRITICAL: AI agents MUST reference this document before implementing ANY phase**

This document contains the **ACTUAL** database table names. Phase documents may contain outdated or incorrect table names. Always use the names from this reference.

## Last Updated: January 18, 2026

---

## 🚨 COMMON MISTAKES TO AVOID

| ❌ DO NOT USE (Old/Wrong) | ✅ USE INSTEAD (Correct) |
|---------------------------|--------------------------|
| `modules` | `modules_v2` |
| `site_modules` | `site_module_installations` |
| `module_subscriptions` | `agency_module_subscriptions` |
| `billing_subscriptions` | `subscriptions` |
| `billing_customers` | ❌ Does NOT exist - use `agencies.stripe_customer_id` |
| `billing_invoices` | `invoices` |

---

## 📋 Complete Table List (Actual Database Schema)

### Core Tables
| Table Name | Description |
|------------|-------------|
| `agencies` | Agency/organization accounts (has `stripe_customer_id`, `stripe_subscription_id`) |
| `agency_members` | Users belonging to agencies |
| `profiles` | User profiles |
| `clients` | Client accounts managed by agencies |

### Site Management
| Table Name | Description |
|------------|-------------|
| `sites` | Websites |
| `pages` | Site pages |
| `page_content` | Page content/sections JSON |
| `templates` | Reusable templates |
| `assets` | Uploaded files |
| `media_folders` | Media organization |
| `media_usage` | Track where media is used |

### Module System
| Table Name | Description |
|------------|-------------|
| `modules_v2` | Module definitions (NOT `modules`) |
| `module_versions` | Version history |
| `module_source` | Source code storage |
| `site_module_installations` | Modules installed on sites (NOT `site_modules`) |
| `agency_module_installations` | Modules available to agency |
| `agency_module_subscriptions` | Agency subscriptions to paid modules (NOT `module_subscriptions`) |
| `client_module_installations` | Modules available to clients |
| `module_analytics` | Usage analytics |
| `module_deployments` | Deployment history |
| `module_error_logs` | Error tracking |
| `module_usage_events` | Usage events |
| `module_requests` | Feature/module requests |
| `module_request_votes` | Votes on requests |
| `module_reviews` | User reviews |

### Billing & Subscriptions
| Table Name | Description |
|------------|-------------|
| `subscriptions` | Agency plan subscriptions - **Uses LemonSqueezy** |
| `invoices` | Invoice records - **Uses LemonSqueezy** |
| `agency_module_subscriptions` | Module subscriptions - **Uses LemonSqueezy** |

**⚠️ UNIFIED BILLING SYSTEM (LemonSqueezy Only):**
| Purpose | Provider | Fields |
|---------|----------|--------|
| Agency Plans (Pro, Enterprise) | **LemonSqueezy** | `subscriptions.lemonsqueezy_*` |
| Module Marketplace | **LemonSqueezy** | `agency_module_subscriptions.lemon_*` |

**Note:** Stripe is NOT used (not available in Zambia). All billing goes through LemonSqueezy.

### Blog System
| Table Name | Description |
|------------|-------------|
| `blog_posts` | Blog posts |
| `blog_categories` | Blog categories |
| `blog_post_categories` | Many-to-many relationship |

### SEO
| Table Name | Description |
|------------|-------------|
| `site_seo_settings` | Site-level SEO settings |
| `seo_audits` | SEO audit results |

### Forms (Added Phase 82)
| Table Name | Description |
|------------|-------------|
| `form_submissions` | Form submission data |
| `form_settings` | Form configuration |
| `form_webhooks` | Webhook configurations |

### Activity & Notifications
| Table Name | Description |
|------------|-------------|
| `activity_log` | User activity tracking |
| `audit_logs` | Admin audit trail |
| `notifications` | User notifications |
| `notification_preferences` | User notification settings |
| `client_notifications` | Client-specific notifications |

### Support
| Table Name | Description |
|------------|-------------|
| `support_tickets` | Support tickets |
| `ticket_messages` | Ticket conversation messages |
| `client_site_permissions` | Client access to sites |

### System
| Table Name | Description |
|------------|-------------|
| `rate_limits` | API rate limiting |

---

## 🔑 Key Field Mappings

### Billing Integration (LemonSqueezy Only)

**Agency Plan Subscriptions:**
```
subscriptions.lemonsqueezy_customer_id      → LemonSqueezy Customer ID
subscriptions.lemonsqueezy_subscription_id  → LemonSqueezy Subscription ID
subscriptions.lemonsqueezy_variant_id       → LemonSqueezy Plan Variant
invoices.lemonsqueezy_order_id              → LemonSqueezy Order ID
```

**Module Subscriptions:**
```
agency_module_subscriptions.lemon_subscription_id  → LemonSqueezy Subscription ID
agency_module_subscriptions.lemon_customer_id      → LemonSqueezy Customer ID
agency_module_subscriptions.lemon_order_id         → LemonSqueezy Order ID
```

**Module LemonSqueezy Products (on `modules_v2`):**
```
modules_v2.lemon_product_id          → LemonSqueezy Product ID
modules_v2.lemon_variant_monthly_id  → Monthly subscription variant
modules_v2.lemon_variant_yearly_id   → Yearly subscription variant
```

### Module Pricing (on `modules_v2`)
```
modules_v2.wholesale_price_monthly  → Monthly wholesale price (NOT price_monthly)
modules_v2.wholesale_price_yearly   → Yearly wholesale price
modules_v2.suggested_retail_price   → Suggested retail price
modules_v2.is_free                  → Whether module is free
```

### SEO Audits
```
seo_audits.suggestions   → Array of suggestions (NOT recommendations)
```

---

## 📝 Type Helper Pattern

Always use the `Tables<>` helper from database types:

```typescript
// ✅ CORRECT
import { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type Module = Tables<"modules_v2">;
type ModuleInsert = TablesInsert<"modules_v2">;
type SiteModule = Tables<"site_module_installations">;

// ❌ WRONG - Don't import types directly
import { Module, SiteModule } from "@/types/database";
```

---

## 🔄 How to Verify Table Names

Before implementing a phase, verify table names exist:

1. Check `src/types/database.ts` for the `Tables` type
2. Or query Supabase directly: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

---

## 📌 Instructions for AI Agents

1. **ALWAYS** check this document before implementing database queries
2. **ALWAYS** verify table names exist in `src/types/database.ts`
3. **NEVER** assume table names from phase documents are correct
4. **REPORT** any discrepancies between phase docs and this reference
5. When in doubt, query the actual database schema

---

## ⚠️ Phase Documents That Need Table Name Updates

The following phases contain incorrect table names:

- **PHASE-59-RLS-SECURITY-AUDIT.md** - References `module_subscriptions`, `site_modules`
- **PHASE-63-SITE-CLONING.md** - References `site_modules`
- **PHASE-64-BACKUP-SYSTEM.md** - References `site_modules`
- **PHASE-65-EXPORT-IMPORT.md** - References `site_modules`, `modules`

AI agents implementing these phases should use the correct names from this reference.
