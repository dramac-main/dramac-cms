# Phase EM-51: Booking Module

> **Priority**: 🟠 HIGH
> **Estimated Time**: 15-20 hours
> **Prerequisites**: EM-01, EM-05, EM-11, EM-12, EM-13
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a **full-featured booking/scheduling module** that:
1. Manages calendars and availability
2. Handles appointment booking
3. Supports multiple service types
4. Provides reminders and notifications
5. Integrates with CRM for customer data

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING MODULE                           │
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
│  │ Reminders  │  │  Payments  │  │  Reviews   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Database Schema

```sql
-- migrations/modules/booking/20260126_booking_tables.sql

-- ============================================================================
-- BOOKING SERVICES (What can be booked)
-- ============================================================================

-- Table prefix follows naming convention: mod_{short_id}_
-- For this reference, using mod_booking_ as placeholder

CREATE TABLE IF NOT EXISTS mod_booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant (REQUIRED)
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Service details
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Duration
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 0,
  
  -- Pricing
  price DECIMAL(10,2),
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
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

CREATE INDEX idx_booking_services_site ON mod_booking_services(site_id) WHERE is_active = true;

-- ============================================================================
-- STAFF MEMBERS (Who provides services)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_booking_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Link to platform user (optional)
  user_id UUID REFERENCES auth.users(id),
  
  -- Staff details
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Display
  avatar_url TEXT,
  bio TEXT,
  
  -- Availability defaults
  default_availability JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  
  -- Settings
  accept_bookings BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_staff_site ON mod_booking_staff(site_id);

-- ============================================================================
-- STAFF-SERVICE ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_booking_staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  staff_id UUID NOT NULL REFERENCES mod_booking_staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES mod_booking_services(id) ON DELETE CASCADE,
  
  -- Override pricing (optional)
  custom_price DECIMAL(10,2),
  custom_duration_minutes INTEGER,
  
  UNIQUE(staff_id, service_id)
);

-- ============================================================================
-- CALENDARS (Availability containers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_booking_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Calendar details
  name TEXT NOT NULL,
  description TEXT,
  
  -- Type
  type TEXT DEFAULT 'staff' CHECK (type IN ('staff', 'resource', 'location')),
  
  -- Link to staff/resource
  staff_id UUID REFERENCES mod_booking_staff(id),
  
  -- Timezone
  timezone TEXT DEFAULT 'UTC',
  
  -- External calendar sync
  external_calendar_url TEXT,
  external_calendar_type TEXT,  -- 'google', 'outlook', 'ical'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AVAILABILITY RULES (Working hours)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_booking_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- What this applies to
  calendar_id UUID REFERENCES mod_booking_calendars(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES mod_booking_staff(id) ON DELETE CASCADE,
  service_id UUID REFERENCES mod_booking_services(id) ON DELETE CASCADE,
  
  -- Rule type
  rule_type TEXT NOT NULL CHECK (rule_type IN ('available', 'blocked', 'holiday')),
  
  -- When (recurring)
  day_of_week INTEGER,  -- 0=Sunday, 6=Saturday, NULL=specific date
  start_time TIME,
  end_time TIME,
  
  -- When (specific date)
  specific_date DATE,
  
  -- Date range (for seasonal availability)
  valid_from DATE,
  valid_until DATE,
  
  -- Priority (higher = more important)
  priority INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_availability_calendar ON mod_booking_availability(calendar_id);
CREATE INDEX idx_booking_availability_staff ON mod_booking_availability(staff_id);

-- ============================================================================
-- APPOINTMENTS (The actual bookings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_booking_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- What
  service_id UUID NOT NULL REFERENCES mod_booking_services(id),
  
  -- Who provides
  staff_id UUID REFERENCES mod_booking_staff(id),
  calendar_id UUID REFERENCES mod_booking_calendars(id),
  
  -- Who booked
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_notes TEXT,
  
  -- Link to CRM (if available)
  crm_contact_id UUID,
  
  -- When
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting confirmation
    'confirmed',    -- Confirmed
    'cancelled',    -- Cancelled
    'completed',    -- Done
    'no_show'       -- Customer didn't show
  )),
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,  -- 'customer', 'staff', 'system'
  cancellation_reason TEXT,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'refunded', 'failed'
  )),
  payment_amount DECIMAL(10,2),
  payment_id TEXT,  -- External payment reference
  
  -- Recurring
  recurring_id UUID,  -- Links recurring appointments
  recurring_rule TEXT,  -- RRULE format
  
  -- Reminders
  reminder_sent_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_appointments_site ON mod_booking_appointments(site_id);
CREATE INDEX idx_booking_appointments_time ON mod_booking_appointments(site_id, start_time);
CREATE INDEX idx_booking_appointments_status ON mod_booking_appointments(site_id, status);
CREATE INDEX idx_booking_appointments_staff ON mod_booking_appointments(staff_id, start_time);

-- ============================================================================
-- BOOKING REMINDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  appointment_id UUID NOT NULL REFERENCES mod_booking_appointments(id) ON DELETE CASCADE,
  
  -- When to send
  send_at TIMESTAMPTZ NOT NULL,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error TEXT,
  
  -- Content
  subject TEXT,
  body TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_reminders_pending ON mod_booking_reminders(send_at) 
  WHERE status = 'pending';

-- ============================================================================
-- BOOKING SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  
  -- General
  business_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  time_format TEXT DEFAULT '12h',
  
  -- Booking rules
  min_booking_notice_hours INTEGER DEFAULT 24,
  max_booking_advance_days INTEGER DEFAULT 90,
  cancellation_notice_hours INTEGER DEFAULT 24,
  
  -- Reminders
  reminder_hours JSONB DEFAULT '[24, 1]',  -- Hours before
  
  -- Confirmation
  auto_confirm BOOLEAN DEFAULT false,
  confirmation_email_enabled BOOLEAN DEFAULT true,
  
  -- Appearance
  accent_color TEXT DEFAULT '#3B82F6',
  logo_url TEXT,
  
  -- Payment
  require_payment BOOLEAN DEFAULT false,
  payment_provider TEXT,  -- 'stripe', 'paypal'
  
  -- Notifications
  notification_email TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 Core Services

```typescript
// src/modules/booking/services/availability-service.ts

import { createModuleDataAccess } from '@/lib/modules/database/tenant-data-access';
import { TenantContext } from '@/lib/multi-tenant/tenant-context';

const TABLE_PREFIX = 'mod_booking';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  staffId?: string;
}

interface AvailabilityQuery {
  serviceId: string;
  staffId?: string;
  date: Date;
  timezone?: string;
}

/**
 * Get available time slots for a service
 */
export async function getAvailableSlots(
  query: AvailabilityQuery,
  context: TenantContext
): Promise<TimeSlot[]> {
  const db = createModuleDataAccess({
    moduleId: 'booking',
    tablePrefix: TABLE_PREFIX,
    context
  });
  
  // 1. Get service details
  const service = await db.from('services').get(query.serviceId);
  if (!service) throw new Error('Service not found');
  
  const duration = service.duration_minutes;
  const bufferBefore = service.buffer_before_minutes || 0;
  const bufferAfter = service.buffer_after_minutes || 0;
  const totalSlotMinutes = duration + bufferBefore + bufferAfter;
  
  // 2. Get staff who can provide this service
  let staffIds: string[] = [];
  
  if (query.staffId) {
    staffIds = [query.staffId];
  } else {
    const staffServices = await db.from('staff_services').query()
      .eq('service_id', query.serviceId);
    staffIds = staffServices.data?.map((ss: any) => ss.staff_id) || [];
  }
  
  if (staffIds.length === 0) {
    return []; // No staff available
  }
  
  // 3. Get availability rules
  const dateString = query.date.toISOString().split('T')[0];
  const dayOfWeek = query.date.getDay();
  
  const slots: TimeSlot[] = [];
  
  for (const staffId of staffIds) {
    // Get working hours for this day
    const { data: availabilityRules } = await db.from('availability').query()
      .or(`staff_id.eq.${staffId},staff_id.is.null`)
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateString}`)
      .eq('rule_type', 'available')
      .order('priority', { ascending: false });
    
    // Get blocked times
    const { data: blockedRules } = await db.from('availability').query()
      .or(`staff_id.eq.${staffId},staff_id.is.null`)
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateString}`)
      .eq('rule_type', 'blocked');
    
    // Get existing appointments
    const dayStart = new Date(query.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(query.date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const { data: existingAppointments } = await db.from('appointments').query()
      .eq('staff_id', staffId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .neq('status', 'cancelled');
    
    // Generate slots from availability
    for (const rule of availabilityRules || []) {
      const startTime = parseTime(rule.start_time, query.date);
      const endTime = parseTime(rule.end_time, query.date);
      
      // Generate slots at intervals
      let slotStart = startTime;
      
      while (slotStart.getTime() + totalSlotMinutes * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);
        
        // Check if slot is blocked
        const isBlocked = (blockedRules || []).some(block => {
          const blockStart = parseTime(block.start_time, query.date);
          const blockEnd = parseTime(block.end_time, query.date);
          return slotStart >= blockStart && slotStart < blockEnd;
        });
        
        // Check if slot conflicts with existing appointment
        const hasConflict = (existingAppointments || []).some(apt => {
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return (slotStart < aptEnd && slotEnd > aptStart);
        });
        
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          available: !isBlocked && !hasConflict,
          staffId
        });
        
        // Move to next slot
        slotStart = new Date(slotStart.getTime() + 30 * 60000); // 30 min intervals
      }
    }
  }
  
  return slots;
}

function parseTime(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
```

```typescript
// src/modules/booking/services/appointment-service.ts

import { createModuleDataAccess } from '@/lib/modules/database/tenant-data-access';
import { TenantContext } from '@/lib/multi-tenant/tenant-context';
import { getAvailableSlots } from './availability-service';

const TABLE_PREFIX = 'mod_booking';

interface CreateAppointmentInput {
  serviceId: string;
  staffId?: string;
  startTime: Date;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Book an appointment
 */
export async function createAppointment(
  input: CreateAppointmentInput,
  context: TenantContext
) {
  const db = createModuleDataAccess({
    moduleId: 'booking',
    tablePrefix: TABLE_PREFIX,
    context
  });
  
  // 1. Get service
  const service = await db.from('services').get(input.serviceId);
  if (!service) throw new Error('Service not found');
  
  // 2. Calculate end time
  const endTime = new Date(
    input.startTime.getTime() + service.duration_minutes * 60000
  );
  
  // 3. Verify slot is available
  const slots = await getAvailableSlots({
    serviceId: input.serviceId,
    staffId: input.staffId,
    date: input.startTime
  }, context);
  
  const isSlotAvailable = slots.some(slot =>
    slot.available &&
    slot.start.getTime() === input.startTime.getTime() &&
    (!input.staffId || slot.staffId === input.staffId)
  );
  
  if (!isSlotAvailable) {
    throw new Error('Selected time slot is not available');
  }
  
  // 4. Determine staff if not specified
  let staffId = input.staffId;
  if (!staffId) {
    const availableSlot = slots.find(slot =>
      slot.available &&
      slot.start.getTime() === input.startTime.getTime()
    );
    staffId = availableSlot?.staffId;
  }
  
  // 5. Get settings
  const settings = await db.from('settings').query().single();
  const autoConfirm = settings?.auto_confirm || false;
  
  // 6. Create appointment
  const appointment = await db.from('appointments').insert({
    service_id: input.serviceId,
    staff_id: staffId,
    start_time: input.startTime.toISOString(),
    end_time: endTime.toISOString(),
    customer_name: input.customer.name,
    customer_email: input.customer.email,
    customer_phone: input.customer.phone,
    customer_notes: input.customer.notes,
    status: autoConfirm ? 'confirmed' : 'pending',
    metadata: input.metadata || {}
  });
  
  // 7. Create reminders
  if (input.customer.email && settings?.reminder_hours) {
    const reminderHours = settings.reminder_hours as number[];
    
    for (const hours of reminderHours) {
      const sendAt = new Date(
        input.startTime.getTime() - hours * 60 * 60 * 1000
      );
      
      if (sendAt > new Date()) {
        await db.from('reminders').insert({
          appointment_id: appointment.id,
          send_at: sendAt.toISOString(),
          type: 'email',
          subject: `Reminder: Your appointment is coming up`,
          body: generateReminderBody(appointment, service, hours)
        });
      }
    }
  }
  
  // 8. Send confirmation email
  if (input.customer.email) {
    await sendConfirmationEmail(appointment, service, input.customer.email);
  }
  
  return appointment;
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: 'customer' | 'staff' | 'system',
  reason: string,
  context: TenantContext
) {
  const db = createModuleDataAccess({
    moduleId: 'booking',
    tablePrefix: TABLE_PREFIX,
    context
  });
  
  const appointment = await db.from('appointments').get(appointmentId);
  if (!appointment) throw new Error('Appointment not found');
  
  // Check cancellation policy
  const settings = await db.from('settings').query().single();
  const noticePeriod = settings?.cancellation_notice_hours || 24;
  
  const hoursUntilAppointment = 
    (new Date(appointment.start_time).getTime() - Date.now()) / (60 * 60 * 1000);
  
  if (hoursUntilAppointment < noticePeriod && cancelledBy === 'customer') {
    throw new Error(
      `Cancellations must be made at least ${noticePeriod} hours in advance`
    );
  }
  
  // Update appointment
  const updated = await db.from('appointments').update(appointmentId, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_by: cancelledBy,
    cancellation_reason: reason
  });
  
  // Delete pending reminders
  // (would need to add delete with filter support)
  
  return updated;
}

function generateReminderBody(appointment: any, service: any, hoursAhead: number): string {
  return `
    Hi ${appointment.customer_name},
    
    This is a reminder that your ${service.name} appointment is in ${hoursAhead} hour(s).
    
    Date: ${new Date(appointment.start_time).toLocaleDateString()}
    Time: ${new Date(appointment.start_time).toLocaleTimeString()}
    
    If you need to cancel or reschedule, please do so at least 24 hours in advance.
  `;
}

async function sendConfirmationEmail(appointment: any, service: any, email: string) {
  // Integration with email service
  console.log(`Sending confirmation to ${email}`);
}
```

---

## 📋 API Routes

```typescript
// src/modules/booking/api/appointments.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/middleware/tenant-middleware';
import { createAppointment, cancelAppointment } from '../services/appointment-service';
import { getAvailableSlots } from '../services/availability-service';

export async function GET(request: NextRequest) {
  const tenant = getTenantFromRequest(request);
  const { searchParams } = new URL(request.url);
  
  const serviceId = searchParams.get('service_id');
  const date = searchParams.get('date');
  
  if (!serviceId || !date) {
    return NextResponse.json(
      { error: 'service_id and date required' },
      { status: 400 }
    );
  }
  
  const slots = await getAvailableSlots({
    serviceId,
    date: new Date(date)
  }, {
    agencyId: tenant.agencyId!,
    siteId: tenant.siteId!,
    userId: tenant.userId!
  });
  
  return NextResponse.json({ slots });
}

export async function POST(request: NextRequest) {
  const tenant = getTenantFromRequest(request);
  const body = await request.json();
  
  try {
    const appointment = await createAppointment({
      serviceId: body.service_id,
      staffId: body.staff_id,
      startTime: new Date(body.start_time),
      customer: {
        name: body.customer_name,
        email: body.customer_email,
        phone: body.customer_phone,
        notes: body.notes
      }
    }, {
      agencyId: tenant.agencyId!,
      siteId: tenant.siteId!,
      userId: tenant.userId!
    });
    
    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const tenant = getTenantFromRequest(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const reason = searchParams.get('reason') || 'No reason provided';
  
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  
  try {
    await cancelAppointment(id, 'customer', reason, {
      agencyId: tenant.agencyId!,
      siteId: tenant.siteId!,
      userId: tenant.userId!
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

---

## 📋 Embed Widget

```typescript
// src/modules/booking/components/BookingWidget.tsx

'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@dramac/sdk/ui';
import { Calendar, Clock, User, Check } from 'lucide-react';

interface BookingWidgetProps {
  siteId: string;
  serviceId?: string;
  onBooked?: (appointment: any) => void;
}

export function BookingWidget({ siteId, serviceId, onBooked }: BookingWidgetProps) {
  const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'confirm'>('service');
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>(serviceId || '');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  // Load services
  useEffect(() => {
    if (!serviceId) {
      fetch(`/api/modules/booking/services?site_id=${siteId}`)
        .then(r => r.json())
        .then(data => setServices(data.services || []));
    }
  }, [siteId, serviceId]);
  
  // Load slots when date/service changes
  useEffect(() => {
    if (selectedService && selectedDate) {
      setLoading(true);
      fetch(
        `/api/modules/booking/appointments?site_id=${siteId}&service_id=${selectedService}&date=${selectedDate.toISOString()}`
      )
        .then(r => r.json())
        .then(data => {
          setSlots(data.slots || []);
          setLoading(false);
        });
    }
  }, [selectedService, selectedDate, siteId]);
  
  async function handleBook() {
    setLoading(true);
    
    try {
      const response = await fetch('/api/modules/booking/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Site-ID': siteId
        },
        body: JSON.stringify({
          service_id: selectedService,
          start_time: selectedSlot.start,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          notes: customer.notes
        })
      });
      
      if (!response.ok) throw new Error('Booking failed');
      
      const appointment = await response.json();
      setStep('confirm');
      onBooked?.(appointment);
      
    } catch (error) {
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book an Appointment
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step indicator */}
        <div className="flex justify-between mb-6">
          {['service', 'datetime', 'details', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={`flex items-center ${i > 0 ? 'flex-1' : ''}`}
            >
              {i > 0 && (
                <div className={`h-0.5 flex-1 ${
                  ['service', 'datetime', 'details', 'confirm'].indexOf(step) >= i
                    ? 'bg-primary'
                    : 'bg-muted'
                }`} />
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                ['service', 'datetime', 'details', 'confirm'].indexOf(step) >= i
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
            </div>
          ))}
        </div>
        
        {/* Step 1: Select Service */}
        {step === 'service' && (
          <div className="space-y-4">
            <h3 className="font-medium">Select a Service</h3>
            
            {services.map(service => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service.id);
                  setStep('datetime');
                }}
                className={`w-full p-4 text-left border rounded-lg hover:border-primary transition ${
                  selectedService === service.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-muted-foreground">
                  {service.duration_minutes} min • ${service.price}
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Step 2: Select Date & Time */}
        {step === 'datetime' && (
          <div className="space-y-4">
            <h3 className="font-medium">Select Date & Time</h3>
            
            {/* Simple date picker */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map(date => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 p-2 text-center border rounded-lg w-16 ${
                    selectedDate.toDateString() === date.toDateString()
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(date, 'EEE')}
                  </div>
                  <div className="font-medium">{format(date, 'd')}</div>
                </button>
              ))}
            </div>
            
            {/* Time slots */}
            <div className="grid grid-cols-3 gap-2">
              {loading ? (
                <div className="col-span-3 text-center py-4">Loading...</div>
              ) : slots.filter(s => s.available).length === 0 ? (
                <div className="col-span-3 text-center py-4 text-muted-foreground">
                  No available slots
                </div>
              ) : (
                slots.filter(s => s.available).map(slot => (
                  <button
                    key={slot.start}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep('details');
                    }}
                    className={`p-2 text-center border rounded-lg hover:border-primary ${
                      selectedSlot?.start === slot.start ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    {format(new Date(slot.start), 'h:mm a')}
                  </button>
                ))
              )}
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setStep('service')}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}
        
        {/* Step 3: Customer Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <h3 className="font-medium">Your Details</h3>
            
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={customer.name}
                onChange={e => setCustomer({ ...customer, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customer.email}
                onChange={e => setCustomer({ ...customer, email: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={customer.phone}
                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={customer.notes}
                onChange={e => setCustomer({ ...customer, notes: e.target.value })}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('datetime')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleBook}
                disabled={!customer.name || !customer.email || loading}
                className="flex-1"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 4: Confirmation */}
        {step === 'confirm' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium">Booking Confirmed!</h3>
            <p className="text-muted-foreground">
              We've sent a confirmation email to {customer.email}
            </p>
            <Button onClick={() => window.location.reload()}>
              Book Another
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

- [ ] Services CRUD works
- [ ] Staff management works
- [ ] Availability rules applied correctly
- [ ] Time slots calculated correctly
- [ ] Appointments created with validation
- [ ] Cancellation policy enforced
- [ ] Reminders scheduled
- [ ] Booking widget functional
- [ ] Multi-tenant isolation verified

---

## 📍 Dependencies

- **Requires**: EM-01, EM-05, EM-11, EM-12, EM-13, EM-40
- **Integrates with**: EM-50 (CRM for customer data)
