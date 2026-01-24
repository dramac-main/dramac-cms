/**
 * E-Commerce Storefront Widget
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Embeddable storefront widget that can be placed on external sites.
 * Provides product browsing, cart management, and checkout functionality.
 * 
 * FOLLOWS BOOKING WIDGET PATTERN
 */
'use client'

import React, { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'
import {
  getProducts,
  getCategories,
  getOrCreateCart,
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  applyDiscountToCart,
  removeDiscountFromCart,
  getEcommerceSettings
} from '../actions/ecommerce-actions'
import type { 
  Product, 
  Category, 
  Cart, 
  CartItem,
  EcommerceSettings,
  CartTotals
} from '../types/ecommerce-types'

// ============================================================================
// CART CONTEXT
// ============================================================================

interface CartContextValue {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  totals: CartTotals | null
  addItem: (productId: string, variantId: string | null, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clear: () => Promise<void>
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>
  removeDiscount: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// ============================================================================
// CART PROVIDER
// ============================================================================

interface CartProviderProps {
  children: ReactNode
  siteId: string
  sessionId?: string
  userId?: string
  taxRate?: number
  currency?: string
}

export function CartProvider({ 
  children, 
  siteId, 
  sessionId, 
  userId,
  taxRate = 0,
  currency = 'USD'
}: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize cart
  const initCart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const c = await getOrCreateCart(siteId, userId, sessionId)
      setCart(c)
    } catch (err) {
      console.error('Failed to initialize cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to load cart')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, userId, sessionId])

  useEffect(() => {
    initCart()
  }, [initCart])

  const refresh = useCallback(async () => {
    if (cart?.id) {
      const updated = await getCart(cart.id)
      if (updated) setCart(updated)
    } else {
      await initCart()
    }
  }, [cart?.id, initCart])

  const addItem = useCallback(async (productId: string, variantId: string | null, quantity: number) => {
    if (!cart) return
    setIsLoading(true)
    setError(null)
    try {
      await addCartItem(cart.id, productId, variantId, quantity)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [cart, refresh])

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true)
    setError(null)
    try {
      await updateCartItemQuantity(itemId, quantity)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
    } finally {
      setIsLoading(false)
    }
  }, [refresh])

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await removeCartItem(itemId)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    } finally {
      setIsLoading(false)
    }
  }, [refresh])

  const clear = useCallback(async () => {
    if (!cart) return
    setIsLoading(true)
    setError(null)
    try {
      await clearCart(cart.id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart')
    } finally {
      setIsLoading(false)
    }
  }, [cart, refresh])

  const applyDiscount = useCallback(async (code: string) => {
    if (!cart) return { success: false, message: 'No cart' }
    setIsLoading(true)
    setError(null)
    try {
      const subtotal = calculateSubtotal(cart.items)
      const result = await applyDiscountToCart(cart.id, code, subtotal)
      await refresh()
      return result.success 
        ? { success: true, message: `Discount applied: -$${result.discountAmount.toFixed(2)}` }
        : { success: false, message: result.error || 'Invalid code' }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to apply discount' }
    } finally {
      setIsLoading(false)
    }
  }, [cart, refresh])

  const removeDiscountAction = useCallback(async () => {
    if (!cart) return
    setIsLoading(true)
    try {
      await removeDiscountFromCart(cart.id)
      await refresh()
    } finally {
      setIsLoading(false)
    }
  }, [cart, refresh])

  const totals = cart ? calculateTotals(cart, taxRate) : null

  return (
    <CartContext.Provider value={{
      cart,
      isLoading,
      error,
      totals,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      applyDiscount,
      removeDiscount: removeDiscountAction,
      refresh
    }}>
      {children}
    </CartContext.Provider>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
}

function calculateTotals(cart: Cart, taxRate: number): CartTotals {
  const subtotal = calculateSubtotal(cart.items)
  const discount = cart.discount_amount || 0
  const taxableAmount = Math.max(0, subtotal - discount)
  const tax = (taxableAmount * taxRate) / 100
  const shipping = 0 // Calculated at checkout
  const total = taxableAmount + tax

  return {
    subtotal,
    discount,
    tax,
    shipping,
    total,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }
}

// ============================================================================
// STOREFRONT WIDGET
// ============================================================================

interface StorefrontWidgetProps {
  siteId: string
  sessionId?: string
  userId?: string
  config?: StorefrontConfig
  onCheckout?: (cart: Cart) => void
}

interface StorefrontConfig {
  showCart?: boolean
  showCategories?: boolean
  productsPerPage?: number
  theme?: 'light' | 'dark'
  primaryColor?: string
  borderRadius?: number
  showSearch?: boolean
  showFilters?: boolean
  layout?: 'grid' | 'list'
  columns?: 2 | 3 | 4
}

const defaultConfig: Required<StorefrontConfig> = {
  showCart: true,
  showCategories: true,
  productsPerPage: 12,
  theme: 'light',
  primaryColor: '#2563eb',
  borderRadius: 8,
  showSearch: true,
  showFilters: true,
  layout: 'grid',
  columns: 3
}

export function StorefrontWidget({ 
  siteId, 
  sessionId, 
  userId,
  config = {},
  onCheckout
}: StorefrontWidgetProps) {
  const mergedConfig = { ...defaultConfig, ...config }
  const {
    showCart,
    showCategories,
    productsPerPage,
    theme,
    primaryColor,
    borderRadius,
    showSearch,
    layout,
    columns
  } = mergedConfig

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<EcommerceSettings | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [productsResult, categoriesResult, settingsResult] = await Promise.all([
          getProducts(siteId, { 
            status: 'active',
            category: selectedCategory || undefined,
            search: searchQuery || undefined
          }, currentPage, productsPerPage),
          getCategories(siteId),
          getEcommerceSettings(siteId)
        ])
        setProducts(productsResult.data)
        setTotalPages(productsResult.totalPages)
        setCategories(categoriesResult.filter(c => c.is_active))
        setSettings(settingsResult)
      } catch (err) {
        console.error('Failed to fetch storefront data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [siteId, selectedCategory, searchQuery, currentPage, productsPerPage])

  const isDark = theme === 'dark'
  const taxRate = settings?.tax_rate || 0

  return (
    <CartProvider siteId={siteId} sessionId={sessionId} userId={userId} taxRate={taxRate}>
      <div 
        className={`storefront-widget ${isDark ? 'sf-dark' : 'sf-light'}`}
        style={{
          '--sf-primary': primaryColor,
          '--sf-radius': `${borderRadius}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        } as React.CSSProperties}
      >
        <style>{storefrontStyles}</style>
        
        {/* Header */}
        <header className="sf-header">
          {showSearch && (
            <div className="sf-search">
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="sf-search-input"
              />
              <SearchIcon />
            </div>
          )}
          {showCart && (
            <CartButton 
              onClick={() => setCartOpen(true)} 
              primaryColor={primaryColor} 
            />
          )}
        </header>

        {/* Categories */}
        {showCategories && categories.length > 0 && (
          <nav className="sf-categories">
            <button
              onClick={() => {
                setSelectedCategory(null)
                setCurrentPage(1)
              }}
              className={`sf-category-btn ${!selectedCategory ? 'sf-active' : ''}`}
              style={!selectedCategory ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setCurrentPage(1)
                }}
                className={`sf-category-btn ${selectedCategory === cat.id ? 'sf-active' : ''}`}
                style={selectedCategory === cat.id ? { backgroundColor: primaryColor, color: 'white' } : {}}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        )}

        {/* Products */}
        {isLoading ? (
          <div className="sf-loading">
            <div className="sf-spinner" style={{ borderTopColor: primaryColor }} />
          </div>
        ) : products.length === 0 ? (
          <div className="sf-empty">
            <PackageIcon />
            <p>No products found</p>
          </div>
        ) : (
          <>
            <div 
              className={`sf-products sf-${layout}`}
              style={{ '--sf-columns': columns } as React.CSSProperties}
            >
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  primaryColor={primaryColor}
                  isDark={isDark}
                  currency={settings?.currency || 'USD'}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="sf-pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="sf-page-btn"
                >
                  Previous
                </button>
                <span className="sf-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="sf-page-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Cart Drawer */}
        {showCart && (
          <CartDrawer 
            isOpen={cartOpen}
            onClose={() => setCartOpen(false)}
            primaryColor={primaryColor}
            isDark={isDark}
            currency={settings?.currency || 'USD'}
            onCheckout={onCheckout}
          />
        )}
      </div>
    </CartProvider>
  )
}

// ============================================================================
// PRODUCT CARD
// ============================================================================

interface ProductCardProps {
  product: Product
  primaryColor: string
  isDark: boolean
  currency: string
}

function ProductCard({ product, primaryColor, isDark, currency }: ProductCardProps) {
  const { addItem, isLoading } = useCart()
  const [adding, setAdding] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      await addItem(product.id, selectedVariant, 1)
    } catch (err) {
      // Error handled in context
    } finally {
      setAdding(false)
    }
  }

  const hasVariants = product.variants && product.variants.length > 0
  const displayPrice = getDisplayPrice(product, selectedVariant, currency)
  const inStock = isInStock(product, selectedVariant)

  return (
    <div className={`sf-product-card ${isDark ? 'sf-dark' : ''}`}>
      {/* Image */}
      <div className="sf-product-image">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="sf-no-image">
            <PackageIcon />
          </div>
        )}
        {product.is_featured && (
          <span 
            className="sf-badge"
            style={{ backgroundColor: primaryColor }}
          >
            Featured
          </span>
        )}
        {product.compare_at_price && product.compare_at_price > product.base_price && (
          <span className="sf-badge sf-sale">
            Sale
          </span>
        )}
      </div>

      {/* Info */}
      <div className="sf-product-info">
        <h3 className="sf-product-name">{product.name}</h3>
        {product.short_description && (
          <p className="sf-product-desc">{product.short_description}</p>
        )}
        <div className="sf-product-price">
          {displayPrice}
        </div>

        {/* Variant selector (simplified) */}
        {hasVariants && product.options && product.options.length > 0 && (
          <div className="sf-variants">
            {product.options.slice(0, 1).map(option => (
              <div key={option.id} className="sf-variant-group">
                <label>{option.name}</label>
                <select
                  onChange={(e) => {
                    // Find variant matching this option
                    const variant = product.variants?.find(v => 
                      v.options[option.name.toLowerCase()] === e.target.value
                    )
                    setSelectedVariant(variant?.id || null)
                  }}
                  className="sf-variant-select"
                >
                  <option value="">Select {option.name}</option>
                  {option.values.map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={adding || isLoading || !inStock}
          className="sf-add-btn"
          style={{ backgroundColor: primaryColor }}
        >
          {adding ? 'Adding...' : !inStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

function getDisplayPrice(product: Product, variantId: string | null, currency: string): React.ReactElement {
  let price = product.base_price
  let comparePrice = product.compare_at_price

  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.id === variantId)
    if (variant) {
      if (variant.price) price = variant.price
      if (variant.compare_at_price) comparePrice = variant.compare_at_price
    }
  }

  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency })
  
  if (comparePrice && comparePrice > price) {
    return (
      <>
        <span className="sf-price-sale">{formatter.format(price)}</span>
        <span className="sf-price-compare">{formatter.format(comparePrice)}</span>
      </>
    )
  }

  return <span>{formatter.format(price)}</span>
}

function isInStock(product: Product, variantId: string | null): boolean {
  if (!product.track_inventory) return true
  
  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.id === variantId)
    if (variant) return variant.quantity > 0
  }
  
  return product.quantity > 0
}

// ============================================================================
// CART COMPONENTS
// ============================================================================

function CartButton({ onClick, primaryColor }: { onClick: () => void; primaryColor: string }) {
  const { totals } = useCart()

  return (
    <button onClick={onClick} className="sf-cart-btn">
      <CartIcon />
      {totals && totals.itemCount > 0 && (
        <span 
          className="sf-cart-badge"
          style={{ backgroundColor: primaryColor }}
        >
          {totals.itemCount}
        </span>
      )}
    </button>
  )
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  primaryColor: string
  isDark: boolean
  currency: string
  onCheckout?: (cart: Cart) => void
}

function CartDrawer({ isOpen, onClose, primaryColor, isDark, currency, onCheckout }: CartDrawerProps) {
  const { cart, totals, updateQuantity, removeItem, applyDiscount, removeDiscount, isLoading, error } = useCart()
  const [discountCode, setDiscountCode] = useState('')
  const [discountMessage, setDiscountMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    const result = await applyDiscount(discountCode)
    setDiscountMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    })
    if (result.success) setDiscountCode('')
  }

  const handleCheckout = () => {
    if (cart && onCheckout) {
      onCheckout(cart)
    }
  }

  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency })

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="sf-backdrop" onClick={onClose} />
      
      {/* Drawer */}
      <div className={`sf-cart-drawer ${isDark ? 'sf-dark' : ''}`}>
        <div className="sf-cart-header">
          <h2>Your Cart</h2>
          <button onClick={onClose} className="sf-close-btn">
            <CloseIcon />
          </button>
        </div>

        {error && (
          <div className="sf-error">{error}</div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div className="sf-cart-empty">
            <CartIcon />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="sf-cart-items">
              {cart.items.map(item => (
                <div key={item.id} className="sf-cart-item">
                  <div className="sf-item-image">
                    {item.product?.images?.[0] || item.variant?.image_url ? (
                      <img 
                        src={item.variant?.image_url || item.product?.images?.[0]} 
                        alt={item.product?.name || 'Product'} 
                      />
                    ) : (
                      <PackageIcon />
                    )}
                  </div>
                  <div className="sf-item-info">
                    <p className="sf-item-name">{item.product?.name || 'Product'}</p>
                    {item.variant?.options && Object.keys(item.variant.options).length > 0 && (
                      <p className="sf-item-variant">
                        {Object.values(item.variant.options).join(' / ')}
                      </p>
                    )}
                    <p className="sf-item-price">{formatter.format(item.unit_price)}</p>
                  </div>
                  <div className="sf-item-quantity">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={isLoading}
                      className="sf-qty-btn"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isLoading}
                      className="sf-qty-btn"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    disabled={isLoading}
                    className="sf-remove-btn"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>

            {/* Discount code */}
            <div className="sf-discount">
              {cart.discount_code ? (
                <div className="sf-discount-applied">
                  <span>Code: {cart.discount_code}</span>
                  <button onClick={removeDiscount} className="sf-discount-remove">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="sf-discount-form">
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="sf-discount-input"
                  />
                  <button 
                    onClick={handleApplyDiscount}
                    disabled={isLoading || !discountCode.trim()}
                    className="sf-discount-btn"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Apply
                  </button>
                </div>
              )}
              {discountMessage && (
                <p className={`sf-discount-msg sf-${discountMessage.type}`}>
                  {discountMessage.text}
                </p>
              )}
            </div>

            {/* Totals */}
            {totals && (
              <div className="sf-cart-totals">
                <div className="sf-total-row">
                  <span>Subtotal</span>
                  <span>{formatter.format(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="sf-total-row sf-discount-row">
                    <span>Discount</span>
                    <span>-{formatter.format(totals.discount)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="sf-total-row">
                    <span>Tax</span>
                    <span>{formatter.format(totals.tax)}</span>
                  </div>
                )}
                <div className="sf-total-row sf-total-final">
                  <span>Total</span>
                  <span>{formatter.format(totals.total)}</span>
                </div>
              </div>
            )}

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="sf-checkout-btn"
              style={{ backgroundColor: primaryColor }}
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </div>
    </>
  )
}

// ============================================================================
// ICONS
// ============================================================================

function SearchIcon() {
  return (
    <svg className="sf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className="sf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg className="sf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="sf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="sf-icon sf-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

// ============================================================================
// STYLES
// ============================================================================

const storefrontStyles = `
.storefront-widget {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.sf-light {
  background: #ffffff;
  color: #1f2937;
}

.sf-dark {
  background: #1f2937;
  color: #f9fafb;
}

/* Header */
.sf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.sf-search {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.sf-search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: var(--sf-radius);
  background: inherit;
  color: inherit;
  font-size: 0.875rem;
}

.sf-search .sf-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  opacity: 0.5;
}

/* Categories */
.sf-categories {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  scrollbar-width: thin;
}

.sf-category-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 9999px;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.sf-category-btn:hover {
  border-color: var(--sf-primary);
}

/* Products Grid */
.sf-products {
  display: grid;
  gap: 1.5rem;
}

.sf-products.sf-grid {
  grid-template-columns: repeat(var(--sf-columns, 3), 1fr);
}

@media (max-width: 768px) {
  .sf-products.sf-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .sf-products.sf-grid {
    grid-template-columns: 1fr;
  }
}

/* Product Card */
.sf-product-card {
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: var(--sf-radius);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.sf-product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sf-product-image {
  position: relative;
  aspect-ratio: 1;
  background: rgba(128, 128, 128, 0.1);
}

.sf-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.3;
}

.sf-no-image .sf-icon {
  width: 3rem;
  height: 3rem;
}

.sf-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  border-radius: 4px;
}

.sf-badge.sf-sale {
  background: #ef4444;
  left: auto;
  right: 0.5rem;
}

.sf-product-info {
  padding: 1rem;
}

.sf-product-name {
  font-weight: 600;
  margin: 0 0 0.25rem;
  font-size: 1rem;
  line-height: 1.3;
}

.sf-product-desc {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0 0 0.5rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sf-product-price {
  font-weight: 700;
  font-size: 1.125rem;
  margin-bottom: 0.75rem;
}

.sf-price-sale {
  color: #ef4444;
}

.sf-price-compare {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  text-decoration: line-through;
  opacity: 0.5;
}

.sf-variants {
  margin-bottom: 0.75rem;
}

.sf-variant-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  opacity: 0.7;
}

.sf-variant-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  background: inherit;
  color: inherit;
  font-size: 0.875rem;
}

.sf-add-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: var(--sf-radius);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.sf-add-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.sf-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pagination */
.sf-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}

.sf-page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: var(--sf-radius);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.sf-page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-page-info {
  font-size: 0.875rem;
  opacity: 0.7;
}

/* Loading */
.sf-loading {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.sf-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(128, 128, 128, 0.2);
  border-top-color: var(--sf-primary);
  border-radius: 50%;
  animation: sf-spin 0.8s linear infinite;
}

@keyframes sf-spin {
  to { transform: rotate(360deg); }
}

.sf-empty {
  text-align: center;
  padding: 4rem 2rem;
  opacity: 0.5;
}

.sf-empty .sf-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

/* Cart Button */
.sf-cart-btn {
  position: relative;
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
}

.sf-cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  border-radius: 9999px;
}

/* Cart Drawer */
.sf-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.sf-cart-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  z-index: 999;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

.sf-cart-drawer.sf-dark {
  background: #1f2937;
}

.sf-cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.sf-cart-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.sf-close-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
}

.sf-close-btn:hover {
  opacity: 1;
}

.sf-error {
  margin: 0.5rem 1rem;
  padding: 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: var(--sf-radius);
  font-size: 0.875rem;
}

.sf-cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.sf-cart-empty .sf-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.sf-cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.sf-cart-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}

.sf-item-image {
  width: 4rem;
  height: 4rem;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(128, 128, 128, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sf-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-item-image .sf-icon {
  width: 1.5rem;
  height: 1.5rem;
  opacity: 0.3;
}

.sf-item-info {
  flex: 1;
  min-width: 0;
}

.sf-item-name {
  font-weight: 500;
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
}

.sf-item-variant {
  font-size: 0.75rem;
  opacity: 0.6;
  margin: 0 0 0.25rem;
}

.sf-item-price {
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
}

.sf-item-quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sf-qty-btn {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: inherit;
}

.sf-qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-remove-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #ef4444;
  opacity: 0.7;
}

.sf-remove-btn:hover {
  opacity: 1;
}

/* Discount */
.sf-discount {
  padding: 0 1rem 1rem;
}

.sf-discount-form {
  display: flex;
  gap: 0.5rem;
}

.sf-discount-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: var(--sf-radius);
  background: inherit;
  color: inherit;
  font-size: 0.875rem;
}

.sf-discount-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--sf-radius);
  color: white;
  font-weight: 500;
  cursor: pointer;
}

.sf-discount-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-discount-applied {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: var(--sf-radius);
  font-size: 0.875rem;
}

.sf-discount-remove {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.75rem;
}

.sf-discount-msg {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
}

.sf-discount-msg.sf-success { color: #22c55e; }
.sf-discount-msg.sf-error { color: #ef4444; }

/* Totals */
.sf-cart-totals {
  padding: 1rem;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}

.sf-total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.sf-discount-row {
  color: #22c55e;
}

.sf-total-final {
  font-size: 1.125rem;
  font-weight: 700;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}

/* Checkout button */
.sf-checkout-btn {
  margin: 0 1rem 1rem;
  padding: 1rem;
  border: none;
  border-radius: var(--sf-radius);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.sf-checkout-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.sf-checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Icons */
.sf-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.sf-icon-sm {
  width: 1rem;
  height: 1rem;
}
`
