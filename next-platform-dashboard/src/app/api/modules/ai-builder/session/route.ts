// AI Module Builder - Session Creation API
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Session name is required' }, 
        { status: 400 }
      );
    }

    // Get user's agency
    const { data: membership } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No agency found for user' }, 
        { status: 400 }
      );
    }

    const sessionId = await AIModuleBuilderService.createSession(
      membership.agency_id,
      user.id,
      name,
      description
    );

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('Error creating AI builder session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient() as AnySupabaseClient;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get user's sessions
    const { data: sessions, error } = await supabase
      .from('ai_module_sessions')
      .select(`
        id,
        name,
        description,
        status,
        module_id,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching AI builder sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' }, 
      { status: 500 }
    );
  }
}
