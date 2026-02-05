# Wave 3 E-Commerce Testing Guide (ECOM-20 to ECOM-25)

This guide provides step-by-step instructions for testing all Wave 3 frontend components.

## Prerequisites

1. **Start the development server:**
   ```bash
   cd next-platform-dashboard
   pnpm dev
   ```

2. **Ensure you have a test site with:**
   - E-commerce settings configured (currency, tax rate)
   - Sample products with images, prices, variants
   - Categories (including nested categories)
   - Some products with discounts/sale prices
   - At least one quote in the database

3. **Access the test page at:** `http://localhost:3000/test/ecommerce`
   (You may need to create this route - see Setup section below)

---

## Quick Setup: Create Test Page

Create a test page at `src/app/test/ecommerce/page.tsx`:

```tsx
'use client'

import { StorefrontProvider } from '@/modules/ecommerce/context/storefront-context'
import { 
  ProductGridBlock,
  ProductCardBlock,
  CategoryNavBlock,
  SearchBarBlock,
  FilterSidebarBlock,
  CartDrawerBlock,
  MiniCartBlock,
  QuoteListBlock,
  QuoteRequestBlock
} from '@/modules/ecommerce/studio'

// Replace with your actual site ID from the database
const TEST_SITE_ID = 'your-site-id-here'

export default function EcommerceTestPage() {
  return (
    <StorefrontProvider siteId={TEST_SITE_ID}>
      <div className="container py-8 space-y-12">
        <h1 className="text-3xl font-bold">E-Commerce Component Test Page</h1>
        
        {/* Add components here for testing */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Search</h2>
          <SearchBarBlock variant="expanded" />
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Categories</h2>
          <CategoryNavBlock variant="grid" columns={4} />
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Products</h2>
          <ProductGridBlock columns={4} limit={8} />
        </section>
        
        {/* Add more sections as needed */}
      </div>
    </StorefrontProvider>
  )
}
```

---

## PHASE ECOM-20: Core Data Hooks Testing

### Test: StorefrontProvider Context
**Location:** Wrap components in `<StorefrontProvider siteId="...">` 

**Steps:**
1. Add a component that uses `useStorefront()` hook
2. Verify `siteId` is set
3. Verify `formatPrice(100)` returns formatted currency (e.g., "$100.00")
4. Verify `taxRate` is loaded from settings
5. Verify `settings` object contains currency info

**Expected:** 
- No console errors
- `isInitialized` becomes true after load
- Currency formatting works correctly

### Test: useStorefrontProducts Hook
**Component:** `ProductGridBlock`

**Steps:**
1. Render `<ProductGridBlock limit={8} />`
2. Verify products load with skeleton first
3. Test filtering by categoryId prop
4. Test sorting with sortBy prop

**Expected:**
- Products display with images, prices
- Loading skeleton shows initially
- Filtering/sorting works

### Test: useStorefrontCategories Hook  
**Component:** `CategoryNavBlock`

**Steps:**
1. Render `<CategoryNavBlock variant="tree" />`
2. Expand nested categories
3. Click a category link

**Expected:**
- Category tree displays
- Nested categories are expandable
- Links navigate correctly

### Test: useStorefrontSearch Hook
**Component:** `SearchBarBlock`

**Steps:**
1. Render `<SearchBarBlock />`
2. Type a product name
3. Wait for debounced search
4. Click a search result

**Expected:**
- Dropdown appears with results
- Recent searches display
- Search results are clickable

### Test: useStorefrontCart Hook
**Component:** `MiniCartBlock`, `CartDrawerBlock`

**Steps:**
1. Add a product to cart (via ProductCardBlock)
2. Verify cart icon shows count
3. Open cart drawer
4. Update quantity
5. Remove item
6. Test discount code (if configured)

**Expected:**
- Cart updates in real-time
- Totals recalculate
- Items persist on refresh

### Test: useStorefrontWishlist Hook
**Component:** `WishlistBlock` (if implemented)

**Steps:**
1. Click heart icon on product
2. Verify item added to wishlist
3. Remove from wishlist
4. Verify persistence (localStorage)

**Expected:**
- Items toggle on/off
- Persists across sessions

---

## PHASE ECOM-21: Product Display Testing

### Test: ProductCardBlock
**Steps:**
1. Render product card with different variants:
   - `variant="default"` - Standard card
   - `variant="compact"` - Smaller version  
   - `variant="detailed"` - With description
2. Hover to see quick actions
3. Click Add to Cart
4. Click wishlist heart

**Expected:**
- Images load correctly
- Sale badges appear for discounted items
- Quick view works (if enabled)

### Test: ProductGridBlock
**Steps:**
1. Test different column counts (2, 3, 4, 6)
2. Enable pagination
3. Test infinite scroll (if enabled)
4. Filter by category

**Expected:**
- Grid layouts correctly
- Pagination/infinite scroll works
- Empty state shows when no products

### Test: FeaturedProductsBlock
**Steps:**
1. Test carousel variant
2. Test grid variant
3. Test slider navigation

**Expected:**
- Featured products display
- Carousel slides smoothly
- Navigation dots/arrows work

---

## PHASE ECOM-22: Cart Components Testing

### Test: CartItemCard
**Steps:**
1. Add items to cart
2. View cart drawer/page
3. Change quantities via input
4. Change quantities via +/- buttons
5. Remove items

**Expected:**
- Quantity updates immediately
- Line totals recalculate
- Removal animates out

### Test: CartDrawerBlock
**Steps:**
1. Click cart icon to open
2. Verify items display
3. Update quantities
4. Click "Checkout" button
5. Click overlay to close

**Expected:**
- Drawer slides in from right
- Totals update in real-time
- Checkout navigates correctly

### Test: CartPageBlock (Full Page Cart)
**Steps:**
1. Navigate to cart page
2. Test all item operations
3. Apply discount code
4. Verify shipping calculation
5. Proceed to checkout

**Expected:**
- Full cart experience works
- Discount codes apply
- Empty cart state shows when empty

### Test: MiniCartBlock (Header Icon)
**Steps:**
1. Add items to cart
2. Verify badge count updates
3. Hover/click to see preview
4. Click to open full cart

**Expected:**
- Badge shows correct count
- Preview shows recent items
- Opens cart drawer on click

---

## PHASE ECOM-23: Checkout Flow Testing

### Test: CheckoutPageBlock
**Steps:**
1. Add items to cart
2. Click checkout
3. Fill shipping address (or select existing)
4. Select shipping method
5. Enter payment details
6. Review order summary
7. Place order

**Expected:**
- Steps progress linearly
- Validation on each step
- Order summary updates
- Success/confirmation on complete

### Test: AddressFormBlock
**Steps:**
1. Fill all required fields
2. Leave field blank - see validation
3. Select saved address (if available)
4. Add new address

**Expected:**
- Required fields validated
- Auto-complete works (if enabled)
- Address saves correctly

### Test: ShippingMethodsBlock
**Steps:**
1. Select different shipping options
2. Verify price changes in summary
3. Test free shipping threshold

**Expected:**
- Methods load for location
- Prices display correctly
- Selection updates totals

### Test: OrderSummaryCard
**Steps:**
1. Review items in summary
2. Verify subtotal
3. Verify tax calculation
4. Verify shipping
5. Verify discount (if applied)
6. Verify total

**Expected:**
- All calculations correct
- Discount shows if applied
- Total matches expected

---

## PHASE ECOM-24: Navigation & Discovery Testing

### Test: CategoryCard
**Steps:**
1. Test card variant: `<CategoryCard category={...} variant="card" />`
2. Test row variant: `<CategoryCard category={...} variant="row" />`
3. Test chip variant: `<CategoryCard category={...} variant="chip" />`
4. Click to navigate

**Expected:**
- All variants display correctly
- Images load
- Links work

### Test: CategoryNavBlock
**Steps:**
1. Test tree variant: Expand/collapse nested items
2. Test grid variant: 2, 3, 4, 6 columns
3. Test list variant: Simple list view
4. Test cards variant: Card-based grid

**Expected:**
- All variants render
- Nested categories work in tree
- Responsive columns adjust

### Test: SearchBarBlock
**Steps:**
1. Type to search (debounced)
2. View product results dropdown
3. View recent searches
4. View trending searches (if configured)
5. View recently viewed products
6. Press Enter to navigate to search page
7. Click product to navigate

**Expected:**
- Debounced search works
- Results show images, prices
- Recent/trending populate
- Navigation works

### Test: FilterSidebarBlock
**Steps:**
1. Test sidebar variant
2. Expand/collapse filter sections
3. Select category filters
4. Set price range
5. Toggle in-stock filter
6. Toggle on-sale filter
7. Clear all filters

**Expected:**
- Filters apply to product list
- Active filter count shows
- Clear all resets

### Test: ActiveFilters
**Steps:**
1. Apply multiple filters
2. View active filter tags
3. Click X on individual filter
4. Click "Clear all"

**Expected:**
- Tags show for each active filter
- Individual removal works
- Clear all removes all

### Test: BreadcrumbBlock
**Steps:**
1. Navigate to a category
2. View breadcrumb trail
3. Click parent category
4. Test on product page

**Expected:**
- Shows Home > Category > Subcategory
- Links navigate correctly

### Test: ProductSortBlock
**Steps:**
1. Test dropdown variant
2. Test button group variant
3. Test tabs variant
4. Select: Newest, Price Low-High, Price High-Low, Name, Popular

**Expected:**
- Products reorder based on selection
- Selected option highlighted

---

## PHASE ECOM-25: Quotation Frontend Testing

### Test: QuoteStatusBadge
**Steps:**
1. View quotes in different statuses:
   - draft (gray)
   - pending_approval (yellow)
   - sent (blue)
   - viewed (blue)
   - accepted (green)
   - rejected (red)
   - expired (gray)
   - converted (green)
   - cancelled (gray)

**Expected:**
- Correct colors for each status
- Labels display correctly

### Test: QuoteItemCard
**Steps:**
1. View a quote with items
2. See product image, name, SKU
3. See unit price × quantity
4. See line total

**Expected:**
- All item details display
- Calculations correct

### Test: QuotePriceBreakdown
**Steps:**
1. View quote totals
2. Verify subtotal
3. Verify discount (if any)
4. Verify shipping
5. Verify tax
6. Verify total

**Expected:**
- All lines show correctly
- Math is accurate

### Test: QuoteActionButtons
**Steps:**
1. View a sent/pending quote
2. Click "Accept Quote"
3. Verify confirmation dialog
4. Click "Request Changes"
5. Click "Print Quote"
6. Click "Share Quote"

**Expected:**
- Actions trigger correctly
- Dialogs appear for confirmation
- Print opens print dialog
- Share copies link

### Test: QuoteRequestBlock
**Steps:**
1. Fill out customer name
2. Fill out email
3. Fill out phone (optional)
4. Select products for quote
5. Add notes
6. Submit quote request

**Expected:**
- Validation on required fields
- Product search/select works
- Submission creates quote

### Test: QuoteListBlock
**Steps:**
1. View list of customer quotes
2. Test status filter dropdown
3. Test date sorting
4. Test pagination
5. Click quote to view details

**Expected:**
- Quotes list correctly
- Filters work
- Pagination works
- Click navigates to detail

### Test: QuoteDetailBlock
**Steps:**
1. Navigate to a quote detail
2. See quote header (number, date, status)
3. See customer info
4. See all line items
5. See price breakdown
6. See terms & conditions
7. Use action buttons

**Expected:**
- Full quote displays
- All sections render
- Actions work

---

## Testing Checklist

### ECOM-20: Core Data Hooks
- [ ] StorefrontProvider loads settings
- [ ] formatPrice formats currency correctly
- [ ] useStorefrontProducts fetches products
- [ ] useStorefrontCategories fetches categories  
- [ ] useStorefrontSearch searches products
- [ ] useStorefrontCart manages cart state
- [ ] useStorefrontWishlist manages wishlist
- [ ] useRecentlyViewed tracks viewed products

### ECOM-21: Product Display
- [ ] ProductCardBlock all variants work
- [ ] ProductGridBlock columns/pagination work
- [ ] FeaturedProductsBlock carousel works
- [ ] ProductQuickView modal works

### ECOM-22: Cart Components
- [ ] CartItemCard quantity/remove works
- [ ] CartDrawerBlock opens/closes correctly
- [ ] CartPageBlock full page works
- [ ] MiniCartBlock badge updates
- [ ] Discount codes apply correctly

### ECOM-23: Checkout Flow
- [ ] CheckoutPageBlock steps work
- [ ] AddressFormBlock validation works
- [ ] ShippingMethodsBlock selection works
- [ ] PaymentFormBlock (mock) works
- [ ] OrderSummaryCard calculations correct
- [ ] Order placement succeeds

### ECOM-24: Navigation & Discovery
- [ ] CategoryCard all variants work
- [ ] CategoryNavBlock tree/grid/list work
- [ ] SearchBarBlock search + suggestions work
- [ ] FilterSidebarBlock filters apply
- [ ] ActiveFilters shows/removes filters
- [ ] BreadcrumbBlock navigation works
- [ ] ProductSortBlock sorting works

### ECOM-25: Quotation Frontend
- [ ] QuoteStatusBadge colors correct
- [ ] QuoteItemCard displays items
- [ ] QuotePriceBreakdown totals correct
- [ ] QuoteActionButtons actions work
- [ ] QuoteRequestBlock creates quote
- [ ] QuoteListBlock lists/filters quotes
- [ ] QuoteDetailBlock shows full quote

---

## Common Issues & Solutions

### "Module not found" Error
- Ensure all imports are from `@/modules/ecommerce/studio`
- Check that exports are in `studio/index.ts`

### Components Not Loading
- Verify StorefrontProvider wraps the component
- Check siteId is valid and settings exist

### Cart Not Working  
- Check localStorage isn't blocked
- Verify cart actions in ecommerce-actions.ts

### Search Not Returning Results
- Verify products exist with matching names
- Check product status is 'active'

### Quotes Not Loading
- Verify user has quotes in database
- Check userId is passed correctly

---

## Notes

- All components are designed to be responsive
- Use ResponsiveValue props for different breakpoints
- Components use the StorefrontContext for siteId, currency, etc.
- Cart/Wishlist persist via localStorage for guests
