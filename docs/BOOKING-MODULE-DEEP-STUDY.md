# BOOKING MODULE — COMPREHENSIVE DEEP STUDY

> **Generated:** 2026-02-XX  
> **Module ID:** `booking` | **Short ID:** `bookmod01` | **Table Prefix:** `mod_bookmod01_`  
> **Phase:** EM-51 (Booking Module) + PHASE-UI-15 (UI Enhancement)  
> **Stack:** Next.js 16, React 19, TypeScript, Supabase (PostgreSQL), Tailwind CSS  
> **Supabase Project:** `nfirsqmyxmmtbignofgb`

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Complete File Inventory](#2-complete-file-inventory)
3. [Database Schema](#3-database-schema)
4. [RLS Policies & Security](#4-rls-policies--security)
5. [Booking Lifecycle — End-to-End Flow](#5-booking-lifecycle--end-to-end-flow)
6. [Public Booking Widget — Step-by-Step Flow](#6-public-booking-widget--step-by-step-flow)
7. [Admin Dashboard — All Views & Features](#7-admin-dashboard--all-views--features)
8. [Availability & Scheduling Logic](#8-availability--scheduling-logic)
9. [Staff Management](#9-staff-management)
10. [Notification & Email System](#10-notification--email-system)
11. [Embed System](#11-embed-system)
12. [Studio Component Registration](#12-studio-component-registration)
13. [Module Installation & Lifecycle](#13-module-installation--lifecycle)
14. [Public vs Admin Component Separation](#14-public-vs-admin-component-separation)
15. [Hardcoded Colors Audit](#15-hardcoded-colors-audit)
16. [Bugs, Issues & Technical Debt](#16-bugs-issues--technical-debt)
17. [Missing Features](#17-missing-features)
18. [All Routes](#18-all-routes)
19. [Manifest & Pricing](#19-manifest--pricing)
20. [Architecture Diagram](#20-architecture-diagram)

---

## 1. EXECUTIVE SUMMARY

The **Booking Module** is a full-featured appointment scheduling system within the DRAMAC CMS platform. It provides:

- **Multi-step booking wizard** (5 steps: Service → Staff → Date/Time → Details → Confirm)
- **Admin dashboard** with 7 tab views (Calendar, Appointments, Services, Staff, Analytics, Settings, Embed)
- **Embeddable widget** via iframe/script/shortcode for external websites
- **Real-time availability** with conflict detection, buffer times, and timezone handling
- **Email notifications** to both business owner and customer (parallel dispatch)
- **CRM integration** (auto-creates CRM contacts on booking)
- **DRAMAC Studio integration** with 6 visual blocks and 50+ customizable properties
- **3-tier pricing** model (Starter $19/mo, Professional $49/mo, Business $99/mo)

**Architecture pattern:** Server Actions + React Context + Hooks. No REST API routes — all data flows through Next.js Server Actions. Public operations use `createAdminClient()` (bypasses RLS), while dashboard operations use `createClient()` (respects RLS).

---

## 2. COMPLETE FILE INVENTORY

### 2.1 Root Files

| File | Lines | Purpose |
|------|-------|---------|
| `index.ts` | ~30 | Main module barrel export — re-exports manifest, types, context, actions, hooks, studio components |
| `manifest.ts` | 499 | Module metadata, schema, features, permissions (17), settings schema, navigation, API routes, webhooks (7), lifecycle hooks, pricing plans |

### 2.2 Types

| File | Lines | Purpose |
|------|-------|---------|
| `types/booking-types.ts` | 505 | ALL type definitions — Service, Staff, StaffService, Calendar, Availability, Appointment, Reminder, BookingSettings, TimeSlot, BookingSearchResult, BookingContextValue, BookingStats + all Input/Update variants. Constants: DAY_NAMES, APPOINTMENT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG |

**Key Type Aliases:**
- `AppointmentStatus`: `'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'`
- `PaymentStatus`: `'pending' | 'paid' | 'refunded' | 'failed' | 'not_required'`
- `ReminderType`: `'email' | 'sms' | 'push'`
- `ReminderStatus`: `'pending' | 'sent' | 'failed'`
- `CalendarType`: `'staff' | 'resource' | 'shared'`
- `AvailabilityRuleType`: `'weekly' | 'specific_date' | 'exception' | 'break'`

### 2.3 Actions (Server Actions)

| File | Lines | Purpose |
|------|-------|---------|
| `actions/booking-actions.ts` | 1319 | **Main authenticated actions** — 30+ functions for CRUD on all entities. Uses `createClient()` (RLS-bound). Includes: getServices, getStaff (with staff_services join), getAppointments, getCalendars, getAvailability, getSettings, getAvailableSlots, checkSlotAvailability, getBookingStats, searchBookings, initializeBookingForSite, CRUD for services/staff/appointments/calendars/availability/reminders, assignStaffToService, removeStaffFromService, cancelAppointment (calls `notifyBookingCancelled`), updateAppointmentStatus |
| `actions/public-booking-actions.ts` | 552 | **Public-facing actions** — Uses `createAdminClient()` (service role, bypasses RLS). Functions: getPublicServices (active + online only), getPublicStaff (active + accepting bookings), getPublicSettings, getPublicAvailableSlots (with comprehensive validation), createPublicAppointment (with server-side conflict checking, min notice, max advance, weekday-aware fallback, buffer times, CRM contact creation, calls `notifyNewBooking`) |
| `actions/auto-setup-actions.ts` | 257 | **Auto page creation** — `createBookingPages()` creates a `/book` page with BookingWidget content JSON and adds it to site navigation. `deleteBookingPages()` removes them. Called during module install/uninstall. |

### 2.4 Context Providers

| File | Lines | Purpose |
|------|-------|---------|
| `context/booking-context.tsx` | ~350 | **Dashboard context** — `BookingProvider` wraps the admin dashboard. Loads all services, staff, appointments, calendars, availability, settings, and reminders. Provides full CRUD methods (addService, editService, removeService, etc.). Exports convenience hooks: `useBooking()`, `useAppointment(id)`, `useService(id)`, `useStaffMember(id)`, `useAppointmentsForDate(date)`, `useStaffAppointments(staffId)`. Calls `refreshAll()` after mutations. |
| `context/booking-storefront-context.tsx` | ~120 | **Public storefront context** — `BookingStorefrontProvider` wraps public booking pages. Stores settings, currency, timezone, time_format. Provides `formatCurrency()`, `formatTime()` helpers. |

### 2.5 Hooks

| File | Lines | Purpose |
|------|-------|---------|
| `hooks/index.ts` | ~15 | Barrel re-export for all hooks |
| `hooks/useBookingServices.ts` | ~40 | Fetches public services via `getPublicServices`. Returns `{ services, loading, error }` |
| `hooks/useBookingStaff.ts` | ~40 | Fetches public staff via `getPublicStaff`. Returns `{ staff, loading, error }` |
| `hooks/useBookingSlots.ts` | ~60 | Fetches available time slots. Uses `toLocalDateString()` to prevent timezone date-shift bug. Returns `{ slots, loading, error }` |
| `hooks/useBookingSettings.ts` | ~40 | Fetches public settings. Returns `{ settings, loading, error }` |
| `hooks/useCreateBooking.ts` | ~55 | Creates appointments via `createPublicAppointment`. Returns `{ createBooking, loading, error, appointment }` — returns minimal Appointment shape |
| `hooks/installation-hook.ts` | ~50 | `ModuleInstallationHook` — `onInstall()`: creates /book page + adds nav item. `onUninstall()`: removes page + nav item. |

### 2.6 Dashboard Components

| File | Lines | Purpose |
|------|-------|---------|
| `components/booking-dashboard.tsx` | ~400 | **Main dashboard shell** — Tab navigation (Calendar, Appointments, Services, Staff, Analytics, Settings, Embed), summary stats row (total/today's/pending/completed), create dialogs, detail sheets |
| `components/BookingDashboardEnhanced.tsx` | 678 | **Enhanced dashboard** — Advanced filtering, animated metric cards (framer-motion), quick actions panel, expanded summary with revenue/utilization |

### 2.7 Views (Dashboard Tabs)

| File | Lines | Purpose |
|------|-------|---------|
| `views/calendar-view.tsx` | 422 | **Week/Day calendar** — Time grid with hourly slots, staff filter sidebar, appointment rendering with color-coded status bars, click-to-create |
| `views/appointments-view.tsx` | 508 | **Appointments list** — Filterable by status/date range/staff/service, search, bulk status update, sortable table, appointment detail sheet on click |
| `views/services-view.tsx` | 357 | **Service management** — Search, status filter, grid/list toggle, service cards with color dot/price/duration/staff count, CRUD actions |
| `views/staff-view.tsx` | 476 | **Staff management** — Grid/list views, search, status filter, staff cards with avatar/services count/booking toggle, CRUD actions |
| `views/analytics-view.tsx` | 601 | **Analytics dashboard** — Date range selector, stat cards (total appointments, revenue, unique customers, avg duration, completion rate, popular service), charts placeholder area |
| `views/settings-view.tsx` | 631 | **Settings form** — 5 tabs (General, Booking Rules, Notifications, Appearance, Payments). General: business name, currency (SUPPORTED_CURRENCIES from locale-config), timezone (African-first list), time format, accent color. Booking Rules: slot interval, min notice, max advance, cancellation notice, auto-confirm. Notifications: confirmation emails, notification email, CRM auto-create. |
| `views/embed-code-view.tsx` | 530 | **Embed code generator** — Widget type selection (Full Widget, Service List, Calendar, Staff Grid), appearance config (accent color, dark mode, font, border radius, header toggle), outputs iframe/script/shortcode code with copy buttons |

### 2.8 Dialogs

| File | Lines | Purpose |
|------|-------|---------|
| `dialogs/create-appointment-dialog.tsx` | 390 | Create new appointment — service/staff/date/time selects, customer info form. Smart status logic: `require_confirmation` → pending, else → confirmed (respects `auto_confirm` setting). Calculates end_time from service duration. |
| `dialogs/create-service-dialog.tsx` | 242 | Create new service — name, description, duration, price (with DEFAULT_CURRENCY_SYMBOL), color picker, max attendees, online booking toggle, require confirmation toggle |
| `dialogs/create-staff-dialog.tsx` | 217 | Add staff member — name, email, phone, bio, timezone selector (US/EU/Asia/AU timezones), accept bookings toggle |
| `dialogs/edit-service-dialog.tsx` | 291 | Edit service — Same fields as create + buffer before/after (min), category field. Loads existing data on open. |
| `dialogs/edit-staff-dialog.tsx` | 319 | Edit staff — Same fields as create + **service assignment** section with checkboxes. Uses `assignStaffToService`/`removeStaffFromService` for junction table management. Calls `refreshAll()` after save. |
| `dialogs/booking-settings-dialog.tsx` | 375 | Settings dialog — 3 tabs (General, Booking Rules, Notifications). General: business name, currency (SUPPORTED_CURRENCIES), timezone (African-first list), time format, accent color. Rules: slot interval, min/max notice, cancellation, auto-confirm. Notifications: confirmation emails, notification email, CRM auto-create. |

### 2.9 Sheets (Slide-out Detail Panels)

| File | Lines | Purpose |
|------|-------|---------|
| `sheets/appointment-detail-sheet.tsx` | 501 | Appointment detail view — Date/time display, customer info (name, email link, phone link), service card, staff member, inline status editing, payment status management (5 statuses with update), inline notes editing, delete with confirmation |
| `sheets/service-detail-sheet.tsx` | 263 | Service detail — Status toggle, price/duration display, buffer times, category badge, assigned staff list, appointment stats (completed/upcoming), edit/delete actions |
| `sheets/staff-detail-sheet.tsx` | 309 | Staff detail — Avatar with initials fallback, status toggle, contact info (email/phone/timezone), assigned services list, performance stats (completed/upcoming/total/completion rate), edit/delete actions |

### 2.10 UI Components

| File | Lines | Purpose |
|------|-------|---------|
| `ui/index.ts` | ~85 | Barrel exports for all UI components |
| `ui/appointment-card.tsx` | 485 | Appointment card — Default/compact variants, status badges with color config, payment status indicators, customer info, service/staff display, dropdown actions (view/confirm/cancel/reschedule), framer-motion animation |
| `ui/service-card.tsx` | 492 | Service card — Grid/list variants, color dot, price/duration/max attendees, assigned staff avatars, booking count, dropdown actions (view/edit/delete/toggle active), framer-motion |
| `ui/staff-card.tsx` | 571 | Staff card — Grid/list/compact variants, avatar with initials, assigned services badges, upcoming/today appointments, working hours display, dropdown actions, framer-motion |
| `ui/booking-metric-card.tsx` | 406 | Animated metric card — 8 variants (appointments/revenue/utilization/customers/services/staff/pending/warning), animated number counter (spring physics), sparkline data support, trend indicators (up/down/neutral), skeleton loading |
| `ui/calendar-timeline.tsx` | 437 | Weekly calendar timeline — Week navigation, day columns, hour rows (8am-8pm default), appointment blocks with position calculation, status color-coded, today highlight, click handlers for slots |
| `ui/booking-filter-bar.tsx` | 597 | Filter bar — Search with debounce, status/service/staff/date-range filters, sort dropdown, view mode toggle (grid/list/calendar), active filter count badge, clear all button |
| `ui/booking-quick-actions.tsx` | 333 | Quick action grid — 4 variant styles (default/primary/success/warning), 2-4 column grid, card or inline mode, framer-motion hover/tap animations |
| `ui/availability-alert.tsx` | 456 | Availability alerts — 4 issue types (overbooking/low_availability/staff_unavailable/no_staff), 2 severity levels (warning/critical), compact/full modes, dismissible, action buttons, banner variant for pending appointments |

### 2.11 Studio Components (DRAMAC Visual Editor)

| File | Lines | Purpose |
|------|-------|---------|
| `studio/index.ts` | ~250 | Exports all 6 studio component definitions + 2 custom field editors (ServiceSelectorField, StaffSelectorField) |
| `studio/components/BookingWidgetBlock.tsx` | 1257 | **Main booking wizard** — 5-step multi-step form. 50+ customizable props (colors, typography, layout, effects). CSS variable branding (`var(--brand-primary, #8B5CF6)`). Demo data for Studio preview. Real booking creation. Recently-booked-slots tracking. 4 step indicator styles (dots/numbers/progress-bar/pills). 3 layouts (standard/compact/wide). AI suggestions for Studio. |
| `studio/components/ServiceSelectorBlock.tsx` | 758 | Service display — Grid/list/card views, search, category filter, price display, duration, max attendees, staff avatars, selection state |
| `studio/components/BookingCalendarBlock.tsx` | 742 | Calendar date/time picker — Monthly calendar, available dates highlighting, time slot grid, selected date/time state, timezone display |
| `studio/components/BookingFormBlock.tsx` | 768 | Customer details form — Configurable fields (name/email/phone/notes), validation, custom field support, privacy notice |
| `studio/components/StaffGridBlock.tsx` | 783 | Staff display grid — Avatar/bio/services, search/filter, selection state, "Any staff" option |
| `studio/components/BookingEmbedBlock.tsx` | 599 | Embed preview — Widget type tabs, appearance config, live preview, code output |

### 2.12 App Routes

| File | Lines | Purpose |
|------|-------|---------|
| `app/dashboard/sites/[siteId]/booking/page.tsx` | ~30 | Dashboard booking page — Server component, extracts siteId, wraps `BookingDashboard` in `Suspense` |
| `app/embed/booking/[siteId]/page.tsx` | 326 | **Public embed endpoint** — Server component. Verifies module installation, fetches services/staff/settings via admin client, renders standalone HTML with CSS variables (`--primary`, `--primary-text`), Google Fonts integration, PostMessage bridge for parent communication, ResizeObserver for auto-height iframe, responsive `@media` breakpoints |

### 2.13 Related External Files

| File | Lines | Key Content |
|------|-------|-------------|
| `lib/services/business-notifications.ts` | 821 | `notifyNewBooking()` — Sends 3 notifications: (1) in-app to business owner, (2) email to owner (booking_confirmation_owner template), (3) email to customer (booking_confirmation_customer template with site branding). Emails sent in parallel via `Promise.all()`. Also contains `notifyBookingCancelled()`. |

---

## 3. DATABASE SCHEMA

### 3.1 mod_bookmod01_services (19 columns)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `site_id` | uuid | NOT NULL | FK → sites |
| `name` | text | NOT NULL | |
| `slug` | text | | Auto-generated from name |
| `description` | text | | |
| `category` | text | | For grouping/filtering |
| `duration_minutes` | integer | 60 | |
| `buffer_before_minutes` | integer | 0 | Buffer time before appointment |
| `buffer_after_minutes` | integer | 0 | Buffer time after appointment |
| `price` | numeric | | |
| `currency` | text | 'USD' | |
| `max_attendees` | integer | 1 | Group booking support |
| `allow_online_booking` | boolean | true | Public visibility flag |
| `require_confirmation` | boolean | false | Manual approval needed |
| `require_payment` | boolean | false | Payment required to book |
| `color` | text | '#3B82F6' | ⚠️ Hardcoded blue |
| `image_url` | text | | |
| `sort_order` | integer | 0 | |
| `is_active` | boolean | true | Soft delete flag |
| `custom_fields` | jsonb | | Extensible data |
| `created_by` | uuid | | |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

### 3.2 mod_bookmod01_staff (14 columns)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `site_id` | uuid | NOT NULL | |
| `user_id` | uuid | | Links to auth.users (optional) |
| `name` | text | NOT NULL | |
| `email` | text | | |
| `phone` | text | | |
| `avatar_url` | text | | |
| `bio` | text | | |
| `default_availability` | jsonb | | Working hours config |
| `timezone` | text | 'UTC' | |
| `accept_bookings` | boolean | true | |
| `is_active` | boolean | true | |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

### 3.3 mod_bookmod01_staff_services (7 columns — Junction Table)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `site_id` | uuid | NOT NULL | |
| `staff_id` | uuid | NOT NULL | FK → staff |
| `service_id` | uuid | NOT NULL | FK → services |
| `custom_price` | numeric | | Override service price |
| `custom_duration_minutes` | integer | | Override service duration |
| `created_at` | timestamptz | now() | |

### 3.4 mod_bookmod01_appointments (28 columns)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `site_id` | uuid | NOT NULL | |
| `service_id` | uuid | NOT NULL | FK → services |
| `staff_id` | uuid | | Optional — "any staff" |
| `calendar_id` | uuid | | |
| `customer_name` | text | NOT NULL | |
| `customer_email` | text | | |
| `customer_phone` | text | | |
| `customer_notes` | text | | |
| `crm_contact_id` | uuid | | FK → CRM module |
| `start_time` | timestamptz | NOT NULL | |
| `end_time` | timestamptz | NOT NULL | |
| `timezone` | text | 'UTC' | Customer's timezone |
| `status` | text | 'pending' | pending/confirmed/completed/cancelled/no_show |
| `cancelled_at` | timestamptz | | |
| `cancelled_by` | text | | |
| `cancellation_reason` | text | | |
| `payment_status` | text | 'pending' | pending/paid/refunded/failed/not_required |
| `payment_amount` | numeric | | |
| `payment_id` | text | | External payment reference |
| `recurring_id` | uuid | | For recurring bookings |
| `recurring_rule` | text | | iCal RRULE format |
| `reminder_sent_at` | timestamptz | | |
| `metadata` | jsonb | | |
| `custom_fields` | jsonb | | |
| `created_by` | uuid | | |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

### 3.5 mod_bookmod01_calendars (12 columns)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `site_id` | uuid | NOT NULL | |
| `name` | text | NOT NULL | |
| `description` | text | | |
| `type` | text | 'staff' | staff/resource/shared |
| `staff_id` | uuid | | Links to staff |
| `timezone` | text | | |
| `external_calendar_url` | text | | iCal sync URL |
| `external_calendar_type` | text | | google/outlook/ical |
| `last_synced_at` | timestamptz | | |
| `is_active` | boolean | true | |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

### 3.6 mod_bookmod01_availability (13 columns)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `site_id` | uuid | NOT NULL | |
| `calendar_id` | uuid | | |
| `staff_id` | uuid | | |
| `service_id` | uuid | | |
| `rule_type` | text | | weekly/specific_date/exception/break |
| `day_of_week` | integer | | 0=Sunday, 6=Saturday |
| `start_time` | time | | HH:MM:SS format |
| `end_time` | time | | |
| `specific_date` | date | | For date-specific rules |
| `valid_from` | date | | Rule effective start |
| `valid_until` | date | | Rule effective end |
| `priority` | integer | 0 | Higher priority overrides lower |
| `label` | text | | "Lunch Break", etc. |
| `created_at` | timestamptz | now() | |

### 3.7 mod_bookmod01_reminders (11 columns)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `site_id` | uuid | NOT NULL | |
| `appointment_id` | uuid | NOT NULL | FK → appointments |
| `send_at` | timestamptz | NOT NULL | Scheduled send time |
| `type` | text | | email/sms/push |
| `status` | text | 'pending' | pending/sent/failed |
| `sent_at` | timestamptz | | Actual send time |
| `error` | text | | Error message if failed |
| `subject` | text | | |
| `body` | text | | |
| `created_at` | timestamptz | now() | |

### 3.8 mod_bookmod01_settings (21 columns)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `site_id` | uuid | NOT NULL | UNIQUE |
| `business_name` | text | | |
| `timezone` | text | 'UTC' | |
| `date_format` | text | | |
| `time_format` | text | | 12h or 24h |
| `min_booking_notice_hours` | integer | 24 | |
| `max_booking_advance_days` | integer | 90 | |
| `cancellation_notice_hours` | integer | 24 | |
| `slot_interval_minutes` | integer | 30 | |
| `reminder_hours` | jsonb | [24, 1] | Array of hours before appointment |
| `auto_confirm` | boolean | false | |
| `confirmation_email_enabled` | boolean | true | |
| `accent_color` | text | '#3B82F6' | ⚠️ Hardcoded blue |
| `logo_url` | text | | |
| `require_payment` | boolean | false | |
| `payment_provider` | text | | |
| `notification_email` | text | | Override email for notifications |
| `auto_create_crm_contact` | boolean | true | |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

---

## 4. RLS POLICIES & SECURITY

**Total: 33 RLS policies across 8 tables.**

### Access Pattern Summary

| Table | Public SELECT | Public INSERT | Auth SELECT | Auth UPDATE | Auth DELETE |
|-------|--------------|---------------|-------------|-------------|-------------|
| services | ✅ (active + online) | ❌ | ✅ (site access) | ✅ (owner/admin/member) | ✅ (owner/admin) |
| staff | ✅ (active + accepting) | ❌ | ✅ (site access) | ✅ (owner/admin/member) | ✅ (owner/admin) |
| staff_services | ❌ ⚠️ | ❌ | ✅ (site access) | ✅ (owner/admin/member) | ✅ (owner/admin) |
| appointments | ❌ | ✅ (anyone) | ✅ (site access) | ✅ (owner/admin/member) | ✅ (owner/admin) |
| calendars | ❌ | ❌ | ✅ (site access) | ✅ (owner/admin/member) | ✅ (owner/admin) |
| availability | ✅ (all rows) | ❌ | ✅ (site access) | ✅ (owner/admin/member) | ✅ (owner/admin) |
| reminders | ❌ | ❌ | ✅ (site access) | ✅ (owner/admin/member) | ✅ (owner/admin) |
| settings | ❌ | ❌ | ✅ (site access) | ✅ (owner/admin/member) | ✅ (owner/admin) |

### Key Security Notes

1. **`staff_services` has NO public SELECT policy** — This means the public booking widget cannot query which staff provide which service via the regular Supabase client. This is mitigated because `public-booking-actions.ts` uses `createAdminClient()` which bypasses RLS entirely.

2. **Appointments allow public INSERT** — Anyone can create appointments via the public booking page. The `createPublicAppointment` server action has comprehensive server-side validation (site existence, service existence, min notice, max advance, conflict checking with buffers).

3. **Availability is fully public** — SELECT policy uses `USING (true)`, meaning all availability rules are readable by anyone. This is intentional for the public booking widget to check available slots.

4. **Settings are NOT public** — Public settings are fetched via `getPublicSettings()` which uses admin client and returns only safe fields (timezone, time_format, slot_interval, min_notice, max_advance, accent_color, business_name).

---

## 5. BOOKING LIFECYCLE — END-TO-END FLOW

### 5.1 Module Installation
```
1. User installs booking module for a site
2. installation-hook.ts → onInstall() runs:
   a. auto-setup-actions.ts → createBookingPages(siteId)
      - Creates a new page with path '/book'
      - Sets page content JSON with BookingWidget component
      - Adds 'Book' nav item to site navigation
   b. booking-actions.ts → initializeBookingForSite(siteId)
      - Creates default settings row (timezone UTC, slot_interval 30, accent_color #3B82F6)
      - Does NOT create sample services/staff
```

### 5.2 Admin Setup
```
1. Admin goes to /dashboard/sites/[siteId]/booking
2. BookingDashboard loads → BookingProvider initializes
3. Provider fetches all: services, staff, appointments, calendars, availability, settings, reminders
4. Admin creates services via CreateServiceDialog
5. Admin creates staff via CreateStaffDialog
6. Admin assigns staff to services via EditStaffDialog (checkbox list)
7. Admin configures settings via BookingSettingsDialog (timezone, currency, slot interval, etc.)
8. Admin optionally configures availability rules
```

### 5.3 Public Booking (Customer Flow)
```
1. Customer visits /book page on published site
2. DRAMAC Studio renderer loads BookingWidgetBlock
3. Widget initializes:
   a. useBookingServices() → getPublicServices(siteId) → active + online services
   b. useBookingStaff() → getPublicStaff(siteId) → active + accepting staff
   c. useBookingSettings() → getPublicSettings(siteId) → safe settings subset
4. Customer selects service (Step 1)
5. Customer selects staff or "Any Available" (Step 2)
6. Widget fetches slots:
   a. useBookingSlots(siteId, serviceId, selectedDate, staffId)
   b. → getPublicAvailableSlots() server action
   c. Server checks: availability rules, existing appointments, buffer times
   d. Returns array of {start_time, end_time, available: boolean}
7. Customer picks date + time (Step 3)
8. Customer fills details form (Step 4): name, email, phone, notes
9. Customer reviews summary (Step 5) and confirms
10. useCreateBooking() → createPublicAppointment() server action:
    a. Validates: siteId, serviceId, customer name, start_time
    b. Enforces min_booking_notice_hours
    c. Enforces max_booking_advance_days
    d. Server-side conflict check with buffer times
    e. Determines status: require_confirmation → pending, else → confirmed (or uses auto_confirm setting)
    f. Inserts appointment row
    g. If auto_create_crm_contact: finds or creates CRM contact
    h. Async (non-blocking): notifyNewBooking() 
       → In-app notification to owner
       → Email to owner (parallel)
       → Email to customer (parallel)
    i. Returns appointment object
11. Widget shows success screen with booking reference
```

### 5.4 Admin Management
```
1. Admin views appointments in Calendar or Appointments view
2. Click appointment → AppointmentDetailSheet opens
3. Admin can:
   - Change status (pending → confirmed → completed)
   - Update payment status (pending → paid → refunded)
   - Edit notes inline
   - Delete appointment
4. Cancel flow:
   - cancelAppointment(siteId, appointmentId, reason)
   - Sets status='cancelled', cancelled_at, cancelled_by, cancellation_reason
   - Async: notifyBookingCancelled()
```

---

## 6. PUBLIC BOOKING WIDGET — STEP-BY-STEP FLOW

**Component:** `BookingWidgetBlock.tsx` (1257 lines)

### Steps Configuration
```typescript
const STEPS = [
  { id: 'service', label: stepServiceLabel || 'Service' },
  { id: 'staff', label: stepStaffLabel || 'Staff' },     // Skippable if showStaffStep=false
  { id: 'datetime', label: stepDateLabel || 'Date & Time' },
  { id: 'details', label: stepDetailsLabel || 'Details' },
  { id: 'confirm', label: stepConfirmLabel || 'Confirm' },
]
```

### Step Indicator Styles
- **Dots** — Simple dot indicators with active/completed/inactive colors
- **Numbers** — Numbered circles (1, 2, 3...)
- **Progress Bar** — Continuous progress bar showing completion %
- **Pills** — Labeled pill buttons showing step names

### Step 1: Service Selection
- Displays services in cards with: name, description, duration, price
- Color dot from service.color
- Price formatted via `Intl.NumberFormat` with site currency
- Selection highlights card with `cardSelectedBorderColor`/`cardSelectedBgColor`
- If `serviceId` prop is set → auto-selects and can skip
- If `autoAdvance` → auto-advances after selection

### Step 2: Staff Selection (Optional)
- Shows staff grid with: avatar/initials, name, bio
- "Any Available Staff" option always shown
- Filtered to only staff who provide the selected service
- Skipped entirely if `showStaffStep=false`

### Step 3: Date & Time
- Calendar with month navigation
- Past dates disabled
- Available dates highlighted (only dates with available slots)
- Time slot grid for selected date
- Slot format respects `timeFormat` setting (12h/24h)
- Recently-booked slots tracked to prevent immediate re-booking before refetch

### Step 4: Customer Details
- Configurable fields: Name, Email, Phone, Notes
- Each can be shown/hidden and required/optional via props
- Client-side validation (required fields, email format)

### Step 5: Confirmation
- Summary of: service name, staff name, date/time, customer info
- Price display
- Confirm button triggers booking creation
- Loading state with spinner during submission
- Error display if booking fails
- Success screen with animation (checkmark + confetti style)

### Branding System
The widget uses CSS variables with fallback chain:
```
Primary color: prop.primaryColor → var(--brand-primary) → '#8B5CF6'
Text color: prop.textColor → var(--brand-text) → '#1f2937'
Background: prop.backgroundColor → var(--brand-background) → '#ffffff'
```

### Demo Data (Studio Preview)
When rendered inside the DRAMAC Studio editor (`isEditing=true`), the widget displays demo/placeholder data instead of making real API calls, showing sample services ("Consultation", "Follow-up", etc.) and staff.

---

## 7. ADMIN DASHBOARD — ALL VIEWS & FEATURES

### 7.1 Dashboard Shell (`booking-dashboard.tsx`)

**Tab Navigation:** Calendar | Appointments | Services | Staff | Analytics | Settings | Embed

**Summary Stats Row:**
- Total Appointments (all time)
- Today's Appointments
- Pending (needs confirmation)
- Completed

**Quick Actions:**
- Create Appointment → opens dialog
- Manage Services → switches to Services tab
- View Analytics → switches to Analytics tab

### 7.2 Calendar View
- **Week view** with day columns and hour rows (configurable start/end hours)
- **Day view** option
- Staff filter sidebar (show/hide individual staff)
- Appointments rendered as colored blocks positioned by time
- Status color coding: pending=amber, confirmed=green, completed=blue, cancelled=red, no_show=gray
- Click appointment → opens detail sheet
- Click empty slot → opens create appointment dialog pre-filled with date/time
- Week navigation (previous/next)
- Today button

### 7.3 Appointments View
- Searchable list with multiple filters:
  - Status (all/pending/confirmed/completed/cancelled/no_show)
  - Date range picker
  - Staff member dropdown
  - Service dropdown
- Sortable by date, customer name, status
- Each row shows: customer name, service, staff, date/time, status badge, payment badge
- Click row → appointment detail sheet
- Bulk actions (future consideration)

### 7.4 Services View
- Search bar
- Status filter (All/Active/Inactive)
- Grid/List toggle
- Service cards showing: color dot, name, description, duration, price, max attendees, staff count
- Dropdown actions: View, Edit, Delete, Toggle Active
- Click → service detail sheet

### 7.5 Staff View
- Search bar
- Status filter (All/Active/Inactive)
- Grid/List toggle
- Staff cards: avatar, name, bio, email, services count, booking toggle
- Dropdown actions: View, Edit, Delete
- Click → staff detail sheet

### 7.6 Analytics View
- Date range selector (Today, 7 days, 30 days, 90 days, Custom)
- Metric cards:
  - Total Appointments
  - Revenue (formatted with currency)
  - Unique Customers
  - Average Duration
  - Completion Rate (%)
  - Most Popular Service
- Charts area (placeholder — not yet implemented with real chart library)

### 7.7 Settings View
- 5 tabs: General, Booking Rules, Notifications, Appearance, Payments
- **General:** Business name, currency (supported currencies from locale-config), timezone (African-first list: Lusaka, Harare, Johannesburg, Nairobi, Lagos, Cairo + UTC + US/EU/Asia/AU), time format (12h/24h), accent color picker
- **Booking Rules:** Slot interval (15/30/60 min), min booking notice (hours), max advance booking (days), cancellation notice (hours), auto-confirm toggle
- **Notifications:** Confirmation email toggle, notification email override, auto-create CRM contact toggle
- **Appearance:** Accent color
- **Payments:** Payment provider, require payment toggle

### 7.8 Embed Code View
- Widget type selector: Full Widget, Service List, Calendar, Staff Grid
- Appearance config: accent color, dark mode toggle, font family, border radius, show header toggle
- Generated code in 3 formats:
  - **iframe** — `<iframe src="/embed/booking/[siteId]?type=...&accent=...">` 
  - **Script** — `<script src="/embed/booking-embed.js" data-site-id="...">` 
  - **Shortcode** — `[dramac-booking site="..." type="..."]`
- Copy button for each format

---

## 8. AVAILABILITY & SCHEDULING LOGIC

### 8.1 Slot Generation Algorithm

**`getPublicAvailableSlots()`** in `public-booking-actions.ts`:

```
Input: siteId, serviceId, dateStr (YYYY-MM-DD), staffId? (optional)

1. Fetch settings (slot_interval, min_notice, max_advance)
2. Fetch service (duration, buffer_before, buffer_after)
3. Fetch availability rules for the site
4. Fetch existing appointments for the date

5. Enforce min_booking_notice_hours:
   - Calculate cutoff = now + min_notice_hours
   - If requested date < cutoff date → return empty

6. Enforce max_booking_advance_days:
   - Calculate maxDate = now + max_advance_days
   - If requested date > maxDate → return empty

7. Determine working hours for the day:
   a. Check availability rules for specific_date matching dateStr
   b. If none → check weekly rules for day_of_week
   c. If none → use weekday fallback: Mon-Fri 09:00-17:00, Sat-Sun → no slots
   d. Filter by staff_id and service_id if applicable

8. Generate candidate slots:
   - Start from working_hours.start_time
   - Increment by slot_interval_minutes
   - End slot must be ≤ working_hours.end_time
   - Each slot: start_time + service.duration_minutes = end_time

9. Check each slot for conflicts:
   - For each existing appointment on this date:
     - Calculate appointment window = [start - buffer_before, end + buffer_after]
     - If candidate slot overlaps appointment window → mark unavailable
   - If staffId specified → only check that staff's appointments
   - If no staffId → check ALL staff appointments (any available)

10. Filter out past slots (start_time < now)

11. Return: Array<{ start_time: ISO string, end_time: ISO string, available: boolean }>
```

### 8.2 Timezone Handling

**Critical fix applied:** The `useBookingSlots` hook uses `toLocalDateString()` to convert the selected date to YYYY-MM-DD format using the local timezone, preventing the date-shift bug where UTC conversion could push the date forward/backward depending on the user's timezone offset.

**Server-side:** `getPublicAvailableSlots` constructs date boundaries using `new Date(dateStr + 'T00:00:00Z')` (UTC midnight) for the day boundaries query, then creates actual slot timestamps using `Date.UTC()` to ensure consistent timezone handling.

### 8.3 Dashboard vs Public Slot Calculation

⚠️ **Inconsistency found:** `getAvailableSlots()` in `booking-actions.ts` (dashboard version) uses a `parseTime()` helper that creates dates with local timezone (`new Date(date)`), while `getPublicAvailableSlots()` uses `parseTimeUTC()` that creates dates with `Date.UTC()`. This means the dashboard calendar and the public widget may show different available slots for the same date if the server timezone differs from UTC.

### 8.4 Buffer Time Logic

Buffer times create "protected windows" around appointments:
```
Service: 60min duration, 15min buffer_before, 10min buffer_after

Appointment at 2:00 PM → 3:00 PM

Protected window: 1:45 PM → 3:10 PM
  (2:00 - 15min buffer_before) to (3:00 + 10min buffer_after)

Any candidate slot overlapping this window is marked unavailable.
```

---

## 9. STAFF MANAGEMENT

### 9.1 Data Model
- Staff members are independent entities (not necessarily auth users)
- Optional `user_id` links to `auth.users` for platform login
- Junction table `staff_services` connects staff to services (many-to-many)
- Custom price/duration overrides possible per staff-service combination

### 9.2 Staff-Service Assignment
- Managed via `EditStaffDialog` with checkbox list
- Uses `assignStaffToService(siteId, staffId, serviceId)` and `removeStaffFromService(siteId, staffId, serviceId)` server actions
- Both operate on the `mod_bookmod01_staff_services` junction table
- `getStaff()` joins staff_services and services to populate `staff.services[]`

### 9.3 Public Staff Filtering
- `getPublicStaff()` returns only `is_active=true AND accept_bookings=true`
- Widget filters further by selected service (only shows staff who provide that service)
- "Any Available Staff" option always present

### 9.4 Staff Detail Sheet
Shows: avatar, name, bio, email/phone/timezone, assigned services, appointment stats (completed/upcoming/total/completion rate), edit/delete actions, active toggle.

---

## 10. NOTIFICATION & EMAIL SYSTEM

### 10.1 New Booking Notifications

**Triggered by:** `createPublicAppointment()` → async `notifyNewBooking(data)`

**3 notifications sent in parallel:**

1. **In-App Notification** (to business owner)
   - Type: `new_booking`
   - Title: `"New Booking: {serviceName}"`
   - Message: `"{customerName} booked {serviceName} for {date} at {time} ({price})"`
   - Link: Dashboard URL

2. **Email to Business Owner**
   - Template: `booking_confirmation_owner`
   - Sent via `sendBrandedEmail(agencyId, {...})`
   - Data: customer info, service, staff, date/time, duration, price, dashboard URL

3. **Email to Customer** (uses SITE branding)
   - Template: `booking_confirmation_customer`
   - Sent via `sendBrandedEmail(agencyId, {siteId, ...})`
   - Data: customer name, service, staff, date/time, duration, price, business name

**Email system uses branded templates** — customer sees the business's branding (colors, logo), not DRAMAC's.

### 10.2 Cancellation Notifications

**Triggered by:** `cancelAppointment()` → async `notifyBookingCancelled(data)`  
Similar pattern — notifies both owner and customer.

### 10.3 Reminder System

**Database support exists** (`mod_bookmod01_reminders` table) but the **actual reminder sending is not yet implemented**. The settings store `reminder_hours` (default `[24, 1]` = 24 hours and 1 hour before), and the table supports email/sms/push types with scheduled send times.

**Status:** Schema and data model ready. No cron job or background worker to actually send reminders.

---

## 11. EMBED SYSTEM

### 11.1 Embed Page (`/embed/booking/[siteId]`)

Server-side rendered standalone HTML page that:
1. Verifies module is installed for the site
2. Fetches services, staff, settings via admin client
3. Renders complete HTML document (not wrapped in Next.js layout)
4. Applies CSS variables from site branding:
   ```css
   --primary: {accent_color}
   --primary-text: #ffffff (calculated from accent)
   ```
5. Loads Google Fonts if site has a custom font configured
6. Includes PostMessage bridge for parent communication:
   - `DRAMAC_MODULE_READY` — signals the embed is loaded
   - `DRAMAC_RESIZE` — sends height changes for auto-sizing iframe
7. Responsive design with `@media (max-width: 480px)` breakpoint
8. "Powered by DRAMAC" footer

### 11.2 Embed Code Generation

The `embed-code-view.tsx` generates 3 embed formats:

**iframe:**
```html
<iframe 
  src="https://app.dramac.app/embed/booking/{siteId}?type=full&accent=%23..."
  style="width:100%;min-height:600px;border:none;"
  loading="lazy"
></iframe>
```

**Script:**
```html
<script 
  src="https://app.dramac.app/embed/booking-embed.js"
  data-site-id="{siteId}" 
  data-type="full"
  data-accent="{color}"
></script>
```

**Shortcode (for CMS integration):**
```
[dramac-booking site="{siteId}" type="full" accent="{color}"]
```

### 11.3 Widget Types
- **Full Widget** — Complete multi-step booking wizard
- **Service List** — Service selector only
- **Calendar** — Date/time picker only
- **Staff Grid** — Staff selector only

⚠️ **Note:** The embed page currently renders a static service list / staff grid. It does NOT render the full interactive BookingWidgetBlock — it's a simplified server-rendered preview. The actual interactive widget is rendered through the DRAMAC Studio page system (the auto-created `/book` page).

---

## 12. STUDIO COMPONENT REGISTRATION

### 12.1 Registered Components

| Component Type | Block | Category | Description |
|----------------|-------|----------|-------------|
| `BookingServiceSelector` | ServiceSelectorBlock | interactive | Service display and selection |
| `BookingWidget` | BookingWidgetBlock | interactive | All-in-one multi-step booking wizard |
| `BookingCalendar` | BookingCalendarBlock | interactive | Date/time calendar picker |
| `BookingForm` | BookingFormBlock | interactive | Customer details form |
| `BookingEmbed` | BookingEmbedBlock | interactive | Embed preview and code generator |
| `BookingStaffGrid` | StaffGridBlock | interactive | Staff member display/selection |

### 12.2 Custom Field Editors

- `ServiceSelectorField` — Dropdown to pick a service (used in BookingWidget `serviceId` prop)
- `StaffSelectorField` — Dropdown to pick a staff member (used in BookingWidget `staffId` prop)

### 12.3 AI Integration

The BookingWidgetBlock definition includes an `ai` object:
```typescript
ai: {
  description: 'Complete multi-step booking wizard — fully customizable with 50+ properties',
  canModify: ['title', 'subtitle', 'stepIndicatorStyle', 'primaryColor', ...],
  suggestions: ['Use progress bar indicator', 'Change to brand colors', ...],
}
```
This enables the AI Website Designer module to intelligently modify booking widget properties.

---

## 13. MODULE INSTALLATION & LIFECYCLE

### 13.1 Manifest Lifecycle Hooks
```typescript
lifecycle: {
  onInstall: 'booking/lifecycle/onInstall',
  onUninstall: 'booking/lifecycle/onUninstall',
  onEnable: 'booking/lifecycle/onEnable',
  onDisable: 'booking/lifecycle/onDisable'
}
```

### 13.2 Installation Hook (`installation-hook.ts`)

**onInstall(siteId):**
1. `createBookingPages(siteId)` — Creates /book page with BookingWidget content
2. Adds "Book" nav item to site navigation

**onUninstall(siteId):**
1. `deleteBookingPages(siteId)` — Removes /book page
2. Removes "Book" nav item from navigation

### 13.3 Settings Initialization (`initializeBookingForSite`)
- Called on first dashboard load (not during install)
- Upserts settings with defaults: timezone UTC, slot_interval 30, accent_color '#3B82F6'
- Returns existing settings if already initialized

---

## 14. PUBLIC VS ADMIN COMPONENT SEPARATION

### 14.1 Supabase Client Pattern

| Context | Client | RLS | Pattern |
|---------|--------|-----|---------|
| Dashboard (admin) | `createClient()` | ✅ Enforced | `can_access_site(site_id)` checks user membership |
| Public (storefront) | `createAdminClient()` | ❌ Bypassed | Service role key, full table access |

### 14.2 Action Separation

**Admin actions** (`booking-actions.ts`):
- All CRUD operations
- Uses authenticated user context
- RLS ensures users can only access their sites' data
- 30+ exported functions

**Public actions** (`public-booking-actions.ts`):
- Read-only: getPublicServices, getPublicStaff, getPublicSettings, getPublicAvailableSlots
- Write: createPublicAppointment (with comprehensive server-side validation)
- Uses admin client — validates access programmatically
- Explicitly filters for public-safe data (active, online, etc.)
- Returns sanitized data subsets

### 14.3 Context Separation

- `BookingProvider` — Dashboard, wraps admin pages, loads ALL data
- `BookingStorefrontProvider` — Public pages, minimal (settings, formatting helpers)

### 14.4 Hook Separation

Public hooks (`useBookingServices`, `useBookingStaff`, `useBookingSlots`, `useBookingSettings`, `useCreateBooking`) call public actions only.

Dashboard uses `useBooking()` context hook which provides full CRUD access.

---

## 15. HARDCODED COLORS AUDIT

### 15.1 Database Defaults

| Location | Color | Issue |
|----------|-------|-------|
| `services.color` default | `#3B82F6` (blue) | Hardcoded in DB schema |
| `settings.accent_color` default | `#3B82F6` (blue) | Hardcoded in DB schema |

### 15.2 Application Code

| File | Color | Context |
|------|-------|---------|
| `booking-actions.ts` → `initializeBookingForSite` | `#3B82F6` | Default accent_color on first init |
| `booking-actions.ts` → `createService` | `#3B82F6` | Default service color |
| `create-service-dialog.tsx` | `#3B82F6` | Initial form state for color picker |
| `edit-service-dialog.tsx` | `#3B82F6` | Initial form state for color picker |
| `booking-settings-dialog.tsx` | `#3B82F6` | Default accent_color in form |
| `booking-types.ts` → `APPOINTMENT_STATUS_CONFIG` | `#F59E0B` (amber), `#10B981` (green), `#EF4444` (red), `#3B82F6` (blue), `#6B7280` (gray) | Status indicator colors |
| `BookingWidgetBlock.tsx` | `#8B5CF6` (purple) | CSS variable fallback: `var(--brand-primary, #8B5CF6)` |
| `embed/booking/[siteId]/page.tsx` | `#ddd6fe`, `#7c3aed` | Staff avatar background and initial color |
| `embed/booking/[siteId]/page.tsx` | `#e5e7eb`, `#9CA3AF`, `#6b7280` | Border, powered-by text, staff title |

### 15.3 Tailwind Color Classes (Semantic — OK)

Throughout UI components, Tailwind classes like `bg-green-500`, `text-amber-600`, `border-red-500` are used for status indicators. These are **semantic** (green=confirmed, amber=pending, red=cancelled) and are appropriate, but they won't change with branding.

### 15.4 Recommendations

1. Move `#3B82F6` default to a shared constant (e.g., `DEFAULT_ACCENT_COLOR`)
2. The embed page should use only CSS variables, not hardcoded hex values for avatar colors
3. `APPOINTMENT_STATUS_CONFIG` colors could be made configurable via settings
4. BookingWidgetBlock's `#8B5CF6` fallback should match the settings default (`#3B82F6`) for consistency

---

## 16. BUGS, ISSUES & TECHNICAL DEBT

### 16.1 Active Bugs

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | 🟡 Medium | **Timezone inconsistency between admin and public slot calculation.** Dashboard `getAvailableSlots` uses `parseTime()` (local TZ), public `getPublicAvailableSlots` uses `parseTimeUTC()` (UTC). Can show different available slots for the same date. | `booking-actions.ts` vs `public-booking-actions.ts` |
| 2 | 🟡 Medium | **Embed page has hardcoded colors** for staff avatars (`#ddd6fe`, `#7c3aed`) that don't respect the accent_color setting. | `embed/booking/[siteId]/page.tsx` |
| 3 | 🟢 Low | **TIMEZONES list inconsistency** — `create-staff-dialog.tsx` has US/EU/Asia/AU timezones only. `booking-settings-dialog.tsx` has African-first list (Lusaka, Harare, etc.). They should use the same list or a shared constant. | `create-staff-dialog.tsx`, `booking-settings-dialog.tsx` |
| 4 | 🟢 Low | **BookingWidgetBlock fallback color mismatch** — Falls back to `#8B5CF6` (purple) but the system default is `#3B82F6` (blue). | `BookingWidgetBlock.tsx` |
| 5 | 🟢 Low | **`createService` in dialog defaults color to `#3B82F6`** but DB schema also defaults to `#3B82F6`  — double defaulting is harmless but redundant. | `create-service-dialog.tsx` |

### 16.2 Previously Fixed Issues (Per Memory Bank)

- ✅ Staff filtering by service
- ✅ Min notice hours enforcement
- ✅ Max advance days enforcement
- ✅ Weekday-aware availability fallback (Mon-Fri 9-5, weekends no slots)
- ✅ Buffer times in conflict checking
- ✅ Server-side validations in public booking
- ✅ Timezone date-shift bug (fixed with `Date.UTC` pattern in hooks)
- ✅ Parallel email dispatch (was sequential, doubled latency)

### 16.3 Technical Debt

| # | Item | Notes |
|---|------|-------|
| 1 | **No real chart library in Analytics** — Analytics view has stat cards but chart areas are placeholders | Need to integrate recharts or similar |
| 2 | **Reminder system not implemented** — DB schema and settings exist, but no cron/worker to send reminders | Schema ready, needs background job |
| 3 | **No rescheduling flow** — Appointment type has `recurring_rule` but no UI for rescheduling or recurring bookings | Type exists, no implementation |
| 4 | **No payment integration** — `require_payment` and `payment_provider` fields exist but no actual payment flow | Schema ready, no Stripe/Paddle integration |
| 5 | **Embed page is static preview** — `/embed/booking/[siteId]` renders a static service/staff list, not the interactive BookingWidgetBlock | Functional for display, not for booking |
| 6 | **No external calendar sync** — Calendar table supports `external_calendar_url` and `external_calendar_type` but no sync implementation | Schema ready, no Google Calendar/Outlook integration |
| 7 | **No webhook dispatch** — Manifest defines 7 webhook events but no actual webhook sending mechanism | Events defined, no dispatcher |
| 8 | **No SMS notifications** — Reminder table supports `sms` type but no SMS provider integration | Schema ready, email only currently |
| 9 | **Settings has `currency` field but it's not consistently used** — Some places use `DEFAULT_CURRENCY` from locale-config, others use settings.currency | Should cascade: settings.currency → DEFAULT_CURRENCY fallback |
| 10 | **No group booking support** — `max_attendees` field exists on services but the booking flow only handles 1 attendee | Schema ready, needs multi-attendee UI |

---

## 17. MISSING FEATURES

### 17.1 High Priority (Expected for Production)

1. **Recurring Appointments** — Fields exist (`recurring_id`, `recurring_rule`) but no UI
2. **Rescheduling Flow** — No dedicated reschedule dialog/action
3. **Appointment Reminders** — Schema exists but no sending mechanism
4. **Payment Integration** — No checkout flow, no payment processing
5. **External Calendar Sync** — Google Calendar, Outlook integration

### 17.2 Medium Priority

6. **Real-time Updates** — Dashboard doesn't use Supabase Realtime subscriptions
7. **Analytics Charts** — Only stat cards, no actual charts
8. **Webhook Dispatch** — Events defined, no delivery system
9. **Group Bookings** — max_attendees UI needed
10. **Waiting List** — No waitlist when slots are full
11. **Mobile-Specific Dashboard View** — Dashboard is responsive via Tailwind but no dedicated mobile experience

### 17.3 Nice-to-Have

12. **SMS Notifications** — Currently email-only
13. **Custom Form Fields** — `custom_fields` JSON columns exist but no builder UI
14. **Service Categories** — `category` field exists but no category management UI
15. **Staff Working Hours Editor** — `default_availability` JSON exists but no visual editor
16. **Appointment History/Audit Log** — No change tracking beyond `updated_at`
17. **Customer Self-Service Portal** — Customers can't view/modify their own bookings
18. **Multi-Location Support** — No concept of physical locations/rooms
19. **Conflict Resolution UI** — No overbooking handling beyond prevention
20. **Export Appointments** — No CSV/PDF export functionality

---

## 18. ALL ROUTES

### 18.1 Dashboard Routes

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/dashboard/sites/[siteId]/booking` | BookingDashboard | ✅ |
| `/dashboard/sites/[siteId]/booking?view=calendar` | CalendarView | ✅ |
| `/dashboard/sites/[siteId]/booking?view=appointments` | AppointmentsView | ✅ |
| `/dashboard/sites/[siteId]/booking?view=services` | ServicesView | ✅ |
| `/dashboard/sites/[siteId]/booking?view=staff` | StaffView | ✅ |
| `/dashboard/sites/[siteId]/booking?view=analytics` | AnalyticsView | ✅ |
| `/dashboard/sites/[siteId]/booking?view=settings` | SettingsView | ✅ |
| `/dashboard/sites/[siteId]/booking?view=embed` | EmbedCodeView | ✅ |

### 18.2 Public Routes

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/embed/booking/[siteId]` | Embed page (standalone HTML) | ❌ |
| `/book` (site page) | BookingWidgetBlock (via Studio renderer) | ❌ |

### 18.3 API Routes (Defined in Manifest, Not Implemented)

```
GET    /api/modules/booking/services
GET    /api/modules/booking/staff
GET    /api/modules/booking/availability
POST   /api/modules/booking/appointments
GET    /api/modules/booking/appointments
PUT    /api/modules/booking/appointments/:id
DELETE /api/modules/booking/appointments/:id
```

⚠️ These routes are **defined in the manifest** but there are **no actual API route handlers** implemented. All data flows through Server Actions instead.

---

## 19. MANIFEST & PRICING

### 19.1 Module Metadata

```typescript
{
  id: 'booking',
  name: 'Booking & Appointments',
  shortId: 'bookmod01',
  description: 'Complete appointment booking and scheduling system',
  version: '1.0.0',
  category: 'scheduling',
  icon: 'Calendar',
  author: { name: 'DRAMAC', url: 'https://dramac.com' }
}
```

### 19.2 Features (7)

1. Service Management
2. Staff Management
3. Calendar & Availability
4. Appointment Booking (with conflict detection)
5. Appointment Reminders (requires setup)
6. Embeddable Booking Widget
7. CRM Integration (requires setup)
8. Booking Analytics

### 19.3 Permissions (17)

Services: view, create, edit, delete  
Staff: view, manage  
Appointments: view, create, edit, cancel  
Settings: view, edit  
Analytics: view  
Admin: full access

### 19.4 Webhooks (7 Events)

1. `booking.appointment.created`
2. `booking.appointment.confirmed`
3. `booking.appointment.cancelled`
4. `booking.appointment.completed`
5. `booking.appointment.no_show`
6. `booking.appointment.rescheduled`
7. `booking.reminder.sent`

### 19.5 Pricing Plans

| Plan | Price/mo | Appointments/mo | Staff | Services |
|------|----------|-----------------|-------|----------|
| Starter | $19 | 100 | 1 | 10 |
| Professional | $49 | Unlimited | 10 | Unlimited |
| Business | $99 | Unlimited | Unlimited | Unlimited |

---

## 20. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                     DRAMAC CMS PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │   MODULE SYSTEM  │    │         BOOKING MODULE           │   │
│  │                 │    │                                  │   │
│  │  manifest.ts ──►│───►│  Module ID: booking              │   │
│  │  index.ts       │    │  Short ID: bookmod01             │   │
│  │                 │    │  Table Prefix: mod_bookmod01_    │   │
│  └─────────────────┘    └──────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    SERVER ACTIONS                         │  │
│  │                                                          │  │
│  │  ┌─────────────────┐     ┌──────────────────────────┐   │  │
│  │  │ booking-actions  │     │ public-booking-actions    │   │  │
│  │  │ (Dashboard)      │     │ (Public Storefront)       │   │  │
│  │  │                 │     │                          │   │  │
│  │  │ createClient()  │     │ createAdminClient()      │   │  │
│  │  │ RLS: ✅         │     │ RLS: ❌ (bypassed)       │   │  │
│  │  │ 30+ functions   │     │ 5 functions              │   │  │
│  │  └────────┬────────┘     └──────────┬───────────────┘   │  │
│  │           │                         │                    │  │
│  └───────────┼─────────────────────────┼────────────────────┘  │
│              │                         │                        │
│  ┌───────────┼─────────────────────────┼────────────────────┐  │
│  │           ▼                         ▼                    │  │
│  │    SUPABASE (PostgreSQL)                                 │  │
│  │                                                          │  │
│  │  mod_bookmod01_services ──────┐                         │  │
│  │  mod_bookmod01_staff ─────────┤                         │  │
│  │  mod_bookmod01_staff_services ┤  (Junction)             │  │
│  │  mod_bookmod01_appointments ──┤                         │  │
│  │  mod_bookmod01_calendars ─────┤                         │  │
│  │  mod_bookmod01_availability ──┤                         │  │
│  │  mod_bookmod01_reminders ─────┤                         │  │
│  │  mod_bookmod01_settings ──────┘                         │  │
│  │                                                          │  │
│  │  33 RLS policies                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND LAYERS                        │  │
│  │                                                          │  │
│  │  ┌───────────────────┐  ┌────────────────────────────┐  │  │
│  │  │  ADMIN DASHBOARD   │  │  PUBLIC STOREFRONT          │  │  │
│  │  │                   │  │                            │  │  │
│  │  │  BookingProvider  │  │  BookingStorefrontProvider  │  │  │
│  │  │  ┌─────────────┐ │  │  ┌──────────────────────┐  │  │  │
│  │  │  │ CalendarView │ │  │  │ BookingWidgetBlock   │  │  │  │
│  │  │  │ Appointments │ │  │  │ (5-step wizard)      │  │  │  │
│  │  │  │ Services     │ │  │  │                      │  │  │  │
│  │  │  │ Staff        │ │  │  │ useBookingServices   │  │  │  │
│  │  │  │ Analytics    │ │  │  │ useBookingStaff      │  │  │  │
│  │  │  │ Settings     │ │  │  │ useBookingSlots      │  │  │  │
│  │  │  │ Embed        │ │  │  │ useBookingSettings   │  │  │  │
│  │  │  └─────────────┘ │  │  │ useCreateBooking     │  │  │  │
│  │  │                   │  │  └──────────────────────┘  │  │  │
│  │  │  6 Dialogs        │  │                            │  │  │
│  │  │  3 Sheets         │  │  /embed/booking/[siteId]   │  │  │
│  │  │  9 UI Components  │  │  (standalone HTML embed)   │  │  │
│  │  └───────────────────┘  └────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  DRAMAC STUDIO (Visual Editor)                    │   │  │
│  │  │                                                  │   │  │
│  │  │  6 Registered Components:                        │   │  │
│  │  │  • BookingWidget (50+ props, AI-aware)          │   │  │
│  │  │  • BookingServiceSelector                       │   │  │
│  │  │  • BookingCalendar                              │   │  │
│  │  │  • BookingForm                                  │   │  │
│  │  │  • BookingEmbed                                 │   │  │
│  │  │  • BookingStaffGrid                             │   │  │
│  │  │                                                  │   │  │
│  │  │  2 Custom Field Editors:                        │   │  │
│  │  │  • ServiceSelectorField                         │   │  │
│  │  │  • StaffSelectorField                           │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   NOTIFICATION SYSTEM                     │  │
│  │                                                          │  │
│  │  notifyNewBooking() ──► In-App + Owner Email + Customer  │  │
│  │  notifyBookingCancelled() ──► Owner + Customer           │  │
│  │                                                          │  │
│  │  Uses sendBrandedEmail() with site-specific branding     │  │
│  │  Emails sent in parallel via Promise.all()               │  │
│  │  Non-blocking (async, doesn't delay API response)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   INSTALLATION LIFECYCLE                   │  │
│  │                                                          │  │
│  │  onInstall ──► createBookingPages ──► /book page         │  │
│  │            ──► Add "Book" nav item                       │  │
│  │                                                          │  │
│  │  onUninstall ──► deleteBookingPages ──► Remove /book     │  │
│  │              ──► Remove nav item                         │  │
│  │                                                          │  │
│  │  First dashboard load ──► initializeBookingForSite       │  │
│  │                        ──► Creates default settings      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## APPENDIX: FILE COUNT SUMMARY

| Category | Files | Total Lines |
|----------|-------|-------------|
| Root/Config | 2 | ~530 |
| Types | 1 | 505 |
| Actions | 3 | ~2,130 |
| Context | 2 | ~470 |
| Hooks | 7 | ~300 |
| Dashboard Components | 2 | ~1,080 |
| Views | 7 | ~3,525 |
| Dialogs | 6 | ~1,834 |
| Sheets | 3 | ~1,073 |
| UI Components | 9 | ~4,362 |
| Studio Components | 7 | ~4,388 |
| App Routes | 2 | ~356 |
| **TOTAL** | **51 files** | **~20,553 lines** |

---

*End of Booking Module Deep Study*
