/**
 * Appointment Search Configuration
 * Used by: Receptionist, Caregiver, Admin dashboards
 */

import type { SearchConfig } from '@/types/search.types'

export interface AppointmentSearchItem {
    id: string
    scheduled_for: string
    status: string
    notes: string | null
    visit_type?: string
    child: {
        id?: string
        full_name: string
        date_of_birth?: string
    } | null
    caregiver?: {
        id?: string
        profiles: {
            full_name: string
            phone?: string
        }
    } | null
    doctor: {
        id?: string
        department?: string
        profiles: {
            full_name: string
        } | null
    } | null
}

export const appointmentSearchConfig: SearchConfig<AppointmentSearchItem> = {
    id: 'appointments',
    entityName: 'Appointment',
    entityNamePlural: 'appointments',
    searchPlaceholder: 'Search by patient name, doctor, or notes...',
    minSearchLength: 2,
    debounceMs: 300,
    fuzzySearch: true,
    highlightMatches: true,

    searchableFields: [
        { key: 'child.full_name', label: 'Patient Name', weight: 10 },
        { key: 'doctor.profiles.full_name', label: 'Doctor', weight: 8 },
        { key: 'caregiver.profiles.full_name', label: 'Caregiver', weight: 6 },
        { key: 'caregiver.profiles.phone', label: 'Phone', weight: 5 },
        { key: 'notes', label: 'Notes', weight: 3 },
        { key: 'status', label: 'Status', weight: 2 },
        { key: 'visit_type', label: 'Visit Type', weight: 2 },
    ],

    filters: [
        {
            id: 'status',
            label: 'Status',
            field: 'status',
            type: 'select',
            options: [
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'checked_in', label: 'Checked In' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
            ],
        },
    ],

    sortOptions: [
        { id: 'date-asc', label: 'Date (Earliest)', field: 'scheduled_for', direction: 'asc' },
        { id: 'date-desc', label: 'Date (Latest)', field: 'scheduled_for', direction: 'desc' },
        { id: 'patient', label: 'Patient Name', field: 'child.full_name', direction: 'asc' },
    ],

    defaultSort: {
        field: 'scheduled_for',
        direction: 'asc',
    },
}

// Caregiver-specific configuration
export const caregiverAppointmentSearchConfig: SearchConfig<AppointmentSearchItem> = {
    ...appointmentSearchConfig,
    id: 'caregiver-appointments',
    searchPlaceholder: 'Search your appointments...',
    searchableFields: [
        { key: 'child.full_name', label: 'Child Name', weight: 10 },
        { key: 'doctor.profiles.full_name', label: 'Doctor', weight: 8 },
        { key: 'notes', label: 'Notes', weight: 3 },
        { key: 'status', label: 'Status', weight: 2 },
    ],
}

// Receptionist-specific configuration  
export const receptionistAppointmentSearchConfig: SearchConfig<AppointmentSearchItem> = {
    ...appointmentSearchConfig,
    id: 'receptionist-appointments',
    searchPlaceholder: 'Search by patient, caregiver, phone, or doctor...',
}
