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

CREATE POLICY "Users can insert staff in their sites"
  ON mod_bookmod01_staff FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update staff in their sites"
  ON mod_bookmod01_staff FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete staff in their sites"
  ON mod_bookmod01_staff FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- STAFF SERVICES POLICIES
-- =============================================================================

CREATE POLICY "Users can view staff services in their sites"
  ON mod_bookmod01_staff_services FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert staff services in their sites"
  ON mod_bookmod01_staff_services FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update staff services in their sites"
  ON mod_bookmod01_staff_services FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete staff services in their sites"
  ON mod_bookmod01_staff_services FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- CALENDARS POLICIES
-- =============================================================================

CREATE POLICY "Users can view calendars in their sites"
  ON mod_bookmod01_calendars FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert calendars in their sites"
  ON mod_bookmod01_calendars FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update calendars in their sites"
  ON mod_bookmod01_calendars FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete calendars in their sites"
  ON mod_bookmod01_calendars FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- AVAILABILITY POLICIES
-- =============================================================================

CREATE POLICY "Users can view availability in their sites"
  ON mod_bookmod01_availability FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Users can insert availability in their sites"
  ON mod_bookmod01_availability FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update availability in their sites"
  ON mod_bookmod01_availability FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete availability in their sites"
  ON mod_bookmod01_availability FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
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

CREATE POLICY "Users can insert reminders in their sites"
  ON mod_bookmod01_reminders FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update reminders in their sites"
  ON mod_bookmod01_reminders FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can delete reminders in their sites"
  ON mod_bookmod01_reminders FOR DELETE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- SETTINGS POLICIES
-- =============================================================================

CREATE POLICY "Users can view settings in their sites"
  ON mod_bookmod01_settings FOR SELECT
  USING (public.can_access_site(site_id));

CREATE POLICY "Admins can insert settings in their sites"
  ON mod_bookmod01_settings FOR INSERT
  WITH CHECK (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update settings in their sites"
  ON mod_bookmod01_settings FOR UPDATE
  USING (
    public.can_access_site(site_id) AND
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete settings in their sites"
  ON mod_bookmod01_settings FOR DELETE
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

-- =============================================================================
-- HELPER FUNCTION: Generate Slug from Name
-- =============================================================================

CREATE OR REPLACE FUNCTION mod_bookmod01_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Ensure uniqueness by appending a short random string if necessary
    IF EXISTS (SELECT 1 FROM mod_bookmod01_services WHERE site_id = NEW.site_id AND slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      NEW.slug = NEW.slug || '-' || substring(gen_random_uuid()::text from 1 for 8);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mod_bookmod01_services_slug
  BEFORE INSERT OR UPDATE ON mod_bookmod01_services
  FOR EACH ROW EXECUTE FUNCTION mod_bookmod01_generate_slug();
