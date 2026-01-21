# Phase EM-62: Healthcare Practice Module

> **Priority**: 🟡 MEDIUM (Industry Vertical)
> **Estimated Time**: 35-40 hours
> **Prerequisites**: EM-01, EM-11, EM-51 (Booking)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **healthcare practice management system** (similar to Jane App/SimplePractice):
1. Patient management with medical history
2. Appointment scheduling
3. Clinical documentation (SOAP notes)
4. Treatment plans
5. Insurance & billing
6. HIPAA-compliant messaging

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   HEALTHCARE MODULE                                  │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   PATIENTS      │   CLINICAL      │     BILLING                     │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Demographics    │ Appointments    │ Insurance                       │
│ Medical History │ SOAP Notes      │ Claims                          │
│ Consent Forms   │ Treatment Plans │ Invoices                        │
│ Documents       │ Prescriptions   │ Payments                        │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (2.5 hours)

```sql
-- migrations/em-62-healthcare-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}
-- HIPAA Compliance: All PHI is encrypted and access is audited

-- Patients
CREATE TABLE mod_health.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Demographics
  mrn TEXT UNIQUE, -- Medical Record Number
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  pronouns TEXT,
  
  -- Contact
  email TEXT,
  phone_primary TEXT,
  phone_secondary TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- Insurance (Primary)
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_group_number TEXT,
  insurance_holder_name TEXT,
  insurance_holder_dob DATE,
  insurance_holder_relation TEXT,
  
  -- Insurance (Secondary)
  secondary_insurance_provider TEXT,
  secondary_insurance_policy_number TEXT,
  
  -- Medical
  primary_provider_id UUID,
  referring_provider TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'inactive', 'deceased', 'transferred'
  )),
  
  -- Portal
  portal_enabled BOOLEAN DEFAULT false,
  portal_user_id UUID,
  
  -- Preferences
  preferred_contact_method TEXT DEFAULT 'email',
  preferred_language TEXT DEFAULT 'en',
  
  -- Consent
  hipaa_consent_signed BOOLEAN DEFAULT false,
  hipaa_consent_date DATE,
  marketing_consent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Medical History
CREATE TABLE mod_health.patient_medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES mod_health.patients(id) ON DELETE CASCADE,
  
  -- Allergies
  allergies JSONB DEFAULT '[]',
  
  -- Medications
  current_medications JSONB DEFAULT '[]',
  
  -- Medical Conditions
  conditions JSONB DEFAULT '[]',
  
  -- Family History
  family_history JSONB DEFAULT '[]',
  
  -- Social History
  smoking_status TEXT CHECK (smoking_status IN (
    'never', 'former', 'current', 'unknown'
  )),
  alcohol_use TEXT,
  occupation TEXT,
  
  -- Surgical History
  surgical_history JSONB DEFAULT '[]',
  
  -- Immunizations
  immunizations JSONB DEFAULT '[]',
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Providers (Clinicians)
CREATE TABLE mod_health.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  user_id UUID,
  
  -- Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  credentials TEXT[],
  specialty TEXT,
  
  -- License
  npi_number TEXT,
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  
  -- Contact
  email TEXT,
  phone TEXT,
  
  -- Settings
  default_appointment_duration INTEGER DEFAULT 60,
  color TEXT DEFAULT '#3B82F6',
  
  -- Availability
  schedule JSONB,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment Types
CREATE TABLE mod_health.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Duration
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  
  -- Billing
  default_cpt_code TEXT,
  default_fee DECIMAL(10,2),
  
  -- Settings
  allow_online_booking BOOLEAN DEFAULT true,
  requires_intake_form BOOLEAN DEFAULT false,
  intake_form_id UUID,
  
  -- Buffer
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE mod_health.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  patient_id UUID NOT NULL REFERENCES mod_health.patients(id),
  provider_id UUID NOT NULL REFERENCES mod_health.providers(id),
  appointment_type_id UUID REFERENCES mod_health.appointment_types(id),
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'arrived', 'in_progress', 
    'completed', 'cancelled', 'no_show', 'rescheduled'
  )),
  
  -- Visit info
  visit_reason TEXT,
  chief_complaint TEXT,
  
  -- Telehealth
  is_telehealth BOOLEAN DEFAULT false,
  telehealth_url TEXT,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Billing
  billed BOOLEAN DEFAULT false,
  invoice_id UUID,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Notes (SOAP Notes)
CREATE TABLE mod_health.clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  patient_id UUID NOT NULL REFERENCES mod_health.patients(id),
  provider_id UUID NOT NULL REFERENCES mod_health.providers(id),
  appointment_id UUID REFERENCES mod_health.appointments(id),
  
  -- Note type
  note_type TEXT DEFAULT 'progress' CHECK (note_type IN (
    'initial', 'progress', 'follow_up', 'discharge', 'phone', 'telehealth'
  )),
  
  -- Date
  note_date DATE NOT NULL,
  
  -- SOAP Format
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  
  -- Vitals (if applicable)
  vitals JSONB,
  
  -- Diagnosis
  diagnoses JSONB DEFAULT '[]',
  
  -- Procedures
  procedures JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'addendum', 'amended')),
  
  -- Signature
  signed_at TIMESTAMPTZ,
  signed_by UUID,
  
  -- Addendum
  addendum TEXT,
  addendum_date TIMESTAMPTZ,
  addendum_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment Plans
CREATE TABLE mod_health.treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  patient_id UUID NOT NULL REFERENCES mod_health.patients(id),
  provider_id UUID NOT NULL REFERENCES mod_health.providers(id),
  
  -- Plan
  name TEXT NOT NULL,
  description TEXT,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  review_date DATE,
  
  -- Goals
  goals JSONB DEFAULT '[]',
  
  -- Interventions
  interventions JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'draft', 'active', 'completed', 'discontinued'
  )),
  
  -- Consent
  patient_consent BOOLEAN DEFAULT false,
  consent_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE mod_health.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  patient_id UUID NOT NULL REFERENCES mod_health.patients(id),
  provider_id UUID NOT NULL REFERENCES mod_health.providers(id),
  appointment_id UUID REFERENCES mod_health.appointments(id),
  
  -- Medication
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT DEFAULT 'oral',
  
  -- Quantity
  quantity INTEGER,
  quantity_unit TEXT,
  days_supply INTEGER,
  refills INTEGER DEFAULT 0,
  
  -- Instructions
  instructions TEXT,
  
  -- Dates
  prescribed_date DATE NOT NULL,
  start_date DATE,
  end_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'discontinued', 'expired', 'completed'
  )),
  
  -- Pharmacy
  pharmacy_name TEXT,
  pharmacy_phone TEXT,
  pharmacy_fax TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms & Questionnaires
CREATE TABLE mod_health.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Form type
  form_type TEXT CHECK (form_type IN (
    'intake', 'consent', 'assessment', 'questionnaire', 'other'
  )),
  
  -- Schema
  fields JSONB NOT NULL,
  
  -- Settings
  is_required BOOLEAN DEFAULT false,
  active_for_new_patients BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Submissions
CREATE TABLE mod_health.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  form_id UUID NOT NULL REFERENCES mod_health.forms(id),
  patient_id UUID NOT NULL REFERENCES mod_health.patients(id),
  appointment_id UUID REFERENCES mod_health.appointments(id),
  
  -- Responses
  responses JSONB NOT NULL,
  
  -- Signature
  signed BOOLEAN DEFAULT false,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  signed_ip TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Claims
CREATE TABLE mod_health.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  patient_id UUID NOT NULL REFERENCES mod_health.patients(id),
  appointment_id UUID REFERENCES mod_health.appointments(id),
  
  -- Claim info
  claim_number TEXT UNIQUE,
  
  -- Dates
  service_date DATE NOT NULL,
  submission_date DATE,
  
  -- Insurance
  insurance_provider TEXT NOT NULL,
  policy_number TEXT,
  
  -- Diagnosis
  diagnosis_codes TEXT[],
  
  -- Procedures
  procedure_codes JSONB DEFAULT '[]',
  
  -- Amounts
  billed_amount DECIMAL(10,2) NOT NULL,
  allowed_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  adjustment_amount DECIMAL(10,2) DEFAULT 0,
  patient_responsibility DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'accepted', 'rejected', 
    'pending', 'partially_paid', 'paid', 'denied', 'appealed'
  )),
  
  -- Response
  payer_claim_id TEXT,
  rejection_reason TEXT,
  remittance_date DATE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Documents
CREATE TABLE mod_health.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  patient_id UUID NOT NULL REFERENCES mod_health.patients(id),
  
  -- Document
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  -- Category
  category TEXT CHECK (category IN (
    'lab_result', 'imaging', 'referral', 'insurance', 
    'consent', 'correspondence', 'other'
  )),
  
  -- Date
  document_date DATE,
  
  -- Notes
  notes TEXT,
  
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Messages
CREATE TABLE mod_health.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Thread
  thread_id UUID,
  
  -- Participants
  patient_id UUID REFERENCES mod_health.patients(id),
  provider_id UUID REFERENCES mod_health.providers(id),
  
  -- Message
  sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'provider', 'staff')),
  sender_id UUID NOT NULL,
  
  subject TEXT,
  body TEXT NOT NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Urgency
  is_urgent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (HIPAA requirement)
CREATE TABLE mod_health.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- User
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  
  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'view', 'create', 'update', 'delete', 'export', 'print', 'share'
  )),
  
  -- Resource
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  
  -- Details
  details JSONB,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_health_patients_mrn ON mod_health.patients(mrn);
CREATE INDEX idx_health_patients_name ON mod_health.patients(last_name, first_name);
CREATE INDEX idx_health_appointments_date ON mod_health.appointments(start_time);
CREATE INDEX idx_health_appointments_patient ON mod_health.appointments(patient_id, start_time DESC);
CREATE INDEX idx_health_appointments_provider ON mod_health.appointments(provider_id, start_time);
CREATE INDEX idx_health_notes_patient ON mod_health.clinical_notes(patient_id, note_date DESC);
CREATE INDEX idx_health_claims_status ON mod_health.claims(status, submission_date);
CREATE INDEX idx_health_audit_resource ON mod_health.audit_log(resource_type, resource_id);
CREATE INDEX idx_health_audit_user ON mod_health.audit_log(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE mod_health.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_health.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_health.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_health.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_health.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_health.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON mod_health.patients
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_health.appointments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_health.clinical_notes
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_health.prescriptions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Patient Service (2 hours)

```typescript
// src/modules/healthcare/services/patient-service.ts

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  phone_primary?: string;
  status: string;
}

export interface PatientInput {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  email?: string;
  phone_primary?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
}

export class PatientService {
  /**
   * Create a new patient
   */
  async createPatient(
    siteId: string,
    tenantId: string,
    userId: string,
    input: PatientInput
  ): Promise<Patient> {
    // Generate MRN
    const mrn = await this.generateMRN(siteId);

    const { data: patient, error } = await supabase
      .from('mod_health.patients')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        mrn,
        ...input
      })
      .select()
      .single();

    if (error) throw error;

    // Create empty medical history record
    await supabase.from('mod_health.patient_medical_history').insert({
      patient_id: patient.id
    });

    // Audit log
    await this.auditLog(siteId, tenantId, userId, 'create', 'patient', patient.id);

    return patient;
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string, userId: string): Promise<Patient> {
    const { data, error } = await supabase
      .from('mod_health.patients')
      .select(`
        *,
        medical_history:mod_health.patient_medical_history(*)
      `)
      .eq('id', patientId)
      .single();

    if (error) throw error;

    // Audit log
    await this.auditLog(
      data.site_id, 
      data.tenant_id, 
      userId, 
      'view', 
      'patient', 
      patientId
    );

    return data;
  }

  /**
   * Update patient
   */
  async updatePatient(
    patientId: string,
    userId: string,
    updates: Partial<PatientInput>
  ): Promise<Patient> {
    const { data, error } = await supabase
      .from('mod_health.patients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await this.auditLog(
      data.site_id, 
      data.tenant_id, 
      userId, 
      'update', 
      'patient', 
      patientId,
      { fields: Object.keys(updates) }
    );

    return data;
  }

  /**
   * Update medical history
   */
  async updateMedicalHistory(
    patientId: string,
    userId: string,
    updates: {
      allergies?: Array<{ allergen: string; reaction: string; severity: string }>;
      current_medications?: Array<{ name: string; dosage: string; frequency: string }>;
      conditions?: Array<{ condition: string; status: string; onset_date?: string }>;
      family_history?: Array<{ relation: string; condition: string }>;
      surgical_history?: Array<{ procedure: string; date: string; notes?: string }>;
      smoking_status?: string;
      alcohol_use?: string;
    }
  ): Promise<void> {
    const { data: patient } = await supabase
      .from('mod_health.patients')
      .select('site_id, tenant_id')
      .eq('id', patientId)
      .single();

    if (!patient) throw new Error('Patient not found');

    await supabase
      .from('mod_health.patient_medical_history')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('patient_id', patientId);

    // Audit log
    await this.auditLog(
      patient.site_id,
      patient.tenant_id,
      userId,
      'update',
      'medical_history',
      patientId
    );
  }

  /**
   * Search patients
   */
  async searchPatients(
    siteId: string,
    query: string,
    limit: number = 20
  ): Promise<Patient[]> {
    const { data } = await supabase
      .from('mod_health.patients')
      .select('id, mrn, first_name, last_name, date_of_birth, phone_primary, email, status')
      .eq('site_id', siteId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,mrn.ilike.%${query}%,phone_primary.ilike.%${query}%`)
      .limit(limit);

    return data || [];
  }

  /**
   * Get patient chart summary
   */
  async getChartSummary(patientId: string): Promise<{
    recentNotes: any[];
    upcomingAppointments: any[];
    activeMedications: any[];
    allergies: any[];
    diagnoses: any[];
  }> {
    const today = new Date().toISOString();

    // Recent notes
    const { data: notes } = await supabase
      .from('mod_health.clinical_notes')
      .select(`
        id, note_type, note_date, status,
        provider:mod_health.providers(first_name, last_name)
      `)
      .eq('patient_id', patientId)
      .order('note_date', { ascending: false })
      .limit(5);

    // Upcoming appointments
    const { data: appointments } = await supabase
      .from('mod_health.appointments')
      .select(`
        id, start_time, status,
        provider:mod_health.providers(first_name, last_name),
        appointment_type:mod_health.appointment_types(name)
      `)
      .eq('patient_id', patientId)
      .gte('start_time', today)
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time')
      .limit(5);

    // Active medications
    const { data: prescriptions } = await supabase
      .from('mod_health.prescriptions')
      .select('id, medication_name, dosage, frequency')
      .eq('patient_id', patientId)
      .eq('status', 'active');

    // Medical history
    const { data: history } = await supabase
      .from('mod_health.patient_medical_history')
      .select('allergies, conditions')
      .eq('patient_id', patientId)
      .single();

    return {
      recentNotes: notes || [],
      upcomingAppointments: appointments || [],
      activeMedications: prescriptions || [],
      allergies: history?.allergies || [],
      diagnoses: history?.conditions || []
    };
  }

  /**
   * Generate unique MRN
   */
  private async generateMRN(siteId: string): Promise<string> {
    const prefix = 'MRN';
    const { data } = await supabase
      .from('mod_health.patients')
      .select('mrn')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data[0]?.mrn) {
      const lastNum = parseInt(data[0].mrn.replace(prefix, '')) || 0;
      return `${prefix}${String(lastNum + 1).padStart(8, '0')}`;
    }

    return `${prefix}00000001`;
  }

  /**
   * HIPAA audit log
   */
  private async auditLog(
    siteId: string,
    tenantId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details?: any
  ): Promise<void> {
    await supabase.from('mod_health.audit_log').insert({
      site_id: siteId,
      tenant_id: tenantId,
      user_id: userId,
      user_type: 'provider',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    });
  }
}
```

---

### Task 3: Clinical Notes Service (2 hours)

```typescript
// src/modules/healthcare/services/clinical-notes-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ClinicalNote {
  id: string;
  patient_id: string;
  provider_id: string;
  note_type: string;
  note_date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitals?: Vitals;
  diagnoses: Diagnosis[];
  status: string;
}

export interface Vitals {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  temperature_unit?: 'F' | 'C';
  weight?: number;
  weight_unit?: 'lb' | 'kg';
  height?: number;
  height_unit?: 'in' | 'cm';
  oxygen_saturation?: number;
  pain_level?: number;
}

export interface Diagnosis {
  code: string;
  description: string;
  is_primary: boolean;
}

export class ClinicalNotesService {
  /**
   * Create clinical note
   */
  async createNote(
    siteId: string,
    tenantId: string,
    providerId: string,
    input: {
      patient_id: string;
      appointment_id?: string;
      note_type: string;
      note_date: string;
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
      vitals?: Vitals;
      diagnoses?: Diagnosis[];
    }
  ): Promise<ClinicalNote> {
    const { data, error } = await supabase
      .from('mod_health.clinical_notes')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        provider_id: providerId,
        patient_id: input.patient_id,
        appointment_id: input.appointment_id,
        note_type: input.note_type,
        note_date: input.note_date,
        subjective: input.subjective,
        objective: input.objective,
        assessment: input.assessment,
        plan: input.plan,
        vitals: input.vitals,
        diagnoses: input.diagnoses || [],
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await this.auditLog(siteId, tenantId, providerId, 'create', 'clinical_note', data.id);

    return data;
  }

  /**
   * Update clinical note
   */
  async updateNote(
    noteId: string,
    providerId: string,
    updates: Partial<{
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
      vitals: Vitals;
      diagnoses: Diagnosis[];
    }>
  ): Promise<ClinicalNote> {
    // Check if note is already signed
    const { data: existing } = await supabase
      .from('mod_health.clinical_notes')
      .select('status, site_id, tenant_id, provider_id')
      .eq('id', noteId)
      .single();

    if (!existing) throw new Error('Note not found');
    if (existing.status === 'signed') {
      throw new Error('Cannot edit signed note. Add an addendum instead.');
    }

    const { data, error } = await supabase
      .from('mod_health.clinical_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await this.auditLog(
      existing.site_id,
      existing.tenant_id,
      providerId,
      'update',
      'clinical_note',
      noteId
    );

    return data;
  }

  /**
   * Sign clinical note
   */
  async signNote(noteId: string, providerId: string): Promise<void> {
    const { data: note } = await supabase
      .from('mod_health.clinical_notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (!note) throw new Error('Note not found');
    if (note.provider_id !== providerId) {
      throw new Error('Only the authoring provider can sign this note');
    }
    if (note.status === 'signed') {
      throw new Error('Note is already signed');
    }

    // Validate required fields
    if (!note.subjective || !note.assessment || !note.plan) {
      throw new Error('Subjective, Assessment, and Plan are required to sign');
    }

    await supabase
      .from('mod_health.clinical_notes')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by: providerId
      })
      .eq('id', noteId);

    // Audit log
    await this.auditLog(
      note.site_id,
      note.tenant_id,
      providerId,
      'update',
      'clinical_note',
      noteId,
      { action: 'sign' }
    );
  }

  /**
   * Add addendum to signed note
   */
  async addAddendum(
    noteId: string,
    providerId: string,
    addendumText: string
  ): Promise<void> {
    const { data: note } = await supabase
      .from('mod_health.clinical_notes')
      .select('site_id, tenant_id, status')
      .eq('id', noteId)
      .single();

    if (!note) throw new Error('Note not found');
    if (note.status !== 'signed') {
      throw new Error('Addendums can only be added to signed notes');
    }

    await supabase
      .from('mod_health.clinical_notes')
      .update({
        status: 'addendum',
        addendum: addendumText,
        addendum_date: new Date().toISOString(),
        addendum_by: providerId
      })
      .eq('id', noteId);

    // Audit log
    await this.auditLog(
      note.site_id,
      note.tenant_id,
      providerId,
      'update',
      'clinical_note',
      noteId,
      { action: 'addendum' }
    );
  }

  /**
   * Get patient's clinical notes
   */
  async getPatientNotes(
    patientId: string,
    options?: {
      note_type?: string;
      start_date?: string;
      end_date?: string;
      provider_id?: string;
      status?: string;
    }
  ): Promise<ClinicalNote[]> {
    let query = supabase
      .from('mod_health.clinical_notes')
      .select(`
        *,
        provider:mod_health.providers(first_name, last_name, credentials),
        appointment:mod_health.appointments(id, start_time)
      `)
      .eq('patient_id', patientId)
      .order('note_date', { ascending: false });

    if (options?.note_type) {
      query = query.eq('note_type', options.note_type);
    }
    if (options?.start_date) {
      query = query.gte('note_date', options.start_date);
    }
    if (options?.end_date) {
      query = query.lte('note_date', options.end_date);
    }
    if (options?.provider_id) {
      query = query.eq('provider_id', options.provider_id);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  /**
   * Generate AI-assisted note template
   */
  async generateNoteTemplate(
    patientId: string,
    appointmentId: string,
    chiefComplaint: string
  ): Promise<Partial<ClinicalNote>> {
    // Get patient history for context
    const { data: patient } = await supabase
      .from('mod_health.patients')
      .select(`
        *,
        medical_history:mod_health.patient_medical_history(*)
      `)
      .eq('id', patientId)
      .single();

    // Get recent notes
    const { data: recentNotes } = await supabase
      .from('mod_health.clinical_notes')
      .select('assessment, plan, diagnoses')
      .eq('patient_id', patientId)
      .order('note_date', { ascending: false })
      .limit(3);

    // TODO: Call OpenAI to generate template based on context
    // For now, return a basic template
    return {
      subjective: `Chief Complaint: ${chiefComplaint}\n\nHistory of Present Illness:\n`,
      objective: `Vitals:\n\nPhysical Exam:\n`,
      assessment: ``,
      plan: ``
    };
  }

  /**
   * HIPAA audit log
   */
  private async auditLog(
    siteId: string,
    tenantId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details?: any
  ): Promise<void> {
    await supabase.from('mod_health.audit_log').insert({
      site_id: siteId,
      tenant_id: tenantId,
      user_id: userId,
      user_type: 'provider',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    });
  }
}
```

---

### Task 4: Patient Chart UI (2 hours)

```tsx
// src/modules/healthcare/components/PatientChart.tsx

'use client';

import { useState } from 'react';
import {
  User,
  Calendar,
  FileText,
  Pill,
  AlertTriangle,
  Heart,
  Activity,
  Clock,
  Plus,
  ChevronRight
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  ScrollArea
} from '@/components/ui';

interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone_primary: string;
  email: string;
  insurance_provider?: string;
  medical_history?: {
    allergies: Array<{ allergen: string; reaction: string; severity: string }>;
    conditions: Array<{ condition: string; status: string }>;
    current_medications: Array<{ name: string; dosage: string; frequency: string }>;
  };
}

interface Appointment {
  id: string;
  start_time: string;
  status: string;
  provider: { first_name: string; last_name: string };
  appointment_type: { name: string };
}

interface ClinicalNote {
  id: string;
  note_type: string;
  note_date: string;
  status: string;
  provider: { first_name: string; last_name: string };
}

interface PatientChartProps {
  patient: Patient;
  appointments: Appointment[];
  notes: ClinicalNote[];
  onNewAppointment: () => void;
  onNewNote: () => void;
  onViewNote: (noteId: string) => void;
}

export function PatientChart({
  patient,
  appointments,
  notes,
  onNewAppointment,
  onNewNote,
  onViewNote
}: PatientChartProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const age = Math.floor(
    (Date.now() - new Date(patient.date_of_birth).getTime()) / 
    (1000 * 60 * 60 * 24 * 365.25)
  );

  const hasAllergies = (patient.medical_history?.allergies?.length || 0) > 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Patient Header */}
      <div className="bg-background border-b p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <div className="bg-primary text-white flex items-center justify-center w-full h-full text-xl font-bold">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {patient.first_name} {patient.last_name}
                </h1>
                {hasAllergies && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Allergies
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                MRN: {patient.mrn} • {age} years old • {patient.gender}
              </p>
              <p className="text-sm text-muted-foreground">
                {patient.phone_primary} • {patient.email}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onNewAppointment}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button onClick={onNewNote}>
              <FileText className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="p-6 m-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Alerts & History */}
                <div className="space-y-6">
                  {/* Allergies */}
                  <Card className={hasAllergies ? 'border-red-300' : ''}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Allergies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasAllergies ? (
                        <ul className="space-y-2">
                          {patient.medical_history?.allergies.map((a, i) => (
                            <li key={i} className="flex items-center justify-between">
                              <span className="font-medium">{a.allergen}</span>
                              <Badge variant={
                                a.severity === 'severe' ? 'destructive' : 
                                a.severity === 'moderate' ? 'secondary' : 'outline'
                              }>
                                {a.reaction}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No known allergies</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Conditions */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Active Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(patient.medical_history?.conditions?.length || 0) > 0 ? (
                        <ul className="space-y-2">
                          {patient.medical_history?.conditions
                            .filter(c => c.status === 'active')
                            .map((c, i) => (
                              <li key={i}>{c.condition}</li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No active conditions</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Insurance */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Insurance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patient.insurance_provider ? (
                        <p className="font-medium">{patient.insurance_provider}</p>
                      ) : (
                        <p className="text-muted-foreground">Self-pay</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Middle Column - Recent Notes */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Recent Notes</CardTitle>
                      <Button variant="ghost" size="sm">
                        View All <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {notes.slice(0, 5).map(note => (
                          <button
                            key={note.id}
                            onClick={() => onViewNote(note.id)}
                            className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">
                                {note.note_type.replace('_', ' ')}
                              </span>
                              <Badge variant={
                                note.status === 'signed' ? 'default' : 'secondary'
                              }>
                                {note.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(note.note_date).toLocaleDateString()} • 
                              Dr. {note.provider.last_name}
                            </p>
                          </button>
                        ))}
                        {notes.length === 0 && (
                          <p className="text-muted-foreground text-center py-4">
                            No clinical notes
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Medications */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        Current Medications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(patient.medical_history?.current_medications?.length || 0) > 0 ? (
                        <ul className="space-y-3">
                          {patient.medical_history?.current_medications.map((m, i) => (
                            <li key={i} className="pb-2 border-b last:border-0">
                              <p className="font-medium">{m.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {m.dosage} • {m.frequency}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No current medications</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Appointments */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Upcoming Appointments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {appointments
                          .filter(a => 
                            new Date(a.start_time) > new Date() &&
                            ['scheduled', 'confirmed'].includes(a.status)
                          )
                          .slice(0, 5)
                          .map(apt => (
                            <div key={apt.id} className="p-3 rounded-lg border">
                              <p className="font-medium">{apt.appointment_type.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(apt.start_time).toLocaleDateString()} at{' '}
                                {new Date(apt.start_time).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Dr. {apt.provider.first_name} {apt.provider.last_name}
                              </p>
                            </div>
                          ))}
                        {appointments.filter(a => 
                          new Date(a.start_time) > new Date()
                        ).length === 0 && (
                          <p className="text-muted-foreground text-center py-4">
                            No upcoming appointments
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Visits */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent Visits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {appointments
                          .filter(a => a.status === 'completed')
                          .slice(0, 5)
                          .map(apt => (
                            <div key={apt.id} className="text-sm">
                              <p className="font-medium">
                                {new Date(apt.start_time).toLocaleDateString()}
                              </p>
                              <p className="text-muted-foreground">
                                {apt.appointment_type.name}
                              </p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={onNewNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                  </Button>
                </div>
                {/* Notes list */}
                <div className="space-y-3">
                  {notes.map(note => (
                    <Card 
                      key={note.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => onViewNote(note.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium capitalize">
                              {note.note_type.replace('_', ' ')} Note
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(note.note_date).toLocaleDateString()} • 
                              Dr. {note.provider.first_name} {note.provider.last_name}
                            </p>
                          </div>
                          <Badge variant={
                            note.status === 'signed' ? 'default' :
                            note.status === 'draft' ? 'secondary' : 'outline'
                          }>
                            {note.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Other tab contents */}
            <TabsContent value="appointments" className="p-6 m-0">
              <p className="text-muted-foreground">Appointments tab content...</p>
            </TabsContent>

            <TabsContent value="medications" className="p-6 m-0">
              <p className="text-muted-foreground">Medications tab content...</p>
            </TabsContent>

            <TabsContent value="documents" className="p-6 m-0">
              <p className="text-muted-foreground">Documents tab content...</p>
            </TabsContent>

            <TabsContent value="billing" className="p-6 m-0">
              <p className="text-muted-foreground">Billing tab content...</p>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Patient registration works
- [ ] MRN generates uniquely
- [ ] Medical history saves
- [ ] Appointments schedule
- [ ] Clinical notes create
- [ ] SOAP format works
- [ ] Notes sign properly
- [ ] Addendums add
- [ ] Claims track
- [ ] Audit log records all access

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-51 (Booking)
- **Required by**: Insurance integrations, lab integrations
- **External**: E-prescribing APIs, clearinghouse APIs
- **Compliance**: HIPAA, HITECH
