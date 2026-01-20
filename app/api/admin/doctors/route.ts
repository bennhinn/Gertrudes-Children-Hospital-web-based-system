// /api/admin/doctors/route.ts
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

        // Fetch doctors with profiles - using id as the primary key
        const { data: doctors, error } = await supabase
            .from('doctors')
            .select(`
                id,
                specialty,
                bio,
                photo_url,
                created_at,
                profiles!inner(full_name, phone, role)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching doctors:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(doctors || []);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}