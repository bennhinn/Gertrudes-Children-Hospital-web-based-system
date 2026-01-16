// Supabase query utilities
import { createClient } from '@/lib/supabase/server'
import type { Appointment, Child } from '@/types'

export async function getChildrenByCaregiver(caregiverId: string): Promise<Child[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching children:', error)
        return []
    }

    return data || []
}

export async function getAppointmentsByCaregiver(caregiverId: string): Promise<Appointment[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      child:children(*)
    `)
        .eq('caregiver_id', caregiverId)
        .order('scheduled_for', { ascending: false })

    if (error) {
        console.error('Error fetching appointments:', error)
        return []
    }

    return data || []
}

export async function getUpcomingAppointments(caregiverId: string): Promise<Appointment[]> {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      child:children(*)
    `)
        .eq('caregiver_id', caregiverId)
        .gte('scheduled_for', now)
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_for', { ascending: true })
        .limit(10)

    if (error) {
        console.error('Error fetching upcoming appointments:', error)
        return []
    }

    return data || []
}

export async function getCompletedAppointmentsCount(caregiverId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('caregiver_id', caregiverId)
        .eq('status', 'completed')

    if (error) {
        console.error('Error counting completed appointments:', error)
        return 0
    }

    return count || 0
}
