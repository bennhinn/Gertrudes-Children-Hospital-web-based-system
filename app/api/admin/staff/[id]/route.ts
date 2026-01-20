// /api/admin/staff/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        // Get the update data from request body
        const body = await request.json();
        const { full_name, phone, role: newRole, specialization, license_number } = body;

        // Prepare update object for profiles table
        const profileUpdateData: any = {};
        if (full_name !== undefined) profileUpdateData.full_name = full_name;
        if (phone !== undefined) profileUpdateData.phone = phone;
        if (newRole !== undefined) profileUpdateData.role = newRole;

        // Update the user profile
        if (Object.keys(profileUpdateData).length > 0) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update(profileUpdateData)
                .eq('id', params.id);

            if (updateError) {
                console.error('Error updating profile:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
        }

        // If role is doctor, update or create doctor record
        if (newRole === 'doctor' || (specialization !== undefined || license_number !== undefined)) {
            const doctorUpdateData: any = {};
            if (specialization !== undefined) doctorUpdateData.specialization = specialization;
            if (license_number !== undefined) doctorUpdateData.license_number = license_number;

            if (Object.keys(doctorUpdateData).length > 0) {
                // Check if doctor record exists
                const { data: existingDoctor } = await supabase
                    .from('doctors')
                    .select('user_id')
                    .eq('user_id', params.id)
                    .single();

                if (existingDoctor) {
                    // Update existing doctor record
                    const { error: doctorUpdateError } = await supabase
                        .from('doctors')
                        .update(doctorUpdateData)
                        .eq('user_id', params.id);

                    if (doctorUpdateError) {
                        console.error('Error updating doctor record:', doctorUpdateError);
                    }
                } else {
                    // Create new doctor record
                    const { error: doctorInsertError } = await supabase
                        .from('doctors')
                        .insert({
                            user_id: params.id,
                            ...doctorUpdateData
                        });

                    if (doctorInsertError) {
                        console.error('Error creating doctor record:', doctorInsertError);
                    }
                }
            }
        }

        // Fetch the complete updated data
        const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', params.id)
            .single();

        let staffMember: any = {
            id: params.id,
            user_id: params.id,
            role: updatedProfile?.role,
            specialization: null,
            license_number: null,
            department: null,
            profile: {
                full_name: updatedProfile?.full_name,
                email: '',
                phone: updatedProfile?.phone,
            }
        };

        // Get email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(params.id);
        if (authUser?.user?.email) {
            staffMember.profile.email = authUser.user.email;
        }

        // Get doctor details if applicable
        if (updatedProfile?.role === 'doctor') {
            const { data: doctor } = await supabase
                .from('doctors')
                .select('specialization, license_number')
                .eq('user_id', params.id)
                .single();

            if (doctor) {
                staffMember.specialization = doctor.specialization;
                staffMember.license_number = doctor.license_number;
            }
        }

        return NextResponse.json(staffMember);
    } catch (error) {
        console.error('Error updating staff member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}