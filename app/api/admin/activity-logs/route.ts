import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch activity logs with pagination and filters
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: userData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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

        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (action) {
            query = query.eq('action', action);
        }
        if (targetTable) {
            query = query.eq('target_table', targetTable);
        }
        if (userId) {
            query = query.eq('user_id', userId);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }
        if (search) {
            query = query.or(`description.ilike.%${search}%,action.ilike.%${search}%`);
        }

        const { data: logs, error, count } = await query;

        if (error) {
            console.error('Error fetching activity logs:', error);
            return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
        }

        // Transform logs to include action_type and resource_type for UI compatibility
        const transformedLogs = logs?.map(log => ({
            ...log,
            action_type: log.action?.split('_').pop() || 'other',
            resource_type: log.target_table || 'system',
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

// POST - Create a new activity log
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { data: { user } } = await supabase.auth.getUser();

        // Get user details if logged in
        let userEmail = body.user_email || null;
        let userRole = body.user_role || null;

        if (user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            userEmail = user.email;
            userRole = profileData?.role || null;
        }

        const logEntry = {
            user_id: user?.id || null,
            action: body.action,
            target_table: body.target_table,
            target_id: body.target_id || null,
            description: body.description || null,
            metadata: body.metadata || {},
            user_email: userEmail,
            user_role: userRole,
        };

        const { data, error } = await supabase
            .from('audit_logs')
            .insert(logEntry)
            .select()
            .single();

        if (error) {
            console.error('Error creating activity log:', error);
            return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in activity logs API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
