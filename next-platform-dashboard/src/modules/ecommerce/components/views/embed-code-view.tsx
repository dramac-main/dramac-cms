/**
 * Embed Code Generator View
 * 
 * Phase ECOM-03B: Embed Code Generator
 * 
 * Generate embeddable widget codes for products, collections, and checkout
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Code2, ShoppingBag, LayoutGrid, ShoppingCart, CreditCard, Eye, Package } from 'lucide-react'
import { toast } from 'sonner'

interface EmbedCodeGeneratorProps {
  siteId: string
  agencyId: string
  siteDomain?: string
}

type EmbedType = 'product-card' | 'product-grid' | 'cart-button' | 'buy-button' | 'checkout' | 'collection'

interface EmbedConfig {
  type: EmbedType
  // Product options
  productId?: string
  productSlug?: string
  // Grid options
  columns?: number
  limit?: number
  source?: 'featured' | 'new' | 'sale' | 'category' | 'all'
  categoryId?: string
  // Style options
  theme?: 'light' | 'dark' | 'auto'
  showPrice?: boolean
  showRating?: boolean
  showAddToCart?: boolean
  buttonText?: string
  buttonColor?: string
  // Layout
  cardStyle?: 'card' | 'minimal'
}

const DEFAULT_CONFIG: EmbedConfig = {
  type: 'product-grid',
  columns: 4,
  limit: 8,
  source: 'featured',
  theme: 'auto',
  showPrice: true,
  showRating: true,
  showAddToCart: true,
  buttonText: 'Add to Cart',
  buttonColor: '#000000',
  cardStyle: 'card',
}

const EMBED_TYPES: Array<{ value: EmbedType; label: string; icon: typeof ShoppingBag; description: string }> = [
  { value: 'product-grid', label: 'Product Grid', icon: LayoutGrid, description: 'Display multiple products in a grid layout' },
  { value: 'product-card', label: 'Single Product', icon: Package, description: 'Showcase a single product' },
  { value: 'buy-button', label: 'Buy Button', icon: ShoppingCart, description: 'Add a buy now button for a product' },
  { value: 'cart-button', label: 'Cart Widget', icon: ShoppingBag, description: 'Show cart count and access' },
  { value: 'collection', label: 'Collection', icon: LayoutGrid, description: 'Display products from a category' },
  { value: 'checkout', label: 'Checkout', icon: CreditCard, description: 'Embedded checkout form' },
]

function CodeBlock({ code, language = 'html' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}

export function EmbedCodeGenerator({ siteId, agencyId: _agencyId, siteDomain }: EmbedCodeGeneratorProps) {
  const [config, setConfig] = useState<EmbedConfig>(DEFAULT_CONFIG)
  const [_activeTab, setActiveTab] = useState<string>('product-grid')

  const baseUrl = siteDomain || `${process.env.NEXT_PUBLIC_APP_URL || 'https://dramacagency.com'}`
  const embedUrl = `${baseUrl}/api/embed/${siteId}`

  const updateConfig = <K extends keyof EmbedConfig>(key: K, value: EmbedConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  // Generate the embed code based on configuration
  const generatedCode = useMemo(() => {
    const params = new URLSearchParams()
    
    // Add configuration as URL params
    if (config.theme && config.theme !== 'auto') params.set('theme', config.theme)
    if (config.columns) params.set('columns', String(config.columns))
    if (config.limit) params.set('limit', String(config.limit))
    if (config.source && config.source !== 'featured') params.set('source', config.source)
    if (config.categoryId) params.set('category', config.categoryId)
    if (config.productId) params.set('productId', config.productId)
    if (config.showPrice === false) params.set('showPrice', 'false')
    if (config.showAddToCart === false) params.set('showAddToCart', 'false')
    if (config.buttonText && config.buttonText !== 'Add to Cart') params.set('buttonText', config.buttonText)
    if (config.buttonColor && config.buttonColor !== '#000000') params.set('buttonColor', config.buttonColor)
    if (config.cardStyle && config.cardStyle !== 'card') params.set('style', config.cardStyle)

    const queryString = params.toString()
    // fullUrl is computed but may be used by specific widget types
    const _fullUrl = queryString ? `${embedUrl}/${config.type}?${queryString}` : `${embedUrl}/${config.type}`

    switch (config.type) {
      case 'product-grid':
        return `<!-- DRAMAC E-Commerce Product Grid -->
<div id="dramac-products-${siteId.substring(0, 8)}"></div>
<script src="${baseUrl}/embed/dramac-ecommerce.js" defer></script>
<script>
  window.DRAMAC_CONFIG = {
    siteId: '${siteId}',
    type: 'product-grid',
    container: '#dramac-products-${siteId.substring(0, 8)}',
    columns: ${config.columns || 4},
    limit: ${config.limit || 8},
    source: '${config.source || 'featured'}',
    ${config.categoryId ? `categoryId: '${config.categoryId}',` : ''}
    theme: '${config.theme || 'auto'}',
    showPrice: ${config.showPrice !== false},
    showAddToCart: ${config.showAddToCart !== false},
    cardStyle: '${config.cardStyle || 'card'}'
  };
</script>`

      case 'product-card':
        return `<!-- DRAMAC E-Commerce Product Card -->
<div id="dramac-product-${config.productId?.substring(0, 8) || 'xxx'}"></div>
<script src="${baseUrl}/embed/dramac-ecommerce.js" defer></script>
<script>
  window.DRAMAC_CONFIG = {
    siteId: '${siteId}',
    type: 'product-card',
    container: '#dramac-product-${config.productId?.substring(0, 8) || 'xxx'}',
    productId: '${config.productId || 'YOUR_PRODUCT_ID'}',
    theme: '${config.theme || 'auto'}',
    showPrice: ${config.showPrice !== false},
    showAddToCart: ${config.showAddToCart !== false}
  };
</script>`

      case 'buy-button':
        return `<!-- DRAMAC Buy Now Button -->
<button
  class="dramac-buy-button"
  data-site-id="${siteId}"
  data-product-id="${config.productId || 'YOUR_PRODUCT_ID'}"
  data-theme="${config.theme || 'auto'}"
  style="background-color: ${config.buttonColor || '#000'}; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;"
>
  ${config.buttonText || 'Buy Now'}
</button>
<script src="${baseUrl}/embed/dramac-ecommerce.js" defer></script>`

      case 'cart-button':
        return `<!-- DRAMAC Cart Widget -->
<div id="dramac-cart-${siteId.substring(0, 8)}"></div>
<script src="${baseUrl}/embed/dramac-ecommerce.js" defer></script>
<script>
  window.DRAMAC_CONFIG = {
    siteId: '${siteId}',
    type: 'cart-widget',
    container: '#dramac-cart-${siteId.substring(0, 8)}',
    theme: '${config.theme || 'auto'}'
  };
</script>`

      case 'collection':
        return `<!-- DRAMAC Collection -->
<div id="dramac-collection-${siteId.substring(0, 8)}"></div>
<script src="${baseUrl}/embed/dramac-ecommerce.js" defer></script>
<script>
  window.DRAMAC_CONFIG = {
    siteId: '${siteId}',
    type: 'collection',
    container: '#dramac-collection-${siteId.substring(0, 8)}',
    categoryId: '${config.categoryId || 'YOUR_CATEGORY_ID'}',
    columns: ${config.columns || 4},
    limit: ${config.limit || 8},
    theme: '${config.theme || 'auto'}',
    showPrice: ${config.showPrice !== false}
  };
</script>`

      case 'checkout':
        return `<!-- DRAMAC Checkout Embed -->
<div id="dramac-checkout-${siteId.substring(0, 8)}"></div>
<script src="${baseUrl}/embed/dramac-ecommerce.js" defer></script>
<script>
  window.DRAMAC_CONFIG = {
    siteId: '${siteId}',
    type: 'checkout',
    container: '#dramac-checkout-${siteId.substring(0, 8)}',
    theme: '${config.theme || 'auto'}',
    // Optional: Pre-fill customer data
    // customer: { email: 'customer@example.com', name: 'John Doe' }
  };
</script>`

      default:
        return '<!-- Select an embed type to generate code -->'
    }
  }, [config, siteId, embedUrl, baseUrl])

  // iframe embed alternative
  const iframeCode = useMemo(() => {
    const params = new URLSearchParams()
    params.set('siteId', siteId)
    if (config.theme) params.set('theme', config.theme)
    if (config.columns) params.set('columns', String(config.columns))
    if (config.limit) params.set('limit', String(config.limit))
    if (config.source) params.set('source', config.source)
    if (config.categoryId) params.set('category', config.categoryId)
    if (config.productId) params.set('productId', config.productId)

    return `<iframe 
  src="${embedUrl}/${config.type}?${params.toString()}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none; max-width: 100%;"
  title="DRAMAC E-Commerce Widget"
></iframe>`
  }, [config, siteId, embedUrl])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Embed Code Generator</h2>
        <p className="text-muted-foreground">
          Generate embeddable widgets for your products, collections, and checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget Type Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Widget Type</CardTitle>
            <CardDescription>Select the type of widget to embed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {EMBED_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => {
                  setActiveTab(type.value)
                  updateConfig('type', type.value)
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  config.type === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted'
                }`}
              >
                <div className={`p-2 rounded ${config.type === type.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <type.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{type.description}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription>Customize your widget appearance and behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Common Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={config.theme || 'auto'}
                  onValueChange={(v) => updateConfig('theme', v as EmbedConfig['theme'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grid-specific options */}
              {(config.type === 'product-grid' || config.type === 'collection') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Columns ({config.columns})</Label>
                      <Slider
                        value={[config.columns || 4]}
                        min={1}
                        max={6}
                        step={1}
                        onValueChange={([v]) => updateConfig('columns', v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Product Limit ({config.limit})</Label>
                      <Slider
                        value={[config.limit || 8]}
                        min={1}
                        max={24}
                        step={1}
                        onValueChange={([v]) => updateConfig('limit', v)}
                      />
                    </div>
                  </div>

                  {config.type === 'product-grid' && (
                    <div className="space-y-2">
                      <Label>Product Source</Label>
                      <Select
                        value={config.source || 'featured'}
                        onValueChange={(v) => updateConfig('source', v as EmbedConfig['source'])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="featured">Featured Products</SelectItem>
                          <SelectItem value="new">New Arrivals</SelectItem>
                          <SelectItem value="sale">On Sale</SelectItem>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="category">From Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(config.source === 'category' || config.type === 'collection') && (
                    <div className="space-y-2">
                      <Label>Category ID</Label>
                      <Input
                        placeholder="Enter category ID..."
                        value={config.categoryId || ''}
                        onChange={(e) => updateConfig('categoryId', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Card Style</Label>
                    <Select
                      value={config.cardStyle || 'card'}
                      onValueChange={(v) => updateConfig('cardStyle', v as 'card' | 'minimal')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Card (with border)</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Product-specific options */}
              {(config.type === 'product-card' || config.type === 'buy-button') && (
                <div className="space-y-2">
                  <Label>Product ID</Label>
                  <Input
                    placeholder="Enter product ID..."
                    value={config.productId || ''}
                    onChange={(e) => updateConfig('productId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find the product ID in your product list
                  </p>
                </div>
              )}

              {/* Button options */}
              {config.type === 'buy-button' && (
                <>
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      placeholder="Buy Now"
                      value={config.buttonText || ''}
                      onChange={(e) => updateConfig('buttonText', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Button Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.buttonColor || '#000000'}
                        onChange={(e) => updateConfig('buttonColor', e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config.buttonColor || '#000000'}
                        onChange={(e) => updateConfig('buttonColor', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Display toggles */}
              {(config.type === 'product-grid' || config.type === 'product-card' || config.type === 'collection') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Show Price</Label>
                    <Switch
                      checked={config.showPrice !== false}
                      onCheckedChange={(c) => updateConfig('showPrice', c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Add to Cart Button</Label>
                    <Switch
                      checked={config.showAddToCart !== false}
                      onCheckedChange={(c) => updateConfig('showAddToCart', c)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Code */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Generated Code</CardTitle>
              <CardDescription>Copy and paste this code into your website</CardDescription>
            </div>
            <Badge variant="outline">
              <Code2 className="h-3 w-3 mr-1" />
              {config.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="script" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="script">JavaScript Embed</TabsTrigger>
              <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
            </TabsList>
            <TabsContent value="script">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This method provides the best performance and styling flexibility.
                </p>
                <CodeBlock code={generatedCode} />
              </div>
            </TabsContent>
            <TabsContent value="iframe">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use iframe if you can&apos;t add JavaScript to your site.
                </p>
                <CodeBlock code={iframeCode} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </CardTitle>
          <CardDescription>
            This is a preview of how your widget will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 bg-muted/30 min-h-50 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Widget preview will appear here when the embed script is loaded.
              <br />
              <span className="text-xs">Copy the code above and test it on your website.</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
