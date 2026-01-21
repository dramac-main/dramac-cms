# Phase EM-60: Hotel Management Module

> **Priority**: 🟡 MEDIUM (Industry Vertical)
> **Estimated Time**: 30-35 hours
> **Prerequisites**: EM-01, EM-11, EM-51 (Booking), EM-55 (Accounting)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **hotel/property management system** (similar to Cloudbeds/Little Hotelier):
1. Room inventory and rate management
2. Reservation system with calendar
3. Guest management and CRM
4. Front desk operations
5. Housekeeping management
6. Channel manager integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   HOTEL MANAGEMENT MODULE                            │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   INVENTORY     │   OPERATIONS    │     GUEST SERVICES              │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Room Types      │ Reservations    │ Guest Profiles                  │
│ Room Rates      │ Check-in/out    │ Folio & Billing                 │
│ Availability    │ Housekeeping    │ Requests & Services             │
│ Rate Rules      │ Maintenance     │ Loyalty Program                 │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (2 hours)

```sql
-- migrations/em-60-hotel-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}

-- Room Types
CREATE TABLE mod_hotel.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  
  -- Capacity
  base_occupancy INTEGER DEFAULT 2,
  max_occupancy INTEGER DEFAULT 2,
  max_adults INTEGER DEFAULT 2,
  max_children INTEGER DEFAULT 2,
  
  -- Details
  size_sqft INTEGER,
  bed_type TEXT,
  bed_count INTEGER DEFAULT 1,
  
  -- Amenities
  amenities TEXT[],
  
  -- Media
  images TEXT[],
  
  -- Pricing defaults
  base_rate DECIMAL(10,2) NOT NULL,
  extra_adult_rate DECIMAL(10,2) DEFAULT 0,
  extra_child_rate DECIMAL(10,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Rooms
CREATE TABLE mod_hotel.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  room_type_id UUID NOT NULL REFERENCES mod_hotel.room_types(id),
  
  room_number TEXT NOT NULL,
  floor INTEGER,
  building TEXT,
  
  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN (
    'available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'
  )),
  
  -- Features (overrides)
  is_smoking BOOLEAN DEFAULT false,
  is_accessible BOOLEAN DEFAULT false,
  has_view TEXT,
  extra_amenities TEXT[],
  
  -- Housekeeping
  last_cleaned_at TIMESTAMPTZ,
  last_inspected_at TIMESTAMPTZ,
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, room_number)
);

-- Rate Plans
CREATE TABLE mod_hotel.rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  
  -- Type
  rate_type TEXT DEFAULT 'public' CHECK (rate_type IN (
    'public', 'corporate', 'group', 'package', 'promotional'
  )),
  
  -- Pricing
  pricing_model TEXT DEFAULT 'per_night' CHECK (pricing_model IN (
    'per_night', 'per_person', 'flat'
  )),
  
  -- Rules
  min_stay INTEGER DEFAULT 1,
  max_stay INTEGER,
  min_advance_days INTEGER DEFAULT 0,
  max_advance_days INTEGER,
  
  -- Availability
  valid_from DATE,
  valid_until DATE,
  valid_days BOOLEAN[] DEFAULT ARRAY[true, true, true, true, true, true, true],
  
  -- Policies
  cancellation_policy TEXT,
  cancellation_hours INTEGER DEFAULT 24,
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10,2),
  deposit_type TEXT CHECK (deposit_type IN ('fixed', 'percentage', 'first_night')),
  
  -- Inclusions
  includes_breakfast BOOLEAN DEFAULT false,
  includes_parking BOOLEAN DEFAULT false,
  includes_wifi BOOLEAN DEFAULT true,
  extra_inclusions TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room Rates (Room Type + Rate Plan combinations)
CREATE TABLE mod_hotel.room_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  room_type_id UUID NOT NULL REFERENCES mod_hotel.room_types(id),
  rate_plan_id UUID NOT NULL REFERENCES mod_hotel.rate_plans(id),
  
  -- Base rate for this combination
  rate DECIMAL(10,2) NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(room_type_id, rate_plan_id)
);

-- Rate Overrides (specific dates)
CREATE TABLE mod_hotel.rate_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  room_rate_id UUID REFERENCES mod_hotel.room_rates(id),
  room_type_id UUID REFERENCES mod_hotel.room_types(id),
  
  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Override
  override_type TEXT CHECK (override_type IN ('fixed', 'percentage', 'adjustment')),
  override_value DECIMAL(10,2) NOT NULL,
  
  -- Days
  applies_to_days BOOLEAN[] DEFAULT ARRAY[true, true, true, true, true, true, true],
  
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests
CREATE TABLE mod_hotel.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Personal
  title TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Identity
  id_type TEXT,
  id_number TEXT,
  id_expiry DATE,
  nationality TEXT,
  
  -- Stay info
  date_of_birth DATE,
  company TEXT,
  
  -- Preferences
  preferences JSONB DEFAULT '{}',
  dietary_requirements TEXT[],
  
  -- VIP
  vip_status TEXT CHECK (vip_status IN ('none', 'silver', 'gold', 'platinum')),
  loyalty_number TEXT,
  loyalty_points INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  special_requests TEXT,
  
  -- Stats
  total_stays INTEGER DEFAULT 0,
  total_nights INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_stay_at DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations
CREATE TABLE mod_hotel.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Confirmation
  confirmation_number TEXT UNIQUE NOT NULL,
  
  -- Guest
  guest_id UUID NOT NULL REFERENCES mod_hotel.guests(id),
  
  -- Dates
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  
  -- Room
  room_type_id UUID NOT NULL REFERENCES mod_hotel.room_types(id),
  rate_plan_id UUID REFERENCES mod_hotel.rate_plans(id),
  room_id UUID REFERENCES mod_hotel.rooms(id),
  
  -- Occupancy
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  
  -- Pricing
  rate_per_night DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  taxes DECIMAL(10,2) DEFAULT 0,
  fees DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  
  -- Payment
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(12,2) GENERATED ALWAYS AS (total - deposit_paid) STORED,
  
  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN (
    'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
  )),
  
  -- Source
  booking_source TEXT DEFAULT 'direct' CHECK (booking_source IN (
    'direct', 'booking_com', 'expedia', 'airbnb', 'ota', 'agent', 'corporate'
  )),
  source_reservation_id TEXT,
  
  -- Special
  special_requests TEXT,
  guest_comments TEXT,
  internal_notes TEXT,
  
  -- Check-in details
  actual_check_in TIMESTAMPTZ,
  actual_check_out TIMESTAMPTZ,
  checked_in_by UUID,
  checked_out_by UUID,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_fee DECIMAL(10,2),
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservation Room Nights (for multi-room/rate tracking)
CREATE TABLE mod_hotel.reservation_nights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES mod_hotel.reservations(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  room_id UUID REFERENCES mod_hotel.rooms(id),
  
  rate DECIMAL(10,2) NOT NULL,
  
  UNIQUE(reservation_id, date)
);

-- Folios (Guest Bills)
CREATE TABLE mod_hotel.folios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  reservation_id UUID REFERENCES mod_hotel.reservations(id),
  guest_id UUID NOT NULL REFERENCES mod_hotel.guests(id),
  
  folio_number TEXT UNIQUE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
  
  -- Totals
  charges_total DECIMAL(12,2) DEFAULT 0,
  payments_total DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) GENERATED ALWAYS AS (charges_total - payments_total) STORED,
  
  -- Billing
  bill_to TEXT,
  billing_address TEXT,
  
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folio Charges
CREATE TABLE mod_hotel.folio_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id UUID NOT NULL REFERENCES mod_hotel.folios(id) ON DELETE CASCADE,
  
  -- Charge details
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'room', 'food', 'beverage', 'minibar', 'spa', 'parking',
    'laundry', 'phone', 'internet', 'other', 'tax', 'fee'
  )),
  
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  -- Tax
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Reference
  reference TEXT,
  posted_by UUID,
  
  is_voided BOOLEAN DEFAULT false,
  voided_by UUID,
  void_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folio Payments
CREATE TABLE mod_hotel.folio_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id UUID NOT NULL REFERENCES mod_hotel.folios(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  payment_method TEXT CHECK (payment_method IN (
    'cash', 'credit_card', 'debit_card', 'bank_transfer',
    'city_ledger', 'comp', 'points'
  )),
  
  -- Card details (encrypted reference only)
  card_type TEXT,
  card_last_four TEXT,
  authorization_code TEXT,
  
  reference TEXT,
  notes TEXT,
  
  processed_by UUID,
  
  is_refunded BOOLEAN DEFAULT false,
  refund_amount DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Housekeeping Tasks
CREATE TABLE mod_hotel.housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  room_id UUID NOT NULL REFERENCES mod_hotel.rooms(id),
  
  -- Task
  task_type TEXT NOT NULL CHECK (task_type IN (
    'checkout_clean', 'stay_over', 'deep_clean', 'turndown', 'inspection', 'custom'
  )),
  
  -- Schedule
  scheduled_date DATE NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'rush')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'inspected', 'issue_found'
  )),
  
  -- Assignment
  assigned_to UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  
  -- Inspection
  inspected_at TIMESTAMPTZ,
  inspected_by UUID,
  inspection_notes TEXT,
  
  -- Issues
  issues TEXT[],
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Requests
CREATE TABLE mod_hotel.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  room_id UUID REFERENCES mod_hotel.rooms(id),
  location TEXT,
  
  -- Request
  category TEXT CHECK (category IN (
    'plumbing', 'electrical', 'hvac', 'furniture', 'appliance', 
    'structural', 'cosmetic', 'safety', 'other'
  )),
  description TEXT NOT NULL,
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'
  )),
  
  -- Assignment
  assigned_to UUID,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Cost
  labor_cost DECIMAL(10,2),
  parts_cost DECIMAL(10,2),
  
  reported_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability Cache (for fast lookups)
CREATE TABLE mod_hotel.availability_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  room_type_id UUID NOT NULL REFERENCES mod_hotel.room_types(id),
  
  date DATE NOT NULL,
  
  total_rooms INTEGER NOT NULL,
  booked_rooms INTEGER DEFAULT 0,
  blocked_rooms INTEGER DEFAULT 0,
  available_rooms INTEGER GENERATED ALWAYS AS (total_rooms - booked_rooms - blocked_rooms) STORED,
  
  min_rate DECIMAL(10,2),
  
  UNIQUE(site_id, room_type_id, date)
);

-- Channel Connections
CREATE TABLE mod_hotel.channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  channel TEXT NOT NULL CHECK (channel IN (
    'booking_com', 'expedia', 'airbnb', 'agoda', 'hotels_com', 'trivago'
  )),
  
  -- Credentials (encrypted)
  credentials JSONB,
  
  -- Mapping
  property_id TEXT,
  room_mappings JSONB,
  rate_mappings JSONB,
  
  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_errors TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hotel_rooms_type ON mod_hotel.rooms(room_type_id, status);
CREATE INDEX idx_hotel_reservations_dates ON mod_hotel.reservations(check_in_date, check_out_date);
CREATE INDEX idx_hotel_reservations_guest ON mod_hotel.reservations(guest_id);
CREATE INDEX idx_hotel_reservations_status ON mod_hotel.reservations(site_id, status);
CREATE INDEX idx_hotel_availability_date ON mod_hotel.availability_cache(site_id, date);
CREATE INDEX idx_hotel_housekeeping_date ON mod_hotel.housekeeping_tasks(scheduled_date, status);

-- Enable RLS
ALTER TABLE mod_hotel.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_hotel.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_hotel.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_hotel.folios ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON mod_hotel.rooms
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_hotel.reservations
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_hotel.guests
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_hotel.folios
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Reservation Service (2.5 hours)

```typescript
// src/modules/hotel/services/reservation-service.ts

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Reservation {
  id: string;
  confirmation_number: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  room_type_id: string;
  room_id?: string;
  adults: number;
  children: number;
  rate_per_night: number;
  total: number;
  status: string;
}

export interface ReservationInput {
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  room_type_id: string;
  rate_plan_id?: string;
  adults: number;
  children?: number;
  special_requests?: string;
  booking_source?: string;
}

export interface AvailabilityResult {
  room_type_id: string;
  room_type_name: string;
  available: number;
  min_rate: number;
  rates: Array<{
    rate_plan_id: string;
    rate_plan_name: string;
    rate: number;
  }>;
}

export class ReservationService {
  /**
   * Check availability for date range
   */
  async checkAvailability(
    siteId: string,
    checkIn: string,
    checkOut: string,
    adults: number = 2,
    children: number = 0
  ): Promise<AvailabilityResult[]> {
    // Get all room types that fit occupancy
    const { data: roomTypes } = await supabase
      .from('mod_hotel.room_types')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .gte('max_adults', adults)
      .gte('max_occupancy', adults + children);

    const results: AvailabilityResult[] = [];

    for (const rt of roomTypes || []) {
      // Check availability cache for all nights
      const { data: availability } = await supabase
        .from('mod_hotel.availability_cache')
        .select('available_rooms')
        .eq('room_type_id', rt.id)
        .gte('date', checkIn)
        .lt('date', checkOut);

      const minAvailable = Math.min(
        ...((availability || []).map(a => a.available_rooms) || [0])
      );

      if (minAvailable > 0) {
        // Get rates for this room type
        const { data: rates } = await supabase
          .from('mod_hotel.room_rates')
          .select(`
            rate,
            rate_plan:mod_hotel.rate_plans(id, name, code)
          `)
          .eq('room_type_id', rt.id)
          .eq('is_active', true);

        results.push({
          room_type_id: rt.id,
          room_type_name: rt.name,
          available: minAvailable,
          min_rate: Math.min(...(rates?.map(r => r.rate) || [rt.base_rate])),
          rates: (rates || []).map(r => ({
            rate_plan_id: r.rate_plan.id,
            rate_plan_name: r.rate_plan.name,
            rate: r.rate
          }))
        });
      }
    }

    return results.sort((a, b) => a.min_rate - b.min_rate);
  }

  /**
   * Create a new reservation
   */
  async createReservation(
    siteId: string,
    tenantId: string,
    userId: string,
    input: ReservationInput
  ): Promise<Reservation> {
    // Calculate number of nights
    const checkIn = new Date(input.check_in_date);
    const checkOut = new Date(input.check_out_date);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights < 1) {
      throw new Error('Check-out must be after check-in');
    }

    // Get rate
    let ratePerNight: number;
    
    if (input.rate_plan_id) {
      const { data: roomRate } = await supabase
        .from('mod_hotel.room_rates')
        .select('rate')
        .eq('room_type_id', input.room_type_id)
        .eq('rate_plan_id', input.rate_plan_id)
        .single();

      ratePerNight = roomRate?.rate || 0;
    } else {
      const { data: roomType } = await supabase
        .from('mod_hotel.room_types')
        .select('base_rate')
        .eq('id', input.room_type_id)
        .single();

      ratePerNight = roomType?.base_rate || 0;
    }

    // Apply rate overrides for specific dates
    let totalRate = 0;
    for (let i = 0; i < nights; i++) {
      const date = new Date(checkIn);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Check for override
      const { data: override } = await supabase
        .from('mod_hotel.rate_overrides')
        .select('*')
        .eq('room_type_id', input.room_type_id)
        .lte('start_date', dateStr)
        .gte('end_date', dateStr)
        .single();

      if (override) {
        if (override.override_type === 'fixed') {
          totalRate += override.override_value;
        } else if (override.override_type === 'percentage') {
          totalRate += ratePerNight * (1 + override.override_value / 100);
        } else {
          totalRate += ratePerNight + override.override_value;
        }
      } else {
        totalRate += ratePerNight;
      }
    }

    // Calculate taxes (example: 10% room tax)
    const taxRate = 0.10;
    const taxes = totalRate * taxRate;
    const total = totalRate + taxes;

    // Generate confirmation number
    const confirmationNumber = `RES-${nanoid(8).toUpperCase()}`;

    // Create reservation
    const { data: reservation, error } = await supabase
      .from('mod_hotel.reservations')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        confirmation_number: confirmationNumber,
        guest_id: input.guest_id,
        check_in_date: input.check_in_date,
        check_out_date: input.check_out_date,
        room_type_id: input.room_type_id,
        rate_plan_id: input.rate_plan_id,
        adults: input.adults,
        children: input.children || 0,
        rate_per_night: ratePerNight,
        subtotal: totalRate,
        taxes,
        total,
        special_requests: input.special_requests,
        booking_source: input.booking_source || 'direct',
        status: 'confirmed',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Update availability cache
    await this.updateAvailability(siteId, input.room_type_id, input.check_in_date, input.check_out_date, 1);

    // Create folio
    await this.createFolio(siteId, tenantId, reservation.id, input.guest_id);

    return reservation;
  }

  /**
   * Check in a guest
   */
  async checkIn(
    reservationId: string,
    roomId: string,
    userId: string
  ): Promise<void> {
    const { data: reservation } = await supabase
      .from('mod_hotel.reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (!reservation) throw new Error('Reservation not found');
    if (reservation.status !== 'confirmed') {
      throw new Error('Reservation is not in confirmed status');
    }

    // Check room is available
    const { data: room } = await supabase
      .from('mod_hotel.rooms')
      .select('status')
      .eq('id', roomId)
      .single();

    if (room?.status !== 'available') {
      throw new Error('Room is not available');
    }

    // Update reservation
    await supabase
      .from('mod_hotel.reservations')
      .update({
        status: 'checked_in',
        room_id: roomId,
        actual_check_in: new Date().toISOString(),
        checked_in_by: userId
      })
      .eq('id', reservationId);

    // Update room status
    await supabase
      .from('mod_hotel.rooms')
      .update({ status: 'occupied' })
      .eq('id', roomId);

    // Post room charges to folio
    await this.postRoomCharges(reservation);
  }

  /**
   * Check out a guest
   */
  async checkOut(
    reservationId: string,
    userId: string
  ): Promise<{ folio: { id: string; balance: number } }> {
    const { data: reservation } = await supabase
      .from('mod_hotel.reservations')
      .select(`
        *,
        folio:mod_hotel.folios(*)
      `)
      .eq('id', reservationId)
      .single();

    if (!reservation) throw new Error('Reservation not found');
    if (reservation.status !== 'checked_in') {
      throw new Error('Guest is not checked in');
    }

    // Check folio balance
    const folio = reservation.folio?.[0];
    if (folio?.balance > 0) {
      return {
        folio: {
          id: folio.id,
          balance: folio.balance
        }
      };
    }

    // Complete checkout
    await supabase
      .from('mod_hotel.reservations')
      .update({
        status: 'checked_out',
        actual_check_out: new Date().toISOString(),
        checked_out_by: userId
      })
      .eq('id', reservationId);

    // Update room status
    if (reservation.room_id) {
      await supabase
        .from('mod_hotel.rooms')
        .update({ status: 'cleaning' })
        .eq('id', reservation.room_id);

      // Create housekeeping task
      await supabase.from('mod_hotel.housekeeping_tasks').insert({
        site_id: reservation.site_id,
        tenant_id: reservation.tenant_id,
        room_id: reservation.room_id,
        task_type: 'checkout_clean',
        scheduled_date: new Date().toISOString().split('T')[0],
        priority: 'high'
      });
    }

    // Close folio
    if (folio) {
      await supabase
        .from('mod_hotel.folios')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', folio.id);
    }

    // Update guest stats
    const nights = Math.ceil(
      (new Date(reservation.check_out_date).getTime() - 
       new Date(reservation.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    await supabase.rpc('update_guest_stats', {
      p_guest_id: reservation.guest_id,
      p_nights: nights,
      p_spent: reservation.total
    });

    return { folio: { id: folio?.id || '', balance: 0 } };
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(
    reservationId: string,
    reason: string,
    userId: string
  ): Promise<{ cancellationFee: number }> {
    const { data: reservation } = await supabase
      .from('mod_hotel.reservations')
      .select(`
        *,
        rate_plan:mod_hotel.rate_plans(cancellation_hours)
      `)
      .eq('id', reservationId)
      .single();

    if (!reservation) throw new Error('Reservation not found');
    if (['checked_in', 'checked_out', 'cancelled'].includes(reservation.status)) {
      throw new Error('Cannot cancel this reservation');
    }

    // Calculate cancellation fee
    const hoursUntilCheckIn = 
      (new Date(reservation.check_in_date).getTime() - Date.now()) / (1000 * 60 * 60);
    const cancellationHours = reservation.rate_plan?.cancellation_hours || 24;

    let cancellationFee = 0;
    if (hoursUntilCheckIn < cancellationHours) {
      // Charge first night
      cancellationFee = reservation.rate_per_night;
    }

    // Update reservation
    await supabase
      .from('mod_hotel.reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancellation_fee: cancellationFee
      })
      .eq('id', reservationId);

    // Restore availability
    await this.updateAvailability(
      reservation.site_id,
      reservation.room_type_id,
      reservation.check_in_date,
      reservation.check_out_date,
      -1
    );

    return { cancellationFee };
  }

  /**
   * Create folio for reservation
   */
  private async createFolio(
    siteId: string,
    tenantId: string,
    reservationId: string,
    guestId: string
  ): Promise<void> {
    const folioNumber = `FOL-${nanoid(8).toUpperCase()}`;

    await supabase.from('mod_hotel.folios').insert({
      site_id: siteId,
      tenant_id: tenantId,
      reservation_id: reservationId,
      guest_id: guestId,
      folio_number: folioNumber,
      status: 'open'
    });
  }

  /**
   * Post room charges to folio
   */
  private async postRoomCharges(reservation: any): Promise<void> {
    const { data: folio } = await supabase
      .from('mod_hotel.folios')
      .select('id')
      .eq('reservation_id', reservation.id)
      .single();

    if (!folio) return;

    // Post room charges for each night
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const charges = [];
    for (let i = 0; i < nights; i++) {
      const date = new Date(checkIn);
      date.setDate(date.getDate() + i);

      charges.push({
        folio_id: folio.id,
        date: date.toISOString().split('T')[0],
        description: 'Room Charge',
        category: 'room',
        quantity: 1,
        unit_price: reservation.rate_per_night,
        total: reservation.rate_per_night,
        tax_rate: 10,
        tax_amount: reservation.rate_per_night * 0.1
      });
    }

    await supabase.from('mod_hotel.folio_charges').insert(charges);

    // Update folio totals
    await supabase.rpc('update_folio_totals', { p_folio_id: folio.id });
  }

  /**
   * Update availability cache
   */
  private async updateAvailability(
    siteId: string,
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    delta: number
  ): Promise<void> {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      await supabase.rpc('update_room_availability', {
        p_site_id: siteId,
        p_room_type_id: roomTypeId,
        p_date: dateStr,
        p_booked_delta: delta
      });
    }
  }
}
```

---

### Task 3: Front Desk Dashboard (2 hours)

```tsx
// src/modules/hotel/components/FrontDeskDashboard.tsx

'use client';

import { useState, useMemo } from 'react';
import {
  BedDouble,
  Users,
  CalendarCheck,
  DoorOpen,
  Sparkles,
  AlertTriangle,
  Clock,
  Search
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui';

interface Room {
  id: string;
  room_number: string;
  floor: number;
  room_type: { name: string };
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  reservation?: {
    guest: { first_name: string; last_name: string };
    check_out_date: string;
  };
}

interface Arrival {
  id: string;
  confirmation_number: string;
  guest: { first_name: string; last_name: string; email: string };
  room_type: { name: string };
  check_in_date: string;
  adults: number;
  special_requests?: string;
}

interface Departure {
  id: string;
  room: { room_number: string };
  guest: { first_name: string; last_name: string };
  check_out_date: string;
  folio_balance: number;
}

interface FrontDeskProps {
  rooms: Room[];
  arrivals: Arrival[];
  departures: Departure[];
  onCheckIn: (reservationId: string, roomId: string) => Promise<void>;
  onCheckOut: (reservationId: string) => Promise<void>;
}

export function FrontDeskDashboard({
  rooms,
  arrivals,
  departures,
  onCheckIn,
  onCheckOut
}: FrontDeskProps) {
  const [selectedReservation, setSelectedReservation] = useState<Arrival | null>(null);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate stats
  const stats = useMemo(() => {
    const available = rooms.filter(r => r.status === 'available').length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const cleaning = rooms.filter(r => r.status === 'cleaning').length;
    const maintenance = rooms.filter(r => r.status === 'maintenance').length;

    return {
      available,
      occupied,
      cleaning,
      maintenance,
      occupancy: Math.round((occupied / rooms.length) * 100)
    };
  }, [rooms]);

  // Group rooms by floor
  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, Room[]> = {};
    rooms.forEach(room => {
      if (!grouped[room.floor]) {
        grouped[room.floor] = [];
      }
      grouped[room.floor].push(room);
    });
    return grouped;
  }, [rooms]);

  const handleCheckIn = async (roomId: string) => {
    if (!selectedReservation) return;
    await onCheckIn(selectedReservation.id, roomId);
    setShowRoomPicker(false);
    setSelectedReservation(null);
  };

  const getRoomStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-blue-500';
      case 'cleaning':
        return 'bg-yellow-500';
      case 'maintenance':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Front Desk</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guest or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button>New Walk-In</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <BedDouble className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.occupied}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Sparkles className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.cleaning}</p>
                <p className="text-xs text-muted-foreground">Cleaning</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-xs text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.occupancy}%</p>
                <p className="text-xs text-muted-foreground">Occupancy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arrivals & Departures */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Arrivals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-green-600" />
                Arrivals Today ({arrivals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {arrivals.map(arrival => (
                  <div
                    key={arrival.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedReservation(arrival);
                      setShowRoomPicker(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {arrival.guest.first_name} {arrival.guest.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {arrival.confirmation_number}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {arrival.room_type.name}
                      </Badge>
                    </div>
                    {arrival.special_requests && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ {arrival.special_requests}
                      </p>
                    )}
                  </div>
                ))}
                {arrivals.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No arrivals today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Departures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-red-600" />
                Departures Today ({departures.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {departures.map(departure => (
                  <div
                    key={departure.id}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {departure.guest.first_name} {departure.guest.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Room {departure.room.room_number}
                        </p>
                      </div>
                      <div className="text-right">
                        {departure.folio_balance > 0 ? (
                          <Badge variant="destructive">
                            ${departure.folio_balance.toFixed(2)} due
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => onCheckOut(departure.id)}
                          >
                            Check Out
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {departures.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No departures today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Room Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Room Status</CardTitle>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span>Cleaning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>Maintenance</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(roomsByFloor)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([floor, floorRooms]) => (
                  <div key={floor}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Floor {floor}
                    </p>
                    <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {floorRooms
                        .sort((a, b) => a.room_number.localeCompare(b.room_number))
                        .map(room => (
                          <button
                            key={room.id}
                            className={`
                              p-2 rounded text-white text-sm font-medium
                              ${getRoomStatusColor(room.status)}
                              hover:opacity-80 transition-opacity
                            `}
                            title={`${room.room_number} - ${room.room_type.name}`}
                          >
                            {room.room_number}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Picker Dialog */}
      <Dialog open={showRoomPicker} onOpenChange={setShowRoomPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Select Room for {selectedReservation?.guest.first_name} {selectedReservation?.guest.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Room Type: {selectedReservation?.room_type.name}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {rooms
                .filter(r => r.status === 'available')
                .map(room => (
                  <Button
                    key={room.id}
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => handleCheckIn(room.id)}
                  >
                    <span className="text-lg font-bold">{room.room_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {room.room_type.name}
                    </span>
                  </Button>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### Task 4: Housekeeping Board (1.5 hours)

```tsx
// src/modules/hotel/components/HousekeepingBoard.tsx

'use client';

import { useState } from 'react';
import {
  Sparkles,
  Check,
  Clock,
  AlertCircle,
  User,
  BedDouble
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar
} from '@/components/ui';

interface HousekeepingTask {
  id: string;
  room: {
    room_number: string;
    floor: number;
    room_type: { name: string };
  };
  task_type: 'checkout_clean' | 'stay_over' | 'deep_clean' | 'turndown' | 'inspection';
  priority: 'low' | 'normal' | 'high' | 'rush';
  status: 'pending' | 'in_progress' | 'completed' | 'inspected';
  assigned_to?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface Staff {
  id: string;
  name: string;
  avatar_url?: string;
  current_tasks: number;
}

interface HousekeepingBoardProps {
  tasks: HousekeepingTask[];
  staff: Staff[];
  onAssign: (taskId: string, staffId: string) => Promise<void>;
  onUpdateStatus: (taskId: string, status: string) => Promise<void>;
}

export function HousekeepingBoard({
  tasks,
  staff,
  onAssign,
  onUpdateStatus
}: HousekeepingBoardProps) {
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredTasks = tasks.filter(task => {
    if (selectedFloor !== 'all' && task.room.floor !== parseInt(selectedFloor)) {
      return false;
    }
    if (selectedType !== 'all' && task.task_type !== selectedType) {
      return false;
    }
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => 
    t.status === 'completed' || t.status === 'inspected'
  );

  const floors = [...new Set(tasks.map(t => t.room.floor))].sort();

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'checkout_clean': return 'Checkout';
      case 'stay_over': return 'Stay Over';
      case 'deep_clean': return 'Deep Clean';
      case 'turndown': return 'Turndown';
      case 'inspection': return 'Inspection';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'rush': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const TaskCard = ({ task }: { task: HousekeepingTask }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-12 rounded ${getPriorityColor(task.priority)}`} />
            <div>
              <p className="font-bold text-lg">{task.room.room_number}</p>
              <p className="text-sm text-muted-foreground">
                {task.room.room_type.name}
              </p>
            </div>
          </div>
          <Badge variant="outline">
            {getTaskTypeLabel(task.task_type)}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between">
          {task.assigned_to ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {task.assigned_to.avatar_url ? (
                  <img src={task.assigned_to.avatar_url} alt="" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Avatar>
              <span className="text-sm">{task.assigned_to.name}</span>
            </div>
          ) : (
            <Select onValueChange={(value) => onAssign(task.id, value)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Assign" />
              </SelectTrigger>
              <SelectContent>
                {staff.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.current_tasks})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {task.status === 'pending' && task.assigned_to && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(task.id, 'in_progress')}
            >
              Start
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(task.id, 'completed')}
            >
              <Check className="h-4 w-4 mr-1" />
              Done
            </Button>
          )}
          {task.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(task.id, 'inspected')}
            >
              Inspect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Housekeeping</h1>
          <p className="text-muted-foreground">
            {pendingTasks.length} pending • {inProgressTasks.length} in progress
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map(f => (
                <SelectItem key={f} value={f.toString()}>
                  Floor {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="checkout_clean">Checkout</SelectItem>
              <SelectItem value="stay_over">Stay Over</SelectItem>
              <SelectItem value="deep_clean">Deep Clean</SelectItem>
              <SelectItem value="turndown">Turndown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h2 className="font-semibold">Pending ({pendingTasks.length})</h2>
          </div>
          <div className="space-y-3 min-h-[400px] bg-muted/30 rounded-lg p-3">
            {pendingTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* In Progress */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold">In Progress ({inProgressTasks.length})</h2>
          </div>
          <div className="space-y-3 min-h-[400px] bg-muted/30 rounded-lg p-3">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Completed */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Check className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold">Completed ({completedTasks.length})</h2>
          </div>
          <div className="space-y-3 min-h-[400px] bg-muted/30 rounded-lg p-3">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>

      {/* Staff Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {staff.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <Avatar className="h-10 w-10">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt="" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.current_tasks} tasks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Room types create with amenities
- [ ] Rates configure properly
- [ ] Availability calculates correctly
- [ ] Reservations create/modify/cancel
- [ ] Check-in/out works
- [ ] Folio charges post
- [ ] Payments record
- [ ] Housekeeping tasks assign
- [ ] Room status updates
- [ ] Reports generate

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-51 (Booking)
- **Required by**: Channel manager integrations
- **External**: OTA APIs (Booking.com, Expedia, Airbnb)
