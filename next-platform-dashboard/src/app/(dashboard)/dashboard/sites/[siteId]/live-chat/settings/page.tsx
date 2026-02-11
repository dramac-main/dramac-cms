/**
 * Settings Page (Placeholder for LC-04)
 *
 * PHASE LC-03: Placeholder page — full widget settings in LC-04
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your live chat widget and integrations
          </p>
        </div>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Widget & Integration Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Full settings including widget customization, business hours,
              WhatsApp configuration, and integration settings will be available
              after the embeddable widget module is implemented (Phase LC-04).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
