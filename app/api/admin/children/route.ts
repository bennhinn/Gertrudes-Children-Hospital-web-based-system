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

        const { data: children, error } = await supabase
            .from('children')
            .select('id, full_name')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching children:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(children || []);
    } catch (error) {
        console.error('Error fetching children:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}