import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logActivityServer } from '@/lib/activity-logger';

// Helper function to generate CSV content
function generateCSV(headers: string[], rows: any[]): string {
    const headerRow = headers.join(',');
    const dataRows = rows.map(row =>
        headers.map(h => {
            const value = row[h];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
}

// Helper function to get date range
function getDateRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let start = new Date(end);
    start.setHours(0, 0, 0, 0);

    switch (period) {
        case 'week':
            start.setDate(start.getDate() - 6);
            break;
        case 'month':
            start.setDate(start.getDate() - 29);
            break;
        case 'year':
            start.setDate(start.getDate() - 364);
            break;
        default:
            start.setDate(start.getDate() - 6);
    }

    return { start, end };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const supabase = await createClient();
        const { type } = await params;

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
        const format = searchParams.get('format') || 'json';
        const period = searchParams.get('period') || 'month';
        const { start, end } = getDateRange(period);

        let reportData: any;
        let csvHeaders: string[] = [];
        let csvRows: any[] = [];
        let reportTitle = '';

        switch (type) {
            case 'user_activity':
                reportTitle = 'User Activity Report';
                const { data: activityLogs } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString())
                    .order('created_at', { ascending: false });

                // Transform logs for compatibility
                const transformedLogs = activityLogs?.map(log => ({
                    ...log,
                    action_type: log.action?.split('_').pop() || 'other',
                    resource_type: log.target_table || 'system',
                }));

                reportData = {
                    title: reportTitle,
                    period: { start: start.toISOString(), end: end.toISOString() },
                    totalActivities: activityLogs?.length || 0,
                    activities: transformedLogs || []
                };

                csvHeaders = ['created_at', 'user_email', 'user_role', 'action', 'target_table', 'description'];
                csvRows = activityLogs || [];
                break;

            case 'appointments':
                reportTitle = 'Appointment Analytics Report';
                const { data: appointments, error: appointmentsError } = await supabase
                    .from('appointments')
                    .select('id, child_id, doctor_id, scheduled_for, created_at, status, notes')
                    .or(`scheduled_for.gte.${start.toISOString()},created_at.gte.${start.toISOString()}`)
                    .order('created_at', { ascending: false });

                if (appointmentsError) {
                    return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
                }

                const periodAppointments = (appointments || []).filter((a: any) => {
                    const eventDateRaw = a.scheduled_for || a.created_at;
                    if (!eventDateRaw) {
                        return false;
                    }

                    const eventDate = new Date(eventDateRaw);
                    return !Number.isNaN(eventDate.getTime()) && eventDate >= start && eventDate <= end;
                });

                const childIds = [...new Set(periodAppointments.map((a: any) => a.child_id).filter(Boolean))];
                const doctorIds = [...new Set(periodAppointments.map((a: any) => a.doctor_id).filter(Boolean))];

                const [appointmentChildrenResult, appointmentDoctorProfilesResult] = await Promise.all([
                    childIds.length
                        ? supabase.from('children').select('id, full_name').in('id', childIds)
                        : Promise.resolve({ data: [], error: null } as any),
                    doctorIds.length
                        ? supabase.from('profiles').select('id, full_name').in('id', doctorIds)
                        : Promise.resolve({ data: [], error: null } as any),
                ]);

                if (appointmentChildrenResult.error) {
                    return NextResponse.json({ error: appointmentChildrenResult.error.message }, { status: 500 });
                }
                if (appointmentDoctorProfilesResult.error) {
                    return NextResponse.json({ error: appointmentDoctorProfilesResult.error.message }, { status: 500 });
                }

                const childNameById = new Map((appointmentChildrenResult.data || []).map((c: any) => [c.id, c.full_name || 'N/A']));
                const doctorNameById = new Map((appointmentDoctorProfilesResult.data || []).map((d: any) => [d.id, d.full_name || 'N/A']));

                const appointmentStats = {
                    total: periodAppointments.length,
                    completed: periodAppointments.filter((a: any) => a.status === 'completed').length,
                    cancelled: periodAppointments.filter((a: any) => a.status === 'cancelled').length,
                    pending: periodAppointments.filter((a: any) => ['pending', 'confirmed', 'checked_in'].includes(a.status)).length,
                    scheduled: periodAppointments.filter((a: any) => a.status === 'confirmed').length,
                };

                reportData = {
                    title: reportTitle,
                    period: { start: start.toISOString(), end: end.toISOString() },
                    stats: appointmentStats,
                    appointments: periodAppointments.map((a: any) => {
                        const eventDate = new Date(a.scheduled_for || a.created_at);
                        return {
                            id: a.id,
                            date: !Number.isNaN(eventDate.getTime()) ? eventDate.toISOString().split('T')[0] : 'N/A',
                            time: !Number.isNaN(eventDate.getTime())
                                ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'N/A',
                            status: a.status,
                            patient: childNameById.get(a.child_id) || 'N/A',
                            doctor: doctorNameById.get(a.doctor_id) || 'N/A',
                            reason: a.notes || 'N/A'
                        };
                    })
                };

                csvHeaders = ['id', 'date', 'time', 'status', 'patient', 'doctor', 'reason'];
                csvRows = reportData.appointments;
                break;

            case 'staff_performance':
                reportTitle = 'Staff Performance Report';
                const { data: doctors, error: doctorsError } = await supabase
                    .from('doctors')
                    .select('id, specialty');

                if (doctorsError) {
                    return NextResponse.json({ error: doctorsError.message }, { status: 500 });
                }

                const { data: doctorAppointments, error: doctorAppointmentsError } = await supabase
                    .from('appointments')
                    .select('doctor_id, status, scheduled_for, created_at')
                    .or(`scheduled_for.gte.${start.toISOString()},created_at.gte.${start.toISOString()}`);

                if (doctorAppointmentsError) {
                    return NextResponse.json({ error: doctorAppointmentsError.message }, { status: 500 });
                }

                const periodDoctorAppointments = (doctorAppointments || []).filter((a: any) => {
                    const eventDateRaw = a.scheduled_for || a.created_at;
                    if (!eventDateRaw) {
                        return false;
                    }

                    const eventDate = new Date(eventDateRaw);
                    return !Number.isNaN(eventDate.getTime()) && eventDate >= start && eventDate <= end;
                });

                const staffDoctorIds = [...new Set((doctors || []).map((d: any) => d.id).filter(Boolean))];
                const { data: staffProfiles, error: staffProfilesError } = staffDoctorIds.length
                    ? await supabase.from('profiles').select('id, full_name').in('id', staffDoctorIds)
                    : { data: [], error: null } as any;

                if (staffProfilesError) {
                    return NextResponse.json({ error: staffProfilesError.message }, { status: 500 });
                }

                const staffNameById = new Map((staffProfiles || []).map((p: any) => [p.id, p.full_name || 'Unknown']));

                const doctorStats = doctors?.map((doc: any) => {
                    const docAppts = periodDoctorAppointments?.filter(a => a.doctor_id === doc.id) || [];
                    return {
                        name: staffNameById.get(doc.id) || 'Unknown',
                        email: 'N/A',
                        specialty: doc.specialty || 'General',
                        totalAppointments: docAppts.length,
                        completed: docAppts.filter(a => a.status === 'completed').length,
                        completionRate: docAppts.length > 0
                            ? Math.round((docAppts.filter(a => a.status === 'completed').length / docAppts.length) * 100)
                            : 0
                    };
                }) || [];

                reportData = {
                    title: reportTitle,
                    period: { start: start.toISOString(), end: end.toISOString() },
                    totalDoctors: doctors?.length || 0,
                    staffPerformance: doctorStats
                };

                csvHeaders = ['name', 'email', 'specialty', 'totalAppointments', 'completed', 'completionRate'];
                csvRows = doctorStats;
                break;

            case 'financial':
                reportTitle = 'Financial Summary Report';
                // This would typically come from a billing/payments table
                // For now, we'll generate sample data based on appointments
                const { data: financialAppts } = await supabase
                    .from('appointments')
                    .select('id, status, created_at')
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString());

                const completedCount = financialAppts?.filter(a => a.status === 'completed').length || 0;
                const estimatedRevenue = completedCount * 1500; // Estimated average consultation fee

                reportData = {
                    title: reportTitle,
                    period: { start: start.toISOString(), end: end.toISOString() },
                    summary: {
                        totalAppointments: financialAppts?.length || 0,
                        completedAppointments: completedCount,
                        estimatedRevenue: estimatedRevenue,
                        averagePerAppointment: 1500,
                        currency: 'KSh'
                    },
                    note: 'Financial data is estimated based on appointment completion rates'
                };

                csvHeaders = ['metric', 'value'];
                csvRows = [
                    { metric: 'Total Appointments', value: financialAppts?.length || 0 },
                    { metric: 'Completed Appointments', value: completedCount },
                    { metric: 'Estimated Revenue (KSh)', value: estimatedRevenue },
                    { metric: 'Average per Appointment (KSh)', value: 1500 }
                ];
                break;

            case 'demographics':
                reportTitle = 'Patient Demographics Report';
                const { data: children } = await supabase
                    .from('children')
                    .select('id, date_of_birth, gender, blood_type')
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString());

                const now = new Date();
                const ageGroups = {
                    'Infant (0-1)': 0,
                    'Toddler (1-3)': 0,
                    'Preschool (3-5)': 0,
                    'School Age (5-12)': 0,
                    'Teen (12-18)': 0
                };

                const genderStats: Record<string, number> = {};

                children?.forEach(child => {
                    if (child.date_of_birth) {
                        const birthDate = new Date(child.date_of_birth);
                        const age = (now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

                        if (age < 1) ageGroups['Infant (0-1)']++;
                        else if (age < 3) ageGroups['Toddler (1-3)']++;
                        else if (age < 5) ageGroups['Preschool (3-5)']++;
                        else if (age < 12) ageGroups['School Age (5-12)']++;
                        else ageGroups['Teen (12-18)']++;
                    }

                    const gender = child.gender || 'Unknown';
                    genderStats[gender] = (genderStats[gender] || 0) + 1;
                });

                reportData = {
                    title: reportTitle,
                    period: { start: start.toISOString(), end: end.toISOString() },
                    totalPatients: children?.length || 0,
                    byAgeGroup: ageGroups,
                    byGender: genderStats
                };

                csvHeaders = ['category', 'group', 'count'];
                csvRows = [
                    ...Object.entries(ageGroups).map(([group, count]) => ({ category: 'Age', group, count })),
                    ...Object.entries(genderStats).map(([group, count]) => ({ category: 'Gender', group, count }))
                ];
                break;

            case 'system_health':
                reportTitle = 'System Health Report';
                // Get various counts for system health
                const [usersResult, childrenResult, appointmentsResult, activityResult] = await Promise.all([
                    supabase.from('profiles').select('id', { count: 'exact', head: true }),
                    supabase.from('children').select('id', { count: 'exact', head: true }),
                    supabase.from('appointments').select('id', { count: 'exact', head: true }),
                    supabase.from('audit_logs').select('id', { count: 'exact', head: true })
                        .gte('created_at', start.toISOString())
                ]);

                reportData = {
                    title: reportTitle,
                    period: { start: start.toISOString(), end: end.toISOString() },
                    systemStats: {
                        totalUsers: usersResult.count || 0,
                        totalPatients: childrenResult.count || 0,
                        totalAppointments: appointmentsResult.count || 0,
                        recentActivities: activityResult.count || 0
                    },
                    status: 'healthy',
                    generatedAt: new Date().toISOString()
                };

                csvHeaders = ['metric', 'value'];
                csvRows = [
                    { metric: 'Total Users', value: usersResult.count || 0 },
                    { metric: 'Total Patients', value: childrenResult.count || 0 },
                    { metric: 'Total Appointments', value: appointmentsResult.count || 0 },
                    { metric: 'Recent Activities', value: activityResult.count || 0 },
                    { metric: 'System Status', value: 'Healthy' }
                ];
                break;

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        // Log the activity
        await logActivityServer(supabase, {
            user_id: user.id,
            user_email: user.email,
            user_role: userData?.role,
            action: format === 'csv' ? 'report_downloaded' : 'report_viewed',
            target_table: 'report',
            description: `${format === 'csv' ? 'Downloaded' : 'Viewed'} ${reportTitle}`,
            metadata: { report_type: type, format, period },
        });

        // Return based on format
        if (format === 'csv') {
            const csvContent = generateCSV(csvHeaders, csvRows);
            const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        return NextResponse.json(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
