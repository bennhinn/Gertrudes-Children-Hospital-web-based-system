/**
 * Prescriptions Search Configuration
 * Used by: Pharmacy, Doctor dashboards
 */

import type { SearchConfig } from '@/types/search.types'

export interface PrescriptionSearchItem {
    id: string
    status: string
    urgency: string
    prescribed_at: string
    notes?: string | null
    child_id: string
    doctor_id: string
    prescription_items?: {
        id: string
        medication_name: string
        dosage: string
        frequency: string
        duration: string
        quantity: number
        instructions?: string | null
    }[]
    child?: {
        id: string
        full_name: string
        date_of_birth?: string
    } | null
    doctor?: {
        id: string
        profiles: {
            full_name: string
        } | null
    } | null
}

export const prescriptionSearchConfig: SearchConfig<PrescriptionSearchItem> = {
    id: 'prescriptions',
    entityName: 'Prescription',
    entityNamePlural: 'prescriptions',
    searchPlaceholder: 'Search by patient, medication, or doctor...',
    minSearchLength: 2,
    debounceMs: 300,
    fuzzySearch: true,
    highlightMatches: true,

    searchableFields: [
        { key: 'child.full_name', label: 'Patient', weight: 10 },
        { key: 'doctor.profiles.full_name', label: 'Doctor', weight: 7 },
        { key: 'notes', label: 'Notes', weight: 3 },
        { key: 'status', label: 'Status', weight: 2 },
        { key: 'urgency', label: 'Urgency', weight: 2 },
    ],

    filters: [
        {
            id: 'status',
            label: 'Status',
            field: 'status',
            type: 'select',
            options: [
                { value: 'pending', label: 'Pending' },
                { value: 'preparing', label: 'Preparing' },
                { value: 'dispensed', label: 'Dispensed' },
            ],
        },
        {
            id: 'urgency',
            label: 'Urgency',
            field: 'urgency',
            type: 'select',
            options: [
                { value: 'stat', label: 'STAT' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'routine', label: 'Routine' },
            ],
        },
    ],

    sortOptions: [
        { id: 'urgency', label: 'Urgency', field: 'urgency', direction: 'asc' },
        { id: 'date-desc', label: 'Newest First', field: 'prescribed_at', direction: 'desc' },
        { id: 'date-asc', label: 'Oldest First', field: 'prescribed_at', direction: 'asc' },
        { id: 'patient', label: 'Patient Name', field: 'child.full_name', direction: 'asc' },
    ],

    defaultSort: {
        field: 'prescribed_at',
        direction: 'desc',
    },
}
