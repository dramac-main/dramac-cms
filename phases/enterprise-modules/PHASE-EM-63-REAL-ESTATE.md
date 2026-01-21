# Phase EM-63: Real Estate Module

> **Priority**: 🟡 MEDIUM (Industry Vertical)
> **Estimated Time**: 30-35 hours
> **Prerequisites**: EM-01, EM-11, EM-50 (CRM)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **real estate management system** (similar to Propertybase/Follow Up Boss):
1. Property listings management
2. Lead/client tracking
3. Transaction management
4. Showing scheduler
5. Document management
6. MLS integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   REAL ESTATE MODULE                                 │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   PROPERTIES    │   TRANSACTIONS  │     CLIENTS                     │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Listings        │ Pipeline        │ Leads                           │
│ MLS Sync        │ Contracts       │ Buyers/Sellers                  │
│ Photos/Tours    │ Commissions     │ Communication                   │
│ Showings        │ Closing Tasks   │ Saved Searches                  │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (2 hours)

```sql
-- migrations/em-63-real-estate-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}

-- Agents
CREATE TABLE mod_realestate.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  user_id UUID,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- License
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  
  -- Team
  team_id UUID,
  role TEXT DEFAULT 'agent' CHECK (role IN ('agent', 'team_lead', 'broker')),
  
  -- Branding
  photo_url TEXT,
  bio TEXT,
  specialties TEXT[],
  
  -- Commission
  default_commission_rate DECIMAL(5,2),
  split_with_brokerage DECIMAL(5,2) DEFAULT 30,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts/Leads
CREATE TABLE mod_realestate.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Agent assignment
  agent_id UUID REFERENCES mod_realestate.agents(id),
  
  -- Type
  contact_type TEXT DEFAULT 'lead' CHECK (contact_type IN (
    'lead', 'buyer', 'seller', 'buyer_seller', 'investor', 'renter', 'past_client'
  )),
  
  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_primary TEXT,
  phone_secondary TEXT,
  
  -- Address
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Lead Info
  lead_source TEXT,
  lead_source_detail TEXT,
  
  -- Buyer Preferences
  buying_timeframe TEXT,
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  preferred_areas TEXT[],
  property_types TEXT[],
  min_bedrooms INTEGER,
  min_bathrooms DECIMAL(3,1),
  must_haves TEXT[],
  nice_to_haves TEXT[],
  deal_breakers TEXT[],
  
  -- Seller Info
  selling_timeframe TEXT,
  current_property_id UUID,
  reason_for_selling TEXT,
  
  -- Pre-approval
  is_pre_approved BOOLEAN DEFAULT false,
  pre_approval_amount DECIMAL(12,2),
  lender_name TEXT,
  lender_contact TEXT,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'active', 'under_contract', 
    'closed', 'lost', 'nurture'
  )),
  
  -- Score
  lead_score INTEGER DEFAULT 0,
  
  -- Tags
  tags TEXT[],
  
  -- Last activity
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE mod_realestate.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Agent
  listing_agent_id UUID REFERENCES mod_realestate.agents(id),
  co_listing_agent_id UUID REFERENCES mod_realestate.agents(id),
  
  -- MLS
  mls_number TEXT,
  mls_source TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'coming_soon', 'active', 'pending', 'contingent', 
    'sold', 'withdrawn', 'expired', 'off_market'
  )),
  
  -- Property Type
  property_type TEXT CHECK (property_type IN (
    'single_family', 'condo', 'townhouse', 'multi_family',
    'land', 'commercial', 'industrial'
  )),
  property_subtype TEXT,
  
  -- Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  county TEXT,
  country TEXT DEFAULT 'US',
  
  -- Location
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  neighborhood TEXT,
  
  -- Pricing
  list_price DECIMAL(12,2),
  original_price DECIMAL(12,2),
  price_per_sqft DECIMAL(10,2),
  
  -- Details
  year_built INTEGER,
  bedrooms INTEGER,
  bathrooms_full INTEGER,
  bathrooms_half INTEGER,
  total_bathrooms DECIMAL(3,1),
  living_area_sqft INTEGER,
  lot_size_sqft INTEGER,
  lot_size_acres DECIMAL(10,4),
  
  -- Rooms
  stories INTEGER,
  garage_spaces INTEGER,
  parking_spaces INTEGER,
  
  -- Features
  features TEXT[],
  interior_features TEXT[],
  exterior_features TEXT[],
  appliances TEXT[],
  flooring TEXT[],
  heating TEXT,
  cooling TEXT,
  
  -- HOA
  hoa_fee DECIMAL(10,2),
  hoa_frequency TEXT,
  hoa_includes TEXT[],
  
  -- Financials
  taxes_annual DECIMAL(10,2),
  tax_year INTEGER,
  
  -- Description
  public_remarks TEXT,
  private_remarks TEXT,
  showing_instructions TEXT,
  
  -- Dates
  list_date DATE,
  expiration_date DATE,
  sold_date DATE,
  sold_price DECIMAL(12,2),
  days_on_market INTEGER,
  
  -- Virtual
  virtual_tour_url TEXT,
  video_url TEXT,
  
  -- Flags
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Photos
CREATE TABLE mod_realestate.property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES mod_realestate.properties(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  caption TEXT,
  room_type TEXT,
  
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Open Houses
CREATE TABLE mod_realestate.open_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  property_id UUID NOT NULL REFERENCES mod_realestate.properties(id),
  agent_id UUID REFERENCES mod_realestate.agents(id),
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Type
  open_house_type TEXT DEFAULT 'public' CHECK (open_house_type IN (
    'public', 'broker', 'private', 'virtual'
  )),
  
  -- Virtual
  virtual_url TEXT,
  
  notes TEXT,
  
  -- Stats
  visitor_count INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'in_progress', 'completed', 'cancelled'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Showings
CREATE TABLE mod_realestate.showings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  property_id UUID NOT NULL REFERENCES mod_realestate.properties(id),
  contact_id UUID REFERENCES mod_realestate.contacts(id),
  
  -- Agents
  showing_agent_id UUID REFERENCES mod_realestate.agents(id),
  listing_agent_id UUID REFERENCES mod_realestate.agents(id),
  
  -- Time
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Status
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested', 'confirmed', 'completed', 'cancelled', 'no_show'
  )),
  
  -- Feedback
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comments TEXT,
  interest_level TEXT CHECK (interest_level IN ('low', 'medium', 'high', 'making_offer')),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Searches
CREATE TABLE mod_realestate.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  contact_id UUID NOT NULL REFERENCES mod_realestate.contacts(id),
  
  name TEXT NOT NULL,
  
  -- Criteria
  criteria JSONB NOT NULL,
  
  -- Notifications
  email_frequency TEXT DEFAULT 'daily' CHECK (email_frequency IN (
    'instant', 'daily', 'weekly', 'never'
  )),
  
  last_email_sent_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE mod_realestate.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  property_id UUID NOT NULL REFERENCES mod_realestate.properties(id),
  
  -- Transaction Type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'sale', 'lease', 'referral'
  )),
  
  -- Parties
  buyer_contact_id UUID REFERENCES mod_realestate.contacts(id),
  seller_contact_id UUID REFERENCES mod_realestate.contacts(id),
  
  -- Agents
  listing_agent_id UUID REFERENCES mod_realestate.agents(id),
  buying_agent_id UUID REFERENCES mod_realestate.agents(id),
  
  -- Our side
  representation TEXT CHECK (representation IN ('buyer', 'seller', 'dual')),
  
  -- Pricing
  list_price DECIMAL(12,2),
  offer_price DECIMAL(12,2),
  contract_price DECIMAL(12,2),
  final_price DECIMAL(12,2),
  
  -- Dates
  offer_date DATE,
  acceptance_date DATE,
  inspection_deadline DATE,
  financing_deadline DATE,
  appraisal_deadline DATE,
  closing_date DATE,
  actual_closing_date DATE,
  
  -- Financing
  financing_type TEXT CHECK (financing_type IN (
    'conventional', 'fha', 'va', 'cash', 'other'
  )),
  down_payment_amount DECIMAL(12,2),
  down_payment_percentage DECIMAL(5,2),
  
  -- Earnest Money
  earnest_money DECIMAL(10,2),
  earnest_money_holder TEXT,
  
  -- Commission
  total_commission_rate DECIMAL(5,2),
  listing_commission_rate DECIMAL(5,2),
  buying_commission_rate DECIMAL(5,2),
  our_commission_amount DECIMAL(12,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'under_contract', 'inspection', 
    'appraisal', 'financing', 'closing', 'closed', 'cancelled', 'fell_through'
  )),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Tasks/Checklist
CREATE TABLE mod_realestate.transaction_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES mod_realestate.transactions(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Assignment
  assigned_to UUID,
  
  -- Due
  due_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'na'
  )),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  
  -- Order
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  
  is_required BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Documents
CREATE TABLE mod_realestate.transaction_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES mod_realestate.transactions(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN (
    'offer', 'counter_offer', 'contract', 'amendment', 'addendum',
    'inspection', 'appraisal', 'title', 'disclosure', 'closing', 'other'
  )),
  
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  -- Signature
  requires_signature BOOLEAN DEFAULT false,
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  
  notes TEXT,
  
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission Splits
CREATE TABLE mod_realestate.commission_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES mod_realestate.transactions(id),
  
  -- Recipient
  agent_id UUID REFERENCES mod_realestate.agents(id),
  recipient_name TEXT,
  recipient_type TEXT CHECK (recipient_type IN (
    'agent', 'brokerage', 'referral', 'team_lead', 'other'
  )),
  
  -- Amount
  split_percentage DECIMAL(5,2),
  amount DECIMAL(12,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'cancelled'
  )),
  paid_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log
CREATE TABLE mod_realestate.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Related
  contact_id UUID REFERENCES mod_realestate.contacts(id),
  property_id UUID REFERENCES mod_realestate.properties(id),
  transaction_id UUID REFERENCES mod_realestate.transactions(id),
  
  -- Activity
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'text', 'meeting', 'showing', 'open_house',
    'note', 'task', 'status_change', 'document', 'offer'
  )),
  
  subject TEXT,
  description TEXT,
  
  -- User
  performed_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_re_contacts_agent ON mod_realestate.contacts(agent_id, status);
CREATE INDEX idx_re_contacts_email ON mod_realestate.contacts(email);
CREATE INDEX idx_re_properties_status ON mod_realestate.properties(status, city);
CREATE INDEX idx_re_properties_price ON mod_realestate.properties(list_price);
CREATE INDEX idx_re_properties_mls ON mod_realestate.properties(mls_number);
CREATE INDEX idx_re_showings_date ON mod_realestate.showings(scheduled_at);
CREATE INDEX idx_re_transactions_status ON mod_realestate.transactions(status);
CREATE INDEX idx_re_activities_contact ON mod_realestate.activities(contact_id, created_at DESC);

-- Enable RLS
ALTER TABLE mod_realestate.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_realestate.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_realestate.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_realestate.showings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON mod_realestate.contacts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_realestate.properties
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_realestate.transactions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Property Service (2 hours)

```typescript
// src/modules/realestate/services/property-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Property {
  id: string;
  mls_number?: string;
  status: string;
  property_type: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  list_price: number;
  bedrooms: number;
  bathrooms_full: number;
  living_area_sqft: number;
  photos: PropertyPhoto[];
}

export interface PropertyPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  is_primary: boolean;
}

export interface PropertySearchCriteria {
  status?: string[];
  property_type?: string[];
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  min_bathrooms?: number;
  min_sqft?: number;
  cities?: string[];
  postal_codes?: string[];
  features?: string[];
}

export class PropertyService {
  /**
   * Create property listing
   */
  async createProperty(
    siteId: string,
    tenantId: string,
    agentId: string,
    property: Partial<Property>
  ): Promise<Property> {
    // Calculate price per sqft
    let pricePerSqft: number | null = null;
    if (property.list_price && property.living_area_sqft) {
      pricePerSqft = property.list_price / property.living_area_sqft;
    }

    // Calculate total bathrooms
    const totalBathrooms = 
      (property.bathrooms_full || 0) + 
      ((property as any).bathrooms_half || 0) * 0.5;

    const { data, error } = await supabase
      .from('mod_realestate.properties')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        listing_agent_id: agentId,
        ...property,
        price_per_sqft: pricePerSqft,
        total_bathrooms: totalBathrooms,
        original_price: property.list_price,
        list_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Update property
   */
  async updateProperty(
    propertyId: string,
    updates: Partial<Property>
  ): Promise<Property> {
    const { data: existing } = await supabase
      .from('mod_realestate.properties')
      .select('list_price, status, days_on_market, list_date')
      .eq('id', propertyId)
      .single();

    // Track days on market
    let daysOnMarket = existing?.days_on_market;
    if (updates.status === 'sold' || updates.status === 'pending') {
      if (existing?.list_date) {
        daysOnMarket = Math.floor(
          (Date.now() - new Date(existing.list_date).getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    // Update price per sqft if price changed
    let pricePerSqft: number | undefined;
    if (updates.list_price && updates.living_area_sqft) {
      pricePerSqft = updates.list_price / updates.living_area_sqft;
    }

    const { data, error } = await supabase
      .from('mod_realestate.properties')
      .update({
        ...updates,
        price_per_sqft: pricePerSqft,
        days_on_market: daysOnMarket,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Search properties
   */
  async searchProperties(
    siteId: string,
    criteria: PropertySearchCriteria,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ properties: Property[]; total: number }> {
    let query = supabase
      .from('mod_realestate.properties')
      .select(`
        *,
        photos:mod_realestate.property_photos(id, url, thumbnail_url, is_primary),
        listing_agent:mod_realestate.agents(first_name, last_name, photo_url)
      `, { count: 'exact' })
      .eq('site_id', siteId);

    // Apply filters
    if (criteria.status?.length) {
      query = query.in('status', criteria.status);
    }
    if (criteria.property_type?.length) {
      query = query.in('property_type', criteria.property_type);
    }
    if (criteria.min_price) {
      query = query.gte('list_price', criteria.min_price);
    }
    if (criteria.max_price) {
      query = query.lte('list_price', criteria.max_price);
    }
    if (criteria.min_bedrooms) {
      query = query.gte('bedrooms', criteria.min_bedrooms);
    }
    if (criteria.min_bathrooms) {
      query = query.gte('total_bathrooms', criteria.min_bathrooms);
    }
    if (criteria.min_sqft) {
      query = query.gte('living_area_sqft', criteria.min_sqft);
    }
    if (criteria.cities?.length) {
      query = query.in('city', criteria.cities);
    }
    if (criteria.features?.length) {
      query = query.contains('features', criteria.features);
    }

    // Sorting
    const sortBy = options?.sortBy || 'list_date';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      properties: data || [],
      total: count || 0
    };
  }

  /**
   * Get property details
   */
  async getProperty(propertyId: string): Promise<Property> {
    const { data, error } = await supabase
      .from('mod_realestate.properties')
      .select(`
        *,
        photos:mod_realestate.property_photos(*),
        listing_agent:mod_realestate.agents(
          id, first_name, last_name, email, phone, photo_url
        ),
        showings:mod_realestate.showings(
          id, scheduled_at, status, contact:mod_realestate.contacts(first_name, last_name)
        ),
        open_houses:mod_realestate.open_houses(*)
      `)
      .eq('id', propertyId)
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Add property photos
   */
  async addPhotos(
    propertyId: string,
    photos: Array<{ url: string; caption?: string; room_type?: string }>
  ): Promise<void> {
    // Get current max sort order
    const { data: existing } = await supabase
      .from('mod_realestate.property_photos')
      .select('sort_order')
      .eq('property_id', propertyId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const startOrder = (existing?.[0]?.sort_order || 0) + 1;
    const isFirstPhoto = startOrder === 1;

    await supabase.from('mod_realestate.property_photos').insert(
      photos.map((photo, index) => ({
        property_id: propertyId,
        url: photo.url,
        caption: photo.caption,
        room_type: photo.room_type,
        sort_order: startOrder + index,
        is_primary: isFirstPhoto && index === 0
      }))
    );
  }

  /**
   * Match properties to saved search
   */
  async matchSavedSearch(
    savedSearchId: string
  ): Promise<Property[]> {
    const { data: savedSearch } = await supabase
      .from('mod_realestate.saved_searches')
      .select('criteria, site_id')
      .eq('id', savedSearchId)
      .single();

    if (!savedSearch) throw new Error('Saved search not found');

    const criteria = savedSearch.criteria as PropertySearchCriteria;
    
    // Add status filter for active listings
    criteria.status = ['active', 'coming_soon'];

    const { properties } = await this.searchProperties(
      savedSearch.site_id,
      criteria,
      { limit: 50 }
    );

    return properties;
  }

  /**
   * Get market stats
   */
  async getMarketStats(
    siteId: string,
    city?: string
  ): Promise<{
    activeListings: number;
    averagePrice: number;
    averageDaysOnMarket: number;
    pricePerSqft: number;
    soldLast30Days: number;
    medianSoldPrice: number;
  }> {
    let query = supabase
      .from('mod_realestate.properties')
      .select('list_price, days_on_market, price_per_sqft, status, sold_price, sold_date')
      .eq('site_id', siteId);

    if (city) {
      query = query.eq('city', city);
    }

    const { data } = await query;

    const active = (data || []).filter(p => p.status === 'active');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSold = (data || []).filter(p => 
      p.status === 'sold' && 
      p.sold_date && 
      new Date(p.sold_date) >= thirtyDaysAgo
    );

    const avgPrice = active.length > 0
      ? active.reduce((sum, p) => sum + (p.list_price || 0), 0) / active.length
      : 0;

    const avgDom = active.length > 0
      ? active.reduce((sum, p) => sum + (p.days_on_market || 0), 0) / active.length
      : 0;

    const avgPpsf = active.length > 0
      ? active.reduce((sum, p) => sum + (p.price_per_sqft || 0), 0) / active.length
      : 0;

    const soldPrices = recentSold.map(p => p.sold_price || 0).sort((a, b) => a - b);
    const medianSoldPrice = soldPrices.length > 0
      ? soldPrices[Math.floor(soldPrices.length / 2)]
      : 0;

    return {
      activeListings: active.length,
      averagePrice: avgPrice,
      averageDaysOnMarket: avgDom,
      pricePerSqft: avgPpsf,
      soldLast30Days: recentSold.length,
      medianSoldPrice
    };
  }
}
```

---

### Task 3: Transaction Pipeline UI (2 hours)

```tsx
// src/modules/realestate/components/TransactionPipeline.tsx

'use client';

import { useState, useMemo } from 'react';
import {
  Home,
  DollarSign,
  Calendar,
  FileText,
  User,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
  Avatar,
  ScrollArea
} from '@/components/ui';

interface Transaction {
  id: string;
  property: {
    id: string;
    address_line1: string;
    city: string;
    state: string;
    list_price: number;
    photos: Array<{ url: string; is_primary: boolean }>;
  };
  buyer_contact?: { first_name: string; last_name: string };
  seller_contact?: { first_name: string; last_name: string };
  representation: 'buyer' | 'seller' | 'dual';
  contract_price: number;
  our_commission_amount: number;
  closing_date?: string;
  status: string;
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    due_date?: string;
  }>;
}

interface TransactionPipelineProps {
  transactions: Transaction[];
  onViewTransaction: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const STAGES = [
  { key: 'pending', label: 'Pending', color: 'bg-gray-500' },
  { key: 'active', label: 'Active', color: 'bg-blue-500' },
  { key: 'under_contract', label: 'Under Contract', color: 'bg-purple-500' },
  { key: 'inspection', label: 'Inspection', color: 'bg-yellow-500' },
  { key: 'appraisal', label: 'Appraisal', color: 'bg-orange-500' },
  { key: 'financing', label: 'Financing', color: 'bg-pink-500' },
  { key: 'closing', label: 'Closing', color: 'bg-green-500' }
];

export function TransactionPipeline({
  transactions,
  onViewTransaction,
  onUpdateStatus
}: TransactionPipelineProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Group transactions by stage
  const transactionsByStage = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    STAGES.forEach(stage => {
      grouped[stage.key] = transactions.filter(t => t.status === stage.key);
    });
    return grouped;
  }, [transactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const active = transactions.filter(t => 
      !['closed', 'cancelled', 'fell_through'].includes(t.status)
    );
    return {
      count: active.length,
      volume: active.reduce((sum, t) => sum + (t.contract_price || 0), 0),
      commission: active.reduce((sum, t) => sum + (t.our_commission_amount || 0), 0)
    };
  }, [transactions]);

  const getCompletedTasks = (tasks: Transaction['tasks']) => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    return { completed, total: tasks.length, percentage: (completed / tasks.length) * 100 };
  };

  const getOverdueTasks = (tasks: Transaction['tasks']) => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      t.due_date < today
    ).length;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Transactions</p>
                <p className="text-2xl font-bold">{totals.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Home className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Volume</p>
                <p className="text-2xl font-bold">
                  ${(totals.volume / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected GCI</p>
                <p className="text-2xl font-bold">
                  ${(totals.commission / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STAGES.map(stage => (
          <Button
            key={stage.key}
            variant={selectedStage === stage.key ? 'default' : 'outline'}
            onClick={() => setSelectedStage(
              selectedStage === stage.key ? null : stage.key
            )}
            className="whitespace-nowrap"
          >
            <div className={`w-2 h-2 rounded-full ${stage.color} mr-2`} />
            {stage.label}
            <Badge variant="secondary" className="ml-2">
              {transactionsByStage[stage.key]?.length || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Transaction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(selectedStage 
          ? transactionsByStage[selectedStage] 
          : transactions.filter(t => 
              !['closed', 'cancelled', 'fell_through'].includes(t.status)
            )
        ).map(transaction => {
          const taskProgress = getCompletedTasks(transaction.tasks);
          const overdueTasks = getOverdueTasks(transaction.tasks);
          const primaryPhoto = transaction.property.photos.find(p => p.is_primary);

          return (
            <Card
              key={transaction.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onViewTransaction(transaction.id)}
            >
              <CardContent className="p-0">
                {/* Property Image */}
                <div className="h-32 bg-muted relative">
                  {primaryPhoto ? (
                    <img
                      src={primaryPhoto.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge
                    className="absolute top-2 right-2"
                    variant={transaction.representation === 'buyer' ? 'default' : 'secondary'}
                  >
                    {transaction.representation === 'buyer' ? 'Buyer' : 
                     transaction.representation === 'seller' ? 'Seller' : 'Dual'}
                  </Badge>
                </div>

                <div className="p-4">
                  {/* Address */}
                  <h3 className="font-medium truncate">
                    {transaction.property.address_line1}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {transaction.property.city}, {transaction.property.state}
                  </p>

                  {/* Price & Commission */}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-lg font-bold">
                        ${(transaction.contract_price / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-muted-foreground">Contract</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ${(transaction.our_commission_amount / 1000).toFixed(1)}K
                      </p>
                      <p className="text-xs text-muted-foreground">GCI</p>
                    </div>
                  </div>

                  {/* Closing Date */}
                  {transaction.closing_date && (
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Closing: {new Date(transaction.closing_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Task Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Tasks</span>
                      <span>{taskProgress.completed}/{taskProgress.total}</span>
                    </div>
                    <Progress value={taskProgress.percentage} className="h-2" />
                    {overdueTasks > 0 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {overdueTasks} overdue
                      </p>
                    )}
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Avatar className="h-6 w-6">
                      <User className="h-4 w-4" />
                    </Avatar>
                    <span className="text-sm">
                      {transaction.representation === 'buyer' 
                        ? `${transaction.buyer_contact?.first_name} ${transaction.buyer_contact?.last_name}`
                        : `${transaction.seller_contact?.first_name} ${transaction.seller_contact?.last_name}`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {transactions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Active Transactions</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your deals by creating a new transaction.
            </p>
            <Button>Create Transaction</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Task 4: Property Listing Card (1 hour)

```tsx
// src/modules/realestate/components/PropertyCard.tsx

'use client';

import { useState } from 'react';
import {
  Heart,
  Share2,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Badge
} from '@/components/ui';

interface PropertyCardProps {
  property: {
    id: string;
    status: string;
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
    list_price: number;
    bedrooms: number;
    total_bathrooms: number;
    living_area_sqft: number;
    days_on_market?: number;
    photos: Array<{ url: string; is_primary: boolean }>;
    open_houses?: Array<{ start_time: string; end_time: string }>;
  };
  onView: (id: string) => void;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  isFavorited?: boolean;
}

export function PropertyCard({
  property,
  onView,
  onFavorite,
  onShare,
  isFavorited = false
}: PropertyCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = property.photos.length > 0 
    ? property.photos 
    : [{ url: '/placeholder-property.jpg', is_primary: true }];

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const getStatusBadge = () => {
    switch (property.status) {
      case 'active':
        return <Badge className="bg-green-500">For Sale</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'contingent':
        return <Badge className="bg-orange-500">Contingent</Badge>;
      case 'coming_soon':
        return <Badge className="bg-blue-500">Coming Soon</Badge>;
      case 'sold':
        return <Badge className="bg-gray-500">Sold</Badge>;
      default:
        return null;
    }
  };

  const upcomingOpenHouse = property.open_houses?.find(
    oh => new Date(oh.start_time) > new Date()
  );

  return (
    <Card
      className="overflow-hidden cursor-pointer group"
      onClick={() => onView(property.id)}
    >
      {/* Image Carousel */}
      <div className="relative h-48 bg-muted">
        <img
          src={photos[currentPhotoIndex].url}
          alt={property.address_line1}
          className="w-full h-full object-cover"
        />

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Photo Indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          {getStatusBadge()}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2">
          {onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(property.id);
              }}
              className="p-2 rounded-full bg-white shadow hover:bg-gray-100"
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
              />
            </button>
          )}
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(property.id);
              }}
              className="p-2 rounded-full bg-white shadow hover:bg-gray-100"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Open House Badge */}
        {upcomingOpenHouse && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-purple-500 text-white">
              <Calendar className="h-3 w-3 mr-1" />
              Open{' '}
              {new Date(upcomingOpenHouse.start_time).toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Badge>
          </div>
        )}
      </div>

      {/* Property Info */}
      <CardContent className="p-4">
        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-2xl font-bold">
            ${property.list_price.toLocaleString()}
          </p>
          {property.days_on_market !== undefined && property.days_on_market > 0 && (
            <span className="text-sm text-muted-foreground">
              {property.days_on_market} days
            </span>
          )}
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {property.bedrooms} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {property.total_bathrooms} ba
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-4 w-4" />
            {property.living_area_sqft.toLocaleString()} sqft
          </span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <span>
            {property.address_line1}, {property.city}, {property.state} {property.postal_code}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Property listings create/edit
- [ ] Photos upload and order
- [ ] Search filters work
- [ ] Leads/contacts track
- [ ] Showings schedule
- [ ] Transactions track pipeline
- [ ] Commission calculates
- [ ] Documents attach
- [ ] Tasks assign
- [ ] Activities log

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-50 (CRM)
- **Required by**: MLS integrations, e-signature integrations
- **External**: MLS RESO API, DocuSign, Google Maps
