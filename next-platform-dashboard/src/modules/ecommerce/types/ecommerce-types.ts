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
// NAVIGATION & DASHBOARD TYPES (PHASE ECOM-01)
// ============================================================================

export type EcommerceView = 
  | 'home'
  | 'products' 
  | 'orders' 
  | 'customers'
  | 'categories' 
  | 'discounts' 
  | 'quotes'
  | 'analytics'
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