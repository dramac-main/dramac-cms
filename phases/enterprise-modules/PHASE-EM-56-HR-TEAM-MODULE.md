# Phase EM-56: HR & Team Management Module

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 25-30 hours
> **Prerequisites**: EM-01, EM-11, EM-12
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **HR and team management module** (similar to Connecteam/Deputy):
1. Employee profiles and onboarding
2. Time tracking and attendance
3. Shift scheduling
4. Leave management
5. Team communication
6. Document management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HR & TEAM MODULE                                  │
├────────────────┬─────────────────┬──────────────────────────────────┤
│   WORKFORCE    │   SCHEDULING    │      ADMIN                       │
├────────────────┼─────────────────┼──────────────────────────────────┤
│ Employees      │ Shift Planning  │ Leave Policies                   │
│ Time Clock     │ Availability    │ Documents                        │
│ Attendance     │ Shift Swaps     │ Training                         │
│ Breaks         │ Open Shifts     │ Performance                      │
└────────────────┴─────────────────┴──────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (1.5 hours)

```sql
-- migrations/em-56-hr-team-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}

-- Departments
CREATE TABLE mod_hr.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES mod_hr.departments(id),
  
  -- Manager
  manager_id UUID,
  
  -- Settings
  color TEXT DEFAULT '#3B82F6',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Positions
CREATE TABLE mod_hr.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES mod_hr.departments(id),
  
  -- Pay
  pay_type TEXT DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'salary')),
  default_pay_rate DECIMAL(10,2),
  
  -- Requirements
  requirements TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE mod_hr.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Link to user account (optional)
  user_id UUID,
  
  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Employment
  employee_number TEXT UNIQUE,
  position_id UUID REFERENCES mod_hr.positions(id),
  department_id UUID REFERENCES mod_hr.departments(id),
  manager_id UUID REFERENCES mod_hr.employees(id),
  hire_date DATE NOT NULL,
  termination_date DATE,
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN (
    'full_time', 'part_time', 'contract', 'intern', 'seasonal'
  )),
  
  -- Pay
  pay_type TEXT DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'salary')),
  pay_rate DECIMAL(10,2),
  pay_currency TEXT DEFAULT 'USD',
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'pending', 'active', 'on_leave', 'terminated'
  )),
  
  -- Onboarding
  onboarding_status TEXT DEFAULT 'not_started' CHECK (onboarding_status IN (
    'not_started', 'in_progress', 'completed'
  )),
  onboarding_completed_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Skills
CREATE TABLE mod_hr.employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES mod_hr.employees(id) ON DELETE CASCADE,
  
  skill_name TEXT NOT NULL,
  proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  certified BOOLEAN DEFAULT false,
  certification_expires_at DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Locations
CREATE TABLE mod_hr.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  address TEXT,
  
  -- Geofencing
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  geofence_radius_meters INTEGER DEFAULT 100,
  
  timezone TEXT DEFAULT 'America/New_York',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts
CREATE TABLE mod_hr.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Assignment
  employee_id UUID REFERENCES mod_hr.employees(id),
  position_id UUID REFERENCES mod_hr.positions(id),
  department_id UUID REFERENCES mod_hr.departments(id),
  location_id UUID REFERENCES mod_hr.locations(id),
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'draft', 'scheduled', 'published', 'in_progress', 'completed', 'cancelled'
  )),
  
  -- Open shift (unassigned)
  is_open BOOLEAN DEFAULT false,
  open_shift_requests UUID[],
  
  -- Notes
  notes TEXT,
  color TEXT,
  
  -- Recurring
  recurrence_rule TEXT,
  recurrence_parent_id UUID REFERENCES mod_hr.shifts(id),
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift Swap Requests
CREATE TABLE mod_hr.shift_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Original shift
  shift_id UUID NOT NULL REFERENCES mod_hr.shifts(id),
  requester_id UUID NOT NULL REFERENCES mod_hr.employees(id),
  
  -- Swap details
  swap_type TEXT NOT NULL CHECK (swap_type IN ('swap', 'drop', 'pickup')),
  target_shift_id UUID REFERENCES mod_hr.shifts(id),
  target_employee_id UUID REFERENCES mod_hr.employees(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  
  reason TEXT,
  manager_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Entries (Clock In/Out)
CREATE TABLE mod_hr.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  employee_id UUID NOT NULL REFERENCES mod_hr.employees(id),
  shift_id UUID REFERENCES mod_hr.shifts(id),
  
  -- Clock times
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  
  -- Location
  clock_in_location_id UUID REFERENCES mod_hr.locations(id),
  clock_in_latitude DECIMAL(10,7),
  clock_in_longitude DECIMAL(10,7),
  clock_out_latitude DECIMAL(10,7),
  clock_out_longitude DECIMAL(10,7),
  
  -- Calculated
  regular_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2),
  break_minutes INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'edited', 'approved', 'rejected'
  )),
  
  -- Edits
  edited_by UUID,
  edit_reason TEXT,
  original_clock_in TIMESTAMPTZ,
  original_clock_out TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Breaks
CREATE TABLE mod_hr.breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES mod_hr.time_entries(id) ON DELETE CASCADE,
  
  break_start TIMESTAMPTZ NOT NULL,
  break_end TIMESTAMPTZ,
  
  break_type TEXT DEFAULT 'unpaid' CHECK (break_type IN ('paid', 'unpaid')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Types
CREATE TABLE mod_hr.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Accrual
  accrual_type TEXT DEFAULT 'none' CHECK (accrual_type IN (
    'none', 'yearly', 'monthly', 'per_pay_period', 'per_hours_worked'
  )),
  accrual_amount DECIMAL(5,2),
  max_accrual DECIMAL(5,2),
  
  -- Carry over
  allow_carryover BOOLEAN DEFAULT false,
  max_carryover DECIMAL(5,2),
  
  -- Settings
  requires_approval BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  min_notice_days INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Leave Balances
CREATE TABLE mod_hr.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES mod_hr.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES mod_hr.leave_types(id),
  
  year INTEGER NOT NULL,
  
  -- Hours
  accrued DECIMAL(6,2) DEFAULT 0,
  used DECIMAL(6,2) DEFAULT 0,
  pending DECIMAL(6,2) DEFAULT 0,
  carried_over DECIMAL(6,2) DEFAULT 0,
  
  -- Calculated
  available DECIMAL(6,2) GENERATED ALWAYS AS (accrued + carried_over - used - pending) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, leave_type_id, year)
);

-- Leave Requests
CREATE TABLE mod_hr.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  employee_id UUID NOT NULL REFERENCES mod_hr.employees(id),
  leave_type_id UUID NOT NULL REFERENCES mod_hr.leave_types(id),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Time
  is_half_day BOOLEAN DEFAULT false,
  half_day_period TEXT CHECK (half_day_period IN ('morning', 'afternoon')),
  
  -- Hours
  total_hours DECIMAL(6,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  
  reason TEXT,
  manager_notes TEXT,
  
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE mod_hr.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Owner
  employee_id UUID REFERENCES mod_hr.employees(id),
  
  -- Document
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  -- Category
  category TEXT CHECK (category IN (
    'contract', 'id', 'certification', 'tax', 'policy', 'training', 'other'
  )),
  
  -- Expiration
  expires_at DATE,
  
  -- Acknowledgment
  requires_acknowledgment BOOLEAN DEFAULT false,
  acknowledged_by UUID[],
  
  -- Visibility
  is_company_wide BOOLEAN DEFAULT false,
  visible_to_departments UUID[],
  
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Tasks
CREATE TABLE mod_hr.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Assignment
  assigned_to TEXT CHECK (assigned_to IN ('employee', 'manager', 'hr')),
  
  -- Dependencies
  position_id UUID REFERENCES mod_hr.positions(id),
  department_id UUID REFERENCES mod_hr.departments(id),
  
  -- Order
  order_index INTEGER DEFAULT 0,
  due_days_after_hire INTEGER,
  
  -- Type
  task_type TEXT DEFAULT 'checkbox' CHECK (task_type IN (
    'checkbox', 'document_upload', 'document_sign', 'form', 'training'
  )),
  
  -- Content
  content_url TEXT,
  form_fields JSONB,
  
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Onboarding Progress
CREATE TABLE mod_hr.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES mod_hr.employees(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES mod_hr.onboarding_tasks(id),
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'skipped'
  )),
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  
  -- Response data
  response_data JSONB,
  document_url TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, task_id)
);

-- Team Announcements
CREATE TABLE mod_hr.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Targeting
  target_all BOOLEAN DEFAULT true,
  target_departments UUID[],
  target_positions UUID[],
  target_employees UUID[],
  
  -- Settings
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  requires_acknowledgment BOOLEAN DEFAULT false,
  
  -- Scheduling
  publish_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  acknowledged_by UUID[],
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability Preferences
CREATE TABLE mod_hr.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES mod_hr.employees(id) ON DELETE CASCADE,
  
  -- Day
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  
  -- Preference
  preference TEXT DEFAULT 'available' CHECK (preference IN (
    'available', 'preferred', 'unavailable'
  )),
  
  notes TEXT,
  
  -- Effective dates
  effective_from DATE,
  effective_until DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hr_employees_site ON mod_hr.employees(site_id, status);
CREATE INDEX idx_hr_employees_department ON mod_hr.employees(department_id);
CREATE INDEX idx_hr_shifts_employee ON mod_hr.shifts(employee_id, start_time);
CREATE INDEX idx_hr_shifts_date ON mod_hr.shifts(start_time, end_time);
CREATE INDEX idx_hr_time_entries_employee ON mod_hr.time_entries(employee_id, clock_in DESC);
CREATE INDEX idx_hr_leave_requests_employee ON mod_hr.leave_requests(employee_id, status);
CREATE INDEX idx_hr_availability_employee ON mod_hr.availability(employee_id, day_of_week);

-- Enable RLS
ALTER TABLE mod_hr.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_hr.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_hr.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_hr.leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON mod_hr.employees
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_hr.shifts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_hr.time_entries
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Time Tracking Service (2.5 hours)

```typescript
// src/modules/hr/services/time-tracking-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TimeEntry {
  id: string;
  employee_id: string;
  shift_id?: string;
  clock_in: string;
  clock_out?: string;
  regular_hours?: number;
  overtime_hours?: number;
  break_minutes: number;
  status: string;
}

export interface ClockInData {
  employee_id: string;
  shift_id?: string;
  location_id?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export class TimeTrackingService {
  /**
   * Clock in an employee
   */
  async clockIn(
    siteId: string,
    tenantId: string,
    data: ClockInData
  ): Promise<TimeEntry> {
    // Check if already clocked in
    const { data: existing } = await supabase
      .from('mod_hr.time_entries')
      .select('id')
      .eq('employee_id', data.employee_id)
      .is('clock_out', null)
      .eq('status', 'active')
      .single();

    if (existing) {
      throw new Error('Employee is already clocked in');
    }

    // Validate geofence if location specified
    if (data.location_id && data.latitude && data.longitude) {
      const isValid = await this.validateGeofence(
        data.location_id,
        data.latitude,
        data.longitude
      );
      if (!isValid) {
        throw new Error('Location is outside the allowed geofence');
      }
    }

    const { data: entry, error } = await supabase
      .from('mod_hr.time_entries')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        employee_id: data.employee_id,
        shift_id: data.shift_id,
        clock_in: new Date().toISOString(),
        clock_in_location_id: data.location_id,
        clock_in_latitude: data.latitude,
        clock_in_longitude: data.longitude,
        notes: data.notes,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Update shift status if linked
    if (data.shift_id) {
      await supabase
        .from('mod_hr.shifts')
        .update({ status: 'in_progress' })
        .eq('id', data.shift_id);
    }

    return entry;
  }

  /**
   * Clock out an employee
   */
  async clockOut(
    entryId: string,
    location?: { latitude: number; longitude: number }
  ): Promise<TimeEntry> {
    const { data: entry } = await supabase
      .from('mod_hr.time_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (!entry) throw new Error('Time entry not found');
    if (entry.clock_out) throw new Error('Already clocked out');

    const clockOut = new Date();
    const clockIn = new Date(entry.clock_in);
    
    // Calculate hours
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    const netMinutes = totalMinutes - (entry.break_minutes || 0);
    
    // Standard work day is 8 hours
    const regularMinutes = Math.min(netMinutes, 8 * 60);
    const overtimeMinutes = Math.max(0, netMinutes - 8 * 60);

    const { data: updated, error } = await supabase
      .from('mod_hr.time_entries')
      .update({
        clock_out: clockOut.toISOString(),
        clock_out_latitude: location?.latitude,
        clock_out_longitude: location?.longitude,
        regular_hours: regularMinutes / 60,
        overtime_hours: overtimeMinutes / 60,
        status: 'completed'
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    // Update shift status if linked
    if (entry.shift_id) {
      await supabase
        .from('mod_hr.shifts')
        .update({ status: 'completed' })
        .eq('id', entry.shift_id);
    }

    return updated;
  }

  /**
   * Start a break
   */
  async startBreak(
    entryId: string,
    breakType: 'paid' | 'unpaid' = 'unpaid'
  ): Promise<void> {
    // Check for active break
    const { data: existing } = await supabase
      .from('mod_hr.breaks')
      .select('id')
      .eq('time_entry_id', entryId)
      .is('break_end', null)
      .single();

    if (existing) {
      throw new Error('Already on break');
    }

    await supabase.from('mod_hr.breaks').insert({
      time_entry_id: entryId,
      break_start: new Date().toISOString(),
      break_type: breakType
    });
  }

  /**
   * End a break
   */
  async endBreak(entryId: string): Promise<void> {
    const { data: activeBreak } = await supabase
      .from('mod_hr.breaks')
      .select('id, break_start, break_type')
      .eq('time_entry_id', entryId)
      .is('break_end', null)
      .single();

    if (!activeBreak) {
      throw new Error('No active break found');
    }

    const breakEnd = new Date();
    await supabase
      .from('mod_hr.breaks')
      .update({ break_end: breakEnd.toISOString() })
      .eq('id', activeBreak.id);

    // Update total break minutes on time entry (for unpaid breaks)
    if (activeBreak.break_type === 'unpaid') {
      const breakMinutes = Math.round(
        (breakEnd.getTime() - new Date(activeBreak.break_start).getTime()) / (1000 * 60)
      );

      await supabase.rpc('increment_break_minutes', {
        entry_id: entryId,
        minutes: breakMinutes
      });
    }
  }

  /**
   * Get current status for employee
   */
  async getEmployeeStatus(employeeId: string): Promise<{
    isClockedIn: boolean;
    isOnBreak: boolean;
    currentEntry?: TimeEntry;
    todayHours: number;
    weekHours: number;
  }> {
    // Get active time entry
    const { data: activeEntry } = await supabase
      .from('mod_hr.time_entries')
      .select('*, breaks:mod_hr.breaks(*)')
      .eq('employee_id', employeeId)
      .is('clock_out', null)
      .eq('status', 'active')
      .single();

    const isClockedIn = !!activeEntry;
    const isOnBreak = activeEntry?.breaks?.some((b: { break_end: string | null }) => !b.break_end) || false;

    // Get today's hours
    const today = new Date().toISOString().split('T')[0];
    const { data: todayEntries } = await supabase
      .from('mod_hr.time_entries')
      .select('regular_hours, overtime_hours')
      .eq('employee_id', employeeId)
      .gte('clock_in', `${today}T00:00:00`)
      .eq('status', 'completed');

    const todayHours = (todayEntries || []).reduce(
      (sum, e) => sum + (e.regular_hours || 0) + (e.overtime_hours || 0),
      0
    );

    // Get this week's hours
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const { data: weekEntries } = await supabase
      .from('mod_hr.time_entries')
      .select('regular_hours, overtime_hours')
      .eq('employee_id', employeeId)
      .gte('clock_in', `${weekStartStr}T00:00:00`)
      .eq('status', 'completed');

    const weekHours = (weekEntries || []).reduce(
      (sum, e) => sum + (e.regular_hours || 0) + (e.overtime_hours || 0),
      0
    );

    return {
      isClockedIn,
      isOnBreak,
      currentEntry: activeEntry,
      todayHours,
      weekHours
    };
  }

  /**
   * Get timesheet for period
   */
  async getTimesheet(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    entries: TimeEntry[];
    summary: {
      totalHours: number;
      regularHours: number;
      overtimeHours: number;
      breakMinutes: number;
      daysWorked: number;
    };
  }> {
    const { data: entries } = await supabase
      .from('mod_hr.time_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('clock_in', `${startDate}T00:00:00`)
      .lte('clock_in', `${endDate}T23:59:59`)
      .order('clock_in', { ascending: true });

    const summary = {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      breakMinutes: 0,
      daysWorked: new Set<string>()
    };

    (entries || []).forEach(e => {
      summary.regularHours += e.regular_hours || 0;
      summary.overtimeHours += e.overtime_hours || 0;
      summary.breakMinutes += e.break_minutes || 0;
      summary.daysWorked.add(e.clock_in.split('T')[0]);
    });

    summary.totalHours = summary.regularHours + summary.overtimeHours;

    return {
      entries: entries || [],
      summary: {
        ...summary,
        daysWorked: summary.daysWorked.size
      }
    };
  }

  /**
   * Edit time entry (manager action)
   */
  async editTimeEntry(
    entryId: string,
    editorId: string,
    updates: {
      clock_in?: string;
      clock_out?: string;
      reason: string;
    }
  ): Promise<TimeEntry> {
    const { data: original } = await supabase
      .from('mod_hr.time_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (!original) throw new Error('Time entry not found');

    // Calculate new hours if both times present
    let regularHours = original.regular_hours;
    let overtimeHours = original.overtime_hours;

    const clockIn = updates.clock_in ? new Date(updates.clock_in) : new Date(original.clock_in);
    const clockOut = updates.clock_out 
      ? new Date(updates.clock_out) 
      : original.clock_out 
        ? new Date(original.clock_out)
        : null;

    if (clockOut) {
      const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
      const netMinutes = totalMinutes - (original.break_minutes || 0);
      regularHours = Math.min(netMinutes, 8 * 60) / 60;
      overtimeHours = Math.max(0, netMinutes - 8 * 60) / 60;
    }

    const { data: updated, error } = await supabase
      .from('mod_hr.time_entries')
      .update({
        clock_in: updates.clock_in || original.clock_in,
        clock_out: updates.clock_out || original.clock_out,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        status: 'edited',
        edited_by: editorId,
        edit_reason: updates.reason,
        original_clock_in: original.original_clock_in || original.clock_in,
        original_clock_out: original.original_clock_out || original.clock_out
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    return updated;
  }

  /**
   * Validate geofence location
   */
  private async validateGeofence(
    locationId: string,
    latitude: number,
    longitude: number
  ): Promise<boolean> {
    const { data: location } = await supabase
      .from('mod_hr.locations')
      .select('latitude, longitude, geofence_radius_meters')
      .eq('id', locationId)
      .single();

    if (!location || !location.latitude || !location.longitude) {
      return true; // No geofence set
    }

    // Calculate distance using Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (location.latitude * Math.PI) / 180;
    const φ2 = (latitude * Math.PI) / 180;
    const Δφ = ((latitude - location.latitude) * Math.PI) / 180;
    const Δλ = ((longitude - location.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    return distance <= (location.geofence_radius_meters || 100);
  }
}
```

---

### Task 3: Scheduling Service (2.5 hours)

```typescript
// src/modules/hr/services/scheduling-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Shift {
  id: string;
  employee_id?: string;
  position_id?: string;
  department_id?: string;
  location_id?: string;
  start_time: string;
  end_time: string;
  status: string;
  is_open: boolean;
}

export interface ShiftConflict {
  type: 'overlap' | 'overtime' | 'unavailable' | 'skill_mismatch';
  message: string;
  shift_id?: string;
}

export class SchedulingService {
  /**
   * Create a shift
   */
  async createShift(
    siteId: string,
    tenantId: string,
    userId: string,
    shift: {
      employee_id?: string;
      position_id?: string;
      department_id?: string;
      location_id?: string;
      start_time: string;
      end_time: string;
      break_duration_minutes?: number;
      notes?: string;
      is_open?: boolean;
    }
  ): Promise<{ shift: Shift; conflicts: ShiftConflict[] }> {
    const conflicts: ShiftConflict[] = [];

    // Check for conflicts if employee assigned
    if (shift.employee_id) {
      const employeeConflicts = await this.checkConflicts(
        shift.employee_id,
        shift.start_time,
        shift.end_time
      );
      conflicts.push(...employeeConflicts);
    }

    const { data, error } = await supabase
      .from('mod_hr.shifts')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        employee_id: shift.employee_id,
        position_id: shift.position_id,
        department_id: shift.department_id,
        location_id: shift.location_id,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_duration_minutes: shift.break_duration_minutes || 0,
        notes: shift.notes,
        is_open: shift.is_open || !shift.employee_id,
        status: 'scheduled',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return { shift: data, conflicts };
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(
    employeeId: string,
    startTime: string,
    endTime: string,
    excludeShiftId?: string
  ): Promise<ShiftConflict[]> {
    const conflicts: ShiftConflict[] = [];

    // Check for overlapping shifts
    let query = supabase
      .from('mod_hr.shifts')
      .select('id, start_time, end_time')
      .eq('employee_id', employeeId)
      .neq('status', 'cancelled')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (excludeShiftId) {
      query = query.neq('id', excludeShiftId);
    }

    const { data: overlapping } = await query;

    overlapping?.forEach(s => {
      conflicts.push({
        type: 'overlap',
        message: `Overlaps with existing shift`,
        shift_id: s.id
      });
    });

    // Check availability
    const shiftStart = new Date(startTime);
    const dayOfWeek = shiftStart.getDay();
    const shiftStartTime = shiftStart.toTimeString().slice(0, 5);
    const shiftEndTime = new Date(endTime).toTimeString().slice(0, 5);

    const { data: availability } = await supabase
      .from('mod_hr.availability')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (availability) {
      if (!availability.is_available) {
        conflicts.push({
          type: 'unavailable',
          message: `Employee is marked as unavailable on this day`
        });
      } else if (availability.start_time && availability.end_time) {
        if (shiftStartTime < availability.start_time || shiftEndTime > availability.end_time) {
          conflicts.push({
            type: 'unavailable',
            message: `Shift is outside employee's available hours (${availability.start_time} - ${availability.end_time})`
          });
        }
      }
    }

    // Check for overtime (>40 hours/week)
    const weekStart = new Date(shiftStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const { data: weekShifts } = await supabase
      .from('mod_hr.shifts')
      .select('start_time, end_time')
      .eq('employee_id', employeeId)
      .neq('status', 'cancelled')
      .gte('start_time', weekStart.toISOString())
      .lte('end_time', weekEnd.toISOString());

    const newShiftHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    const existingHours = (weekShifts || []).reduce((sum, s) => {
      return sum + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / (1000 * 60 * 60);
    }, 0);

    if (existingHours + newShiftHours > 40) {
      conflicts.push({
        type: 'overtime',
        message: `This shift would result in ${(existingHours + newShiftHours).toFixed(1)} hours for the week (overtime)`
      });
    }

    return conflicts;
  }

  /**
   * Assign employee to open shift
   */
  async assignShift(
    shiftId: string,
    employeeId: string
  ): Promise<Shift> {
    const { data: shift } = await supabase
      .from('mod_hr.shifts')
      .select('*')
      .eq('id', shiftId)
      .single();

    if (!shift) throw new Error('Shift not found');
    if (!shift.is_open) throw new Error('Shift is not open');
    if (shift.employee_id) throw new Error('Shift is already assigned');

    // Check for conflicts
    const conflicts = await this.checkConflicts(
      employeeId,
      shift.start_time,
      shift.end_time
    );

    if (conflicts.some(c => c.type === 'overlap')) {
      throw new Error('Employee has conflicting shifts');
    }

    const { data, error } = await supabase
      .from('mod_hr.shifts')
      .update({
        employee_id: employeeId,
        is_open: false
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Request shift swap
   */
  async requestSwap(
    siteId: string,
    tenantId: string,
    shiftId: string,
    requesterId: string,
    swapType: 'swap' | 'drop' | 'pickup',
    targetShiftId?: string,
    targetEmployeeId?: string,
    reason?: string
  ): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('mod_hr.shift_swaps')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        shift_id: shiftId,
        requester_id: requesterId,
        swap_type: swapType,
        target_shift_id: targetShiftId,
        target_employee_id: targetEmployeeId,
        reason
      })
      .select('id')
      .single();

    if (error) throw error;

    return { id: data.id };
  }

  /**
   * Approve shift swap
   */
  async approveSwap(
    swapId: string,
    approverId: string,
    response?: string
  ): Promise<void> {
    const { data: swap } = await supabase
      .from('mod_hr.shift_swaps')
      .select(`
        *,
        shift:mod_hr.shifts(*)
      `)
      .eq('id', swapId)
      .single();

    if (!swap) throw new Error('Swap request not found');

    // Perform the swap
    if (swap.swap_type === 'swap' && swap.target_shift_id) {
      // Swap employee assignments
      const { data: targetShift } = await supabase
        .from('mod_hr.shifts')
        .select('employee_id')
        .eq('id', swap.target_shift_id)
        .single();

      await supabase
        .from('mod_hr.shifts')
        .update({ employee_id: targetShift?.employee_id })
        .eq('id', swap.shift_id);

      await supabase
        .from('mod_hr.shifts')
        .update({ employee_id: swap.requester_id })
        .eq('id', swap.target_shift_id);

    } else if (swap.swap_type === 'drop') {
      // Mark shift as open
      await supabase
        .from('mod_hr.shifts')
        .update({ employee_id: null, is_open: true })
        .eq('id', swap.shift_id);

    } else if (swap.swap_type === 'pickup' && swap.target_employee_id) {
      // Assign to target employee
      await supabase
        .from('mod_hr.shifts')
        .update({ employee_id: swap.target_employee_id, is_open: false })
        .eq('id', swap.shift_id);
    }

    // Update swap request
    await supabase
      .from('mod_hr.shift_swaps')
      .update({
        status: 'approved',
        manager_response: response,
        responded_by: approverId,
        responded_at: new Date().toISOString()
      })
      .eq('id', swapId);
  }

  /**
   * Get schedule for date range
   */
  async getSchedule(
    siteId: string,
    startDate: string,
    endDate: string,
    filters?: {
      department_id?: string;
      location_id?: string;
      employee_id?: string;
    }
  ): Promise<Shift[]> {
    let query = supabase
      .from('mod_hr.shifts')
      .select(`
        *,
        employee:mod_hr.employees(id, first_name, last_name, avatar_url),
        position:mod_hr.positions(title),
        location:mod_hr.locations(name)
      `)
      .eq('site_id', siteId)
      .neq('status', 'cancelled')
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('end_time', `${endDate}T23:59:59`);

    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }
    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }

    const { data, error } = await query.order('start_time');

    if (error) throw error;

    return data || [];
  }

  /**
   * Publish schedule (notify employees)
   */
  async publishSchedule(
    siteId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    // Update all scheduled shifts to published
    await supabase
      .from('mod_hr.shifts')
      .update({ status: 'published' })
      .eq('site_id', siteId)
      .eq('status', 'scheduled')
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('end_time', `${endDate}T23:59:59`);

    // Get affected employees
    const { data: shifts } = await supabase
      .from('mod_hr.shifts')
      .select('employee_id')
      .eq('site_id', siteId)
      .eq('status', 'published')
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('end_time', `${endDate}T23:59:59`)
      .not('employee_id', 'is', null);

    const employeeIds = [...new Set(shifts?.map(s => s.employee_id))];

    // Send notifications (implement via notification service)
    // await notificationService.notifySchedulePublished(employeeIds, startDate, endDate);
  }

  /**
   * Auto-fill open shifts
   */
  async autoFillOpenShifts(siteId: string): Promise<{
    filled: number;
    unfilled: number;
  }> {
    // Get open shifts
    const { data: openShifts } = await supabase
      .from('mod_hr.shifts')
      .select(`
        *,
        position:mod_hr.positions(id, required_skills:mod_hr.employee_skills(skill_name))
      `)
      .eq('site_id', siteId)
      .eq('is_open', true)
      .eq('status', 'scheduled');

    let filled = 0;
    let unfilled = 0;

    for (const shift of openShifts || []) {
      // Find available employees
      const { data: availableEmployees } = await supabase
        .from('mod_hr.employees')
        .select(`
          id,
          availability:mod_hr.availability(*),
          skills:mod_hr.employee_skills(skill_name)
        `)
        .eq('site_id', siteId)
        .eq('status', 'active')
        .eq('position_id', shift.position_id);

      let assigned = false;

      for (const employee of availableEmployees || []) {
        // Check conflicts
        const conflicts = await this.checkConflicts(
          employee.id,
          shift.start_time,
          shift.end_time
        );

        if (conflicts.length === 0) {
          await this.assignShift(shift.id, employee.id);
          assigned = true;
          filled++;
          break;
        }
      }

      if (!assigned) {
        unfilled++;
      }
    }

    return { filled, unfilled };
  }
}
```

---

### Task 4: Leave Management Service (2 hours)

```typescript
// src/modules/hr/services/leave-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  status: string;
  reason?: string;
}

export interface LeaveBalance {
  leave_type: string;
  accrued: number;
  used: number;
  pending: number;
  available: number;
}

export class LeaveService {
  /**
   * Request leave
   */
  async requestLeave(
    siteId: string,
    tenantId: string,
    employeeId: string,
    request: {
      leave_type_id: string;
      start_date: string;
      end_date: string;
      is_half_day?: boolean;
      half_day_period?: 'morning' | 'afternoon';
      reason?: string;
    }
  ): Promise<LeaveRequest> {
    // Get leave type
    const { data: leaveType } = await supabase
      .from('mod_hr.leave_types')
      .select('*')
      .eq('id', request.leave_type_id)
      .single();

    if (!leaveType) throw new Error('Leave type not found');

    // Calculate total hours
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    let days = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
        days++;
      }
    }

    const totalHours = request.is_half_day ? 4 : days * 8;

    // Check balance
    const year = startDate.getFullYear();
    const balance = await this.getBalance(employeeId, request.leave_type_id, year);

    if (balance.available < totalHours) {
      throw new Error(`Insufficient leave balance. Available: ${balance.available} hours`);
    }

    // Check minimum notice
    if (leaveType.min_notice_days > 0) {
      const today = new Date();
      const noticeDays = Math.floor(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (noticeDays < leaveType.min_notice_days) {
        throw new Error(`Minimum ${leaveType.min_notice_days} days notice required`);
      }
    }

    // Check for overlapping requests
    const { data: overlapping } = await supabase
      .from('mod_hr.leave_requests')
      .select('id')
      .eq('employee_id', employeeId)
      .neq('status', 'rejected')
      .neq('status', 'cancelled')
      .or(`start_date.lte.${request.end_date},end_date.gte.${request.start_date}`);

    if (overlapping && overlapping.length > 0) {
      throw new Error('You have overlapping leave requests');
    }

    // Create request
    const { data, error } = await supabase
      .from('mod_hr.leave_requests')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        employee_id: employeeId,
        leave_type_id: request.leave_type_id,
        start_date: request.start_date,
        end_date: request.end_date,
        is_half_day: request.is_half_day,
        half_day_period: request.half_day_period,
        total_hours: totalHours,
        reason: request.reason,
        status: leaveType.requires_approval ? 'pending' : 'approved'
      })
      .select()
      .single();

    if (error) throw error;

    // Update pending balance
    await supabase.rpc('update_leave_balance', {
      p_employee_id: employeeId,
      p_leave_type_id: request.leave_type_id,
      p_year: year,
      p_pending_delta: totalHours
    });

    return data;
  }

  /**
   * Approve leave request
   */
  async approveLeave(
    requestId: string,
    approverId: string,
    notes?: string
  ): Promise<void> {
    const { data: request } = await supabase
      .from('mod_hr.leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) throw new Error('Leave request not found');
    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    // Update request
    await supabase
      .from('mod_hr.leave_requests')
      .update({
        status: 'approved',
        manager_notes: notes,
        responded_by: approverId,
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // Move from pending to used
    const year = new Date(request.start_date).getFullYear();
    await supabase.rpc('approve_leave_balance', {
      p_employee_id: request.employee_id,
      p_leave_type_id: request.leave_type_id,
      p_year: year,
      p_hours: request.total_hours
    });

    // Block affected shifts
    await this.blockShiftsDuringLeave(
      request.employee_id,
      request.start_date,
      request.end_date
    );
  }

  /**
   * Reject leave request
   */
  async rejectLeave(
    requestId: string,
    approverId: string,
    notes: string
  ): Promise<void> {
    const { data: request } = await supabase
      .from('mod_hr.leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) throw new Error('Leave request not found');

    // Update request
    await supabase
      .from('mod_hr.leave_requests')
      .update({
        status: 'rejected',
        manager_notes: notes,
        responded_by: approverId,
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // Restore pending balance
    const year = new Date(request.start_date).getFullYear();
    await supabase.rpc('update_leave_balance', {
      p_employee_id: request.employee_id,
      p_leave_type_id: request.leave_type_id,
      p_year: year,
      p_pending_delta: -request.total_hours
    });
  }

  /**
   * Get leave balance for employee
   */
  async getBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number
  ): Promise<LeaveBalance> {
    const { data } = await supabase
      .from('mod_hr.leave_balances')
      .select(`
        *,
        leave_type:mod_hr.leave_types(name)
      `)
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', year)
      .single();

    if (!data) {
      // Initialize balance
      const { data: leaveType } = await supabase
        .from('mod_hr.leave_types')
        .select('name, accrual_type, accrual_amount')
        .eq('id', leaveTypeId)
        .single();

      const initialAccrual = leaveType?.accrual_type === 'yearly' 
        ? (leaveType.accrual_amount || 0) 
        : 0;

      await supabase.from('mod_hr.leave_balances').insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year,
        accrued: initialAccrual
      });

      return {
        leave_type: leaveType?.name || '',
        accrued: initialAccrual,
        used: 0,
        pending: 0,
        available: initialAccrual
      };
    }

    return {
      leave_type: data.leave_type?.name || '',
      accrued: data.accrued,
      used: data.used,
      pending: data.pending,
      available: data.available
    };
  }

  /**
   * Get all balances for employee
   */
  async getAllBalances(
    employeeId: string,
    year: number
  ): Promise<LeaveBalance[]> {
    // Get all leave types for the site
    const { data: employee } = await supabase
      .from('mod_hr.employees')
      .select('site_id')
      .eq('id', employeeId)
      .single();

    if (!employee) throw new Error('Employee not found');

    const { data: leaveTypes } = await supabase
      .from('mod_hr.leave_types')
      .select('id, name')
      .eq('site_id', employee.site_id)
      .eq('is_active', true);

    const balances: LeaveBalance[] = [];

    for (const lt of leaveTypes || []) {
      const balance = await this.getBalance(employeeId, lt.id, year);
      balances.push(balance);
    }

    return balances;
  }

  /**
   * Process leave accruals
   */
  async processAccruals(): Promise<void> {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get all active employees and their leave types
    const { data: employees } = await supabase
      .from('mod_hr.employees')
      .select(`
        id,
        site_id,
        site:sites(id)
      `)
      .eq('status', 'active');

    for (const employee of employees || []) {
      const { data: leaveTypes } = await supabase
        .from('mod_hr.leave_types')
        .select('*')
        .eq('site_id', employee.site_id)
        .eq('is_active', true)
        .eq('accrual_type', 'monthly');

      for (const lt of leaveTypes || []) {
        await supabase.rpc('accrue_leave', {
          p_employee_id: employee.id,
          p_leave_type_id: lt.id,
          p_year: currentYear,
          p_amount: lt.accrual_amount || 0,
          p_max: lt.max_accrual
        });
      }
    }
  }

  /**
   * Block shifts during approved leave
   */
  private async blockShiftsDuringLeave(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    // Cancel or unassign shifts during leave period
    await supabase
      .from('mod_hr.shifts')
      .update({
        employee_id: null,
        is_open: true,
        notes: 'Employee on approved leave'
      })
      .eq('employee_id', employeeId)
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('end_time', `${endDate}T23:59:59`)
      .in('status', ['scheduled', 'published']);
  }
}
```

---

### Task 5: Team Dashboard UI (2 hours)

```tsx
// src/modules/hr/components/TeamDashboard.tsx

'use client';

import { useState } from 'react';
import {
  Users,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  UserPlus,
  TrendingUp
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';
import { WeeklySchedule } from './WeeklySchedule';
import { TimeClock } from './TimeClock';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  position?: { title: string };
  department?: { name: string };
  status: string;
}

interface DashboardStats {
  totalEmployees: number;
  clockedIn: number;
  onLeave: number;
  pendingRequests: number;
  openShifts: number;
  todayScheduled: number;
}

interface TeamDashboardProps {
  employees: Employee[];
  stats: DashboardStats;
  currentUser: { id: string; role: string };
  onClockIn: () => Promise<void>;
  onClockOut: () => Promise<void>;
}

export function TeamDashboard({
  employees,
  stats,
  currentUser,
  onClockIn,
  onClockOut
}: TeamDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your team's schedule, time, and leave
          </p>
        </div>
        {isManager && (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Total Team</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.clockedIn}</p>
                <p className="text-xs text-muted-foreground">Clocked In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.onLeave}</p>
                <p className="text-xs text-muted-foreground">On Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.openShifts}</p>
                <p className="text-xs text-muted-foreground">Open Shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayScheduled}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Clock Widget (for non-managers) */}
      {!isManager && (
        <TimeClock
          employeeId={currentUser.id}
          onClockIn={onClockIn}
          onClockOut={onClockOut}
        />
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheets</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          {isManager && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees.slice(0, 5).map(emp => (
                    <div key={emp.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="" />
                        ) : (
                          <div className="bg-primary text-white flex items-center justify-center w-full h-full text-xs">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {emp.position?.title}
                        </p>
                      </div>
                      <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                        9:00 - 5:00
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Requests */}
            {isManager && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <Calendar className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">Leave Request</p>
                          <p className="text-sm text-muted-foreground">
                            John Doe - Dec 20-22
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Reject</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Shift Swap</p>
                          <p className="text-sm text-muted-foreground">
                            Jane Smith ↔ Mike Johnson
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Reject</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <WeeklySchedule
            isManager={isManager}
            employees={employees}
          />
        </TabsContent>

        <TabsContent value="timesheet" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Timesheet content */}
              <p className="text-muted-foreground">Timesheet view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leave Management</CardTitle>
              <Button>Request Leave</Button>
            </CardHeader>
            <CardContent>
              {/* Leave balances and requests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Annual Leave</p>
                  <p className="text-2xl font-bold">80 / 120 hrs</p>
                  <Progress value={66} className="mt-2" />
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Sick Leave</p>
                  <p className="text-2xl font-bold">32 / 40 hrs</p>
                  <Progress value={80} className="mt-2" />
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Personal</p>
                  <p className="text-2xl font-bold">16 / 24 hrs</p>
                  <Progress value={66} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isManager && (
          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map(emp => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          {emp.avatar_url ? (
                            <img src={emp.avatar_url} alt="" />
                          ) : (
                            <div className="bg-primary text-white flex items-center justify-center w-full h-full">
                              {emp.first_name[0]}{emp.last_name[0]}
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {emp.position?.title} • {emp.department?.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        emp.status === 'active' ? 'default' :
                        emp.status === 'on_leave' ? 'secondary' : 'outline'
                      }>
                        {emp.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Employee profiles create
- [ ] Clock in/out works
- [ ] Geofencing validates
- [ ] Breaks track correctly
- [ ] Shifts schedule properly
- [ ] Conflicts detect
- [ ] Shift swaps process
- [ ] Leave requests flow
- [ ] Accruals calculate
- [ ] Reports generate

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-12
- **Required by**: Payroll, workforce analytics
- **External**: Geolocation API, notification service
