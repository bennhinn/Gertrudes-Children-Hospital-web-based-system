// /api/admin/analytics/demographics/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const searchParams = new URL(request.url).searchParams;
        const period = searchParams.get('period') || 'week';

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // FIX: Get role from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const now = new Date();
        now.setHours(23, 59, 59, 999);

        const rangeStart = new Date(now);
        if (period === 'year') {
            rangeStart.setHours(0, 0, 0, 0);
            rangeStart.setDate(rangeStart.getDate() - 364);
        } else if (period === 'month') {
            rangeStart.setHours(0, 0, 0, 0);
            rangeStart.setDate(rangeStart.getDate() - 29);
        } else {
            rangeStart.setHours(0, 0, 0, 0);
            rangeStart.setDate(rangeStart.getDate() - 6);
        }

        // Filter by registration window so the dropdown affects this chart too.
        const { data: children, error } = await supabase
            .from('children')
            .select('date_of_birth, created_at')
            .gte('created_at', rangeStart.toISOString());

        if (error) {
            console.error('Error fetching children:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate age groups
        const ageGroups = {
            '0-2 years': 0,
            '3-5 years': 0,
            '6-10 years': 0,
            '11-15 years': 0,
            '16-18 years': 0,
            Unknown: 0
        };

        const today = new Date();

        children?.forEach(child => {
            if (!child.date_of_birth) {
                ageGroups.Unknown++;
                return;
            }

            const birthDate = new Date(child.date_of_birth);
            if (Number.isNaN(birthDate.getTime())) {
                ageGroups.Unknown++;
                return;
            }

            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            // Adjust age if birthday hasn't occurred this year
            const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ? age - 1
                : age;

            if (actualAge <= 2) {
                ageGroups['0-2 years']++;
            } else if (actualAge <= 5) {
                ageGroups['3-5 years']++;
            } else if (actualAge <= 10) {
                ageGroups['6-10 years']++;
            } else if (actualAge <= 15) {
                ageGroups['11-15 years']++;
            } else if (actualAge <= 18) {
                ageGroups['16-18 years']++;
            } else {
                ageGroups.Unknown++;
            }
        });

        // Convert to array format for pie chart
        const finalData = Object.entries(ageGroups).map(([name, value]) => ({
            name,
            value
        }));

        return NextResponse.json(finalData);
    } catch (error) {
        console.error('Error in demographics analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}