# Phase EM-64: Gym & Fitness Management Module

> **Priority**: 🟡 MEDIUM (Industry Vertical)
> **Estimated Time**: 28-32 hours
> **Prerequisites**: EM-01, EM-11, EM-51 (Booking)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **gym and fitness management system** (similar to Mindbody/Zen Planner):
1. Member management with access control
2. Class scheduling and bookings
3. Trainer/instructor management
4. Workout/exercise tracking
5. Membership plans & billing
6. Check-in/attendance system

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   GYM/FITNESS MODULE                                 │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   MEMBERS       │   SCHEDULING    │     WORKOUTS                    │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Profiles        │ Classes         │ Programs                        │
│ Memberships     │ Trainers        │ Exercises                       │
│ Check-in        │ Bookings        │ Tracking                        │
│ Access Control  │ Waitlists       │ Progress                        │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (2 hours)

```sql
-- migrations/em-64-gym-fitness-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}

-- Membership Types
CREATE TABLE mod_gym.membership_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Duration
  duration_type TEXT CHECK (duration_type IN (
    'unlimited', 'days', 'months', 'visits', 'classes'
  )),
  duration_value INTEGER,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  setup_fee DECIMAL(10,2) DEFAULT 0,
  billing_frequency TEXT CHECK (billing_frequency IN (
    'one_time', 'weekly', 'monthly', 'yearly'
  )),
  
  -- Limits
  classes_per_month INTEGER,
  guest_passes_per_month INTEGER DEFAULT 0,
  
  -- Access
  access_all_locations BOOLEAN DEFAULT true,
  allowed_locations UUID[],
  access_hours TEXT, -- 'all' or '6am-6pm' etc
  
  -- Benefits
  benefits TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members
CREATE TABLE mod_gym.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- User link
  user_id UUID,
  
  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Address
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Emergency Contact
  emergency_name TEXT,
  emergency_phone TEXT,
  emergency_relationship TEXT,
  
  -- Photo
  photo_url TEXT,
  
  -- Member Card
  member_number TEXT UNIQUE,
  barcode TEXT,
  rfid_tag TEXT,
  
  -- Fitness Profile
  fitness_goals TEXT[],
  experience_level TEXT CHECK (experience_level IN (
    'beginner', 'intermediate', 'advanced'
  )),
  health_conditions TEXT[],
  
  -- Waiver
  waiver_signed BOOLEAN DEFAULT false,
  waiver_signed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'pending', 'active', 'frozen', 'cancelled', 'expired'
  )),
  
  -- Dates
  join_date DATE DEFAULT CURRENT_DATE,
  freeze_start DATE,
  freeze_end DATE,
  cancellation_date DATE,
  
  -- Referral
  referred_by UUID REFERENCES mod_gym.members(id),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Memberships
CREATE TABLE mod_gym.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  member_id UUID NOT NULL REFERENCES mod_gym.members(id),
  membership_type_id UUID NOT NULL REFERENCES mod_gym.membership_types(id),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'frozen', 'cancelled', 'expired'
  )),
  
  -- Payment
  payment_method_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Remaining
  remaining_visits INTEGER,
  remaining_classes INTEGER,
  
  -- Freeze
  freeze_credits_remaining INTEGER DEFAULT 0,
  
  -- Pricing (at time of signup)
  price DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainers/Instructors
CREATE TABLE mod_gym.trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  user_id UUID,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  photo_url TEXT,
  bio TEXT,
  
  -- Specializations
  specializations TEXT[],
  certifications TEXT[],
  
  -- Schedule
  availability JSONB, -- {"monday": [{"start": "09:00", "end": "17:00"}]}
  
  -- Rates
  hourly_rate DECIMAL(10,2),
  session_rate DECIMAL(10,2),
  
  -- Commission
  commission_percentage DECIMAL(5,2),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainer Schedules/Availability
CREATE TABLE mod_gym.trainer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES mod_gym.trainers(id),
  
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  is_available BOOLEAN DEFAULT true,
  
  UNIQUE(trainer_id, date, start_time)
);

-- Class Types
CREATE TABLE mod_gym.class_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Settings
  duration_minutes INTEGER DEFAULT 60,
  max_capacity INTEGER,
  
  -- Difficulty
  difficulty_level TEXT CHECK (difficulty_level IN (
    'all_levels', 'beginner', 'intermediate', 'advanced'
  )),
  
  -- Requirements
  requires_equipment TEXT[],
  
  -- Pricing
  drop_in_price DECIMAL(10,2),
  is_included_in_membership BOOLEAN DEFAULT true,
  
  -- Category
  category TEXT CHECK (category IN (
    'cardio', 'strength', 'hiit', 'yoga', 'pilates', 'dance',
    'cycling', 'swimming', 'martial_arts', 'mind_body', 'other'
  )),
  
  color TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class Schedule
CREATE TABLE mod_gym.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  class_type_id UUID NOT NULL REFERENCES mod_gym.class_types(id),
  trainer_id UUID REFERENCES mod_gym.trainers(id),
  
  -- Location
  room TEXT,
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format
  series_id UUID,
  
  -- Capacity
  max_capacity INTEGER,
  current_enrollment INTEGER DEFAULT 0,
  
  -- Waitlist
  waitlist_enabled BOOLEAN DEFAULT true,
  waitlist_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'in_progress', 'completed', 'cancelled'
  )),
  cancellation_reason TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class Bookings
CREATE TABLE mod_gym.class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  class_id UUID NOT NULL REFERENCES mod_gym.classes(id),
  member_id UUID NOT NULL REFERENCES mod_gym.members(id),
  
  -- Status
  status TEXT DEFAULT 'booked' CHECK (status IN (
    'booked', 'waitlisted', 'attended', 'no_show', 'cancelled'
  )),
  
  waitlist_position INTEGER,
  
  -- Booking source
  booked_via TEXT CHECK (booked_via IN (
    'web', 'app', 'front_desk', 'api'
  )),
  
  -- Attendance
  checked_in_at TIMESTAMPTZ,
  
  -- Payment
  paid BOOLEAN DEFAULT false,
  amount_paid DECIMAL(10,2),
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  late_cancel BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal Training Sessions
CREATE TABLE mod_gym.pt_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  member_id UUID NOT NULL REFERENCES mod_gym.members(id),
  trainer_id UUID NOT NULL REFERENCES mod_gym.trainers(id),
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Session type
  session_type TEXT CHECK (session_type IN (
    'single', 'package', 'complimentary', 'assessment'
  )),
  
  -- Package reference
  package_id UUID,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'in_progress', 'completed', 
    'no_show', 'cancelled'
  )),
  
  -- Notes
  notes TEXT,
  workout_id UUID,
  
  -- Pricing
  price DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PT Packages
CREATE TABLE mod_gym.pt_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  member_id UUID NOT NULL REFERENCES mod_gym.members(id),
  trainer_id UUID REFERENCES mod_gym.trainers(id),
  
  -- Package details
  total_sessions INTEGER NOT NULL,
  sessions_remaining INTEGER NOT NULL,
  
  -- Pricing
  total_price DECIMAL(10,2),
  
  -- Dates
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'expired', 'refunded'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins
CREATE TABLE mod_gym.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  member_id UUID NOT NULL REFERENCES mod_gym.members(id),
  
  -- Location
  location_id UUID,
  
  -- Time
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  
  -- Method
  check_in_method TEXT CHECK (check_in_method IN (
    'barcode', 'rfid', 'manual', 'app', 'facial'
  )),
  
  -- Staff
  checked_in_by UUID
);

-- Exercises Database
CREATE TABLE mod_gym.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Categorization
  muscle_group TEXT CHECK (muscle_group IN (
    'chest', 'back', 'shoulders', 'arms', 'core', 'legs', 'full_body'
  )),
  secondary_muscles TEXT[],
  
  exercise_type TEXT CHECK (exercise_type IN (
    'strength', 'cardio', 'flexibility', 'balance', 'plyometric'
  )),
  
  equipment_needed TEXT[],
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  
  -- Difficulty
  difficulty TEXT CHECK (difficulty IN (
    'beginner', 'intermediate', 'advanced'
  )),
  
  is_custom BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Templates
CREATE TABLE mod_gym.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Creator
  created_by UUID,
  trainer_id UUID REFERENCES mod_gym.trainers(id),
  
  -- Target
  target_muscle_groups TEXT[],
  workout_type TEXT,
  estimated_duration INTEGER,
  difficulty TEXT,
  
  -- Exercises
  exercises JSONB NOT NULL,
  /*
  [
    {
      "exercise_id": "uuid",
      "sets": 3,
      "reps": "10-12",
      "rest_seconds": 60,
      "notes": "...",
      "superset_with": "uuid"
    }
  ]
  */
  
  is_public BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Workouts (Logged)
CREATE TABLE mod_gym.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  member_id UUID NOT NULL REFERENCES mod_gym.members(id),
  template_id UUID REFERENCES mod_gym.workout_templates(id),
  trainer_id UUID REFERENCES mod_gym.trainers(id),
  
  -- Workout info
  name TEXT,
  date DATE DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  -- Stats
  total_volume DECIMAL(10,2), -- total weight lifted
  calories_burned INTEGER,
  
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Exercises (Logged)
CREATE TABLE mod_gym.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES mod_gym.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES mod_gym.exercises(id),
  
  sort_order INTEGER DEFAULT 0,
  
  -- Performance
  sets_completed INTEGER,
  
  notes TEXT
);

-- Exercise Sets (Logged)
CREATE TABLE mod_gym.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES mod_gym.workout_exercises(id) ON DELETE CASCADE,
  
  set_number INTEGER NOT NULL,
  
  -- Performance
  reps INTEGER,
  weight DECIMAL(10,2),
  weight_unit TEXT DEFAULT 'lbs',
  duration_seconds INTEGER, -- for timed exercises
  distance DECIMAL(10,2), -- for cardio
  distance_unit TEXT DEFAULT 'miles',
  
  -- Type
  set_type TEXT DEFAULT 'working' CHECK (set_type IN (
    'warmup', 'working', 'dropset', 'failure'
  )),
  
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10), -- Rate of perceived exertion
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Body Measurements
CREATE TABLE mod_gym.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES mod_gym.members(id),
  
  measurement_date DATE DEFAULT CURRENT_DATE,
  
  -- Weight
  weight DECIMAL(5,2),
  weight_unit TEXT DEFAULT 'lbs',
  
  -- Body fat
  body_fat_percentage DECIMAL(4,1),
  
  -- Measurements (inches or cm)
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  thighs DECIMAL(5,2),
  arms DECIMAL(5,2),
  neck DECIMAL(5,2),
  
  measurement_unit TEXT DEFAULT 'inches',
  
  notes TEXT,
  
  -- Photos
  front_photo_url TEXT,
  side_photo_url TEXT,
  back_photo_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gym_members_status ON mod_gym.members(status);
CREATE INDEX idx_gym_members_barcode ON mod_gym.members(barcode);
CREATE INDEX idx_gym_classes_time ON mod_gym.classes(start_time);
CREATE INDEX idx_gym_bookings_class ON mod_gym.class_bookings(class_id);
CREATE INDEX idx_gym_checkins_date ON mod_gym.check_ins(check_in_time);
CREATE INDEX idx_gym_workouts_member ON mod_gym.workouts(member_id, date);

-- Enable RLS
ALTER TABLE mod_gym.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_gym.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_gym.workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON mod_gym.members
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_gym.classes
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Member Service (2 hours)

```typescript
// src/modules/gym/services/member-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  member_number: string;
  status: string;
  photo_url?: string;
  membership?: {
    id: string;
    type: { name: string };
    status: string;
    end_date?: string;
  };
}

export class MemberService {
  /**
   * Create new member
   */
  async createMember(
    siteId: string,
    tenantId: string,
    member: Partial<Member>
  ): Promise<Member> {
    // Generate member number
    const memberNumber = await this.generateMemberNumber(siteId);

    // Generate barcode
    const barcode = `GYM${memberNumber}`;

    const { data, error } = await supabase
      .from('mod_gym.members')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        ...member,
        member_number: memberNumber,
        barcode,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Generate unique member number
   */
  private async generateMemberNumber(siteId: string): Promise<string> {
    const { count } = await supabase
      .from('mod_gym.members')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId);

    const nextNumber = (count || 0) + 1;
    return nextNumber.toString().padStart(6, '0');
  }

  /**
   * Check in member
   */
  async checkIn(
    siteId: string,
    tenantId: string,
    memberId: string,
    method: 'barcode' | 'rfid' | 'manual' | 'app' = 'manual'
  ): Promise<{ success: boolean; message: string; checkIn?: any }> {
    // Get member and validate
    const { data: member } = await supabase
      .from('mod_gym.members')
      .select(`
        *,
        memberships:mod_gym.memberships(
          id, status, end_date, remaining_visits,
          membership_type:mod_gym.membership_types(name, access_hours)
        )
      `)
      .eq('id', memberId)
      .single();

    if (!member) {
      return { success: false, message: 'Member not found' };
    }

    // Check member status
    if (member.status !== 'active') {
      return { success: false, message: `Member status is ${member.status}` };
    }

    // Check active membership
    const activeMembership = member.memberships?.find(
      (m: any) => m.status === 'active'
    );

    if (!activeMembership) {
      return { success: false, message: 'No active membership' };
    }

    // Check if membership expired
    if (activeMembership.end_date && new Date(activeMembership.end_date) < new Date()) {
      // Update membership status
      await supabase
        .from('mod_gym.memberships')
        .update({ status: 'expired' })
        .eq('id', activeMembership.id);
      
      return { success: false, message: 'Membership has expired' };
    }

    // Check access hours
    const accessHours = activeMembership.membership_type?.access_hours;
    if (accessHours && accessHours !== 'all') {
      const now = new Date();
      const currentHour = now.getHours();
      const [startHour, endHour] = accessHours.split('-').map((h: string) => {
        const [hour] = h.replace('am', '').replace('pm', '').split(':');
        let parsed = parseInt(hour);
        if (h.includes('pm') && parsed !== 12) parsed += 12;
        return parsed;
      });

      if (currentHour < startHour || currentHour >= endHour) {
        return {
          success: false,
          message: `Access is only allowed ${accessHours}`
        };
      }
    }

    // Check visit limit
    if (activeMembership.remaining_visits !== null) {
      if (activeMembership.remaining_visits <= 0) {
        return { success: false, message: 'No remaining visits' };
      }

      // Decrement visits
      await supabase
        .from('mod_gym.memberships')
        .update({ remaining_visits: activeMembership.remaining_visits - 1 })
        .eq('id', activeMembership.id);
    }

    // Check if already checked in today (no checkout)
    const today = new Date().toISOString().split('T')[0];
    const { data: existingCheckIn } = await supabase
      .from('mod_gym.check_ins')
      .select('id')
      .eq('member_id', memberId)
      .gte('check_in_time', `${today}T00:00:00`)
      .is('check_out_time', null)
      .single();

    if (existingCheckIn) {
      // Check them out
      await supabase
        .from('mod_gym.check_ins')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', existingCheckIn.id);

      return {
        success: true,
        message: 'Checked out successfully'
      };
    }

    // Create check-in
    const { data: checkIn, error } = await supabase
      .from('mod_gym.check_ins')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        member_id: memberId,
        check_in_method: method
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: `Welcome, ${member.first_name}!`,
      checkIn
    };
  }

  /**
   * Lookup member by barcode/RFID
   */
  async lookupByBarcode(barcode: string): Promise<Member | null> {
    const { data } = await supabase
      .from('mod_gym.members')
      .select(`
        *,
        memberships:mod_gym.memberships(
          id, status,
          membership_type:mod_gym.membership_types(name)
        )
      `)
      .or(`barcode.eq.${barcode},rfid_tag.eq.${barcode}`)
      .single();

    return data;
  }

  /**
   * Get member stats
   */
  async getMemberStats(memberId: string): Promise<{
    totalCheckIns: number;
    classesAttended: number;
    workoutsLogged: number;
    currentStreak: number;
    thisMonthCheckIns: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total check-ins
    const { count: totalCheckIns } = await supabase
      .from('mod_gym.check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId);

    // This month
    const { count: thisMonthCheckIns } = await supabase
      .from('mod_gym.check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .gte('check_in_time', startOfMonth.toISOString());

    // Classes attended
    const { count: classesAttended } = await supabase
      .from('mod_gym.class_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('status', 'attended');

    // Workouts logged
    const { count: workoutsLogged } = await supabase
      .from('mod_gym.workouts')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId);

    // Calculate streak
    const streak = await this.calculateStreak(memberId);

    return {
      totalCheckIns: totalCheckIns || 0,
      classesAttended: classesAttended || 0,
      workoutsLogged: workoutsLogged || 0,
      currentStreak: streak,
      thisMonthCheckIns: thisMonthCheckIns || 0
    };
  }

  /**
   * Calculate workout streak
   */
  private async calculateStreak(memberId: string): Promise<number> {
    const { data: checkIns } = await supabase
      .from('mod_gym.check_ins')
      .select('check_in_time')
      .eq('member_id', memberId)
      .order('check_in_time', { ascending: false })
      .limit(60);

    if (!checkIns?.length) return 0;

    // Get unique dates
    const dates = [...new Set(
      checkIns.map(c => c.check_in_time.split('T')[0])
    )].sort().reverse();

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if visited today or yesterday
    if (dates[0] !== today && dates[0] !== yesterday) {
      return 0;
    }

    // Count consecutive days
    for (let i = 0; i < dates.length; i++) {
      const current = new Date(dates[i]);
      const expected = new Date(dates[0]);
      expected.setDate(expected.getDate() - i);

      if (current.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Freeze membership
   */
  async freezeMembership(
    membershipId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    const { data: membership } = await supabase
      .from('mod_gym.memberships')
      .select('*, membership_type:mod_gym.membership_types(duration_type)')
      .eq('id', membershipId)
      .single();

    if (!membership) throw new Error('Membership not found');

    // Calculate freeze duration and extend end date
    const freezeDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
    );

    let newEndDate = membership.end_date;
    if (membership.end_date) {
      const end = new Date(membership.end_date);
      end.setDate(end.getDate() + freezeDays);
      newEndDate = end.toISOString().split('T')[0];
    }

    // Update membership
    await supabase
      .from('mod_gym.memberships')
      .update({
        status: 'frozen',
        end_date: newEndDate
      })
      .eq('id', membershipId);

    // Update member
    await supabase
      .from('mod_gym.members')
      .update({
        status: 'frozen',
        freeze_start: startDate,
        freeze_end: endDate
      })
      .eq('id', membership.member_id);
  }
}
```

---

### Task 3: Class Booking Service (2 hours)

```typescript
// src/modules/gym/services/class-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ClassSchedule {
  id: string;
  class_type: {
    id: string;
    name: string;
    description: string;
    difficulty_level: string;
    category: string;
    color: string;
  };
  trainer?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
  start_time: string;
  end_time: string;
  room?: string;
  max_capacity: number;
  current_enrollment: number;
  status: string;
}

export class ClassService {
  /**
   * Get class schedule
   */
  async getSchedule(
    siteId: string,
    startDate: string,
    endDate: string,
    filters?: {
      trainerId?: string;
      classTypeId?: string;
      category?: string;
    }
  ): Promise<ClassSchedule[]> {
    let query = supabase
      .from('mod_gym.classes')
      .select(`
        *,
        class_type:mod_gym.class_types(*),
        trainer:mod_gym.trainers(id, first_name, last_name, photo_url)
      `)
      .eq('site_id', siteId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    if (filters?.trainerId) {
      query = query.eq('trainer_id', filters.trainerId);
    }
    if (filters?.classTypeId) {
      query = query.eq('class_type_id', filters.classTypeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by category if needed
    let classes = data || [];
    if (filters?.category) {
      classes = classes.filter(c => c.class_type?.category === filters.category);
    }

    return classes;
  }

  /**
   * Book a class
   */
  async bookClass(
    siteId: string,
    tenantId: string,
    classId: string,
    memberId: string
  ): Promise<{ success: boolean; message: string; booking?: any }> {
    // Get class details
    const { data: classData } = await supabase
      .from('mod_gym.classes')
      .select(`
        *,
        class_type:mod_gym.class_types(*)
      `)
      .eq('id', classId)
      .single();

    if (!classData) {
      return { success: false, message: 'Class not found' };
    }

    // Check if class is in the future
    if (new Date(classData.start_time) < new Date()) {
      return { success: false, message: 'Cannot book past classes' };
    }

    // Check if already booked
    const { data: existingBooking } = await supabase
      .from('mod_gym.class_bookings')
      .select('id, status')
      .eq('class_id', classId)
      .eq('member_id', memberId)
      .not('status', 'eq', 'cancelled')
      .single();

    if (existingBooking) {
      return {
        success: false,
        message: existingBooking.status === 'waitlisted'
          ? 'You are already on the waitlist'
          : 'You are already booked for this class'
      };
    }

    // Check membership
    const { data: member } = await supabase
      .from('mod_gym.members')
      .select(`
        status,
        memberships:mod_gym.memberships(
          status, remaining_classes,
          membership_type:mod_gym.membership_types(
            classes_per_month, is_included_in_membership
          )
        )
      `)
      .eq('id', memberId)
      .single();

    if (member?.status !== 'active') {
      return { success: false, message: 'Member is not active' };
    }

    const activeMembership = member?.memberships?.find(
      (m: any) => m.status === 'active'
    );

    // Check if class is included or needs payment
    let needsPayment = false;
    if (!classData.class_type?.is_included_in_membership) {
      needsPayment = true;
    } else if (activeMembership?.remaining_classes !== null) {
      if (activeMembership.remaining_classes <= 0) {
        needsPayment = true;
      }
    }

    // Determine if booking or waitlisting
    const isWaitlist = classData.current_enrollment >= classData.max_capacity;
    
    if (isWaitlist && !classData.waitlist_enabled) {
      return { success: false, message: 'Class is full and waitlist is disabled' };
    }

    // Get waitlist position if needed
    let waitlistPosition: number | null = null;
    if (isWaitlist) {
      const { count } = await supabase
        .from('mod_gym.class_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'waitlisted');
      
      waitlistPosition = (count || 0) + 1;
    }

    // Create booking
    const { data: booking, error } = await supabase
      .from('mod_gym.class_bookings')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        class_id: classId,
        member_id: memberId,
        status: isWaitlist ? 'waitlisted' : 'booked',
        waitlist_position: waitlistPosition,
        booked_via: 'web',
        paid: !needsPayment,
        amount_paid: needsPayment ? classData.class_type?.drop_in_price : null
      })
      .select()
      .single();

    if (error) throw error;

    // Update class counts
    const updateData = isWaitlist
      ? { waitlist_count: classData.waitlist_count + 1 }
      : { current_enrollment: classData.current_enrollment + 1 };

    await supabase
      .from('mod_gym.classes')
      .update(updateData)
      .eq('id', classId);

    // Decrement class credits if applicable
    if (!isWaitlist && activeMembership?.remaining_classes !== null && !needsPayment) {
      await supabase
        .from('mod_gym.memberships')
        .update({ remaining_classes: activeMembership.remaining_classes - 1 })
        .eq('id', activeMembership.id);
    }

    return {
      success: true,
      message: isWaitlist
        ? `Added to waitlist (position ${waitlistPosition})`
        : 'Successfully booked!',
      booking
    };
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    bookingId: string,
    lateCancelWindow: number = 2 // hours
  ): Promise<{ success: boolean; lateCancel: boolean }> {
    const { data: booking } = await supabase
      .from('mod_gym.class_bookings')
      .select(`
        *,
        class:mod_gym.classes(start_time)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) throw new Error('Booking not found');

    // Check if late cancel
    const classTime = new Date(booking.class.start_time);
    const cancelDeadline = new Date(classTime.getTime() - lateCancelWindow * 60 * 60 * 1000);
    const lateCancel = new Date() > cancelDeadline;

    // Update booking
    await supabase
      .from('mod_gym.class_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        late_cancel: lateCancel
      })
      .eq('id', bookingId);

    // Update class enrollment
    if (booking.status === 'booked') {
      await supabase.rpc('decrement_class_enrollment', { class_id: booking.class_id });

      // Move first waitlisted person to booked
      await this.promoteFromWaitlist(booking.class_id);
    } else if (booking.status === 'waitlisted') {
      // Reorder waitlist
      await this.reorderWaitlist(booking.class_id);
    }

    return { success: true, lateCancel };
  }

  /**
   * Promote first waitlisted person
   */
  private async promoteFromWaitlist(classId: string): Promise<void> {
    const { data: firstWaitlisted } = await supabase
      .from('mod_gym.class_bookings')
      .select('id, member_id')
      .eq('class_id', classId)
      .eq('status', 'waitlisted')
      .order('waitlist_position', { ascending: true })
      .limit(1)
      .single();

    if (firstWaitlisted) {
      await supabase
        .from('mod_gym.class_bookings')
        .update({
          status: 'booked',
          waitlist_position: null
        })
        .eq('id', firstWaitlisted.id);

      await supabase
        .from('mod_gym.classes')
        .update({ waitlist_count: supabase.raw('waitlist_count - 1') })
        .eq('id', classId);

      // TODO: Send notification to member
    }
  }

  /**
   * Reorder waitlist positions
   */
  private async reorderWaitlist(classId: string): Promise<void> {
    const { data: waitlisted } = await supabase
      .from('mod_gym.class_bookings')
      .select('id')
      .eq('class_id', classId)
      .eq('status', 'waitlisted')
      .order('waitlist_position', { ascending: true });

    if (waitlisted) {
      for (let i = 0; i < waitlisted.length; i++) {
        await supabase
          .from('mod_gym.class_bookings')
          .update({ waitlist_position: i + 1 })
          .eq('id', waitlisted[i].id);
      }
    }
  }

  /**
   * Check in to class
   */
  async checkInToClass(bookingId: string): Promise<void> {
    await supabase
      .from('mod_gym.class_bookings')
      .update({
        status: 'attended',
        checked_in_at: new Date().toISOString()
      })
      .eq('id', bookingId);
  }

  /**
   * Mark no-show
   */
  async markNoShow(classId: string): Promise<number> {
    const { data: noShows } = await supabase
      .from('mod_gym.class_bookings')
      .update({ status: 'no_show' })
      .eq('class_id', classId)
      .eq('status', 'booked')
      .is('checked_in_at', null)
      .select();

    return noShows?.length || 0;
  }
}
```

---

### Task 4: Class Schedule UI (2 hours)

```tsx
// src/modules/gym/components/ClassSchedule.tsx

'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  User,
  MapPin,
  AlertCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  ScrollArea
} from '@/components/ui';

interface ClassSchedule {
  id: string;
  class_type: {
    id: string;
    name: string;
    description: string;
    difficulty_level: string;
    category: string;
    color: string;
    duration_minutes: number;
  };
  trainer?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
  start_time: string;
  end_time: string;
  room?: string;
  max_capacity: number;
  current_enrollment: number;
  waitlist_count: number;
}

interface ClassScheduleViewProps {
  classes: ClassSchedule[];
  onBookClass: (classId: string) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
  memberBookings: string[]; // class IDs member is booked for
}

export function ClassScheduleView({
  classes,
  onBookClass,
  onCancelBooking,
  memberBookings
}: ClassScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Get week dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  // Group classes by date
  const classesByDate = useMemo(() => {
    const grouped: Record<string, ClassSchedule[]> = {};
    
    classes
      .filter(c => !categoryFilter || c.class_type.category === categoryFilter)
      .forEach(classItem => {
        const date = classItem.start_time.split('T')[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(classItem);
      });

    // Sort by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    return grouped;
  }, [classes, categoryFilter]);

  const categories = [
    { key: 'cardio', label: 'Cardio', color: 'bg-red-500' },
    { key: 'strength', label: 'Strength', color: 'bg-blue-500' },
    { key: 'yoga', label: 'Yoga', color: 'bg-green-500' },
    { key: 'hiit', label: 'HIIT', color: 'bg-orange-500' },
    { key: 'cycling', label: 'Cycling', color: 'bg-yellow-500' },
    { key: 'pilates', label: 'Pilates', color: 'bg-purple-500' }
  ];

  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'beginner':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Advanced</Badge>;
      default:
        return <Badge variant="secondary">All Levels</Badge>;
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const isBooked = (classId: string) => memberBookings.includes(classId);
  const isFull = (classItem: ClassSchedule) => 
    classItem.current_enrollment >= classItem.max_capacity;
  const isPast = (startTime: string) => new Date(startTime) < new Date();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentDate(newDate);
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {weekDates[0].toLocaleDateString([], { month: 'long', day: 'numeric' })}
            {' - '}
            {weekDates[6].toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentDate(newDate);
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={categoryFilter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter(null)}
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.key}
            variant={categoryFilter === cat.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(cat.key)}
          >
            <div className={`w-2 h-2 rounded-full ${cat.color} mr-2`} />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayClasses = classesByDate[dateStr] || [];
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <div key={index} className="space-y-2">
              {/* Day Header */}
              <div className={`text-center p-2 rounded ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <div className="text-xs uppercase">
                  {date.toLocaleDateString([], { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold">
                  {date.getDate()}
                </div>
              </div>

              {/* Classes */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {dayClasses.map(classItem => (
                    <Card
                      key={classItem.id}
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        isPast(classItem.start_time) ? 'opacity-50' : ''
                      }`}
                      style={{ borderLeftColor: classItem.class_type.color, borderLeftWidth: 4 }}
                      onClick={() => setSelectedClass(classItem)}
                    >
                      <CardContent className="p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatTime(classItem.start_time)}
                        </div>
                        <div className="font-medium text-sm truncate">
                          {classItem.class_type.name}
                        </div>
                        {classItem.trainer && (
                          <div className="text-xs text-muted-foreground">
                            {classItem.trainer.first_name}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs">
                            <Users className="h-3 w-3 inline mr-1" />
                            {classItem.current_enrollment}/{classItem.max_capacity}
                          </span>
                          {isBooked(classItem.id) && (
                            <Badge className="text-xs" variant="default">Booked</Badge>
                          )}
                          {!isBooked(classItem.id) && isFull(classItem) && (
                            <Badge className="text-xs" variant="secondary">Full</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {dayClasses.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      No classes
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Class Detail Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="max-w-md">
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedClass.class_type.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Time & Location */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatTime(selectedClass.start_time)} - {formatTime(selectedClass.end_time)}
                    </span>
                  </div>
                  {selectedClass.room && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClass.room}</span>
                    </div>
                  )}
                </div>

                {/* Instructor */}
                {selectedClass.trainer && (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {selectedClass.trainer.photo_url ? (
                        <img src={selectedClass.trainer.photo_url} alt="" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {selectedClass.trainer.first_name} {selectedClass.trainer.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">Instructor</div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedClass.class_type.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedClass.class_type.description}
                  </p>
                )}

                {/* Info */}
                <div className="flex items-center gap-4 text-sm">
                  {getDifficultyBadge(selectedClass.class_type.difficulty_level)}
                  <span>{selectedClass.class_type.duration_minutes} min</span>
                </div>

                {/* Capacity */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {selectedClass.current_enrollment} / {selectedClass.max_capacity} spots filled
                    </span>
                  </div>
                  {selectedClass.waitlist_count > 0 && (
                    <span className="text-sm text-muted-foreground">
                      +{selectedClass.waitlist_count} waitlisted
                    </span>
                  )}
                </div>

                {/* Status Messages */}
                {isPast(selectedClass.start_time) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>This class has already started</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                {isBooked(selectedClass.id) ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Find booking ID and cancel
                      onCancelBooking(selectedClass.id);
                      setSelectedClass(null);
                    }}
                    disabled={isPast(selectedClass.start_time)}
                  >
                    Cancel Booking
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      onBookClass(selectedClass.id);
                      setSelectedClass(null);
                    }}
                    disabled={isPast(selectedClass.start_time)}
                  >
                    {isFull(selectedClass) ? 'Join Waitlist' : 'Book Class'}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### Task 5: Member Dashboard (1.5 hours)

```tsx
// src/modules/gym/components/MemberDashboard.tsx

'use client';

import {
  Calendar,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Award,
  Dumbbell
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress
} from '@/components/ui';

interface MemberDashboardProps {
  member: {
    first_name: string;
    last_name: string;
    photo_url?: string;
    membership?: {
      type: { name: string };
      end_date?: string;
      remaining_classes?: number;
    };
  };
  stats: {
    totalCheckIns: number;
    classesAttended: number;
    workoutsLogged: number;
    currentStreak: number;
    thisMonthCheckIns: number;
  };
  upcomingClasses: Array<{
    id: string;
    class_type: { name: string };
    start_time: string;
    trainer?: { first_name: string };
  }>;
  recentWorkouts: Array<{
    id: string;
    name: string;
    date: string;
    total_volume?: number;
  }>;
  goals: Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    unit: string;
  }>;
}

export function MemberDashboard({
  member,
  stats,
  upcomingClasses,
  recentWorkouts,
  goals
}: MemberDashboardProps) {
  // Calculate days until membership expires
  const daysUntilExpiry = member.membership?.end_date
    ? Math.ceil(
        (new Date(member.membership.end_date).getTime() - Date.now()) / 86400000
      )
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {member.first_name}!
          </h1>
          <p className="text-muted-foreground">
            {member.membership?.type.name}
            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
              <span className="text-yellow-600 ml-2">
                (Expires in {daysUntilExpiry} days)
              </span>
            )}
          </p>
        </div>

        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-orange-700">
              {stats.currentStreak} day streak!
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.thisMonthCheckIns}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCheckIns}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Dumbbell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.classesAttended}</p>
                <p className="text-xs text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.workoutsLogged}</p>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.slice(0, 5).map(classItem => (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{classItem.class_type.name}</div>
                      {classItem.trainer && (
                        <div className="text-sm text-muted-foreground">
                          with {classItem.trainer.first_name}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div>
                        {new Date(classItem.start_time).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(classItem.start_time).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No upcoming classes booked</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              My Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map(goal => {
                  const progress = Math.min((goal.current / goal.target) * 100, 100);
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{goal.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {goal.current} / {goal.target} {goal.unit}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Set your fitness goals</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length > 0 ? (
              <div className="space-y-3">
                {recentWorkouts.slice(0, 5).map(workout => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{workout.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(workout.date).toLocaleDateString()}
                      </div>
                    </div>
                    {workout.total_volume && (
                      <div className="text-right">
                        <div className="font-bold">
                          {workout.total_volume.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          lbs volume
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Log your first workout</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Credits Remaining */}
        {member.membership?.remaining_classes !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Class Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary">
                  {member.membership.remaining_classes}
                </div>
                <div className="text-muted-foreground">credits remaining</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Members create/edit with details
- [ ] Memberships assign with billing
- [ ] Check-in works with barcode/RFID
- [ ] Access control validates
- [ ] Classes schedule and recur
- [ ] Bookings create with waitlist
- [ ] Trainers assign to classes/PT
- [ ] Workouts log with sets/reps
- [ ] Progress tracks over time
- [ ] Stats calculate correctly

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-51 (Booking)
- **Required by**: Wearable integrations
- **External**: Stripe (billing), Barcode scanners, Wearable APIs
