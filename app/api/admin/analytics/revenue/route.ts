// /api/admin/analytics/revenue/route.ts
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

        // Get payments from the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: payments, error } = await supabase
            .from('payments')
            .select('amount, created_at, status')
            .eq('status', 'paid')
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching payments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Process data to group by month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData: { [key: string]: number } = {};

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            chartData[monthKey] = 0;
        }

        // Sum payments by month
        payments?.forEach(payment => {
            const paymentDate = new Date(payment.created_at);
            const monthKey = `${monthNames[paymentDate.getMonth()]} ${paymentDate.getFullYear()}`;
            
            if (chartData[monthKey] !== undefined) {
                chartData[monthKey] += Number(payment.amount) || 0;
            }
        });

        // Convert to array format for charts
        const finalData = Object.keys(chartData).map(month => ({
            month: month.split(' ')[0], // Just the month name
            revenue: Math.round(chartData[month])
        }));

        return NextResponse.json(finalData);
    } catch (error) {
        console.error('Error in revenue analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}