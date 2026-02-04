# PHASE-ECOM-05: Customer Management System

> **Priority**: 🟠 HIGH
> **Estimated Time**: 10-12 hours
> **Prerequisites**: PHASE-ECOM-01 (Dashboard Redesign), PHASE-ECOM-04 (Order Management)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Implement a comprehensive customer management system with customer list, detail views, customer groups, purchase history, notes, import/export, and guest customer handling. This phase enables proper customer relationship management for e-commerce operations.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-01 is complete and tested
- [ ] PHASE-ECOM-04 is complete (for order history integration)
- [ ] Review existing customer-related types
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Customers View
├── Header
│   ├── Title & Count
│   ├── Add Customer Button
│   └── Import/Export
├── Filters Bar
│   ├── Search (Name, Email, Phone)
│   ├── Customer Group Filter
│   ├── Status Filter (Active, Guest, Inactive)
│   └── Date Range (Registered)
├── Customer Table
│   ├── Checkbox Column
│   ├── Customer Name + Avatar
│   ├── Email
│   ├── Phone
│   ├── Orders Count
│   ├── Total Spent
│   ├── Group Badge
│   ├── Status
│   └── Actions Menu
├── Bulk Actions Bar
│   ├── Assign to Group
│   ├── Send Email
│   ├── Export Selected
│   └── Delete
└── Customer Detail Dialog/Page
    ├── Header (Name, Avatar, Status)
    ├── Contact Info
    ├── Address Book
    ├── Order History
    ├── Purchase Stats
    ├── Notes
    ├── Groups
    └── Activity Timeline
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/types/ecommerce-types.ts` | Modify | Add customer management types |
| `src/modules/ecommerce/actions/customer-actions.ts` | Create | Customer CRUD server actions |
| `src/modules/ecommerce/components/customers/customer-table.tsx` | Create | Main customer table |
| `src/modules/ecommerce/components/customers/customer-columns.tsx` | Create | Table column definitions |
| `src/modules/ecommerce/components/customers/customer-filters.tsx` | Create | Customer filtering |
| `src/modules/ecommerce/components/customers/customer-detail-dialog.tsx` | Create | Customer detail view |
| `src/modules/ecommerce/components/customers/customer-order-history.tsx` | Create | Order history tab |
| `src/modules/ecommerce/components/customers/customer-notes.tsx` | Create | Customer notes section |
| `src/modules/ecommerce/components/customers/customer-groups-dialog.tsx` | Create | Manage customer groups |
| `src/modules/ecommerce/components/customers/create-customer-dialog.tsx` | Create | Create new customer |
| `src/modules/ecommerce/components/customers/import-customers-dialog.tsx` | Create | CSV import dialog |
| `src/modules/ecommerce/components/customers/index.ts` | Create | Customer exports |
| `src/modules/ecommerce/components/views/customers-view.tsx` | Create | Main customers view |

---

## 📋 Implementation Tasks

### Task 5.1: Add Customer Management Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Add to end of file)

**Description**: Add comprehensive customer management types

```typescript
// ============================================================================
// CUSTOMER MANAGEMENT TYPES (Phase ECOM-05)
// ============================================================================

export type CustomerStatus = 'active' | 'inactive' | 'guest'

export interface Customer {
  id: string
  site_id: string
  agency_id: string
  user_id?: string // Linked auth user if registered
  
  // Contact Info
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  
  // Status
  status: CustomerStatus
  is_guest: boolean
  email_verified: boolean
  accepts_marketing: boolean
  
  // Stats (computed)
  orders_count: number
  total_spent: number
  average_order_value: number
  last_order_date?: string
  
  // Metadata
  tags: string[]
  metadata: Record<string, unknown>
  notes_count: number
  
  // Timestamps
  created_at: string
  updated_at: string
  last_seen_at?: string
}

export interface CustomerAddress {
  id: string
  customer_id: string
  label: string // 'Home', 'Work', 'Billing', 'Shipping'
  is_default_billing: boolean
  is_default_shipping: boolean
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface CustomerGroup {
  id: string
  site_id: string
  name: string
  description?: string
  discount_percentage?: number
  color: string
  member_count: number
  created_at: string
  updated_at: string
}

export interface CustomerNote {
  id: string
  customer_id: string
  content: string
  user_id: string
  user_name: string
  created_at: string
}

export interface CustomerDetailData extends Customer {
  addresses: CustomerAddress[]
  groups: CustomerGroup[]
  notes: CustomerNote[]
  recent_orders: Order[]
}

export interface CustomerTableFilters {
  search: string
  status: CustomerStatus | 'all'
  group: string | 'all'
  hasOrders: boolean | null
  minSpent: number | null
  maxSpent: number | null
  dateFrom: string | null
  dateTo: string | null
  acceptsMarketing: boolean | null
}

export interface CustomerImportRow {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  address_line_1?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  tags?: string
  accepts_marketing?: boolean
}

export interface CustomerImportResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

export interface CustomerExportOptions {
  format: 'csv' | 'xlsx'
  includeFields: string[]
  filters?: CustomerTableFilters
  includeAddresses: boolean
  includeOrderStats: boolean
}

export type CustomerBulkAction = 
  | 'delete'
  | 'assign_group'
  | 'remove_group'
  | 'set_active'
  | 'set_inactive'
  | 'export'
  | 'send_email'
```

---

### Task 5.2: Create Customer Server Actions

**File**: `src/modules/ecommerce/actions/customer-actions.ts`
**Action**: Create

**Description**: Server actions for customer management

```typescript
/**
 * Customer Management Actions
 * 
 * Phase ECOM-05: Customer Management System
 * 
 * Server actions for managing customers, groups, and notes
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  Customer,
  CustomerDetailData,
  CustomerAddress,
  CustomerGroup,
  CustomerNote,
  CustomerTableFilters,
  CustomerImportRow,
  CustomerImportResult,
  CustomerExportOptions,
  CustomerBulkAction,
  BulkActionResult
} from '../types/ecommerce-types'

const TABLE_PREFIX = 'mod_ecommod01'

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ============================================================================
// CUSTOMER CRUD
// ============================================================================

/**
 * Get all customers for a site with filters
 */
export async function getCustomers(
  siteId: string,
  filters?: CustomerTableFilters
): Promise<Customer[]> {
  const supabase = await getModuleClient()

  let query = supabase
    .from(`${TABLE_PREFIX}_customers`)
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters) {
    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      )
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.hasOrders === true) {
      query = query.gt('orders_count', 0)
    } else if (filters.hasOrders === false) {
      query = query.eq('orders_count', 0)
    }

    if (filters.minSpent !== null) {
      query = query.gte('total_spent', filters.minSpent * 100)
    }

    if (filters.maxSpent !== null) {
      query = query.lte('total_spent', filters.maxSpent * 100)
    }

    if (filters.acceptsMarketing !== null) {
      query = query.eq('accepts_marketing', filters.acceptsMarketing)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return data || []
}

/**
 * Get customer by ID with full details
 */
export async function getCustomerDetail(
  siteId: string,
  customerId: string
): Promise<CustomerDetailData | null> {
  const supabase = await getModuleClient()

  // Get customer
  const { data: customer, error: customerError } = await supabase
    .from(`${TABLE_PREFIX}_customers`)
    .select('*')
    .eq('id', customerId)
    .eq('site_id', siteId)
    .single()

  if (customerError || !customer) return null

  // Get addresses
  const { data: addresses } = await supabase
    .from(`${TABLE_PREFIX}_customer_addresses`)
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default_billing', { ascending: false })

  // Get groups
  const { data: groupMemberships } = await supabase
    .from(`${TABLE_PREFIX}_customer_group_members`)
    .select(`
      group_id,
      group:${TABLE_PREFIX}_customer_groups(*)
    `)
    .eq('customer_id', customerId)

  // Get notes
  const { data: notes } = await supabase
    .from(`${TABLE_PREFIX}_customer_notes`)
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    ...customer,
    addresses: addresses || [],
    groups: groupMemberships?.map(m => m.group).filter(Boolean) || [],
    notes: notes || [],
    recent_orders: recentOrders || []
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(
  siteId: string,
  agencyId: string,
  customerData: Omit<Customer, 'id' | 'site_id' | 'agency_id' | 'created_at' | 'updated_at' | 'orders_count' | 'total_spent' | 'average_order_value' | 'notes_count'>
): Promise<Customer | null> {
  const supabase = await getModuleClient()

  // Check for duplicate email
  const { data: existing } = await supabase
    .from(`${TABLE_PREFIX}_customers`)
    .select('id')
    .eq('site_id', siteId)
    .eq('email', customerData.email)
    .single()

  if (existing) {
    throw new Error('A customer with this email already exists')
  }

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_customers`)
    .insert({
      site_id: siteId,
      agency_id: agencyId,
      ...customerData,
      orders_count: 0,
      total_spent: 0,
      average_order_value: 0,
      notes_count: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Update a customer
 */
export async function updateCustomer(
  siteId: string,
  customerId: string,
  updates: Partial<Customer>
): Promise<boolean> {
  const supabase = await getModuleClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customers`)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', customerId)
    .eq('site_id', siteId)

  return !error
}

/**
 * Delete a customer
 */
export async function deleteCustomer(
  siteId: string,
  customerId: string
): Promise<boolean> {
  const supabase = await getModuleClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customers`)
    .delete()
    .eq('id', customerId)
    .eq('site_id', siteId)

  return !error
}

// ============================================================================
// CUSTOMER ADDRESSES
// ============================================================================

/**
 * Add customer address
 */
export async function addCustomerAddress(
  customerId: string,
  address: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at' | 'updated_at'>
): Promise<CustomerAddress | null> {
  const supabase = await getModuleClient()

  // If this is default, unset other defaults
  if (address.is_default_billing) {
    await supabase
      .from(`${TABLE_PREFIX}_customer_addresses`)
      .update({ is_default_billing: false })
      .eq('customer_id', customerId)
  }

  if (address.is_default_shipping) {
    await supabase
      .from(`${TABLE_PREFIX}_customer_addresses`)
      .update({ is_default_shipping: false })
      .eq('customer_id', customerId)
  }

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_customer_addresses`)
    .insert({
      customer_id: customerId,
      ...address
    })
    .select()
    .single()

  if (error) return null
  return data
}

/**
 * Update customer address
 */
export async function updateCustomerAddress(
  addressId: string,
  updates: Partial<CustomerAddress>
): Promise<boolean> {
  const supabase = await getModuleClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customer_addresses`)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', addressId)

  return !error
}

/**
 * Delete customer address
 */
export async function deleteCustomerAddress(addressId: string): Promise<boolean> {
  const supabase = await getModuleClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customer_addresses`)
    .delete()
    .eq('id', addressId)

  return !error
}

// ============================================================================
// CUSTOMER GROUPS
// ============================================================================

/**
 * Get all customer groups
 */
export async function getCustomerGroups(siteId: string): Promise<CustomerGroup[]> {
  const supabase = await getModuleClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_customer_groups`)
    .select('*')
    .eq('site_id', siteId)
    .order('name')

  if (error) return []
  return data || []
}

/**
 * Create customer group
 */
export async function createCustomerGroup(
  siteId: string,
  group: Omit<CustomerGroup, 'id' | 'site_id' | 'member_count' | 'created_at' | 'updated_at'>
): Promise<CustomerGroup | null> {
  const supabase = await getModuleClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_customer_groups`)
    .insert({
      site_id: siteId,
      ...group,
      member_count: 0
    })
    .select()
    .single()

  if (error) return null
  return data
}

/**
 * Update customer group
 */
export async function updateCustomerGroup(
  groupId: string,
  updates: Partial<CustomerGroup>
): Promise<boolean> {
  const supabase = await getModuleClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customer_groups`)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId)

  return !error
}

/**
 * Delete customer group
 */
export async function deleteCustomerGroup(groupId: string): Promise<boolean> {
  const supabase = await getModuleClient()

  // First remove all members
  await supabase
    .from(`${TABLE_PREFIX}_customer_group_members`)
    .delete()
    .eq('group_id', groupId)

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customer_groups`)
    .delete()
    .eq('id', groupId)

  return !error
}

/**
 * Add customer to group
 */
export async function addCustomerToGroup(
  customerId: string,
  groupId: string
): Promise<boolean> {
  const supabase = await getModuleClient()

  // Check if already member
  const { data: existing } = await supabase
    .from(`${TABLE_PREFIX}_customer_group_members`)
    .select('id')
    .eq('customer_id', customerId)
    .eq('group_id', groupId)
    .single()

  if (existing) return true

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customer_group_members`)
    .insert({
      customer_id: customerId,
      group_id: groupId
    })

  if (!error) {
    // Update member count
    await supabase.rpc('increment_group_member_count', { group_id: groupId })
  }

  return !error
}

/**
 * Remove customer from group
 */
export async function removeCustomerFromGroup(
  customerId: string,
  groupId: string
): Promise<boolean> {
  const supabase = await getModuleClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customer_group_members`)
    .delete()
    .eq('customer_id', customerId)
    .eq('group_id', groupId)

  if (!error) {
    // Update member count
    await supabase.rpc('decrement_group_member_count', { group_id: groupId })
  }

  return !error
}

// ============================================================================
// CUSTOMER NOTES
// ============================================================================

/**
 * Add note to customer
 */
export async function addCustomerNote(
  customerId: string,
  content: string,
  userId: string,
  userName: string
): Promise<CustomerNote | null> {
  const supabase = await getModuleClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_customer_notes`)
    .insert({
      customer_id: customerId,
      content,
      user_id: userId,
      user_name: userName
    })
    .select()
    .single()

  if (!error) {
    // Update notes count
    await supabase.rpc('increment_customer_notes_count', { cust_id: customerId })
  }

  if (error) return null
  return data
}

/**
 * Delete customer note
 */
export async function deleteCustomerNote(
  noteId: string,
  customerId: string
): Promise<boolean> {
  const supabase = await getModuleClient()

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_customer_notes`)
    .delete()
    .eq('id', noteId)

  if (!error) {
    // Update notes count
    await supabase.rpc('decrement_customer_notes_count', { cust_id: customerId })
  }

  return !error
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

/**
 * Execute bulk action on customers
 */
export async function executeCustomerBulkAction(
  siteId: string,
  action: CustomerBulkAction,
  customerIds: string[],
  params?: Record<string, unknown>
): Promise<BulkActionResult> {
  const result: BulkActionResult = {
    success: true,
    affected: 0,
    errors: []
  }

  if (customerIds.length === 0) {
    return { success: false, affected: 0, errors: ['No customers selected'] }
  }

  const supabase = await getModuleClient()

  switch (action) {
    case 'delete': {
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_customers`)
        .delete()
        .eq('site_id', siteId)
        .in('id', customerIds)

      if (error) {
        result.success = false
        result.errors.push(error.message)
      } else {
        result.affected = customerIds.length
      }
      break
    }

    case 'set_active':
    case 'set_inactive': {
      const status = action === 'set_active' ? 'active' : 'inactive'
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_customers`)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('site_id', siteId)
        .in('id', customerIds)

      if (error) {
        result.success = false
        result.errors.push(error.message)
      } else {
        result.affected = customerIds.length
      }
      break
    }

    case 'assign_group': {
      const groupId = params?.groupId as string
      if (!groupId) {
        return { success: false, affected: 0, errors: ['Group ID is required'] }
      }

      for (const customerId of customerIds) {
        const success = await addCustomerToGroup(customerId, groupId)
        if (success) {
          result.affected++
        } else {
          result.errors.push(`Failed to add customer ${customerId} to group`)
        }
      }
      break
    }

    case 'remove_group': {
      const groupId = params?.groupId as string
      if (!groupId) {
        return { success: false, affected: 0, errors: ['Group ID is required'] }
      }

      for (const customerId of customerIds) {
        const success = await removeCustomerFromGroup(customerId, groupId)
        if (success) {
          result.affected++
        } else {
          result.errors.push(`Failed to remove customer ${customerId} from group`)
        }
      }
      break
    }

    case 'export':
    case 'send_email':
      // Handled client-side
      result.affected = customerIds.length
      break
  }

  return result
}

// ============================================================================
// IMPORT/EXPORT
// ============================================================================

/**
 * Import customers from CSV data
 */
export async function importCustomers(
  siteId: string,
  agencyId: string,
  rows: CustomerImportRow[]
): Promise<CustomerImportResult> {
  const result: CustomerImportResult = {
    success: true,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: []
  }

  const supabase = await getModuleClient()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // Account for header

    try {
      // Validate required fields
      if (!row.email || !row.email.includes('@')) {
        result.errors.push({ row: rowNumber, message: 'Valid email is required' })
        result.skipped++
        continue
      }

      if (!row.first_name) {
        result.errors.push({ row: rowNumber, message: 'First name is required' })
        result.skipped++
        continue
      }

      // Check if customer exists
      const { data: existing } = await supabase
        .from(`${TABLE_PREFIX}_customers`)
        .select('id')
        .eq('site_id', siteId)
        .eq('email', row.email.toLowerCase().trim())
        .single()

      const customerData = {
        first_name: row.first_name.trim(),
        last_name: row.last_name?.trim() || '',
        email: row.email.toLowerCase().trim(),
        phone: row.phone?.trim() || null,
        status: 'active' as const,
        is_guest: false,
        email_verified: false,
        accepts_marketing: row.accepts_marketing ?? false,
        tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
        metadata: {}
      }

      if (existing) {
        // Update existing customer
        const { error } = await supabase
          .from(`${TABLE_PREFIX}_customers`)
          .update({
            ...customerData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) {
          result.errors.push({ row: rowNumber, message: error.message })
          result.skipped++
        } else {
          result.updated++
        }
      } else {
        // Create new customer
        const { data: newCustomer, error } = await supabase
          .from(`${TABLE_PREFIX}_customers`)
          .insert({
            site_id: siteId,
            agency_id: agencyId,
            ...customerData,
            orders_count: 0,
            total_spent: 0,
            average_order_value: 0,
            notes_count: 0
          })
          .select()
          .single()

        if (error) {
          result.errors.push({ row: rowNumber, message: error.message })
          result.skipped++
        } else {
          result.imported++

          // Add address if provided
          if (row.address_line_1 && row.city && row.country && newCustomer) {
            await addCustomerAddress(newCustomer.id, {
              label: 'Primary',
              is_default_billing: true,
              is_default_shipping: true,
              first_name: row.first_name,
              last_name: row.last_name || '',
              company: row.company,
              address_line_1: row.address_line_1,
              city: row.city,
              state: row.state || '',
              postal_code: row.postal_code || '',
              country: row.country
            })
          }
        }
      }
    } catch (err) {
      result.errors.push({
        row: rowNumber,
        message: err instanceof Error ? err.message : 'Unknown error'
      })
      result.skipped++
    }
  }

  result.success = result.errors.length === 0

  return result
}

/**
 * Export customers to CSV
 */
export async function exportCustomers(
  siteId: string,
  options: CustomerExportOptions
): Promise<{ data: string; filename: string }> {
  const customers = await getCustomers(siteId, options.filters)

  const fields = options.includeFields.length > 0
    ? options.includeFields
    : ['first_name', 'last_name', 'email', 'phone', 'status', 'orders_count', 'total_spent']

  const fieldLabels: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    status: 'Status',
    is_guest: 'Guest',
    email_verified: 'Email Verified',
    accepts_marketing: 'Accepts Marketing',
    orders_count: 'Orders',
    total_spent: 'Total Spent',
    average_order_value: 'Avg Order Value',
    created_at: 'Created',
    last_order_date: 'Last Order',
    tags: 'Tags'
  }

  // Header row
  const headers = fields.map(f => fieldLabels[f] || f)

  // Data rows
  const rows = customers.map(customer => {
    return fields.map(field => {
      let value = customer[field as keyof Customer]

      // Handle special fields
      if (field === 'total_spent' || field === 'average_order_value') {
        value = value ? ((value as number) / 100).toFixed(2) : '0.00'
      } else if (field === 'tags' && Array.isArray(value)) {
        value = value.join(', ')
      } else if (typeof value === 'boolean') {
        value = value ? 'Yes' : 'No'
      } else if (value === null || value === undefined) {
        value = ''
      }

      // Escape CSV
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `customers-export-${timestamp}.csv`

  return { data: csvContent, filename }
}

// ============================================================================
// STATS
// ============================================================================

/**
 * Get customer statistics
 */
export async function getCustomerStats(siteId: string): Promise<{
  total: number
  active: number
  guests: number
  withOrders: number
  newThisMonth: number
  totalRevenue: number
}> {
  const supabase = await getModuleClient()

  const { data: customers } = await supabase
    .from(`${TABLE_PREFIX}_customers`)
    .select('status, is_guest, orders_count, total_spent, created_at')
    .eq('site_id', siteId)

  if (!customers) {
    return { total: 0, active: 0, guests: 0, withOrders: 0, newThisMonth: 0, totalRevenue: 0 }
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    guests: customers.filter(c => c.is_guest).length,
    withOrders: customers.filter(c => c.orders_count > 0).length,
    newThisMonth: customers.filter(c => new Date(c.created_at) >= startOfMonth).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
  }
}
```

---

### Task 5.3: Create Customer Table Component

**File**: `src/modules/ecommerce/components/customers/customer-table.tsx`
**Action**: Create

**Description**: Main customer data table with all features

```typescript
/**
 * Customer Table Component
 * 
 * Phase ECOM-05: Customer Management System
 * 
 * Data table for customers with filtering and bulk actions
 */
'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  RowSelectionState
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Customer, CustomerStatus, CustomerGroup, CustomerBulkAction } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CustomerTableProps {
  customers: Customer[]
  groups: CustomerGroup[]
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customerId: string) => void
  onBulkAction: (action: CustomerBulkAction, customerIds: string[], params?: Record<string, unknown>) => Promise<void>
  isLoading?: boolean
  currency?: string
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
  active: { 
    label: 'Active', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  inactive: { 
    label: 'Inactive', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  },
  guest: { 
    label: 'Guest', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount / 100)
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerTable({
  customers,
  groups,
  onView,
  onEdit,
  onDelete,
  onBulkAction,
  isLoading = false,
  currency = 'USD'
}: CustomerTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isBulkExecuting, setIsBulkExecuting] = useState(false)

  // Column definitions
  const columns = useMemo(() => [
    // Checkbox
    {
      id: 'select',
      header: ({ table }: { table: ReturnType<typeof useReactTable<Customer>> }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }: { row: { getIsSelected: () => boolean; toggleSelected: (value: boolean) => void } }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      size: 40
    },
    // Customer
    {
      accessorKey: 'first_name',
      header: ({ column }: { column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' } }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: { row: { original: Customer } }) => {
        const customer = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={customer.avatar_url} />
              <AvatarFallback>
                {getInitials(customer.first_name, customer.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div 
                className="font-medium hover:text-primary cursor-pointer"
                onClick={() => onView(customer)}
              >
                {customer.first_name} {customer.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {customer.email}
              </div>
            </div>
          </div>
        )
      }
    },
    // Status
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Customer } }) => {
        const status = row.original.status
        const config = statusConfig[status]
        return (
          <Badge className={cn('text-xs', config.className)}>
            {config.label}
          </Badge>
        )
      }
    },
    // Orders
    {
      accessorKey: 'orders_count',
      header: ({ column }: { column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' } }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Orders
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: { row: { original: Customer } }) => row.original.orders_count
    },
    // Total Spent
    {
      accessorKey: 'total_spent',
      header: ({ column }: { column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' } }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total Spent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: { row: { original: Customer } }) => formatCurrency(row.original.total_spent, currency)
    },
    // Actions
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Customer } }) => {
        const customer = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(customer)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(customer)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(customer.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [currency, onView, onEdit, onDelete])

  // Table instance
  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection
    },
    initialState: {
      pagination: { pageSize: 20 }
    }
  })

  // Selected customer IDs
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter(key => rowSelection[key])
      .map(key => {
        const row = table.getRowModel().rows.find((_, i) => String(i) === key)
        return row?.original.id
      })
      .filter(Boolean) as string[]
  }, [rowSelection, table])

  // Bulk action handler
  const handleBulkAction = async (action: CustomerBulkAction, params?: Record<string, unknown>) => {
    setIsBulkExecuting(true)
    try {
      await onBulkAction(action, selectedIds, params)
      setRowSelection({})
    } finally {
      setIsBulkExecuting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 border rounded-lg">
          <Badge variant="secondary">{selectedIds.length} selected</Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Clear
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('set_active')}
            disabled={isBulkExecuting}
          >
            Set Active
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('set_inactive')}
            disabled={isBulkExecuting}
          >
            Set Inactive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('export')}
            disabled={isBulkExecuting}
          >
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('delete')}
            disabled={isBulkExecuting}
            className="text-destructive"
          >
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 5.4: Create Customer Detail Dialog

**File**: `src/modules/ecommerce/components/customers/customer-detail-dialog.tsx`
**Action**: Create

**Description**: Comprehensive customer detail view

```typescript
/**
 * Customer Detail Dialog Component
 * 
 * Phase ECOM-05: Customer Management System
 * 
 * Full customer profile with orders, addresses, notes
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Package,
  DollarSign,
  Calendar,
  MessageSquare,
  Plus,
  Send
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getCustomerDetail, addCustomerNote } from '../../actions/customer-actions'
import type { CustomerDetailData, CustomerStatus, Order } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CustomerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  siteId: string
  userId: string
  userName: string
  onViewOrder?: (order: Order) => void
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
  active: { 
    label: 'Active', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  inactive: { 
    label: 'Inactive', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  },
  guest: { 
    label: 'Guest', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount / 100)
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerDetailDialog({
  open,
  onOpenChange,
  customerId,
  siteId,
  userId,
  userName,
  onViewOrder
}: CustomerDetailDialogProps) {
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Load customer data
  useEffect(() => {
    if (!open || !customerId) return

    async function loadCustomer() {
      setIsLoading(true)
      try {
        const data = await getCustomerDetail(siteId, customerId)
        setCustomer(data)
      } catch (error) {
        console.error('Error loading customer:', error)
        toast.error('Failed to load customer details')
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomer()
  }, [open, customerId, siteId])

  // Add note handler
  const handleAddNote = async () => {
    if (!newNote.trim() || !customer) return

    setIsAddingNote(true)
    try {
      const note = await addCustomerNote(customer.id, newNote.trim(), userId, userName)
      if (note) {
        setCustomer({
          ...customer,
          notes: [note, ...customer.notes]
        })
        setNewNote('')
        toast.success('Note added')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note')
    } finally {
      setIsAddingNote(false)
    }
  }

  if (isLoading || !customer) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const statusInfo = statusConfig[customer.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={customer.avatar_url} />
              <AvatarFallback className="text-xl">
                {getInitials(customer.first_name, customer.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {customer.first_name} {customer.last_name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-xs', statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
                {customer.is_guest && (
                  <Badge variant="outline" className="text-xs">Guest</Badge>
                )}
                {customer.accepts_marketing && (
                  <Badge variant="outline" className="text-xs">Marketing</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Package className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{customer.orders_count}</div>
              <div className="text-xs text-muted-foreground">Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{formatCurrency(customer.total_spent)}</div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{formatCurrency(customer.average_order_value)}</div>
              <div className="text-xs text-muted-foreground">Avg Order</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-lg font-bold">
                {customer.last_order_date 
                  ? format(new Date(customer.last_order_date), 'MMM d')
                  : '—'}
              </div>
              <div className="text-xs text-muted-foreground">Last Order</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="orders">Orders ({customer.orders_count})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({customer.notes.length})</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-4 space-y-4">
            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="hover:text-primary">
                    {customer.email}
                  </a>
                  {customer.email_verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="hover:text-primary">
                      {customer.phone}
                    </a>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Customer since {format(new Date(customer.created_at), 'MMMM d, yyyy')}
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No addresses saved</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {customer.addresses.map((address) => (
                      <div key={address.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{address.label}</span>
                          {address.is_default_billing && (
                            <Badge variant="secondary" className="text-xs">Billing</Badge>
                          )}
                          {address.is_default_shipping && (
                            <Badge variant="secondary" className="text-xs">Shipping</Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-0.5">
                          <div>{address.first_name} {address.last_name}</div>
                          {address.company && <div>{address.company}</div>}
                          <div>{address.address_line_1}</div>
                          {address.address_line_2 && <div>{address.address_line_2}</div>}
                          <div>{address.city}, {address.state} {address.postal_code}</div>
                          <div>{address.country}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Groups & Tags */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Groups & Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Groups</div>
                  {customer.groups.length === 0 ? (
                    <p className="text-sm italic">No groups assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {customer.groups.map((group) => (
                        <Badge 
                          key={group.id}
                          style={{ backgroundColor: group.color }}
                          className="text-white"
                        >
                          {group.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Tags</div>
                  {customer.tags.length === 0 ? (
                    <p className="text-sm italic">No tags</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4">
            <ScrollArea className="h-[400px]">
              {customer.recent_orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders yet
                </div>
              ) : (
                <div className="space-y-3">
                  {customer.recent_orders.map((order) => (
                    <div 
                      key={order.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onViewOrder?.(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Order #{order.order_number}</div>
                        <Badge variant="secondary">{order.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(order.total, order.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4 space-y-4">
            {/* Add Note Form */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note about this customer..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isAddingNote}
                >
                  {isAddingNote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Add Note
                </Button>
              </div>
            </div>

            <Separator />

            {/* Notes List */}
            <ScrollArea className="h-[300px]">
              {customer.notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No notes yet
                </div>
              ) : (
                <div className="space-y-4">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="p-4 border rounded-lg">
                      <p className="text-sm">{note.content}</p>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>by {note.user_name}</span>
                        <span>
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 5.5: Create Customers View

**File**: `src/modules/ecommerce/components/views/customers-view.tsx`
**Action**: Create

**Description**: Main customers view with table, filters, and actions

```typescript
/**
 * Customers View Component
 * 
 * Phase ECOM-05: Customer Management System
 * 
 * Main customers management view
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Plus, 
  Search, 
  Users, 
  Download, 
  Upload,
  UserCheck,
  UserX,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { CustomerTable } from '../customers/customer-table'
import { CustomerDetailDialog } from '../customers/customer-detail-dialog'
import { 
  getCustomers, 
  getCustomerGroups,
  getCustomerStats,
  deleteCustomer,
  executeCustomerBulkAction,
  exportCustomers
} from '../../actions/customer-actions'
import type { 
  Customer, 
  CustomerGroup, 
  CustomerTableFilters, 
  CustomerBulkAction,
  CustomerStatus
} from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface CustomersViewProps {
  siteId: string
  agencyId: string
  userId: string
  userName: string
  onCreateCustomer?: () => void
  onImportCustomers?: () => void
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount / 100)
}

// ============================================================================
// DEFAULT FILTERS
// ============================================================================

const defaultFilters: CustomerTableFilters = {
  search: '',
  status: 'all',
  group: 'all',
  hasOrders: null,
  minSpent: null,
  maxSpent: null,
  dateFrom: null,
  dateTo: null,
  acceptsMarketing: null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomersView({
  siteId,
  agencyId,
  userId,
  userName,
  onCreateCustomer,
  onImportCustomers
}: CustomersViewProps) {
  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [stats, setStats] = useState<{
    total: number
    active: number
    guests: number
    withOrders: number
    newThisMonth: number
    totalRevenue: number
  } | null>(null)
  const [filters, setFilters] = useState<CustomerTableFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [customersData, groupsData, statsData] = await Promise.all([
        getCustomers(siteId, filters),
        getCustomerGroups(siteId),
        getCustomerStats(siteId)
      ])
      setCustomers(customersData)
      setGroups(groupsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers
  const handleView = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailDialog(true)
  }, [])

  const handleEdit = useCallback((customer: Customer) => {
    // Open edit dialog (to be implemented)
    console.log('Edit customer:', customer.id)
  }, [])

  const handleDelete = useCallback(async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const success = await deleteCustomer(siteId, customerId)
      if (success) {
        toast.success('Customer deleted')
        loadData()
      } else {
        toast.error('Failed to delete customer')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer')
    }
  }, [siteId, loadData])

  const handleBulkAction = useCallback(async (
    action: CustomerBulkAction,
    customerIds: string[],
    params?: Record<string, unknown>
  ) => {
    if (action === 'export') {
      // Handle export
      try {
        const { data, filename } = await exportCustomers(siteId, {
          format: 'csv',
          includeFields: ['first_name', 'last_name', 'email', 'phone', 'status', 'orders_count', 'total_spent'],
          includeAddresses: false,
          includeOrderStats: true
        })
        
        const blob = new Blob([data], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        
        toast.success('Customers exported')
      } catch (error) {
        console.error('Error exporting:', error)
        toast.error('Failed to export customers')
      }
      return
    }

    try {
      const result = await executeCustomerBulkAction(siteId, action, customerIds, params)
      
      if (result.success) {
        toast.success(`${result.affected} customers updated`)
        loadData()
      } else {
        toast.error(result.errors.join(', '))
      }
    } catch (error) {
      console.error('Error executing bulk action:', error)
      toast.error('Bulk action failed')
    }
  }, [siteId, loadData])

  const handleFilterChange = (key: keyof CustomerTableFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Customers</h2>
          <p className="text-sm text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onImportCustomers}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={onCreateCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <UserX className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.guests}</div>
                  <div className="text-xs text-muted-foreground">Guests</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.withOrders}</div>
                  <div className="text-xs text-muted-foreground">With Orders</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>

          {groups.length > 0 && (
            <Select
              value={filters.group}
              onValueChange={(value) => handleFilterChange('group', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Customer Table */}
      <CustomerTable
        customers={customers}
        groups={groups}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        isLoading={isLoading}
      />

      {/* Customer Detail Dialog */}
      {selectedCustomer && (
        <CustomerDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          customerId={selectedCustomer.id}
          siteId={siteId}
          userId={userId}
          userName={userName}
        />
      )}
    </div>
  )
}
```

---

### Task 5.6: Create Customers Exports

**File**: `src/modules/ecommerce/components/customers/index.ts`
**Action**: Create

**Description**: Export all customer components

```typescript
/**
 * E-Commerce Customer Components
 * 
 * Phase ECOM-05: Customer Management System
 */

export { CustomerTable } from './customer-table'
export { CustomerDetailDialog } from './customer-detail-dialog'
// Export additional components as they are created
```

---

## 🗄️ Database Migration

**File**: `migrations/XXXX_customer_management.sql`

```sql
-- Customer Management Tables
-- Phase ECOM-05: Customer Management System

-- Customers Table
CREATE TABLE IF NOT EXISTS mod_ecommod01_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Contact Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  is_guest BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  accepts_marketing BOOLEAN DEFAULT false,
  
  -- Stats (computed/cached)
  orders_count INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  average_order_value INTEGER DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  notes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(site_id, email)
);

CREATE INDEX idx_customers_site ON mod_ecommod01_customers(site_id);
CREATE INDEX idx_customers_email ON mod_ecommod01_customers(email);
CREATE INDEX idx_customers_status ON mod_ecommod01_customers(status);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  is_default_billing BOOLEAN DEFAULT false,
  is_default_shipping BOOLEAN DEFAULT false,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(255),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_customer ON mod_ecommod01_customer_addresses(customer_id);

-- Customer Groups
CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5,2),
  color VARCHAR(7) DEFAULT '#6366f1',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, name)
);

CREATE INDEX idx_customer_groups_site ON mod_ecommod01_customer_groups(site_id);

-- Customer Group Members (Junction Table)
CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES mod_ecommod01_customer_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, group_id)
);

CREATE INDEX idx_group_members_customer ON mod_ecommod01_customer_group_members(customer_id);
CREATE INDEX idx_group_members_group ON mod_ecommod01_customer_group_members(group_id);

-- Customer Notes
CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_notes_customer ON mod_ecommod01_customer_notes(customer_id);

-- RLS Policies
ALTER TABLE mod_ecommod01_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_notes ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION increment_group_member_count(group_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE mod_ecommod01_customer_groups
  SET member_count = member_count + 1
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_group_member_count(group_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE mod_ecommod01_customer_groups
  SET member_count = GREATEST(0, member_count - 1)
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_customer_notes_count(cust_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE mod_ecommod01_customers
  SET notes_count = notes_count + 1
  WHERE id = cust_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_customer_notes_count(cust_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE mod_ecommod01_customers
  SET notes_count = GREATEST(0, notes_count - 1)
  WHERE id = cust_id;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Customers view loads with stats
- [ ] Customer table displays all columns
- [ ] Search filters customers correctly
- [ ] Status filter works
- [ ] Customer detail dialog opens
- [ ] Customer info tab displays correctly
- [ ] Orders tab shows order history
- [ ] Notes can be added and displayed
- [ ] Bulk actions execute correctly
- [ ] CSV export generates valid file
- [ ] Database migrations apply cleanly
- [ ] RLS policies work correctly

---

## 🔄 Rollback Plan

If issues occur:
1. Remove customer components and views
2. Remove customer actions file
3. Revert type additions
4. Drop new database tables

```bash
rm -rf src/modules/ecommerce/components/customers/
rm src/modules/ecommerce/components/views/customers-view.tsx
rm src/modules/ecommerce/actions/customer-actions.ts
```

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add "✅ PHASE-ECOM-05: Customer Management System Complete"
- `progress.md`: Update e-commerce section with customer management status

---

## ✨ Success Criteria

- [ ] Customers view displays with statistics
- [ ] Customer table supports sorting, selection, pagination
- [ ] Customer detail shows all information
- [ ] Customer notes can be added
- [ ] Customer groups can be managed
- [ ] Bulk actions work correctly
- [ ] Import/export functions work
- [ ] All database tables created with proper indexes
- [ ] TypeScript compiles with zero errors
