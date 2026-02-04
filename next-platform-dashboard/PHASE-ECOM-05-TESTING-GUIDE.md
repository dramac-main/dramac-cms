# Phase ECOM-05: Customer Management System - Testing Guide

## Overview
This guide covers testing the Customer Management System implementation, including customer CRUD operations, addresses, groups, notes, and bulk actions.

---

## Prerequisites

### 1. Database Migration
Before testing, run this SQL migration in Supabase SQL Editor:

```sql
-- Phase ECOM-05: Customer Management Tables

-- Customers table
CREATE TABLE IF NOT EXISTS mod_ecommod01_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'guest')),
  is_guest BOOLEAN DEFAULT false,
  accepts_marketing BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  orders_count INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  average_order_value INTEGER DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  notes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, email)
);

-- Customer addresses
CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  label VARCHAR(100) DEFAULT 'Primary',
  is_default_billing BOOLEAN DEFAULT false,
  is_default_shipping BOOLEAN DEFAULT false,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(255),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer groups
CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, name)
);

-- Customer group members (junction table)
CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES mod_ecommod01_customer_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, group_id)
);

-- Customer notes
CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_site ON mod_ecommod01_customers(site_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON mod_ecommod01_customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON mod_ecommod01_customers(status);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON mod_ecommod01_customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_groups_site ON mod_ecommod01_customer_groups(site_id);
CREATE INDEX IF NOT EXISTS idx_customer_group_members_customer ON mod_ecommod01_customer_group_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_group_members_group ON mod_ecommod01_customer_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON mod_ecommod01_customer_notes(customer_id);

-- Enable RLS
ALTER TABLE mod_ecommod01_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Customers visible by agency" ON mod_ecommod01_customers
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for customer addresses
CREATE POLICY "Customer addresses by customer owner" ON mod_ecommod01_customer_addresses
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM mod_ecommod01_customers WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for customer groups
CREATE POLICY "Customer groups by site agency" ON mod_ecommod01_customer_groups
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for customer group members
CREATE POLICY "Group members by customer agency" ON mod_ecommod01_customer_group_members
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM mod_ecommod01_customers WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for customer notes
CREATE POLICY "Notes by customer agency" ON mod_ecommod01_customer_notes
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM mod_ecommod01_customers WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );
```

### 2. Insert Test Data (Optional)
```sql
-- Insert test customers (replace UUIDs with actual site_id and agency_id)
INSERT INTO mod_ecommod01_customers (site_id, agency_id, email, first_name, last_name, phone, status, orders_count, total_spent)
VALUES 
  ('YOUR_SITE_ID', 'YOUR_AGENCY_ID', 'john@example.com', 'John', 'Doe', '+1234567890', 'active', 5, 25000),
  ('YOUR_SITE_ID', 'YOUR_AGENCY_ID', 'jane@example.com', 'Jane', 'Smith', '+1987654321', 'active', 3, 15000),
  ('YOUR_SITE_ID', 'YOUR_AGENCY_ID', 'guest@example.com', 'Guest', 'User', NULL, 'guest', 0, 0);

-- Insert test customer group
INSERT INTO mod_ecommod01_customer_groups (site_id, name, description, discount_percentage, color)
VALUES ('YOUR_SITE_ID', 'VIP Customers', 'Premium customers with special discounts', 10.00, '#FFD700');
```

---

## Testing the Frontend UI

### Accessing Customers View

The CustomersView component needs to be integrated into the ecommerce dashboard. Follow these steps:

#### Step 1: Check if Integration Exists
Look for a "Customers" tab in the e-commerce module dashboard at:
```
/dashboard/[siteId]/modules/ecommerce
```

#### Step 2: Manual Integration (if needed)
If the Customers tab doesn't exist, add it to the ecommerce dashboard:

```tsx
// In the ecommerce dashboard component (e.g., ecommerce-content.tsx)
import { CustomersView } from '@/modules/ecommerce/components/views'

// Add to tabs
<TabsTrigger value="customers">Customers</TabsTrigger>

// Add tab content
<TabsContent value="customers">
  <CustomersView 
    siteId={siteId} 
    agencyId={agencyId}
    userId={userId}
    userName={userName}
  />
</TabsContent>
```

---

## Feature Testing Checklist

### 1. Customers List (CustomersView)
- [ ] View all customers in a table format
- [ ] See customer stats cards (Total, Active, With Orders, Revenue)
- [ ] Search customers by name, email, or phone
- [ ] Filter by status (Active, Inactive, Guest)
- [ ] Filter by "Has Orders" (Yes/No)
- [ ] Filter by marketing subscription status
- [ ] Clear all filters
- [ ] Pagination works (if 20+ customers)

### 2. Customer Table (CustomerTable)
- [ ] Sort by Customer name (ascending/descending)
- [ ] Sort by Orders count
- [ ] Sort by Total Spent
- [ ] Select individual customers via checkbox
- [ ] Select all customers on page
- [ ] View customer status badges (colored)
- [ ] Click customer name to view details
- [ ] Actions dropdown (View, Edit, Send Email, Delete)

### 3. Bulk Actions
- [ ] Select multiple customers
- [ ] See bulk action bar appear
- [ ] "Set Active" changes selected customers to active
- [ ] "Set Inactive" changes selected customers to inactive  
- [ ] "Export" exports selected customers
- [ ] "Delete" removes selected customers (with confirmation)
- [ ] Clear selection button works

### 4. Customer Detail Dialog (CustomerDetailDialog)
- [ ] Opens when clicking customer name
- [ ] Shows customer avatar/initials
- [ ] Shows status badge and marketing subscription
- [ ] Stats row shows Orders, Total Spent, Avg Order, Last Order
- [ ] Info tab shows contact details
- [ ] Info tab shows addresses (if any)
- [ ] Info tab shows groups and tags
- [ ] Orders tab shows recent order history
- [ ] Orders tab can click to view order details
- [ ] Notes tab shows existing notes
- [ ] Notes tab can add new notes
- [ ] Note shows author and timestamp

### 5. Import/Export
- [ ] Export as CSV downloads file
- [ ] Export as Excel downloads file
- [ ] Import button accepts .csv files
- [ ] Import shows success/failure counts
- [ ] New customers appear after import

---

## API Testing (Server Actions)

Test these actions in the browser console or via the UI:

```typescript
// Import the actions
import { 
  getCustomers,
  getCustomerDetail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
} from '@/modules/ecommerce'

// Test get customers
const customers = await getCustomers(siteId)
console.log('Customers:', customers)

// Test customer stats
const stats = await getCustomerStats(siteId)
console.log('Stats:', stats)

// Test customer detail
const detail = await getCustomerDetail(siteId, customerId)
console.log('Detail:', detail)
```

---

## Files Created/Modified

### New Files
| File | Description |
|------|-------------|
| `actions/customer-actions.ts` | 20+ server actions for customer management |
| `components/customers/customer-table.tsx` | TanStack Table component for customer list |
| `components/customers/customer-detail-dialog.tsx` | Dialog for viewing customer details |
| `components/views/customers-view.tsx` | Main customers management view |
| `components/customers/index.ts` | Customer component exports |

### Modified Files
| File | Changes |
|------|---------|
| `types/ecommerce-types.ts` | Added 15+ customer-related types |
| `components/views/index.ts` | Added CustomersView export |
| `index.ts` | Added customer action exports |

---

## Troubleshooting

### "Cannot read property of undefined" on customers
- Ensure database migration has been run
- Check that site_id and agency_id are valid UUIDs
- Verify RLS policies allow your user access

### Customer stats showing zeros
- Stats query needs actual customer data
- Check that orders are linked to customers via customer_id

### Import failing
- CSV must have headers: email, first_name, last_name
- Email column is required
- Check for duplicate emails

### Customer not appearing after creation
- Check browser console for errors
- Verify email is unique for the site
- Ensure agency membership is correct

---

## Next Steps

After ECOM-05:
- ECOM-06: Inventory Management System
- ECOM-07: Analytics & Reporting Dashboard
- ECOM-08: Checkout & Payment Processing
