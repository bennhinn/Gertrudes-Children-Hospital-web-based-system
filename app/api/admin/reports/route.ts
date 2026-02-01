import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logActivityServer } from '@/lib/activity-logger';

// GET - Fetch generated reports list
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
        const limit = parseInt(searchParams.get('limit') || '20');
        const reportType = searchParams.get('type');

        const offset = (page - 1) * limit;

        let query = supabase
            .from('generated_reports')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (reportType) {
            query = query.eq('report_type', reportType);
        }

        const { data: reports, error, count } = await query;

        if (error) {
            console.error('Error fetching reports:', error);
            return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
        }

        return NextResponse.json({
            reports,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error in reports API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Generate a new report
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { report_type, period_start, period_end, parameters } = body;

        // Generate report name based on type and date
        const reportNames: Record<string, string> = {
            'user_activity': 'User Activity Report',
            'appointments': 'Appointment Analytics Report',
            'staff_performance': 'Staff Performance Report',
            'financial': 'Financial Summary Report',
            'demographics': 'Patient Demographics Report',
            'system_health': 'System Health Report',
        };

        const reportName = `${reportNames[report_type] || 'Report'} - ${new Date().toLocaleDateString()}`;

        // Create report record
        const { data: report, error } = await supabase
            .from('generated_reports')
            .insert({
                report_type,
                report_name: reportName,
                generated_by: user.id,
                generated_by_email: user.email,
                period_start: period_start || null,
                period_end: period_end || null,
                parameters: parameters || {},
                status: 'completed'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating report:', error);
            return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
        }

        // Log activity
        await logActivityServer(supabase, {
            user_id: user.id,
            user_email: user.email,
            user_role: userData?.role,
            action: 'report_generated',
            target_table: 'report',
            target_id: report.id,
            description: `Report generated: ${reportName}`,
            metadata: { report_type, period_start, period_end },
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error('Error in reports API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
