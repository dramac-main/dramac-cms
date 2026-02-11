/**
 * Settings Page — Widget Configuration
 *
 * PHASE LC-04: Full widget settings with 8-tab interface
 */

import { getWidgetSettings, getDepartments } from '@/modules/live-chat/actions'
import { SettingsPageWrapper } from '@/modules/live-chat/components/wrappers/SettingsPageWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { siteId } = await params

  const [settingsResult, departmentsResult] = await Promise.all([
    getWidgetSettings(siteId),
    getDepartments(siteId),
  ])

  if (settingsResult.error || !settingsResult.settings) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">
            Failed to load widget settings: {settingsResult.error || 'Settings not found'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <SettingsPageWrapper
      siteId={siteId}
      initialSettings={settingsResult.settings}
      departments={departmentsResult.departments || []}
    />
  )
}
