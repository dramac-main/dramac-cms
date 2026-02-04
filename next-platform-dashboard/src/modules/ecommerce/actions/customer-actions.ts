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
  BulkActionResult,
  CustomerStats,
  Order
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

  // Get groups via junction table
  const { data: groupMemberships } = await supabase
    .from(`${TABLE_PREFIX}_customer_group_members`)
    .select('group_id')
    .eq('customer_id', customerId)

  // Get group details if memberships exist
  let groups: CustomerGroup[] = []
  if (groupMemberships && groupMemberships.length > 0) {
    const groupIds = groupMemberships.map((m: { group_id: string }) => m.group_id)
    const { data: groupsData } = await supabase
      .from(`${TABLE_PREFIX}_customer_groups`)
      .select('*')
      .in('id', groupIds)
    groups = groupsData || []
  }

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
    groups,
    notes: notes || [],
    recent_orders: (recentOrders || []) as Order[]
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
    await supabase
      .from(`${TABLE_PREFIX}_customer_groups`)
      .update({ member_count: supabase.sql`member_count + 1` })
      .eq('id', groupId)
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
    await supabase
      .from(`${TABLE_PREFIX}_customer_groups`)
      .update({ member_count: supabase.sql`GREATEST(0, member_count - 1)` })
      .eq('id', groupId)
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
    await supabase
      .from(`${TABLE_PREFIX}_customers`)
      .update({ notes_count: supabase.sql`notes_count + 1` })
      .eq('id', customerId)
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
    await supabase
      .from(`${TABLE_PREFIX}_customers`)
      .update({ notes_count: supabase.sql`GREATEST(0, notes_count - 1)` })
      .eq('id', customerId)
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
export async function getCustomerStats(siteId: string): Promise<CustomerStats> {
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
    active: customers.filter((c: { status: string }) => c.status === 'active').length,
    guests: customers.filter((c: { is_guest: boolean }) => c.is_guest).length,
    withOrders: customers.filter((c: { orders_count: number }) => c.orders_count > 0).length,
    newThisMonth: customers.filter((c: { created_at: string }) => new Date(c.created_at) >= startOfMonth).length,
    totalRevenue: customers.reduce((sum: number, c: { total_spent: number }) => sum + (c.total_spent || 0), 0)
  }
}
