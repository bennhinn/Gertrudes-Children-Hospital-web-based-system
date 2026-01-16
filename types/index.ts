// Shared types (Appointment, Child, UserRole)

export type UserRole = 'admin' | 'caregiver' | 'doctor' | 'lab_tech' | 'pharmacist' | 'supplier' | 'receptionist'

export interface Profile {
    id: string
    full_name: string | null
    phone: string | null
    role: UserRole | null
    created_at: string
}

export interface Caregiver {
    id: string
    address: string | null
}

export interface Child {
    id: string
    caregiver_id: string | null
    full_name: string | null
    dob: string | null
    gender: string | null
    medical_notes: string | null
    created_at: string
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
    id: string
    child_id: string | null
    caregiver_id: string | null
    doctor_id: string | null
    scheduled_for: string | null
    status: AppointmentStatus
    notes: string | null
    qr_code: string | null
    created_at: string
    // Joined data
    child?: Child
}
