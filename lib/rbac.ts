// Role constants and utilities for GCH Healthcare System
export const ROLE = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  LAB_TECH: 'lab_tech',
  PHARMACIST: 'pharmacist',
  SUPPLIER: 'supplier',
  CAREGIVER: 'caregiver',
  // Legacy role - maps to specific sub-roles
  STAFF: 'staff',
} as const

export type UserRole = (typeof ROLE)[keyof typeof ROLE]

// Permissions for each role
export const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'manage_staff',
    'view_all_appointments',
    'manage_admissions',
    'view_reports',
    'manage_settings',
    'view_all_patients',
    'manage_inventory',
  ],
  doctor: [
    'view_appointments',
    'manage_consultations',
    'create_prescriptions',
    'order_lab_tests',
    'view_lab_results',
    'update_patient_records',
    'view_patient_history',
  ],
  receptionist: [
    'view_appointments',
    'create_appointments',
    'manage_check_ins',
    'search_patients',
    'view_queue',
    'register_patients',
  ],
  lab_tech: [
    'view_lab_orders',
    'collect_samples',
    'process_tests',
    'enter_results',
    'view_test_history',
  ],
  pharmacist: [
    'view_prescriptions',
    'dispense_medications',
    'check_inventory',
    'manage_pharmacy_inventory',
    'view_drug_interactions',
  ],
  supplier: [
    'view_orders',
    'manage_inventory',
    'create_deliveries',
    'view_invoices',
  ],
  caregiver: [
    'book_appointments',
    'view_own_appointments',
    'view_children',
    'view_prescriptions',
    'view_lab_results',
  ],
  // Legacy staff role - minimal permissions
  staff: [
    'view_appointments',
    'manage_admissions',
    'update_patient_records',
  ],
} as const

// Dashboard routes for each role
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: '/admin',
  doctor: '/doctor',
  receptionist: '/receptionist',
  lab_tech: '/lab',
  pharmacist: '/pharmacy',
  supplier: '/supplier',
  caregiver: '/dashboard',
  staff: '/staff-appointments', // Legacy fallback
}

// Route protection configuration
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/doctor': ['doctor', 'admin'],
  '/receptionist': ['receptionist', 'admin'],
  '/lab': ['lab_tech', 'admin'],
  '/pharmacy': ['pharmacist', 'admin'],
  '/supplier': ['supplier', 'admin'],
  '/dashboard': ['caregiver'],
  '/caregiver-appointments': ['caregiver'],
  '/patients': ['caregiver'],
  '/staff-appointments': ['staff', 'admin'],
}

// Helper function to check if user has permission
export function hasPermission(
  role: UserRole,
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions?.includes(permission as never) ?? false
}

// Helper function to check if user can access route
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  // Admin can access everything
  if (role === 'admin') return true

  // Check protected routes
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(role)
    }
  }

  // Default: allow access to unprotected routes
  return true
}

// Get dashboard URL for a role
export function getDashboardForRole(role: UserRole): string {
  return ROLE_DASHBOARDS[role] || '/login'
}

// Display names for roles
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  lab_tech: 'Lab Technician',
  pharmacist: 'Pharmacist',
  supplier: 'Supplier',
  caregiver: 'Caregiver',
  staff: 'Staff',
}