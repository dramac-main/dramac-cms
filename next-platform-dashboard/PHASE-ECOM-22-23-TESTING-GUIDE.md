# E-Commerce Cart & Checkout Testing Guide

## PHASE-ECOM-22 (Cart Components) & PHASE-ECOM-23 (Checkout Components)

---

## Prerequisites

1. **Database**: Ensure you have the e-commerce database tables set up
2. **Products**: You need some products in your database to add to cart
3. **Site**: You need a site with the e-commerce module installed

---

## Step 1: Start Development Server

```bash
# From the project root
cd next-platform-dashboard
pnpm install  # if needed
pnpm dev
```

Server will start at `http://localhost:3000`

---

## Step 2: Access the Dashboard

1. Navigate to `http://localhost:3000`
2. Log in with your credentials
3. Select a site that has the **E-Commerce module** installed

---

## Step 3: Testing Cart Components

### Option A: Direct Component Testing

The cart components are exported from the ecommerce module and can be used in any page that is wrapped with `StorefrontProvider`.

```tsx
import { StorefrontProvider } from '@/modules/ecommerce/context/storefront-context'
import { CartPageBlock, CartDrawerBlock, MiniCartBlock } from '@/modules/ecommerce/studio'

export default function TestPage() {
  return (
    <StorefrontProvider siteId="your-site-id">
      {/* Full Cart Page */}
      <CartPageBlock />
      
      {/* Or Cart Drawer */}
      <CartDrawerBlock />
      
      {/* Or Mini Cart Popover */}
      <MiniCartBlock />
    </StorefrontProvider>
  )
}
```

### Option B: Create a Test Route

Create a test page at `src/app/(test)/cart-test/page.tsx`:

```tsx
'use client'

import { StorefrontProvider } from '@/modules/ecommerce/context/storefront-context'
import { CartPageBlock } from '@/modules/ecommerce/studio'

export default function CartTestPage() {
  // Replace with your actual site ID
  const siteId = 'your-site-uuid-here'
  
  return (
    <StorefrontProvider siteId={siteId}>
      <CartPageBlock 
        title="Shopping Cart"
        shopLink="/shop"
        checkoutHref="/checkout-test"
      />
    </StorefrontProvider>
  )
}
```

---

## Step 4: Testing Checkout Components

Create a test page at `src/app/(test)/checkout-test/page.tsx`:

```tsx
'use client'

import { StorefrontProvider } from '@/modules/ecommerce/context/storefront-context'
import { CheckoutPageBlock } from '@/modules/ecommerce/studio'

export default function CheckoutTestPage() {
  const siteId = 'your-site-uuid-here'
  
  return (
    <StorefrontProvider siteId={siteId}>
      <CheckoutPageBlock 
        cartHref="/cart-test"
        successHref="/order-success"
        onOrderComplete={(orderId, orderNumber) => {
          console.log('Order placed:', orderId, orderNumber)
        }}
      />
    </StorefrontProvider>
  )
}
```

---

## Step 5: Test Flow

### Adding Items to Cart

Since you need products to test, you can use the `useStorefrontCart` hook directly:

```tsx
'use client'

import { useStorefrontCart } from '@/modules/ecommerce/hooks'
import { useStorefront } from '@/modules/ecommerce/context/storefront-context'
import { Button } from '@/components/ui/button'

function AddToCartButton({ productId }: { productId: string }) {
  const { siteId, taxRate } = useStorefront()
  const { addItem, isUpdating } = useStorefrontCart(siteId, undefined, taxRate)
  
  const handleAdd = async () => {
    await addItem(productId, null, 1)
    alert('Added to cart!')
  }
  
  return (
    <Button onClick={handleAdd} disabled={isUpdating}>
      Add to Cart
    </Button>
  )
}
```

### Complete Testing Flow

1. **Navigate to Product Page** (if you have one) or use the direct add method
2. **Add items to cart**
3. **Open Cart Drawer** - Click the cart icon in the header
4. **View Cart Page** - Navigate to `/cart-test`
5. **Adjust quantities** - Use +/- buttons
6. **Apply discount code** - Try applying a code
7. **Proceed to Checkout** - Click the checkout button
8. **Complete checkout steps**:
   - Step 1: Enter contact info and shipping address
   - Step 2: Select shipping method
   - Step 3: Select payment method and billing address
   - Step 4: Review and place order

---

## Step 6: Testing Individual Components

### CartQuantitySelector

```tsx
import { CartQuantitySelector } from '@/modules/ecommerce/studio'

<CartQuantitySelector
  quantity={2}
  onQuantityChange={(qty) => console.log('New qty:', qty)}
  onRemove={() => console.log('Remove item')}
  size="md"  // 'sm' | 'md' | 'lg'
/>
```

### CartEmptyState

```tsx
import { CartEmptyState } from '@/modules/ecommerce/studio'

<CartEmptyState
  title="Your cart is empty"
  description="Add some items to get started"
  shopLink="/shop"
  shopLinkText="Browse Products"
/>
```

### CartDrawerBlock (Slide-out Cart)

```tsx
import { CartDrawerBlock } from '@/modules/ecommerce/studio'

// In your header/layout
<CartDrawerBlock 
  side="right"
  checkoutHref="/checkout"
  shopLink="/shop"
/>
```

### MiniCartBlock (Popover)

```tsx
import { MiniCartBlock } from '@/modules/ecommerce/studio'

// In your header
<MiniCartBlock 
  maxItems={3}
  cartHref="/cart"
  checkoutHref="/checkout"
/>
```

### CheckoutStepIndicator

```tsx
import { CheckoutStepIndicator } from '@/modules/ecommerce/studio'

<CheckoutStepIndicator
  steps={['information', 'shipping', 'payment', 'review']}
  currentStep="shipping"
  onStepClick={(step) => console.log('Go to:', step)}
/>
```

---

## Step 7: Verifying Database Operations

### Check Cart in Database

```sql
-- View carts
SELECT * FROM mod_ecommod01_carts 
WHERE site_id = 'your-site-id';

-- View cart items
SELECT ci.*, p.name as product_name 
FROM mod_ecommod01_cart_items ci
JOIN mod_ecommod01_products p ON ci.product_id = p.id
WHERE ci.cart_id = 'your-cart-id';
```

### Check Orders After Checkout

```sql
-- View orders
SELECT * FROM mod_ecommod01_orders 
WHERE site_id = 'your-site-id'
ORDER BY created_at DESC;

-- View order items
SELECT * FROM mod_ecommod01_order_items 
WHERE order_id = 'your-order-id';
```

---

## Component Props Reference

### CartPageBlock

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | "Shopping Cart" | Page title |
| shopLink | string | "/shop" | Continue shopping link |
| shopLinkText | string | "Continue Shopping" | Continue shopping text |
| checkoutHref | string | "/checkout" | Checkout URL |
| checkoutText | string | "Proceed to Checkout" | Checkout button text |
| showClearCart | boolean | true | Show clear cart button |

### CheckoutPageBlock

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| cartHref | string | "/cart" | Return to cart link |
| successHref | string | "/order-confirmation" | Success redirect URL |
| onOrderComplete | function | - | Callback after order placed |

### CartDrawerBlock

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| trigger | ReactNode | - | Custom trigger button |
| side | "left" \| "right" | "right" | Drawer side |
| checkoutHref | string | "/checkout" | Checkout URL |
| shopLink | string | "/shop" | Empty state shop link |

---

## Troubleshooting

### Cart Not Loading
- Ensure `StorefrontProvider` wraps your component
- Check that `siteId` is valid and has e-commerce module
- Check browser console for errors

### Cart Items Not Showing
- Verify products exist in database
- Check that product `is_active` is true
- Ensure proper RLS policies are in place

### Checkout Not Working
- Ensure cart has items
- Check API route `/api/modules/ecommerce/checkout` exists
- Verify all required fields are filled

### TypeScript Errors
- Run `npx tsc --noEmit` to check for errors
- Ensure all imports are from correct paths

---

## Notes

- All components are mobile-responsive
- Cart state persists via localStorage session ID (for guests)
- Logged-in users have cart tied to their user ID
- Discount codes integrate with the `mod_ecommod01_discounts` table
