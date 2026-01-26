// /api/admin/staff/route.ts
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
                        .select('specialty, bio') // FIX: Changed from specialization to specialty to match your schema
                        .eq('id', profile.id) // FIX: Changed from user_id to id
                        .single();
                    
                    if (doctor) {
                        staffMember.specialization = doctor.specialty;
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
                    id: newUser.user.id, // FIX: Changed from user_id to id to match schema
                    specialty: specialization || null, // FIX: Changed from specialization to specialty
                    bio: null,
                    photo_url: null
                });

            if (doctorError) {
                console.error('Error creating doctor record:', doctorError);
                // Continue anyway, profile was created
            }
        }

        // FIX: Add similar logic for other staff roles
        if (staffRole === 'lab_tech') {
            const { error: labTechError } = await supabase
                .from('lab_technicians')
                .insert({
                    id: newUser.user.id,
                    department: null
                });

            if (labTechError) {
                console.error('Error creating lab tech record:', labTechError);
            }
        }

        if (staffRole === 'pharmacist') {
            const { error: pharmacistError } = await supabase
                .from('pharmacists')
                .insert({
                    id: newUser.user.id
                });

            if (pharmacistError) {
                console.error('Error creating pharmacist record:', pharmacistError);
            }
        }

        if (staffRole === 'receptionist') {
            const { error: receptionistError } = await supabase
                .from('receptionists')
                .insert({
                    id: newUser.user.id
                });

            if (receptionistError) {
                console.error('Error creating receptionist record:', receptionistError);
            }
        }

        if (staffRole === 'supplier') {
            const { error: supplierError } = await supabase
                .from('suppliers')
                .insert({
                    id: newUser.user.id,
                    company_name: null,
                    contact_info: null
                });

            if (supplierError) {
                console.error('Error creating supplier record:', supplierError);
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