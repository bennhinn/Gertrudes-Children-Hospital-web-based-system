/**
 * Users Search Configuration
 * Used by: Admin dashboard
 */

import type { SearchConfig } from '@/types/search.types'

export interface UserSearchItem {
    id: string
    email: string
    full_name: string
    role: string
    phone?: string | null
    created_at: string
    last_sign_in_at?: string | null
}

export const userSearchConfig: SearchConfig<UserSearchItem> = {
    id: 'users',
    entityName: 'User',
    entityNamePlural: 'users',
    searchPlaceholder: 'Search by name, email, or phone...',
    minSearchLength: 2,
    debounceMs: 300,
    fuzzySearch: true,
    highlightMatches: true,

    searchableFields: [
        { key: 'full_name', label: 'Name', weight: 10 },
        { key: 'email', label: 'Email', weight: 8 },
        { key: 'phone', label: 'Phone', weight: 6 },
        { key: 'role', label: 'Role', weight: 5 },
    ],

    filters: [
        {
            id: 'role',
            label: 'Role',
            field: 'role',
            type: 'select',
            options: [
                { value: 'admin', label: 'Admin' },
                { value: 'doctor', label: 'Doctor' },
                { value: 'caregiver', label: 'Caregiver' },
                { value: 'receptionist', label: 'Receptionist' },
                { value: 'lab_tech', label: 'Lab Technician' },
                { value: 'pharmacist', label: 'Pharmacist' },
                { value: 'supplier', label: 'Supplier' },
            ],
        },
    ],

    sortOptions: [
        { id: 'name-asc', label: 'Name (A-Z)', field: 'full_name', direction: 'asc' },
        { id: 'name-desc', label: 'Name (Z-A)', field: 'full_name', direction: 'desc' },
        { id: 'created-desc', label: 'Newest First', field: 'created_at', direction: 'desc' },
        { id: 'created-asc', label: 'Oldest First', field: 'created_at', direction: 'asc' },
    ],

    defaultSort: {
        field: 'full_name',
        direction: 'asc',
    },
}

// Staff-specific search
export const staffSearchConfig: SearchConfig<UserSearchItem> = {
    ...userSearchConfig,
    id: 'staff',
    entityName: 'Staff Member',
    entityNamePlural: 'staff members',
    searchPlaceholder: 'Search staff...',
    filters: [
        {
            id: 'role',
            label: 'Role',
            field: 'role',
            type: 'select',
            options: [
                { value: 'doctor', label: 'Doctor' },
                { value: 'receptionist', label: 'Receptionist' },
                { value: 'lab_tech', label: 'Lab Technician' },
                { value: 'pharmacist', label: 'Pharmacist' },
            ],
        },
    ],
}
