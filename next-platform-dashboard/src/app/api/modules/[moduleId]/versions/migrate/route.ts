/**
 * Phase EM-41: Migrate API Route
 * 
 * POST /api/modules/[moduleId]/versions/migrate
 * Runs a single migration (up or down).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { siteId, migrationId, direction } = body;

    if (!siteId || !migrationId || !direction) {
      return NextResponse.json(
        { error: 'siteId, migrationId, and direction are required' },
        { status: 400 }
      );
    }

    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json(
        { error: 'direction must be "up" or "down"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Get migration
    const { data: migration, error: migrationError } = await db
      .from('module_migrations')
      .select('*')
      .eq('id', migrationId)
      .single();

    if (migrationError || !migration) {
      return NextResponse.json(
        { error: 'Migration not found' },
        { status: 404 }
      );
    }

    const sql = direction === 'up' ? migration.up_sql : migration.down_sql;

    if (!sql) {
      return NextResponse.json(
        { error: `No ${direction} SQL available for this migration` },
        { status: 400 }
      );
    }

    // Create migration run record
    const { data: run, error: createError } = await db
      .from('module_migration_runs')
      .insert({
        site_id: siteId,
        module_id: moduleId,
        migration_id: migrationId,
        direction,
        status: 'running',
        executed_by: userId
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    try {
      // Execute migration SQL
      // Note: In production, this would use a proper migration runner
      const { error: execError } = await db.rpc('exec_raw_sql', {
        sql_query: sql
      });

      if (execError) {
        throw execError;
      }

      // Update run as success
      await db
        .from('module_migration_runs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);

      return NextResponse.json({
        success: true,
        runId: run.id,
        migration: migration.to_version
      });

    } catch (execError) {
      // Update run as failed
      await db
        .from('module_migration_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: execError instanceof Error ? execError.message : String(execError)
        })
        .eq('id', run.id);

      return NextResponse.json(
        { error: execError instanceof Error ? execError.message : 'Migration execution failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Migrate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}
