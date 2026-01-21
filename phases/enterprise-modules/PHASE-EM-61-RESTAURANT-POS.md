# Phase EM-61: Restaurant POS Module

> **Priority**: 🟡 MEDIUM (Industry Vertical)
> **Estimated Time**: 30-35 hours
> **Prerequisites**: EM-01, EM-11, EM-52 (E-Commerce)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **restaurant point-of-sale system** (similar to Toast/Square for Restaurants):
1. Menu management with modifiers
2. Table management and floor plan
3. Order taking and kitchen display
4. Payment processing
5. Inventory tracking
6. Staff tips and splits

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   RESTAURANT POS MODULE                              │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   MENU          │   ORDERS        │     OPERATIONS                  │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Categories      │ Table Orders    │ Floor Plan                      │
│ Items           │ Takeout/Delivery│ Kitchen Display                 │
│ Modifiers       │ Tabs            │ Inventory                       │
│ Combos          │ Payments        │ Reporting                       │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (2 hours)

```sql
-- migrations/em-61-restaurant-pos-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}

-- Menu Categories
CREATE TABLE mod_pos.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Display
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  
  -- Availability
  available_start TIME,
  available_end TIME,
  available_days BOOLEAN[] DEFAULT ARRAY[true, true, true, true, true, true, true],
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE mod_pos.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  category_id UUID REFERENCES mod_pos.categories(id),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  
  -- SKU/PLU
  sku TEXT,
  plu_code TEXT,
  barcode TEXT,
  
  -- Display
  image_url TEXT,
  color TEXT,
  
  -- Options
  is_alcoholic BOOLEAN DEFAULT false,
  is_taxable BOOLEAN DEFAULT true,
  tax_rate DECIMAL(5,2),
  
  -- Prep
  prep_time_minutes INTEGER,
  prep_station TEXT,
  
  -- Inventory
  track_inventory BOOLEAN DEFAULT false,
  current_stock INTEGER,
  low_stock_alert INTEGER,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  available_start TIME,
  available_end TIME,
  
  -- Dietary
  dietary_tags TEXT[],
  allergens TEXT[],
  calories INTEGER,
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifier Groups
CREATE TABLE mod_pos.modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  
  -- Rules
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT false,
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifiers
CREATE TABLE mod_pos.modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES mod_pos.modifier_groups(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  
  -- Pricing
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  
  -- Default
  is_default BOOLEAN DEFAULT false,
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item Modifier Group Links
CREATE TABLE mod_pos.item_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES mod_pos.menu_items(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES mod_pos.modifier_groups(id) ON DELETE CASCADE,
  
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(item_id, modifier_group_id)
);

-- Combos/Meals
CREATE TABLE mod_pos.combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  
  image_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Combo Items
CREATE TABLE mod_pos.combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES mod_pos.combos(id) ON DELETE CASCADE,
  
  -- Item or category selection
  menu_item_id UUID REFERENCES mod_pos.menu_items(id),
  category_id UUID REFERENCES mod_pos.categories(id),
  
  -- If category, how many to pick
  quantity INTEGER DEFAULT 1,
  
  sort_order INTEGER DEFAULT 0
);

-- Floor Plan / Tables
CREATE TABLE mod_pos.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  section TEXT,
  
  -- Capacity
  min_capacity INTEGER DEFAULT 1,
  max_capacity INTEGER DEFAULT 4,
  
  -- Position on floor plan
  position_x INTEGER,
  position_y INTEGER,
  width INTEGER DEFAULT 100,
  height INTEGER DEFAULT 100,
  shape TEXT DEFAULT 'rectangle' CHECK (shape IN ('rectangle', 'circle', 'oval')),
  rotation INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN (
    'available', 'occupied', 'reserved', 'dirty', 'blocked'
  )),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE mod_pos.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Order number
  order_number INTEGER NOT NULL,
  
  -- Type
  order_type TEXT NOT NULL CHECK (order_type IN (
    'dine_in', 'takeout', 'delivery', 'bar_tab'
  )),
  
  -- Table (for dine-in)
  table_id UUID REFERENCES mod_pos.tables(id),
  
  -- Customer
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Delivery info
  delivery_address TEXT,
  delivery_notes TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'sent', 'preparing', 'ready', 'served', 'paid', 'cancelled', 'void'
  )),
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Totals
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  
  -- Discount
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'item')),
  discount_value DECIMAL(10,2),
  discount_reason TEXT,
  
  -- Staff
  server_id UUID,
  
  -- Notes
  notes TEXT,
  
  -- Guest count
  guest_count INTEGER DEFAULT 1,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE mod_pos.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mod_pos.orders(id) ON DELETE CASCADE,
  
  menu_item_id UUID REFERENCES mod_pos.menu_items(id),
  combo_id UUID REFERENCES mod_pos.combos(id),
  
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  modifiers_price DECIMAL(10,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'preparing', 'ready', 'served', 'void'
  )),
  
  -- Kitchen
  prep_station TEXT,
  sent_to_kitchen_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Seat number
  seat_number INTEGER,
  
  -- Course
  course TEXT DEFAULT 'main' CHECK (course IN ('appetizer', 'soup', 'salad', 'main', 'dessert', 'beverage')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Item Modifiers
CREATE TABLE mod_pos.order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES mod_pos.order_items(id) ON DELETE CASCADE,
  
  modifier_id UUID REFERENCES mod_pos.modifiers(id),
  
  name TEXT NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0
);

-- Payments
CREATE TABLE mod_pos.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  order_id UUID NOT NULL REFERENCES mod_pos.orders(id),
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Method
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'cash', 'credit_card', 'debit_card', 'gift_card', 'mobile_pay', 'comp', 'split'
  )),
  
  -- Card details (for reference only)
  card_type TEXT,
  card_last_four TEXT,
  authorization_code TEXT,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN (
    'pending', 'completed', 'refunded', 'void'
  )),
  
  -- Change
  tendered DECIMAL(10,2),
  change_given DECIMAL(10,2),
  
  processed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Drawer Sessions
CREATE TABLE mod_pos.drawer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  terminal_id TEXT NOT NULL,
  
  -- Staff
  opened_by UUID NOT NULL,
  closed_by UUID,
  
  -- Timing
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  -- Money
  starting_cash DECIMAL(10,2) NOT NULL,
  expected_cash DECIMAL(10,2),
  actual_cash DECIMAL(10,2),
  difference DECIMAL(10,2),
  
  -- Totals
  cash_sales DECIMAL(12,2) DEFAULT 0,
  card_sales DECIMAL(12,2) DEFAULT 0,
  tips_cash DECIMAL(10,2) DEFAULT 0,
  tips_card DECIMAL(10,2) DEFAULT 0,
  
  -- Drops/Payouts
  cash_drops DECIMAL(10,2) DEFAULT 0,
  payouts DECIMAL(10,2) DEFAULT 0,
  
  notes TEXT,
  
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'audited'))
);

-- Kitchen Display Stations
CREATE TABLE mod_pos.kitchen_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  
  -- Items to show
  prep_stations TEXT[],
  categories UUID[],
  
  -- Display options
  show_all_items BOOLEAN DEFAULT false,
  auto_acknowledge BOOLEAN DEFAULT false,
  acknowledge_timeout_seconds INTEGER DEFAULT 300,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tips
CREATE TABLE mod_pos.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  order_id UUID REFERENCES mod_pos.orders(id),
  payment_id UUID REFERENCES mod_pos.payments(id),
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  
  -- Staff
  server_id UUID NOT NULL,
  
  -- Tip pool (if applicable)
  pool_contribution DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations
CREATE TABLE mod_pos.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Reservation
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 90,
  
  -- Table
  table_id UUID REFERENCES mod_pos.tables(id),
  
  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN (
    'pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'
  )),
  
  notes TEXT,
  special_requests TEXT,
  
  -- Deposit
  deposit_amount DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE mod_pos.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  
  -- Unit
  unit_of_measure TEXT DEFAULT 'each',
  
  -- Stock
  quantity_on_hand DECIMAL(10,2) DEFAULT 0,
  quantity_reserved DECIMAL(10,2) DEFAULT 0,
  reorder_point DECIMAL(10,2),
  reorder_quantity DECIMAL(10,2),
  
  -- Cost
  unit_cost DECIMAL(10,2),
  
  -- Supplier
  supplier_id UUID,
  supplier_sku TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Item Ingredients (for inventory tracking)
CREATE TABLE mod_pos.item_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES mod_pos.menu_items(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES mod_pos.inventory(id),
  
  quantity_used DECIMAL(10,4) NOT NULL,
  
  UNIQUE(menu_item_id, inventory_id)
);

-- Indexes
CREATE INDEX idx_pos_orders_date ON mod_pos.orders(created_at DESC);
CREATE INDEX idx_pos_orders_status ON mod_pos.orders(site_id, status);
CREATE INDEX idx_pos_orders_table ON mod_pos.orders(table_id, status);
CREATE INDEX idx_pos_order_items_status ON mod_pos.order_items(status);
CREATE INDEX idx_pos_menu_items_category ON mod_pos.menu_items(category_id, is_active);
CREATE INDEX idx_pos_reservations_date ON mod_pos.reservations(reservation_date, status);

-- Enable RLS
ALTER TABLE mod_pos.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_pos.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_pos.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_pos.tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON mod_pos.orders
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_pos.menu_items
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_pos.payments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Order Service (2.5 hours)

```typescript
// src/modules/pos/services/order-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface OrderItem {
  menu_item_id?: string;
  combo_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers?: Array<{
    modifier_id: string;
    name: string;
    price_adjustment: number;
  }>;
  notes?: string;
  seat_number?: number;
  course?: string;
}

export interface Order {
  id: string;
  order_number: number;
  order_type: string;
  table_id?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  items: OrderItem[];
}

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(
    siteId: string,
    tenantId: string,
    serverId: string,
    orderData: {
      order_type: 'dine_in' | 'takeout' | 'delivery' | 'bar_tab';
      table_id?: string;
      customer_name?: string;
      customer_phone?: string;
      guest_count?: number;
      items?: OrderItem[];
    }
  ): Promise<Order> {
    // Get next order number
    const orderNumber = await this.getNextOrderNumber(siteId);

    // Create order
    const { data: order, error } = await supabase
      .from('mod_pos.orders')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        order_number: orderNumber,
        order_type: orderData.order_type,
        table_id: orderData.table_id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        guest_count: orderData.guest_count || 1,
        server_id: serverId,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    // Add items if provided
    if (orderData.items && orderData.items.length > 0) {
      await this.addItems(order.id, orderData.items);
    }

    // Update table status if dine-in
    if (orderData.table_id) {
      await supabase
        .from('mod_pos.tables')
        .update({ status: 'occupied' })
        .eq('id', orderData.table_id);
    }

    return this.getOrder(order.id);
  }

  /**
   * Add items to order
   */
  async addItems(orderId: string, items: OrderItem[]): Promise<void> {
    for (const item of items) {
      // Calculate modifiers price
      const modifiersPrice = (item.modifiers || []).reduce(
        (sum, m) => sum + m.price_adjustment,
        0
      );

      const lineTotal = (item.unit_price + modifiersPrice) * item.quantity;

      // Get prep station from menu item
      let prepStation: string | null = null;
      if (item.menu_item_id) {
        const { data: menuItem } = await supabase
          .from('mod_pos.menu_items')
          .select('prep_station')
          .eq('id', item.menu_item_id)
          .single();
        prepStation = menuItem?.prep_station;
      }

      // Insert order item
      const { data: orderItem } = await supabase
        .from('mod_pos.order_items')
        .insert({
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          combo_id: item.combo_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          modifiers_price: modifiersPrice,
          line_total: lineTotal,
          notes: item.notes,
          seat_number: item.seat_number,
          course: item.course || 'main',
          prep_station: prepStation,
          status: 'pending'
        })
        .select('id')
        .single();

      // Insert modifiers
      if (item.modifiers && item.modifiers.length > 0 && orderItem) {
        await supabase.from('mod_pos.order_item_modifiers').insert(
          item.modifiers.map(m => ({
            order_item_id: orderItem.id,
            modifier_id: m.modifier_id,
            name: m.name,
            price_adjustment: m.price_adjustment
          }))
        );
      }

      // Update inventory
      if (item.menu_item_id) {
        await this.updateInventory(item.menu_item_id, item.quantity);
      }
    }

    // Recalculate order totals
    await this.recalculateTotals(orderId);
  }

  /**
   * Remove item from order
   */
  async removeItem(orderItemId: string, reason?: string): Promise<void> {
    const { data: item } = await supabase
      .from('mod_pos.order_items')
      .select('order_id, status')
      .eq('id', orderItemId)
      .single();

    if (!item) throw new Error('Item not found');

    // Can only remove pending items, otherwise void
    if (item.status !== 'pending') {
      await supabase
        .from('mod_pos.order_items')
        .update({ status: 'void' })
        .eq('id', orderItemId);
    } else {
      await supabase
        .from('mod_pos.order_items')
        .delete()
        .eq('id', orderItemId);
    }

    await this.recalculateTotals(item.order_id);
  }

  /**
   * Send order to kitchen
   */
  async sendToKitchen(orderId: string): Promise<void> {
    const now = new Date().toISOString();

    // Update order status
    await supabase
      .from('mod_pos.orders')
      .update({ 
        status: 'sent',
        sent_at: now
      })
      .eq('id', orderId);

    // Update pending items
    await supabase
      .from('mod_pos.order_items')
      .update({ 
        status: 'sent',
        sent_to_kitchen_at: now
      })
      .eq('order_id', orderId)
      .eq('status', 'pending');

    // TODO: Send to kitchen display via websocket
  }

  /**
   * Mark item as ready
   */
  async markItemReady(orderItemId: string): Promise<void> {
    await supabase
      .from('mod_pos.order_items')
      .update({ 
        status: 'ready',
        ready_at: new Date().toISOString()
      })
      .eq('id', orderItemId);

    // Check if all items ready
    const { data: item } = await supabase
      .from('mod_pos.order_items')
      .select('order_id')
      .eq('id', orderItemId)
      .single();

    if (item) {
      const { data: pendingItems } = await supabase
        .from('mod_pos.order_items')
        .select('id')
        .eq('order_id', item.order_id)
        .in('status', ['sent', 'preparing'])
        .limit(1);

      if (!pendingItems || pendingItems.length === 0) {
        await supabase
          .from('mod_pos.orders')
          .update({ 
            status: 'ready',
            ready_at: new Date().toISOString()
          })
          .eq('id', item.order_id);
      }
    }
  }

  /**
   * Apply discount to order
   */
  async applyDiscount(
    orderId: string,
    discountType: 'percentage' | 'fixed',
    discountValue: number,
    reason?: string
  ): Promise<void> {
    const { data: order } = await supabase
      .from('mod_pos.orders')
      .select('subtotal')
      .eq('id', orderId)
      .single();

    if (!order) throw new Error('Order not found');

    let discountAmount: number;
    if (discountType === 'percentage') {
      discountAmount = order.subtotal * (discountValue / 100);
    } else {
      discountAmount = Math.min(discountValue, order.subtotal);
    }

    await supabase
      .from('mod_pos.orders')
      .update({
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        discount_reason: reason
      })
      .eq('id', orderId);

    await this.recalculateTotals(orderId);
  }

  /**
   * Process payment
   */
  async processPayment(
    siteId: string,
    tenantId: string,
    orderId: string,
    payment: {
      amount: number;
      tip_amount?: number;
      payment_method: string;
      tendered?: number;
      card_type?: string;
      card_last_four?: string;
      authorization_code?: string;
    },
    processedBy: string
  ): Promise<{ success: boolean; change?: number; remaining?: number }> {
    const { data: order } = await supabase
      .from('mod_pos.orders')
      .select('total, tip_amount')
      .eq('id', orderId)
      .single();

    if (!order) throw new Error('Order not found');

    const tipAmount = payment.tip_amount || 0;
    const totalWithTip = order.total + tipAmount;
    const totalAmount = payment.amount + tipAmount;

    // Record payment
    const { data: paymentRecord } = await supabase
      .from('mod_pos.payments')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        order_id: orderId,
        amount: payment.amount,
        tip_amount: tipAmount,
        total_amount: totalAmount,
        payment_method: payment.payment_method,
        tendered: payment.tendered,
        change_given: payment.tendered ? Math.max(0, payment.tendered - totalAmount) : null,
        card_type: payment.card_type,
        card_last_four: payment.card_last_four,
        authorization_code: payment.authorization_code,
        processed_by: processedBy
      })
      .select('id')
      .single();

    // Get all payments for this order
    const { data: payments } = await supabase
      .from('mod_pos.payments')
      .select('amount')
      .eq('order_id', orderId)
      .eq('status', 'completed');

    const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0);
    const remaining = order.total - totalPaid;

    // Update order
    if (remaining <= 0) {
      await supabase
        .from('mod_pos.orders')
        .update({ 
          status: 'paid',
          tip_amount: order.tip_amount + tipAmount,
          closed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Free up table
      const { data: orderData } = await supabase
        .from('mod_pos.orders')
        .select('table_id, server_id')
        .eq('id', orderId)
        .single();

      if (orderData?.table_id) {
        await supabase
          .from('mod_pos.tables')
          .update({ status: 'dirty' })
          .eq('id', orderData.table_id);
      }

      // Record tip
      if (tipAmount > 0 && orderData?.server_id) {
        await supabase.from('mod_pos.tips').insert({
          site_id: siteId,
          tenant_id: tenantId,
          order_id: orderId,
          payment_id: paymentRecord?.id,
          amount: tipAmount,
          server_id: orderData.server_id,
          net_amount: tipAmount
        });
      }

      return { 
        success: true, 
        change: payment.tendered ? Math.max(0, payment.tendered - totalAmount) : 0 
      };
    }

    return { success: true, remaining };
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('mod_pos.orders')
      .select(`
        *,
        items:mod_pos.order_items(
          *,
          modifiers:mod_pos.order_item_modifiers(*)
        ),
        table:mod_pos.tables(name),
        payments:mod_pos.payments(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get open orders for table
   */
  async getTableOrders(tableId: string): Promise<Order[]> {
    const { data } = await supabase
      .from('mod_pos.orders')
      .select(`
        *,
        items:mod_pos.order_items(
          *,
          modifiers:mod_pos.order_item_modifiers(*)
        )
      `)
      .eq('table_id', tableId)
      .in('status', ['open', 'sent', 'preparing', 'ready', 'served'])
      .order('created_at', { ascending: false });

    return data || [];
  }

  /**
   * Recalculate order totals
   */
  private async recalculateTotals(orderId: string): Promise<void> {
    const { data: items } = await supabase
      .from('mod_pos.order_items')
      .select('line_total, menu_item_id')
      .eq('order_id', orderId)
      .neq('status', 'void');

    const subtotal = (items || []).reduce((sum, i) => sum + i.line_total, 0);

    // Get order discount
    const { data: order } = await supabase
      .from('mod_pos.orders')
      .select('discount_amount, site_id')
      .eq('id', orderId)
      .single();

    const discountAmount = order?.discount_amount || 0;
    const afterDiscount = subtotal - discountAmount;

    // Calculate tax (example: 8%)
    const taxRate = 0.08;
    const taxAmount = afterDiscount * taxRate;
    const total = afterDiscount + taxAmount;

    await supabase
      .from('mod_pos.orders')
      .update({
        subtotal,
        tax_amount: taxAmount,
        total
      })
      .eq('id', orderId);
  }

  /**
   * Get next order number
   */
  private async getNextOrderNumber(siteId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('mod_pos.orders')
      .select('order_number')
      .eq('site_id', siteId)
      .gte('created_at', `${today}T00:00:00`)
      .order('order_number', { ascending: false })
      .limit(1);

    return (data?.[0]?.order_number || 0) + 1;
  }

  /**
   * Update inventory based on order
   */
  private async updateInventory(menuItemId: string, quantity: number): Promise<void> {
    // Get ingredients for this menu item
    const { data: ingredients } = await supabase
      .from('mod_pos.item_ingredients')
      .select('inventory_id, quantity_used')
      .eq('menu_item_id', menuItemId);

    for (const ing of ingredients || []) {
      await supabase.rpc('decrement_inventory', {
        p_inventory_id: ing.inventory_id,
        p_quantity: ing.quantity_used * quantity
      });
    }
  }
}
```

---

### Task 3: POS Terminal UI (2 hours)

```tsx
// src/modules/pos/components/POSTerminal.tsx

'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  Banknote,
  Users,
  ChefHat,
  Clock
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  ScrollArea,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_url?: string;
  modifier_groups?: ModifierGroup[];
}

interface ModifierGroup {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  modifiers: Modifier[];
}

interface Modifier {
  id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers: Array<{ id: string; name: string; price: number }>;
  notes?: string;
}

interface POSTerminalProps {
  categories: Category[];
  menuItems: MenuItem[];
  table?: { id: string; name: string };
  onSendOrder: (items: OrderItem[]) => Promise<void>;
  onProcessPayment: (amount: number, method: string, tip?: number) => Promise<void>;
}

export function POSTerminal({
  categories,
  menuItems,
  table,
  onSendOrder,
  onProcessPayment
}: POSTerminalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories[0]?.id || null
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showModifiers, setShowModifiers] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState<Map<string, Set<string>>>(new Map());

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return menuItems;
    return menuItems.filter(item => item.category_id === selectedCategory);
  }, [menuItems, selectedCategory]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => {
      const modifiersTotal = item.modifiers.reduce((m, mod) => m + mod.price, 0);
      return sum + (item.unit_price + modifiersTotal) * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [orderItems]);

  const handleItemClick = (item: MenuItem) => {
    if (item.modifier_groups && item.modifier_groups.length > 0) {
      setSelectedItem(item);
      setSelectedModifiers(new Map());
      setShowModifiers(true);
    } else {
      addToOrder(item, []);
    }
  };

  const addToOrder = (item: MenuItem, modifiers: Array<{ id: string; name: string; price: number }>) => {
    const existingIndex = orderItems.findIndex(
      oi => oi.menu_item_id === item.id && 
           JSON.stringify(oi.modifiers) === JSON.stringify(modifiers)
    );

    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity++;
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: crypto.randomUUID(),
          menu_item_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.price,
          modifiers
        }
      ]);
    }
  };

  const handleModifierConfirm = () => {
    if (!selectedItem) return;

    const modifiers: Array<{ id: string; name: string; price: number }> = [];
    selectedModifiers.forEach((modIds, groupId) => {
      modIds.forEach(modId => {
        const group = selectedItem.modifier_groups?.find(g => g.id === groupId);
        const modifier = group?.modifiers.find(m => m.id === modId);
        if (modifier) {
          modifiers.push({
            id: modifier.id,
            name: modifier.name,
            price: modifier.price_adjustment
          });
        }
      });
    });

    addToOrder(selectedItem, modifiers);
    setShowModifiers(false);
    setSelectedItem(null);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setOrderItems(prev =>
      prev
        .map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSendOrder = async () => {
    await onSendOrder(orderItems);
    setOrderItems([]);
  };

  const toggleModifier = (groupId: string, modifierId: string, maxSelections: number) => {
    setSelectedModifiers(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(groupId) || new Set();
      
      if (current.has(modifierId)) {
        current.delete(modifierId);
      } else {
        if (maxSelections === 1) {
          current.clear();
        } else if (current.size >= maxSelections) {
          return prev;
        }
        current.add(modifierId);
      }
      
      newMap.set(groupId, current);
      return newMap;
    });
  };

  return (
    <div className="h-screen flex">
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {/* Category Tabs */}
        <div className="p-4 bg-background border-b">
          <ScrollArea className="w-full">
            <div className="flex gap-2">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    backgroundColor: selectedCategory === cat.id ? cat.color : undefined
                  }}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="p-4 bg-background rounded-lg border hover:border-primary transition-colors text-left"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                )}
                <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                <p className="text-primary font-bold">${item.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Order */}
      <div className="w-96 bg-background border-l flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">
                {table ? `Table ${table.name}` : 'New Order'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {orderItems.length} items
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {orderItems.map(item => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {item.modifiers.map(m => m.name).join(', ')}
                        </p>
                      )}
                      <p className="text-sm font-bold text-primary mt-1">
                        ${(
                          (item.unit_price + item.modifiers.reduce((s, m) => s + m.price, 0)) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {orderItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items in order</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Totals & Actions */}
        <div className="p-4 border-t space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8%)</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-14"
              disabled={orderItems.length === 0}
              onClick={handleSendOrder}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button
              className="h-14"
              disabled={orderItems.length === 0}
              onClick={() => setShowPayment(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pay
            </Button>
          </div>
        </div>
      </div>

      {/* Modifier Dialog */}
      <Dialog open={showModifiers} onOpenChange={setShowModifiers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedItem?.modifier_groups?.map(group => (
              <div key={group.id}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{group.name}</h4>
                  {group.is_required && (
                    <Badge variant="destructive">Required</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.modifiers.map(mod => {
                    const isSelected = selectedModifiers.get(group.id)?.has(mod.id);
                    return (
                      <Button
                        key={mod.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="justify-between"
                        onClick={() => toggleModifier(group.id, mod.id, group.max_selections)}
                      >
                        <span>{mod.name}</span>
                        {mod.price_adjustment > 0 && (
                          <span>+${mod.price_adjustment.toFixed(2)}</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
            <Button className="w-full" onClick={handleModifierConfirm}>
              Add to Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          <PaymentDialog
            total={totals.total}
            onProcess={async (amount, method, tip) => {
              await onProcessPayment(amount, method, tip);
              setShowPayment(false);
              setOrderItems([]);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Payment Dialog Component
function PaymentDialog({
  total,
  onProcess
}: {
  total: number;
  onProcess: (amount: number, method: string, tip?: number) => Promise<void>;
}) {
  const [tip, setTip] = useState(0);
  const [tendered, setTendered] = useState('');
  const [method, setMethod] = useState<string>('');

  const tipPresets = [0, 15, 18, 20, 25];
  const grandTotal = total + tip;
  const change = parseFloat(tendered || '0') - grandTotal;

  const handleQuickCash = (amount: number) => {
    setTendered(amount.toFixed(2));
  };

  return (
    <div className="space-y-6">
      {/* Tip Selection */}
      <div>
        <p className="text-sm font-medium mb-2">Add Tip</p>
        <div className="flex gap-2">
          {tipPresets.map(pct => (
            <Button
              key={pct}
              variant={tip === total * (pct / 100) ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTip(pct === 0 ? 0 : total * (pct / 100))}
            >
              {pct}%
            </Button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="text-center py-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">Total Due</p>
        <p className="text-3xl font-bold">${grandTotal.toFixed(2)}</p>
        {tip > 0 && (
          <p className="text-sm text-muted-foreground">
            (includes ${tip.toFixed(2)} tip)
          </p>
        )}
      </div>

      {/* Payment Method */}
      <Tabs defaultValue="card" onValueChange={setMethod}>
        <TabsList className="w-full">
          <TabsTrigger value="card" className="flex-1">
            <CreditCard className="h-4 w-4 mr-2" />
            Card
          </TabsTrigger>
          <TabsTrigger value="cash" className="flex-1">
            <Banknote className="h-4 w-4 mr-2" />
            Cash
          </TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="mt-4">
          <Button
            className="w-full h-14"
            onClick={() => onProcess(total, 'credit_card', tip)}
          >
            Process Card Payment
          </Button>
        </TabsContent>

        <TabsContent value="cash" className="mt-4 space-y-4">
          <div>
            <p className="text-sm mb-2">Tendered Amount</p>
            <Input
              type="number"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              placeholder="0.00"
              className="text-right text-xl h-12"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[20, 50, 100, grandTotal].map(amt => (
              <Button
                key={amt}
                variant="outline"
                onClick={() => handleQuickCash(amt)}
              >
                ${amt === grandTotal ? 'Exact' : amt}
              </Button>
            ))}
          </div>
          {change >= 0 && tendered && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Change Due</p>
              <p className="text-2xl font-bold text-green-700">
                ${change.toFixed(2)}
              </p>
            </div>
          )}
          <Button
            className="w-full h-14"
            disabled={parseFloat(tendered || '0') < grandTotal}
            onClick={() => onProcess(total, 'cash', tip)}
          >
            Complete Cash Payment
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### Task 4: Kitchen Display System (1.5 hours)

```tsx
// src/modules/pos/components/KitchenDisplay.tsx

'use client';

import { useState, useEffect } from 'react';
import { Clock, Check, AlertCircle, ChefHat } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components/ui';

interface KitchenOrder {
  id: string;
  order_number: number;
  order_type: string;
  table_name?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    modifiers: string[];
    notes?: string;
    status: string;
  }>;
  sent_at: string;
  elapsed_minutes: number;
}

interface KitchenDisplayProps {
  orders: KitchenOrder[];
  stationName: string;
  onItemReady: (itemId: string) => Promise<void>;
  onOrderBump: (orderId: string) => Promise<void>;
}

export function KitchenDisplay({
  orders,
  stationName,
  onItemReady,
  onOrderBump
}: KitchenDisplayProps) {
  const [now, setNow] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getTimeColor = (minutes: number) => {
    if (minutes < 5) return 'text-green-500';
    if (minutes < 10) return 'text-yellow-500';
    if (minutes < 15) return 'text-orange-500';
    return 'text-red-500';
  };

  const getOrderColor = (minutes: number) => {
    if (minutes < 10) return 'border-l-green-500';
    if (minutes < 15) return 'border-l-yellow-500';
    return 'border-l-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ChefHat className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">{stationName}</h1>
            <p className="text-gray-400">{orders.length} active orders</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono">
            {now.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
          <p className="text-gray-400">
            {now.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map(order => (
          <Card
            key={order.id}
            className={`
              bg-gray-800 border-l-4 
              ${getOrderColor(order.elapsed_minutes)}
            `}
          >
            <CardContent className="p-4">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    #{order.order_number}
                  </span>
                  <Badge variant={
                    order.order_type === 'dine_in' ? 'default' : 'secondary'
                  }>
                    {order.order_type === 'dine_in' ? order.table_name : order.order_type}
                  </Badge>
                </div>
                <div className={`flex items-center gap-1 ${getTimeColor(order.elapsed_minutes)}`}>
                  <Clock className="h-4 w-4" />
                  <span className="font-mono font-bold">
                    {order.elapsed_minutes}m
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                {order.items.map(item => (
                  <div
                    key={item.id}
                    className={`
                      p-3 rounded-lg transition-all
                      ${item.status === 'ready' 
                        ? 'bg-green-900/50 border border-green-700' 
                        : 'bg-gray-700'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-orange-400">
                            {item.quantity}×
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.modifiers.length > 0 && (
                          <p className="text-sm text-gray-400 mt-1">
                            {item.modifiers.join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-yellow-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {item.notes}
                          </p>
                        )}
                      </div>
                      {item.status !== 'ready' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                          onClick={() => onItemReady(item.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bump Button */}
              {order.items.every(i => i.status === 'ready') && (
                <Button
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => onOrderBump(order.id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  BUMP ORDER
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full text-center py-20">
            <ChefHat className="h-20 w-20 mx-auto mb-4 text-gray-600" />
            <p className="text-2xl text-gray-500">All caught up!</p>
            <p className="text-gray-600">No pending orders</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Menu categories create/edit
- [ ] Menu items with modifiers work
- [ ] Orders create correctly
- [ ] Kitchen display receives orders
- [ ] Items mark as ready
- [ ] Payments process
- [ ] Tips record correctly
- [ ] Inventory decrements
- [ ] Reports generate
- [ ] Cash drawer tracks

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-52 (E-Commerce)
- **Required by**: Analytics, inventory integrations
- **External**: Payment processors (Stripe Terminal, Square)
