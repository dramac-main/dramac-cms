/**
 * Analytics Page (Placeholder for LC-07)
 *
 * PHASE LC-03: Placeholder page — full analytics in LC-07
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Chat performance analytics and reporting
          </p>
        </div>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed analytics including conversation volume trends, response
              time charts, agent performance comparisons, satisfaction scores,
              and exportable reports will be available after the analytics module
              is implemented (Phase LC-07).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
