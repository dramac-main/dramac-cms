'use client'

/**
 * Competitors Page Wrapper
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Client wrapper bridging server actions to CompetitorsPage component
 */

import { CompetitorsPage } from './CompetitorsPage'
import {
  addCompetitor,
  removeCompetitor,
  syncCompetitorData,
} from '../actions/competitor-actions'
import type { Competitor } from '../types'

interface CompetitorsPageWrapperProps {
  siteId: string
  tenantId: string
  userId: string
  competitors: Competitor[]
  comparison: Array<{
    id: string
    name: string
    platform: string
    platformHandle: string
    avatarUrl: string | null
    followersCount: number
    followingCount: number
    postsCount: number
    avgEngagementRate: number
    postingFrequency: number
  }>
}

export function CompetitorsPageWrapper({
  siteId,
  tenantId,
  userId,
  competitors,
  comparison,
}: CompetitorsPageWrapperProps) {
  return (
    <CompetitorsPage
      siteId={siteId}
      competitors={competitors}
      comparison={comparison}
      onAdd={async (data) => {
        return addCompetitor(siteId, tenantId, userId, data)
      }}
      onRemove={async (competitorId) => {
        return removeCompetitor(competitorId, siteId)
      }}
      onSync={async (competitorId) => {
        return syncCompetitorData(competitorId, siteId)
      }}
    />
  )
}
