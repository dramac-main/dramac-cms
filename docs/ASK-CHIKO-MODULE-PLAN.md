# Ask Chiko as a Module — Recommendation Plan

## Context

"Ask Chiko" today is a hardcoded portal page (`/portal/ask-chiko`) wired into
the portal sidebar's main group. It uses Anthropic's Claude via `@ai-sdk/anthropic`
and the same `loadSiteOverviewContext` + customer context that powers the
website chat widget AI ("Chiko" / per-site assistant name).

This is fine for the MVP, but mixing it with the platform's first-class modules
means it can't be sold, billed, gated, or extended in a uniform way. This doc
recommends converting Ask Chiko into a proper DRAMAC CMS module.

## Recommendation: convert Ask Chiko into a module (`ask-chiko`)

The cleanest long-term shape is a registered module in `modules_v2` with the
slug `ask-chiko`. Pros and cons summarised below; details follow.

| Concern           | Today (hardcoded)                       | As a module                                                        |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------ |
| Billing           | Free for everyone; no path to monetise  | Per-tier pricing via `agency_module_subscriptions`                 |
| Permissions       | Always-on for portal users              | Gated by `site_module_installations.is_enabled` + role permissions |
| Surfaces          | Portal only                             | Portal + Agency dashboard + (optional) website widget              |
| Knowledge sources | Implicit (whatever the responder pulls) | Configurable per-install (which modules to read from)              |
| Telemetry         | Nothing                                 | Standard module event log + automation hooks                       |
| Removal           | Code change                             | Uninstall through the standard module UI                           |
| Onboarding        | Implicit                                | Same install/seed/permissions flow as other modules                |

## Architecture

### 1. Module definition (`modules_v2` row)

```sql
INSERT INTO modules_v2 (slug, name, description, category, default_permissions)
VALUES (
  'ask-chiko',
  'Ask Chiko',
  'Conversational AI assistant for portal users — answers questions about the site, products, services, billing, and bookings.',
  'productivity',
  jsonb_build_object(
    'canUseAskChiko', true,
    'canConfigureAskChiko', false
  )
);
```

### 2. Install hooks

Reuse the existing `installCoreModules` plumbing in `lib/actions/sites.ts`:

- `seedAskChikoSettings(siteId)` — create a row in a new
  `mod_ask_chiko_settings` table with defaults: `is_enabled`, `tone`,
  `custom_instructions`, `allowed_data_sources` (jsonb), `monthly_message_quota`,
  `messages_used_this_month`.
- Permissions are seeded into the agency's role templates so portal admins
  can grant `canUseAskChiko` / `canConfigureAskChiko` independently.

### 3. Surfaces

- **Portal** (`/portal/ask-chiko`): existing page, gated on
  `hasModule("ask-chiko") && permissions.canUseAskChiko`. Shown in sidebar via
  `portal-navigation.ts` only when the module is installed.
- **Agency dashboard** (`/dashboard/sites/[siteId]/ask-chiko`): the per-site
  configuration surface — tone, custom instructions, data sources, quota.
  Mirrors the structure of the live-chat AI settings page.
- **Super-admin** (`/admin/modules/ask-chiko`): platform-wide defaults,
  pricing, model selection, hard quotas.
- **(Optional) Website widget**: an "Ask Chiko" floating button visitors can
  use. Out of scope for v1 of the module — handled by the existing
  `live-chat` module.

### 4. Per-tier permissions

| Tier   | `canUseAskChiko` | `canConfigureAskChiko` | Quota                        |
| ------ | ---------------- | ---------------------- | ---------------------------- |
| Owner  | yes              | yes                    | unlimited (uses agency pool) |
| Editor | yes              | no                     | shared agency pool           |
| Member | yes              | no                     | shared agency pool           |
| Viewer | no               | no                     | n/a                          |

Quotas are enforced by the same metering used for live-chat AI: increment a
counter on `mod_ask_chiko_settings` per response and short-circuit when over.

### 5. Migration plan

1. Land migration creating `modules_v2` row + `mod_ask_chiko_settings` table.
2. Backfill: insert a default `mod_ask_chiko_settings` row for every existing
   site, and an enabled `site_module_installations` row so all current users
   keep access during the transition.
3. Update `portal-navigation.ts` to gate the Ask Chiko nav entry behind
   `hasModule("ask-chiko")`.
4. Add the agency dashboard configuration page.
5. Document in `/phases/` and `memory-bank/`.

## When to do this

This is the next bulky workstream after the current portal/Chiko polish work
ships. It doesn't block any existing feature, and the current hardcoded version
already works — the upgrade is purely about platform consistency, billing,
and per-tenant control.

## Risks

- Migration must keep current Ask Chiko access seamless. Backfill logic above
  handles this; verify with the staging snapshot before running in production.
- The website-widget Chiko AI and the portal Ask Chiko share prompt-building
  logic. When this module lands, factor `loadSiteOverviewContext` and the
  prompt builder into a shared `live-chat-shared` package consumed by both
  modules.
