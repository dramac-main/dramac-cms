'use client'

/**
 * Social Listening Wrapper
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Client wrapper bridging server actions to SocialListening component
 */

import { SocialListening } from './SocialListening'
import {
  addListeningKeyword,
  updateKeywordStatus,
  deleteListeningKeyword,
  updateMentionStatus,
} from '../actions/listening-actions'
import type { ListeningKeyword, BrandMention, KeywordType, MentionStatus } from '../types'

interface SocialListeningWrapperProps {
  siteId: string
  tenantId: string
  userId: string
  keywords: ListeningKeyword[]
  mentions: BrandMention[]
  stats: { positive: number; neutral: number; negative: number; total: number; newCount: number }
}

export function SocialListeningWrapper({
  siteId,
  tenantId,
  userId,
  keywords,
  mentions,
  stats,
}: SocialListeningWrapperProps) {
  return (
    <SocialListening
      siteId={siteId}
      keywords={keywords}
      mentions={mentions}
      stats={stats}
      onAddKeyword={async (keyword: string, type: KeywordType) => {
        return addListeningKeyword(siteId, tenantId, userId, keyword, type)
      }}
      onToggleKeyword={async (keywordId: string, isActive: boolean) => {
        return updateKeywordStatus(keywordId, siteId, isActive)
      }}
      onDeleteKeyword={async (keywordId: string) => {
        return deleteListeningKeyword(keywordId, siteId)
      }}
      onUpdateMentionStatus={async (mentionId: string, status: MentionStatus) => {
        return updateMentionStatus(mentionId, siteId, status)
      }}
    />
  )
}
