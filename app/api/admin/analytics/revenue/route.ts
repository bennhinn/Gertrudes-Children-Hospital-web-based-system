// /api/admin/analytics/revenue/route.ts
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

        const { data: payments, error } = await supabase
            .from('payments')
            .select('amount, created_at, payment_date, status')
            .eq('status', 'paid')
            .or(`created_at.gte.${rangeStart.toISOString()},payment_date.gte.${rangeStart.toISOString()}`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching payments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Process data to period buckets
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

        const chartData = new Map<string, { label: string; revenue: number }>();

        if (period === 'year') {
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setHours(0, 0, 0, 0);
                date.setDate(1);
                date.setMonth(date.getMonth() - i);
                chartData.set(toMonthKey(date), { label: monthNames[date.getMonth()], revenue: 0 });
            }
        } else {
            const days = period === 'month' ? 30 : 7;
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() - i);
                const label = period === 'month' ? `${date.getMonth() + 1}/${date.getDate()}` : `${monthNames[date.getMonth()]} ${date.getDate()}`;
                chartData.set(toDateKey(date), { label, revenue: 0 });
            }
        }

        // Sum payments by bucket
        payments?.forEach(payment => {
            const eventDateRaw = payment.payment_date || payment.created_at;
            if (!eventDateRaw) {
                return;
            }

            const paymentDate = new Date(eventDateRaw);
            if (Number.isNaN(paymentDate.getTime())) {
                return;
            }

            const key = period === 'year' ? toMonthKey(paymentDate) : toDateKey(paymentDate);
            const bucket = chartData.get(key);
            if (bucket) {
                bucket.revenue += Number(payment.amount) || 0;
            }
        });

        const finalData = Array.from(chartData.values()).map((bucket) => ({
            label: bucket.label,
            revenue: Math.round(bucket.revenue),
        }));

        return NextResponse.json(finalData);
    } catch (error) {
        console.error('Error in revenue analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}