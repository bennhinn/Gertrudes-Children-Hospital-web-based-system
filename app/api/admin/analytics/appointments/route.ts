// /api/admin/analytics/appointments/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get appointments from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('scheduled_for, status')
            .gte('scheduled_for', sevenDaysAgo.toISOString())
            .order('scheduled_for', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Process data to group by day
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = Array(7).fill(null).map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            return {
                day: dayNames[date.getDay()],
                total: 0,
                completed: 0,
                date: date.toISOString().split('T')[0]
            };
        });

        // Count appointments per day
        appointments?.forEach(apt => {
            const aptDate = new Date(apt.scheduled_for);
            const dateStr = aptDate.toISOString().split('T')[0];
            
            const dayData = chartData.find(d => d.date === dateStr);
            if (dayData) {
                dayData.total++;
                if (apt.status === 'completed') {
                    dayData.completed++;
                }
            }
        });

        // Remove the date field before sending to client
        const finalData = chartData.map(({ day, total, completed }) => ({
            day,
            total,
            completed
        }));

        return NextResponse.json(finalData);
    } catch (error) {
        console.error('Error in appointments analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}