import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch activity statistics for dashboard
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
        const period = searchParams.get('period') || 'week';

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Fetch activity counts by action
        const { data: byAction } = await supabase
            .from('audit_logs')
            .select('action')
            .gte('created_at', startDate.toISOString());

        // Fetch activity counts by target table
        const { data: byTargetTable } = await supabase
            .from('audit_logs')
            .select('target_table')
            .gte('created_at', startDate.toISOString());

        // Fetch recent activities
        const { data: recentActivities } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        // Fetch top active users - join with profiles to get email
        const { data: allLogs } = await supabase
            .from('audit_logs')
            .select('user_id, user_email, user_role')
            .gte('created_at', startDate.toISOString());

        // Process statistics
        const actionCounts: Record<string, number> = {};
        byAction?.forEach(log => {
            const actionType = log.action?.split('_').pop() || 'other';
            actionCounts[actionType] = (actionCounts[actionType] || 0) + 1;
        });

        const targetTableCounts: Record<string, number> = {};
        byTargetTable?.forEach(log => {
            const table = log.target_table || 'system';
            targetTableCounts[table] = (targetTableCounts[table] || 0) + 1;
        });

        const userActivityCounts: Record<string, { count: number; role: string }> = {};
        allLogs?.forEach(log => {
            const email = log.user_email || log.user_id || 'anonymous';
            if (email) {
                if (!userActivityCounts[email]) {
                    userActivityCounts[email] = { count: 0, role: log.user_role || 'unknown' };
                }
                userActivityCounts[email].count++;
            }
        });

        const topUsers = Object.entries(userActivityCounts)
            .map(([email, data]) => ({ email, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Transform recent activities for UI compatibility
        const transformedActivities = recentActivities?.map(log => ({
            ...log,
            action_type: log.action?.split('_').pop() || 'other',
            resource_type: log.target_table || 'system',
        }));

        return NextResponse.json({
            totalActivities: byAction?.length || 0,
            byActionType: Object.entries(actionCounts).map(([name, value]) => ({ name, value })),
            byResourceType: Object.entries(targetTableCounts).map(([name, value]) => ({ name, value })),
            recentActivities: transformedActivities,
            topUsers,
            period
        });
    } catch (error) {
        console.error('Error in activity stats API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
