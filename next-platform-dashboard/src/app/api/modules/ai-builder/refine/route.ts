// AI Module Builder - Refine Specification API
// Phase EM-23: AI-powered module generation
// Note: AI builder tables need to be added to database types after migration

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIModuleBuilderService } from '@/lib/modules/ai-builder/ai-service';
import { REFINEMENT_PROMPTS } from '@/lib/modules/ai-builder/prompts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

export async function POST(request: Request) {
  try {
    const supabase = await createClient() as AnySupabaseClient;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, specId, refinementType, params } = body;

    if (!sessionId || !specId) {
      return NextResponse.json(
        { error: 'Session ID and Spec ID are required' }, 
        { status: 400 }
      );
    }

    if (!refinementType || !Object.keys(REFINEMENT_PROMPTS).includes(refinementType)) {
      return NextResponse.json(
        { error: 'Valid refinement type is required' }, 
        { status: 400 }
      );
    }

    // Verify user owns this session
    const { data: session } = await supabase
      .from('ai_module_sessions')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' }, 
        { status: 404 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this session' }, 
        { status: 403 }
      );
    }

    // Verify spec belongs to session
    const { data: spec } = await supabase
      .from('ai_module_specs')
      .select('id, session_id')
      .eq('id', specId)
      .single();

    if (!spec || spec.session_id !== sessionId) {
      return NextResponse.json(
        { error: 'Specification not found or does not belong to session' }, 
        { status: 404 }
      );
    }

    const service = new AIModuleBuilderService(sessionId);
    const refinedSpec = await service.refineSpec(
      specId, 
      refinementType as keyof typeof REFINEMENT_PROMPTS, 
      params || {}
    );

    // Get new spec ID
    const { data: newSpecRecord } = await supabase
      .from('ai_module_specs')
      .select('id')
      .eq('session_id', sessionId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ 
      spec: refinedSpec, 
      specId: newSpecRecord?.id 
    });
  } catch (error) {
    console.error('Error refining specification:', error);
    return NextResponse.json(
      { error: 'Failed to refine specification' }, 
      { status: 500 }
    );
  }
}
