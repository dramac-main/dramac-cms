/**
 * Pre-built Store Template Definitions
 * 
 * Phase ECOM-62: Pre-built Store Templates
 * 
 * Ready-made store templates for different industries.
 * Each template includes categories, sample products, and settings
 * so users can get started immediately.
 */

import type { StoreTemplate } from '../types/store-template-types'

// ============================================================================
// FASHION & APPAREL
// ============================================================================

const fashionStore: StoreTemplate = {
  id: 'fashion-apparel',
  name: 'Fashion & Apparel',
  description: 'Clothing, shoes, and accessories store with seasonal collections',
  icon: 'Shirt',
  industry: 'Fashion',
  tags: ['clothing', 'apparel', 'fashion', 'accessories'],
  color: '#8B5CF6',
  features: [
    'Seasonal collections ready',
    'Size & color categories',
    'Sale section included',
    'Featured products showcase',
  ],
  categories: [
    { name: 'Men', slug: 'men', description: 'Men\'s clothing and accessories', sort_order: 1 },
    { name: 'Women', slug: 'women', description: 'Women\'s clothing and accessories', sort_order: 2 },
    { name: 'Accessories', slug: 'accessories', description: 'Bags, jewelry, and accessories', sort_order: 3 },
    { name: 'Footwear', slug: 'footwear', description: 'Shoes, boots, and sandals', sort_order: 4 },
    { name: 'New Arrivals', slug: 'new-arrivals', description: 'Latest additions to our collection', sort_order: 5 },
    { name: 'Sale', slug: 'sale', description: 'Discounted items', sort_order: 6 },
  ],
  sampleProducts: [
    {
      name: 'Classic Cotton T-Shirt',
      slug: 'classic-cotton-tshirt',
      description: 'A timeless cotton t-shirt made from premium organic cotton. Comfortable fit for everyday wear.',
      short_description: 'Premium organic cotton t-shirt',
      base_price: 2500,
      compare_at_price: 3500,
      category_slug: 'men',
      images: [],
      sku: 'FSH-TS-001',
      tax_class: 'standard',
      is_featured: true,
      status: 'active',
    },
    {
      name: 'Floral Summer Dress',
      slug: 'floral-summer-dress',
      description: 'Beautiful floral print summer dress. Lightweight and breathable fabric perfect for warm weather.',
      short_description: 'Light floral print dress',
      base_price: 4500,
      category_slug: 'women',
      images: [],
      sku: 'FSH-DR-001',
      tax_class: 'standard',
      is_featured: true,
      status: 'active',
    },
    {
      name: 'Leather Crossbody Bag',
      slug: 'leather-crossbody-bag',
      description: 'Handcrafted genuine leather crossbody bag with adjustable strap and multiple compartments.',
      short_description: 'Genuine leather crossbody',
      base_price: 7500,
      category_slug: 'accessories',
      images: [],
      sku: 'FSH-BG-001',
      tax_class: 'standard',
      is_featured: false,
      status: 'active',
    },
    {
      name: 'Canvas Sneakers',
      slug: 'canvas-sneakers',
      description: 'Casual canvas sneakers with rubber sole. Available in multiple colors.',
      short_description: 'Casual canvas sneakers',
      base_price: 3500,
      compare_at_price: 4500,
      category_slug: 'footwear',
      images: [],
      sku: 'FSH-SH-001',
      tax_class: 'standard',
      is_featured: false,
      status: 'active',
    },
  ],
  settings: {
    currency: 'ZMW',
    tax_rate: 16,
    tax_inclusive: true,
    weight_unit: 'kg',
    enable_guest_checkout: true,
    track_inventory: true,
    low_stock_threshold: 5,
    enable_reviews: true,
  },
}

// ============================================================================
// ELECTRONICS
// ============================================================================

const electronicsStore: StoreTemplate = {
  id: 'electronics',
  name: 'Electronics & Tech',
  description: 'Gadgets, devices, and tech accessories store',
  icon: 'Smartphone',
  industry: 'Technology',
  tags: ['electronics', 'gadgets', 'tech', 'devices'],
  color: '#3B82F6',
  features: [
    'Tech category hierarchy',
    'Spec-ready product layout',
    'Warranty tracking ready',
    'Compare products feature',
  ],
  categories: [
    { name: 'Phones & Tablets', slug: 'phones-tablets', description: 'Smartphones and tablets', sort_order: 1 },
    { name: 'Laptops & Computers', slug: 'laptops-computers', description: 'Laptops, desktops, and monitors', sort_order: 2 },
    { name: 'Audio', slug: 'audio', description: 'Headphones, speakers, and earbuds', sort_order: 3 },
    { name: 'Accessories', slug: 'accessories', description: 'Cases, chargers, and cables', sort_order: 4 },
    { name: 'Gaming', slug: 'gaming', description: 'Gaming consoles and accessories', sort_order: 5 },
    { name: 'Deals', slug: 'deals', description: 'Special offers and discounts', sort_order: 6 },
  ],
  sampleProducts: [
    {
      name: 'Wireless Bluetooth Earbuds',
      slug: 'wireless-bluetooth-earbuds',
      description: 'Premium wireless earbuds with active noise cancellation. 8-hour battery life with charging case providing 24 additional hours.',
      short_description: 'ANC wireless earbuds, 32hr battery',
      base_price: 15000,
      compare_at_price: 20000,
      category_slug: 'audio',
      images: [],
      sku: 'ELC-AUD-001',
      tax_class: 'standard',
      is_featured: true,
      status: 'active',
    },
    {
      name: 'USB-C Fast Charging Cable',
      slug: 'usb-c-fast-charging-cable',
      description: 'Braided nylon USB-C cable supporting 100W fast charging. 2-meter length, durable connectors.',
      short_description: '100W fast charge USB-C cable',
      base_price: 2500,
      category_slug: 'accessories',
      images: [],
      sku: 'ELC-ACC-001',
      tax_class: 'standard',
      is_featured: false,
      status: 'active',
    },
    {
      name: 'Portable Bluetooth Speaker',
      slug: 'portable-bluetooth-speaker',
      description: 'Waterproof portable speaker with 360° sound. Perfect for outdoor adventures with 12-hour battery.',
      short_description: 'Waterproof 360° portable speaker',
      base_price: 8500,
      category_slug: 'audio',
      images: [],
      sku: 'ELC-AUD-002',
      tax_class: 'standard',
      is_featured: true,
      status: 'active',
    },
    {
      name: 'Phone Protective Case',
      slug: 'phone-protective-case',
      description: 'Military-grade drop protection phone case. Slim profile with raised edges for screen and camera protection.',
      short_description: 'Military-grade phone protection',
      base_price: 3500,
      category_slug: 'accessories',
      images: [],
      sku: 'ELC-ACC-002',
      tax_class: 'standard',
      is_featured: false,
      status: 'active',
    },
  ],
  settings: {
    currency: 'ZMW',
    tax_rate: 16,
    tax_inclusive: true,
    weight_unit: 'kg',
    enable_guest_checkout: true,
    track_inventory: true,
    low_stock_threshold: 3,
    enable_reviews: true,
  },
}

// ============================================================================
// FOOD & GROCERY
// ============================================================================

const foodGroceryStore: StoreTemplate = {
  id: 'food-grocery',
  name: 'Food & Grocery',
  description: 'Fresh produce, packaged goods, and specialty food items',
  icon: 'Apple',
  industry: 'Food & Beverage',
  tags: ['food', 'grocery', 'organic', 'fresh'],
  color: '#22C55E',
  features: [
    'Fresh & packaged categories',
    'Organic labels ready',
    'Weight-based pricing support',
    'Low stock alerts configured',
  ],
  categories: [
    { name: 'Fresh Produce', slug: 'fresh-produce', description: 'Fresh fruits and vegetables', sort_order: 1 },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs', description: 'Milk, cheese, yogurt, and eggs', sort_order: 2 },
    { name: 'Bakery', slug: 'bakery', description: 'Bread, pastries, and baked goods', sort_order: 3 },
    { name: 'Pantry', slug: 'pantry', description: 'Canned goods, grains, and staples', sort_order: 4 },
    { name: 'Beverages', slug: 'beverages', description: 'Drinks, juices, and water', sort_order: 5 },
    { name: 'Snacks', slug: 'snacks', description: 'Chips, nuts, and treats', sort_order: 6 },
  ],
  sampleProducts: [
    {
      name: 'Organic Mixed Vegetables Box',
      slug: 'organic-mixed-vegetables-box',
      description: 'A curated box of fresh, locally-sourced organic vegetables. Includes seasonal selections of leafy greens, root vegetables, and herbs.',
      short_description: 'Fresh organic vegetable mix',
      base_price: 7500,
      category_slug: 'fresh-produce',
      images: [],
      sku: 'FG-FP-001',
      tax_class: 'food',
      is_featured: true,
      status: 'active',
    },
    {
      name: 'Artisan Sourdough Bread',
      slug: 'artisan-sourdough-bread',
      description: 'Hand-crafted sourdough bread baked fresh daily using traditional fermentation methods.',
      short_description: 'Fresh baked sourdough loaf',
      base_price: 3500,
      category_slug: 'bakery',
      images: [],
      sku: 'FG-BK-001',
      tax_class: 'food',
      is_featured: true,
      status: 'active',
    },
    {
      name: 'Farm Fresh Eggs (Dozen)',
      slug: 'farm-fresh-eggs-dozen',
      description: 'Free-range farm fresh eggs from local farms. Packed with nutrients.',
      short_description: 'Free-range eggs, dozen',
      base_price: 4500,
      category_slug: 'dairy-eggs',
      images: [],
      sku: 'FG-DE-001',
      tax_class: 'food',
      is_featured: false,
      status: 'active',
    },
    {
      name: 'Natural Fruit Juice Variety Pack',
      slug: 'natural-fruit-juice-variety',
      description: '6-pack of 100% natural fruit juices. No added sugars or preservatives. Flavors include mango, orange, and pineapple.',
      short_description: '6-pack natural fruit juices',
      base_price: 6000,
      category_slug: 'beverages',
      images: [],
      sku: 'FG-BV-001',
      tax_class: 'food',
      is_featured: false,
      status: 'active',
    },
  ],
  settings: {
    currency: 'ZMW',
    tax_rate: 0,
    tax_inclusive: true,
    weight_unit: 'kg',
    enable_guest_checkout: true,
    track_inventory: true,
    low_stock_threshold: 10,
    enable_reviews: true,
  },
}

// ============================================================================
// DIGITAL PRODUCTS
// ============================================================================

const digitalProductsStore: StoreTemplate = {
  id: 'digital-products',
  name: 'Digital Products',
  description: 'Ebooks, courses, templates, and digital downloads',
  icon: 'Download',
  industry: 'Digital',
  tags: ['digital', 'downloads', 'ebooks', 'courses', 'templates'],
  color: '#F59E0B',
  features: [
    'Digital delivery categories',
    'No shipping needed',
    'Instant delivery setup',
    'License key support',
  ],
  categories: [
    { name: 'E-Books', slug: 'ebooks', description: 'Digital books and guides', sort_order: 1 },
    { name: 'Online Courses', slug: 'courses', description: 'Video courses and tutorials', sort_order: 2 },
    { name: 'Templates', slug: 'templates', description: 'Design and document templates', sort_order: 3 },
    { name: 'Software', slug: 'software', description: 'Applications and tools', sort_order: 4 },
    { name: 'Music & Audio', slug: 'music-audio', description: 'Music, sound effects, and audio files', sort_order: 5 },
    { name: 'Graphics', slug: 'graphics', description: 'Photos, illustrations, and graphics', sort_order: 6 },
  ],
  sampleProducts: [
    {
      name: 'Business Plan Template Bundle',
      slug: 'business-plan-template-bundle',
      description: 'Professional business plan templates for startups. Includes financial projections, market analysis, and executive summary templates.',
      short_description: '10 professional business plan templates',
      base_price: 5000,
      compare_at_price: 8000,
      category_slug: 'templates',
      images: [],
      sku: 'DIG-TMP-001',
      tax_class: 'digital',
      is_featured: true,
      status: 'active',
    },
    {
      name: 'Web Development Masterclass',
      slug: 'web-development-masterclass',
      description: 'Comprehensive web development course covering HTML, CSS, JavaScript, and React. 40+ hours of video content with projects.',
      short_description: '40+ hours web dev video course',
      base_price: 25000,
      category_slug: 'courses',
      images: [],
      sku: 'DIG-CRS-001',
      tax_class: 'digital',
      is_featured: true,
      status: 'active',
    },
    {
      name: 'Entrepreneur\'s Guide to Zambia',
      slug: 'entrepreneurs-guide-zambia',
      description: 'A comprehensive ebook on starting and growing a business in Zambia. Covers regulations, financing, and market opportunities.',
      short_description: 'Starting a business in Zambia',
      base_price: 7500,
      category_slug: 'ebooks',
      images: [],
      sku: 'DIG-EB-001',
      tax_class: 'digital',
      is_featured: false,
      status: 'active',
    },
    {
      name: 'Social Media Graphics Pack',
      slug: 'social-media-graphics-pack',
      description: '200+ customizable social media post templates for Instagram, Facebook, and Twitter. Canva and Photoshop formats included.',
      short_description: '200+ social media templates',
      base_price: 3500,
      category_slug: 'graphics',
      images: [],
      sku: 'DIG-GFX-001',
      tax_class: 'digital',
      is_featured: false,
      status: 'active',
    },
  ],
  settings: {
    currency: 'ZMW',
    tax_rate: 16,
    tax_inclusive: true,
    weight_unit: 'kg',
    enable_guest_checkout: true,
    track_inventory: false,
    low_stock_threshold: 0,
    enable_reviews: true,
  },
}

// ============================================================================
// EXPORTS
// ============================================================================

export const STORE_TEMPLATES: StoreTemplate[] = [
  fashionStore,
  electronicsStore,
  foodGroceryStore,
  digitalProductsStore,
]

export function getStoreTemplate(id: string): StoreTemplate | undefined {
  return STORE_TEMPLATES.find(t => t.id === id)
}
