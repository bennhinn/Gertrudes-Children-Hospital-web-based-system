/**
 * Children/Patients Search Configuration
 * Used by: Caregiver, Doctor, Admin dashboards
 */

import type { SearchConfig } from '@/types/search.types'

export interface ChildSearchItem {
    id: string
    full_name: string
    date_of_birth: string
    gender: string
    blood_type?: string | null
    allergies?: string | null
    medical_notes?: string | null
    caregiver_id?: string
    caregiver?: {
        id?: string
        profiles?: {
            full_name: string
            phone?: string
        }
    }
}

export const childrenSearchConfig: SearchConfig<ChildSearchItem> = {
    id: 'children',
    entityName: 'Child',
    entityNamePlural: 'children',
    searchPlaceholder: 'Search by name, medical notes, or allergies...',
    minSearchLength: 2,
    debounceMs: 300,
    fuzzySearch: true,
    highlightMatches: true,

    searchableFields: [
        { key: 'full_name', label: 'Name', weight: 10 },
        { key: 'medical_notes', label: 'Medical Notes', weight: 5 },
        { key: 'allergies', label: 'Allergies', weight: 5 },
        { key: 'blood_type', label: 'Blood Type', weight: 3 },
        { key: 'caregiver.profiles.full_name', label: 'Caregiver', weight: 4 },
    ],

    filters: [
        {
            id: 'gender',
            label: 'Gender',
            field: 'gender',
            type: 'select',
            options: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
            ],
        },
    ],

    sortOptions: [
        { id: 'name-asc', label: 'Name (A-Z)', field: 'full_name', direction: 'asc' },
        { id: 'name-desc', label: 'Name (Z-A)', field: 'full_name', direction: 'desc' },
        { id: 'age-asc', label: 'Age (Youngest)', field: 'date_of_birth', direction: 'desc' },
        { id: 'age-desc', label: 'Age (Oldest)', field: 'date_of_birth', direction: 'asc' },
    ],

    defaultSort: {
        field: 'full_name',
        direction: 'asc',
    },
}

// Doctor's patient lookup
export const patientSearchConfig: SearchConfig<ChildSearchItem> = {
    ...childrenSearchConfig,
    id: 'patients',
    entityName: 'Patient',
    entityNamePlural: 'patients',
    searchPlaceholder: 'Search patients...',
}
