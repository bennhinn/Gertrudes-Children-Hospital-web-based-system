// app/api/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    logActivityServer,
    getRequestMetadata,
} from '@/lib/activity-logger';

// ----------------------------------------------------------------------
// POST – Client log intake (uses your enhanced logger)
// ----------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Extract IP, user-agent, device, browser, OS
        const metadata = getRequestMetadata(request);

        // Use the central server logger – it handles:
        // - auto‑fetching the current user (if any)
        // - deriving action_type / action_category if not provided
        // - populating all audit_logs columns
        await logActivityServer(supabase, {
            // Fields sent by the client
            action: body.action,
            target_table: body.target_table,
            target_id: body.target_id,
            resource_name: body.resource_name,
            description: body.description,
            metadata: body.metadata || {},
            status: body.status || 'success',
            error_message: body.error_message,
            changes: body.changes,
            action_type: body.action_type,      // optional – will derive if missing
            action_category: body.action_category, // optional – will derive

            // Request metadata (IP, user-agent, device, browser, OS)
            ...metadata,
        }, { autoUser: true }); // autoUser fetches the current session user

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Activity log POST failed:', error);

        // Attempt to log the failure itself (if supabase client is available)
        try {
            const supabase = await createClient();
            const metadata = getRequestMetadata(request);
            await logActivityServer(supabase, {
                action: 'activity_log_failed',
                action_category: 'system',
                status: 'failure',
                error_message: error instanceof Error ? error.message : 'Unknown error',
                metadata: { 
                    body: await request.clone().json().catch(() => ({})) 
                },
                ...metadata,
            }, { autoUser: true });
        } catch { /* ignore secondary failure */ }

        return NextResponse.json(
            { error: 'Failed to create activity log' },
            { status: 500 }
        );
    }
}

// ----------------------------------------------------------------------
// GET – Admin fetch (pagination, filters)
// ----------------------------------------------------------------------
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Verify user is authenticated and is an admin
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

        // 2. Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const action = searchParams.get('action');
        const targetTable = searchParams.get('target_table');
        const userId = searchParams.get('user_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const search = searchParams.get('search');

        const offset = (page - 1) * limit;

        // 3. Build query
        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (action) query = query.eq('action', action);
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
            return NextResponse.json(
                { error: 'Failed to fetch activity logs' },
                { status: 500 }
            );
        }

        // 4. Lightweight transform for UI convenience
        const transformedLogs = logs?.map(log => ({
            ...log,
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
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}