// /api/admin/staff/route.ts
export const dynamic = 'force-dynamic';
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

        // Get emails from auth.users for each staff member
        const staffWithDetails = await Promise.all(
            (staffProfiles || []).map(async (profile) => {
                const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
                
                const staffMember: any = {
                    id: profile.id,
                    user_id: profile.id,
                    role: profile.role,
                    specialization: null,
                    license_number: null,
                    department: null,
                    profile: {
                        full_name: profile.full_name,
                        email: authUser?.user?.email || '',
                        phone: profile.phone,
                    }
                };

                // Get additional details from role-specific tables
                if (profile.role === 'doctor') {
                    const { data: doctor } = await supabase
                        .from('doctors')
                        .select('specialization, license_number')
                        .eq('user_id', profile.id)
                        .single();
                    
                    if (doctor) {
                        staffMember.specialization = doctor.specialization;
                        staffMember.license_number = doctor.license_number;
                    }
                }

                return staffMember;
            })
        );

        return NextResponse.json(staffWithDetails);
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
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

        const body = await request.json();
        const { email, password, full_name, phone, role: staffRole, specialization, license_number } = body;

        // Validate required fields
        if (!email || !password || !full_name || !staffRole) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create user in auth
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                role: staffRole
            }
        });

        if (createUserError) {
            console.error('Error creating user:', createUserError);
            return NextResponse.json({ error: createUserError.message }, { status: 500 });
        }

        if (!newUser.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: newUser.user.id,
                full_name,
                phone: phone || null,
                role: staffRole
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Try to delete the user if profile creation fails
            await supabase.auth.admin.deleteUser(newUser.user.id);
            return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
        }

        // If role is doctor, create doctor record
        if (staffRole === 'doctor') {
            const { error: doctorError } = await supabase
                .from('doctors')
                .insert({
                    user_id: newUser.user.id,
                    specialization: specialization || null,
                    license_number: license_number || null
                });

            if (doctorError) {
                console.error('Error creating doctor record:', doctorError);
                // Continue anyway, profile was created
            }
        }

        return NextResponse.json({ 
            message: 'Staff member created successfully',
            user_id: newUser.user.id 
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating staff member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}