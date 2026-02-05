# AI AGENT PROMPT: Generate WAVE 4 E-Commerce Phase Documents

---

## YOUR TASK

You are a senior software architect creating detailed PHASE implementation documents for the DRAMAC CMS E-Commerce Module. Your job is to generate **WAVE 4: Mobile-First Optimization (HIGH Priority)** - consisting of **3 comprehensive PHASE documents** that another AI agent will use to implement the code.

**IMPORTANT**: Waves 1, 2, and 3 have been completed. The following already exists:

### Wave 1 ✅ Complete - Dashboard Foundation:
- ECOM-01 ✅ Dashboard Redesign & Navigation (sidebar, widgets, command palette)
- ECOM-02 ✅ Product Management Enhancement (TanStack Table, filters, bulk actions, import/export)
- ECOM-03 ✅ Settings & Configuration Center (9 settings tabs, server actions)
- ECOM-04 ✅ Order Management Enhancement (order detail dialog, timeline, refunds, invoices)
- ECOM-05 ✅ Customer Management (customer list, detail dialog, groups, notes)

### Wave 2 ✅ Complete - Quotation System:
- ECOM-10 ✅ Quotation Database Schema & Types
- ECOM-11A ✅ Quote Server Actions
- ECOM-11B ✅ Quote UI Components
- ECOM-12 ✅ Quote Workflow & Customer Portal
- ECOM-13 ✅ Quote Templates & Automation

### Wave 3 ✅ Complete - Studio Components (Real Data Integration):
- ECOM-20 ✅ Core Data Hooks & Context (10 hooks + StorefrontProvider)
- ECOM-21 ✅ Product Display Components (ProductCardBlock, ProductGridBlock, FeaturedProductsBlock, etc.)
- ECOM-22 ✅ Cart Components (CartDrawerBlock, CartPageBlock, MiniCartBlock, etc.)
- ECOM-23 ✅ Checkout Components (CheckoutPageBlock, AddressForm, PaymentMethodSelector, etc.)
- ECOM-24 ✅ Navigation & Discovery (CategoryNavBlock, SearchBarBlock, FilterSidebarBlock, etc.)
- ECOM-25 ✅ Quotation Frontend (QuoteRequestBlock, QuoteListBlock, QuoteDetailBlock)

---

## PHASES TO CREATE

Generate the following 3 PHASE documents:

| Phase | Title | Priority | Est. Hours |
|-------|-------|----------|------------|
| **PHASE-ECOM-30** | Mobile Cart Experience | 🟠 HIGH | 8-10 |
| **PHASE-ECOM-31** | Mobile Checkout Flow | 🟠 HIGH | 10-12 |
| **PHASE-ECOM-32** | Mobile Product Experience | 🟠 HIGH | 8-10 |

---

## EXISTING CODE CONTEXT

### Current E-Commerce Module Structure (After Waves 1-3)
```
src/modules/ecommerce/
├── actions/
│   ├── customer-actions.ts      # ✅ Customer CRUD
│   ├── dashboard-actions.ts     # ✅ Dashboard stats & search
│   ├── ecommerce-actions.ts     # ✅ Products, orders, categories, cart (1800+ lines)
│   ├── order-actions.ts         # ✅ Order management
│   ├── product-import-export.ts # ✅ Import/export/bulk ops
│   ├── quote-actions.ts         # ✅ Quote CRUD
│   ├── quote-template-actions.ts # ✅ Quote templates
│   ├── quote-workflow-actions.ts # ✅ Quote workflow
│   └── settings-actions.ts      # ✅ Settings CRUD
├── components/                  # Dashboard UI components (Wave 1)
├── context/
│   ├── ecommerce-context.tsx    # ✅ Dashboard provider
│   └── storefront-context.tsx   # ✅ Storefront provider (Wave 3)
├── hooks/                       # ✅ Wave 3 hooks
│   ├── index.ts
│   ├── useCheckout.ts
│   ├── useProductFilters.ts
│   ├── useQuotations.ts
│   ├── useRecentlyViewed.ts
│   ├── useStorefrontCart.ts
│   ├── useStorefrontCategories.ts
│   ├── useStorefrontProduct.ts
│   ├── useStorefrontProducts.ts
│   ├── useStorefrontSearch.ts
│   └── useStorefrontWishlist.ts
├── lib/
│   ├── settings-utils.ts        # ✅ Pure utility functions
│   ├── quote-automation.ts      # ✅ Quote expiration/reminders
│   └── quote-analytics.ts       # ✅ Quote performance analytics
├── studio/
│   ├── components/              # ✅ Wave 3 Studio components (38 files)
│   │   ├── ActiveFilters.tsx
│   │   ├── AddressForm.tsx
│   │   ├── BreadcrumbBlock.tsx
│   │   ├── CartDiscountInput.tsx
│   │   ├── CartDrawerBlock.tsx
│   │   ├── CartEmptyState.tsx
│   │   ├── CartItemCard.tsx
│   │   ├── CartPageBlock.tsx
│   │   ├── CartQuantitySelector.tsx
│   │   ├── CartSummaryCard.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── CategoryNavBlock.tsx
│   │   ├── CheckoutPageBlock.tsx
│   │   ├── CheckoutStepIndicator.tsx
│   │   ├── FeaturedProductsBlock.tsx
│   │   ├── FilterSidebarBlock.tsx
│   │   ├── MiniCartBlock.tsx
│   │   ├── OrderConfirmationBlock.tsx
│   │   ├── OrderSummaryCard.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── product-card-block.tsx
│   │   ├── product-grid-block.tsx
│   │   ├── ProductGridBlock.tsx
│   │   ├── ProductImageGallery.tsx
│   │   ├── ProductPriceDisplay.tsx
│   │   ├── ProductQuickView.tsx
│   │   ├── ProductRatingDisplay.tsx
│   │   ├── ProductSortBlock.tsx
│   │   ├── ProductStockBadge.tsx
│   │   ├── QuoteActionButtons.tsx
│   │   ├── QuoteDetailBlock.tsx
│   │   ├── QuoteItemCard.tsx
│   │   ├── QuoteListBlock.tsx
│   │   ├── QuotePriceBreakdown.tsx
│   │   ├── QuoteRequestBlock.tsx
│   │   ├── QuoteStatusBadge.tsx
│   │   ├── SearchBarBlock.tsx
│   │   └── ShippingMethodSelector.tsx
│   ├── fields/
│   │   ├── product-selector-field.tsx
│   │   └── category-selector-field.tsx
│   └── index.ts
├── widgets/
│   └── StorefrontWidget.tsx     # ✅ Legacy cart widget
├── types/
│   └── ecommerce-types.ts       # ✅ All types (2000+ lines)
└── index.ts
```

### CRITICAL: Wave 3 Components Are Desktop-First

Wave 3 components work but are **desktop-optimized**. Wave 4 focuses on:

1. **Mobile-specific UX patterns** (swipe gestures, bottom sheets, touch targets)
2. **Mobile-optimized variations** of existing components
3. **Mobile-only components** (floating buttons, sticky bars, gestures)
4. **Performance optimizations** for mobile devices

**STRATEGY:**
- Create NEW mobile-specific components (not replace desktop ones)
- Use `useMobile()` hook to detect mobile devices
- Components can render differently based on device
- Some components are MOBILE-ONLY (floating cart button, swipe gestures)

---

## KEY TECHNICAL PATTERNS

### Mobile Detection Hook (Create First)
```typescript
// src/modules/ecommerce/hooks/useMobile.ts
'use client'

import { useState, useEffect } from 'react'

export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])
  
  return isMobile
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 768) setBreakpoint('mobile')
      else if (width < 1024) setBreakpoint('tablet')
      else setBreakpoint('desktop')
    }
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])
  
  return breakpoint
}
```

### Touch Gesture Hook
```typescript
// src/modules/ecommerce/hooks/useSwipeGesture.ts
'use client'

import { useState, useRef, TouchEvent } from 'react'

interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // minimum distance for swipe (default 50px)
}

export function useSwipeGesture(config: SwipeConfig) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const threshold = config.threshold ?? 50

  const onTouchStart = (e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return
    
    const deltaX = e.changedTouches[0].clientX - touchStart.current.x
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > threshold) config.onSwipeRight?.()
      else if (deltaX < -threshold) config.onSwipeLeft?.()
    } else {
      // Vertical swipe
      if (deltaY > threshold) config.onSwipeDown?.()
      else if (deltaY < -threshold) config.onSwipeUp?.()
    }
    
    touchStart.current = null
  }

  return { onTouchStart, onTouchEnd }
}
```

### Bottom Sheet Component Pattern
```typescript
// Bottom sheets slide up from bottom on mobile
// Use Radix UI Dialog with custom positioning
// OR use Vaul library (drawer component)
// framer-motion for gesture-driven animations
```

### Sticky Elements Pattern
```typescript
// Sticky add-to-cart bar (mobile)
// Uses position: sticky with z-index
// Respects safe-area-inset-bottom for notched phones
className="fixed bottom-0 left-0 right-0 pb-safe z-50"
// Tailwind: pb-safe = padding-bottom: env(safe-area-inset-bottom)
```

### Touch Target Requirements
```typescript
// All touch targets MUST be minimum 44x44px
// Apple HIG / Material Design guidelines
className="min-h-[44px] min-w-[44px]"
```

---

## RESPONSIVEVALUE PATTERN (CRITICAL)

ALL visual props MUST use ResponsiveValue:
```typescript
type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T };

// Wave 4 often uses this to show/hide elements
interface MobileCartButtonProps {
  showOnMobile: ResponsiveValue<boolean>;      // true on mobile, false on desktop
  position: ResponsiveValue<"bottom-right" | "bottom-center">;
  size: ResponsiveValue<"sm" | "md" | "lg">;
}
```

---

## STUDIO COMPONENT REGISTRATION PATTERN

Every component MUST be registered:
```typescript
import { defineComponent, type ComponentDefinition } from '@/lib/studio/component-registry'

export const MobileCartButtonDefinition: ComponentDefinition = defineComponent({
  type: "MobileCartButton",
  label: "Mobile Cart Button",
  description: "Floating cart button for mobile devices",
  category: "ecommerce",
  icon: "ShoppingBag",
  render: MobileCartButtonRender,
  fields: {
    showOnMobile: {
      type: "responsive-boolean",
      label: "Show on Mobile",
      description: "Display floating button on mobile devices",
      default: { mobile: true, tablet: false, desktop: false }
    },
    position: {
      type: "responsive-select",
      label: "Position",
      options: [
        { value: "bottom-right", label: "Bottom Right" },
        { value: "bottom-center", label: "Bottom Center" }
      ],
      default: "bottom-right"
    }
  },
  defaultProps: {
    showOnMobile: { mobile: true, tablet: false, desktop: false },
    position: "bottom-right"
  },
  ai: {
    description: "Floating cart button visible only on mobile. Shows item count badge.",
    canModify: ["position", "showOnMobile"],
    suggestions: [
      "Add pulse animation when items added",
      "Show on tablet too",
      "Change to center position"
    ]
  }
})
```

---

## DOCUMENT FORMAT REQUIREMENTS

Each PHASE document MUST follow this EXACT structure:

```markdown
# PHASE-ECOM-XX: [Phase Title]

> **Priority**: 🟠 HIGH
> **Estimated Time**: X-Y hours
> **Prerequisites**: Wave 3 Complete (ECOM-20 through ECOM-25)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

[2-3 sentences describing what this phase accomplishes]

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review Wave 3 components (`src/modules/ecommerce/studio/components/`)
- [ ] Verify all Wave 3 hooks exist (`src/modules/ecommerce/hooks/`)
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

[Mobile UX patterns, gesture handling, device detection]

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `path/to/file.tsx` | Create/Modify | Description |

---

## 📋 Implementation Tasks

### Task X.1: [Task Name]

**File**: `src/modules/ecommerce/path/to/file.tsx`
**Action**: Create | Modify

**Description**: [What this task accomplishes]

\`\`\`typescript
// COMPLETE implementation code here
// Include ALL imports
// Include ALL TypeScript types
// Include inline comments explaining logic
// This must be copy-paste ready
\`\`\`

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Test on real mobile device (not just DevTools)
- [ ] Test touch gestures (swipe, tap, long-press)
- [ ] Test on iOS Safari AND Android Chrome
- [ ] Test with slow 3G throttling
- [ ] Test safe-area-inset (notched phones)

---

## 🔄 Rollback Plan

If issues occur:
1. Delete new mobile component files
2. Wave 3 desktop components remain functional
3. No migration needed

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add phase completion note
- `progress.md`: Update e-commerce Wave 4 section

---

## ✨ Success Criteria

- [ ] [Specific measurable outcome 1]
- [ ] [Specific measurable outcome 2]
```

---

## WAVE 4 PHASE SPECIFICATIONS

### PHASE-ECOM-30: Mobile Cart Experience

**Purpose:** Create mobile-optimized cart components with touch-friendly interactions.

**Must Include:**

#### NEW Hooks:
- `useMobile.ts` - Device detection hook
- `useSwipeGesture.ts` - Touch gesture detection

#### NEW Components:

**1. MobileCartBottomSheet (`mobile-cart-bottom-sheet.tsx`)**
- Replaces drawer on mobile
- Slides up from bottom (gesture-driven)
- 50% height by default, swipe up for full
- Swipe down to dismiss
- Uses `framer-motion` for smooth animations
- Handle indicator at top

**2. MobileCartButton (`mobile-cart-button.tsx`)**
- Floating action button (FAB) for cart
- Shows item count badge
- Positioned bottom-right (configurable)
- Pulse animation when item added
- Only visible on mobile (via CSS or hook)
- Opens MobileCartBottomSheet on tap

**3. SwipeableCartItem (`swipeable-cart-item.tsx`)**
- Cart line item with swipe gestures
- Swipe left to reveal delete action
- Swipe right to reveal move-to-wishlist
- Touch-friendly quantity buttons (+/- with larger targets)
- Haptic feedback option (via navigator.vibrate)

**4. MobileQuantitySelector (`mobile-quantity-selector.tsx`)**
- Large touch targets (44x44px minimum)
- Long-press for rapid increment
- Stepper style (+/-)
- Or horizontal slider option

**5. CartNotification (`cart-notification.tsx`)**
- Toast notification when item added
- "View Cart" shortcut
- Auto-dismiss after 3s
- Slide-in from bottom on mobile

**Integration Points:**
- Update `useStorefrontCart` with `notifyOnAdd: boolean` option
- Export all from `src/modules/ecommerce/studio/components/mobile/`
- Register in Studio component registry

---

### PHASE-ECOM-31: Mobile Checkout Flow

**Purpose:** Single-page mobile checkout with touch-optimized forms.

**Must Include:**

#### NEW Components:

**1. MobileCheckoutPage (`mobile-checkout-page.tsx`)**
- Single scrolling page (no steps)
- Collapsible sections (accordion style)
- Express checkout at top (Apple Pay, Google Pay placeholders)
- Sticky order summary at bottom
- Keyboard-aware (scrolls when keyboard opens)

**2. MobileAddressInput (`mobile-address-input.tsx`)**
- Large input fields (min 48px height)
- Autocomplete support (Google Places API ready)
- Country/region selectors optimized for touch
- Auto-format phone numbers
- Save address checkbox

**3. MobilePaymentSelector (`mobile-payment-selector.tsx`)**
- Large radio cards for payment methods
- Card input with auto-formatting
- Mobile wallet buttons (Apple Pay, Google Pay styling)
- Clear visual feedback on selection

**4. MobileCheckoutProgress (`mobile-checkout-progress.tsx`)**
- Minimal progress indicator
- Compact horizontal dots or line
- Section labels (Shipping → Payment → Review)

**5. MobileOrderReview (`mobile-order-review.tsx`)**
- Compact order summary
- Expandable line items
- Clear total display
- "Place Order" sticky button at bottom

**6. TouchFriendlyForm Components:**
- `MobileInput` - Larger inputs with clear labels
- `MobileSelect` - Native select or custom bottom sheet
- `MobileCheckbox` - Larger checkbox with good spacing
- `MobileRadioGroup` - Card-style radio options

**Key Features:**
- Autofill support (name, email, address, card)
- Input type hints (`inputMode="numeric"` for phone, card)
- Error states that don't obscure fields
- Loading state with skeleton

---

### PHASE-ECOM-32: Mobile Product Experience

**Purpose:** Touch-optimized product viewing and interaction.

**Must Include:**

#### NEW Components:

**1. MobileProductGallery (`mobile-product-gallery.tsx`)**
- Full-width swipe gallery
- Swipe left/right between images
- Pinch-to-zoom
- Dot indicators below
- Double-tap to zoom
- Optional fullscreen mode

**2. StickyAddToCartBar (`sticky-add-to-cart-bar.tsx`)**
- Fixed at bottom of screen
- Shows price + Add to Cart button
- Appears when main button scrolls out of view
- Uses IntersectionObserver
- Respects safe-area-inset-bottom

**3. MobileVariantSelector (`mobile-variant-selector.tsx`)**
- Bottom sheet for variant selection
- Large touch targets for options
- Visual swatches for colors
- Size chips/pills
- Out-of-stock states clearly shown

**4. CollapsibleProductDetails (`collapsible-product-details.tsx`)**
- Accordion-style sections:
  - Description (default open)
  - Specifications
  - Shipping Info
  - Reviews
- Smooth expand/collapse animations
- Only one section open at a time (optional)

**5. MobileProductCard (`mobile-product-card.tsx`)**
- Optimized for mobile grid (2-col)
- Larger image area
- Truncated title (2 lines max)
- Quick add button (+ icon)
- Swipe for quick actions

**6. ProductSwipeView (`product-swipe-view.tsx`)**
- Tinder-style product browsing
- Swipe right to add to cart
- Swipe left to skip
- Swipe up to add to wishlist
- Fun discovery experience

**7. MobileQuickView (`mobile-quick-view.tsx`)**
- Bottom sheet with product details
- Image, price, variant selector
- Add to cart button
- "View Full Details" link

**Key Features:**
- All images lazy-loaded
- Skeleton loaders during fetch
- Touch feedback on all interactions
- Smooth 60fps animations

---

## IMPLEMENTATION PRIORITIES

1. **Start with hooks** (`useMobile`, `useSwipeGesture`)
2. **Build ECOM-30 first** (cart is most used on mobile)
3. **Then ECOM-32** (product browsing)
4. **Finally ECOM-31** (checkout - builds on ECOM-30)

---

## DEPENDENCIES & PACKAGES

### Existing (Already in package.json):
- `framer-motion` - Animations and gestures
- `@radix-ui/react-dialog` - Base for bottom sheets
- `lucide-react` - Icons

### May Need to Add:
- `vaul` - Drawer/bottom sheet component (optional - can use framer-motion)
- `react-swipeable` - Swipe gesture library (optional - can build custom)

**Preference:** Build custom hooks using native touch events + framer-motion for animations. Avoids dependency bloat.

---

## MOBILE UX BEST PRACTICES

### Touch Targets
- Minimum 44x44px (Apple HIG)
- Spacing between targets: 8px minimum
- Active state feedback (scale, color change)

### Safe Areas
```css
/* For notched phones */
padding-bottom: env(safe-area-inset-bottom);
/* Tailwind: pb-safe (if configured) */
```

### Keyboard Handling
```typescript
// Scroll input into view when keyboard opens
inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
```

### Performance
- Lazy load images
- Virtualize long lists
- Debounce scroll handlers
- Use CSS transforms (not top/left)
- `will-change` for animated elements

### Gestures
- 300ms delay removed (touch-action: manipulation)
- Swipe threshold: 50px minimum
- Velocity-based animations

---

## SUCCESS METRICS FOR WAVE 4

After implementation, the e-commerce module should:

1. ✅ Cart interactions feel native on mobile
2. ✅ Swipe gestures work smoothly
3. ✅ Bottom sheets replace dialogs on mobile
4. ✅ Checkout completes in <3 minutes on mobile
5. ✅ All touch targets are 44px+ 
6. ✅ Works on iOS Safari AND Android Chrome
7. ✅ No layout shifts on mobile
8. ✅ Images load progressively
9. ✅ Forms autofill correctly
10. ✅ Safe-area-inset respected on notched phones

---

## FILES TO CREATE SUMMARY

### Hooks (3 files):
```
src/modules/ecommerce/hooks/
├── useMobile.ts          # Device detection
├── useSwipeGesture.ts    # Touch gesture detection  
└── useKeyboardVisible.ts # Keyboard state detection
```

### Mobile Components (18 files):
```
src/modules/ecommerce/studio/components/mobile/
├── index.ts
├── MobileCartBottomSheet.tsx
├── MobileCartButton.tsx
├── SwipeableCartItem.tsx
├── MobileQuantitySelector.tsx
├── CartNotification.tsx
├── MobileCheckoutPage.tsx
├── MobileAddressInput.tsx
├── MobilePaymentSelector.tsx
├── MobileCheckoutProgress.tsx
├── MobileOrderReview.tsx
├── MobileInput.tsx
├── MobileSelect.tsx
├── MobileProductGallery.tsx
├── StickyAddToCartBar.tsx
├── MobileVariantSelector.tsx
├── CollapsibleProductDetails.tsx
├── MobileProductCard.tsx
├── ProductSwipeView.tsx
└── MobileQuickView.tsx
```

---

## CRITICAL REMINDERS FOR AI AGENT

1. **Every code block must be COMPLETE** - no `// ... rest of code` placeholders
2. **Include ALL imports** at top of file
3. **Include ALL TypeScript types** - no `any`
4. **Test on REAL mobile device** - Chrome DevTools isn't enough
5. **Use existing hooks** from Wave 3 (`useStorefrontCart`, etc.)
6. **Follow ResponsiveValue pattern** for all visual props
7. **Register components in Studio registry**
8. **Handle loading, error, and empty states**
9. **All touch targets must be 44px+**
10. **Use framer-motion for animations** (already in deps)

---

**END OF WAVE 4 MASTER PROMPT**

---

## QUICK REFERENCE: Wave 3 Hook Signatures

```typescript
// useStorefrontCart
const { 
  cart, items, totals, isLoading, error,
  addItem, updateQuantity, removeItem, clearCart,
  applyDiscount, removeDiscount
} = useStorefrontCart(siteId)

// useStorefrontProducts
const {
  products, isLoading, error, pagination,
  setPage, setSort, setFilters
} = useStorefrontProducts(siteId, options)

// useStorefrontProduct
const {
  product, variants, isLoading, error
} = useStorefrontProduct(siteId, productIdOrSlug)

// useStorefrontWishlist
const {
  items, addItem, removeItem, isInWishlist, clearWishlist
} = useStorefrontWishlist(siteId)

// useStorefrontCategories
const {
  categories, getCategoryById, getCategoryPath, isLoading
} = useStorefrontCategories(siteId)

// useStorefrontSearch
const {
  query, setQuery, results, isSearching, recentSearches
} = useStorefrontSearch(siteId)

// useCheckout
const {
  step, setStep, shippingAddress, setShippingAddress,
  billingAddress, setBillingAddress, paymentMethod, setPaymentMethod,
  placeOrder, isProcessing, error
} = useCheckout(siteId)
```
