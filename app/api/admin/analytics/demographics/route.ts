// /api/admin/analytics/demographics/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
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

        // FIX: Changed 'dob' to 'date_of_birth'
        const { data: children, error } = await supabase
            .from('children')
            .select('date_of_birth')
            .not('date_of_birth', 'is', null);

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
            '16-18 years': 0
        };

        const today = new Date();

        children?.forEach(child => {
            // FIX: Changed child.dob to child.date_of_birth
            const birthDate = new Date(child.date_of_birth);
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