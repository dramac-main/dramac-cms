'use client'

/**
 * Reports Page Wrapper Component
 * Bridges server actions to ReportsPage client component
 */

import { ReportsPage } from '@/modules/social-media/components/ReportsPage'
import {
  createReport,
  deleteReport,
  duplicateReport,
} from '@/modules/social-media/actions/report-actions'
import type { Report, ReportType } from '@/modules/social-media/types'

interface ReportsPageWrapperProps {
  siteId: string
  tenantId: string
  userId: string
  reports: Report[]
}

export function ReportsPageWrapper({ siteId, tenantId, userId, reports }: ReportsPageWrapperProps) {
  return (
    <ReportsPage
      siteId={siteId}
      reports={reports}
      onCreate={async (data: {
        name: string
        description?: string
        reportType: ReportType
        metrics?: string[]
        dateRangeType?: string
      }) => {
        const result = await createReport(siteId, tenantId, userId, data)
        return { report: result.report, error: result.error }
      }}
      onDelete={async (reportId: string) => {
        const result = await deleteReport(reportId, siteId)
        return { success: !result.error, error: result.error }
      }}
      onDuplicate={async (reportId: string) => {
        const result = await duplicateReport(reportId, siteId)
        return { report: result.report, error: result.error }
      }}
    />
  )
}
