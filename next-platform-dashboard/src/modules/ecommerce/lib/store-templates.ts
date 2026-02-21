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
// IMAGE CONSTANTS — Unsplash permanent URLs (free commercial use)
// Using fixed photo IDs for reliability. ?w=800&q=80 for optimized size.
// ============================================================================

const IMG = {
  // Fashion categories
  fashion_men: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80&fit=crop',
  fashion_women: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80&fit=crop',
  fashion_accessories: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&q=80&fit=crop',
  fashion_footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&fit=crop',
  fashion_new_arrivals: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80&fit=crop',
  fashion_sale: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80&fit=crop',
  // Fashion products
  fashion_tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&fit=crop',
  fashion_dress: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80&fit=crop',
  fashion_bag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&fit=crop',
  fashion_sneakers: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80&fit=crop',

  // Electronics categories
  elec_phones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&fit=crop',
  elec_laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80&fit=crop',
  elec_audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop',
  elec_accessories: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=800&q=80&fit=crop',
  elec_gaming: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80&fit=crop',
  elec_deals: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800&q=80&fit=crop',
  // Electronics products
  elec_earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&q=80&fit=crop',
  elec_cable: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80&fit=crop',
  elec_speaker: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80&fit=crop',
  elec_case: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80&fit=crop',

  // Food & Grocery categories
  food_produce: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&fit=crop',
  food_dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80&fit=crop',
  food_bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80&fit=crop',
  food_pantry: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80&fit=crop',
  food_beverages: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80&fit=crop',
  food_snacks: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80&fit=crop',
  // Food products
  food_vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80&fit=crop',
  food_bread: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=800&q=80&fit=crop',
  food_eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80&fit=crop',
  food_juice: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&q=80&fit=crop',

  // Digital Products categories
  digital_ebooks: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80&fit=crop',
  digital_courses: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80&fit=crop',
  digital_templates: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80&fit=crop',
  digital_software: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80&fit=crop',
  digital_music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80&fit=crop',
  digital_graphics: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80&fit=crop',
  // Digital products
  digital_bizplan: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&fit=crop',
  digital_webdev: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&fit=crop',
  digital_ebook_zambia: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80&fit=crop',
  digital_social: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80&fit=crop',
} as const

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
    { name: 'Men', slug: 'men', description: 'Men\'s clothing and accessories', image_url: IMG.fashion_men, sort_order: 1 },
    { name: 'Women', slug: 'women', description: 'Women\'s clothing and accessories', image_url: IMG.fashion_women, sort_order: 2 },
    { name: 'Accessories', slug: 'accessories', description: 'Bags, jewelry, and accessories', image_url: IMG.fashion_accessories, sort_order: 3 },
    { name: 'Footwear', slug: 'footwear', description: 'Shoes, boots, and sandals', image_url: IMG.fashion_footwear, sort_order: 4 },
    { name: 'New Arrivals', slug: 'new-arrivals', description: 'Latest additions to our collection', image_url: IMG.fashion_new_arrivals, sort_order: 5 },
    { name: 'Sale', slug: 'sale', description: 'Discounted items', image_url: IMG.fashion_sale, sort_order: 6 },
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
      images: [IMG.fashion_tshirt],
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
      images: [IMG.fashion_dress],
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
      images: [IMG.fashion_bag],
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
      images: [IMG.fashion_sneakers],
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
    { name: 'Phones & Tablets', slug: 'phones-tablets', description: 'Smartphones and tablets', image_url: IMG.elec_phones, sort_order: 1 },
    { name: 'Laptops & Computers', slug: 'laptops-computers', description: 'Laptops, desktops, and monitors', image_url: IMG.elec_laptops, sort_order: 2 },
    { name: 'Audio', slug: 'audio', description: 'Headphones, speakers, and earbuds', image_url: IMG.elec_audio, sort_order: 3 },
    { name: 'Accessories', slug: 'accessories', description: 'Cases, chargers, and cables', image_url: IMG.elec_accessories, sort_order: 4 },
    { name: 'Gaming', slug: 'gaming', description: 'Gaming consoles and accessories', image_url: IMG.elec_gaming, sort_order: 5 },
    { name: 'Deals', slug: 'deals', description: 'Special offers and discounts', image_url: IMG.elec_deals, sort_order: 6 },
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
      images: [IMG.elec_earbuds],
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
      images: [IMG.elec_cable],
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
      images: [IMG.elec_speaker],
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
      images: [IMG.elec_case],
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
    { name: 'Fresh Produce', slug: 'fresh-produce', description: 'Fresh fruits and vegetables', image_url: IMG.food_produce, sort_order: 1 },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs', description: 'Milk, cheese, yogurt, and eggs', image_url: IMG.food_dairy, sort_order: 2 },
    { name: 'Bakery', slug: 'bakery', description: 'Bread, pastries, and baked goods', image_url: IMG.food_bakery, sort_order: 3 },
    { name: 'Pantry', slug: 'pantry', description: 'Canned goods, grains, and staples', image_url: IMG.food_pantry, sort_order: 4 },
    { name: 'Beverages', slug: 'beverages', description: 'Drinks, juices, and water', image_url: IMG.food_beverages, sort_order: 5 },
    { name: 'Snacks', slug: 'snacks', description: 'Chips, nuts, and treats', image_url: IMG.food_snacks, sort_order: 6 },
  ],
  sampleProducts: [
    {
      name: 'Organic Mixed Vegetables Box',
      slug: 'organic-mixed-vegetables-box',
      description: 'A curated box of fresh, locally-sourced organic vegetables. Includes seasonal selections of leafy greens, root vegetables, and herbs.',
      short_description: 'Fresh organic vegetable mix',
      base_price: 7500,
      category_slug: 'fresh-produce',
      images: [IMG.food_vegetables],
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
      images: [IMG.food_bread],
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
      images: [IMG.food_eggs],
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
      images: [IMG.food_juice],
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
    { name: 'E-Books', slug: 'ebooks', description: 'Digital books and guides', image_url: IMG.digital_ebooks, sort_order: 1 },
    { name: 'Online Courses', slug: 'courses', description: 'Video courses and tutorials', image_url: IMG.digital_courses, sort_order: 2 },
    { name: 'Templates', slug: 'templates', description: 'Design and document templates', image_url: IMG.digital_templates, sort_order: 3 },
    { name: 'Software', slug: 'software', description: 'Applications and tools', image_url: IMG.digital_software, sort_order: 4 },
    { name: 'Music & Audio', slug: 'music-audio', description: 'Music, sound effects, and audio files', image_url: IMG.digital_music, sort_order: 5 },
    { name: 'Graphics', slug: 'graphics', description: 'Photos, illustrations, and graphics', image_url: IMG.digital_graphics, sort_order: 6 },
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
      images: [IMG.digital_bizplan],
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
      images: [IMG.digital_webdev],
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
      images: [IMG.digital_ebook_zambia],
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
      images: [IMG.digital_social],
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
