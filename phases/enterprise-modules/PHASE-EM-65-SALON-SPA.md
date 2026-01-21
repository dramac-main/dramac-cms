# Phase EM-65: Salon & Spa Management Module

> **Priority**: 🟡 MEDIUM (Industry Vertical)
> **Estimated Time**: 26-30 hours
> **Prerequisites**: EM-01, EM-11, EM-51 (Booking)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **salon and spa management system** (similar to Vagaro/Fresha):
1. Service menu with categories
2. Staff/stylist scheduling
3. Online booking with preferences
4. Client history & profiles
5. Retail product sales
6. Loyalty/rewards program

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SALON/SPA MODULE                                   │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   SERVICES      │   SCHEDULING    │     CLIENTS                     │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Categories      │ Staff Calendar  │ Profiles                        │
│ Treatments      │ Appointments    │ History                         │
│ Add-ons         │ Breaks/Time Off │ Preferences                     │
│ Packages        │ Online Booking  │ Loyalty Points                  │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (2 hours)

```sql
-- migrations/em-65-salon-spa-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}

-- Service Categories
CREATE TABLE mod_salon.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Display
  color TEXT,
  icon TEXT,
  image_url TEXT,
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services/Treatments
CREATE TABLE mod_salon.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  category_id UUID NOT NULL REFERENCES mod_salon.categories(id),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Duration
  duration_minutes INTEGER NOT NULL,
  buffer_minutes INTEGER DEFAULT 0, -- cleanup time after
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN (
    'fixed', 'starting_at', 'variable'
  )),
  max_price DECIMAL(10,2),
  
  -- Resources
  requires_room BOOLEAN DEFAULT false,
  room_type TEXT,
  
  -- Online Booking
  online_bookable BOOLEAN DEFAULT true,
  require_deposit BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10,2),
  
  -- Staff
  all_staff_can_perform BOOLEAN DEFAULT true,
  
  -- Display
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Add-ons
CREATE TABLE mod_salon.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing & Duration
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  
  -- Applicable services (null = all)
  applicable_service_ids UUID[],
  
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Packages
CREATE TABLE mod_salon.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Services included
  services JSONB NOT NULL,
  /*
  [
    { "service_id": "uuid", "quantity": 1 }
  ]
  */
  
  -- Pricing
  regular_price DECIMAL(10,2), -- sum of individual services
  package_price DECIMAL(10,2) NOT NULL,
  savings_amount DECIMAL(10,2),
  
  -- Validity
  valid_days INTEGER DEFAULT 365,
  
  -- Purchase limit
  max_purchases INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff/Stylists
CREATE TABLE mod_salon.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  user_id UUID,
  
  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Display
  display_name TEXT,
  photo_url TEXT,
  bio TEXT,
  title TEXT, -- "Senior Stylist", "Nail Technician"
  
  -- Services they perform
  service_ids UUID[],
  
  -- Schedule
  default_schedule JSONB,
  /*
  {
    "monday": { "start": "09:00", "end": "18:00", "breaks": [{"start": "12:00", "end": "13:00"}] },
    ...
  }
  */
  
  -- Commission/Pay
  commission_percentage DECIMAL(5,2),
  hourly_rate DECIMAL(10,2),
  
  -- Booking
  accepts_online_bookings BOOLEAN DEFAULT true,
  booking_priority INTEGER DEFAULT 0, -- higher = shown first
  
  -- Service time adjustments
  service_time_adjustment INTEGER DEFAULT 0, -- +/- minutes
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Availability Overrides
CREATE TABLE mod_salon.staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES mod_salon.staff(id),
  
  date DATE NOT NULL,
  
  -- null = use default schedule
  is_working BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  
  -- Breaks
  breaks JSONB,
  
  reason TEXT, -- "Vacation", "Training", etc
  
  UNIQUE(staff_id, date)
);

-- Time Off Requests
CREATE TABLE mod_salon.time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  staff_id UUID NOT NULL REFERENCES mod_salon.staff(id),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  reason TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'denied'
  )),
  
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE mod_salon.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  user_id UUID,
  
  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  date_of_birth DATE,
  gender TEXT,
  
  -- Address
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Preferences
  preferred_staff_id UUID REFERENCES mod_salon.staff(id),
  preferred_contact_method TEXT CHECK (preferred_contact_method IN (
    'email', 'sms', 'phone'
  )),
  
  -- Notes
  notes TEXT,
  internal_notes TEXT, -- staff only
  
  -- Allergies/Sensitivities
  allergies TEXT[],
  skin_type TEXT,
  hair_type TEXT,
  
  -- Marketing
  accepts_marketing BOOLEAN DEFAULT true,
  referral_source TEXT,
  referred_by_client_id UUID REFERENCES mod_salon.clients(id),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'inactive', 'blocked'
  )),
  blocked_reason TEXT,
  
  -- Loyalty
  loyalty_points INTEGER DEFAULT 0,
  lifetime_spend DECIMAL(12,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  
  -- Dates
  first_visit_date DATE,
  last_visit_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Package Purchases
CREATE TABLE mod_salon.client_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  client_id UUID NOT NULL REFERENCES mod_salon.clients(id),
  package_id UUID NOT NULL REFERENCES mod_salon.packages(id),
  
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  -- Usage tracking
  services_remaining JSONB NOT NULL,
  /*
  [
    { "service_id": "uuid", "remaining": 3 }
  ]
  */
  
  -- Payment
  amount_paid DECIMAL(10,2),
  
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'expired', 'refunded'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE mod_salon.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Client
  client_id UUID REFERENCES mod_salon.clients(id),
  
  -- Walk-in client info
  walkin_name TEXT,
  walkin_phone TEXT,
  
  -- Staff
  staff_id UUID NOT NULL REFERENCES mod_salon.staff(id),
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'booked' CHECK (status IN (
    'booked', 'confirmed', 'checked_in', 'in_progress',
    'completed', 'no_show', 'cancelled'
  )),
  
  -- Booking source
  booked_via TEXT CHECK (booked_via IN (
    'online', 'phone', 'walk_in', 'app', 'internal'
  )),
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  
  -- Payment
  deposit_paid DECIMAL(10,2),
  
  -- Notes
  notes TEXT,
  client_notes TEXT, -- provided by client
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  late_cancel BOOLEAN DEFAULT false,
  
  -- Rebook
  rebooked_from_id UUID REFERENCES mod_salon.appointments(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment Services
CREATE TABLE mod_salon.appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES mod_salon.appointments(id) ON DELETE CASCADE,
  
  service_id UUID NOT NULL REFERENCES mod_salon.services(id),
  staff_id UUID REFERENCES mod_salon.staff(id),
  
  -- Time slot for this service
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Pricing at time of booking
  price DECIMAL(10,2) NOT NULL,
  
  -- Discount
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,
  
  -- Package usage
  package_id UUID REFERENCES mod_salon.client_packages(id),
  
  sort_order INTEGER DEFAULT 0
);

-- Appointment Add-ons
CREATE TABLE mod_salon.appointment_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_service_id UUID NOT NULL REFERENCES mod_salon.appointment_services(id) ON DELETE CASCADE,
  
  addon_id UUID NOT NULL REFERENCES mod_salon.addons(id),
  
  price DECIMAL(10,2) NOT NULL
);

-- Service History (completed appointments)
CREATE TABLE mod_salon.service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  client_id UUID NOT NULL REFERENCES mod_salon.clients(id),
  appointment_id UUID REFERENCES mod_salon.appointments(id),
  
  service_date DATE NOT NULL,
  
  -- Service details
  service_id UUID REFERENCES mod_salon.services(id),
  service_name TEXT NOT NULL,
  staff_id UUID REFERENCES mod_salon.staff(id),
  staff_name TEXT,
  
  -- Color formulas, treatment notes
  formulas TEXT,
  treatment_notes TEXT,
  
  -- Photos
  before_photos TEXT[],
  after_photos TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (Retail)
CREATE TABLE mod_salon.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Category
  category TEXT,
  brand TEXT,
  
  -- SKU
  sku TEXT,
  barcode TEXT,
  
  -- Pricing
  retail_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  
  -- Inventory
  track_inventory BOOLEAN DEFAULT true,
  current_stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Display
  image_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Sales
CREATE TABLE mod_salon.product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Link to ticket or appointment
  ticket_id UUID,
  appointment_id UUID REFERENCES mod_salon.appointments(id),
  
  client_id UUID REFERENCES mod_salon.clients(id),
  staff_id UUID REFERENCES mod_salon.staff(id),
  
  product_id UUID NOT NULL REFERENCES mod_salon.products(id),
  
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  sale_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets/Invoices
CREATE TABLE mod_salon.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  ticket_number TEXT NOT NULL,
  
  client_id UUID REFERENCES mod_salon.clients(id),
  appointment_id UUID REFERENCES mod_salon.appointments(id),
  
  -- Totals
  services_total DECIMAL(10,2) DEFAULT 0,
  products_total DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  
  -- Discounts
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_type TEXT,
  discount_reason TEXT,
  
  -- Tax
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Tip
  tip_amount DECIMAL(10,2) DEFAULT 0,
  tip_staff_id UUID REFERENCES mod_salon.staff(id),
  
  -- Total
  total DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'paid', 'partial', 'refunded', 'void'
  )),
  
  -- Loyalty
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  points_value DECIMAL(10,2) DEFAULT 0,
  
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Payments
CREATE TABLE mod_salon.ticket_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES mod_salon.tickets(id),
  
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'cash', 'card', 'gift_card', 'points', 'package', 'other'
  )),
  amount DECIMAL(10,2) NOT NULL,
  
  -- Card details
  card_last4 TEXT,
  card_brand TEXT,
  
  -- Gift card
  gift_card_id UUID,
  
  -- Reference
  reference_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Program
CREATE TABLE mod_salon.loyalty_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL UNIQUE,
  tenant_id UUID NOT NULL,
  
  -- Points earning
  points_per_dollar DECIMAL(5,2) DEFAULT 1,
  points_per_visit INTEGER DEFAULT 0,
  referral_points INTEGER DEFAULT 100,
  birthday_bonus_points INTEGER DEFAULT 50,
  
  -- Redemption
  points_value DECIMAL(10,4) DEFAULT 0.01, -- $0.01 per point
  min_points_to_redeem INTEGER DEFAULT 100,
  max_redemption_percentage DECIMAL(5,2) DEFAULT 50,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Transactions
CREATE TABLE mod_salon.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  client_id UUID NOT NULL REFERENCES mod_salon.clients(id),
  
  -- Transaction type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'earn', 'redeem', 'bonus', 'adjustment', 'expiry'
  )),
  
  points INTEGER NOT NULL, -- positive for earn, negative for redeem
  
  -- Reference
  ticket_id UUID REFERENCES mod_salon.tickets(id),
  reason TEXT,
  
  -- Balance
  balance_after INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Cards
CREATE TABLE mod_salon.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  code TEXT NOT NULL UNIQUE,
  
  -- Value
  initial_value DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  
  -- Purchaser
  purchased_by_client_id UUID REFERENCES mod_salon.clients(id),
  purchaser_name TEXT,
  purchaser_email TEXT,
  
  -- Recipient
  recipient_name TEXT,
  recipient_email TEXT,
  message TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'depleted', 'expired', 'cancelled'
  )),
  
  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_salon_appointments_date ON mod_salon.appointments(start_time);
CREATE INDEX idx_salon_appointments_staff ON mod_salon.appointments(staff_id, start_time);
CREATE INDEX idx_salon_appointments_client ON mod_salon.appointments(client_id);
CREATE INDEX idx_salon_clients_email ON mod_salon.clients(email);
CREATE INDEX idx_salon_clients_phone ON mod_salon.clients(phone);
CREATE INDEX idx_salon_service_history ON mod_salon.service_history(client_id, service_date DESC);

-- Enable RLS
ALTER TABLE mod_salon.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_salon.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_salon.tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON mod_salon.appointments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_salon.clients
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_salon.tickets
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Booking Service (2 hours)

```typescript
// src/modules/salon/services/booking-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TimeSlot {
  time: string;
  staffId: string;
  staffName: string;
  available: boolean;
}

export interface BookingRequest {
  clientId?: string;
  walkinName?: string;
  walkinPhone?: string;
  staffId: string;
  services: Array<{
    serviceId: string;
    addons?: string[];
  }>;
  startTime: string;
  notes?: string;
  bookedVia: 'online' | 'phone' | 'walk_in' | 'app' | 'internal';
}

export class BookingService {
  /**
   * Get available time slots for a service
   */
  async getAvailableSlots(
    siteId: string,
    serviceId: string,
    date: string,
    staffId?: string
  ): Promise<TimeSlot[]> {
    // Get service details
    const { data: service } = await supabase
      .from('mod_salon.services')
      .select('duration_minutes, buffer_minutes, all_staff_can_perform')
      .eq('id', serviceId)
      .single();

    if (!service) throw new Error('Service not found');

    const totalDuration = service.duration_minutes + (service.buffer_minutes || 0);

    // Get staff who can perform this service
    let staffQuery = supabase
      .from('mod_salon.staff')
      .select('id, first_name, last_name, default_schedule, service_time_adjustment')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .eq('accepts_online_bookings', true);

    if (!service.all_staff_can_perform) {
      staffQuery = staffQuery.contains('service_ids', [serviceId]);
    }
    if (staffId) {
      staffQuery = staffQuery.eq('id', staffId);
    }

    const { data: staffList } = await staffQuery;

    if (!staffList?.length) return [];

    const slots: TimeSlot[] = [];
    const dateObj = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateObj.getDay()];

    for (const staff of staffList) {
      // Check for availability override
      const { data: override } = await supabase
        .from('mod_salon.staff_availability')
        .select('*')
        .eq('staff_id', staff.id)
        .eq('date', date)
        .single();

      let schedule;
      if (override) {
        if (!override.is_working) continue; // Day off
        schedule = {
          start: override.start_time,
          end: override.end_time,
          breaks: override.breaks || []
        };
      } else {
        schedule = staff.default_schedule?.[dayOfWeek];
        if (!schedule) continue; // Not working this day
      }

      // Get existing appointments for this staff on this date
      const { data: appointments } = await supabase
        .from('mod_salon.appointments')
        .select('start_time, end_time')
        .eq('staff_id', staff.id)
        .gte('start_time', `${date}T00:00:00`)
        .lte('start_time', `${date}T23:59:59`)
        .not('status', 'in', '(cancelled,no_show)');

      const bookedSlots = (appointments || []).map(apt => ({
        start: new Date(apt.start_time).getTime(),
        end: new Date(apt.end_time).getTime()
      }));

      // Generate time slots
      const startTime = this.parseTime(schedule.start, date);
      const endTime = this.parseTime(schedule.end, date);
      const breaks = (schedule.breaks || []).map((b: any) => ({
        start: this.parseTime(b.start, date).getTime(),
        end: this.parseTime(b.end, date).getTime()
      }));

      let currentTime = startTime.getTime();
      const adjustedDuration = totalDuration + (staff.service_time_adjustment || 0);
      const slotInterval = 15 * 60 * 1000; // 15 minute intervals

      while (currentTime + adjustedDuration * 60000 <= endTime.getTime()) {
        const slotEnd = currentTime + adjustedDuration * 60000;
        
        // Check if slot conflicts with bookings
        const hasBookingConflict = bookedSlots.some(
          booking => currentTime < booking.end && slotEnd > booking.start
        );

        // Check if slot conflicts with breaks
        const hasBreakConflict = breaks.some(
          (brk: any) => currentTime < brk.end && slotEnd > brk.start
        );

        // Check if slot is in the past
        const isPast = currentTime < Date.now();

        const available = !hasBookingConflict && !hasBreakConflict && !isPast;

        slots.push({
          time: new Date(currentTime).toISOString(),
          staffId: staff.id,
          staffName: `${staff.first_name} ${staff.last_name}`,
          available
        });

        currentTime += slotInterval;
      }
    }

    return slots;
  }

  private parseTime(timeStr: string, date: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  /**
   * Create appointment
   */
  async createAppointment(
    siteId: string,
    tenantId: string,
    booking: BookingRequest
  ): Promise<{ success: boolean; appointment?: any; error?: string }> {
    // Validate availability
    const startTime = new Date(booking.startTime);
    
    // Calculate total duration
    let totalDuration = 0;
    const serviceDetails: any[] = [];

    for (const svc of booking.services) {
      const { data: service } = await supabase
        .from('mod_salon.services')
        .select('*, addons:mod_salon.addons(*)')
        .eq('id', svc.serviceId)
        .single();

      if (!service) {
        return { success: false, error: `Service not found: ${svc.serviceId}` };
      }

      let serviceDuration = service.duration_minutes;
      let addonsPrice = 0;
      const selectedAddons: any[] = [];

      if (svc.addons) {
        for (const addonId of svc.addons) {
          const { data: addon } = await supabase
            .from('mod_salon.addons')
            .select('*')
            .eq('id', addonId)
            .single();

          if (addon) {
            serviceDuration += addon.duration_minutes || 0;
            addonsPrice += addon.price;
            selectedAddons.push(addon);
          }
        }
      }

      serviceDetails.push({
        service,
        addons: selectedAddons,
        duration: serviceDuration,
        startOffset: totalDuration,
        price: service.price + addonsPrice
      });

      totalDuration += serviceDuration + (service.buffer_minutes || 0);
    }

    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from('mod_salon.appointments')
      .select('id')
      .eq('staff_id', booking.staffId)
      .not('status', 'in', '(cancelled,no_show)')
      .or(`and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`);

    if (conflicts?.length) {
      return { success: false, error: 'Time slot is no longer available' };
    }

    // Create appointment
    const { data: appointment, error: aptError } = await supabase
      .from('mod_salon.appointments')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        client_id: booking.clientId || null,
        walkin_name: booking.walkinName,
        walkin_phone: booking.walkinPhone,
        staff_id: booking.staffId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'booked',
        booked_via: booking.bookedVia,
        notes: booking.notes
      })
      .select()
      .single();

    if (aptError) throw aptError;

    // Create appointment services
    let currentStart = startTime.getTime();
    for (const svc of serviceDetails) {
      const svcStartTime = new Date(currentStart);
      
      const { data: aptService } = await supabase
        .from('mod_salon.appointment_services')
        .insert({
          appointment_id: appointment.id,
          service_id: svc.service.id,
          staff_id: booking.staffId,
          start_time: svcStartTime.toISOString(),
          duration_minutes: svc.duration,
          price: svc.service.price
        })
        .select()
        .single();

      // Add addons
      for (const addon of svc.addons) {
        await supabase.from('mod_salon.appointment_addons').insert({
          appointment_service_id: aptService?.id,
          addon_id: addon.id,
          price: addon.price
        });
      }

      currentStart += svc.duration * 60000 + (svc.service.buffer_minutes || 0) * 60000;
    }

    return { success: true, appointment };
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string,
    lateCancelWindowHours: number = 24
  ): Promise<{ success: boolean; lateCancel: boolean }> {
    const { data: appointment } = await supabase
      .from('mod_salon.appointments')
      .select('start_time')
      .eq('id', appointmentId)
      .single();

    if (!appointment) throw new Error('Appointment not found');

    const cancelDeadline = new Date(
      new Date(appointment.start_time).getTime() - lateCancelWindowHours * 60 * 60 * 1000
    );
    const lateCancel = new Date() > cancelDeadline;

    await supabase
      .from('mod_salon.appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        late_cancel: lateCancel
      })
      .eq('id', appointmentId);

    return { success: true, lateCancel };
  }

  /**
   * Check in client
   */
  async checkIn(appointmentId: string): Promise<void> {
    await supabase
      .from('mod_salon.appointments')
      .update({ status: 'checked_in' })
      .eq('id', appointmentId);
  }

  /**
   * Start service
   */
  async startService(appointmentId: string): Promise<void> {
    await supabase
      .from('mod_salon.appointments')
      .update({ status: 'in_progress' })
      .eq('id', appointmentId);
  }

  /**
   * Complete appointment and create ticket
   */
  async completeAppointment(
    siteId: string,
    tenantId: string,
    appointmentId: string,
    options?: {
      tipAmount?: number;
      tipStaffId?: string;
      discountAmount?: number;
      discountReason?: string;
    }
  ): Promise<any> {
    // Get appointment with services
    const { data: appointment } = await supabase
      .from('mod_salon.appointments')
      .select(`
        *,
        client:mod_salon.clients(id, loyalty_points),
        services:mod_salon.appointment_services(
          *,
          addons:mod_salon.appointment_addons(*)
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (!appointment) throw new Error('Appointment not found');

    // Calculate totals
    let servicesTotal = 0;
    for (const svc of appointment.services || []) {
      servicesTotal += svc.price - (svc.discount_amount || 0);
      for (const addon of svc.addons || []) {
        servicesTotal += addon.price;
      }
    }

    // Get tax rate (would come from settings)
    const taxRate = 0.08; // 8%
    const subtotal = servicesTotal - (options?.discountAmount || 0);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount + (options?.tipAmount || 0);

    // Generate ticket number
    const ticketNumber = `T${Date.now().toString(36).toUpperCase()}`;

    // Get loyalty config
    const { data: loyaltyConfig } = await supabase
      .from('mod_salon.loyalty_config')
      .select('*')
      .eq('site_id', siteId)
      .single();

    let pointsEarned = 0;
    if (loyaltyConfig?.is_active && appointment.client_id) {
      pointsEarned = Math.floor(subtotal * loyaltyConfig.points_per_dollar);
      pointsEarned += loyaltyConfig.points_per_visit || 0;
    }

    // Create ticket
    const { data: ticket } = await supabase
      .from('mod_salon.tickets')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        ticket_number: ticketNumber,
        client_id: appointment.client_id,
        appointment_id: appointmentId,
        services_total: servicesTotal,
        subtotal,
        discount_amount: options?.discountAmount || 0,
        discount_reason: options?.discountReason,
        tax_rate: taxRate * 100,
        tax_amount: taxAmount,
        tip_amount: options?.tipAmount || 0,
        tip_staff_id: options?.tipStaffId,
        total,
        points_earned: pointsEarned,
        status: 'open'
      })
      .select()
      .single();

    // Update appointment status
    await supabase
      .from('mod_salon.appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId);

    // Update client stats
    if (appointment.client_id) {
      const { data: client } = await supabase
        .from('mod_salon.clients')
        .select('total_visits, lifetime_spend')
        .eq('id', appointment.client_id)
        .single();

      await supabase
        .from('mod_salon.clients')
        .update({
          total_visits: (client?.total_visits || 0) + 1,
          lifetime_spend: (client?.lifetime_spend || 0) + total,
          last_visit_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', appointment.client_id);
    }

    return ticket;
  }
}
```

---

### Task 3: Client Service (1.5 hours)

```typescript
// src/modules/salon/services/client-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  preferred_staff_id?: string;
  notes?: string;
  allergies?: string[];
  loyalty_points: number;
  lifetime_spend: number;
  total_visits: number;
  last_visit_date?: string;
}

export class ClientService {
  /**
   * Create client
   */
  async createClient(
    siteId: string,
    tenantId: string,
    client: Partial<Client>
  ): Promise<Client> {
    // Check for duplicate email or phone
    if (client.email) {
      const { data: existing } = await supabase
        .from('mod_salon.clients')
        .select('id')
        .eq('site_id', siteId)
        .eq('email', client.email)
        .single();

      if (existing) {
        throw new Error('A client with this email already exists');
      }
    }

    const { data, error } = await supabase
      .from('mod_salon.clients')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        ...client,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get client with full history
   */
  async getClient(clientId: string): Promise<{
    client: Client;
    upcomingAppointments: any[];
    serviceHistory: any[];
    purchasedPackages: any[];
    loyaltyTransactions: any[];
  }> {
    const { data: client, error } = await supabase
      .from('mod_salon.clients')
      .select(`
        *,
        preferred_staff:mod_salon.staff(id, first_name, last_name)
      `)
      .eq('id', clientId)
      .single();

    if (error) throw error;

    // Get upcoming appointments
    const { data: upcomingAppointments } = await supabase
      .from('mod_salon.appointments')
      .select(`
        *,
        staff:mod_salon.staff(first_name, last_name),
        services:mod_salon.appointment_services(
          service:mod_salon.services(name)
        )
      `)
      .eq('client_id', clientId)
      .gte('start_time', new Date().toISOString())
      .not('status', 'in', '(cancelled,no_show)')
      .order('start_time', { ascending: true })
      .limit(10);

    // Get service history
    const { data: serviceHistory } = await supabase
      .from('mod_salon.service_history')
      .select('*')
      .eq('client_id', clientId)
      .order('service_date', { ascending: false })
      .limit(50);

    // Get purchased packages
    const { data: purchasedPackages } = await supabase
      .from('mod_salon.client_packages')
      .select(`
        *,
        package:mod_salon.packages(name)
      `)
      .eq('client_id', clientId)
      .eq('status', 'active');

    // Get loyalty transactions
    const { data: loyaltyTransactions } = await supabase
      .from('mod_salon.loyalty_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      client,
      upcomingAppointments: upcomingAppointments || [],
      serviceHistory: serviceHistory || [],
      purchasedPackages: purchasedPackages || [],
      loyaltyTransactions: loyaltyTransactions || []
    };
  }

  /**
   * Search clients
   */
  async searchClients(
    siteId: string,
    query: string,
    limit: number = 20
  ): Promise<Client[]> {
    const { data, error } = await supabase
      .from('mod_salon.clients')
      .select('*')
      .eq('site_id', siteId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;

    return data || [];
  }

  /**
   * Add service formula/notes
   */
  async addServiceNotes(
    siteId: string,
    tenantId: string,
    clientId: string,
    appointmentId: string,
    serviceId: string,
    data: {
      formulas?: string;
      treatmentNotes?: string;
      beforePhotos?: string[];
      afterPhotos?: string[];
    }
  ): Promise<void> {
    const { data: service } = await supabase
      .from('mod_salon.services')
      .select('name')
      .eq('id', serviceId)
      .single();

    const { data: appointment } = await supabase
      .from('mod_salon.appointments')
      .select('staff_id, staff:mod_salon.staff(first_name, last_name)')
      .eq('id', appointmentId)
      .single();

    await supabase.from('mod_salon.service_history').insert({
      site_id: siteId,
      tenant_id: tenantId,
      client_id: clientId,
      appointment_id: appointmentId,
      service_date: new Date().toISOString().split('T')[0],
      service_id: serviceId,
      service_name: service?.name || '',
      staff_id: appointment?.staff_id,
      staff_name: appointment?.staff 
        ? `${appointment.staff.first_name} ${appointment.staff.last_name}` 
        : null,
      formulas: data.formulas,
      treatment_notes: data.treatmentNotes,
      before_photos: data.beforePhotos,
      after_photos: data.afterPhotos
    });
  }

  /**
   * Earn loyalty points
   */
  async earnPoints(
    siteId: string,
    tenantId: string,
    clientId: string,
    points: number,
    reason: string,
    ticketId?: string
  ): Promise<void> {
    // Get current balance
    const { data: client } = await supabase
      .from('mod_salon.clients')
      .select('loyalty_points')
      .eq('id', clientId)
      .single();

    const newBalance = (client?.loyalty_points || 0) + points;

    // Update client balance
    await supabase
      .from('mod_salon.clients')
      .update({ loyalty_points: newBalance })
      .eq('id', clientId);

    // Record transaction
    await supabase.from('mod_salon.loyalty_transactions').insert({
      site_id: siteId,
      tenant_id: tenantId,
      client_id: clientId,
      transaction_type: 'earn',
      points,
      ticket_id: ticketId,
      reason,
      balance_after: newBalance
    });
  }

  /**
   * Redeem loyalty points
   */
  async redeemPoints(
    siteId: string,
    tenantId: string,
    clientId: string,
    points: number,
    ticketId: string
  ): Promise<{ success: boolean; value: number }> {
    // Get loyalty config
    const { data: config } = await supabase
      .from('mod_salon.loyalty_config')
      .select('*')
      .eq('site_id', siteId)
      .single();

    if (!config?.is_active) {
      throw new Error('Loyalty program is not active');
    }

    // Get client balance
    const { data: client } = await supabase
      .from('mod_salon.clients')
      .select('loyalty_points')
      .eq('id', clientId)
      .single();

    if (!client || client.loyalty_points < points) {
      throw new Error('Insufficient points');
    }

    if (points < config.min_points_to_redeem) {
      throw new Error(`Minimum ${config.min_points_to_redeem} points required`);
    }

    const newBalance = client.loyalty_points - points;
    const dollarValue = points * config.points_value;

    // Update client balance
    await supabase
      .from('mod_salon.clients')
      .update({ loyalty_points: newBalance })
      .eq('id', clientId);

    // Record transaction
    await supabase.from('mod_salon.loyalty_transactions').insert({
      site_id: siteId,
      tenant_id: tenantId,
      client_id: clientId,
      transaction_type: 'redeem',
      points: -points,
      ticket_id: ticketId,
      reason: 'Points redemption',
      balance_after: newBalance
    });

    return { success: true, value: dollarValue };
  }
}
```

---

### Task 4: Appointment Calendar UI (2 hours)

```tsx
// src/modules/salon/components/AppointmentCalendar.tsx

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MoreVertical,
  Phone,
  MessageCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Avatar,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Badge,
  ScrollArea
} from '@/components/ui';

interface Appointment {
  id: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  walkin_name?: string;
  staff: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    color?: string;
  };
  services: Array<{
    service: { name: string };
    duration_minutes: number;
  }>;
  start_time: string;
  end_time: string;
  status: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  color: string;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  staff: Staff[];
  onSelectAppointment: (id: string) => void;
  onNewAppointment: (staffId: string, time: string) => void;
  onCheckIn: (id: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}

export function AppointmentCalendar({
  appointments,
  staff,
  onSelectAppointment,
  onNewAppointment,
  onCheckIn,
  onCancel,
  onReschedule
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Business hours
  const startHour = 9;
  const endHour = 20;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const slotHeight = 60; // pixels per hour

  // Scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    if (scrollRef.current && currentHour >= startHour && currentHour < endHour) {
      scrollRef.current.scrollTop = (currentHour - startHour) * slotHeight;
    }
  }, []);

  // Filter appointments for current date
  const dayAppointments = useMemo(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return appointments.filter(apt => 
      apt.start_time.startsWith(dateStr)
    );
  }, [appointments, currentDate]);

  // Group appointments by staff
  const appointmentsByStaff = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    staff.forEach(s => { grouped[s.id] = []; });
    
    dayAppointments.forEach(apt => {
      if (grouped[apt.staff.id]) {
        grouped[apt.staff.id].push(apt);
      }
    });
    
    return grouped;
  }, [dayAppointments, staff]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'border-blue-500 bg-blue-50';
      case 'confirmed': return 'border-green-500 bg-green-50';
      case 'checked_in': return 'border-yellow-500 bg-yellow-50';
      case 'in_progress': return 'border-purple-500 bg-purple-50';
      case 'completed': return 'border-gray-400 bg-gray-50';
      case 'no_show': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getAppointmentPosition = (apt: Appointment) => {
    const start = new Date(apt.start_time);
    const end = new Date(apt.end_time);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    const top = ((startMinutes - startHour * 60) / 60) * slotHeight;
    const height = ((endMinutes - startMinutes) / 60) * slotHeight;
    
    return { top, height };
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleSlotClick = (staffId: string, hour: number) => {
    const time = new Date(currentDate);
    time.setHours(hour, 0, 0, 0);
    onNewAppointment(staffId, time.toISOString());
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 1);
            setCurrentDate(newDate);
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-semibold">
            {currentDate.toLocaleDateString([], {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
          
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 1);
            setCurrentDate(newDate);
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Time Column */}
        <div className="w-16 border-r flex-shrink-0">
          <div className="h-16 border-b" /> {/* Header spacer */}
          <ScrollArea className="h-full" ref={scrollRef}>
            <div>
              {hours.map(hour => (
                <div
                  key={hour}
                  className="h-[60px] pr-2 text-right text-xs text-muted-foreground border-b"
                >
                  {new Date(2000, 0, 1, hour).toLocaleTimeString([], {
                    hour: 'numeric'
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Staff Columns */}
        <div className="flex-1 flex overflow-x-auto">
          {staff.map(staffMember => (
            <div key={staffMember.id} className="flex-1 min-w-[200px] border-r">
              {/* Staff Header */}
              <div className="h-16 border-b p-2 flex items-center gap-2 sticky top-0 bg-background z-10">
                <Avatar className="h-8 w-8">
                  {staffMember.photo_url ? (
                    <img src={staffMember.photo_url} alt="" />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: staffMember.color || '#6366f1' }}
                    >
                      {staffMember.first_name[0]}
                    </div>
                  )}
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {staffMember.first_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {appointmentsByStaff[staffMember.id]?.length || 0} appointments
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="relative">
                  {/* Hour Grid Lines */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="h-[60px] border-b cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSlotClick(staffMember.id, hour)}
                    />
                  ))}

                  {/* Appointments */}
                  {appointmentsByStaff[staffMember.id]?.map(apt => {
                    const { top, height } = getAppointmentPosition(apt);
                    const clientName = apt.client 
                      ? `${apt.client.first_name} ${apt.client.last_name}`
                      : apt.walkin_name || 'Walk-in';

                    return (
                      <div
                        key={apt.id}
                        className={`absolute left-1 right-1 rounded-md border-l-4 p-2 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(apt.status)}`}
                        style={{ top: `${top}px`, height: `${Math.max(height - 4, 30)}px` }}
                        onClick={() => onSelectAppointment(apt.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {clientName}
                            </div>
                            {height >= 50 && (
                              <div className="text-xs text-muted-foreground truncate">
                                {apt.services.map(s => s.service.name).join(', ')}
                              </div>
                            )}
                            {height >= 70 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                              </div>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {apt.status === 'booked' && (
                                <DropdownMenuItem onClick={() => onCheckIn(apt.id)}>
                                  Check In
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => onReschedule(apt.id)}>
                                Reschedule
                              </DropdownMenuItem>
                              {apt.client?.phone && (
                                <>
                                  <DropdownMenuItem>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Text
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => onCancel(apt.id)}
                              >
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}

                  {/* Current Time Indicator */}
                  {currentDate.toDateString() === new Date().toDateString() && (() => {
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    if (currentMinutes >= startHour * 60 && currentMinutes < endHour * 60) {
                      const top = ((currentMinutes - startHour * 60) / 60) * slotHeight;
                      return (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none"
                          style={{ top: `${top}px` }}
                        >
                          <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 5: Online Booking Widget (1.5 hours)

```tsx
// src/modules/salon/components/OnlineBooking.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  X
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Avatar,
  Badge,
  Input,
  Textarea
} from '@/components/ui';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category: { name: string };
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  title?: string;
}

interface TimeSlot {
  time: string;
  staffId: string;
  staffName: string;
  available: boolean;
}

interface OnlineBookingProps {
  services: Service[];
  staff: Staff[];
  onBookAppointment: (booking: {
    services: string[];
    staffId: string;
    startTime: string;
    clientInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      notes?: string;
    };
  }) => Promise<{ success: boolean; appointment?: any }>;
  fetchTimeSlots: (serviceId: string, date: string, staffId?: string) => Promise<TimeSlot[]>;
}

type Step = 'services' | 'staff' | 'datetime' | 'info' | 'confirm';

export function OnlineBooking({
  services,
  staff,
  onBookAppointment,
  fetchTimeSlots
}: OnlineBookingProps) {
  const [step, setStep] = useState<Step>('services');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [bookingComplete, setBookingComplete] = useState(false);

  // Calculate totals
  const selectedServiceDetails = services.filter(s => selectedServices.includes(s.id));
  const totalDuration = selectedServiceDetails.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalPrice = selectedServiceDetails.reduce((sum, s) => sum + s.price, 0);

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category?.name || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Fetch time slots when date changes
  useEffect(() => {
    if (selectedDate && selectedServices.length > 0) {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      fetchTimeSlots(selectedServices[0], dateStr, selectedStaff || undefined)
        .then(slots => {
          setTimeSlots(slots);
          setLoading(false);
        });
    }
  }, [selectedDate, selectedServices, selectedStaff]);

  // Generate calendar dates
  const generateCalendarDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 28; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const calendarDates = generateCalendarDates();

  const handleBook = async () => {
    if (!selectedTime || !selectedStaff) return;

    setLoading(true);
    const result = await onBookAppointment({
      services: selectedServices,
      staffId: selectedStaff,
      startTime: selectedTime,
      clientInfo
    });

    setLoading(false);
    if (result.success) {
      setBookingComplete(true);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  if (bookingComplete) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-4">
            We've sent a confirmation to {clientInfo.email}
          </p>
          <div className="text-left bg-muted p-4 rounded-lg">
            <p className="font-medium">{selectedServiceDetails.map(s => s.name).join(', ')}</p>
            <p className="text-sm text-muted-foreground">
              {selectedDate?.toLocaleDateString([], { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })} at {selectedTime && new Date(selectedTime).toLocaleTimeString([], { 
                hour: 'numeric', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Book Appointment</CardTitle>
          {/* Progress */}
          <div className="flex gap-1">
            {(['services', 'staff', 'datetime', 'info'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${
                  ['services', 'staff', 'datetime', 'info', 'confirm'].indexOf(step) >= i
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Step: Services */}
        {step === 'services' && (
          <div className="space-y-6">
            <h3 className="font-medium">Select Services</h3>
            
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                <div className="space-y-2">
                  {categoryServices.map(service => (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedServices.includes(service.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {service.duration_minutes} min
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${service.price}</span>
                          {selectedServices.includes(service.id) && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Selected Summary */}
            {selectedServices.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">{selectedServices.length} service(s)</p>
                  <p className="text-sm text-muted-foreground">
                    {totalDuration} min · ${totalPrice}
                  </p>
                </div>
                <Button onClick={() => setStep('staff')}>
                  Continue
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step: Staff */}
        {step === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStep('services')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium">Select Staff</h3>
            </div>

            <div
              onClick={() => {
                setSelectedStaff(null);
                setStep('datetime');
              }}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedStaff === null ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">No Preference</div>
                  <div className="text-sm text-muted-foreground">First available</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {staff.map(member => (
                <div
                  key={member.id}
                  onClick={() => {
                    setSelectedStaff(member.id);
                    setStep('datetime');
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStaff === member.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt="" />
                      ) : (
                        <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center">
                          {member.first_name[0]}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.first_name} {member.last_name}
                      </div>
                      {member.title && (
                        <div className="text-sm text-muted-foreground">{member.title}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Date & Time */}
        {step === 'datetime' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStep('staff')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium">Select Date & Time</h3>
            </div>

            {/* Date Selection */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2">
                {calendarDates.map(date => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-16 p-2 rounded-lg text-center transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="text-xs">
                        {date.toLocaleDateString([], { weekday: 'short' })}
                      </div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                      {isToday && <Badge variant="secondary" className="text-xs">Today</Badge>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="space-y-4">
                <h4 className="font-medium">
                  Available Times for{' '}
                  {selectedDate.toLocaleDateString([], { month: 'long', day: 'numeric' })}
                </h4>
                
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : timeSlots.filter(s => s.available).length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots
                      .filter(s => s.available)
                      .map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => {
                            setSelectedTime(slot.time);
                            if (!selectedStaff) {
                              setSelectedStaff(slot.staffId);
                            }
                          }}
                          className={`p-2 rounded border text-center transition-colors ${
                            selectedTime === slot.time
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'hover:border-primary'
                          }`}
                        >
                          {new Date(slot.time).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No available times for this date
                  </div>
                )}
              </div>
            )}

            {selectedTime && (
              <div className="flex justify-end">
                <Button onClick={() => setStep('info')}>Continue</Button>
              </div>
            )}
          </div>
        )}

        {/* Step: Client Info */}
        {step === 'info' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStep('datetime')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium">Your Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={clientInfo.firstName}
                  onChange={e => setClientInfo({ ...clientInfo, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={clientInfo.lastName}
                  onChange={e => setClientInfo({ ...clientInfo, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={clientInfo.email}
                onChange={e => setClientInfo({ ...clientInfo, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={clientInfo.phone}
                onChange={e => setClientInfo({ ...clientInfo, phone: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={clientInfo.notes}
                onChange={e => setClientInfo({ ...clientInfo, notes: e.target.value })}
                placeholder="Any special requests or information"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep('confirm')}
                disabled={!clientInfo.firstName || !clientInfo.lastName || !clientInfo.email || !clientInfo.phone}
              >
                Review Booking
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStep('info')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium">Confirm Booking</h3>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-4">
              {/* Services */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Services</h4>
                {selectedServiceDetails.map(service => (
                  <div key={service.id} className="flex justify-between">
                    <span>{service.name}</span>
                    <span>${service.price}</span>
                  </div>
                ))}
              </div>

              {/* Date & Time */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Date & Time</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {selectedDate?.toLocaleDateString([], {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {selectedTime && new Date(selectedTime).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t flex justify-between font-bold">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleBook}
              disabled={loading}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Services create with categories
- [ ] Staff schedules configure
- [ ] Online booking flows work
- [ ] Appointments display on calendar
- [ ] Check-in/checkout works
- [ ] Tickets generate with totals
- [ ] Products track inventory
- [ ] Loyalty points earn/redeem
- [ ] Client history tracks
- [ ] Service formulas save

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-51 (Booking)
- **Required by**: Payment integrations, SMS notifications
- **External**: Stripe (payments), Twilio (SMS), Square (POS)
