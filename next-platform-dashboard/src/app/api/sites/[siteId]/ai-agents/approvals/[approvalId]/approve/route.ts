/**
 * Approve Action API Route
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * POST /api/sites/[siteId]/ai-agents/approvals/[approvalId]/approve
 */

import { NextRequest, NextResponse } from 'next/server'
import { approveAction } from '@/lib/ai-agents/security/approvals'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; approvalId: string }> }
) {
  try {
    const { approvalId } = await params
    const body = await request.json().catch(() => ({}))

    await approveAction(approvalId, body.userId || 'system', body.notes)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error approving action:', error)
    return NextResponse.json(
      { error: 'Failed to approve action' },
      { status: 500 }
    )
  }
}
