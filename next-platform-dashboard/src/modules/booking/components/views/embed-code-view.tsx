/**
 * Embed Code View Component
 * 
 * Generate embeddable booking widget code for external sites
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
import { useBooking } from '../../context/booking-context'
import { 
  Code, 
  Copy, 
  Check,
  ExternalLink,
  Calendar,
  Layout,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

// =============================================================================
// TYPES
// =============================================================================

interface EmbedCodeViewProps {
  className?: string
}

type WidgetType = 'full' | 'calendar-only' | 'button-popup'
type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface EmbedConfig {
  widgetType: WidgetType
  primaryColor: string
  borderRadius: number
  showHeader: boolean
  showServiceSelector: boolean
  showStaffSelector: boolean
  buttonText: string
  width: string
  height: string
  autoResize: boolean
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: EmbedConfig = {
  widgetType: 'full',
  primaryColor: '',
  borderRadius: 8,
  showHeader: true,
  showServiceSelector: true,
  showStaffSelector: true,
  buttonText: 'Book Now',
  width: '100%',
  height: '700',
  autoResize: true,
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EmbedCodeView({ className }: EmbedCodeViewProps) {
  const { siteId, settings } = useBooking()
  
  const [config, setConfig] = useState<EmbedConfig>(DEFAULT_CONFIG)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop')
  const [activeTab, setActiveTab] = useState('generate')
  
  // Get the base URL from environment or fallback
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://your-domain.com'
  
  // Generate embed URL
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      type: config.widgetType,
      color: config.primaryColor.replace('#', ''),
      radius: config.borderRadius.toString(),
    })
    
    if (!config.showHeader) params.append('hideHeader', '1')
    if (!config.showServiceSelector) params.append('hideServices', '1')
    if (!config.showStaffSelector) params.append('hideStaff', '1')
    if (config.widgetType === 'button-popup') {
      params.append('buttonText', config.buttonText)
    }
    
    return `${baseUrl}/embed/booking/${siteId}?${params.toString()}`
  }, [siteId, config, baseUrl])
  
  // Generate iframe code
  const iframeCode = useMemo(() => {
    const heightAttr = config.autoResize 
      ? 'style="min-height: 600px; height: auto;"' 
      : `height="${config.height}"`
    
    return `<iframe
  src="${embedUrl}"
  width="${config.width}"
  ${heightAttr}
  frameborder="0"
  allow="payment"
  title="Booking Widget"
></iframe>`
  }, [embedUrl, config])
  
  // Generate script code (for button popup)
  const scriptCode = useMemo(() => {
    return `<!-- DRAMAC Booking Widget -->
<script src="${baseUrl}/embed/booking.js"></script>
<script>
  DramacBooking.init({
    siteId: '${siteId}',
    type: '${config.widgetType}',
    primaryColor: '${config.primaryColor}',
    borderRadius: ${config.borderRadius},
    buttonText: '${config.buttonText}',
    showHeader: ${config.showHeader},
    showServiceSelector: ${config.showServiceSelector},
    showStaffSelector: ${config.showStaffSelector},
  });
</script>
<button data-dramac-booking>Book Now</button>`
  }, [siteId, config, baseUrl])
  
  // Generate WordPress shortcode
  const shortcodeCode = useMemo(() => {
    return `[dramac_booking site="${siteId}" type="${config.widgetType}" color="${config.primaryColor}"]`
  }, [siteId, config])
  
  // Handle config change
  const handleConfigChange = (field: keyof EmbedConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }
  
  // Copy to clipboard
  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedType(type)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedType(null), 2000)
  }
  
  // Preview dimensions
  const previewDimensions = {
    desktop: { width: '100%', maxWidth: '800px' },
    tablet: { width: '768px', maxWidth: '768px' },
    mobile: { width: '375px', maxWidth: '375px' },
  }

  return (
    <div className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6" />
            Embed Booking Widget
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add the booking widget to your website
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="generate" className="gap-2">
              <Code className="h-4 w-4" />
              Generate Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Configuration */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layout className="h-4 w-4" />
                      Widget Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'full', label: 'Full Widget', icon: Layout },
                        { value: 'calendar-only', label: 'Calendar Only', icon: Calendar },
                        { value: 'button-popup', label: 'Button Popup', icon: ExternalLink },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => handleConfigChange('widgetType', value as WidgetType)}
                          className={`p-4 border rounded-lg text-center transition-all ${
                            config.widgetType === value
                              ? 'border-primary bg-primary/10'
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">{label}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Label className="w-28">Primary Color</Label>
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        className="w-28 font-mono"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Label className="w-28">Border Radius</Label>
                      <Select
                        value={String(config.borderRadius)}
                        onValueChange={(v) => handleConfigChange('borderRadius', parseInt(v))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Square (0px)</SelectItem>
                          <SelectItem value="4">Slight (4px)</SelectItem>
                          <SelectItem value="8">Medium (8px)</SelectItem>
                          <SelectItem value="12">Large (12px)</SelectItem>
                          <SelectItem value="16">Extra Large (16px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label>Show Header</Label>
                        <Switch
                          checked={config.showHeader}
                          onCheckedChange={(v) => handleConfigChange('showHeader', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Service Selector</Label>
                        <Switch
                          checked={config.showServiceSelector}
                          onCheckedChange={(v) => handleConfigChange('showServiceSelector', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Staff Selector</Label>
                        <Switch
                          checked={config.showStaffSelector}
                          onCheckedChange={(v) => handleConfigChange('showStaffSelector', v)}
                        />
                      </div>
                    </div>
                    
                    {config.widgetType === 'button-popup' && (
                      <div className="pt-2">
                        <Label>Button Text</Label>
                        <Input
                          value={config.buttonText}
                          onChange={(e) => handleConfigChange('buttonText', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {config.widgetType !== 'button-popup' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dimensions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Width</Label>
                          <Input
                            value={config.width}
                            onChange={(e) => handleConfigChange('width', e.target.value)}
                            placeholder="100% or 600px"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height</Label>
                          <Input
                            value={config.height}
                            onChange={(e) => handleConfigChange('height', e.target.value)}
                            placeholder="700"
                            disabled={config.autoResize}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Auto-resize height</Label>
                        <Switch
                          checked={config.autoResize}
                          onCheckedChange={(v) => handleConfigChange('autoResize', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Generated Code */}
              <div className="space-y-6">
                {/* iframe Code */}
                {config.widgetType !== 'button-popup' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">iFrame Embed Code</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(iframeCode, 'iframe')}
                        >
                          {copiedType === 'iframe' ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                      <CardDescription>
                        Add this code to your website&apos;s HTML
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{iframeCode}</code>
                      </pre>
                    </CardContent>
                  </Card>
                )}
                
                {/* Script Code */}
                {config.widgetType === 'button-popup' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">JavaScript Embed</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(scriptCode, 'script')}
                        >
                          {copiedType === 'script' ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                      <CardDescription>
                        Add this before your closing &lt;/body&gt; tag
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{scriptCode}</code>
                      </pre>
                    </CardContent>
                  </Card>
                )}
                
                {/* Direct Link */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Direct Link</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(embedUrl, 'url')}
                      >
                        {copiedType === 'url' ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <CardDescription>
                      Share this link directly with customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input value={embedUrl} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        onClick={() => window.open(embedUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* WordPress Shortcode */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">WordPress Shortcode</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(shortcodeCode, 'shortcode')}
                      >
                        {copiedType === 'shortcode' ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <CardDescription>
                      Use this shortcode in WordPress (requires plugin)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{shortcodeCode}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Widget Preview</CardTitle>
                  <div className="flex gap-2">
                    {[
                      { value: 'desktop', icon: Monitor, label: 'Desktop' },
                      { value: 'tablet', icon: Tablet, label: 'Tablet' },
                      { value: 'mobile', icon: Smartphone, label: 'Mobile' },
                    ].map(({ value, icon: Icon, label }) => (
                      <Button
                        key={value}
                        variant={previewDevice === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice(value as PreviewDevice)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="mx-auto bg-muted/30 border rounded-lg overflow-hidden transition-all duration-300"
                  style={previewDimensions[previewDevice]}
                >
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="700"
                    frameBorder="0"
                    title="Booking Widget Preview"
                    className="bg-background"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default EmbedCodeView
