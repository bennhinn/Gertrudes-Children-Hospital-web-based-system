/**
 * Lab Orders Search Configuration
 * Used by: Lab Tech, Doctor dashboards
 */

import type { SearchConfig } from '@/types/search.types'

export interface LabOrderSearchItem {
    id: string
    test_type: string
    test_code?: string | null
    urgency: 'stat' | 'urgent' | 'routine'
    status: string
    ordered_at: string
    special_instructions?: string | null
    child?: {
        id: string
        full_name: string
        date_of_birth?: string
        gender?: string
    } | null
    doctor?: {
        id: string
        profiles: {
            full_name: string
        }
    } | null
}

export const labOrderSearchConfig: SearchConfig<LabOrderSearchItem> = {
    id: 'lab-orders',
    entityName: 'Lab Order',
    entityNamePlural: 'lab orders',
    searchPlaceholder: 'Search by test type, patient, or code...',
    minSearchLength: 2,
    debounceMs: 300,
    fuzzySearch: true,
    highlightMatches: true,

    searchableFields: [
        { key: 'test_type', label: 'Test Type', weight: 10 },
        { key: 'test_code', label: 'Test Code', weight: 9 },
        { key: 'child.full_name', label: 'Patient', weight: 8 },
        { key: 'doctor.profiles.full_name', label: 'Doctor', weight: 5 },
        { key: 'special_instructions', label: 'Instructions', weight: 3 },
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
                { value: 'collected', label: 'Sample Collected' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
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
        { id: 'date-desc', label: 'Newest First', field: 'ordered_at', direction: 'desc' },
        { id: 'date-asc', label: 'Oldest First', field: 'ordered_at', direction: 'asc' },
        { id: 'patient', label: 'Patient Name', field: 'child.full_name', direction: 'asc' },
    ],

    defaultSort: {
        field: 'ordered_at',
        direction: 'desc',
    },
}
