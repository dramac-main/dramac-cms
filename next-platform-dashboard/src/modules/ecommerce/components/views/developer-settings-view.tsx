/**
 * Developer Settings View Component
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * Main tabbed view for API keys, webhooks, and integrations.
 */
'use client'

import { useState } from 'react'
import { Key, Webhook, Plug, Code2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiKeysView } from './api-keys-view'
import { WebhooksView } from './webhooks-view'
import { IntegrationsView } from './integrations-view'

interface DeveloperSettingsViewProps {
  siteId: string
  agencyId: string
  defaultTab?: 'api-keys' | 'webhooks' | 'integrations'
}

export function DeveloperSettingsView({ 
  siteId, 
  defaultTab = 'api-keys' 
}: DeveloperSettingsViewProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Code2 className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Developer Settings</h1>
          <p className="text-muted-foreground">
            Manage API keys, webhooks, and third-party integrations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysView siteId={siteId} />
        </TabsContent>
        
        <TabsContent value="webhooks" className="mt-6">
          <WebhooksView siteId={siteId} />
        </TabsContent>
        
        <TabsContent value="integrations" className="mt-6">
          <IntegrationsView siteId={siteId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
