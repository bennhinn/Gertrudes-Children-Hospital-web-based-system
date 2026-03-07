// /api/admin/analytics/appointments/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const searchParams = new URL(request.url).searchParams;
        const period = searchParams.get('period') || 'week';

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        now.setHours(23, 59, 59, 999);

        const rangeStart = new Date(now);
        if (period === 'year') {
            rangeStart.setHours(0, 0, 0, 0);
            rangeStart.setMonth(rangeStart.getMonth() - 11);
            rangeStart.setDate(1);
        } else if (period === 'month') {
            rangeStart.setHours(0, 0, 0, 0);
            rangeStart.setDate(rangeStart.getDate() - 29);
        } else {
            rangeStart.setHours(0, 0, 0, 0);
            rangeStart.setDate(rangeStart.getDate() - 6);
        }

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('scheduled_for, created_at, status')
            .or(`scheduled_for.gte.${rangeStart.toISOString()},created_at.gte.${rangeStart.toISOString()}`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Process data into period buckets
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const toDateKey = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const toMonthKey = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}`;
        };

        let chartData: Array<{ label: string; total: number; completed: number; key: string }> = [];

        if (period === 'year') {
            chartData = Array(12).fill(null).map((_, index) => {
                const date = new Date(now);
                date.setHours(0, 0, 0, 0);
                date.setDate(1);
                date.setMonth(date.getMonth() - (11 - index));
                return {
                    label: monthNames[date.getMonth()],
                    total: 0,
                    completed: 0,
                    key: toMonthKey(date),
                };
            });
        } else {
            const days = period === 'month' ? 30 : 7;
            chartData = Array(days).fill(null).map((_, index) => {
                const date = new Date(now);
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() - ((days - 1) - index));
                return {
                    label: period === 'month' ? `${date.getMonth() + 1}/${date.getDate()}` : dayNames[date.getDay()],
                    total: 0,
                    completed: 0,
                    key: toDateKey(date),
                };
            });
        }

        // Count appointments per day
        appointments?.forEach(apt => {
            const eventDateRaw = apt.scheduled_for || apt.created_at;
            if (!eventDateRaw) {
                return;
            }

            const aptDate = new Date(eventDateRaw);
            if (Number.isNaN(aptDate.getTime())) {
                return;
            }

            const bucketKey = period === 'year' ? toMonthKey(aptDate) : toDateKey(aptDate);
            const dayData = chartData.find(d => d.key === bucketKey);
            if (dayData) {
                dayData.total++;
                if (apt.status === 'completed') {
                    dayData.completed++;
                }
            }
        });

        const finalData = chartData.map(({ label, total, completed }) => ({
            label,
            total,
            completed
        }));

        return NextResponse.json(finalData);
    } catch (error) {
        console.error('Error in appointments analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}