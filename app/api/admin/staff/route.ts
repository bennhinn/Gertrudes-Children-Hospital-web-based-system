import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get current user and verify admin role
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = user.app_metadata?.role;
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all staff members (doctors, receptionists, lab_techs, pharmacists, suppliers)
        const staffRoles = ['doctor', 'receptionist', 'lab_tech', 'pharmacist', 'supplier'];

        // Fetch staff from profiles where role is a staff role
        const { data: staffProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('role', staffRoles)
            .order('created_at', { ascending: false });

        if (profilesError) {
            console.error('Error fetching staff:', profilesError);
            return NextResponse.json({ error: profilesError.message }, { status: 500 });
        }

        // Transform the data to include profile information
        const staffWithDetails = staffProfiles?.map(profile => ({
            id: profile.id,
            user_id: profile.id,
            role: profile.role,
            specialization: null,
            license_number: null,
            department: null,
            profile: {
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone,
            }
        })) || [];

        // Try to get additional details from role-specific tables
        for (const staff of staffWithDetails) {
            if (staff.role === 'doctor') {
                const { data: doctor } = await supabase
                    .from('doctors')
                    .select('specialization, license_number')
                    .eq('user_id', staff.user_id)
                    .single();
                if (doctor) {
                    staff.specialization = doctor.specialization;
                    staff.license_number = doctor.license_number;
                }
            }
        }

        return NextResponse.json(staffWithDetails);
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
