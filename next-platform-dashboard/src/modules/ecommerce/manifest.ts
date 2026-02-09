/**
 * E-Commerce Module Manifest
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * This manifest defines the module's metadata, capabilities,
 * database schema, and configuration.
 * 
 * Following CRM/Booking module pattern exactly
 */

import type { ModuleManifest } from '../_types'

export const EcommerceModuleManifest: ModuleManifest = {
  // ==========================================================================
  // IDENTIFICATION
  // ==========================================================================
  
  id: 'ecommerce',
  shortId: 'ecommod01',  // CRITICAL: Used for table prefix (mod_ecommod01_)
  name: 'E-Commerce',
  displayName: 'E-Commerce Store',
  description: 'Complete e-commerce solution with product catalog, shopping cart, checkout, order management, and embeddable storefront widget',
  version: '1.0.0',
  
  // ==========================================================================
  // CLASSIFICATION
  // ==========================================================================
  
  type: 'enterprise',
  category: 'commerce',
  
  // ==========================================================================
  // AUTHOR & LICENSE
  // ==========================================================================
  
  author: {
    name: 'DRAMAC CMS', // Internal module author — not shown to end users
    email: 'support@dramac.dev',
    url: 'https://dramac.dev'
  },
  license: 'proprietary',
  
  // ==========================================================================
  // COMPATIBILITY
  // ==========================================================================
  
  minPlatformVersion: '1.0.0',
  dependencies: [],
  peerDependencies: [
    'crm'  // Optional: For customer linking
  ],
  
  // ==========================================================================
  // DATABASE SCHEMA
  // ==========================================================================
  
  schema: {
    prefix: 'mod_ecommod01',  // CRITICAL: All tables use mod_ecommod01_tablename
    
    tables: [
      'categories',
      'products',
      'product_categories',
      'product_options',
      'product_variants',
      'discounts',
      'carts',
      'cart_items',
      'orders',
      'order_items',
      'settings'
    ],
    
    migrations: [
      'em-52-ecommerce-module-schema.sql'
    ]
  },
  
  // ==========================================================================
  // FEATURES
  // ==========================================================================
  
  features: [
    {
      id: 'product-catalog',
      name: 'Product Catalog',
      description: 'Create and manage products with images, variants, and pricing',
      enabled: true
    },
    {
      id: 'categories',
      name: 'Categories',
      description: 'Organize products with nested category hierarchy',
      enabled: true
    },
    {
      id: 'variants',
      name: 'Product Variants',
      description: 'Support for size, color, and other product options',
      enabled: true
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Track stock levels with low-stock alerts',
      enabled: true
    },
    {
      id: 'shopping-cart',
      name: 'Shopping Cart',
      description: 'Guest and user carts with session persistence',
      enabled: true
    },
    {
      id: 'discounts',
      name: 'Discount Codes',
      description: 'Create promotional codes with usage limits',
      enabled: true
    },
    {
      id: 'checkout',
      name: 'Checkout',
      description: 'Secure checkout with multiple payment options',
      enabled: true
    },
    {
      id: 'orders',
      name: 'Order Management',
      description: 'Track orders, fulfillment, and shipping',
      enabled: true
    },
    {
      id: 'storefront-widget',
      name: 'Storefront Widget',
      description: 'Embeddable store for external websites',
      enabled: true
    },
    {
      id: 'analytics',
      name: 'Sales Analytics',
      description: 'Revenue reports and product performance',
      enabled: true
    },
    {
      id: 'payments-paddle',
      name: 'Paddle Payments',
      description: 'Global payment processing with Paddle',
      enabled: true,
      requiresSetup: true
    },
    {
      id: 'payments-flutterwave',
      name: 'Flutterwave Payments',
      description: 'African payments including mobile money (MTN, Airtel, Zamtel)',
      enabled: true,
      requiresSetup: true
    },
    {
      id: 'payments-pesapal',
      name: 'Pesapal Payments',
      description: 'African cards and mobile money',
      enabled: true,
      requiresSetup: true
    },
    {
      id: 'payments-dpo',
      name: 'DPO Pay',
      description: 'Zambian local payment gateway',
      enabled: true,
      requiresSetup: true
    }
  ],
  
  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================
  
  permissions: [
    // Products
    {
      id: 'ecommerce.products.view',
      name: 'View Products',
      description: 'View all products'
    },
    {
      id: 'ecommerce.products.create',
      name: 'Create Products',
      description: 'Create new products'
    },
    {
      id: 'ecommerce.products.edit',
      name: 'Edit Products',
      description: 'Edit existing products'
    },
    {
      id: 'ecommerce.products.delete',
      name: 'Delete Products',
      description: 'Delete products'
    },
    // Categories
    {
      id: 'ecommerce.categories.view',
      name: 'View Categories',
      description: 'View all categories'
    },
    {
      id: 'ecommerce.categories.manage',
      name: 'Manage Categories',
      description: 'Create, edit, and delete categories'
    },
    // Orders
    {
      id: 'ecommerce.orders.view',
      name: 'View Orders',
      description: 'View all orders'
    },
    {
      id: 'ecommerce.orders.manage',
      name: 'Manage Orders',
      description: 'Update order status and fulfillment'
    },
    {
      id: 'ecommerce.orders.refund',
      name: 'Process Refunds',
      description: 'Process order refunds'
    },
    // Discounts
    {
      id: 'ecommerce.discounts.view',
      name: 'View Discounts',
      description: 'View all discount codes'
    },
    {
      id: 'ecommerce.discounts.manage',
      name: 'Manage Discounts',
      description: 'Create, edit, and delete discount codes'
    },
    // Settings
    {
      id: 'ecommerce.settings.view',
      name: 'View Settings',
      description: 'View store settings'
    },
    {
      id: 'ecommerce.settings.manage',
      name: 'Manage Settings',
      description: 'Configure store settings and payment providers'
    },
    // Analytics
    {
      id: 'ecommerce.analytics.view',
      name: 'View Analytics',
      description: 'View sales analytics and reports'
    }
  ],
  
  // ==========================================================================
  // SETTINGS SCHEMA
  // ==========================================================================
  
  settings: {
    currency: {
      type: 'string',
      default: 'ZMW',  // ZAMBIAN KWACHA DEFAULT
      description: 'Store currency code (default: Zambian Kwacha)'
    },
    taxRate: {
      type: 'number',
      default: 16,  // ZAMBIA VAT RATE
      description: 'Default tax rate percentage (Zambia VAT: 16%)'
    },
    taxIncludedInPrice: {
      type: 'boolean',
      default: true,  // ZAMBIAN STANDARD
      description: 'Whether tax is included in product prices'
    },
    enableGuestCheckout: {
      type: 'boolean',
      default: true,
      description: 'Allow checkout without account'
    },
    requirePhone: {
      type: 'boolean',
      default: true,  // Phone is important for delivery in Zambia
      description: 'Require phone number at checkout'
    },
    sendOrderConfirmation: {
      type: 'boolean',
      default: true,
      description: 'Send email confirmation on order'
    },
    continueSelling: {
      type: 'boolean',
      default: false,
      description: 'Allow orders when out of stock'
    },
    lowStockThreshold: {
      type: 'number',
      default: 5,
      description: 'Default low stock warning threshold'
    }
  },
  
  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  
  navigation: {
    mainMenu: {
      label: 'E-Commerce',
      icon: 'ShoppingBag',
      href: '/ecommerce',
      order: 40
    },
    subMenu: [
      {
        label: 'Dashboard',
        href: '/ecommerce',
        icon: 'LayoutDashboard'
      },
      {
        label: 'Products',
        href: '/ecommerce/products',
        icon: 'Package'
      },
      {
        label: 'Categories',
        href: '/ecommerce/categories',
        icon: 'FolderTree'
      },
      {
        label: 'Orders',
        href: '/ecommerce/orders',
        icon: 'ShoppingCart'
      },
      {
        label: 'Discounts',
        href: '/ecommerce/discounts',
        icon: 'Percent'
      },
      {
        label: 'Customers',
        href: '/ecommerce/customers',
        icon: 'Users'
      },
      {
        label: 'Analytics',
        href: '/ecommerce/analytics',
        icon: 'BarChart3'
      },
      {
        label: 'Settings',
        href: '/ecommerce/settings',
        icon: 'Settings'
      }
    ]
  },
  
  // ==========================================================================
  // API
  // ==========================================================================
  
  api: {
    prefix: '/api/modules/ecommerce',
    routes: [
      // Products
      { method: 'GET', path: '/products', handler: 'getProducts' },
      { method: 'GET', path: '/products/:id', handler: 'getProduct' },
      { method: 'GET', path: '/products/slug/:slug', handler: 'getProductBySlug' },
      { method: 'POST', path: '/products', handler: 'createProduct' },
      { method: 'PUT', path: '/products/:id', handler: 'updateProduct' },
      { method: 'DELETE', path: '/products/:id', handler: 'deleteProduct' },
      
      // Categories
      { method: 'GET', path: '/categories', handler: 'getCategories' },
      { method: 'GET', path: '/categories/:id', handler: 'getCategory' },
      { method: 'POST', path: '/categories', handler: 'createCategory' },
      { method: 'PUT', path: '/categories/:id', handler: 'updateCategory' },
      { method: 'DELETE', path: '/categories/:id', handler: 'deleteCategory' },
      
      // Cart
      { method: 'GET', path: '/cart', handler: 'getCart' },
      { method: 'POST', path: '/cart/items', handler: 'addCartItem' },
      { method: 'PUT', path: '/cart/items/:id', handler: 'updateCartItem' },
      { method: 'DELETE', path: '/cart/items/:id', handler: 'removeCartItem' },
      { method: 'POST', path: '/cart/discount', handler: 'applyDiscount' },
      { method: 'DELETE', path: '/cart/discount', handler: 'removeDiscount' },
      
      // Checkout
      { method: 'POST', path: '/checkout', handler: 'createOrder' },
      { method: 'POST', path: '/checkout/validate', handler: 'validateCheckout' },
      
      // Orders
      { method: 'GET', path: '/orders', handler: 'getOrders' },
      { method: 'GET', path: '/orders/:id', handler: 'getOrder' },
      { method: 'PUT', path: '/orders/:id/status', handler: 'updateOrderStatus' },
      { method: 'PUT', path: '/orders/:id/fulfillment', handler: 'updateFulfillment' },
      
      // Discounts
      { method: 'GET', path: '/discounts', handler: 'getDiscounts' },
      { method: 'POST', path: '/discounts', handler: 'createDiscount' },
      { method: 'PUT', path: '/discounts/:id', handler: 'updateDiscount' },
      { method: 'DELETE', path: '/discounts/:id', handler: 'deleteDiscount' },
      { method: 'POST', path: '/discounts/validate', handler: 'validateDiscount' },
      
      // Storefront (public)
      { method: 'GET', path: '/storefront/products', handler: 'getStorefrontProducts' },
      { method: 'GET', path: '/storefront/categories', handler: 'getStorefrontCategories' },
      { method: 'GET', path: '/storefront/config', handler: 'getStorefrontConfig' },
      
      // Webhooks
      { method: 'POST', path: '/webhooks/paddle', handler: 'handlePaddleWebhook' },
      { method: 'POST', path: '/webhooks/flutterwave', handler: 'handleFlutterwaveWebhook' },
      { method: 'POST', path: '/webhooks/pesapal', handler: 'handlePesapalWebhook' },
      { method: 'POST', path: '/webhooks/dpo', handler: 'handleDpoWebhook' }
    ]
  },
  
  // ==========================================================================
  // WEBHOOKS
  // ==========================================================================
  
  webhooks: [
    {
      event: 'order.created',
      description: 'Triggered when a new order is placed'
    },
    {
      event: 'order.paid',
      description: 'Triggered when payment is received'
    },
    {
      event: 'order.shipped',
      description: 'Triggered when order is marked as shipped'
    },
    {
      event: 'order.delivered',
      description: 'Triggered when order is delivered'
    },
    {
      event: 'order.cancelled',
      description: 'Triggered when order is cancelled'
    },
    {
      event: 'order.refunded',
      description: 'Triggered when order is refunded'
    },
    {
      event: 'product.low_stock',
      description: 'Triggered when product stock falls below threshold'
    },
    {
      event: 'product.out_of_stock',
      description: 'Triggered when product goes out of stock'
    }
  ],
  
  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================
  
  lifecycle: {
    onInstall: 'initializeEcommerceForSite',
    onUninstall: undefined,
    onUpgrade: undefined,
    onEnable: 'initializeEcommerceForSite',
    onDisable: undefined
  },
  
  // ==========================================================================
  // COMPONENTS
  // ==========================================================================
  
  components: {
    dashboard: 'EcommerceDashboard',
    settings: 'EcommerceSettings',
    products: 'ProductsView',
    categories: 'CategoriesView',
    orders: 'OrdersView',
    discounts: 'DiscountsView',
    analytics: 'AnalyticsView'
  },
  
  // ==========================================================================
  // SEARCH KEYWORDS
  // ==========================================================================
  
  keywords: [
    'ecommerce',
    'shop',
    'store',
    'products',
    'cart',
    'checkout',
    'orders',
    'payments',
    'inventory',
    'catalog',
    'shopping',
    'online store',
    'sell',
    'sales'
  ],
  
  // ==========================================================================
  // SCREENSHOTS
  // ==========================================================================
  
  screenshots: [
    {
      url: '/screenshots/ecommerce/dashboard.png',
      title: 'E-Commerce Dashboard',
      description: 'Sales overview with revenue charts and recent orders'
    },
    {
      url: '/screenshots/ecommerce/products.png',
      title: 'Product Management',
      description: 'Create and manage products with variants'
    },
    {
      url: '/screenshots/ecommerce/orders.png',
      title: 'Order Management',
      description: 'Track orders and manage fulfillment'
    },
    {
      url: '/screenshots/ecommerce/storefront.png',
      title: 'Embeddable Storefront',
      description: 'Beautiful storefront widget for any website'
    }
  ],
  
  // ==========================================================================
  // PRICING
  // ==========================================================================
  
  pricing: {
    type: 'subscription',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        price: 29,
        limits: {
          products: 100,
          orders_per_month: 500,
          variants_per_product: 10
        }
      },
      {
        id: 'pro',
        name: 'Professional',
        price: 79,
        limits: {
          products: 1000,
          orders_per_month: 5000,
          variants_per_product: 50
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        limits: {
          products: -1, // unlimited
          orders_per_month: -1,
          variants_per_product: -1
        }
      }
    ]
  }
}
