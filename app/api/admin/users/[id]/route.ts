export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivityServer, ActivityActions } from '@/lib/activity-logger';

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
        const { full_name, email, phone, role: newRole } = body;

        // Prepare update object for profiles table (only include fields that exist in profiles)
        const profileUpdateData: any = {};
        if (full_name !== undefined) profileUpdateData.full_name = full_name;
        if (phone !== undefined) profileUpdateData.phone = phone;
        if (newRole !== undefined) profileUpdateData.role = newRole;

        // Update the user profile (if there are fields to update)
        let updatedProfile = null;
        if (Object.keys(profileUpdateData).length > 0) {
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update(profileUpdateData)
                .eq('id', params.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating profile:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
            updatedProfile = data;
        }

        // Update email in auth.users if provided
        if (email) {
            const { error: emailUpdateError } = await supabase.auth.admin.updateUserById(
                params.id,
                { email }
            );

            if (emailUpdateError) {
                console.error('Error updating email in auth:', emailUpdateError);
                return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
            }
        }

        // Fetch the complete updated user data
        const { data: finalProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', params.id)
            .single();

        if (fetchError) {
            console.error('Error fetching updated profile:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        // Get the updated email from auth.users
        const { data: { user: authUser }, error: authFetchError } = await supabase.auth.admin.getUserById(params.id);

        if (authFetchError) {
            console.error('Error fetching auth user:', authFetchError);
        }

        // Combine profile data with email from auth
        const completeUser = {
            ...finalProfile,
            email: authUser?.email || finalProfile.email
        };

        // Log the activity
        await logActivityServer(supabase, {
            user_id: user.id,
            user_email: user.email,
            user_role: role,
            action: newRole ? ActivityActions.USER_ROLE_UPDATE : 'user_updated',
            target_table: 'profiles',
            target_id: params.id,
            resource_name: completeUser.full_name,
            description: `User updated: ${completeUser.email}${newRole ? ` (role changed to ${newRole})` : ''}`,
            metadata: { updated_fields: Object.keys(body), new_role: newRole },
        });

        return NextResponse.json(completeUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Optional: Add DELETE endpoint if you want to allow deleting users
export async function DELETE(
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

        // Prevent admin from deleting themselves
        if (user.id === params.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Delete user from auth (this will cascade to profiles if you have RLS policies set up)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(params.id);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // Log the activity
        await logActivityServer(supabase, {
            user_id: user.id,
            user_email: user.email,
            user_role: role,
            action: 'user_deleted',
            target_table: 'user',
            target_id: params.id,
            description: `User deleted: ${params.id}`,
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}