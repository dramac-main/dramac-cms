/**
 * E-Commerce Module - Main Index
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Full-featured e-commerce module with product catalog,
 * shopping cart, checkout, and order management.
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types/ecommerce-types'

// ============================================================================
// SERVER ACTIONS
// ============================================================================

export {
  // Categories
  getCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Products
  getProducts,
  getProductsByCategory,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  
  // Product Variants
  getProductVariants,
  getProductVariant,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  
  // Product Options
  getProductOptions,
  createProductOption,
  updateProductOption,
  deleteProductOption,
  
  // Product Categories (assignment)
  getProductCategories,
  setProductCategories,
  addProductToCategory,
  removeProductFromCategory,
  
  // Cart
  getOrCreateCart,
  findCart,
  getCart,
  createCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  applyDiscountToCart,
  removeDiscountFromCart,
  mergeGuestCartToUser,
  
  // Orders
  getOrders,
  getOrder,
  getOrderByNumber,
  getCustomerOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  updateOrderFulfillment,
  markOrderDelivered,
  addOrderNote,
  
  // Discounts
  getDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscountCode,
  incrementDiscountUsage,
  
  // Settings
  getEcommerceSettings,
  updateEcommerceSettings,
  
  // Inventory
  adjustInventory,
  setInventory,
  getLowStockProducts,
  getOutOfStockProducts,
  
  // Analytics
  getSalesAnalytics,
  getTopProducts,
  
  // Checkout helpers
  generateOrderNumber,
  calculateCartTotals,
  
  // Initialization
  initializeEcommerceForSite
} from './actions/ecommerce-actions'

// Order Actions (Phase ECOM-04)
export {
  getOrderDetail,
  getOrders as getOrdersWithFilters,
  updateOrderStatus as updateOrderStatusDetailed,
  addOrderNote as addOrderNoteWithTimestamp,
  deleteOrderNote,
  addOrderShipment,
  updateShipmentStatus,
  createRefund,
  processRefund,
  executeOrderBulkAction,
  generateInvoiceNumber,
  sendOrderEmail
} from './actions/order-actions'

// Customer Actions (Phase ECOM-05)
export {
  getCustomers,
  getCustomerDetail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
  addCustomerToGroup,
  removeCustomerFromGroup,
  addCustomerNote,
  deleteCustomerNote,
  executeCustomerBulkAction,
  importCustomers,
  exportCustomers,
  getCustomerStats
} from './actions/customer-actions'

// ============================================================================
// CONTEXT & HOOKS
// ============================================================================

export { 
  EcommerceProvider, 
  useEcommerce, 
  useProducts, 
  useOrders, 
  useCategories,
  useDiscounts,
  useEcommerceSettings,
  useInventory,
  useEcommerceAnalytics
} from './context/ecommerce-context'

// ============================================================================
// MODULE MANIFEST
// ============================================================================

export { EcommerceModuleManifest } from './manifest'

// ============================================================================
// COMPONENTS (exported separately when implemented)
// ============================================================================

// These will be exported as they are implemented:
// export * from './components'

// ============================================================================
// WIDGETS
// ============================================================================

export { 
  StorefrontWidget, 
  CartProvider, 
  useCart 
} from './widgets/StorefrontWidget'
