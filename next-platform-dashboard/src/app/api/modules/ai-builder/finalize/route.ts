// AI Module Builder - Finalize Module API
// Phase EM-23: AI-powered module generation
// Note: AI builder tables need to be added to database types after migration

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIModuleBuilderService } from '@/lib/modules/ai-builder/ai-service';

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
    const { sessionId, specId } = body;

    if (!sessionId || !specId) {
      return NextResponse.json(
        { error: 'Session ID and Spec ID are required' }, 
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

    if (session.status === 'complete') {
      return NextResponse.json(
        { error: 'Module has already been created from this session' }, 
        { status: 400 }
      );
    }

    if (session.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Session has been cancelled' }, 
        { status: 400 }
      );
    }

    // Verify spec exists and belongs to session
    const { data: spec } = await supabase
      .from('ai_module_specs')
      .select('id, session_id')
      .eq('id', specId)
      .single();

    if (!spec) {
      return NextResponse.json(
        { error: 'Specification not found' }, 
        { status: 404 }
      );
    }

    if (spec.session_id !== sessionId) {
      return NextResponse.json(
        { error: 'Specification does not belong to this session' }, 
        { status: 400 }
      );
    }

    // Check if code has been generated
    const { data: codeFiles } = await supabase
      .from('ai_module_generated_code')
      .select('id')
      .eq('spec_id', specId)
      .limit(1);

    if (!codeFiles || codeFiles.length === 0) {
      return NextResponse.json(
        { error: 'No code has been generated yet. Please generate code first.' }, 
        { status: 400 }
      );
    }

    const service = new AIModuleBuilderService(sessionId);
    const moduleId = await service.finalizeModule(specId, user.id);

    return NextResponse.json({ 
      moduleId,
      message: 'Module created successfully'
    });
  } catch (error) {
    console.error('Error finalizing module:', error);
    return NextResponse.json(
      { error: 'Failed to finalize module' }, 
      { status: 500 }
    );
  }
}
