/**
 * Queue/Check-in Search Configuration
 * Used by: Receptionist, Doctor dashboards
 */

import type { SearchConfig } from '@/types/search.types'

export interface QueueSearchItem {
    id: string
    queue_number: number
    status: string
    reason: string
    checked_in_at: string
    called_at?: string | null
    completed_at?: string | null
    vitals?: {
        temperature?: string
        weight?: string
        height?: string
        blood_pressure?: string
    } | null
    notes?: string | null
    appointment?: {
        id: string
        scheduled_for?: string
        child?: {
            id?: string
            full_name: string
            date_of_birth?: string
            gender?: string
        }
        caregiver?: {
            id?: string
            profiles: {
                full_name: string
                phone?: string
            }
        }
        doctor?: {
            id?: string
            department?: string
            profiles: {
                full_name: string
            }
        }
    }
}

export const queueSearchConfig: SearchConfig<QueueSearchItem> = {
    id: 'queue',
    entityName: 'Patient',
    entityNamePlural: 'patients in queue',
    searchPlaceholder: 'Search by patient name, queue number, or reason...',
    minSearchLength: 1,
    debounceMs: 200,
    fuzzySearch: true,
    highlightMatches: true,

    searchableFields: [
        { key: 'appointment.child.full_name', label: 'Patient Name', weight: 10 },
        { key: 'queue_number', label: 'Queue #', weight: 9 },
        { key: 'reason', label: 'Reason', weight: 7 },
        { key: 'appointment.caregiver.profiles.full_name', label: 'Caregiver', weight: 5 },
        { key: 'appointment.caregiver.profiles.phone', label: 'Phone', weight: 5 },
        { key: 'appointment.doctor.profiles.full_name', label: 'Doctor', weight: 4 },
        { key: 'status', label: 'Status', weight: 2 },
    ],

    filters: [
        {
            id: 'status',
            label: 'Status',
            field: 'status',
            type: 'select',
            options: [
                { value: 'waiting', label: 'Waiting' },
                { value: 'in_consultation', label: 'With Doctor' },
                { value: 'completed', label: 'Completed' },
            ],
        },
    ],

    sortOptions: [
        { id: 'queue-asc', label: 'Queue Number', field: 'queue_number', direction: 'asc' },
        { id: 'checkin-asc', label: 'Check-in Time', field: 'checked_in_at', direction: 'asc' },
        { id: 'checkin-desc', label: 'Recent First', field: 'checked_in_at', direction: 'desc' },
    ],

    defaultSort: {
        field: 'queue_number',
        direction: 'asc',
    },
}

// Doctor queue - filtered to their patients
export const doctorQueueSearchConfig: SearchConfig<QueueSearchItem> = {
    ...queueSearchConfig,
    id: 'doctor-queue',
    searchPlaceholder: 'Search your queue...',
    filters: [
        {
            id: 'status',
            label: 'Status',
            field: 'status',
            type: 'select',
            options: [
                { value: 'waiting', label: 'Waiting' },
                { value: 'in_consultation', label: 'In Consultation' },
            ],
        },
    ],
}
