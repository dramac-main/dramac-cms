# PHASE-ECOM-32: Mobile Product Experience Testing Guide

## Overview
This guide covers testing the 7 mobile product components implemented in ECOM-32.

---

## Quick Start

### 1. Start the Development Server
```bash
cd next-platform-dashboard
pnpm dev
```

### 2. Open in Mobile View
- Open browser DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Select a mobile device (iPhone 14 Pro recommended)

### 3. Create a Test Page
Create a new file at `src/app/(testing)/mobile-product-test/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { 
  MobileProductGallery,
  MobileVariantSelector,
  StickyAddToCartBar,
  CollapsibleProductDetails,
  MobileProductCard,
  MobileProductGrid,
  MobileQuickView,
  ProductSwipeView
} from '@/modules/ecommerce/studio/components/mobile'

// Mock product data
const mockProduct = {
  id: 'prod-001',
  site_id: 'site-001',
  name: 'Premium Wireless Headphones',
  slug: 'premium-wireless-headphones',
  description: 'High-quality wireless headphones with active noise cancellation.',
  base_price: 199.99,
  compare_at_price: 249.99,
  images: [
    'https://picsum.photos/800/800?random=1',
    'https://picsum.photos/800/800?random=2',
    'https://picsum.photos/800/800?random=3',
  ],
  quantity: 50,
  status: 'active' as const,
  is_featured: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  categories: null,
  tags: null,
  seo_title: null,
  seo_description: null,
  metadata: null,
}

const mockVariants = [
  { id: 'v1', product_id: 'prod-001', options: { Color: 'Black', Size: 'Standard' }, price: 199.99, sku: 'HP-BK-STD', quantity: 20, is_active: true, image_url: null, created_at: '', updated_at: '' },
  { id: 'v2', product_id: 'prod-001', options: { Color: 'White', Size: 'Standard' }, price: 199.99, sku: 'HP-WH-STD', quantity: 15, is_active: true, image_url: null, created_at: '', updated_at: '' },
  { id: 'v3', product_id: 'prod-001', options: { Color: 'Blue', Size: 'Standard' }, price: 209.99, sku: 'HP-BL-STD', quantity: 5, is_active: true, image_url: null, created_at: '', updated_at: '' },
  { id: 'v4', product_id: 'prod-001', options: { Color: 'Black', Size: 'Large' }, price: 219.99, sku: 'HP-BK-LG', quantity: 0, is_active: true, image_url: null, created_at: '', updated_at: '' },
]

const variantOptions = [
  { name: 'Color', values: ['Black', 'White', 'Blue'], type: 'color' as const },
  { name: 'Size', values: ['Standard', 'Large'], type: 'size' as const },
]

const mockProducts = [
  mockProduct,
  { ...mockProduct, id: 'prod-002', name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', base_price: 79.99 },
  { ...mockProduct, id: 'prod-003', name: 'Smart Watch', slug: 'smart-watch', base_price: 299.99 },
  { ...mockProduct, id: 'prod-004', name: 'Laptop Stand', slug: 'laptop-stand', base_price: 49.99 },
]

export default function MobileProductTestPage() {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'gallery' | 'variant' | 'sticky' | 'details' | 'cards' | 'quickview' | 'swipe'>('gallery')

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 bg-background border-b overflow-x-auto">
        <div className="flex gap-1 p-2">
          {(['gallery', 'variant', 'sticky', 'details', 'cards', 'quickview', 'swipe'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* 1. Gallery Test */}
        {activeTab === 'gallery' && (
          <section>
            <h2 className="text-xl font-bold mb-4">MobileProductGallery</h2>
            <MobileProductGallery
              images={mockProduct.images}
              productName={mockProduct.name}
              aspectRatio="square"
            />
            <p className="text-sm text-muted-foreground mt-4">
              ✅ Swipe left/right to navigate<br/>
              ✅ Double-tap to zoom<br/>
              ✅ Tap expand button for fullscreen<br/>
              ✅ Dot indicators show current image
            </p>
          </section>
        )}

        {/* 2. Variant Selector Test */}
        {activeTab === 'variant' && (
          <section>
            <h2 className="text-xl font-bold mb-4">MobileVariantSelector</h2>
            <MobileVariantSelector
              options={variantOptions}
              variants={mockVariants}
              selectedOptions={selectedOptions}
              onOptionChange={(name, value) => {
                setSelectedOptions(prev => ({ ...prev, [name]: value }))
              }}
              showStock
              showPrice
            />
            <p className="text-sm text-muted-foreground mt-4">
              ✅ Tap to open color/size sheet<br/>
              ✅ Color swatches show preview<br/>
              ✅ Out of stock items are disabled<br/>
              ✅ Low stock warnings display
            </p>
          </section>
        )}

        {/* 3. Sticky Add to Cart Test */}
        {activeTab === 'sticky' && (
          <section>
            <h2 className="text-xl font-bold mb-4">StickyAddToCartBar</h2>
            <div className="h-[200vh]">
              <p className="mb-4">Scroll down to see the sticky bar appear!</p>
              <div id="main-cta" className="p-4 bg-primary text-primary-foreground rounded-lg">
                This is the main Add to Cart button area
              </div>
            </div>
            <StickyAddToCartBar
              product={mockProduct}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={() => alert('Added to cart!')}
              onWishlistToggle={() => alert('Wishlist toggled!')}
            />
            <p className="text-sm text-muted-foreground mt-4">
              ✅ Appears when main CTA scrolls out<br/>
              ✅ Quantity controls work<br/>
              ✅ Shows total price<br/>
              ✅ Wishlist toggle works
            </p>
          </section>
        )}

        {/* 4. Collapsible Details Test */}
        {activeTab === 'details' && (
          <section>
            <h2 className="text-xl font-bold mb-4">CollapsibleProductDetails</h2>
            <CollapsibleProductDetails
              description="<p>Premium wireless headphones featuring <strong>active noise cancellation</strong>, 30-hour battery life, and crystal-clear audio. Perfect for music lovers and professionals alike.</p>"
              specifications={{
                'Driver Size': '40mm',
                'Frequency Response': '20Hz - 20kHz',
                'Battery Life': '30 hours',
                'Bluetooth Version': '5.2',
                'Weight': '250g',
                'Noise Cancellation': true,
              }}
              shippingInfo="<p>Free standard shipping on orders over $50. Express delivery available for $9.99.</p>"
              returnPolicy="<p>30-day hassle-free returns. Items must be in original packaging.</p>"
              warranty="<p>2-year manufacturer warranty included.</p>"
            />
            <p className="text-sm text-muted-foreground mt-4">
              ✅ Tap headers to expand/collapse<br/>
              ✅ Smooth animation<br/>
              ✅ Icons display correctly<br/>
              ✅ Content renders HTML
            </p>
          </section>
        )}

        {/* 5. Product Cards Test */}
        {activeTab === 'cards' && (
          <section>
            <h2 className="text-xl font-bold mb-4">MobileProductCard & Grid</h2>
            <MobileProductGrid
              products={mockProducts}
              columns={2}
              onQuickAdd={(p) => alert(`Quick add: ${p.name}`)}
              onWishlistToggle={(p) => alert(`Wishlist: ${p.name}`)}
              onQuickView={(p) => {
                alert(`Quick view: ${p.name}`)
                setQuickViewOpen(true)
              }}
            />
            <p className="text-sm text-muted-foreground mt-4">
              ✅ 2-column grid layout<br/>
              ✅ Quick add button appears on hover/touch<br/>
              ✅ Wishlist heart in corner<br/>
              ✅ Discount badge shows percentage
            </p>
          </section>
        )}

        {/* 6. Quick View Test */}
        {activeTab === 'quickview' && (
          <section>
            <h2 className="text-xl font-bold mb-4">MobileQuickView</h2>
            <button
              onClick={() => setQuickViewOpen(true)}
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              Open Quick View
            </button>
            <MobileQuickView
              product={mockProduct}
              variants={mockVariants}
              options={variantOptions}
              isOpen={quickViewOpen}
              onClose={() => setQuickViewOpen(false)}
              onAddToCart={(p, v, q) => {
                alert(`Added ${q}x ${p.name} to cart`)
                setQuickViewOpen(false)
              }}
              onWishlistToggle={() => alert('Wishlist toggled')}
            />
            <p className="text-sm text-muted-foreground mt-4">
              ✅ Bottom sheet opens smoothly<br/>
              ✅ Swipe down to close<br/>
              ✅ Image gallery navigation<br/>
              ✅ Variant selection works<br/>
              ✅ Quantity controls work
            </p>
          </section>
        )}

        {/* 7. Swipe View Test */}
        {activeTab === 'swipe' && (
          <section className="h-[80vh]">
            <h2 className="text-xl font-bold mb-4">ProductSwipeView</h2>
            <ProductSwipeView
              products={mockProducts}
              onSwipe={(product, action) => {
                console.log(`Swiped ${action}: ${product.name}`)
              }}
              canUndo
              onUndo={() => console.log('Undo!')}
            />
            <p className="text-sm text-muted-foreground mt-4">
              ✅ Swipe right = wishlist (heart)<br/>
              ✅ Swipe left = skip (X)<br/>
              ✅ Swipe up = add to cart<br/>
              ✅ Cards stack behind<br/>
              ✅ Undo button works
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
```

---

## Component-by-Component Testing

### 1. MobileProductGallery
| Feature | How to Test | Expected |
|---------|-------------|----------|
| Swipe navigation | Swipe left/right on image | Image changes |
| Double-tap zoom | Double tap on image | Zooms in/out |
| Fullscreen | Tap expand button | Opens fullscreen overlay |
| Dot indicators | Look at bottom dots | Shows current position |
| Image counter | Look at top-left | Shows "1 / 3" etc |

### 2. MobileVariantSelector
| Feature | How to Test | Expected |
|---------|-------------|----------|
| Open sheet | Tap any option row | Bottom sheet opens |
| Color swatches | Look at color options | Shows color circles |
| Size grid | Look at size options | Shows size buttons |
| Out of stock | Try selecting unavailable | Button is disabled |
| Low stock | Select item with qty ≤5 | Shows warning badge |

### 3. StickyAddToCartBar
| Feature | How to Test | Expected |
|---------|-------------|----------|
| Appear on scroll | Scroll main CTA out of view | Bar slides up |
| Quantity +/- | Tap +/- buttons | Quantity changes |
| Price update | Change quantity | Total updates |
| Wishlist | Tap heart button | Heart fills red |
| Add to cart | Tap main button | Shows loading, then success |

### 4. CollapsibleProductDetails
| Feature | How to Test | Expected |
|---------|-------------|----------|
| Expand section | Tap section header | Content reveals |
| Collapse section | Tap open header | Content hides |
| Multiple open | Enable allowMultipleOpen | Multiple can be open |
| Icons | Look at section headers | Icons display |
| Specs table | Open specifications | Key-value pairs shown |

### 5. MobileProductCard
| Feature | How to Test | Expected |
|---------|-------------|----------|
| Image loading | View card | Image loads |
| Quick add | Hover/tap card | Quick add button appears |
| Wishlist | Tap heart icon | Heart toggles |
| Discount badge | View discounted item | Shows "-XX%" |
| Price display | View pricing | Current and compare prices |

### 6. MobileQuickView
| Feature | How to Test | Expected |
|---------|-------------|----------|
| Open | Tap trigger button | Sheet slides up |
| Close swipe | Swipe down on sheet | Sheet closes |
| Close button | Tap X | Sheet closes |
| Image swipe | Swipe images | Image changes |
| Variant select | Tap options | Selection updates |
| Quantity | Tap +/- | Quantity changes |
| Add to cart | Tap button | Success feedback |

### 7. ProductSwipeView
| Feature | How to Test | Expected |
|---------|-------------|----------|
| Swipe right | Drag card right | Heart overlay, goes to wishlist |
| Swipe left | Drag card left | X overlay, skips |
| Swipe up | Drag card up | Cart overlay, adds to cart |
| Card stack | Look behind top card | 2-3 cards stacked |
| Buttons | Tap action buttons | Same as swiping |
| Undo | Tap undo button | Previous card returns |
| Counter | Look at bottom | Shows "X / Y" |

---

## Accessibility Checklist
- [ ] All touch targets are at least 44x44px
- [ ] Focus indicators visible on keyboard navigation
- [ ] Screen reader announces button purposes
- [ ] Animations respect prefers-reduced-motion
- [ ] Color contrast meets WCAG AA

## Mobile-Specific Checklist
- [ ] Safe area insets respected (notch, home bar)
- [ ] Haptic feedback triggers on actions
- [ ] Swipe gestures feel natural
- [ ] Bottom sheets don't cover entire screen
- [ ] No horizontal scroll on any component

---

## Visit Test Page
Navigate to: `http://localhost:3000/mobile-product-test`

(Make sure to view in mobile device simulation mode!)
