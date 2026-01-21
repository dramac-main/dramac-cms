// AI Module Builder - Chat API
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
    const { sessionId, message } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' }, 
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' }, 
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

    if (session.status === 'complete' || session.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Session is no longer active' }, 
        { status: 400 }
      );
    }

    const service = new AIModuleBuilderService(sessionId);
    const response = await service.chat(message.trim());

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to process message' }, 
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' }, 
        { status: 400 }
      );
    }

    // Verify user owns this session
    const { data: session } = await supabase
      .from('ai_module_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' }, 
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('ai_module_messages')
      .select('id, role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' }, 
      { status: 500 }
    );
  }
}
