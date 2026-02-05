/**
 * E-Commerce Module TypeScript Types
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * These types define the data structures for all E-Commerce entities
 * Following CRM/Booking module pattern exactly
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type ProductStatus = 'draft' | 'active' | 'archived'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'partially_refunded' | 'refunded' | 'failed'
export type PaymentProvider = 'paddle' | 'flutterwave' | 'pesapal' | 'dpo' | 'manual'
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled'
export type CartStatus = 'active' | 'abandoned' | 'converted'
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping'
export type DiscountAppliesTo = 'all' | 'products' | 'categories'

// ============================================================================
// CATEGORIES
// ============================================================================

export interface Category {
  id: string
  site_id: string
  agency_id: string
  parent_id: string | null
  
  name: string
  slug: string
  description: string | null
  image_url: string | null
  
  sort_order: number
  is_active: boolean
  
  seo_title: string | null
  seo_description: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  children?: Category[]
  products?: Product[]
  parent?: Category | null
}

export type CategoryInput = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'children' | 'products' | 'parent'>
export type CategoryUpdate = Partial<CategoryInput>

// ============================================================================
// PRODUCTS
// ============================================================================

export interface Product {
  id: string
  site_id: string
  agency_id: string
  
  // Basic Info
  name: string
  slug: string
  description: string | null
  short_description: string | null
  
  // Pricing
  base_price: number
  compare_at_price: number | null
  cost_price: number | null
  
  // Tax
  tax_class: string
  is_taxable: boolean
  
  // Inventory
  sku: string | null
  barcode: string | null
  track_inventory: boolean
  quantity: number
  low_stock_threshold: number
  
  // Physical
  weight: number | null
  weight_unit: string
  
  // Status
  status: ProductStatus
  is_featured: boolean
  
  // SEO
  seo_title: string | null
  seo_description: string | null
  
  // Media
  images: string[]
  
  // Metadata
  metadata: Record<string, unknown>
  
  // Audit
  created_by: string | null
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  categories?: Category[]
  variants?: ProductVariant[]
  options?: ProductOption[]
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'categories' | 'variants' | 'options'>
export type ProductUpdate = Partial<ProductInput>

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

export interface ProductVariant {
  id: string
  product_id: string
  
  options: Record<string, string>
  
  price: number | null
  compare_at_price: number | null
  
  sku: string | null
  barcode: string | null
  quantity: number
  
  image_url: string | null
  
  is_active: boolean
  
  created_at: string
}

export type ProductVariantInput = Omit<ProductVariant, 'id' | 'created_at'>
export type ProductVariantUpdate = Partial<ProductVariantInput>

// ============================================================================
// PRODUCT OPTIONS
// ============================================================================

export interface ProductOption {
  id: string
  product_id: string
  
  name: string
  values: string[]
  sort_order: number
}

export type ProductOptionInput = Omit<ProductOption, 'id'>
export type ProductOptionUpdate = Partial<ProductOptionInput>

// ============================================================================
// CART
// ============================================================================

export interface Cart {
  id: string
  site_id: string
  user_id: string | null
  session_id: string | null
  
  discount_code: string | null
  discount_amount: number
  currency: string
  status: CartStatus
  
  created_at: string
  updated_at: string
  expires_at: string
  
  // Relations
  items: CartItem[]
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string | null
  
  quantity: number
  unit_price: number
  custom_options: Record<string, unknown>
  
  created_at: string
  
  // Populated fields
  product?: Product
  variant?: ProductVariant
}

export type CartItemInput = Omit<CartItem, 'id' | 'created_at' | 'product' | 'variant'>
export type CartItemUpdate = Partial<Pick<CartItem, 'quantity' | 'custom_options'>>

// ============================================================================
// ORDERS
// ============================================================================

export interface Order {
  id: string
  site_id: string
  agency_id: string
  
  order_number: string
  
  // Customer
  customer_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  
  // Addresses
  shipping_address: Address | Record<string, string> | null
  billing_address: Address | Record<string, string> | null
  
  // Amounts
  subtotal: number
  discount_amount: number
  discount_code: string | null
  discount_total: number
  shipping_amount: number
  shipping_total: number
  tax_amount: number
  tax_total: number
  total: number
  currency: string
  
  // Status
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string | null
  payment_provider: PaymentProvider | null
  payment_transaction_id: string | null
  
  // Fulfillment
  fulfillment_status: FulfillmentStatus
  shipping_method: string | null
  tracking_number: string | null
  tracking_url: string | null
  shipped_at: string | null
  delivered_at: string | null
  
  // Notes
  notes: string | null
  customer_notes: string | null
  internal_notes: string | null
  
  // Metadata
  metadata: Record<string, unknown>
  
  created_at: string
  updated_at: string
  
  // Relations
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  
  product_name: string
  product_sku: string | null
  variant_name?: string | null
  variant_options: Record<string, string>
  product_image?: string | null
  image_url: string | null
  sku?: string | null
  
  quantity: number
  unit_price: number
  total_price: number
  
  fulfilled_quantity: number
  
  created_at: string
}

export interface Address {
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
}

export type OrderInput = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'items'>
export type OrderUpdate = Partial<OrderInput>

// ============================================================================
// DISCOUNTS
// ============================================================================

export interface Discount {
  id: string
  site_id: string
  agency_id: string
  
  code: string
  description: string | null
  
  type: DiscountType
  value: number
  
  minimum_order_amount: number | null
  minimum_quantity: number | null
  applies_to: DiscountAppliesTo
  applies_to_ids: string[]
  
  usage_limit: number | null
  usage_count: number
  once_per_customer: boolean
  
  starts_at: string
  ends_at: string | null
  is_active: boolean
  
  created_at: string
}

export type DiscountInput = Omit<Discount, 'id' | 'created_at' | 'usage_count'>
export type DiscountUpdate = Partial<DiscountInput>

// ============================================================================
// CREATE ORDER INPUT
// ============================================================================

export interface CreateOrderInput {
  site_id: string
  user_id?: string | null
  cart_id?: string
  status?: OrderStatus
  payment_status?: PaymentStatus
  payment_provider?: PaymentProvider
  subtotal: number
  discount?: number
  tax?: number
  shipping?: number
  total: number
  currency: string
  shipping_address: Address
  billing_address: Address
  customer_email: string
  customer_name?: string | null
  customer_phone?: string | null
  discount_code?: string | null
  discount_id?: string | null
  notes?: string | null
  metadata?: Record<string, unknown>
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface EcommerceSettings {
  id: string
  site_id: string
  agency_id: string
  
  store_name: string | null
  store_email: string | null
  store_phone: string | null
  store_address: Address | null
  store_url: string | null
  
  currency: string
  tax_rate: number
  tax_included_in_price: boolean
  
  manual_payment_instructions: string | null
  
  shipping_zones: ShippingZone[]
  free_shipping_threshold: number | null
  
  enable_guest_checkout: boolean
  require_phone: boolean
  
  paddle_config: PaddleConfig | null        // Global SaaS/subscription payments
  flutterwave_config: FlutterwaveConfig | null // Primary African e-commerce (Zambia)
  pesapal_config: PesapalConfig | null      // Secondary African option
  dpo_config: DpoConfig | null              // Zambian local backup
  
  order_notification_email: string | null
  send_order_confirmation: boolean
  
  continue_selling_when_out_of_stock: boolean
  
  created_at: string
  updated_at: string
}

export type EcommerceSettingsInput = Omit<EcommerceSettings, 'id' | 'created_at' | 'updated_at'>
export type EcommerceSettingsUpdate = Partial<EcommerceSettingsInput>

// ============================================================================
// SHIPPING
// ============================================================================

export interface ShippingZone {
  id: string
  name: string
  countries: string[]
  rates: ShippingRate[]
}

export interface ShippingRate {
  id: string
  name: string
  price: number
  min_order_amount?: number
  max_order_amount?: number
  estimated_days_min?: number
  estimated_days_max?: number
}

// ============================================================================
// PAYMENT PROVIDER CONFIGS
// ============================================================================

export interface PaddleConfig {
  enabled: boolean
  vendor_id: string
  api_key: string  // stored server-side only
  public_key: string
  webhook_secret?: string
  environment: 'sandbox' | 'production'
}

export interface FlutterwaveConfig {
  enabled: boolean
  public_key: string
  secret_key: string  // stored server-side only
  encryption_key: string  // stored server-side only
  webhook_secret_hash: string  // stored server-side only
  secret_hash: string  // alias for webhook verification
  environment: 'test' | 'live'
  // Supported payment methods
  supported_methods: Array<'card' | 'mobilemoney' | 'bank_transfer' | 'ussd'>
}

export interface PesapalConfig {
  enabled: boolean
  consumer_key: string
  consumer_secret: string  // stored server-side only
  callback_url: string
  ipn_url: string
  environment: 'demo' | 'live'
}

export interface DpoConfig {
  enabled: boolean
  company_token: string
  service_type: string
  callback_url: string
  environment: 'test' | 'live'
}

// ============================================================================
// FILTERS & SEARCH
// ============================================================================

export interface ProductFilters {
  category?: string
  status?: ProductStatus
  search?: string
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

export interface OrderFilters {
  status?: OrderStatus
  payment_status?: PaymentStatus
  fulfillment_status?: FulfillmentStatus
  search?: string
  date_from?: string
  date_to?: string
  customer_id?: string
}

export interface CategoryFilters {
  parent_id?: string | null
  is_active?: boolean
  search?: string
}

// ============================================================================
// CART TOTALS
// ============================================================================

export interface CartTotals {
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  itemCount: number
}

// ============================================================================
// CHECKOUT
// ============================================================================

export interface CheckoutData {
  email: string
  phone?: string
  shipping_address: Address
  billing_address?: Address
  shipping_method?: string
  shipping_amount?: number
  customer_notes?: string
  payment_method?: string
}

export interface CheckoutResult {
  success: boolean
  order_id?: string
  order_number?: string
  payment_url?: string
  error?: string
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface SalesAnalytics {
  total_revenue: number
  total_orders: number
  average_order_value: number
  top_products: Array<{
    product_id: string
    product_name: string
    quantity_sold: number
    revenue: number
  }>
  orders_by_status: Record<OrderStatus, number>
  revenue_by_day: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

export interface InventoryAnalytics {
  total_products: number
  in_stock: number
  low_stock: number
  out_of_stock: number
  low_stock_products: Product[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  limit: number
}

export interface ProductsResponse extends PaginatedResponse<Product> {}
export interface OrdersResponse extends PaginatedResponse<Order> {}
export interface CategoriesResponse {
  data: Category[]
  total: number
}

// ============================================================================
// NAVIGATION & DASHBOARD TYPES (PHASE ECOM-01 + Wave 5)
// ============================================================================

export type EcommerceView = 
  | 'home'
  | 'products' 
  | 'orders' 
  | 'customers'
  | 'categories' 
  | 'discounts' 
  | 'quotes'
  | 'inventory'
  | 'analytics'
  | 'marketing'
  | 'developer'
  | 'settings'

export interface EcommerceNavItem {
  id: EcommerceView
  label: string
  icon: string
  badge?: number | string
  badgeVariant?: 'default' | 'destructive' | 'warning' | 'success'
  children?: EcommerceNavItem[]
}

export interface DashboardStats {
  totalRevenue: number
  revenueChange: number // percentage change from previous period
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  activeProducts: number
  draftProducts: number
  lowStockProducts: number
  totalCustomers: number
  newCustomersThisWeek: number
}

export interface RecentOrderSummary {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  currency: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
}

export interface LowStockProduct {
  id: string
  name: string
  sku: string | null
  quantity: number
  lowStockThreshold: number
  imageUrl: string | null
}

export interface ActivityItem {
  id: string
  type: 'order' | 'product' | 'customer' | 'review' | 'discount'
  action: 'created' | 'updated' | 'deleted' | 'status_changed'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export type StatsPeriod = 'today' | 'week' | 'month' | 'year'

// ============================================================================
// ENHANCED PRODUCT MANAGEMENT TYPES (Phase ECOM-02)
// ============================================================================

export interface ProductTableFilters {
  search: string
  status: ProductStatus | 'all'
  category: string | 'all'
  stockLevel: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  priceMin: number | null
  priceMax: number | null
  dateFrom: string | null
  dateTo: string | null
  featured: boolean | null
}

export interface ProductTableColumn {
  id: string
  label: string
  visible: boolean
  sortable: boolean
}

export type BulkAction = 
  | 'delete'
  | 'set_active'
  | 'set_draft'
  | 'set_archived'
  | 'assign_category'
  | 'adjust_price'
  | 'adjust_stock'

export interface BulkActionResult {
  success: boolean
  affected: number
  errors: string[]
}

export interface ProductImportRow {
  name: string
  sku?: string
  description?: string
  base_price: number
  compare_at_price?: number
  quantity?: number
  category?: string
  status?: ProductStatus
  images?: string
  track_inventory?: boolean
  low_stock_threshold?: number
}

export interface ProductImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

export interface ProductExportOptions {
  format: 'csv' | 'xlsx'
  includeFields: string[]
  filters?: ProductTableFilters
  includeVariants: boolean
  includeImages: boolean
}

// ============================================================================
// SETTINGS CONFIGURATION TYPES (Phase ECOM-03)
// ============================================================================

export type SettingsTab = 
  | 'general'
  | 'currency'
  | 'tax'
  | 'shipping'
  | 'payments'
  | 'checkout'
  | 'notifications'
  | 'inventory'
  | 'legal'
  | 'quotes'

export interface GeneralSettings {
  store_name: string
  store_email: string
  store_phone: string
  store_address: {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  timezone: string
  date_format: string
  time_format: string
  weight_unit: 'kg' | 'lb' | 'g' | 'oz'
  dimension_unit: 'cm' | 'in' | 'm' | 'ft'
}

export interface CurrencySettings {
  default_currency: string
  currency_position: 'before' | 'after'
  currency_symbol: string
  decimal_separator: string
  thousand_separator: string
  decimal_places: number
  supported_currencies: string[]
  auto_currency_conversion: boolean
}

export interface TaxZone {
  id: string
  name: string
  countries: string[]
  states?: string[]
  tax_rates: TaxRate[]
}

export interface TaxRate {
  id: string
  name: string
  rate: number
  tax_class: string
  compound: boolean
  shipping_taxable: boolean
}

export interface TaxSettings {
  tax_enabled: boolean
  prices_include_tax: boolean
  tax_based_on: 'billing' | 'shipping' | 'store'
  shipping_tax_class: string
  display_prices: 'including' | 'excluding'
  display_in_cart: 'including' | 'excluding' | 'both'
  tax_rounding_mode: 'round' | 'ceil' | 'floor'
  tax_zones: TaxZone[]
}

export interface ShippingZone {
  id: string
  name: string
  regions: string[]
  methods: ShippingMethod[]
}

export interface ShippingMethod {
  id: string
  name: string
  type: 'flat_rate' | 'free_shipping' | 'local_pickup' | 'table_rate' | 'carrier_calculated'
  enabled: boolean
  cost: number
  free_shipping_threshold?: number
  min_order_amount?: number
  max_order_amount?: number
  handling_fee?: number
  tax_status: 'taxable' | 'none'
  delivery_time?: string
}

export interface ShippingSettings {
  enable_shipping: boolean
  shipping_origin: {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  shipping_zones: ShippingZone[]
  default_package_dimensions: {
    length: number
    width: number
    height: number
    weight: number
  }
  shipping_calculations: 'per_order' | 'per_item' | 'per_class'
}

export interface PaymentGateway {
  id: string
  name: string
  type: 'stripe' | 'paypal' | 'square' | 'manual' | 'cod' | 'bank_transfer'
  enabled: boolean
  test_mode: boolean
  api_key?: string
  secret_key?: string
  webhook_secret?: string
  additional_settings?: Record<string, unknown>
}

export interface PaymentSettings {
  accepted_methods: ('credit_card' | 'paypal' | 'bank_transfer' | 'cod')[]
  gateways: PaymentGateway[]
  capture_mode: 'automatic' | 'manual'
  statement_descriptor: string
  allow_partial_payments: boolean
  min_order_amount: number
  max_order_amount?: number
}

export interface CheckoutSettings {
  guest_checkout: boolean
  require_phone: boolean
  require_company: boolean
  address_autocomplete: boolean
  show_order_notes: boolean
  terms_page_id?: string
  privacy_page_id?: string
  thank_you_page_id?: string
  checkout_fields: CheckoutField[]
  express_checkout: {
    enabled: boolean
    providers: ('apple_pay' | 'google_pay' | 'paypal_express')[]
  }
}

export interface CheckoutField {
  id: string
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea'
  required: boolean
  enabled: boolean
  position: 'billing' | 'shipping' | 'order'
  options?: string[]
}

export interface NotificationTemplate {
  id: string
  type: 'order_confirmation' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'payment_received' | 'refund_issued' | 'low_stock' | 'back_in_stock' | 'abandoned_cart'
  enabled: boolean
  subject: string
  body: string
  send_to: 'customer' | 'admin' | 'both'
}

export interface NotificationSettings {
  email_from_name: string
  email_from_address: string
  email_header_logo?: string
  email_footer_text: string
  templates: NotificationTemplate[]
  admin_notifications: {
    new_order: boolean
    low_stock: boolean
    new_review: boolean
    refund_request: boolean
  }
}

export interface InventorySettings {
  track_inventory: boolean
  allow_backorders: 'no' | 'notify' | 'yes'
  hold_stock_minutes: number
  low_stock_threshold: number
  out_of_stock_visibility: 'hide' | 'show' | 'show_marked'
  stock_display: 'always' | 'low_only' | 'never'
  manage_stock_status: boolean
  reserved_stock_expiry_hours: number
}

export interface LegalSettings {
  terms_and_conditions: string
  privacy_policy: string
  refund_policy: string
  shipping_policy: string
  cookie_policy?: string
  terms_accepted_timestamp_required: boolean
  minimum_age_verification?: number
}

export interface EcommerceSettingsComplete {
  general: GeneralSettings
  currency: CurrencySettings
  tax: TaxSettings
  shipping: ShippingSettings
  payments: PaymentSettings
  checkout: CheckoutSettings
  notifications: NotificationSettings
  inventory: InventorySettings
  legal: LegalSettings
  quotes: QuoteSiteSettings | null
}

// ============================================================================
// ORDER MANAGEMENT TYPES (Phase ECOM-04)
// ============================================================================

export type OrderEventType = 
  | 'created'
  | 'confirmed'
  | 'payment_received'
  | 'payment_failed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund_requested'
  | 'refund_processed'
  | 'note_added'
  | 'status_changed'
  | 'email_sent'

export interface OrderTimelineEvent {
  id: string
  order_id: string
  event_type: OrderEventType
  title: string
  description?: string
  metadata?: Record<string, unknown>
  user_id?: string
  user_name?: string
  created_at: string
}

export interface OrderNote {
  id: string
  order_id: string
  content: string
  is_internal: boolean
  user_id: string
  user_name: string
  created_at: string
}

export interface OrderShipment {
  id: string
  order_id: string
  carrier: string
  tracking_number: string
  tracking_url?: string
  shipped_at: string
  delivered_at?: string
  status: 'pending' | 'in_transit' | 'delivered' | 'failed'
  items: Array<{
    order_item_id: string
    quantity: number
  }>
}

export interface OrderRefund {
  id: string
  order_id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'processed' | 'rejected'
  refund_method: 'original_payment' | 'store_credit' | 'other'
  items?: Array<{
    order_item_id: string
    quantity: number
    amount: number
  }>
  processed_at?: string
  processed_by?: string
  created_at: string
}

export interface OrderTableFilters {
  search: string
  status: OrderStatus | 'all'
  paymentStatus: PaymentStatus | 'all'
  dateFrom: string | null
  dateTo: string | null
  minTotal: number | null
  maxTotal: number | null
}

export interface OrderBulkAction {
  action: 'update_status' | 'export' | 'print_invoices' | 'print_labels' | 'archive'
  orderIds: string[]
  params?: Record<string, unknown>
}

export interface OrderDetailData extends Order {
  timeline: OrderTimelineEvent[]
  order_notes: OrderNote[]
  shipments: OrderShipment[]
  refunds: OrderRefund[]
}

export interface InvoiceData {
  order: Order
  store: {
    name: string
    address: string
    email: string
    phone?: string
    logo?: string
  }
  invoice_number: string
  invoice_date: string
  due_date?: string
}

export interface PackingSlipData {
  order: Order
  store: {
    name: string
    address: string
  }
  packing_date: string
  notes?: string
}

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

export interface CustomerStats {
  total: number
  active: number
  guests: number
  withOrders: number
  newThisMonth: number
  totalRevenue: number
}

// ============================================================================
// QUOTATION SYSTEM TYPES (Phase ECOM-10)
// ============================================================================

/**
 * Quote status union type
 * Represents all possible states in the quote workflow
 */
export type QuoteStatus = 
  | 'draft'           // Being created or edited
  | 'pending_approval' // Awaiting internal approval
  | 'sent'            // Sent to customer
  | 'viewed'          // Customer has viewed
  | 'accepted'        // Customer accepted
  | 'rejected'        // Customer rejected
  | 'expired'         // Past validity date
  | 'converted'       // Converted to order
  | 'cancelled'       // Cancelled by staff

/**
 * Quote activity types for audit logging
 */
export type QuoteActivityType =
  | 'created'
  | 'updated'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'cancelled'
  | 'note_added'
  | 'reminder_sent'
  | 'item_added'
  | 'item_removed'
  | 'item_updated'
  | 'status_changed'
  | 'resent'
  | 'duplicated'

/**
 * Quote discount type
 */
export type QuoteDiscountType = 'percentage' | 'fixed'

/**
 * Main Quote interface
 */
export interface Quote {
  id: string
  site_id: string
  agency_id: string
  
  // Identification
  quote_number: string
  reference_number?: string | null
  
  // Customer
  customer_id?: string | null
  customer_email: string
  customer_name: string
  customer_company?: string | null
  customer_phone?: string | null
  
  // Addresses
  billing_address?: Address | null
  shipping_address?: Address | null
  
  // Status
  status: QuoteStatus
  
  // Amounts
  subtotal: number
  discount_type?: QuoteDiscountType | null
  discount_value: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  shipping_amount: number
  total: number
  currency: string
  
  // Validity
  valid_from: string
  valid_until?: string | null
  
  // Content
  title?: string | null
  introduction?: string | null
  terms_and_conditions?: string | null
  notes_to_customer?: string | null
  internal_notes?: string | null
  
  // Tracking
  sent_at?: string | null
  viewed_at?: string | null
  first_viewed_at?: string | null
  view_count: number
  responded_at?: string | null
  response_notes?: string | null
  
  // Reminder tracking (ECOM-13)
  reminder_count?: number
  last_reminder_at?: string | null
  
  // Conversion
  converted_to_order_id?: string | null
  converted_at?: string | null
  
  // Access
  access_token: string
  
  // Metadata
  template_id?: string | null
  created_by?: string | null
  last_modified_by?: string | null
  metadata: Record<string, unknown>
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  items?: QuoteItem[]
  activities?: QuoteActivity[]
  customer?: Customer | null
}

/**
 * Quote line item interface
 */
export interface QuoteItem {
  id: string
  quote_id: string
  
  // Product reference
  product_id?: string | null
  variant_id?: string | null
  
  // Item details (snapshot)
  name: string
  sku?: string | null
  description?: string | null
  image_url?: string | null
  
  // Pricing
  quantity: number
  unit_price: number
  discount_percent: number
  tax_rate: number
  line_total: number
  
  // Options
  options: Record<string, string>
  
  // Sorting
  sort_order: number
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  product?: Product | null
  variant?: ProductVariant | null
}

/**
 * Quote activity/audit log interface
 */
export interface QuoteActivity {
  id: string
  quote_id: string
  
  activity_type: QuoteActivityType
  description: string
  
  // Tracking
  performed_by?: string | null
  performed_by_name?: string | null
  ip_address?: string | null
  user_agent?: string | null
  
  // Change tracking
  old_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
  metadata: Record<string, unknown>
  
  created_at: string
}

/**
 * Quote template interface
 */
export interface QuoteTemplate {
  id: string
  site_id: string
  agency_id: string
  
  // Identification
  name: string
  description?: string | null
  
  // Default content
  default_title?: string | null
  default_introduction?: string | null
  default_terms?: string | null
  default_notes?: string | null
  default_validity_days: number
  
  // Pre-filled items
  items: QuoteTemplateItem[]
  
  // Default discount
  default_discount_type?: QuoteDiscountType | null
  default_discount_value: number
  
  // Settings
  is_default: boolean
  is_active: boolean
  
  // Usage tracking
  use_count: number
  usage_count: number // Alias for use_count
  last_used_at?: string | null
  created_by?: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Template item structure (stored in JSONB)
 */
export interface QuoteTemplateItem {
  product_id?: string | null
  variant_id?: string | null
  name: string
  sku?: string | null
  description?: string | null
  quantity: number
  unit_price: number
  discount_percent?: number
}

/**
 * Quote settings interface (site-specific)
 */
export interface QuoteSettings {
  id: string
  site_id: string
  agency_id: string
  
  // Numbering
  quote_number_prefix: string
  quote_number_counter: number
  quote_number_format: string
  
  // Defaults
  default_validity_days: number
  default_terms?: string | null
  default_currency: string
  
  // Automation
  auto_expire_enabled: boolean
  reminder_enabled: boolean
  reminder_days_before_expiry: number
  
  // Email
  send_copy_to_admin: boolean
  admin_notification_email?: string | null
  
  // PDF branding
  pdf_logo_url?: string | null
  pdf_header_color: string
  pdf_show_bank_details: boolean
  pdf_bank_details?: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
}

// ============================================================================
// QUOTE INPUT/UPDATE TYPES
// ============================================================================

/**
 * Input type for creating a quote
 */
export interface QuoteInput {
  site_id: string
  agency_id: string
  
  // Optional reference
  reference_number?: string
  
  // Customer
  customer_id?: string
  customer_email: string
  customer_name: string
  customer_company?: string
  customer_phone?: string
  
  // Addresses
  billing_address?: Address
  shipping_address?: Address
  
  // Amounts (auto-calculated but can be overridden)
  discount_type?: QuoteDiscountType
  discount_value?: number
  tax_rate?: number
  shipping_amount?: number
  currency?: string
  
  // Validity
  valid_from?: string
  valid_until?: string
  
  // Content
  title?: string
  introduction?: string
  terms_and_conditions?: string
  notes_to_customer?: string
  internal_notes?: string
  
  // Template reference
  template_id?: string
  
  // Metadata
  metadata?: Record<string, unknown>
}

/**
 * Input type for updating a quote
 */
export type QuoteUpdate = Partial<Omit<QuoteInput, 'site_id' | 'agency_id'>>

/**
 * Input type for creating a quote item
 */
export interface QuoteItemInput {
  quote_id: string
  
  // Product reference (optional)
  product_id?: string
  variant_id?: string
  
  // Item details
  name: string
  sku?: string
  description?: string
  image_url?: string
  
  // Pricing
  quantity: number
  unit_price: number
  discount_percent?: number
  tax_rate?: number
  
  // Options
  options?: Record<string, string>
  
  // Sorting
  sort_order?: number
}

/**
 * Input type for updating a quote item
 */
export type QuoteItemUpdate = Partial<Omit<QuoteItemInput, 'quote_id'>>

/**
 * Input type for creating a template
 */
export interface QuoteTemplateInput {
  site_id: string
  agency_id: string
  
  name: string
  description?: string
  
  default_title?: string
  default_introduction?: string
  default_terms?: string
  default_notes?: string
  default_validity_days?: number
  
  items?: QuoteTemplateItem[]
  
  default_discount_type?: QuoteDiscountType
  default_discount_value?: number
  
  is_default?: boolean
  is_active?: boolean
}

/**
 * Input type for updating a template
 */
export type QuoteTemplateUpdate = Partial<Omit<QuoteTemplateInput, 'site_id' | 'agency_id'>>

/**
 * Input type for quote settings
 */
export type QuoteSettingsInput = Omit<QuoteSettings, 'id' | 'created_at' | 'updated_at'>
export type QuoteSettingsUpdate = Partial<Omit<QuoteSettingsInput, 'site_id' | 'agency_id'>>

// ============================================================================
// QUOTE FILTER & LIST TYPES
// ============================================================================

/**
 * Quote table filter interface
 */
export interface QuoteTableFilters {
  search: string
  status: QuoteStatus | 'all'
  dateFrom: string | null
  dateTo: string | null
  expiresFrom: string | null
  expiresTo: string | null
  minTotal: number | null
  maxTotal: number | null
  customerId: string | null
  hasExpired: boolean | null
}

/**
 * Quote with extended data (for detail view)
 */
export interface QuoteDetailData extends Quote {
  items: QuoteItem[]
  activities: QuoteActivity[]
  customer: Customer | null
}

/**
 * Quote summary for list view
 */
export interface QuoteSummary {
  id: string
  quote_number: string
  customer_name: string
  customer_company?: string | null
  customer_email: string
  status: QuoteStatus
  total: number
  currency: string
  valid_until?: string | null
  items_count: number
  created_at: string
  updated_at: string
}

/**
 * Quote stats for dashboard
 */
export interface QuoteStats {
  total: number
  draft: number
  pending: number
  sent: number
  viewed: number
  accepted: number
  rejected: number
  expired: number
  converted: number
  totalValue: number
  acceptedValue: number
  conversionRate: number
}

// ============================================================================
// QUOTE BULK ACTION TYPES
// ============================================================================

/**
 * Available bulk actions for quotes
 */
export type QuoteBulkActionType = 
  | 'send'
  | 'mark_expired'
  | 'delete'
  | 'export'
  | 'duplicate'

/**
 * Bulk action input
 */
export interface QuoteBulkAction {
  action: QuoteBulkActionType
  quoteIds: string[]
  params?: Record<string, unknown>
}

// ============================================================================
// QUOTE WORKFLOW TYPES
// ============================================================================

/**
 * Valid status transitions
 */
export const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['pending_approval', 'sent', 'cancelled'],
  pending_approval: ['sent', 'draft', 'cancelled'],
  sent: ['viewed', 'accepted', 'rejected', 'expired', 'cancelled'],
  viewed: ['accepted', 'rejected', 'expired'],
  accepted: ['converted', 'cancelled'],
  rejected: [], // Final state (can duplicate)
  expired: [], // Final state (can duplicate)
  converted: [], // Final state
  cancelled: ['draft'] // Can reopen as draft
}

/**
 * Quote status config for UI display
 */
export interface QuoteStatusConfig {
  label: string
  color: string
  bgColor: string
  description: string
  allowedTransitions: QuoteStatus[]
}

/**
 * Send quote input
 */
export interface SendQuoteInput {
  quoteId: string
  recipientEmail: string
  subject: string
  message: string
  includePdf: boolean
  ccEmails?: string[]
}

/**
 * Quote response from customer
 */
export interface QuoteResponse {
  quoteId: string
  action: 'accept' | 'reject'
  notes?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Quote to order conversion input
 */
export interface QuoteToOrderInput {
  quoteId: string
  paymentStatus?: PaymentStatus
  additionalNotes?: string
  sendOrderConfirmation?: boolean
}

/**
 * Quote email template variables
 */
export interface QuoteEmailVariables {
  quote_number: string
  customer_name: string
  customer_email: string
  company_name?: string
  quote_total: string
  currency: string
  valid_until: string
  items_count: number
  quote_url: string
  store_name: string
  store_email: string
  store_phone?: string
}

// ============================================================================
// QUOTE PDF TYPES
// ============================================================================

/**
 * PDF generation options
 */
export interface QuotePdfOptions {
  includeImages: boolean
  includeTerms: boolean
  showDiscounts: boolean
  showTaxBreakdown: boolean
  paperSize: 'a4' | 'letter'
  orientation: 'portrait' | 'landscape'
}

/**
 * PDF data structure
 */
export interface QuotePdfData {
  quote: Quote
  items: QuoteItem[]
  store: {
    name: string
    email: string
    phone?: string
    address?: string
    logo?: string
    website?: string
  }
  settings: QuoteSettings
}

// ============================================================================
// QUOTE ANALYTICS TYPES
// Phase ECOM-13: Quote Templates & Automation
// ============================================================================

/**
 * Quote Site Settings - Extended settings for automation
 */
export interface QuoteSiteSettings {
  id: string
  site_id: string
  
  // Numbering
  quote_number_prefix: string
  quote_number_padding: number
  next_quote_number: number
  
  // Defaults
  default_validity_days: number
  default_tax_rate: number
  default_currency: string
  
  // Auto-actions
  auto_expire_enabled: boolean
  auto_reminder_enabled: boolean
  reminder_days_before: number
  max_reminders: number
  
  // Email settings
  send_acceptance_notification: boolean
  send_rejection_notification: boolean
  cc_email_on_send: string | null
  
  // Branding
  company_name: string | null
  company_address: string | null
  company_phone: string | null
  company_email: string | null
  logo_url: string | null
  primary_color: string
  
  // Default content
  default_introduction: string | null
  default_terms: string | null
  default_footer: string | null
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Quote Settings Update - For updating settings
 */
export interface QuoteSiteSettingsUpdate {
  quote_number_prefix?: string
  quote_number_padding?: number
  default_validity_days?: number
  default_tax_rate?: number
  default_currency?: string
  auto_expire_enabled?: boolean
  auto_reminder_enabled?: boolean
  reminder_days_before?: number
  max_reminders?: number
  send_acceptance_notification?: boolean
  send_rejection_notification?: boolean
  cc_email_on_send?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  logo_url?: string
  primary_color?: string
  default_introduction?: string
  default_terms?: string
  default_footer?: string
}

/**
 * Quote Analytics Data
 */
export interface QuoteAnalytics {
  // Overview
  total_quotes: number
  total_value: number
  average_value: number
  
  // Status breakdown
  by_status: Record<QuoteStatus, number>
  
  // Conversion metrics
  conversion_rate: number
  rejection_rate: number
  expiry_rate: number
  average_time_to_accept: number
  
  // Value metrics
  total_accepted_value: number
  total_pending_value: number
  total_lost_value: number
  
  // Time-based
  quotes_this_month: number
  quotes_last_month: number
  growth_rate: number
}

/**
 * Quote Performance Summary (for dashboard)
 */
export interface QuotePerformance {
  period: string
  quotes_created: number
  quotes_sent: number
  quotes_accepted: number
  quotes_rejected: number
  quotes_expired: number
  total_value: number
  accepted_value: number
}

// ============================================================================
// HOOK RETURN TYPES (ECOM-20)
// ============================================================================

/**
 * Result type for useStorefrontContext
 */
export interface StorefrontContextValue {
  siteId: string
  settings: EcommerceSettings | null
  currency: string
  currencySymbol: string
  taxRate: number
  formatPrice: (amount: number) => string
  isInitialized: boolean
}

/**
 * Tree node for category hierarchy
 */
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
  level: number
}

/**
 * Result type for useStorefrontCategories
 */
export interface StorefrontCategoriesResult {
  categories: Category[]
  categoryTree: CategoryTreeNode[]
  isLoading: boolean
  error: string | null
  getCategoryById: (id: string) => Category | undefined
  getCategoryBySlug: (slug: string) => Category | undefined
  getCategoryPath: (categoryId: string) => Category[]
}

/**
 * Result type for useStorefrontProducts
 */
export interface StorefrontProductsOptions {
  categoryId?: string
  categorySlug?: string
  brand?: string
  searchQuery?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  onSale?: boolean
  featured?: boolean
  tags?: string[]
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'price-asc' | 'price-desc' | 'name' | 'popularity'
  limit?: number
  offset?: number
  page?: number
}

export interface StorefrontProductsPagination {
  total: number
  page: number
  totalPages: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

export interface StorefrontProductsResult {
  products: Product[]
  pagination: StorefrontProductsPagination
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Result type for useStorefrontProduct
 */
export interface StorefrontProductResult {
  product: Product | null
  variants: ProductVariant[]
  options: ProductOption[]
  relatedProducts: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Result type for useStorefrontSearch
 */
export interface StorefrontSearchResult {
  query: string
  setQuery: (query: string) => void
  results: Product[]
  isSearching: boolean
  error: string | null
  recentSearches: string[]
  clearRecentSearches: () => void
}

/**
 * Result type for useRecentlyViewed
 */
export interface RecentlyViewedResult {
  products: Product[]
  isLoading: boolean
  addProduct: (productId: string) => void
  removeProduct: (productId: string) => void
  clear: () => void
}

/**
 * Cart totals
 */
export interface CartTotals {
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  itemCount: number
}

/**
 * Result type for useStorefrontCart
 */
export interface StorefrontCartResult {
  cart: Cart | null
  items: CartItem[]
  totals: CartTotals | null
  itemCount: number
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  addItem: (productId: string, variantId: string | null, quantity: number) => Promise<boolean>
  updateItemQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  clearCart: () => Promise<boolean>
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>
  removeDiscount: () => Promise<boolean>
  refresh: () => Promise<void>
}

/**
 * Wishlist item type (internal)
 */
export interface WishlistItem {
  productId: string
  variantId?: string
  addedAt: string
}

/**
 * Result type for useStorefrontWishlist
 */
export interface StorefrontWishlistResult {
  items: WishlistItem[]
  products: Product[]
  isLoading: boolean
  addItem: (productId: string, variantId?: string) => void
  removeItem: (productId: string, variantId?: string) => void
  toggleItem: (productId: string, variantId?: string) => void
  isInWishlist: (productId: string, variantId?: string) => boolean
  clear: () => void
  itemCount: number
}

// ============================================================================
// INVENTORY TYPES EXPORT
// ============================================================================

export * from './inventory-types'