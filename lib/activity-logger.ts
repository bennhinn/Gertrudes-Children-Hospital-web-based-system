// lib/activity-logger.ts - Enhanced version
import { SupabaseClient } from '@supabase/supabase-js';

interface ActivityLogParams {
    user_id?: string | null;
    user_email?: string | null;
    user_role?: string | null;
    action: string;
    action_type?: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'download' | 'upload' | 'approve' | 'reject' | 'other';
    action_category?: 'authentication' | 'appointment' | 'patient' | 'prescription' | 'lab' | 'pharmacy' | 'chat' | 'report' | 'system' | 'other';
    target_table?: string | null;
    target_id?: string | null;
    resource_name?: string | null;
    description?: string | null;
    metadata?: Record<string, any>;
    status?: 'success' | 'failure' | 'pending';
    error_message?: string | null;
    changes?: Record<string, any>;
    ip_address?: string | null;
    user_agent?: string | null;
}

/**
 * Server-side activity logger
 * Use this in API routes to log activities
 */
export async function logActivityServer(
    supabase: SupabaseClient,
    params: ActivityLogParams
): Promise<void> {
    try {
        // Auto-detect action_type if not provided
        let actionType = params.action_type;
        if (!actionType) {
            const actionLower = params.action.toLowerCase();
            if (actionLower.includes('create') || actionLower.includes('add') || actionLower.includes('register')) {
                actionType = 'create';
            } else if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('modify')) {
                actionType = 'update';
            } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
                actionType = 'delete';
            } else if (actionLower.includes('view') || actionLower.includes('read') || actionLower.includes('fetch')) {
                actionType = 'view';
            } else if (actionLower.includes('login') || actionLower.includes('signin')) {
                actionType = 'login';
            } else if (actionLower.includes('logout') || actionLower.includes('signout')) {
                actionType = 'logout';
            } else if (actionLower.includes('download') || actionLower.includes('export')) {
                actionType = 'download';
            } else if (actionLower.includes('upload') || actionLower.includes('import')) {
                actionType = 'upload';
            } else if (actionLower.includes('approve')) {
                actionType = 'approve';
            } else if (actionLower.includes('reject') || actionLower.includes('cancel')) {
                actionType = 'reject';
            } else {
                actionType = 'other';
            }
        }

        // Auto-detect action_category if not provided
        let actionCategory = params.action_category;
        if (!actionCategory) {
            const table = params.target_table?.toLowerCase() || '';
            const action = params.action.toLowerCase();
            
            if (action.includes('login') || action.includes('logout') || action.includes('auth')) {
                actionCategory = 'authentication';
            } else if (table.includes('appointment') || action.includes('appointment')) {
                actionCategory = 'appointment';
            } else if (table.includes('child') || table.includes('patient') || action.includes('patient')) {
                actionCategory = 'patient';
            } else if (table.includes('prescription') || action.includes('prescription')) {
                actionCategory = 'prescription';
            } else if (table.includes('lab') || action.includes('lab')) {
                actionCategory = 'lab';
            } else if (table.includes('pharma') || table.includes('medication') || action.includes('pharma')) {
                actionCategory = 'pharmacy';
            } else if (table.includes('chat') || table.includes('message') || action.includes('message')) {
                actionCategory = 'chat';
            } else if (table.includes('report') || action.includes('report')) {
                actionCategory = 'report';
            } else if (action.includes('system') || action.includes('config')) {
                actionCategory = 'system';
            } else {
                actionCategory = 'other';
            }
        }

        const logEntry = {
            user_id: params.user_id || null,
            user_email: params.user_email || null,
            user_role: params.user_role || null,
            action: params.action,
            action_type: actionType,
            action_category: actionCategory,
            target_table: params.target_table || null,
            target_id: params.target_id || null,
            resource_name: params.resource_name || null,
            description: params.description || null,
            metadata: params.metadata || {},
            status: params.status || 'success',
            error_message: params.error_message || null,
            changes: params.changes || null,
            ip_address: params.ip_address || null,
            user_agent: params.user_agent || null,
        };

        const { error } = await supabase
            .from('audit_logs')
            .insert(logEntry);

        if (error) {
            console.error('Failed to log activity:', error);
        }
    } catch (error) {
        // Don't throw errors from logging - just log to console
        console.error('Activity logging error:', error);
    }
}

/**
 * Client-side activity logger
 * Use this in client components to log activities
 */
export async function logActivityClient(params: Omit<ActivityLogParams, 'user_id' | 'user_email' | 'user_role'>): Promise<void> {
    try {
        await fetch('/api/activity-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });
    } catch (error) {
        console.error('Client activity logging error:', error);
    }
}

// Backwards-compatible client alias used across the app
export const logActivity = logActivityClient

/**
 * Middleware helper to extract request metadata
 */
export function getRequestMetadata(request: Request) {
    return {
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   null,
        user_agent: request.headers.get('user-agent') || null,
    };
}

/**
 * Helper to create detailed change log
 */
export function createChangeLog(oldData: any, newData: any): Record<string, any> {
    const changes: Record<string, any> = {};
    
    // Compare old and new data
    const allKeys = new Set([
        ...Object.keys(oldData || {}),
        ...Object.keys(newData || {})
    ]);
    
    allKeys.forEach(key => {
        const oldValue = oldData?.[key];
        const newValue = newData?.[key];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = {
                from: oldValue,
                to: newValue
            };
        }
    });
    
    return changes;
}

// Activity logging constants for consistency
export const ActivityActions = {
    // Authentication
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_REGISTER: 'user_register',
    PASSWORD_RESET: 'password_reset',
    
    // Appointments
    APPOINTMENT_CREATE: 'appointment_create',
    APPOINTMENT_UPDATE: 'appointment_update',
    APPOINTMENT_CANCEL: 'appointment_cancel',
    APPOINTMENT_CONFIRM: 'appointment_confirm',
    APPOINTMENT_COMPLETE: 'appointment_complete',
    APPOINTMENT_VIEW: 'appointment_view',
    
    // Check-ins
    CHECKIN_CREATE: 'checkin_create',
    CHECKIN_CALL: 'checkin_call_patient',
    CHECKIN_COMPLETE: 'checkin_complete',
    
    // Patients
    PATIENT_CREATE: 'patient_create',
    PATIENT_UPDATE: 'patient_update',
    PATIENT_VIEW: 'patient_view',
    
    // Consultations
    CONSULTATION_START: 'consultation_start',
    CONSULTATION_COMPLETE: 'consultation_complete',
    CONSULTATION_UPDATE: 'consultation_update',
    
    // Prescriptions
    PRESCRIPTION_CREATE: 'prescription_create',
    PRESCRIPTION_UPDATE: 'prescription_update',
    PRESCRIPTION_DISPENSE: 'prescription_dispense',
    PRESCRIPTION_CANCEL: 'prescription_cancel',
    
    // Lab
    LAB_ORDER_CREATE: 'lab_order_create',
    LAB_ORDER_COLLECT: 'lab_order_collect',
    LAB_ORDER_PROCESS: 'lab_order_process',
    LAB_ORDER_COMPLETE: 'lab_order_complete',
    LAB_RESULT_VIEW: 'lab_result_view',
    
    // Pharmacy
    MEDICATION_CREATE: 'medication_create',
    MEDICATION_UPDATE: 'medication_update',
    SUPPLY_ORDER_CREATE: 'supply_order_create',
    SUPPLY_ORDER_APPROVE: 'supply_order_approve',
    DELIVERY_RECEIVE: 'delivery_receive',
    
    // Chat/Messages
    MESSAGE_SEND: 'message_send',
    MESSAGE_READ: 'message_read',
    CONVERSATION_CREATE: 'conversation_create',
    
    // Reports
    REPORT_GENERATE: 'report_generate',
    REPORT_VIEW: 'report_view',
    REPORT_DOWNLOAD: 'report_download',
    
    // System
    SYSTEM_CONFIG_UPDATE: 'system_config_update',
    USER_ROLE_UPDATE: 'user_role_update',
} as const;