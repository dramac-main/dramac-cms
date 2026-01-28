/**
 * Deny Action API Route
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * POST /api/sites/[siteId]/ai-agents/approvals/[approvalId]/deny
 */

import { NextRequest, NextResponse } from 'next/server'
import { denyAction } from '@/lib/ai-agents/security/approvals'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; approvalId: string }> }
) {
  try {
    const { approvalId } = await params
    const body = await request.json()

    if (!body.reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    await denyAction(approvalId, body.userId || 'system', body.reason)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error denying action:', error)
    return NextResponse.json(
      { error: 'Failed to deny action' },
      { status: 500 }
    )
  }
}
