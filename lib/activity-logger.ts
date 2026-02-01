/**
 * Activity Logger Utility
 * 
 * Use this utility to log activities throughout the application.
 * Activities are stored in the audit_logs table for audit and analytics.
 * 
 * Uses existing audit_logs table schema:
 * - id: uuid (primary key)
 * - user_id: uuid (references profiles)
 * - action: text (the action performed)
 * - target_table: text (the resource type)
 * - target_id: uuid (the resource id)
 * - description: text (optional description)
 * - metadata: jsonb (optional additional data)
 * - user_email: text (optional)
 * - user_role: text (optional)
 * - created_at: timestamp
 */

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'download' | 'view' | 'other';

export type ResourceType =
    | 'appointment'
    | 'patient'
    | 'child'
    | 'user'
    | 'prescription'
    | 'lab_order'
    | 'report'
    | 'settings'
    | 'medication'
    | 'supplier'
    | 'order'
    | 'consultation'
    | 'check_in'
    | 'system'
    | 'auth';

export interface ActivityLogEntry {
    action: string;
    target_table: ResourceType;
    target_id?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    user_email?: string;
    user_role?: string;
}

/**
 * Log an activity to the system
 * @param entry - The activity log entry
 * @returns Promise<boolean> - Returns true if logging was successful
 */
export async function logActivity(entry: ActivityLogEntry): Promise<boolean> {
    try {
        const response = await fetch('/api/admin/activity-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to log activity:', error);
        return false;
    }
}

/**
 * Log activity from server-side (API routes)
 * This function should be used in API routes where we have access to supabase client
 */
export async function logActivityServer(
    supabase: any,
    entry: ActivityLogEntry & {
        user_id?: string;
    }
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: entry.user_id || null,
                action: entry.action,
                target_table: entry.target_table,
                target_id: entry.target_id || null,
                description: entry.description || null,
                metadata: entry.metadata || {},
                user_email: entry.user_email || null,
                user_role: entry.user_role || null,
            });

        if (error) {
            console.error('Failed to log activity:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to log activity:', error);
        return false;
    }
}

// Pre-defined activity templates for common actions
export const ActivityTemplates = {
    // Auth activities
    userLogin: (email: string): ActivityLogEntry => ({
        action: 'user_login',
        target_table: 'auth',
        description: `User ${email} logged in`,
        metadata: { email },
    }),

    userLogout: (email: string): ActivityLogEntry => ({
        action: 'user_logout',
        target_table: 'auth',
        description: `User ${email} logged out`,
        metadata: { email },
    }),

    userRegister: (email: string, role: string): ActivityLogEntry => ({
        action: 'user_register',
        target_table: 'user',
        description: `New user registered: ${email} as ${role}`,
        metadata: { email, role },
    }),

    // Appointment activities
    appointmentCreated: (appointmentId: string, patientName: string): ActivityLogEntry => ({
        action: 'appointment_created',
        target_table: 'appointment',
        target_id: appointmentId,
        description: `New appointment created for ${patientName}`,
        metadata: { patientName },
    }),

    appointmentUpdated: (appointmentId: string, changes: string): ActivityLogEntry => ({
        action: 'appointment_updated',
        target_table: 'appointment',
        target_id: appointmentId,
        description: `Appointment updated: ${changes}`,
        metadata: { changes },
    }),

    appointmentCancelled: (appointmentId: string, reason?: string): ActivityLogEntry => ({
        action: 'appointment_cancelled',
        target_table: 'appointment',
        target_id: appointmentId,
        description: `Appointment cancelled${reason ? `: ${reason}` : ''}`,
        metadata: { reason },
    }),

    appointmentCompleted: (appointmentId: string, patientName: string): ActivityLogEntry => ({
        action: 'appointment_completed',
        target_table: 'appointment',
        target_id: appointmentId,
        description: `Appointment completed for ${patientName}`,
        metadata: { patientName },
    }),

    // Patient activities
    patientCreated: (patientId: string, patientName: string): ActivityLogEntry => ({
        action: 'patient_created',
        target_table: 'patient',
        target_id: patientId,
        description: `New patient registered: ${patientName}`,
        metadata: { patientName },
    }),

    patientUpdated: (patientId: string, patientName: string): ActivityLogEntry => ({
        action: 'patient_updated',
        target_table: 'patient',
        target_id: patientId,
        description: `Patient profile updated: ${patientName}`,
        metadata: { patientName },
    }),

    patientViewed: (patientId: string, patientName: string): ActivityLogEntry => ({
        action: 'patient_viewed',
        target_table: 'patient',
        target_id: patientId,
        description: `Patient record viewed: ${patientName}`,
        metadata: { patientName },
    }),

    // Check-in activities
    patientCheckedIn: (checkInId: string, patientName: string): ActivityLogEntry => ({
        action: 'patient_checked_in',
        target_table: 'check_in',
        target_id: checkInId,
        description: `Patient checked in: ${patientName}`,
        metadata: { patientName },
    }),

    // Prescription activities
    prescriptionCreated: (prescriptionId: string, patientName: string): ActivityLogEntry => ({
        action: 'prescription_created',
        target_table: 'prescription',
        target_id: prescriptionId,
        description: `Prescription created for ${patientName}`,
        metadata: { patientName },
    }),

    prescriptionDispensed: (prescriptionId: string, patientName: string): ActivityLogEntry => ({
        action: 'prescription_dispensed',
        target_table: 'prescription',
        target_id: prescriptionId,
        description: `Prescription dispensed for ${patientName}`,
        metadata: { patientName },
    }),

    // Lab activities
    labOrderCreated: (orderId: string, patientName: string, testType: string): ActivityLogEntry => ({
        action: 'lab_order_created',
        target_table: 'lab_order',
        target_id: orderId,
        description: `Lab order created: ${testType} for ${patientName}`,
        metadata: { patientName, testType },
    }),

    labResultsEntered: (orderId: string, patientName: string): ActivityLogEntry => ({
        action: 'lab_results_entered',
        target_table: 'lab_order',
        target_id: orderId,
        description: `Lab results entered for ${patientName}`,
        metadata: { patientName },
    }),

    // Report activities
    reportViewed: (reportType: string): ActivityLogEntry => ({
        action: 'report_viewed',
        target_table: 'report',
        description: `Report viewed: ${reportType}`,
        metadata: { reportType },
    }),

    reportDownloaded: (reportType: string, reportId?: string): ActivityLogEntry => ({
        action: 'report_downloaded',
        target_table: 'report',
        target_id: reportId,
        description: `Report downloaded: ${reportType}`,
        metadata: { reportType },
    }),

    reportGenerated: (reportType: string, reportId: string): ActivityLogEntry => ({
        action: 'report_generated',
        target_table: 'report',
        target_id: reportId,
        description: `Report generated: ${reportType}`,
        metadata: { reportType },
    }),

    // Settings activities
    settingsUpdated: (settingName: string): ActivityLogEntry => ({
        action: 'settings_updated',
        target_table: 'settings',
        description: `Settings updated: ${settingName}`,
        metadata: { settingName },
    }),

    // User management activities
    userCreated: (userId: string, email: string, role: string): ActivityLogEntry => ({
        action: 'user_created',
        target_table: 'user',
        target_id: userId,
        description: `New user created: ${email} as ${role}`,
        metadata: { email, role },
    }),

    userUpdated: (userId: string, email: string, changes: string): ActivityLogEntry => ({
        action: 'user_updated',
        target_table: 'user',
        target_id: userId,
        description: `User updated: ${email} - ${changes}`,
        metadata: { email, changes },
    }),

    userDeleted: (userId: string, email: string): ActivityLogEntry => ({
        action: 'user_deleted',
        target_table: 'user',
        target_id: userId,
        description: `User deleted: ${email}`,
        metadata: { email },
    }),

    // Medication/Inventory activities
    medicationCreated: (medicationId: string, name: string): ActivityLogEntry => ({
        action: 'medication_created',
        target_table: 'medication',
        target_id: medicationId,
        description: `Medication added: ${name}`,
        metadata: { name },
    }),

    medicationUpdated: (medicationId: string, name: string): ActivityLogEntry => ({
        action: 'medication_updated',
        target_table: 'medication',
        target_id: medicationId,
        description: `Medication updated: ${name}`,
        metadata: { name },
    }),

    // Order activities
    orderCreated: (orderId: string, supplierName: string): ActivityLogEntry => ({
        action: 'order_created',
        target_table: 'order',
        target_id: orderId,
        description: `Order placed with ${supplierName}`,
        metadata: { supplierName },
    }),

    orderStatusChanged: (orderId: string, status: string): ActivityLogEntry => ({
        action: 'order_status_changed',
        target_table: 'order',
        target_id: orderId,
        description: `Order status changed to: ${status}`,
        metadata: { status },
    }),
};
