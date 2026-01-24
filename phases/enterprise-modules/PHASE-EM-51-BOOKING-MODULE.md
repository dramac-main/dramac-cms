# Phase EM-51: Booking Module

> **Priority**: 🟠 HIGH
> **Estimated Time**: 15-20 hours
> **Prerequisites**: EM-01, EM-05, EM-11, EM-12, EM-13, EM-50
> **Status**: 📋 READY TO IMPLEMENT
> **Module Short ID**: `bookmod01`
> **Table Prefix**: `mod_bookmod01_`

---

## 🎯 Objective

Create a **full-featured booking/scheduling module** that:
1. Manages calendars and availability
2. Handles appointment booking
3. Supports multiple service types
4. Provides reminders and notifications
5. **Integrates with CRM (EM-50) for customer data**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING MODULE                           │
│              (mod_bookmod01_ prefix)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Services  │  │ Calendars  │  │   Staff    │            │
│  │ What can   │  │ When it's  │  │ Who does   │            │
│  │ be booked  │  │ available  │  │   it       │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │               │               │                   │
│         └───────────────┼───────────────┘                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────┐               │
│  │            APPOINTMENTS                 │               │
│  │  Customer + Service + Staff + Time      │               │
│  └─────────────────────────────────────────┘               │
│                         │                                   │
│         ┌───────────────┼───────────────┐                  │
│         ▼               ▼               ▼                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Reminders  │  │CRM Contact │  │  Settings  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Module Structure

**Following CRM pattern exactly:**

```
src/modules/booking/
├── index.ts                    # Module exports
├── manifest.ts                 # Module manifest (ModuleManifest type)
├── types/
│   └── booking-types.ts        # All TypeScript interfaces
├── actions/
│   └── booking-actions.ts      # Server actions ('use server')
├── context/
│   └── booking-context.tsx     # React context provider
└── components/
    ├── index.ts                # Component exports
    ├── booking-dashboard.tsx   # Main dashboard component
    ├── dialogs/
    │   ├── index.ts
    │   ├── create-service-dialog.tsx
    │   ├── create-staff-dialog.tsx
    │   ├── create-appointment-dialog.tsx
    │   ├── create-calendar-dialog.tsx
    │   └── booking-settings-dialog.tsx
    ├── views/
    │   ├── index.ts
    │   ├── calendar-view.tsx       # Weekly/monthly calendar
    │   ├── appointments-view.tsx   # Appointment list
    │   ├── services-view.tsx       # Services management
    │   ├── staff-view.tsx          # Staff management
    │   └── analytics-view.tsx      # Booking analytics
    └── sheets/
        ├── index.ts
        ├── appointment-detail-sheet.tsx
        ├── service-detail-sheet.tsx
        └── staff-detail-sheet.tsx
```

---

## 📋 Database Schema

```sql
-- migrations/em-51-booking-module-schema.sql

-- =============================================================================
-- Phase EM-51: Booking Module Database Schema
-- =============================================================================
-- Module Short ID: bookmod01
-- Table Prefix: mod_bookmod01_
-- Following EM-05 naming conventions (matches CRM pattern)
-- =============================================================================

-- =============================================================================
-- SERVICES TABLE (What can be booked)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_bookmod01_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant (site_id ONLY - matches CRM pattern)
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Service details
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Duration
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 0,
  
  -- Pricing
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Capacity
  max_attendees INTEGER DEFAULT 1,  -- 1 = 1:1, >1 = group
  
  -- Settings
  allow_online_booking BOOLEAN DEFAULT true,
  require_confirmation BOOLEAN DEFAULT false,
  require_payment BOOLEAN DEFAULT false,
  
  -- Display
  color TEXT DEFAULT '#3B82F6',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Custom fields (matches CRM pattern)
  custom_fields JSONB NOT NULL DEFAULT '{}',
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(site_id, slug)
);

CREATE INDEX idx_mod_bookmod01_services_site ON mod_bookmod01_services(site_id);
CREATE INDEX idx_mod_bookmod01_services_active ON mod_bookmod01_services(site_id) WHERE is_active = true;

-- =============================================================================
-- STAFF MEMBERS TABLE (Who provides services)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_bookmod01_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Link to platform user (optional)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Staff details
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Display
  avatar_url TEXT,
  bio TEXT,
  
  -- Availability defaults (JSONB for flexibility)
  default_availability JSONB NOT NULL DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  
  -- Settings
  accept_bookings BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_bookmod01_staff_site ON mod_bookmod01_staff(site_id);
CREATE INDEX idx_mod_bookmod01_staff_user ON mod_bookmod01_staff(user_id);

-- =============================================================================
-- STAFF-SERVICE ASSIGNMENTS (Many-to-many)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_bookmod01_staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Site for RLS
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  staff_id UUID NOT NULL REFERENCES mod_bookmod01_staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES mod_bookmod01_services(id) ON DELETE CASCADE,
  
  -- Override pricing (optional)
  custom_price NUMERIC(10,2),
  custom_duration_minutes INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(staff_id, service_id)
);

CREATE INDEX idx_mod_bookmod01_staff_services_site ON mod_bookmod01_staff_services(site_id);

-- =============================================================================
-- CALENDARS TABLE (Availability containers)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_bookmod01_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Calendar details
  name TEXT NOT NULL,
  description TEXT,
  
  -- Type
  type TEXT DEFAULT 'staff' CHECK (type IN ('staff', 'resource', 'location')),
  
  -- Link to staff
  staff_id UUID REFERENCES mod_bookmod01_staff(id) ON DELETE SET NULL,
  
  -- Timezone
  timezone TEXT DEFAULT 'UTC',
  
  -- External calendar sync
  external_calendar_url TEXT,
  external_calendar_type TEXT,  -- 'google', 'outlook', 'ical'
  last_synced_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_bookmod01_calendars_site ON mod_bookmod01_calendars(site_id);
CREATE INDEX idx_mod_bookmod01_calendars_staff ON mod_bookmod01_calendars(staff_id);

-- =============================================================================
-- AVAILABILITY RULES TABLE (Working hours)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_bookmod01_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- What this applies to (at least one required)
  calendar_id UUID REFERENCES mod_bookmod01_calendars(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES mod_bookmod01_staff(id) ON DELETE CASCADE,
  service_id UUID REFERENCES mod_bookmod01_services(id) ON DELETE CASCADE,
  
  -- Rule type
  rule_type TEXT NOT NULL CHECK (rule_type IN ('available', 'blocked', 'holiday')),
  
  -- When (recurring - day_of_week based)
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  
  -- When (specific date override)
  specific_date DATE,
  
  -- Date range (for seasonal availability)
  valid_from DATE,
  valid_until DATE,
  
  -- Priority (higher = more important, for rule resolution)
  priority INTEGER DEFAULT 0,
  
  -- Label for UI
  label TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_bookmod01_availability_calendar ON mod_bookmod01_availability(calendar_id);
CREATE INDEX idx_mod_bookmod01_availability_staff ON mod_bookmod01_availability(staff_id);
CREATE INDEX idx_mod_bookmod01_availability_site ON mod_bookmod01_availability(site_id);
CREATE INDEX idx_mod_bookmod01_availability_day ON mod_bookmod01_availability(day_of_week);

-- =============================================================================
-- APPOINTMENTS TABLE (The actual bookings)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_bookmod01_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- What
  service_id UUID NOT NULL REFERENCES mod_bookmod01_services(id),
  
  -- Who provides
  staff_id UUID REFERENCES mod_bookmod01_staff(id) ON DELETE SET NULL,
  calendar_id UUID REFERENCES mod_bookmod01_calendars(id) ON DELETE SET NULL,
  
  -- Customer info (stored directly for non-CRM bookings)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_notes TEXT,
  
  -- CRM Integration (link to CRM contact if available)
  crm_contact_id UUID,  -- References mod_crmmod01_contacts(id)
  
  -- When
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  
  -- Status (matches CRM deal pattern)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting confirmation
    'confirmed',    -- Confirmed
    'cancelled',    -- Cancelled
    'completed',    -- Done
    'no_show'       -- Customer didn't show
  )),
  
  -- Cancellation tracking
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT CHECK (cancelled_by IN ('customer', 'staff', 'system')),
  cancellation_reason TEXT,
  
  -- Payment (for future billing integration)
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'refunded', 'failed', 'not_required'
  )),
  payment_amount NUMERIC(10,2),
  payment_id TEXT,  -- External payment reference
  
  -- Recurring appointments
  recurring_id UUID,  -- Links recurring appointments together
  recurring_rule TEXT,  -- RRULE format for recurring
  
  -- Reminders
  reminder_sent_at TIMESTAMPTZ,
  
  -- Metadata & Custom fields
  metadata JSONB NOT NULL DEFAULT '{}',
  custom_fields JSONB NOT NULL DEFAULT '{}',
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_bookmod01_appointments_site ON mod_bookmod01_appointments(site_id);
CREATE INDEX idx_mod_bookmod01_appointments_time ON mod_bookmod01_appointments(site_id, start_time);
CREATE INDEX idx_mod_bookmod01_appointments_status ON mod_bookmod01_appointments(site_id, status);
CREATE INDEX idx_mod_bookmod01_appointments_staff ON mod_bookmod01_appointments(staff_id, start_time);
CREATE INDEX idx_mod_bookmod01_appointments_service ON mod_bookmod01_appointments(service_id);
CREATE INDEX idx_mod_bookmod01_appointments_crm ON mod_bookmod01_appointments(crm_contact_id);

-- =============================================================================
-- REMINDERS TABLE (Scheduled notifications)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_bookmod01_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Site for RLS
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  appointment_id UUID NOT NULL REFERENCES mod_bookmod01_appointments(id) ON DELETE CASCADE,
  
  -- When to send
  send_at TIMESTAMPTZ NOT NULL,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error TEXT,
  
  -- Content
  subject TEXT,
  body TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_bookmod01_reminders_pending ON mod_bookmod01_reminders(send_at) 
  WHERE status = 'pending';
CREATE INDEX idx_mod_bookmod01_reminders_appointment ON mod_bookmod01_reminders(appointment_id);

-- =============================================================================
-- SETTINGS TABLE (Per-site configuration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mod_bookmod01_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  
  -- General
  business_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  
  -- Booking rules
  min_booking_notice_hours INTEGER DEFAULT 24,
  max_booking_advance_days INTEGER DEFAULT 90,
  cancellation_notice_hours INTEGER DEFAULT 24,
  slot_interval_minutes INTEGER DEFAULT 30,
  
  -- Reminders (array of hours before appointment)
  reminder_hours JSONB DEFAULT '[24, 1]',
  
  -- Confirmation
  auto_confirm BOOLEAN DEFAULT false,
  confirmation_email_enabled BOOLEAN DEFAULT true,
  
  -- Appearance
  accent_color TEXT DEFAULT '#3B82F6',
  logo_url TEXT,
  
  -- Payment
  require_payment BOOLEAN DEFAULT false,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal', 'paddle')),
  
  -- Notifications
  notification_email TEXT,
  
  -- CRM Integration
  auto_create_crm_contact BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE mod_bookmod01_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_bookmod01_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_bookmod01_staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_bookmod01_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_bookmod01_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_bookmod01_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_bookmod01_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_bookmod01_settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SERVICES POLICIES
-- =============================================================================

CREATE POLICY "Users can view services in their sites"
  ON mod_bookmod01_services FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert services in their sites"
  ON mod_bookmod01_services FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update services in their sites"
  ON mod_bookmod01_services FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete services in their sites"
  ON mod_bookmod01_services FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- STAFF POLICIES
-- =============================================================================

CREATE POLICY "Users can view staff in their sites"
  ON mod_bookmod01_staff FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can manage staff in their sites"
  ON mod_bookmod01_staff FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

-- =============================================================================
-- STAFF SERVICES POLICIES
-- =============================================================================

CREATE POLICY "Users can view staff services in their sites"
  ON mod_bookmod01_staff_services FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can manage staff services in their sites"
  ON mod_bookmod01_staff_services FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

-- =============================================================================
-- CALENDARS POLICIES
-- =============================================================================

CREATE POLICY "Users can view calendars in their sites"
  ON mod_bookmod01_calendars FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can manage calendars in their sites"
  ON mod_bookmod01_calendars FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

-- =============================================================================
-- AVAILABILITY POLICIES
-- =============================================================================

CREATE POLICY "Users can view availability in their sites"
  ON mod_bookmod01_availability FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can manage availability in their sites"
  ON mod_bookmod01_availability FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

-- =============================================================================
-- APPOINTMENTS POLICIES
-- =============================================================================

CREATE POLICY "Users can view appointments in their sites"
  ON mod_bookmod01_appointments FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert appointments in their sites"
  ON mod_bookmod01_appointments FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update appointments in their sites"
  ON mod_bookmod01_appointments FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete appointments in their sites"
  ON mod_bookmod01_appointments FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- REMINDERS POLICIES
-- =============================================================================

CREATE POLICY "Users can view reminders in their sites"
  ON mod_bookmod01_reminders FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can manage reminders in their sites"
  ON mod_bookmod01_reminders FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

-- =============================================================================
-- SETTINGS POLICIES
-- =============================================================================

CREATE POLICY "Users can view settings in their sites"
  ON mod_bookmod01_settings FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Admins can manage settings in their sites"
  ON mod_bookmod01_settings FOR ALL
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- PUBLIC BOOKING POLICIES (For embed widget)
-- =============================================================================

-- Allow anonymous users to view active services (for booking widget)
CREATE POLICY "Anyone can view active services for booking"
  ON mod_bookmod01_services FOR SELECT
  USING (is_active = true AND allow_online_booking = true);

-- Allow anonymous users to view staff for booking
CREATE POLICY "Anyone can view active staff for booking"
  ON mod_bookmod01_staff FOR SELECT
  USING (is_active = true AND accept_bookings = true);

-- Allow anonymous users to view availability for booking
CREATE POLICY "Anyone can view availability for booking"
  ON mod_bookmod01_availability FOR SELECT
  USING (true);

-- Allow anonymous users to create appointments (public booking)
CREATE POLICY "Anyone can create appointments via public booking"
  ON mod_bookmod01_appointments FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION mod_bookmod01_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mod_bookmod01_services_updated
  BEFORE UPDATE ON mod_bookmod01_services
  FOR EACH ROW EXECUTE FUNCTION mod_bookmod01_update_timestamp();

CREATE TRIGGER trg_mod_bookmod01_staff_updated
  BEFORE UPDATE ON mod_bookmod01_staff
  FOR EACH ROW EXECUTE FUNCTION mod_bookmod01_update_timestamp();

CREATE TRIGGER trg_mod_bookmod01_calendars_updated
  BEFORE UPDATE ON mod_bookmod01_calendars
  FOR EACH ROW EXECUTE FUNCTION mod_bookmod01_update_timestamp();

CREATE TRIGGER trg_mod_bookmod01_appointments_updated
  BEFORE UPDATE ON mod_bookmod01_appointments
  FOR EACH ROW EXECUTE FUNCTION mod_bookmod01_update_timestamp();

CREATE TRIGGER trg_mod_bookmod01_settings_updated
  BEFORE UPDATE ON mod_bookmod01_settings
  FOR EACH ROW EXECUTE FUNCTION mod_bookmod01_update_timestamp();
```

---

## 📋 TypeScript Types

```typescript
// src/modules/booking/types/booking-types.ts

/**
 * Booking Module TypeScript Types
 * 
 * Phase EM-51: Booking Module
 * 
 * These types define the data structures for all Booking entities
 * Following CRM module pattern exactly
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'not_required'
export type ReminderType = 'email' | 'sms' | 'push'
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled'
export type CalendarType = 'staff' | 'resource' | 'location'
export type AvailabilityRuleType = 'available' | 'blocked' | 'holiday'
export type TimeFormat = '12h' | '24h'
export type CancelledBy = 'customer' | 'staff' | 'system'

// ============================================================================
// SERVICES
// ============================================================================

export interface Service {
  id: string
  site_id: string
  
  // Details
  name: string
  slug: string
  description?: string | null
  
  // Duration
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  
  // Pricing
  price?: number | null
  currency: string
  
  // Capacity
  max_attendees: number
  
  // Settings
  allow_online_booking: boolean
  require_confirmation: boolean
  require_payment: boolean
  
  // Display
  color: string
  image_url?: string | null
  sort_order: number
  
  // Status
  is_active: boolean
  
  // Custom
  custom_fields: Record<string, unknown>
  
  // Audit
  created_by?: string | null
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  staff?: Staff[]
}

export type ServiceInput = Omit<Service, 'id' | 'created_at' | 'updated_at' | 'staff'>
export type ServiceUpdate = Partial<ServiceInput>

// ============================================================================
// STAFF
// ============================================================================

export interface Staff {
  id: string
  site_id: string
  
  // Link to user
  user_id?: string | null
  
  // Details
  name: string
  email?: string | null
  phone?: string | null
  
  // Display
  avatar_url?: string | null
  bio?: string | null
  
  // Availability
  default_availability: Record<string, unknown>
  timezone: string
  
  // Settings
  accept_bookings: boolean
  
  // Status
  is_active: boolean
  
  // Audit
  created_at: string
  updated_at: string
  
  // Relations
  services?: Service[]
  calendar?: Calendar | null
}

export type StaffInput = Omit<Staff, 'id' | 'created_at' | 'updated_at' | 'services' | 'calendar'>
export type StaffUpdate = Partial<StaffInput>

// ============================================================================
// STAFF SERVICE ASSIGNMENT
// ============================================================================

export interface StaffService {
  id: string
  site_id: string
  staff_id: string
  service_id: string
  
  custom_price?: number | null
  custom_duration_minutes?: number | null
  
  created_at: string
  
  // Relations
  staff?: Staff
  service?: Service
}

export type StaffServiceInput = Omit<StaffService, 'id' | 'created_at' | 'staff' | 'service'>

// ============================================================================
// CALENDARS
// ============================================================================

export interface Calendar {
  id: string
  site_id: string
  
  // Details
  name: string
  description?: string | null
  
  // Type
  type: CalendarType
  
  // Link
  staff_id?: string | null
  
  // Timezone
  timezone: string
  
  // External sync
  external_calendar_url?: string | null
  external_calendar_type?: string | null
  last_synced_at?: string | null
  
  // Status
  is_active: boolean
  
  // Audit
  created_at: string
  updated_at: string
  
  // Relations
  staff?: Staff | null
  availability?: Availability[]
}

export type CalendarInput = Omit<Calendar, 'id' | 'created_at' | 'updated_at' | 'staff' | 'availability'>
export type CalendarUpdate = Partial<CalendarInput>

// ============================================================================
// AVAILABILITY
// ============================================================================

export interface Availability {
  id: string
  site_id: string
  
  // What this applies to
  calendar_id?: string | null
  staff_id?: string | null
  service_id?: string | null
  
  // Rule type
  rule_type: AvailabilityRuleType
  
  // When (recurring)
  day_of_week?: number | null  // 0=Sunday, 6=Saturday
  start_time?: string | null   // TIME format
  end_time?: string | null     // TIME format
  
  // When (specific date)
  specific_date?: string | null
  
  // Date range
  valid_from?: string | null
  valid_until?: string | null
  
  // Priority
  priority: number
  
  // Label
  label?: string | null
  
  // Audit
  created_at: string
}

export type AvailabilityInput = Omit<Availability, 'id' | 'created_at'>
export type AvailabilityUpdate = Partial<AvailabilityInput>

// ============================================================================
// APPOINTMENTS
// ============================================================================

export interface Appointment {
  id: string
  site_id: string
  
  // What
  service_id: string
  
  // Who provides
  staff_id?: string | null
  calendar_id?: string | null
  
  // Customer
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
  customer_notes?: string | null
  
  // CRM Link
  crm_contact_id?: string | null
  
  // When
  start_time: string
  end_time: string
  timezone: string
  
  // Status
  status: AppointmentStatus
  
  // Cancellation
  cancelled_at?: string | null
  cancelled_by?: CancelledBy | null
  cancellation_reason?: string | null
  
  // Payment
  payment_status: PaymentStatus
  payment_amount?: number | null
  payment_id?: string | null
  
  // Recurring
  recurring_id?: string | null
  recurring_rule?: string | null
  
  // Reminders
  reminder_sent_at?: string | null
  
  // Metadata
  metadata: Record<string, unknown>
  custom_fields: Record<string, unknown>
  
  // Audit
  created_by?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  service?: Service | null
  staff?: Staff | null
  reminders?: Reminder[]
}

export type AppointmentInput = Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'service' | 'staff' | 'reminders'>
export type AppointmentUpdate = Partial<AppointmentInput>

// ============================================================================
// REMINDERS
// ============================================================================

export interface Reminder {
  id: string
  site_id: string
  appointment_id: string
  
  send_at: string
  type: ReminderType
  status: ReminderStatus
  sent_at?: string | null
  error?: string | null
  
  subject?: string | null
  body?: string | null
  
  created_at: string
}

export type ReminderInput = Omit<Reminder, 'id' | 'created_at'>

// ============================================================================
// SETTINGS
// ============================================================================

export interface BookingSettings {
  id: string
  site_id: string
  
  // General
  business_name?: string | null
  timezone: string
  date_format: string
  time_format: TimeFormat
  
  // Booking rules
  min_booking_notice_hours: number
  max_booking_advance_days: number
  cancellation_notice_hours: number
  slot_interval_minutes: number
  
  // Reminders
  reminder_hours: number[]
  
  // Confirmation
  auto_confirm: boolean
  confirmation_email_enabled: boolean
  
  // Appearance
  accent_color: string
  logo_url?: string | null
  
  // Payment
  require_payment: boolean
  payment_provider?: string | null
  
  // Notifications
  notification_email?: string | null
  
  // CRM Integration
  auto_create_crm_contact: boolean
  
  // Audit
  created_at: string
  updated_at: string
}

export type BookingSettingsInput = Omit<BookingSettings, 'id' | 'created_at' | 'updated_at'>
export type BookingSettingsUpdate = Partial<BookingSettingsInput>

// ============================================================================
// TIME SLOT (computed, not stored)
// ============================================================================

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  staffId?: string
  staffName?: string
}

// ============================================================================
// SEARCH RESULT
// ============================================================================

export interface BookingSearchResult {
  appointments: Appointment[]
  services: Service[]
  staff: Staff[]
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface BookingProviderProps {
  children: React.ReactNode
  siteId: string
  settings?: BookingSettings | null
}

export interface BookingContextValue {
  // State
  siteId: string
  settings: BookingSettings | null
  services: Service[]
  staff: Staff[]
  appointments: Appointment[]
  calendars: Calendar[]
  isLoading: boolean
  
  // Active selections (for UI)
  activeView: 'calendar' | 'appointments' | 'services' | 'staff' | 'analytics'
  selectedDate: Date
  selectedAppointment: Appointment | null
  selectedService: Service | null
  selectedStaff: Staff | null
  
  // Actions
  setActiveView: (view: BookingContextValue['activeView']) => void
  setSelectedDate: (date: Date) => void
  setSelectedAppointment: (appointment: Appointment | null) => void
  setSelectedService: (service: Service | null) => void
  setSelectedStaff: (staff: Staff | null) => void
  
  // Data fetching
  refreshServices: () => Promise<void>
  refreshStaff: () => Promise<void>
  refreshAppointments: (options?: { startDate?: Date; endDate?: Date }) => Promise<void>
  refreshCalendars: () => Promise<void>
  refreshAll: () => Promise<void>
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface BookingStats {
  totalAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  cancelledAppointments: number
  completedAppointments: number
  noShowAppointments: number
  todayAppointments: number
  upcomingThisWeek: number
  totalServices: number
  activeServices: number
  totalStaff: number
  activeStaff: number
  averageBookingsPerDay: number
  cancellationRate: number
}
```

---

## 📋 Module Manifest

```typescript
// src/modules/booking/manifest.ts

/**
 * Booking Module Manifest
 * 
 * Phase EM-51: Booking Module
 * 
 * This manifest defines the module's metadata, capabilities,
 * database schema, and configuration.
 * 
 * Following CRM (EM-50) pattern exactly
 */

import type { ModuleManifest } from '../_types'

export const bookingManifest: ModuleManifest = {
  // ==========================================================================
  // IDENTIFICATION
  // ==========================================================================
  
  id: 'booking-module',
  shortId: 'bookmod01',  // CRITICAL: Used for table prefix (mod_bookmod01_)
  name: 'booking',
  displayName: 'Booking & Scheduling',
  description: 'Appointment scheduling, calendar management, and online booking widget with CRM integration',
  version: '1.0.0',
  
  // ==========================================================================
  // CLASSIFICATION
  // ==========================================================================
  
  type: 'enterprise',
  category: 'Operations',
  
  // ==========================================================================
  // AUTHOR & LICENSE
  // ==========================================================================
  
  author: {
    name: 'DRAMAC CMS Team',
    email: 'support@dramac.dev',
    url: 'https://dramac.dev'
  },
  license: 'Proprietary',
  
  // ==========================================================================
  // COMPATIBILITY
  // ==========================================================================
  
  minPlatformVersion: '1.0.0',
  dependencies: [],
  peerDependencies: [
    'crm-module'  // Optional: For CRM contact integration
  ],
  
  // ==========================================================================
  // DATABASE SCHEMA
  // ==========================================================================
  
  schema: {
    prefix: 'mod_bookmod01',  // CRITICAL: All tables use mod_bookmod01_tablename
    
    tables: [
      {
        name: 'services',
        columns: ['id', 'site_id', 'name', 'slug', 'description', 'duration_minutes', 'buffer_before_minutes', 'buffer_after_minutes', 'price', 'currency', 'max_attendees', 'allow_online_booking', 'require_confirmation', 'require_payment', 'color', 'image_url', 'sort_order', 'is_active', 'custom_fields', 'created_by', 'created_at', 'updated_at']
      },
      {
        name: 'staff',
        columns: ['id', 'site_id', 'user_id', 'name', 'email', 'phone', 'avatar_url', 'bio', 'default_availability', 'timezone', 'accept_bookings', 'is_active', 'created_at', 'updated_at']
      },
      {
        name: 'staff_services',
        columns: ['id', 'site_id', 'staff_id', 'service_id', 'custom_price', 'custom_duration_minutes', 'created_at']
      },
      {
        name: 'calendars',
        columns: ['id', 'site_id', 'name', 'description', 'type', 'staff_id', 'timezone', 'external_calendar_url', 'external_calendar_type', 'last_synced_at', 'is_active', 'created_at', 'updated_at']
      },
      {
        name: 'availability',
        columns: ['id', 'site_id', 'calendar_id', 'staff_id', 'service_id', 'rule_type', 'day_of_week', 'start_time', 'end_time', 'specific_date', 'valid_from', 'valid_until', 'priority', 'label', 'created_at']
      },
      {
        name: 'appointments',
        columns: ['id', 'site_id', 'service_id', 'staff_id', 'calendar_id', 'customer_name', 'customer_email', 'customer_phone', 'customer_notes', 'crm_contact_id', 'start_time', 'end_time', 'timezone', 'status', 'cancelled_at', 'cancelled_by', 'cancellation_reason', 'payment_status', 'payment_amount', 'payment_id', 'recurring_id', 'recurring_rule', 'reminder_sent_at', 'metadata', 'custom_fields', 'created_by', 'created_at', 'updated_at']
      },
      {
        name: 'reminders',
        columns: ['id', 'site_id', 'appointment_id', 'send_at', 'type', 'status', 'sent_at', 'error', 'subject', 'body', 'created_at']
      },
      {
        name: 'settings',
        columns: ['id', 'site_id', 'business_name', 'timezone', 'date_format', 'time_format', 'min_booking_notice_hours', 'max_booking_advance_days', 'cancellation_notice_hours', 'slot_interval_minutes', 'reminder_hours', 'auto_confirm', 'confirmation_email_enabled', 'accent_color', 'logo_url', 'require_payment', 'payment_provider', 'notification_email', 'auto_create_crm_contact', 'created_at', 'updated_at']
      }
    ],
    
    migrations: [
      {
        version: '1.0.0',
        description: 'Initial booking module tables',
        script: 'em-51-booking-module-schema.sql'
      }
    ]
  },
  
  // ==========================================================================
  // FEATURES
  // ==========================================================================
  
  features: [
    {
      id: 'services-management',
      name: 'Services Management',
      description: 'Create and manage bookable services with pricing and duration',
      enabled: true
    },
    {
      id: 'staff-management',
      name: 'Staff Management',
      description: 'Manage staff members who provide services',
      enabled: true
    },
    {
      id: 'calendar-management',
      name: 'Calendar & Availability',
      description: 'Set working hours and availability rules',
      enabled: true
    },
    {
      id: 'appointment-booking',
      name: 'Appointment Booking',
      description: 'Book appointments with conflict detection',
      enabled: true
    },
    {
      id: 'reminders',
      name: 'Appointment Reminders',
      description: 'Automated email/SMS reminders',
      enabled: true
    },
    {
      id: 'booking-widget',
      name: 'Embeddable Booking Widget',
      description: 'Public booking widget for websites',
      enabled: true
    },
    {
      id: 'crm-integration',
      name: 'CRM Integration',
      description: 'Link appointments to CRM contacts',
      enabled: true
    },
    {
      id: 'analytics',
      name: 'Booking Analytics',
      description: 'Reports and insights on bookings',
      enabled: true
    }
  ],
  
  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================
  
  permissions: [
    // Services
    {
      id: 'services:view',
      name: 'View Services',
      description: 'View all services'
    },
    {
      id: 'services:create',
      name: 'Create Services',
      description: 'Create new services'
    },
    {
      id: 'services:edit',
      name: 'Edit Services',
      description: 'Edit existing services'
    },
    {
      id: 'services:delete',
      name: 'Delete Services',
      description: 'Delete services'
    },
    // Staff
    {
      id: 'staff:view',
      name: 'View Staff',
      description: 'View all staff members'
    },
    {
      id: 'staff:manage',
      name: 'Manage Staff',
      description: 'Create, edit, delete staff'
    },
    // Appointments
    {
      id: 'appointments:view',
      name: 'View Appointments',
      description: 'View all appointments'
    },
    {
      id: 'appointments:create',
      name: 'Create Appointments',
      description: 'Book appointments'
    },
    {
      id: 'appointments:edit',
      name: 'Edit Appointments',
      description: 'Edit appointments'
    },
    {
      id: 'appointments:cancel',
      name: 'Cancel Appointments',
      description: 'Cancel appointments'
    },
    // Settings
    {
      id: 'settings:view',
      name: 'View Settings',
      description: 'View booking settings'
    },
    {
      id: 'settings:edit',
      name: 'Edit Settings',
      description: 'Modify booking settings'
    },
    // Analytics
    {
      id: 'analytics:view',
      name: 'View Analytics',
      description: 'View booking analytics'
    }
  ],
  
  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  
  navigation: {
    position: 'sidebar',
    priority: 35,  // After CRM (30)
    icon: 'Calendar',
    parent: null,
    
    items: [
      {
        id: 'booking-dashboard',
        label: 'Booking',
        path: '/dashboard/[siteId]/booking',
        icon: 'Calendar',
        requiredPermission: 'appointments:view'
      },
      {
        id: 'booking-appointments',
        label: 'Appointments',
        path: '/dashboard/[siteId]/booking?view=appointments',
        icon: 'CalendarCheck',
        requiredPermission: 'appointments:view'
      },
      {
        id: 'booking-calendar',
        label: 'Calendar',
        path: '/dashboard/[siteId]/booking?view=calendar',
        icon: 'CalendarDays',
        requiredPermission: 'appointments:view'
      },
      {
        id: 'booking-services',
        label: 'Services',
        path: '/dashboard/[siteId]/booking?view=services',
        icon: 'Briefcase',
        requiredPermission: 'services:view'
      },
      {
        id: 'booking-staff',
        label: 'Staff',
        path: '/dashboard/[siteId]/booking?view=staff',
        icon: 'Users',
        requiredPermission: 'staff:view'
      }
    ]
  },
  
  // ==========================================================================
  // API (for embed widget)
  // ==========================================================================
  
  api: {
    prefix: '/api/modules/booking',
    routes: [
      {
        method: 'GET',
        path: '/services',
        handler: 'getServices',
        public: true,  // Public for booking widget
        description: 'Get available services'
      },
      {
        method: 'GET',
        path: '/staff',
        handler: 'getStaff',
        public: true,
        description: 'Get available staff'
      },
      {
        method: 'GET',
        path: '/availability',
        handler: 'getAvailability',
        public: true,
        description: 'Get available time slots'
      },
      {
        method: 'POST',
        path: '/appointments',
        handler: 'createAppointment',
        public: true,  // Public booking
        description: 'Create an appointment'
      },
      {
        method: 'PUT',
        path: '/appointments/:id',
        handler: 'updateAppointment',
        requiredPermission: 'appointments:edit',
        description: 'Update an appointment'
      },
      {
        method: 'DELETE',
        path: '/appointments/:id',
        handler: 'cancelAppointment',
        public: true,  // Customer can cancel via token
        description: 'Cancel an appointment'
      }
    ]
  },
  
  // ==========================================================================
  // WEBHOOKS
  // ==========================================================================
  
  webhooks: [
    {
      event: 'appointment.created',
      description: 'Triggered when an appointment is booked'
    },
    {
      event: 'appointment.confirmed',
      description: 'Triggered when an appointment is confirmed'
    },
    {
      event: 'appointment.cancelled',
      description: 'Triggered when an appointment is cancelled'
    },
    {
      event: 'appointment.completed',
      description: 'Triggered when an appointment is marked complete'
    },
    {
      event: 'appointment.no_show',
      description: 'Triggered when customer is marked as no-show'
    },
    {
      event: 'reminder.sent',
      description: 'Triggered when a reminder is sent'
    }
  ],
  
  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  lifecycle: {
    onInstall: async (context) => {
      // Create default settings for site
      console.log(`[Booking] Installing for site ${context.siteId}`)
    },
    onUninstall: async (context) => {
      // Cleanup (handled by CASCADE)
      console.log(`[Booking] Uninstalling from site ${context.siteId}`)
    },
    onEnable: async (context) => {
      console.log(`[Booking] Enabled for site ${context.siteId}`)
    },
    onDisable: async (context) => {
      console.log(`[Booking] Disabled for site ${context.siteId}`)
    }
  },
  
  // ==========================================================================
  // COMPONENTS
  // ==========================================================================
  
  components: {
    dashboard: 'BookingDashboard',
    settings: 'BookingSettingsDialog'
  },
  
  // ==========================================================================
  // METADATA
  // ==========================================================================
  
  keywords: ['booking', 'appointments', 'scheduling', 'calendar', 'services'],
  
  screenshots: [
    {
      url: '/screenshots/booking/calendar-view.png',
      caption: 'Calendar view with appointments'
    },
    {
      url: '/screenshots/booking/booking-widget.png',
      caption: 'Embeddable booking widget'
    }
  ],
  
  pricing: {
    type: 'paid',
    plans: [
      {
        name: 'Starter',
        price: 19,
        features: ['Up to 100 appointments/month', '1 staff member', 'Email reminders']
      },
      {
        name: 'Professional',
        price: 49,
        features: ['Unlimited appointments', 'Up to 10 staff', 'SMS reminders', 'CRM integration']
      },
      {
        name: 'Business',
        price: 99,
        features: ['Everything in Pro', 'Unlimited staff', 'Custom branding', 'Priority support']
      }
    ]
  }
}

export default bookingManifest
```

---

## 📋 Context Provider

```typescript
// src/modules/booking/context/booking-context.tsx

'use client'

/**
 * Booking Context Provider
 * 
 * Phase EM-51: Booking Module
 * 
 * Following CRM context pattern exactly.
 * Provides centralized state management for the Booking module.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type {
  BookingContextValue,
  BookingProviderProps,
  BookingSettings,
  Service,
  Staff,
  Appointment,
  Calendar
} from '../types/booking-types'
import {
  getServices,
  getStaff,
  getAppointments,
  getCalendars,
  getSettings
} from '../actions/booking-actions'

// =============================================================================
// CONTEXT
// =============================================================================

const BookingContext = createContext<BookingContextValue | null>(null)

// =============================================================================
// PROVIDER
// =============================================================================

export function BookingProvider({ children, siteId, settings: initialSettings }: BookingProviderProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [settings, setSettings] = useState<BookingSettings | null>(initialSettings ?? null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // UI State
  const [activeView, setActiveView] = useState<BookingContextValue['activeView']>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  
  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------
  
  const refreshServices = useCallback(async () => {
    try {
      const result = await getServices(siteId)
      if (result.success && result.data) {
        setServices(result.data)
      }
    } catch (error) {
      console.error('[Booking] Error fetching services:', error)
    }
  }, [siteId])
  
  const refreshStaff = useCallback(async () => {
    try {
      const result = await getStaff(siteId)
      if (result.success && result.data) {
        setStaff(result.data)
      }
    } catch (error) {
      console.error('[Booking] Error fetching staff:', error)
    }
  }, [siteId])
  
  const refreshAppointments = useCallback(async (options?: { startDate?: Date; endDate?: Date }) => {
    try {
      const result = await getAppointments(siteId, options)
      if (result.success && result.data) {
        setAppointments(result.data)
      }
    } catch (error) {
      console.error('[Booking] Error fetching appointments:', error)
    }
  }, [siteId])
  
  const refreshCalendars = useCallback(async () => {
    try {
      const result = await getCalendars(siteId)
      if (result.success && result.data) {
        setCalendars(result.data)
      }
    } catch (error) {
      console.error('[Booking] Error fetching calendars:', error)
    }
  }, [siteId])
  
  const refreshAll = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        refreshServices(),
        refreshStaff(),
        refreshAppointments(),
        refreshCalendars()
      ])
      
      // Also refresh settings if not provided initially
      if (!initialSettings) {
        const settingsResult = await getSettings(siteId)
        if (settingsResult.success && settingsResult.data) {
          setSettings(settingsResult.data)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [refreshServices, refreshStaff, refreshAppointments, refreshCalendars, siteId, initialSettings])
  
  // ---------------------------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    refreshAll()
  }, [refreshAll])
  
  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------
  
  const value: BookingContextValue = {
    // State
    siteId,
    settings,
    services,
    staff,
    appointments,
    calendars,
    isLoading,
    
    // UI State
    activeView,
    selectedDate,
    selectedAppointment,
    selectedService,
    selectedStaff,
    
    // UI Actions
    setActiveView,
    setSelectedDate,
    setSelectedAppointment,
    setSelectedService,
    setSelectedStaff,
    
    // Data Fetching
    refreshServices,
    refreshStaff,
    refreshAppointments,
    refreshCalendars,
    refreshAll
  }
  
  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext)
  
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  
  return context
}

// =============================================================================
// OPTIONAL HOOK (doesn't throw)
// =============================================================================

export function useBookingOptional(): BookingContextValue | null {
  return useContext(BookingContext)
}
```

---

## 📋 Server Actions

```typescript
// src/modules/booking/actions/booking-actions.ts

'use server'

/**
 * Booking Module Server Actions
 * 
 * Phase EM-51: Booking Module
 * 
 * All server-side operations for the Booking module.
 * Following CRM actions pattern exactly.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  Service,
  ServiceInput,
  ServiceUpdate,
  Staff,
  StaffInput,
  StaffUpdate,
  Appointment,
  AppointmentInput,
  AppointmentUpdate,
  Calendar,
  CalendarInput,
  CalendarUpdate,
  Availability,
  AvailabilityInput,
  BookingSettings,
  BookingSettingsUpdate,
  TimeSlot
} from '../types/booking-types'

// =============================================================================
// CONSTANTS
// =============================================================================

const TABLE_PREFIX = 'mod_bookmod01'

// =============================================================================
// HELPER TYPES
// =============================================================================

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

// =============================================================================
// SERVICES ACTIONS
// =============================================================================

export async function getServices(siteId: string): Promise<ActionResult<Service[]>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('*')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    
    return { success: true, data: data ?? [] }
  } catch (error) {
    console.error('[Booking] getServices error:', error)
    return { success: false, error: 'Failed to fetch services' }
  }
}

export async function getService(siteId: string, serviceId: string): Promise<ActionResult<Service>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('*')
      .eq('site_id', siteId)
      .eq('id', serviceId)
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] getService error:', error)
    return { success: false, error: 'Failed to fetch service' }
  }
}

export async function createService(siteId: string, input: ServiceInput): Promise<ActionResult<Service>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .insert({
        ...input,
        site_id: siteId
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] createService error:', error)
    return { success: false, error: 'Failed to create service' }
  }
}

export async function updateService(
  siteId: string,
  serviceId: string,
  updates: ServiceUpdate
): Promise<ActionResult<Service>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .update(updates)
      .eq('site_id', siteId)
      .eq('id', serviceId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] updateService error:', error)
    return { success: false, error: 'Failed to update service' }
  }
}

export async function deleteService(siteId: string, serviceId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .delete()
      .eq('site_id', siteId)
      .eq('id', serviceId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('[Booking] deleteService error:', error)
    return { success: false, error: 'Failed to delete service' }
  }
}

// =============================================================================
// STAFF ACTIONS
// =============================================================================

export async function getStaff(siteId: string): Promise<ActionResult<Staff[]>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_staff`)
      .select('*')
      .eq('site_id', siteId)
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return { success: true, data: data ?? [] }
  } catch (error) {
    console.error('[Booking] getStaff error:', error)
    return { success: false, error: 'Failed to fetch staff' }
  }
}

export async function createStaff(siteId: string, input: StaffInput): Promise<ActionResult<Staff>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_staff`)
      .insert({
        ...input,
        site_id: siteId
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] createStaff error:', error)
    return { success: false, error: 'Failed to create staff' }
  }
}

export async function updateStaff(
  siteId: string,
  staffId: string,
  updates: StaffUpdate
): Promise<ActionResult<Staff>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_staff`)
      .update(updates)
      .eq('site_id', siteId)
      .eq('id', staffId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] updateStaff error:', error)
    return { success: false, error: 'Failed to update staff' }
  }
}

export async function deleteStaff(siteId: string, staffId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_staff`)
      .delete()
      .eq('site_id', siteId)
      .eq('id', staffId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('[Booking] deleteStaff error:', error)
    return { success: false, error: 'Failed to delete staff' }
  }
}

// =============================================================================
// APPOINTMENTS ACTIONS
// =============================================================================

export async function getAppointments(
  siteId: string,
  options?: { startDate?: Date; endDate?: Date; status?: string }
): Promise<ActionResult<Appointment[]>> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select(`
        *,
        service:${TABLE_PREFIX}_services(*),
        staff:${TABLE_PREFIX}_staff(*)
      `)
      .eq('site_id', siteId)
      .order('start_time', { ascending: true })
    
    if (options?.startDate) {
      query = query.gte('start_time', options.startDate.toISOString())
    }
    
    if (options?.endDate) {
      query = query.lte('start_time', options.endDate.toISOString())
    }
    
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return { success: true, data: data ?? [] }
  } catch (error) {
    console.error('[Booking] getAppointments error:', error)
    return { success: false, error: 'Failed to fetch appointments' }
  }
}

export async function getAppointment(
  siteId: string,
  appointmentId: string
): Promise<ActionResult<Appointment>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select(`
        *,
        service:${TABLE_PREFIX}_services(*),
        staff:${TABLE_PREFIX}_staff(*)
      `)
      .eq('site_id', siteId)
      .eq('id', appointmentId)
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] getAppointment error:', error)
    return { success: false, error: 'Failed to fetch appointment' }
  }
}

export async function createAppointment(
  siteId: string,
  input: AppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    const supabase = await createClient()
    
    // Verify slot is available before creating
    const isAvailable = await checkSlotAvailability(
      siteId,
      input.service_id,
      input.staff_id ?? null,
      new Date(input.start_time),
      new Date(input.end_time)
    )
    
    if (!isAvailable) {
      return { success: false, error: 'Selected time slot is not available' }
    }
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .insert({
        ...input,
        site_id: siteId
      })
      .select(`
        *,
        service:${TABLE_PREFIX}_services(*),
        staff:${TABLE_PREFIX}_staff(*)
      `)
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] createAppointment error:', error)
    return { success: false, error: 'Failed to create appointment' }
  }
}

export async function updateAppointment(
  siteId: string,
  appointmentId: string,
  updates: AppointmentUpdate
): Promise<ActionResult<Appointment>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .update(updates)
      .eq('site_id', siteId)
      .eq('id', appointmentId)
      .select(`
        *,
        service:${TABLE_PREFIX}_services(*),
        staff:${TABLE_PREFIX}_staff(*)
      `)
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] updateAppointment error:', error)
    return { success: false, error: 'Failed to update appointment' }
  }
}

export async function cancelAppointment(
  siteId: string,
  appointmentId: string,
  cancelledBy: 'customer' | 'staff' | 'system',
  reason?: string
): Promise<ActionResult<Appointment>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
        cancellation_reason: reason ?? null
      })
      .eq('site_id', siteId)
      .eq('id', appointmentId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] cancelAppointment error:', error)
    return { success: false, error: 'Failed to cancel appointment' }
  }
}

export async function deleteAppointment(
  siteId: string,
  appointmentId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .delete()
      .eq('site_id', siteId)
      .eq('id', appointmentId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('[Booking] deleteAppointment error:', error)
    return { success: false, error: 'Failed to delete appointment' }
  }
}

// =============================================================================
// CALENDARS ACTIONS
// =============================================================================

export async function getCalendars(siteId: string): Promise<ActionResult<Calendar[]>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_calendars`)
      .select(`
        *,
        staff:${TABLE_PREFIX}_staff(*)
      `)
      .eq('site_id', siteId)
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return { success: true, data: data ?? [] }
  } catch (error) {
    console.error('[Booking] getCalendars error:', error)
    return { success: false, error: 'Failed to fetch calendars' }
  }
}

export async function createCalendar(
  siteId: string,
  input: CalendarInput
): Promise<ActionResult<Calendar>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_calendars`)
      .insert({
        ...input,
        site_id: siteId
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] createCalendar error:', error)
    return { success: false, error: 'Failed to create calendar' }
  }
}

export async function updateCalendar(
  siteId: string,
  calendarId: string,
  updates: CalendarUpdate
): Promise<ActionResult<Calendar>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_calendars`)
      .update(updates)
      .eq('site_id', siteId)
      .eq('id', calendarId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] updateCalendar error:', error)
    return { success: false, error: 'Failed to update calendar' }
  }
}

export async function deleteCalendar(
  siteId: string,
  calendarId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_calendars`)
      .delete()
      .eq('site_id', siteId)
      .eq('id', calendarId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('[Booking] deleteCalendar error:', error)
    return { success: false, error: 'Failed to delete calendar' }
  }
}

// =============================================================================
// SETTINGS ACTIONS
// =============================================================================

export async function getSettings(siteId: string): Promise<ActionResult<BookingSettings | null>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select('*')
      .eq('site_id', siteId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error  // PGRST116 = not found
    
    return { success: true, data: data ?? null }
  } catch (error) {
    console.error('[Booking] getSettings error:', error)
    return { success: false, error: 'Failed to fetch settings' }
  }
}

export async function updateSettings(
  siteId: string,
  updates: BookingSettingsUpdate
): Promise<ActionResult<BookingSettings>> {
  try {
    const supabase = await createClient()
    
    // Upsert settings (create if not exists)
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .upsert({
        ...updates,
        site_id: siteId
      }, {
        onConflict: 'site_id'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] updateSettings error:', error)
    return { success: false, error: 'Failed to update settings' }
  }
}

// =============================================================================
// AVAILABILITY ACTIONS
// =============================================================================

export async function getAvailability(
  siteId: string,
  filters?: { staffId?: string; serviceId?: string; calendarId?: string }
): Promise<ActionResult<Availability[]>> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select('*')
      .eq('site_id', siteId)
    
    if (filters?.staffId) {
      query = query.eq('staff_id', filters.staffId)
    }
    if (filters?.serviceId) {
      query = query.eq('service_id', filters.serviceId)
    }
    if (filters?.calendarId) {
      query = query.eq('calendar_id', filters.calendarId)
    }
    
    const { data, error } = await query.order('priority', { ascending: false })
    
    if (error) throw error
    
    return { success: true, data: data ?? [] }
  } catch (error) {
    console.error('[Booking] getAvailability error:', error)
    return { success: false, error: 'Failed to fetch availability' }
  }
}

export async function createAvailability(
  siteId: string,
  input: AvailabilityInput
): Promise<ActionResult<Availability>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .insert({
        ...input,
        site_id: siteId
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('[Booking] createAvailability error:', error)
    return { success: false, error: 'Failed to create availability rule' }
  }
}

export async function deleteAvailability(
  siteId: string,
  availabilityId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .delete()
      .eq('site_id', siteId)
      .eq('id', availabilityId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('[Booking] deleteAvailability error:', error)
    return { success: false, error: 'Failed to delete availability rule' }
  }
}

// =============================================================================
// AVAILABILITY CALCULATION
// =============================================================================

export async function getAvailableSlots(
  siteId: string,
  serviceId: string,
  date: Date,
  staffId?: string
): Promise<ActionResult<TimeSlot[]>> {
  try {
    const supabase = await createClient()
    
    // 1. Get service details
    const serviceResult = await getService(siteId, serviceId)
    if (!serviceResult.success || !serviceResult.data) {
      return { success: false, error: 'Service not found' }
    }
    const service = serviceResult.data
    
    // 2. Get settings
    const settingsResult = await getSettings(siteId)
    const settings = settingsResult.data
    const slotInterval = settings?.slot_interval_minutes ?? 30
    
    // 3. Get staff who can provide this service
    let staffIds: string[] = []
    
    if (staffId) {
      staffIds = [staffId]
    } else {
      const { data: staffServices } = await supabase
        .from(`${TABLE_PREFIX}_staff_services`)
        .select('staff_id')
        .eq('site_id', siteId)
        .eq('service_id', serviceId)
      
      staffIds = staffServices?.map(ss => ss.staff_id) ?? []
      
      // If no staff assignments, get all active staff
      if (staffIds.length === 0) {
        const { data: allStaff } = await supabase
          .from(`${TABLE_PREFIX}_staff`)
          .select('id')
          .eq('site_id', siteId)
          .eq('is_active', true)
          .eq('accept_bookings', true)
        
        staffIds = allStaff?.map(s => s.id) ?? []
      }
    }
    
    if (staffIds.length === 0) {
      return { success: true, data: [] }
    }
    
    // 4. Get availability rules
    const dayOfWeek = date.getDay()
    const dateString = date.toISOString().split('T')[0]
    
    const { data: availabilityRules } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select('*')
      .eq('site_id', siteId)
      .eq('rule_type', 'available')
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateString}`)
      .order('priority', { ascending: false })
    
    // 5. Get blocked rules
    const { data: blockedRules } = await supabase
      .from(`${TABLE_PREFIX}_availability`)
      .select('*')
      .eq('site_id', siteId)
      .eq('rule_type', 'blocked')
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateString}`)
    
    // 6. Get existing appointments for this date
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    const { data: existingAppointments } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select('*')
      .eq('site_id', siteId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .neq('status', 'cancelled')
    
    // 7. Generate slots
    const slots: TimeSlot[] = []
    const duration = service.duration_minutes
    const bufferBefore = service.buffer_before_minutes
    const bufferAfter = service.buffer_after_minutes
    const totalMinutes = duration + bufferBefore + bufferAfter
    
    for (const rule of availabilityRules ?? []) {
      // Check if rule applies to any of our staff
      const ruleStaffId = rule.staff_id
      if (ruleStaffId && !staffIds.includes(ruleStaffId)) continue
      
      const startTime = parseTime(rule.start_time, date)
      const endTime = parseTime(rule.end_time, date)
      
      let slotStart = new Date(startTime)
      
      while (slotStart.getTime() + totalMinutes * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000)
        
        // Check if slot is blocked
        const isBlocked = (blockedRules ?? []).some(block => {
          const blockStart = parseTime(block.start_time, date)
          const blockEnd = parseTime(block.end_time, date)
          return slotStart >= blockStart && slotStart < blockEnd
        })
        
        // Check if slot conflicts with existing appointment
        const hasConflict = (existingAppointments ?? []).some(apt => {
          if (ruleStaffId && apt.staff_id !== ruleStaffId) return false
          const aptStart = new Date(apt.start_time)
          const aptEnd = new Date(apt.end_time)
          return slotStart < aptEnd && slotEnd > aptStart
        })
        
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          available: !isBlocked && !hasConflict,
          staffId: ruleStaffId ?? undefined
        })
        
        // Move to next slot
        slotStart = new Date(slotStart.getTime() + slotInterval * 60000)
      }
    }
    
    return { success: true, data: slots }
  } catch (error) {
    console.error('[Booking] getAvailableSlots error:', error)
    return { success: false, error: 'Failed to calculate available slots' }
  }
}

async function checkSlotAvailability(
  siteId: string,
  serviceId: string,
  staffId: string | null,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Check for conflicting appointments
    let query = supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select('id')
      .eq('site_id', siteId)
      .neq('status', 'cancelled')
      .or(`and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`)
    
    if (staffId) {
      query = query.eq('staff_id', staffId)
    }
    
    const { data: conflicts } = await query
    
    return (conflicts?.length ?? 0) === 0
  } catch {
    return false
  }
}

function parseTime(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

// =============================================================================
// STATS ACTIONS
// =============================================================================

export async function getBookingStats(siteId: string): Promise<ActionResult<{
  totalAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  cancelledAppointments: number
  completedAppointments: number
  noShowAppointments: number
  todayAppointments: number
  totalServices: number
  activeServices: number
  totalStaff: number
  activeStaff: number
}>> {
  try {
    const supabase = await createClient()
    
    // Get appointment counts by status
    const { data: appointments, error: aptsError } = await supabase
      .from(`${TABLE_PREFIX}_appointments`)
      .select('id, status, start_time')
      .eq('site_id', siteId)
    
    if (aptsError) throw aptsError
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const stats = {
      totalAppointments: appointments?.length ?? 0,
      pendingAppointments: appointments?.filter(a => a.status === 'pending').length ?? 0,
      confirmedAppointments: appointments?.filter(a => a.status === 'confirmed').length ?? 0,
      cancelledAppointments: appointments?.filter(a => a.status === 'cancelled').length ?? 0,
      completedAppointments: appointments?.filter(a => a.status === 'completed').length ?? 0,
      noShowAppointments: appointments?.filter(a => a.status === 'no_show').length ?? 0,
      todayAppointments: appointments?.filter(a => {
        const startTime = new Date(a.start_time)
        return startTime >= today && startTime < tomorrow
      }).length ?? 0,
      totalServices: 0,
      activeServices: 0,
      totalStaff: 0,
      activeStaff: 0
    }
    
    // Get service counts
    const { data: services } = await supabase
      .from(`${TABLE_PREFIX}_services`)
      .select('id, is_active')
      .eq('site_id', siteId)
    
    stats.totalServices = services?.length ?? 0
    stats.activeServices = services?.filter(s => s.is_active).length ?? 0
    
    // Get staff counts
    const { data: staff } = await supabase
      .from(`${TABLE_PREFIX}_staff`)
      .select('id, is_active')
      .eq('site_id', siteId)
    
    stats.totalStaff = staff?.length ?? 0
    stats.activeStaff = staff?.filter(s => s.is_active).length ?? 0
    
    return { success: true, data: stats }
  } catch (error) {
    console.error('[Booking] getBookingStats error:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
}
```

---

## 📋 Module Exports

```typescript
// src/modules/booking/index.ts

/**
 * Booking Module Exports
 * 
 * Phase EM-51: Booking Module
 */

// Manifest
export { bookingManifest, default as manifest } from './manifest'

// Types
export * from './types/booking-types'

// Context
export { BookingProvider, useBooking, useBookingOptional } from './context/booking-context'

// Actions (re-export for convenience)
export {
  // Services
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  
  // Staff
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  
  // Appointments
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
  
  // Calendars
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  
  // Availability
  getAvailability,
  createAvailability,
  deleteAvailability,
  getAvailableSlots,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Stats
  getBookingStats
} from './actions/booking-actions'

// Components (will be implemented)
// export { BookingDashboard } from './components/booking-dashboard'
```

---

## 📋 Dashboard Page

```typescript
// src/app/dashboard/[siteId]/booking/page.tsx

/**
 * Booking Module Dashboard Page
 * 
 * Phase EM-51: Booking Module
 */

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/modules/booking/actions/booking-actions'
import { BookingProvider } from '@/modules/booking/context/booking-context'
import { BookingDashboard } from '@/modules/booking/components/booking-dashboard'

interface BookingPageProps {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ view?: string }>
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { siteId } = await params
  const { view } = await searchParams
  
  // Verify user has access to this site
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }
  
  // Verify site exists and user has access
  const { data: site, error } = await supabase
    .from('sites')
    .select('id, name')
    .eq('id', siteId)
    .single()
  
  if (error || !site) {
    notFound()
  }
  
  // Get booking settings
  const settingsResult = await getSettings(siteId)
  const settings = settingsResult.data ?? null
  
  return (
    <BookingProvider siteId={siteId} settings={settings}>
      <BookingDashboard initialView={view as any} />
    </BookingProvider>
  )
}
```

---

## ✅ Implementation Checklist

### Database
- [ ] Create migration file `em-51-booking-module-schema.sql`
- [ ] Run migration in Supabase
- [ ] Verify all tables created with `mod_bookmod01_` prefix
- [ ] Verify RLS policies are working

### TypeScript
- [ ] Create `types/booking-types.ts`
- [ ] Create `manifest.ts` with full ModuleManifest
- [ ] Create `actions/booking-actions.ts` with all server actions
- [ ] Create `context/booking-context.tsx` with provider

### Components
- [ ] Create `booking-dashboard.tsx` main component
- [ ] Create dialogs: service, staff, appointment, calendar, settings
- [ ] Create views: calendar, appointments, services, staff, analytics
- [ ] Create sheets: appointment-detail, service-detail, staff-detail

### Integration
- [ ] Add booking route to sidebar navigation
- [ ] Create page at `/dashboard/[siteId]/booking/page.tsx`
- [ ] Test CRM contact integration
- [ ] Test embed widget

### Testing
- [ ] Services CRUD works
- [ ] Staff management works
- [ ] Availability rules applied correctly
- [ ] Time slots calculated correctly
- [ ] Appointments created with validation
- [ ] Cancellation policy enforced
- [ ] Multi-tenant isolation verified

---

## 📍 Dependencies

**Requires:**
- EM-01 (Module System)
- EM-05 (Module Naming Conventions)
- EM-11 (Module Database)
- EM-12 (Module Authentication)
- EM-13 (Module Permissions)

**Integrates with:**
- EM-50 (CRM Module) - For customer contact linking

---

## 🔗 Key Differences from Original Spec

| Issue | Original | Fixed |
|-------|----------|-------|
| Table prefix | `mod_booking_` | `mod_bookmod01_` |
| agency_id column | Present on all tables | Removed (site_id only, matches CRM) |
| shortId | Missing | Added `bookmod01` |
| RLS policies | Missing | Full policies using `can_access_site()` |
| Server actions | Used non-existent `createModuleDataAccess` | Uses `createClient()` from `@/lib/supabase/server` |
| Context pattern | Not specified | Full provider matching CRM pattern |
| Manifest | Incomplete | Full manifest matching CRM pattern |
| Custom fields | Missing | Added `custom_fields JSONB` to services/appointments |
| Triggers | Missing | Added `updated_at` triggers |
| Public booking policies | Missing | Added for embed widget |

---

**Last Updated:** Phase EM-51 spec aligned with CRM (EM-50) patterns
