# Phase EM-55: Accounting & Invoicing Module

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 22-28 hours
> **Prerequisites**: EM-01, EM-11, EM-12, EM-50
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Build a comprehensive **accounting and invoicing module** (similar to QuickBooks/FreshBooks):
1. Client and vendor management
2. Invoice creation and sending
3. Expense tracking
4. Payment processing
5. Financial reporting
6. Tax management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ACCOUNTING MODULE                                 │
├────────────────┬─────────────────┬──────────────────────────────────┤
│   INVOICING    │   EXPENSES      │      REPORTING                   │
├────────────────┼─────────────────┼──────────────────────────────────┤
│ Invoices       │ Expense Tracking│ Profit & Loss                    │
│ Estimates      │ Receipt Capture │ Balance Sheet                    │
│ Payments       │ Categories      │ Cash Flow                        │
│ Recurring      │ Vendors         │ Tax Reports                      │
└────────────────┴─────────────────┴──────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (1.5 hours)

```sql
-- migrations/em-55-accounting-schema.sql
-- Uses module naming convention: mod_{short_id}.{table}

-- Chart of Accounts
CREATE TABLE mod_accounting.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Account info
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Classification
  type TEXT NOT NULL CHECK (type IN (
    'asset', 'liability', 'equity', 'revenue', 'expense'
  )),
  subtype TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES mod_accounting.accounts(id),
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'USD',
  
  -- Balance (cached)
  current_balance DECIMAL(15,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, code)
);

-- Clients (extends CRM contacts)
CREATE TABLE mod_accounting.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Link to CRM if available
  crm_contact_id UUID,
  
  -- Basic info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  
  -- Billing address
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT DEFAULT 'US',
  
  -- Shipping address
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'US',
  
  -- Payment
  payment_terms INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'USD',
  tax_id TEXT,
  default_tax_rate_id UUID,
  
  -- Credit
  credit_limit DECIMAL(12,2),
  current_balance DECIMAL(12,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE mod_accounting.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Payment
  payment_terms INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'USD',
  tax_id TEXT,
  
  -- Banking
  bank_name TEXT,
  bank_account_number TEXT,
  bank_routing_number TEXT,
  
  -- Balance
  current_balance DECIMAL(12,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Rates
CREATE TABLE mod_accounting.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  rate DECIMAL(6,4) NOT NULL,
  description TEXT,
  
  -- Linked accounts
  tax_account_id UUID REFERENCES mod_accounting.accounts(id),
  
  is_compound BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products/Services
CREATE TABLE mod_accounting.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  
  -- Type
  type TEXT DEFAULT 'service' CHECK (type IN ('product', 'service')),
  
  -- Pricing
  unit_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  
  -- Tax
  is_taxable BOOLEAN DEFAULT true,
  tax_rate_id UUID REFERENCES mod_accounting.tax_rates(id),
  
  -- Accounting
  income_account_id UUID REFERENCES mod_accounting.accounts(id),
  expense_account_id UUID REFERENCES mod_accounting.accounts(id),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE mod_accounting.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Numbering
  invoice_number TEXT NOT NULL,
  
  -- Type
  type TEXT DEFAULT 'invoice' CHECK (type IN (
    'invoice', 'estimate', 'quote', 'credit_note'
  )),
  
  -- Client
  client_id UUID NOT NULL REFERENCES mod_accounting.clients(id),
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'void'
  )),
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_due DECIMAL(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  currency TEXT DEFAULT 'USD',
  
  -- Terms
  payment_terms INTEGER,
  notes TEXT,
  terms TEXT,
  footer TEXT,
  
  -- Metadata
  po_number TEXT,
  reference TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  recurring_schedule_id UUID,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, invoice_number)
);

-- Invoice Line Items
CREATE TABLE mod_accounting.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES mod_accounting.invoices(id) ON DELETE CASCADE,
  
  -- Product/Service
  product_id UUID REFERENCES mod_accounting.products(id),
  
  -- Line item details
  description TEXT NOT NULL,
  quantity DECIMAL(12,4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  
  -- Discount
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) DEFAULT 0,
  
  -- Tax
  tax_rate_id UUID REFERENCES mod_accounting.tax_rates(id),
  tax_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Totals
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  total DECIMAL(12,2) NOT NULL,
  
  -- Ordering
  position INTEGER DEFAULT 0,
  
  -- Accounting
  account_id UUID REFERENCES mod_accounting.accounts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE mod_accounting.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('received', 'sent', 'refund')),
  
  -- Links
  client_id UUID REFERENCES mod_accounting.clients(id),
  vendor_id UUID REFERENCES mod_accounting.vendors(id),
  invoice_id UUID REFERENCES mod_accounting.invoices(id),
  
  -- Payment details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Method
  payment_method TEXT CHECK (payment_method IN (
    'cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'stripe', 'other'
  )),
  reference_number TEXT,
  
  -- Accounting
  deposit_account_id UUID REFERENCES mod_accounting.accounts(id),
  
  -- External
  stripe_payment_id TEXT,
  
  -- Notes
  notes TEXT,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Allocations (for partial payments)
CREATE TABLE mod_accounting.payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES mod_accounting.payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES mod_accounting.invoices(id),
  
  amount DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE mod_accounting.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Vendor
  vendor_id UUID REFERENCES mod_accounting.vendors(id),
  
  -- Expense details
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  
  -- Amounts
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Category
  category_id UUID REFERENCES mod_accounting.expense_categories(id),
  account_id UUID REFERENCES mod_accounting.accounts(id),
  
  -- Payment
  payment_method TEXT,
  payment_account_id UUID REFERENCES mod_accounting.accounts(id),
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  
  -- Receipt
  receipt_url TEXT,
  receipt_extracted_data JSONB,
  
  -- Billable
  is_billable BOOLEAN DEFAULT false,
  client_id UUID REFERENCES mod_accounting.clients(id),
  billed_invoice_id UUID REFERENCES mod_accounting.invoices(id),
  
  -- Notes
  notes TEXT,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Categories
CREATE TABLE mod_accounting.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  parent_id UUID REFERENCES mod_accounting.expense_categories(id),
  
  -- Linked account
  account_id UUID REFERENCES mod_accounting.accounts(id),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Schedules
CREATE TABLE mod_accounting.recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Template
  invoice_template_id UUID REFERENCES mod_accounting.invoices(id),
  
  -- Schedule
  frequency TEXT NOT NULL CHECK (frequency IN (
    'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
  )),
  interval_value INTEGER DEFAULT 1,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  next_date DATE NOT NULL,
  last_created_date DATE,
  
  -- Settings
  auto_send BOOLEAN DEFAULT false,
  days_in_advance INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  occurrences_created INTEGER DEFAULT 0,
  max_occurrences INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE mod_accounting.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Entry details
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  
  -- Reference
  reference_type TEXT,
  reference_id UUID,
  
  -- Status
  is_posted BOOLEAN DEFAULT false,
  posted_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, entry_number)
);

-- Journal Entry Lines
CREATE TABLE mod_accounting.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES mod_accounting.journal_entries(id) ON DELETE CASCADE,
  
  account_id UUID NOT NULL REFERENCES mod_accounting.accounts(id),
  
  description TEXT,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (debit = 0 OR credit = 0)
);

-- Bank Connections
CREATE TABLE mod_accounting.bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Plaid integration
  plaid_item_id TEXT,
  plaid_access_token TEXT,
  
  -- Bank info
  institution_name TEXT NOT NULL,
  institution_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'error', 'disconnected'
  )),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE mod_accounting.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES mod_accounting.bank_connections(id),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Account info
  plaid_account_id TEXT,
  name TEXT NOT NULL,
  mask TEXT,
  type TEXT,
  subtype TEXT,
  
  -- Balance
  current_balance DECIMAL(15,2),
  available_balance DECIMAL(15,2),
  
  -- Linked chart account
  chart_account_id UUID REFERENCES mod_accounting.accounts(id),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Transactions
CREATE TABLE mod_accounting.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES mod_accounting.bank_accounts(id),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Transaction info
  plaid_transaction_id TEXT UNIQUE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  -- Categorization
  category TEXT,
  subcategory TEXT,
  
  -- Matching
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'matched', 'categorized', 'excluded'
  )),
  matched_expense_id UUID REFERENCES mod_accounting.expenses(id),
  matched_payment_id UUID REFERENCES mod_accounting.payments(id),
  account_id UUID REFERENCES mod_accounting.accounts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_acc_accounts_site ON mod_accounting.accounts(site_id, type);
CREATE INDEX idx_acc_clients_site ON mod_accounting.clients(site_id, is_active);
CREATE INDEX idx_acc_vendors_site ON mod_accounting.vendors(site_id, is_active);
CREATE INDEX idx_acc_invoices_site ON mod_accounting.invoices(site_id, status);
CREATE INDEX idx_acc_invoices_client ON mod_accounting.invoices(client_id, status);
CREATE INDEX idx_acc_invoices_due ON mod_accounting.invoices(due_date) WHERE status IN ('sent', 'viewed', 'partial');
CREATE INDEX idx_acc_payments_site ON mod_accounting.payments(site_id, payment_date DESC);
CREATE INDEX idx_acc_expenses_site ON mod_accounting.expenses(site_id, expense_date DESC);
CREATE INDEX idx_acc_bank_txn ON mod_accounting.bank_transactions(bank_account_id, transaction_date DESC);
CREATE INDEX idx_acc_journal_site ON mod_accounting.journal_entries(site_id, entry_date DESC);

-- Enable RLS
ALTER TABLE mod_accounting.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_accounting.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_accounting.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_accounting.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_accounting.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation ON mod_accounting.accounts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_accounting.clients
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON mod_accounting.invoices
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Task 2: Invoice Service (3 hours)

```typescript
// src/modules/accounting/services/invoice-service.ts

import { createClient } from '@supabase/supabase-js';
import { generateInvoicePDF } from './pdf-generator';
import { sendInvoiceEmail } from './email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface InvoiceItem {
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  tax_rate_id?: string;
  account_id?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  type: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  items: InvoiceItem[];
}

export class InvoiceService {
  /**
   * Generate next invoice number
   */
  async getNextInvoiceNumber(siteId: string, prefix = 'INV'): Promise<string> {
    const { data } = await supabase
      .from('mod_accounting.invoices')
      .select('invoice_number')
      .eq('site_id', siteId)
      .like('invoice_number', `${prefix}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      return `${prefix}-0001`;
    }

    const lastNumber = parseInt(data.invoice_number.split('-')[1]) || 0;
    return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`;
  }

  /**
   * Create an invoice
   */
  async createInvoice(
    siteId: string,
    tenantId: string,
    userId: string,
    invoice: {
      type?: string;
      client_id: string;
      issue_date?: string;
      due_date?: string;
      payment_terms?: number;
      items: InvoiceItem[];
      discount_type?: 'percentage' | 'fixed';
      discount_value?: number;
      notes?: string;
      terms?: string;
      footer?: string;
      po_number?: string;
    }
  ): Promise<Invoice> {
    const invoiceNumber = await this.getNextInvoiceNumber(siteId);
    
    // Calculate due date from payment terms
    const issueDate = invoice.issue_date || new Date().toISOString().split('T')[0];
    const paymentTerms = invoice.payment_terms || 30;
    const dueDate = invoice.due_date || new Date(
      new Date(issueDate).getTime() + paymentTerms * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];

    // Calculate totals
    const { subtotal, taxAmount, discountAmount, total, itemsWithTotals } = 
      await this.calculateTotals(siteId, invoice.items, invoice.discount_type, invoice.discount_value);

    // Create invoice
    const { data, error } = await supabase
      .from('mod_accounting.invoices')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        type: invoice.type || 'invoice',
        client_id: invoice.client_id,
        issue_date: issueDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        subtotal,
        discount_type: invoice.discount_type,
        discount_value: invoice.discount_value,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
        notes: invoice.notes,
        terms: invoice.terms,
        footer: invoice.footer,
        po_number: invoice.po_number,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Create line items
    const itemInserts = itemsWithTotals.map((item, i) => ({
      invoice_id: data.id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_type: item.discount_type,
      discount_value: item.discount_value,
      tax_rate_id: item.tax_rate_id,
      tax_amount: item.tax_amount,
      total: item.total,
      position: i,
      account_id: item.account_id
    }));

    await supabase
      .from('mod_accounting.invoice_items')
      .insert(itemInserts);

    // Create journal entry
    await this.createInvoiceJournalEntry(siteId, tenantId, userId, data, itemsWithTotals);

    return { ...data, items: itemsWithTotals };
  }

  /**
   * Calculate invoice totals
   */
  private async calculateTotals(
    siteId: string,
    items: InvoiceItem[],
    discountType?: 'percentage' | 'fixed',
    discountValue?: number
  ): Promise<{
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    itemsWithTotals: Array<InvoiceItem & { tax_amount: number; total: number }>;
  }> {
    // Get tax rates
    const taxRateIds = items.filter(i => i.tax_rate_id).map(i => i.tax_rate_id);
    const { data: taxRates } = await supabase
      .from('mod_accounting.tax_rates')
      .select('id, rate')
      .in('id', taxRateIds);

    const taxRateMap = new Map(taxRates?.map(t => [t.id, t.rate]) || []);

    let subtotal = 0;
    let totalTax = 0;

    const itemsWithTotals = items.map(item => {
      let lineSubtotal = item.quantity * item.unit_price;
      
      // Apply line discount
      if (item.discount_value && item.discount_value > 0) {
        if (item.discount_type === 'percentage') {
          lineSubtotal -= lineSubtotal * (item.discount_value / 100);
        } else {
          lineSubtotal -= item.discount_value;
        }
      }

      // Calculate tax
      let taxAmount = 0;
      if (item.tax_rate_id) {
        const rate = taxRateMap.get(item.tax_rate_id) || 0;
        taxAmount = lineSubtotal * (rate / 100);
      }

      subtotal += lineSubtotal;
      totalTax += taxAmount;

      return {
        ...item,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total: Math.round((lineSubtotal + taxAmount) * 100) / 100
      };
    });

    // Apply invoice-level discount
    let discountAmount = 0;
    if (discountValue && discountValue > 0) {
      if (discountType === 'percentage') {
        discountAmount = subtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
    }

    const total = subtotal - discountAmount + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(totalTax * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemsWithTotals
    };
  }

  /**
   * Send invoice to client
   */
  async sendInvoice(invoiceId: string): Promise<void> {
    const { data: invoice } = await supabase
      .from('mod_accounting.invoices')
      .select(`
        *,
        items:mod_accounting.invoice_items(*),
        client:mod_accounting.clients(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (!invoice) throw new Error('Invoice not found');
    if (!invoice.client?.email) throw new Error('Client has no email');

    // Generate PDF
    const pdfUrl = await generateInvoicePDF(invoice);

    // Send email
    await sendInvoiceEmail({
      to: invoice.client.email,
      clientName: invoice.client.name,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.total,
      dueDate: invoice.due_date,
      pdfUrl,
      viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoiceId}`
    });

    // Update status
    await supabase
      .from('mod_accounting.invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', invoiceId);
  }

  /**
   * Record payment
   */
  async recordPayment(
    invoiceId: string,
    payment: {
      amount: number;
      payment_date: string;
      payment_method: string;
      reference_number?: string;
      deposit_account_id?: string;
      notes?: string;
    }
  ): Promise<void> {
    const { data: invoice } = await supabase
      .from('mod_accounting.invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!invoice) throw new Error('Invoice not found');

    // Create payment record
    const { data: paymentRecord, error } = await supabase
      .from('mod_accounting.payments')
      .insert({
        site_id: invoice.site_id,
        tenant_id: invoice.tenant_id,
        type: 'received',
        client_id: invoice.client_id,
        invoice_id: invoiceId,
        payment_date: payment.payment_date,
        amount: payment.amount,
        payment_method: payment.payment_method,
        reference_number: payment.reference_number,
        deposit_account_id: payment.deposit_account_id,
        notes: payment.notes,
        created_by: invoice.created_by
      })
      .select()
      .single();

    if (error) throw error;

    // Create payment allocation
    await supabase
      .from('mod_accounting.payment_allocations')
      .insert({
        payment_id: paymentRecord.id,
        invoice_id: invoiceId,
        amount: payment.amount
      });

    // Update invoice
    const newAmountPaid = invoice.amount_paid + payment.amount;
    const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial';

    await supabase
      .from('mod_accounting.invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null
      })
      .eq('id', invoiceId);

    // Update client balance
    await supabase
      .from('mod_accounting.clients')
      .update({
        current_balance: supabase.rpc('decrement', { amount: payment.amount })
      })
      .eq('id', invoice.client_id);
  }

  /**
   * Mark invoice as overdue
   */
  async processOverdueInvoices(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await supabase
      .from('mod_accounting.invoices')
      .update({ status: 'overdue' })
      .in('status', ['sent', 'viewed', 'partial'])
      .lt('due_date', today);
  }

  /**
   * Create journal entry for invoice
   */
  private async createInvoiceJournalEntry(
    siteId: string,
    tenantId: string,
    userId: string,
    invoice: Invoice,
    items: Array<InvoiceItem & { tax_amount: number; total: number }>
  ): Promise<void> {
    // Get accounts
    const { data: settings } = await supabase
      .from('mod_accounting.settings')
      .select('accounts_receivable_id, sales_tax_payable_id')
      .eq('site_id', siteId)
      .single();

    if (!settings) return;

    // Create journal entry
    const { data: entry } = await supabase
      .from('mod_accounting.journal_entries')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        entry_number: `JE-${invoice.invoice_number}`,
        entry_date: invoice.issue_date,
        description: `Invoice ${invoice.invoice_number}`,
        reference_type: 'invoice',
        reference_id: invoice.id,
        created_by: userId
      })
      .select()
      .single();

    if (!entry) return;

    const lines = [
      // Debit: Accounts Receivable
      {
        journal_entry_id: entry.id,
        account_id: settings.accounts_receivable_id,
        description: 'Accounts Receivable',
        debit: invoice.total,
        credit: 0
      }
    ];

    // Credit: Revenue accounts
    items.forEach(item => {
      if (item.account_id) {
        lines.push({
          journal_entry_id: entry.id,
          account_id: item.account_id,
          description: item.description,
          debit: 0,
          credit: item.total - item.tax_amount
        });
      }
    });

    // Credit: Tax payable
    if (invoice.tax_amount > 0) {
      lines.push({
        journal_entry_id: entry.id,
        account_id: settings.sales_tax_payable_id,
        description: 'Sales Tax',
        debit: 0,
        credit: invoice.tax_amount
      });
    }

    await supabase
      .from('mod_accounting.journal_entry_lines')
      .insert(lines);

    // Post the entry
    await supabase
      .from('mod_accounting.journal_entries')
      .update({ is_posted: true, posted_at: new Date().toISOString() })
      .eq('id', entry.id);
  }

  /**
   * Convert estimate to invoice
   */
  async convertToInvoice(estimateId: string): Promise<Invoice> {
    const { data: estimate } = await supabase
      .from('mod_accounting.invoices')
      .select(`
        *,
        items:mod_accounting.invoice_items(*)
      `)
      .eq('id', estimateId)
      .eq('type', 'estimate')
      .single();

    if (!estimate) throw new Error('Estimate not found');

    // Create new invoice from estimate
    return this.createInvoice(
      estimate.site_id,
      estimate.tenant_id,
      estimate.created_by,
      {
        type: 'invoice',
        client_id: estimate.client_id,
        payment_terms: estimate.payment_terms,
        items: estimate.items,
        discount_type: estimate.discount_type,
        discount_value: estimate.discount_value,
        notes: estimate.notes,
        terms: estimate.terms
      }
    );
  }
}
```

---

### Task 3: Expense Service (2 hours)

```typescript
// src/modules/accounting/services/expense-service.ts

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Expense {
  id: string;
  vendor_id?: string;
  expense_date: string;
  description: string;
  amount: number;
  tax_amount: number;
  total: number;
  category_id?: string;
  account_id?: string;
  is_paid: boolean;
  receipt_url?: string;
}

export class ExpenseService {
  /**
   * Create an expense
   */
  async createExpense(
    siteId: string,
    tenantId: string,
    userId: string,
    expense: {
      vendor_id?: string;
      expense_date: string;
      description: string;
      amount: number;
      tax_amount?: number;
      category_id?: string;
      account_id?: string;
      payment_method?: string;
      payment_account_id?: string;
      is_paid?: boolean;
      is_billable?: boolean;
      client_id?: string;
      receipt_url?: string;
      notes?: string;
    }
  ): Promise<Expense> {
    const total = expense.amount + (expense.tax_amount || 0);

    const { data, error } = await supabase
      .from('mod_accounting.expenses')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        vendor_id: expense.vendor_id,
        expense_date: expense.expense_date,
        description: expense.description,
        amount: expense.amount,
        tax_amount: expense.tax_amount || 0,
        total,
        category_id: expense.category_id,
        account_id: expense.account_id,
        payment_method: expense.payment_method,
        payment_account_id: expense.payment_account_id,
        is_paid: expense.is_paid ?? false,
        paid_date: expense.is_paid ? expense.expense_date : null,
        is_billable: expense.is_billable ?? false,
        client_id: expense.client_id,
        receipt_url: expense.receipt_url,
        notes: expense.notes,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Create journal entry if paid
    if (expense.is_paid) {
      await this.createExpenseJournalEntry(siteId, tenantId, userId, data);
    }

    return data;
  }

  /**
   * Scan receipt using AI
   */
  async scanReceipt(
    receiptUrl: string
  ): Promise<{
    vendor: string;
    date: string;
    total: number;
    tax: number;
    items: Array<{ description: string; amount: number }>;
    category: string;
  }> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this receipt image and extract the following information in JSON format:
              {
                "vendor": "store/company name",
                "date": "YYYY-MM-DD",
                "total": number,
                "tax": number,
                "items": [{"description": "item name", "amount": number}],
                "category": "one of: office_supplies, travel, meals, utilities, equipment, software, marketing, other"
              }
              Return only the JSON, no other text.`
            },
            {
              type: 'image_url',
              image_url: { url: receiptUrl }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  /**
   * Get expenses for period
   */
  async getExpenses(
    siteId: string,
    options: {
      startDate?: string;
      endDate?: string;
      vendorId?: string;
      categoryId?: string;
      isPaid?: boolean;
      isBillable?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ expenses: Expense[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const from = (page - 1) * limit;

    let query = supabase
      .from('mod_accounting.expenses')
      .select(`
        *,
        vendor:mod_accounting.vendors(name),
        category:mod_accounting.expense_categories(name)
      `, { count: 'exact' })
      .eq('site_id', siteId);

    if (options.startDate) {
      query = query.gte('expense_date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('expense_date', options.endDate);
    }
    if (options.vendorId) {
      query = query.eq('vendor_id', options.vendorId);
    }
    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options.isPaid !== undefined) {
      query = query.eq('is_paid', options.isPaid);
    }
    if (options.isBillable !== undefined) {
      query = query.eq('is_billable', options.isBillable);
    }

    query = query
      .order('expense_date', { ascending: false })
      .range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      expenses: data || [],
      total: count || 0
    };
  }

  /**
   * Get expense summary by category
   */
  async getExpenseSummary(
    siteId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{ category: string; amount: number; count: number }>> {
    const { data } = await supabase
      .from('mod_accounting.expenses')
      .select(`
        total,
        category:mod_accounting.expense_categories(name)
      `)
      .eq('site_id', siteId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    const summary: Record<string, { amount: number; count: number }> = {};

    (data || []).forEach(e => {
      const category = e.category?.name || 'Uncategorized';
      if (!summary[category]) {
        summary[category] = { amount: 0, count: 0 };
      }
      summary[category].amount += e.total;
      summary[category].count += 1;
    });

    return Object.entries(summary)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Bill expense to client
   */
  async billToClient(
    expenseId: string,
    invoiceId: string
  ): Promise<void> {
    await supabase
      .from('mod_accounting.expenses')
      .update({
        billed_invoice_id: invoiceId,
        is_billable: false
      })
      .eq('id', expenseId);
  }

  /**
   * Create journal entry for expense
   */
  private async createExpenseJournalEntry(
    siteId: string,
    tenantId: string,
    userId: string,
    expense: Expense
  ): Promise<void> {
    if (!expense.account_id) return;

    // Create journal entry
    const { data: entry } = await supabase
      .from('mod_accounting.journal_entries')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        entry_number: `JE-EXP-${expense.id.slice(0, 8)}`,
        entry_date: expense.expense_date,
        description: `Expense: ${expense.description}`,
        reference_type: 'expense',
        reference_id: expense.id,
        created_by: userId
      })
      .select()
      .single();

    if (!entry) return;

    const lines = [
      // Debit: Expense account
      {
        journal_entry_id: entry.id,
        account_id: expense.account_id,
        description: expense.description,
        debit: expense.total,
        credit: 0
      }
    ];

    // Credit: Payment account (cash/bank/payable)
    // This would be expense.payment_account_id if paid,
    // or accounts_payable_id if not paid
    
    await supabase
      .from('mod_accounting.journal_entry_lines')
      .insert(lines);
  }
}
```

---

### Task 4: Financial Reports Service (2 hours)

```typescript
// src/modules/accounting/services/reports-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ProfitLossReport {
  period: { start: string; end: string };
  revenue: {
    accounts: Array<{ name: string; amount: number }>;
    total: number;
  };
  expenses: {
    accounts: Array<{ name: string; amount: number }>;
    total: number;
  };
  netIncome: number;
}

export interface BalanceSheetReport {
  asOf: string;
  assets: {
    current: Array<{ name: string; amount: number }>;
    fixed: Array<{ name: string; amount: number }>;
    total: number;
  };
  liabilities: {
    current: Array<{ name: string; amount: number }>;
    longTerm: Array<{ name: string; amount: number }>;
    total: number;
  };
  equity: {
    accounts: Array<{ name: string; amount: number }>;
    total: number;
  };
}

export interface CashFlowReport {
  period: { start: string; end: string };
  operating: {
    items: Array<{ description: string; amount: number }>;
    total: number;
  };
  investing: {
    items: Array<{ description: string; amount: number }>;
    total: number;
  };
  financing: {
    items: Array<{ description: string; amount: number }>;
    total: number;
  };
  netChange: number;
  beginningCash: number;
  endingCash: number;
}

export class ReportsService {
  /**
   * Generate Profit & Loss report
   */
  async generateProfitLoss(
    siteId: string,
    startDate: string,
    endDate: string
  ): Promise<ProfitLossReport> {
    // Get all journal entry lines for the period
    const { data: entries } = await supabase
      .from('mod_accounting.journal_entry_lines')
      .select(`
        debit,
        credit,
        account:mod_accounting.accounts!inner(id, name, type)
      `)
      .eq('account.site_id', siteId)
      .in('account.type', ['revenue', 'expense'])
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate);

    const revenueAccounts: Record<string, number> = {};
    const expenseAccounts: Record<string, number> = {};

    (entries || []).forEach(entry => {
      const amount = (entry.credit || 0) - (entry.debit || 0);
      
      if (entry.account?.type === 'revenue') {
        revenueAccounts[entry.account.name] = 
          (revenueAccounts[entry.account.name] || 0) + amount;
      } else if (entry.account?.type === 'expense') {
        // For expenses, debit increases
        const expAmount = (entry.debit || 0) - (entry.credit || 0);
        expenseAccounts[entry.account.name] = 
          (expenseAccounts[entry.account.name] || 0) + expAmount;
      }
    });

    const revenueTotal = Object.values(revenueAccounts).reduce((a, b) => a + b, 0);
    const expenseTotal = Object.values(expenseAccounts).reduce((a, b) => a + b, 0);

    return {
      period: { start: startDate, end: endDate },
      revenue: {
        accounts: Object.entries(revenueAccounts).map(([name, amount]) => ({ name, amount })),
        total: revenueTotal
      },
      expenses: {
        accounts: Object.entries(expenseAccounts).map(([name, amount]) => ({ name, amount })),
        total: expenseTotal
      },
      netIncome: revenueTotal - expenseTotal
    };
  }

  /**
   * Generate Balance Sheet
   */
  async generateBalanceSheet(
    siteId: string,
    asOfDate: string
  ): Promise<BalanceSheetReport> {
    // Get all account balances
    const { data: accounts } = await supabase
      .from('mod_accounting.accounts')
      .select('id, name, type, subtype, current_balance')
      .eq('site_id', siteId)
      .eq('is_active', true);

    const assets = { current: [], fixed: [], total: 0 } as BalanceSheetReport['assets'];
    const liabilities = { current: [], longTerm: [], total: 0 } as BalanceSheetReport['liabilities'];
    const equity = { accounts: [], total: 0 } as BalanceSheetReport['equity'];

    (accounts || []).forEach(acc => {
      const item = { name: acc.name, amount: acc.current_balance || 0 };

      switch (acc.type) {
        case 'asset':
          if (acc.subtype === 'current' || acc.subtype === 'cash') {
            assets.current.push(item);
          } else {
            assets.fixed.push(item);
          }
          assets.total += item.amount;
          break;
        case 'liability':
          if (acc.subtype === 'current') {
            liabilities.current.push(item);
          } else {
            liabilities.longTerm.push(item);
          }
          liabilities.total += item.amount;
          break;
        case 'equity':
          equity.accounts.push(item);
          equity.total += item.amount;
          break;
      }
    });

    return {
      asOf: asOfDate,
      assets,
      liabilities,
      equity
    };
  }

  /**
   * Generate Cash Flow Statement
   */
  async generateCashFlow(
    siteId: string,
    startDate: string,
    endDate: string
  ): Promise<CashFlowReport> {
    // Get payments received
    const { data: paymentsReceived } = await supabase
      .from('mod_accounting.payments')
      .select('amount')
      .eq('site_id', siteId)
      .eq('type', 'received')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate);

    // Get payments sent
    const { data: paymentsSent } = await supabase
      .from('mod_accounting.payments')
      .select('amount')
      .eq('site_id', siteId)
      .eq('type', 'sent')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate);

    // Get expenses paid
    const { data: expensesPaid } = await supabase
      .from('mod_accounting.expenses')
      .select('total')
      .eq('site_id', siteId)
      .eq('is_paid', true)
      .gte('paid_date', startDate)
      .lte('paid_date', endDate);

    const receivedTotal = (paymentsReceived || []).reduce((sum, p) => sum + p.amount, 0);
    const sentTotal = (paymentsSent || []).reduce((sum, p) => sum + p.amount, 0);
    const expenseTotal = (expensesPaid || []).reduce((sum, e) => sum + e.total, 0);

    const operating = {
      items: [
        { description: 'Collections from Customers', amount: receivedTotal },
        { description: 'Payments to Vendors', amount: -sentTotal },
        { description: 'Operating Expenses', amount: -expenseTotal }
      ],
      total: receivedTotal - sentTotal - expenseTotal
    };

    // For now, simplified investing and financing sections
    const investing = { items: [], total: 0 };
    const financing = { items: [], total: 0 };

    const netChange = operating.total + investing.total + financing.total;

    return {
      period: { start: startDate, end: endDate },
      operating,
      investing,
      financing,
      netChange,
      beginningCash: 0, // Would need to calculate from prior period
      endingCash: netChange
    };
  }

  /**
   * Generate Accounts Receivable Aging
   */
  async generateARaging(
    siteId: string
  ): Promise<Array<{
    client: string;
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    total: number;
  }>> {
    const today = new Date();
    
    const { data: invoices } = await supabase
      .from('mod_accounting.invoices')
      .select(`
        amount_due,
        due_date,
        client:mod_accounting.clients(name)
      `)
      .eq('site_id', siteId)
      .in('status', ['sent', 'viewed', 'partial', 'overdue'])
      .gt('amount_due', 0);

    const agingByClient: Record<string, {
      current: number;
      days30: number;
      days60: number;
      days90: number;
      over90: number;
      total: number;
    }> = {};

    (invoices || []).forEach(inv => {
      const clientName = inv.client?.name || 'Unknown';
      if (!agingByClient[clientName]) {
        agingByClient[clientName] = {
          current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0
        };
      }

      const dueDate = new Date(inv.due_date);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPastDue <= 0) {
        agingByClient[clientName].current += inv.amount_due;
      } else if (daysPastDue <= 30) {
        agingByClient[clientName].days30 += inv.amount_due;
      } else if (daysPastDue <= 60) {
        agingByClient[clientName].days60 += inv.amount_due;
      } else if (daysPastDue <= 90) {
        agingByClient[clientName].days90 += inv.amount_due;
      } else {
        agingByClient[clientName].over90 += inv.amount_due;
      }
      agingByClient[clientName].total += inv.amount_due;
    });

    return Object.entries(agingByClient)
      .map(([client, data]) => ({ client, ...data }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Generate Tax Summary
   */
  async generateTaxSummary(
    siteId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    salesTaxCollected: number;
    salesTaxPaid: number;
    netTaxOwed: number;
    byRate: Array<{ name: string; rate: number; collected: number; paid: number }>;
  }> {
    // Get tax collected from invoices
    const { data: invoices } = await supabase
      .from('mod_accounting.invoices')
      .select('tax_amount')
      .eq('site_id', siteId)
      .in('status', ['paid', 'partial'])
      .gte('issue_date', startDate)
      .lte('issue_date', endDate);

    // Get tax paid on expenses
    const { data: expenses } = await supabase
      .from('mod_accounting.expenses')
      .select('tax_amount')
      .eq('site_id', siteId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    const collected = (invoices || []).reduce((sum, i) => sum + (i.tax_amount || 0), 0);
    const paid = (expenses || []).reduce((sum, e) => sum + (e.tax_amount || 0), 0);

    return {
      salesTaxCollected: collected,
      salesTaxPaid: paid,
      netTaxOwed: collected - paid,
      byRate: []
    };
  }
}
```

---

### Task 5: Invoice UI Component (2 hours)

```tsx
// src/modules/accounting/components/InvoiceEditor.tsx

'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Send,
  Save,
  Download,
  Eye,
  Calculator
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Separator
} from '@/components/ui';

interface Client {
  id: string;
  name: string;
  email: string;
  payment_terms: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  unit_price: number;
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
}

interface LineItem {
  id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate_id?: string;
  total: number;
}

interface InvoiceEditorProps {
  clients: Client[];
  products: Product[];
  taxRates: TaxRate[];
  onSave: (invoice: {
    client_id: string;
    issue_date: string;
    due_date: string;
    items: LineItem[];
    notes?: string;
    terms?: string;
  }) => Promise<void>;
  onSend: () => Promise<void>;
  initialData?: {
    client_id: string;
    items: LineItem[];
    notes?: string;
  };
}

export function InvoiceEditor({
  clients,
  products,
  taxRates,
  onSave,
  onSend,
  initialData
}: InvoiceEditorProps) {
  const [clientId, setClientId] = useState(initialData?.client_id || '');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LineItem[]>(initialData?.items || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [terms, setTerms] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedClient = clients.find(c => c.id === clientId);

  // Calculate due date when client changes
  const handleClientChange = (id: string) => {
    setClientId(id);
    const client = clients.find(c => c.id === id);
    if (client) {
      const due = new Date();
      due.setDate(due.getDate() + client.payment_terms);
      setDueDate(due.toISOString().split('T')[0]);
    }
  };

  const addLineItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    }]);
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, ...updates };
      
      // Recalculate total
      const subtotal = updated.quantity * updated.unit_price;
      const taxRate = taxRates.find(t => t.id === updated.tax_rate_id);
      const tax = taxRate ? subtotal * (taxRate.rate / 100) : 0;
      updated.total = subtotal + tax;
      
      return updated;
    }));
  };

  const removeLineItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateLineItem(itemId, {
        product_id: productId,
        description: product.name,
        unit_price: product.unit_price
      });
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    
    const tax = items.reduce((sum, item) => {
      const taxRate = taxRates.find(t => t.id === item.tax_rate_id);
      if (!taxRate) return sum;
      return sum + (item.quantity * item.unit_price * (taxRate.rate / 100));
    }, 0);
    
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        items,
        notes,
        terms
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>New Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client</Label>
              <Select value={clientId} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {selectedClient && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">{selectedClient.name}</p>
              <p className="text-muted-foreground">{selectedClient.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[80px]">Qty</TableHead>
                <TableHead className="w-[100px]">Price</TableHead>
                <TableHead className="w-[120px]">Tax</TableHead>
                <TableHead className="w-[100px] text-right">Total</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Select
                      value={item.product_id}
                      onValueChange={(v) => handleProductSelect(item.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                      placeholder="Description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, { unit_price: parseFloat(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.tax_rate_id}
                      onValueChange={(v) => updateLineItem(item.id, { tax_rate_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {taxRates.map(rate => (
                          <SelectItem key={rate.id} value={rate.id}>
                            {rate.name} ({rate.rate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No line items added yet</p>
              <Button variant="outline" className="mt-2" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Notes (visible to client)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thank you for your business!"
              rows={3}
            />
          </div>
          <div>
            <Label>Terms & Conditions</Label>
            <Textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Payment is due within the specified terms..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={onSend} disabled={!clientId || items.length === 0}>
          <Send className="h-4 w-4 mr-2" />
          Save & Send
        </Button>
      </div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Chart of accounts setup
- [ ] Clients and vendors create
- [ ] Invoices generate correctly
- [ ] Tax calculations work
- [ ] Payments record properly
- [ ] Expenses track correctly
- [ ] Receipt scanning works
- [ ] Reports generate accurately
- [ ] Journal entries balance
- [ ] Bank sync functions

---

## 📍 Dependencies

- **Requires**: EM-01, EM-11, EM-12, EM-50
- **Required by**: Financial reporting, tax compliance
- **External**: Stripe, Plaid, OpenAI (receipt scanning)
