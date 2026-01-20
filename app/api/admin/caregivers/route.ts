// /api/admin/caregivers/route.ts
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

        // Fetch caregivers with profiles - using id as the primary key
        const { data: caregivers, error } = await supabase
            .from('caregivers')
            .select(`
                id,
                address,
                profiles!inner(full_name, phone, role)
            `);

        if (error) {
            console.error('Error fetching caregivers:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(caregivers || []);
    } catch (error) {
        console.error('Error fetching caregivers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}