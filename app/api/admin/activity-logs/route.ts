// app/api/activity/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
    logActivityServer,
    getRequestMetadata,
    ActivityActions,   // optional, for typed actions
} from '@/lib/activity-logger';

// ----------------------------------------------------------------------
// GET – Admin fetch (unchanged, but improved transform)
// ----------------------------------------------------------------------
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Admin check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const action = searchParams.get('action');
        const actionCategory = searchParams.get('action_category');
        const targetTable = searchParams.get('target_table');
        const userId = searchParams.get('user_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const search = searchParams.get('search');

        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (action) query = query.eq('action', action);
        if (actionCategory) query = query.eq('action_category', actionCategory);
        if (targetTable) query = query.eq('target_table', targetTable);
        if (userId) query = query.eq('user_id', userId);
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);
        if (search) {
            query = query.or(`description.ilike.%${search}%,action.ilike.%${search}%`);
        }

        const { data: logs, error, count } = await query;

        if (error) {
            console.error('Error fetching activity logs:', error);
            return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
        }

        // No need to derive action_type/resource_type – they are already in the table.
        // But keep a lightweight transform for UI convenience if needed.
        const transformedLogs = logs?.map(log => ({
            ...log,
            // UI-friendly aliases (already present, but fallback)
            action_type_display: log.action_type || log.action?.split('_').pop() || 'other',
            resource_type_display: log.target_table || 'system',
        }));

        return NextResponse.json({
            logs: transformedLogs,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error('Error in activity logs API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ----------------------------------------------------------------------
// POST – Client log intake – now uses logActivityServer
// ----------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Extract IP, User-Agent, device info from the request
        const metadata = getRequestMetadata(request);

        // Use the central server logger – it will:
        // - auto‑fetch the current user (if any)
        // - derive action_type / action_category if not provided
        // - set status = 'success' as default
        // - handle all schema fields
        await logActivityServer(supabase, {
            // Client sends these fields (omit user, we let auto‑user handle it)
            action: body.action,
            target_table: body.target_table,
            target_id: body.target_id,
            resource_name: body.resource_name,      // new – add to client logger
            description: body.description,
            metadata: body.metadata || {},
            status: body.status || 'success',       // optional, default success
            error_message: body.error_message,
            changes: body.changes,
            action_type: body.action_type,          // optional, will derive if missing
            action_category: body.action_category,  // optional, will derive if missing

            // Request metadata (IP, user-agent, device, browser, OS)
            ...metadata,
        }, { autoUser: true }); // autoUser: true is default, but explicit is fine

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in activity logs API:', error);

        // Attempt to log the failure itself (if supabase client is available)
        try {
            const supabase = await createClient();
            const metadata = getRequestMetadata(request);
            await logActivityServer(supabase, {
                action: 'activity_log_failed',
                action_category: 'system',
                status: 'failure',
                error_message: error instanceof Error ? error.message : 'Unknown error',
                metadata: { body: await request.clone().json().catch(() => ({})) },
                ...metadata,
            }, { autoUser: true });
        } catch { /* ignore secondary failure */ }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}