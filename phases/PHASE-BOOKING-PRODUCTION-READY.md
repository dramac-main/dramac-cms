# PHASE: Booking Module — Production-Ready Comprehensive Fix

**Priority**: HIGH — Module has critical responsiveness and embed issues
**Scope**: Every booking component, page, action, widget, template, and database table
**Goal**: Make the entire booking module fully functional, mobile-responsive, correctly branded, and production-ready

---

## TABLE OF CONTENTS

1. [Platform Context](#1-platform-context)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [File Inventory](#4-file-inventory)
5. [Critical Bugs — Fix Immediately](#5-critical-bugs)
6. [Branding System](#6-branding-system)
7. [Mobile Responsiveness](#7-mobile-responsiveness)
8. [Booking Widget Flow](#8-booking-widget-flow)
9. [Embed System](#9-embed-system)
10. [Staff Management](#10-staff-management)
11. [Availability & Scheduling](#11-availability-and-scheduling)
12. [Email Notifications](#12-email-notifications)
13. [Admin Dashboard](#13-admin-dashboard)
14. [Analytics](#14-analytics)
15. [Published Site Integration](#15-published-site-integration)
16. [Settings System](#16-settings-system)
17. [Missing Features & Priorities](#17-missing-features)
18. [Testing Checklist](#18-testing-checklist)

---

## 1. PLATFORM CONTEXT

### What is DRAMAC CMS?
DRAMAC is a **multi-tenant SaaS platform** where agencies create websites for their clients. Each agency has multiple sites, each site can install modules. The Booking module is one such installable module.

### Hierarchy
```
Agency (organization)
  └── Site (client's website)
        └── Module Installation (booking)
              ├── Services (what can be booked)
              ├── Staff (who provides services)
              ├── Availability Rules (when booking is possible)
              ├── Appointments (actual bookings)
              ├── Calendars (external sync)
              ├── Reminders (scheduled notifications)
              └── Settings (configuration)
```

### Two Contexts
1. **Dashboard** (admin) — Agency staff manage services, staff, appointments, settings. URL: `app.dramacagency.com/dashboard/sites/[siteId]/booking`
2. **Published Site** (customer-facing) — End customers browse services, pick staff, select time, and book. URL: `clientsite.sites.dramacagency.com/book`

### Key Principle
Published sites must use the **site's brand colors**, NOT DRAMAC's colors. Every customer-facing component must respect CSS variables injected by the branding system. The dashboard uses its own theme (this is fine). Only published-site components need brand compliance.

---

## 2. TECHNOLOGY STACK

- **Framework**: Next.js 16.1.1 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Styling**: Tailwind CSS 4.x, Radix UI, shadcn/ui components
- **State**: React useState/useEffect (no external store for booking)
- **Email**: Resend (transactional), branded templates
- **Locale**: Default `en-ZM` (Zambia), timezone `Africa/Lusaka` (UTC+2)
- **Date handling**: `date-fns` + manual `Date.UTC()` pattern for timezone safety

### Critical Rules
- **Snake_case ↔ camelCase**: Supabase returns `snake_case`. Server actions must use `mapRecord()`/`mapRecords()` from `src/lib/map-db-record.ts`
- **Admin vs Public client**: Dashboard actions use RLS-bound `createClient()`. Public actions use `createAdminClient()` (anonymous users can't pass RLS)
- **UTC pattern**: Public-facing date/time operations use `Date.UTC()` to prevent timezone shift bugs
- **Supabase Project ID**: `nfirsqmyxmmtbignofgb`

---

## 3. DATABASE SCHEMA

### Table Prefix
All booking tables use prefix `mod_bookmod01_`. There are **8 tables** total.

### `mod_bookmod01_services`
```
id                      uuid        NOT NULL  DEFAULT gen_random_uuid()
site_id                 uuid        NOT NULL
name                    text        NOT NULL
slug                    text        NOT NULL
description             text        NULLABLE
duration_minutes        integer     NOT NULL    ← e.g., 30, 60, 90
buffer_before_minutes   integer     NULLABLE    ← break time before appointment
buffer_after_minutes    integer     NULLABLE    ← break time after appointment
price                   numeric     NULLABLE    ← decimal amount (not cents)
currency                text        NULLABLE
max_attendees           integer     NULLABLE    DEFAULT 1
allow_online_booking    boolean     NULLABLE    ← if false, service is admin-only
require_confirmation    boolean     NULLABLE    ← if true, new bookings are 'pending' not 'confirmed'
require_payment         boolean     NULLABLE    ← if true, payment required before confirmation
color                   text        NULLABLE    ← display color in calendar
image_url               text        NULLABLE
sort_order              integer     NULLABLE
is_active               boolean     NULLABLE    ← if false, service is hidden
custom_fields           jsonb       NOT NULL    ← additional form fields for this service
created_by              uuid        NULLABLE
created_at              timestamptz NOT NULL
updated_at              timestamptz NOT NULL
```

### `mod_bookmod01_staff`
```
id                      uuid        NOT NULL  DEFAULT gen_random_uuid()
site_id                 uuid        NOT NULL
user_id                 uuid        NULLABLE    ← links to auth user (optional)
name                    text        NOT NULL
email                   text        NULLABLE
phone                   text        NULLABLE
avatar_url              text        NULLABLE
bio                     text        NULLABLE
default_availability    jsonb       NOT NULL    ← NOT used by slot calculation (availability table is used instead)
timezone                text        NULLABLE
accept_bookings         boolean     NULLABLE    ← if false, staff is hidden from public
is_active               boolean     NULLABLE
created_at              timestamptz NOT NULL
updated_at              timestamptz NOT NULL
```

**⚠️ NOTE: The TypeScript `Staff` type has a `working_hours` field, but the DB column is `default_availability`. These are NOT the same. The availability calculation uses the `mod_bookmod01_availability` table, NOT the staff's `default_availability` field.**

### `mod_bookmod01_staff_services` (junction table)
```
id                      uuid        NOT NULL
site_id                 uuid        NOT NULL
staff_id                uuid        NOT NULL  FK → staff.id
service_id              uuid        NOT NULL  FK → services.id
custom_price            numeric     NULLABLE    ← override service price for this staff
custom_duration_minutes integer     NULLABLE    ← override duration for this staff
created_at              timestamptz NOT NULL
```
**Unique constraint on `(staff_id, service_id)` — prevents duplicate assignments.**

### `mod_bookmod01_appointments`
```
id                      uuid        NOT NULL  DEFAULT gen_random_uuid()
site_id                 uuid        NOT NULL
service_id              uuid        NOT NULL  FK → services.id
staff_id                uuid        NULLABLE  FK → staff.id
customer_name           text        NOT NULL
customer_email          text        NOT NULL
customer_phone          text        NULLABLE
customer_notes          text        NULLABLE
crm_contact_id          uuid        NULLABLE  ← link to CRM module
start_time              timestamptz NOT NULL
end_time                timestamptz NOT NULL
timezone                text        NULLABLE
status                  text        NOT NULL  DEFAULT 'pending'
                                              ← pending/confirmed/completed/cancelled/no_show
cancelled_at            timestamptz NULLABLE
cancelled_by            text        NULLABLE
cancellation_reason     text        NULLABLE
payment_status          text        NULLABLE  DEFAULT 'pending'
payment_amount          numeric     NULLABLE
payment_id              text        NULLABLE
recurring_id            uuid        NULLABLE  ← for recurring appointments (NOT IMPLEMENTED)
recurring_rule          text        NULLABLE  ← rrule string (NOT IMPLEMENTED)
reminder_sent_at        timestamptz NULLABLE  ← last reminder sent
metadata                jsonb       NULLABLE
custom_fields           jsonb       NULLABLE  ← responses to service custom fields
created_at              timestamptz NOT NULL
updated_at              timestamptz NOT NULL
```

### `mod_bookmod01_availability`
```
id              uuid        NOT NULL
site_id         uuid        NOT NULL
staff_id        uuid        NULLABLE  ← null = applies to all staff
service_id      uuid        NULLABLE  ← null = applies to all services
rule_type       text        NOT NULL  ← 'available' | 'blocked' | 'holiday'
day_of_week     integer     NULLABLE  ← 0=Sun, 1=Mon, ..., 6=Sat (for recurring rules)
start_time      time        NULLABLE  ← e.g., '09:00:00' (TIME type, not timestamp)
end_time        time        NULLABLE  ← e.g., '17:00:00'
specific_date   date        NULLABLE  ← for one-off overrides (DATE type)
valid_from      date        NULLABLE  ← rule validity period start
valid_until     date        NULLABLE  ← rule validity period end
priority        integer     NULLABLE  ← higher priority overrides lower
label           text        NULLABLE  ← human-readable label like "Holiday"
created_at      timestamptz NOT NULL
updated_at      timestamptz NOT NULL
```

### `mod_bookmod01_calendars`
```
id                      uuid        NOT NULL
site_id                 uuid        NOT NULL
staff_id                uuid        NULLABLE
name                    text        NOT NULL
color                   text        NULLABLE
is_default              boolean     NULLABLE
external_calendar_url   text        NULLABLE  ← iCal URL for sync (NOT IMPLEMENTED)
external_calendar_type  text        NULLABLE  ← 'google' | 'outlook' | etc.
last_synced_at          timestamptz NULLABLE
sync_enabled            boolean     NULLABLE
created_at              timestamptz NOT NULL
updated_at              timestamptz NOT NULL
```
**⚠️ External calendar sync is NOT implemented. The table schema supports it but no sync logic exists.**

### `mod_bookmod01_reminders`
```
id              uuid        NOT NULL
appointment_id  uuid        NOT NULL  FK → appointments.id
send_at         timestamptz NOT NULL  ← when to send
type            text        NOT NULL  ← 'email' | 'sms' | 'push'
status          text        NOT NULL  DEFAULT 'pending'
sent_at         timestamptz NULLABLE
error           text        NULLABLE
subject         text        NULLABLE
body            text        NULLABLE
created_at      timestamptz NOT NULL
updated_at      timestamptz NOT NULL
```
**⚠️ Reminders are NEVER automatically sent. The table exists, `createReminder()` action exists, settings UI lets admin configure reminder hours, but there is NO cron job or scheduler that processes reminders. The table is write-only.**

### `mod_bookmod01_settings`
```
id                          uuid        NOT NULL
site_id                     uuid        NOT NULL  UNIQUE
business_name               text        NULLABLE
timezone                    text        NULLABLE  DEFAULT 'Africa/Lusaka'
date_format                 text        NULLABLE
time_format                 text        NULLABLE
min_booking_notice_hours    integer     NULLABLE  ← minimum hours before appointment
max_booking_advance_days    integer     NULLABLE  ← how far ahead customers can book
cancellation_notice_hours   integer     NULLABLE
slot_interval_minutes       integer     NULLABLE  ← time between slot starts (e.g., 30)
reminder_hours              jsonb       NULLABLE  ← array like [24, 1] (24h and 1h before)
auto_confirm                boolean     NULLABLE  ← if true, bookings go straight to 'confirmed'
confirmation_email_enabled  boolean     NULLABLE
accent_color                text        NULLABLE  ← module accent color
logo_url                    text        NULLABLE
require_payment             boolean     NULLABLE
payment_provider            text        NULLABLE
notification_email          text        NULLABLE  ← where admin notifications go
auto_create_crm_contact     boolean     NULLABLE  ← (NOT IMPLEMENTED)
created_at                  timestamptz NOT NULL
updated_at                  timestamptz NOT NULL
```

### RLS Policies
All tables use site isolation via agency membership:
```sql
site_id IN (
  SELECT sites.id FROM sites 
  WHERE sites.agency_id IN (
    SELECT agency_members.agency_id FROM agency_members 
    WHERE agency_members.user_id = auth.uid()
  )
)
```
Public-facing actions MUST use `createAdminClient()` to bypass RLS.

---

## 4. FILE INVENTORY

### Server Actions

#### `src/modules/booking/actions/public-booking-actions.ts` (~552 lines)
**Purpose**: All public-facing booking operations (bypasses RLS via admin client)

| Function | Purpose |
|----------|---------|
| `getPublicServices(siteId)` | Get active services with `allow_online_booking = true` |
| `getPublicStaff(siteId)` | Get active staff with `accept_bookings = true`, enriched with service assignments |
| `getPublicAvailableSlots(siteId, date, serviceId, staffId?)` | Calculate available time slots for a date |
| `createPublicAppointment(input)` | Create a new appointment with full validation |

**Key validation in `createPublicAppointment`**:
1. Past date rejection
2. Service must be active + allow_online_booking
3. Min booking notice hours check
4. Max booking advance days check
5. Buffer-aware conflict check (includes buffer_before + buffer_after in blocked window)
6. DB unique index `idx_prevent_double_booking` catches race conditions

**Key validation in `getPublicAvailableSlots`**:
1. Past dates → return empty array
2. Query availability rules for the day_of_week or specific_date
3. Query blocked rules (rule_type = 'blocked' or 'holiday')
4. Query existing appointments
5. Weekday-aware fallback: Mon-Fri → 09:00-17:00; Sat-Sun → empty (no defaults)
6. Generate slots at `slotInterval` intervals
7. Each slot's blocked window = `[start - bufferBefore, end + bufferAfter]`
8. Filter out slots that overlap with blocked rules or existing appointments
9. Filter out slots within `min_booking_notice_hours` of current time
10. Deduplicate — if same time from multiple staff, keep "available" version

#### `src/modules/booking/actions/booking-actions.ts` (~1319 lines)
**Purpose**: All dashboard CRUD operations (uses RLS-bound client)

| Function | Purpose |
|----------|---------|
| `getServices(siteId)` | List all services |
| `createService(siteId, data)` | Create new service |
| `updateService(siteId, id, data)` | Update service |
| `deleteService(siteId, id)` | Delete service |
| `getStaff(siteId)` | List all staff with service assignments |
| `createStaff(siteId, data)` | Create new staff member |
| `updateStaff(siteId, id, data)` | Update staff |
| `deleteStaff(siteId, id)` | Delete staff |
| `assignStaffToService(siteId, staffId, serviceId)` | Link staff ↔ service |
| `removeStaffFromService(siteId, staffId, serviceId)` | Unlink staff ↔ service |
| `getAppointments(siteId, filters)` | List appointments with filters |
| `createAppointment(siteId, data)` | Admin-created appointment |
| `updateAppointment(siteId, id, data)` | Update appointment |
| `cancelAppointment(siteId, id, reason)` | Cancel + notify |
| `getAvailableSlots(siteId, date, serviceId, staffId?)` | Admin version (local timezone, no min/max checks) |
| `checkSlotAvailability(siteId, serviceId, staffId, start, end)` | Conflict checker |
| `getCalendars(siteId)` | List calendars |
| `createCalendar(siteId, data)` | Create calendar |
| `getAvailabilityRules(siteId)` | List availability rules |
| `createAvailabilityRule(siteId, data)` | Create rule |
| `updateAvailabilityRule(siteId, id, data)` | Update rule |
| `deleteAvailabilityRule(siteId, id)` | Delete rule |
| `getReminders(appointmentId)` | List reminders |
| `createReminder(appointmentId, data)` | Create reminder (write-only, never sent) |
| `getBookingSettings(siteId)` | Get settings |
| `updateBookingSettings(siteId, data)` | Update settings |
| `initializeBookingForSite(siteId, agencyId)` | Create default settings on first use |
| `getBookingStats(siteId)` | Aggregated appointment counts |
| `searchBookings(siteId, query)` | Full-text search |

**⚠️ `initializeBookingForSite` sets `accent_color: '#3B82F6'` — hardcoded blue. Should be empty string or neutral.**

**⚠️ `createService` default `color: '#3B82F6'` — hardcoded blue for new service calendar color. Should use neutral or brand color.**

**⚠️ Admin `getAvailableSlots` is NOT weekday-aware — defaults to 9-5 even on weekends (the public version was fixed but the admin version was not).**

#### `src/modules/booking/actions/booking-notification-actions.ts` (~821 lines)
**Purpose**: Email + in-app notification dispatch for booking events

| Function | Purpose |
|----------|---------|
| `notifyNewBooking(siteId, appointmentId)` | Sends to both owner + customer |
| `notifyBookingCancelled(siteId, appointmentId, reason)` | Sends to both owner + customer |

**Email types**:
- `booking_confirmation_customer` — Customer gets site-branded email
- `booking_confirmation_owner` — Owner gets agency-branded email
- `booking_cancelled_customer` — Customer notification
- `booking_cancelled_owner` — Owner notification

**In-app notifications** also created in the `notifications` table.

**Branding**: Customer emails use `siteId` for site branding. Owner emails use `agency_id` for agency branding.

**⚠️ Missing email types**:
- No email when admin **confirms** a pending appointment
- No email when admin marks appointment as **completed** or **no-show**
- No email when appointment is **rescheduled**

#### `src/modules/booking/actions/auto-setup-actions.ts` (~257 lines)
**Purpose**: Auto-creates the `/book` page when the booking module is installed.

Creates a page with:
1. Hero section (heading + description text, no hardcoded colors)
2. `BookingWidget` component (multi-step wizard)

Navbar/Footer are NOT in page content — they're injected at runtime from the homepage.

### Studio Components

#### `src/modules/booking/studio/index.ts` (~250 lines)
Registers **6 components** into DRAMAC Studio:

| Component Key | Component | Category |
|---------------|-----------|----------|
| `BookingWidget` | `BookingWidgetBlock` | interactive |
| `BookingEmbed` | `BookingEmbedBlock` | interactive |
| `BookingCalendar` | `BookingCalendarBlock` | interactive |
| `BookingServiceSelector` | `ServiceSelectorBlock` | interactive |
| `BookingForm` | `BookingFormBlock` | interactive |
| `BookingStaffGrid` | `BookingStaffGridBlock` | interactive |

Also registers custom field editors:
- `booking:service-selector` — Fetches real services in the Studio properties panel
- `booking:staff-selector` — Fetches real staff in the Studio properties panel

### Customer-Facing Components

#### `src/modules/booking/components/blocks/BookingWidgetBlock.tsx` (~1257 lines)
**Purpose**: The main multi-step booking wizard. This is THE primary customer-facing component.

**5 Steps**:
1. **Select Service** — Grid/list of active services with prices and durations
2. **Select Staff** — Grid of available staff filtered by selected service (optional step — can skip with "Any Available")
3. **Select Date & Time** — Calendar + time slot grid
4. **Enter Details** — Customer name, email, phone, notes, company, address (configurable fields)
5. **Review & Confirm** — Summary of selections → "Confirm Booking" button

**Props**: 86+ configurable properties including colors, sizes, labels, visibility toggles, layout options

**State Management**: React `useState` for each step's selection + `useBookingSettings` hook for site-level config

**⚠️ CRITICAL RESPONSIVENESS ISSUE**: The entire component uses **inline `style={}` objects with ZERO responsive classes**. No Tailwind, no media queries, no CSS breakpoints. See Section 7 for details.

**⚠️ BRANDING ISSUE**: Uses `var(--brand-primary, #8B5CF6)` as fallback — should be `#0f172a` per project convention.

#### `src/modules/booking/components/blocks/ServiceSelectorBlock.tsx` (~758 lines)
**Purpose**: Standalone service picker with multiple layouts (grid, list, card, compact)

**Features**: Real-time data fetching, search/filter, configurable columns, service images, price display, duration display

**Used**: As a standalone component OR as Step 1 within `BookingWidgetBlock`

#### `src/modules/booking/components/blocks/BookingCalendarBlock.tsx` (~742 lines)
**Purpose**: Date picker + time slot display

**Features**: Month navigation, day-of-week headers, disabled dates (past, min notice, max advance), time slot grid, loading states

#### `src/modules/booking/components/blocks/BookingFormBlock.tsx` (~768 lines)
**Purpose**: Customer details form (name, email, phone, notes, company, address)

**Features**: Configurable required/optional fields, validation, terms & conditions checkbox, custom fields support

#### `src/modules/booking/components/blocks/BookingStaffGridBlock.tsx` (~783 lines)
**Purpose**: Staff display grid with bios, photos, ratings, specialties

**Features**: Multiple layouts (grid, list, cards), service-filtered display, "Any Available" option

#### `src/modules/booking/components/views/embed-code-view.tsx` (~530 lines)
**Purpose**: Admin UI for generating embed code in 4 formats (iframe, script, direct link, WordPress shortcode)

**Features**: Preview device switcher, customization options (color, radius, theme, hide sections)

### Admin Components

#### `src/modules/booking/components/views/settings-view.tsx` (~631 lines)
**Purpose**: Admin settings with 5 tabs: General, Booking Rules, Notifications, Appearance, Payments

#### `src/modules/booking/components/views/analytics-view.tsx` (~601 lines)
**Purpose**: Booking analytics dashboard with stats, top services, top staff

### Hooks

| File | Purpose |
|------|---------|
| `src/modules/booking/hooks/useBookingSettings.ts` | Fetches site booking settings |
| `src/modules/booking/hooks/useCreateBooking.ts` | Handles booking creation flow |
| `src/modules/booking/hooks/useBookingServices.ts` | Fetches services |
| `src/modules/booking/hooks/useBookingStaff.ts` | Fetches staff |
| `src/modules/booking/hooks/useAvailableSlots.ts` | Fetches available slots for a date |

### Embed Page

#### `src/app/(public)/embed/booking/[siteId]/page.tsx` (~326 lines)
**Purpose**: Server-rendered HTML page for external iframe embedding

**⚠️ CRITICAL**: This page is a STATIC listing of services and staff. It does NOT render the interactive `BookingWidgetBlock`. Customers CANNOT complete a booking from the embed page. See Section 9 for details.

---

## 5. CRITICAL BUGS — FIX IMMEDIATELY

### BUG 1: BookingWidgetBlock Has ZERO Mobile Responsiveness
**Severity**: 🔴 CRITICAL — Unusable on mobile devices

**Root Cause**: The entire 1257-line component uses inline `style={}` objects with NO Tailwind classes, NO media queries, NO CSS breakpoints. Every dimension is a fixed pixel value.

**Specific Mobile Failures**:

| Element | Issue | Impact |
|---------|-------|--------|
| Time slots grid | `gridTemplateColumns: 'repeat(4, 1fr)'` always | On 320px screen, each slot is ~70px wide |
| Time slot buttons | `padding: '7px 10px'` | Touch target is ~30px tall — needs ≥44px |
| Calendar day grid | `gridTemplateColumns: 'repeat(7, 1fr)'` | Day buttons ~40px on mobile — tight but passable |
| Service cards | `display: 'flex', justifyContent: 'space-between'` | Long service names + prices overlap on narrow screens |
| Navigation buttons | `padding: '10px 24px'` fixed | Both buttons can overflow on narrow screens |
| Form inputs | `fontSize: '14px'` | iOS Safari auto-zooms on focus (needs ≥16px) |
| Step indicator | 5 steps + dividers in horizontal layout | Overflows on screens <375px, no wrapping |
| Staff cards | Fixed card dimensions | Stack vertically on mobile but with poor spacing |

**Fix Required**: Complete responsive overhaul of `BookingWidgetBlock.tsx`:
- Convert ALL inline styles to Tailwind responsive classes
- Time slots: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`
- Touch targets: All buttons ≥ `h-11` (44px)
- Form inputs: `text-base` (16px to prevent iOS zoom), `h-12` for touch targets
- Step indicator: Horizontal scroll or vertical layout on mobile
- Navigation: Full-width buttons stacked on mobile
- Service cards: Stack name/price on mobile
- Staff grid: 1 column on mobile, 2 on tablet, 3+ on desktop

### BUG 2: Embed Page Cannot Complete Bookings
**Severity**: 🔴 CRITICAL — External embed is non-functional for its primary purpose

**Root Cause**: The embed page at `/embed/booking/[siteId]` is a server-rendered **static HTML page** that only shows:
- A list of services (name, duration, price)
- A grid of staff members (name, avatar, bio)
- A "Book Now" button that... does nothing (there's no booking form)

It does NOT render the `BookingWidgetBlock` with its 5-step booking wizard. It does NOT have any interactivity. A customer clicking from an external site sees services and staff but CANNOT actually complete a booking.

**Fix Required**: Two options:
1. **Option A (Recommended)**: Make the embed page render the full `BookingWidgetBlock` as a client-side React component, embedded within the SSR page shell. The embed page already loads site branding and data — just need to add the interactive widget.
2. **Option B**: Make the "Book Now" button redirect to the full booking page on the published site (`clientsite.sites.dramacagency.com/book`)

### BUG 3: Script Embed References Non-Existent File
**Severity**: 🟡 MEDIUM — One of four embed formats is broken

**Root Cause**: The embed code view generates a `<script src="/embed/booking.js">` embed option, but the file `/embed/booking.js` does NOT exist anywhere in the codebase. The script is never created.

**Fix Required**: Either create the script file (a JS loader that creates an iframe), or remove the script embed option from the UI.

### BUG 4: Hardcoded Colors in Multiple Locations
**Severity**: 🟡 MEDIUM — Branding inconsistency

| Location | Value | Should Be |
|----------|-------|-----------|
| `BookingWidgetBlock.tsx` | `var(--brand-primary, #8B5CF6)` fallback | `var(--brand-primary, #0f172a)` |
| `BookingWidgetBlock.tsx` | `rgba(139,92,246,0.03)` (purple light) | `rgba(15,23,42,0.03)` |
| `BookingWidgetBlock.tsx` | `rgba(139,92,246,0.02)` (purple light) | `rgba(15,23,42,0.02)` |
| `booking-actions.ts` | `createService` default `color: '#3B82F6'` | `color: ''` |
| `booking-actions.ts` | `initializeBookingForSite` → `accent_color: '#3B82F6'` | `accent_color: ''` |
| Embed page | Default `color = '8B5CF6'` query param | `color = '0f172a'` |
| Embed page CSS | `.staff-avatar { background: #ddd6fe; color: #7c3aed; }` | Neutral grays |
| Embed page CSS | `.powered-by a { color: #7c3aed; }` | Neutral color |

### BUG 5: Admin getAvailableSlots Not Weekday-Aware
**Severity**: 🟡 MEDIUM — Admin sees incorrect availability on weekends

**Root Cause**: The public `getPublicAvailableSlots` was fixed to use weekday-aware fallback (Mon-Fri 9-5, Sat-Sun empty). But the admin version `getAvailableSlots` in `booking-actions.ts` still uses the old behavior — defaults to 9-5 on ALL days including weekends.

**Fix Required**: Apply the same weekday-aware fallback logic to the admin function.

### BUG 6: Settings Tab Overflow on Mobile
**Severity**: 🟢 LOW — Admin UI issue

**Root Cause**: The settings view has 5 tabs (General, Booking Rules, Notifications, Appearance, Payments) in a `TabsList` with no horizontal scroll container. On mobile, tabs overflow.

**Fix Required**: Add `overflow-x-auto` to the TabsList container, or use a dropdown/select for tab navigation on mobile.

---

## 6. BRANDING SYSTEM

### How Published Site Branding Works for Booking
1. When the published site loads, `StudioRenderer` resolves brand colors from `site.settings`
2. CSS custom properties are injected on `.studio-renderer` div (see full list in e-commerce phase doc)
3. `injectBrandColors()` replaces component props with brand values from `BRAND_COLOR_MAP`
4. `injectBrandFonts()` replaces font props
5. Google Fonts are dynamically loaded

### Available CSS Variables
```css
--brand-primary: #hexcolor;
--brand-secondary: #hexcolor;
--brand-button-text: #hexcolor;
--color-primary: H S% L%;
--color-primary-foreground: H S% L%;
--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
--font-display: 'Playfair Display', serif;
/* Plus all shadcn tokens (--primary, --secondary, --accent, etc.) */
```

### Branding Rules for Booking Components
1. **NEVER hardcode** `#8B5CF6`, `#3B82F6`, `#7c3aed`, `#ddd6fe`, or any brand-like color
2. **Use CSS variables**: `bg-primary`, `text-primary`, `border-primary` (Tailwind classes)
3. **For inline styles**: `var(--brand-primary, #0f172a)` with neutral fallback `#0f172a`
4. **For component defaults**: Empty string `""` → branding system injects correct color
5. **Semantic colors OK**: Red for errors, green for success, amber for warnings
6. **Neutral fallback**: `#0f172a` (Tailwind slate-900) — dark neutral, not branded

### Embed Page Branding
The embed page receives brand color via query parameter `?color=hex`. It sets:
```css
:root { --primary: ${color}; }
```
This cascades to all elements in the embed. The embed page also loads site fonts from the database.

---

## 7. MOBILE RESPONSIVENESS

### Current State: BookingWidgetBlock is NOT Mobile-Responsive

The main customer-facing component (`BookingWidgetBlock.tsx`, 1257 lines) uses **exclusively inline styles** with zero responsive adaptation. Here's the complete inventory of problems:

#### Step 1: Service Selection
```jsx
// Current (broken on mobile):
style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
```
**Problem**: 2-column grid on all screen sizes. On 320px mobile, each card is ~148px wide — acceptable but tight. Service names can overflow.

**Fix**: Convert to Tailwind: `grid grid-cols-1 sm:grid-cols-2 gap-3`

#### Step 2: Staff Selection
```jsx
// Current:
style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}
```
**Problem**: 3-column grid on all screens. On mobile, staff cards are ~94px wide — too small for photo + name + specialties.

**Fix**: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4`

#### Step 3: Date & Time
```jsx
// Calendar grid:
style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}

// Time slots:
style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}

// Time slot button:
style={{ padding: '7px 10px', fontSize: '13px' }}
```
**Problem**: 
- Calendar: 7 columns is correct for days of week, but day buttons are ~40px on mobile — barely adequate
- Time slots: 4 columns on mobile = ~70px per slot. Touch target is `7px + 13px font + 7px = ~30px` tall — far below 44px minimum
- Font size 13px is too small on mobile

**Fix**: 
- Time slots: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2`
- Slot buttons: `py-3 px-4 text-sm` (44px+ height)
- Calendar day buttons: `min-h-[44px]`

#### Step 4: Details Form
```jsx
// Input:
style={{ width: '100%', padding: '10px 12px', fontSize: '14px', borderRadius: '8px' }}
```
**Problem**: `fontSize: '14px'` triggers iOS Safari auto-zoom. Input height is ~38px — below touch target minimum.

**Fix**: `text-base` (16px), `h-12` or `h-14`, proper `inputMode` attributes

#### Step 5: Confirmation
```jsx
// Summary box:
style={{ padding: '20px', borderRadius: '12px' }}
```
**Problem**: Fixed padding, no responsive adjustment. On mobile, 20px padding is generous — could be 16px.

**Fix**: `p-4 sm:p-5`

#### Step Navigation
```jsx
// Buttons:
style={{ padding: '10px 24px', fontSize: '15px' }}
```
**Problem**: Side-by-side buttons. On mobile (320px), "Previous" + "Next" buttons can overflow if text is long.

**Fix**: Full-width stacked buttons on mobile: `flex flex-col-reverse sm:flex-row gap-3 sm:gap-0`

#### Step Indicator
```jsx
// Container:
style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}
```
**Problem**: 5 steps + dividers in a single horizontal row. On screens <375px, content overflows. No overflow handling.

**Fix**: On mobile, show only current step number + label (e.g., "Step 3 of 5 — Select Time"), or use a progress bar

### Complete Responsive Rewrite Strategy

1. **Replace ALL inline styles with Tailwind classes**
2. **Use responsive prefixes**: `sm:`, `md:`, `lg:` throughout
3. **Minimum touch targets**: 44px (Apple/Google HIG) — use `h-11` or `h-12` on all buttons/links
4. **Font sizes**: ≥16px on form inputs (prevents iOS zoom) — use `text-base`
5. **Grid columns**: Reduce on mobile, increase on desktop
6. **Stack layouts**: Side-by-side → stacked on mobile using `flex-col sm:flex-row`
7. **Spacing**: Reduce padding/gaps on mobile: `p-3 sm:p-5`, `gap-2 sm:gap-4`
8. **Step indicator**: Simplified on mobile (progress bar + "Step X of 5")
9. **Navigation buttons**: Full-width on mobile
10. **Form inputs**: `h-12 text-base` (56px, 16px font)

---

## 8. BOOKING WIDGET FLOW

### Step-by-Step Customer Journey

#### Step 1: Select Service
1. Widget loads → fetches services via `getPublicServices(siteId)`
2. Only `is_active = true` AND `allow_online_booking = true` services shown
3. Each service card shows: name, description (truncated), duration, price
4. Customer clicks a service → `selectedService` state updates → advances to Step 2

#### Step 2: Select Staff (Optional)
1. Fetches staff via `getPublicStaff(siteId)`
2. Staff filtered by `selectedService.id` using `staff.services[]` array
3. Generalist staff (no service assignments) appear for ALL services
4. Only `is_active = true` AND `accept_bookings = true` staff shown
5. "Any Available" option always shown (no specific staff preference)
6. Customer clicks a staff member or "Any Available" → advances to Step 3

**⚠️ When service changes, `selectedStaff` resets to null**

#### Step 3: Select Date & Time
1. Calendar renders current month with available dates highlighted
2. Dates disabled if: past, before min_notice hours, beyond max_advance days
3. Customer clicks a date → fetches slots via `getPublicAvailableSlots(siteId, date, serviceId, staffId)`
4. Slot generation:
   - Queries availability rules for the day_of_week
   - Applies blocked/holiday rules
   - Checks existing appointments (with buffer awareness)
   - Generates slots at `slotInterval` intervals (default 30 min)
   - Weekday-aware fallback: Mon-Fri 9-5, Sat-Sun empty
5. Available slots shown in a grid. Taken/blocked slots hidden or shown as disabled
6. Customer clicks a time slot → advances to Step 4

**⚠️ Recently booked slots tracked in a client-side `Set` to prevent double-booking during the session**

#### Step 4: Enter Details
1. Form fields (configurable): name, email, phone, notes, company, address
2. Required fields: name, email (always)
3. Optional: phone, notes, company, address (based on service/settings)
4. Terms & conditions checkbox (if enabled)
5. Custom fields from `service.custom_fields` rendered dynamically
6. Customer fills form → advances to Step 5

#### Step 5: Review & Confirm
1. Summary shows: service name, staff name, date, time, duration, price
2. Customer details shown
3. "Confirm Booking" button calls `createPublicAppointment()`
4. Server-side validations run (see Section 11)
5. If successful: appointment created, emails sent (async), success screen shown
6. Success screen shows: confirmation message, booking details, status (pending or confirmed)

### Important State Variables
```typescript
const [currentStep, setCurrentStep] = useState(0)        // 0-4
const [selectedService, setSelectedService] = useState(null)
const [selectedStaff, setSelectedStaff] = useState(null)
const [selectedDate, setSelectedDate] = useState(null)    // Date object
const [selectedTime, setSelectedTime] = useState(null)    // TimeSlot object
const [customerDetails, setCustomerDetails] = useState({}) // form data
const [isSubmitting, setIsSubmitting] = useState(false)
const [bookingResult, setBookingResult] = useState(null)  // success/error
const [recentlyBookedSlots, setRecentlyBookedSlots] = useState(new Set())
```

---

## 9. EMBED SYSTEM

### Current Architecture
```
External Website                    DRAMAC Platform
────────────────                    ──────────────
<iframe                             /embed/booking/[siteId]?params
  src="https://app.dramacagency       ├── SSR page.tsx
  .com/embed/booking/abc123            ├── Fetches services + staff
  ?color=8B5CF6&radius=8">            ├── Renders static HTML
</iframe>                              ├── PostMessage bridge (DRAMAC_MODULE_READY, DRAMAC_RESIZE)
                                       └── ResizeObserver auto-reports height
```

### Embed Query Parameters
| Param | Default | Options |
|-------|---------|---------|
| `type` | `full` | `full`, `calendar-only`, `button-popup` |
| `color` | `8B5CF6` | Hex without `#` |
| `radius` | `8` | Border radius in px |
| `hideHeader` | — | `1` to hide |
| `hideServices` | — | `1` to hide |
| `hideStaff` | — | `1` to hide |
| `buttonText` | `Book Now` | For button-popup mode |
| `theme` | `auto` | `light`, `dark`, `auto` |

### Embed Code Formats (generated by admin)
1. **iframe** — Standard `<iframe>` with configurable dimensions
2. **JavaScript** — `<script src="/embed/booking.js">` ← **FILE DOES NOT EXIST**
3. **Direct link** — URL to embed page
4. **WordPress shortcode** — `[dramac_booking ...]` ← **PLUGIN DOES NOT EXIST**

### What the Embed Page Currently Shows
- Header: "Book an Appointment" (or business name from settings)
- Service list: Cards with name, duration, price, description
- Staff grid: Cards with avatar (initials fallback), name, bio
- "Book Now" button (non-functional — no click handler)
- Powered by Dramac footer

### What It Should Show
The full interactive `BookingWidgetBlock` with the 5-step booking wizard, allowing customers to complete a booking entirely within the embed.

### PostMessage Bridge
The embed page communicates with the parent (embedding) page via `window.parent.postMessage()`:
- `DRAMAC_MODULE_READY` — sent when page loads
- `DRAMAC_RESIZE` — sent with `{ height }` whenever content height changes (via ResizeObserver)

This allows the parent page to auto-size the iframe.

### Fix Required
1. Replace the static HTML content with a client-side `BookingWidgetBlock` component
2. Or add a redirect button to the full booking page on the published site
3. Create `/embed/booking.js` script (an iframe loader) or remove the option
4. Remove WordPress shortcode option or clearly label as "coming soon"

---

## 10. STAFF MANAGEMENT

### Admin Workflow
1. **Create Staff**: Admin fills in name, email, phone, bio, avatar → `createStaff()`
2. **Assign Services**: Admin selects which services the staff member can provide → `assignStaffToService()`
3. **Set Availability**: Availability is set via availability rules (NOT per-staff `default_availability`)
4. **Toggle Visibility**: `is_active` hides/shows everywhere; `accept_bookings` hides from public only
5. **Delete Staff**: Removes staff record + all service assignments

### Public Staff Display
- Only `is_active = true` AND `accept_bookings = true` shown
- Staff enriched with their service assignments (from junction table)
- In the widget, staff are filtered by the selected service
- "Any Available" option skips staff selection (system picks first available)
- Staff avatar shown if `avatar_url` exists; otherwise initials in a colored circle

### Known Issue: `working_hours` vs `default_availability`
The TypeScript `Staff` type has `working_hours` but the DB column is `default_availability`. The `working_hours` field is never used in slot calculation. Availability is driven entirely by the `mod_bookmod01_availability` table.

**Fix**: Either rename the TypeScript field to match the DB, or add a migration to rename the DB column. The `default_availability` field should be used as a quick-setup mechanism to generate availability rules when a staff member is created.

---

## 11. AVAILABILITY AND SCHEDULING

### Availability Rule Types
| Type | Purpose | Example |
|------|---------|---------|
| `available` | Regular working hours | Mon-Fri 9:00-17:00 |
| `blocked` | Time-off, breaks | Lunch 12:00-13:00 |
| `holiday` | Full-day closure | Dec 25 |

### Rule Matching
1. **Recurring rules**: Match by `day_of_week` (0=Sun, 6=Sat)
2. **Specific date rules**: Match by `specific_date` (overrides recurring)
3. **Priority**: Higher `priority` value overrides lower
4. **Staff-specific**: `staff_id` set → only applies to that staff member
5. **Service-specific**: `service_id` set → only applies to that service

### Slot Generation Algorithm (Public)
```
Input: siteId, dateString (YYYY-MM-DD), serviceId, staffId?

1. Parse dateString → UTC date
2. Reject if past or beyond max_booking_advance_days
3. Get service (duration, buffer_before, buffer_after)
4. Get settings (slot_interval, min_booking_notice_hours)
5. Get eligible staff:
   - If staffId specified: just that staff
   - Else: all staff assigned to this service + generalists
6. For EACH eligible staff member:
   a. Query availability rules for day_of_week=dayOfWeek AND rule_type='available'
   b. Query blocked rules for same day
   c. Query existing appointments for the date (all statuses except cancelled)
   d. Weekday-aware fallback: If no rules AND weekday (Mon-Fri) → 9:00-17:00 available
                              If no rules AND weekend (Sat-Sun) → NO slots
   e. For each availability window:
      - Generate slots at slotInterval (e.g., 9:00, 9:30, 10:00, ...)
      - For each potential slot:
        * Calculate blocked window: [start - bufferBefore, end + bufferAfter]
        * Check against blocked rules → skip if overlap
        * Check against existing appointments → skip if overlap
        * Check against min_booking_notice → skip if too soon
      - Add passing slots to results
7. Deduplicate: if same time from multiple staff, prefer 'available' status
8. Sort by start time
9. Return TimeSlot[]
```

### Double-Booking Prevention
1. **Client-side**: `recentlyBookedSlots` Set prevents selecting just-booked slots
2. **Server-side**: `createPublicAppointment()` checks for conflicts before insert
3. **Database-level**: Unique index `idx_prevent_double_booking` catches race conditions (error code `23505` → user-friendly "slot just taken" message)

### Timezone Handling
- **Public path**: Uses `Date.UTC()` throughout — prevents timezone-induced double-booking
- **Admin path**: Uses local `Date` parsing — timezone shift possible
- **Settings**: `timezone` field on settings (default `Africa/Lusaka` UTC+2)
- **Appointments**: `start_time` and `end_time` stored as `timestamptz` in DB

---

## 12. EMAIL NOTIFICATIONS

### Current Email Types
| Event | Customer Email | Owner Email | In-App |
|-------|---------------|-------------|--------|
| New booking | ✅ `booking_confirmation_customer` | ✅ `booking_confirmation_owner` | ✅ |
| Cancellation | ✅ `booking_cancelled_customer` | ✅ `booking_cancelled_owner` | ✅ |
| Confirmation | ❌ | ❌ | ❌ |
| Completion | ❌ | ❌ | ❌ |
| No-show | ❌ | ❌ | ❌ |
| Rescheduling | ❌ | ❌ | ❌ |
| Reminder | ❌ (table exists, no scheduler) | ❌ | ❌ |

### Email Data Payload
```typescript
{
  customerName, customerEmail, customerPhone,
  serviceName, staffName,
  date, time, duration, price,
  status,  // 'pending' or 'confirmed'
  businessName, dashboardUrl, bookingId
}
```

### Branding
- Customer emails use site branding via `sendBrandedEmail(siteId, ...)`
- Owner emails use agency branding
- Both go through the branded template system (logo, colors, fonts)

### Missing Notifications That Should Be Added
1. **Confirmation email** — When admin confirms a pending booking, customer should be notified
2. **Rescheduling email** — When appointment time changes
3. **Reminder emails** — The `mod_bookmod01_reminders` table and settings exist, but no cron/scheduler sends them
4. **Status change emails** — When admin marks as completed or no-show

---

## 13. ADMIN DASHBOARD

### Views at `/dashboard/sites/[siteId]/booking`

| Tab | File | Features |
|-----|------|----------|
| Calendar | `calendar-view.tsx` | Visual calendar with appointments |
| Appointments | `appointments-view.tsx` | List with filters (status, date, search) |
| Services | `services-view.tsx` | CRUD for services |
| Staff | `staff-view.tsx` | CRUD for staff + service assignment |
| Analytics | `analytics-view.tsx` | Stats, top services, top staff |
| Settings | `settings-view.tsx` | 5-tab settings (General, Rules, Notifications, Appearance, Payments) |
| Embed | `embed-code-view.tsx` | Code generation for external embedding |

### Admin Actions Available
- Create/edit/delete services
- Create/edit/delete staff members
- Assign/remove staff from services
- View/filter/search appointments
- Manually create appointments
- Cancel appointments (with reason → sends notification)
- Update appointment status (pending → confirmed → completed → no-show)
- Configure availability rules (add/edit/delete)
- Manage calendars
- View analytics
- Configure settings (all 5 tabs)
- Generate embed code

### Known Admin Issues
1. Analytics trends are placeholder (no actual period comparison)
2. No time-series chart for bookings over time
3. Revenue only counts `payment_amount` (often null for manual tracking)
4. No export functionality (appointments to CSV)
5. Availability rule management UI could be more intuitive
6. No bulk operations (e.g., cancel all appointments for a date)

---

## 14. ANALYTICS

### Current Metrics
| Metric | Source |
|--------|--------|
| Total appointments | Count of all appointments |
| Completed | Count where `status = 'completed'` |
| Cancelled | Count where `status = 'cancelled'` |
| No-shows | Count where `status = 'no_show'` |
| Pending | Count where `status = 'pending'` |
| Confirmed | Count where `status = 'confirmed'` |
| Revenue | Sum of `payment_amount` on completed appointments |
| Avg per day | Total / days in range |
| Completion rate | Completed / Total |
| Cancellation rate | Cancelled / Total |
| No-show rate | No-show / Total |
| Top 5 services | By booking count |
| Top 5 staff | By appointment count + completion rate |

### Date Ranges
7 days, 30 days, 90 days, 1 year, All time

### Display
- Stat cards with colored icons (no chart library)
- Status breakdown as CSS-based horizontal bar
- Top services/staff as ranked lists with counts
- Trend indicators (▲/▼ percentage) — **NOT ACTUALLY COMPUTED** (placeholder)

---

## 15. PUBLISHED SITE INTEGRATION

### How Booking Appears on Published Sites

1. **Module installed** → `auto-setup-actions.ts` creates `/book` page
2. **Page content**: Hero section + `BookingWidget` component
3. **Navigation**: `smart-navigation.ts` injects:
   - Main nav: "Book Now" → `/book`
   - Utility: "Book Now" → `/book` (with calendar icon)
   - Footer: "Book Appointment" → `/book`
4. **Rendering**: `StudioRenderer` resolves brand colors → injects into `BookingWidgetBlock` props

### Widget Injection on Published Sites
The `BookingWidgetBlock` is registered as `BookingWidget` in Studio. When the page JSON contains a `BookingWidget` component, StudioRenderer:
1. Looks up the component in the registry
2. Injects brand colors via `injectBrandColors()` using `BRAND_COLOR_MAP`
3. Injects brand fonts via `injectBrandFonts()`
4. Wraps in module containment section
5. Renders with injected props

### Module Loading
Module components are dynamically imported with a 3-second timeout. If loading fails, the page renders without the module component (no error shown to user).

---

## 16. SETTINGS SYSTEM

### Settings Structure
| Tab | Fields |
|-----|--------|
| **General** | Business name, timezone, date format, time format, notification email |
| **Booking Rules** | Min notice hours, max advance days, cancellation notice hours, slot interval minutes, auto-confirm |
| **Notifications** | Confirmation email enabled, reminder hours (array) |
| **Appearance** | Accent color, logo URL |
| **Payments** | Require payment, payment provider |

### Settings Storage
Single row in `mod_bookmod01_settings` keyed by `site_id` (unique constraint).

### Settings Initialization
When booking module is first accessed for a site, `initializeBookingForSite()` creates defaults:
```typescript
{
  business_name: '', 
  timezone: 'Africa/Lusaka',
  slot_interval_minutes: 30,
  min_booking_notice_hours: 1,
  max_booking_advance_days: 90,
  cancellation_notice_hours: 24,
  auto_confirm: true,
  confirmation_email_enabled: true,
  accent_color: '#3B82F6',  // ← HARDCODED BLUE — should be ''
  reminder_hours: [24, 1],
}
```

### Settings Impact on Booking Flow
| Setting | Effect |
|---------|--------|
| `min_booking_notice_hours` | Slots closer than this many hours to now are disabled |
| `max_booking_advance_days` | Dates beyond this many days in the future are disabled |
| `slot_interval_minutes` | Gap between slot start times (e.g., 30 = 9:00, 9:30, 10:00...) |
| `auto_confirm` | If true, new bookings go to 'confirmed'. If false, 'pending' (admin must confirm) |
| `require_payment` | If true, shows payment step (NOT IMPLEMENTED — acknowledged in UI) |
| `cancellation_notice_hours` | How many hours before appointment customer can cancel (NOT ENFORCED — no self-service cancel) |

---

## 17. MISSING FEATURES AND PRIORITIES

### High Priority (Should Be Done for Production)

| Feature | Status | Impact |
|---------|--------|--------|
| Mobile-responsive BookingWidgetBlock | ❌ NOT DONE | Unusable on mobile |
| Interactive embed (complete bookings from iframe) | ❌ NOT DONE | External embedding broken |
| Confirmation email when admin confirms booking | ❌ NOT DONE | Customer not notified |
| Rescheduling with notification | ❌ NOT DONE | No way to change time + notify |
| Customer self-service cancel | ❌ NOT DONE | Customer must contact business to cancel |
| Proper CRM auto-contact creation | ❌ NOT DONE | Setting exists, no logic |
| Fix all hardcoded colors | ❌ NOT DONE | Branding inconsistency |

### Medium Priority (Nice for Production)

| Feature | Status | Notes |
|---------|--------|-------|
| Automated reminders | Table + settings exist, no scheduler | Need a cron job or Supabase edge function |
| Status change emails (completed, no-show) | Missing | Minor — most businesses handle offline |
| Admin weekend availability fix | Missing | Admin sees wrong slots on weekends |
| Analytics trend calculation | Placeholder | Visual polish |
| Appointment export (CSV) | Missing | Useful for record-keeping |
| Category management for services | DB column exists, no UI | Organization feature |

### Low Priority (Future Enhancement)

| Feature | Status | Notes |
|---------|--------|-------|
| Recurring appointments | DB columns exist, no logic | Complex — involves RRULE parsing |
| External calendar sync (Google/Outlook) | DB columns exist, no sync | Requires OAuth + iCal parsing |
| Payment integration | Settings exist, no implementation | Major feature — separate phase |
| SMS reminders | Type supports it, no implementation | Requires SMS provider integration |
| Group bookings | `max_attendees` column exists, no UI | Complex — attendee management |
| Waiting list | Not started | Capacity management |
| Customer booking portal | Not started | Self-service management |
| iCal export | Not started | Calendar subscription |

---

## 18. TESTING CHECKLIST

### Before Shipping — Verify Each Item

#### Critical Path (Booking Flow on Published Site)
- [ ] `/book` page loads with services displayed
- [ ] Services show correct name, description, duration, price
- [ ] Clicking a service advances to staff selection
- [ ] Staff filtered by selected service (generalists always shown)
- [ ] "Any Available" option works
- [ ] Clicking staff advances to date/time selection
- [ ] Calendar shows correct month with navigation
- [ ] Past dates are disabled
- [ ] Dates beyond max advance are disabled
- [ ] Clicking a date fetches and shows available time slots
- [ ] Weekday slots show correctly (with or without availability rules)
- [ ] Weekend slots are empty by default (when no rules set)
- [ ] Clicking a time slot advances to details form
- [ ] Form fields render correctly (name, email, phone, notes)
- [ ] Required field validation works
- [ ] Advancing to confirmation step shows correct summary
- [ ] "Confirm Booking" succeeds → appointment created in DB
- [ ] Success screen shows booking details + status (pending or confirmed)
- [ ] Customer receives confirmation email with correct site branding
- [ ] Admin receives notification email
- [ ] Appointment appears in admin dashboard calendar + appointments list
- [ ] Double-booking prevention works (try booking same slot twice rapidly)

#### Mobile Testing (CRITICAL)
- [ ] All above steps work on mobile (375px width)
- [ ] Service cards stack correctly and are fully readable
- [ ] Staff cards are appropriately sized with clear photos/initials
- [ ] Calendar days are tappable (≥44px touch targets)
- [ ] Time slots are tappable (≥44px touch targets)
- [ ] Form inputs don't trigger iOS Safari zoom (font ≥16px)
- [ ] "Confirm Booking" button is easily reachable (sticky or clearly visible)
- [ ] Step indicator doesn't overflow
- [ ] Navigation buttons (Previous/Next) are full-width and easy to tap
- [ ] Text doesn't overflow or get cut off

#### Branding
- [ ] Widget uses site's brand primary color (not purple or DRAMAC blue)
- [ ] Buttons use brand color
- [ ] Selected service/staff highlight uses brand color
- [ ] Selected time slot uses brand color
- [ ] Step indicator active state uses brand color
- [ ] Form focus rings use brand color
- [ ] Confirmation success icon uses brand color
- [ ] Emails use site logo, colors, and fonts
- [ ] No hardcoded `#8B5CF6`, `#3B82F6`, `#7c3aed`, `#ddd6fe` visible

#### Embed Testing
- [ ] iframe embed loads on external page
- [ ] Embed shows full interactive booking widget (not just static list)
- [ ] Customer can complete entire booking flow within embed
- [ ] Embed auto-resizes as content changes (PostMessage bridge works)
- [ ] Embed respects brand color from query parameter
- [ ] Embed loads site fonts correctly

#### Admin Dashboard
- [ ] Services CRUD works (create, edit, delete)
- [ ] Staff CRUD works (create, edit, delete, assign services)
- [ ] Appointments list shows all bookings with correct statuses
- [ ] Admin can manually create appointments
- [ ] Admin can cancel appointments (sends notification)
- [ ] Admin can change appointment status
- [ ] Calendar view shows appointments on correct dates/times
- [ ] Availability rules can be created/edited/deleted
- [ ] Settings save correctly across all 5 tabs
- [ ] Analytics show correct counts

#### Edge Cases
- [ ] Service with no staff assigned → "Any Available" still works
- [ ] Staff with no services → appears as generalist for all services
- [ ] Date with all slots booked → shows "No available slots" message
- [ ] Very long service name → doesn't break layout
- [ ] Very long staff bio → truncates properly
- [ ] Multiple bookings in quick succession → no race conditions
- [ ] Customer with special characters in name/email
- [ ] Service with $0 price → shows "Free" or similar
- [ ] Service with buffer times → adjacent slots blocked correctly
- [ ] Booking at end of availability window → slot end time doesn't exceed window end

---

## END OF DOCUMENT

This document contains every detail needed to make the DRAMAC CMS Booking module production-ready. The AI implementing these fixes should:

1. Start with mobile responsiveness (Bug 1) — this is the most impactful
2. Fix all hardcoded colors (Bug 4)
3. Make embed page interactive (Bug 2)
4. Add missing confirmation/rescheduling emails
5. Fix admin weekend availability (Bug 5)
6. Add customer self-service cancellation
7. Test the complete flow end-to-end
8. Verify all emails send with correct branding

**The Supabase project ID is `nfirsqmyxmmtbignofgb`** — use MCP tools to run migrations and verify data.
