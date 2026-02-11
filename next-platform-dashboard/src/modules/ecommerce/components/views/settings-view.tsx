/**
 * Settings View Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Main settings container with tabbed navigation
 */
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { 
  Store, 
  Coins, 
  Receipt, 
  Truck, 
  CreditCard, 
  ShoppingCart, 
  Bell, 
  Package, 
  FileText,
  FileCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GeneralSettingsForm } from '../settings/general-settings'
import { CurrencySettingsForm } from '../settings/currency-settings'
import { InventorySettingsForm } from '../settings/inventory-settings'
import { QuoteSettingsForm } from '../settings/quote-settings'
import { TaxSettingsForm } from '../settings/tax-settings'
import { ShippingSettingsForm } from '../settings/shipping-settings'
import { PaymentSettingsForm } from '../settings/payment-settings'
import { CheckoutSettingsForm } from '../settings/checkout-settings'
import { NotificationSettingsForm } from '../settings/notification-settings'
import { LegalSettingsForm } from '../settings/legal-settings'
import type { SettingsTab } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface SettingsViewProps {
  siteId: string
  agencyId: string
}

interface TabConfig {
  id: SettingsTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

const tabs: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    icon: Store,
    description: 'Store name, address, and regional settings'
  },
  {
    id: 'currency',
    label: 'Currency',
    icon: Coins,
    description: 'Currency format and multi-currency options'
  },
  {
    id: 'tax',
    label: 'Tax',
    icon: Receipt,
    description: 'Tax zones, rates, and calculations'
  },
  {
    id: 'shipping',
    label: 'Shipping',
    icon: Truck,
    description: 'Shipping zones and delivery methods'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    description: 'Payment gateways and options'
  },
  {
    id: 'checkout',
    label: 'Checkout',
    icon: ShoppingCart,
    description: 'Checkout flow and fields'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Email templates and alerts'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    description: 'Stock management policies'
  },
  {
    id: 'quotes',
    label: 'Quotes',
    icon: FileCheck,
    description: 'Quote numbering, defaults, and branding'
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: FileText,
    description: 'Terms, privacy, and policies'
  }
]

// ============================================================================
// PLACEHOLDER COMPONENT
// ============================================================================

function SettingsPlaceholder({ tab }: { tab: TabConfig }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <tab.icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{tab.label} Settings</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        {tab.description}. This section will be implemented in a future update.
      </p>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SettingsView({ siteId, agencyId }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // Render tab content
  const renderTabContent = (tabId: SettingsTab) => {
    switch (tabId) {
      case 'general':
        return <GeneralSettingsForm siteId={siteId} agencyId={agencyId} />
      case 'currency':
        return <CurrencySettingsForm siteId={siteId} agencyId={agencyId} />
      case 'inventory':
        return <InventorySettingsForm siteId={siteId} agencyId={agencyId} />
      case 'quotes':
        return <QuoteSettingsForm siteId={siteId} agencyId={agencyId} />
      case 'tax':
        return <TaxSettingsForm siteId={siteId} agencyId={agencyId} />
      case 'shipping':
        return <ShippingSettingsForm siteId={siteId} agencyId={agencyId} />
      case 'payments':
        return <PaymentSettingsForm siteId={siteId} agencyId={agencyId} />
      case 'checkout':
        return <CheckoutSettingsForm siteId={siteId} agencyId={agencyId} />
      case 'notifications':
        return <NotificationSettingsForm siteId={siteId} agencyId={agencyId} />
      case 'legal':
        return <LegalSettingsForm siteId={siteId} agencyId={agencyId} />
      default:
        const tab = tabs.find(t => t.id === tabId)!
        return <SettingsPlaceholder tab={tab} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your e-commerce store settings
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        {/* Tab List - Horizontal scroll on mobile */}
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 whitespace-nowrap',
                  'data-[state=active]:bg-background data-[state=active]:shadow-sm'
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab Content */}
        {tabs.map((tab) => (
          <TabsContent 
            key={tab.id} 
            value={tab.id}
            className="mt-0"
          >
            {renderTabContent(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
