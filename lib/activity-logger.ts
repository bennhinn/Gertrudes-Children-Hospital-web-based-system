// lib/activity-logger.ts - Enhanced version with all optimisations (FIXED)
import { SupabaseClient } from '@supabase/supabase-js';
import { UAParser } from 'ua-parser-js'; // ✅ correct named import

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------

export interface ActivityLogParams {
    user_id?: string | null;
    user_email?: string | null;
    user_role?: string | null;
    action: string;
    action_type?: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'download' | 'upload' | 'approve' | 'reject' | 'other';
    action_category?: 'authentication' | 'appointment' | 'patient' | 'prescription' | 'lab' | 'pharmacy' | 'chat' | 'report' | 'system' | 'finance' | 'other';
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
    device_type?: string | null;
    browser?: string | null;
    os?: string | null;
}

// Options for server logger
export interface ActivityLogOptions {
    autoUser?: boolean; // automatically fetch and attach user from session
}

// ----------------------------------------------------------------------
// Constants & Mappings
// ----------------------------------------------------------------------

// API endpoint for client‑side logging – align with your actual route
// Keep client endpoint aligned with server intake route
export const ACTIVITY_API_ENDPOINT = '/api/activity-logs';

// Predefined action constants for consistency across the app
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

    // Finance
    PAYMENT_CREATE: 'payment_create',
    PAYMENT_REFUND: 'payment_refund',
    PAYMENT_WEBHOOK_RECEIVED: 'payment_webhook_received',
    INVOICE_CREATE: 'invoice_create',
    INVOICE_UPDATE: 'invoice_update',
} as const;

// Type for the values of ActivityActions (e.g. 'user_login', 'appointment_create', ...)
export type ActivityActionValue = typeof ActivityActions[keyof typeof ActivityActions];

// ----------------------------------------------------------------------
// Lookup tables for deterministic type/category mapping
// Now keyed by the actual action string values, not the constant names
// ----------------------------------------------------------------------

const actionTypeMap: Partial<Record<ActivityActionValue, ActivityLogParams['action_type']>> = {
    [ActivityActions.USER_LOGIN]: 'login',
    [ActivityActions.USER_LOGOUT]: 'logout',
    [ActivityActions.USER_REGISTER]: 'create',
    [ActivityActions.PASSWORD_RESET]: 'update',
    [ActivityActions.APPOINTMENT_CREATE]: 'create',
    [ActivityActions.APPOINTMENT_UPDATE]: 'update',
    [ActivityActions.APPOINTMENT_CANCEL]: 'reject',
    [ActivityActions.APPOINTMENT_CONFIRM]: 'update',
    [ActivityActions.APPOINTMENT_COMPLETE]: 'update',
    [ActivityActions.APPOINTMENT_VIEW]: 'view',
    [ActivityActions.CHECKIN_CREATE]: 'create',
    [ActivityActions.CHECKIN_CALL]: 'update',
    [ActivityActions.CHECKIN_COMPLETE]: 'update',
    [ActivityActions.PATIENT_CREATE]: 'create',
    [ActivityActions.PATIENT_UPDATE]: 'update',
    [ActivityActions.PATIENT_VIEW]: 'view',
    [ActivityActions.CONSULTATION_START]: 'update',
    [ActivityActions.CONSULTATION_COMPLETE]: 'update',
    [ActivityActions.CONSULTATION_UPDATE]: 'update',
    [ActivityActions.PRESCRIPTION_CREATE]: 'create',
    [ActivityActions.PRESCRIPTION_UPDATE]: 'update',
    [ActivityActions.PRESCRIPTION_DISPENSE]: 'update',
    [ActivityActions.PRESCRIPTION_CANCEL]: 'reject',
    [ActivityActions.LAB_ORDER_CREATE]: 'create',
    [ActivityActions.LAB_ORDER_COLLECT]: 'update',
    [ActivityActions.LAB_ORDER_PROCESS]: 'update',
    [ActivityActions.LAB_ORDER_COMPLETE]: 'update',
    [ActivityActions.LAB_RESULT_VIEW]: 'view',
    [ActivityActions.MEDICATION_CREATE]: 'create',
    [ActivityActions.MEDICATION_UPDATE]: 'update',
    [ActivityActions.SUPPLY_ORDER_CREATE]: 'create',
    [ActivityActions.SUPPLY_ORDER_APPROVE]: 'approve',
    [ActivityActions.DELIVERY_RECEIVE]: 'update',
    [ActivityActions.MESSAGE_SEND]: 'create',
    [ActivityActions.MESSAGE_READ]: 'update',
    [ActivityActions.CONVERSATION_CREATE]: 'create',
    [ActivityActions.REPORT_GENERATE]: 'create',
    [ActivityActions.REPORT_VIEW]: 'view',
    [ActivityActions.REPORT_DOWNLOAD]: 'download',
    [ActivityActions.SYSTEM_CONFIG_UPDATE]: 'update',
    [ActivityActions.USER_ROLE_UPDATE]: 'update',
    [ActivityActions.PAYMENT_CREATE]: 'create',
    [ActivityActions.PAYMENT_REFUND]: 'create',
    [ActivityActions.PAYMENT_WEBHOOK_RECEIVED]: 'create',
    [ActivityActions.INVOICE_CREATE]: 'create',
    [ActivityActions.INVOICE_UPDATE]: 'update',
};

const actionCategoryMap: Partial<Record<ActivityActionValue, ActivityLogParams['action_category']>> = {
    [ActivityActions.USER_LOGIN]: 'authentication',
    [ActivityActions.USER_LOGOUT]: 'authentication',
    [ActivityActions.USER_REGISTER]: 'authentication',
    [ActivityActions.PASSWORD_RESET]: 'authentication',
    [ActivityActions.APPOINTMENT_CREATE]: 'appointment',
    [ActivityActions.APPOINTMENT_UPDATE]: 'appointment',
    [ActivityActions.APPOINTMENT_CANCEL]: 'appointment',
    [ActivityActions.APPOINTMENT_CONFIRM]: 'appointment',
    [ActivityActions.APPOINTMENT_COMPLETE]: 'appointment',
    [ActivityActions.APPOINTMENT_VIEW]: 'appointment',
    [ActivityActions.CHECKIN_CREATE]: 'appointment',
    [ActivityActions.CHECKIN_CALL]: 'appointment',
    [ActivityActions.CHECKIN_COMPLETE]: 'appointment',
    [ActivityActions.PATIENT_CREATE]: 'patient',
    [ActivityActions.PATIENT_UPDATE]: 'patient',
    [ActivityActions.PATIENT_VIEW]: 'patient',
    [ActivityActions.CONSULTATION_START]: 'prescription',
    [ActivityActions.CONSULTATION_COMPLETE]: 'prescription',
    [ActivityActions.CONSULTATION_UPDATE]: 'prescription',
    [ActivityActions.PRESCRIPTION_CREATE]: 'prescription',
    [ActivityActions.PRESCRIPTION_UPDATE]: 'prescription',
    [ActivityActions.PRESCRIPTION_DISPENSE]: 'pharmacy',
    [ActivityActions.PRESCRIPTION_CANCEL]: 'prescription',
    [ActivityActions.LAB_ORDER_CREATE]: 'lab',
    [ActivityActions.LAB_ORDER_COLLECT]: 'lab',
    [ActivityActions.LAB_ORDER_PROCESS]: 'lab',
    [ActivityActions.LAB_ORDER_COMPLETE]: 'lab',
    [ActivityActions.LAB_RESULT_VIEW]: 'lab',
    [ActivityActions.MEDICATION_CREATE]: 'pharmacy',
    [ActivityActions.MEDICATION_UPDATE]: 'pharmacy',
    [ActivityActions.SUPPLY_ORDER_CREATE]: 'pharmacy',
    [ActivityActions.SUPPLY_ORDER_APPROVE]: 'pharmacy',
    [ActivityActions.DELIVERY_RECEIVE]: 'pharmacy',
    [ActivityActions.MESSAGE_SEND]: 'chat',
    [ActivityActions.MESSAGE_READ]: 'chat',
    [ActivityActions.CONVERSATION_CREATE]: 'chat',
    [ActivityActions.REPORT_GENERATE]: 'report',
    [ActivityActions.REPORT_VIEW]: 'report',
    [ActivityActions.REPORT_DOWNLOAD]: 'report',
    [ActivityActions.SYSTEM_CONFIG_UPDATE]: 'system',
    [ActivityActions.USER_ROLE_UPDATE]: 'system',
    [ActivityActions.PAYMENT_CREATE]: 'finance',
    [ActivityActions.PAYMENT_REFUND]: 'finance',
    [ActivityActions.PAYMENT_WEBHOOK_RECEIVED]: 'finance',
    [ActivityActions.INVOICE_CREATE]: 'finance',
    [ActivityActions.INVOICE_UPDATE]: 'finance',
};

// ----------------------------------------------------------------------
// Core Server Logger (with auto‑user option)
// ----------------------------------------------------------------------

/**
 * Server-side activity logger.
 *
 * Automatically injects current user from Supabase session when `autoUser` is true (default).
 *
 * @param supabase - Authenticated Supabase client
 * @param params   - Log entry data (user fields optional)
 * @param options  - { autoUser: true } to auto‑fetch user from session
 */
export async function logActivityServer(
    supabase: SupabaseClient,
    params: ActivityLogParams,
    options: ActivityLogOptions = { autoUser: true }
): Promise<void> {
    try {
        // 1. Auto‑populate user from session if enabled and fields missing
        if (options.autoUser && !params.user_id && !params.user_email) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                params.user_id = user.id;
                params.user_email = user.email;
                params.user_role = user.user_metadata?.role || null;
            }
        }

        // 2. Derive action_type from lookup or infer as fallback
        let actionType = params.action_type;
        if (!actionType) {
            actionType = actionTypeMap[params.action as ActivityActionValue];
            if (!actionType) {
                // Fallback to old inference logic
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
        }

        // 3. Derive action_category from lookup or infer
        let actionCategory = params.action_category;
        if (!actionCategory) {
            actionCategory = actionCategoryMap[params.action as ActivityActionValue];
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
                } else if (table.includes('payment') || table.includes('invoice') || action.includes('payment') || action.includes('invoice')) {
                    actionCategory = 'finance';
                } else if (action.includes('system') || action.includes('config')) {
                    actionCategory = 'system';
                } else {
                    actionCategory = 'other';
                }
            }
        }

        // 4. Build final log entry
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
            device_type: params.device_type || null,
            browser: params.browser || null,
            os: params.os || null,
        };

        const { error } = await supabase
            .from('audit_logs')
            .insert(logEntry);

        if (error) {
            console.error('Failed to log activity:', error);
        }
    } catch (error) {
        // Never throw from logger
        console.error('Activity logging error:', error);
    }
}

// ----------------------------------------------------------------------
// Client Logger
// ----------------------------------------------------------------------

/**
 * Client-side activity logger
 * Sends activity to the server API endpoint.
 */
export async function logActivityClient(params: Omit<ActivityLogParams, 'user_id' | 'user_email' | 'user_role'>): Promise<void> {
    try {
        await fetch(ACTIVITY_API_ENDPOINT, {
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

// Backwards-compatible alias for existing client code
export const logActivity = logActivityClient;

// ----------------------------------------------------------------------
// Request Metadata Helpers
// ----------------------------------------------------------------------

/**
 * Extract IP, User-Agent, and parsed device/browser/OS from a Request object.
 */
export function getRequestMetadata(request: Request) {
    const userAgentString = request.headers.get('user-agent') || '';
    const parser = new UAParser(userAgentString); // ✅ now works with named import
    const ua = parser.getResult();

    return {
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                    request.headers.get('x-real-ip') ||
                    null,
        user_agent: userAgentString || null,
        device_type: ua.device.type || 'desktop', // mobile, tablet, desktop
        browser: ua.browser.name || null,
        os: ua.os.name || null,
    };
}

// ----------------------------------------------------------------------
// Change Log Helper
// ----------------------------------------------------------------------

/**
 * Generate a detailed diff between old and new objects.
 */
export function createChangeLog(oldData: any, newData: any): Record<string, any> {
    const changes: Record<string, any> = {};
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

// ----------------------------------------------------------------------
// Specialised Helpers (e.g., for Payment Transactions)
// ----------------------------------------------------------------------

/**
 * Dual logger for payment transactions:
 *  - Writes to transaction_logs (existing requirement)
 *  - Also writes to audit_logs via logActivityServer
 */
export async function logPaymentTransaction(
    supabase: SupabaseClient,
    params: {
        payment_id: string;
        action: string;
        status: string;          // 'pending', 'completed', 'failed', etc.
        amount?: number;
        user_id?: string | null;
        user_email?: string | null;
        user_role?: string | null;
        metadata?: Record<string, any>;
        ip_address?: string | null;
        user_agent?: string | null;
    }
): Promise<void> {
    try {
        // 1. Write to transaction_logs (explicitly)
        const { error: txError } = await supabase
            .from('transaction_logs')
            .insert({
                payment_id: params.payment_id,
                action: params.action,
                status: params.status,
                amount: params.amount,
                user_id: params.user_id,
                user_type: params.user_role, // or map appropriately
                ip_address: params.ip_address,
                metadata: params.metadata || {},
                created_at: new Date().toISOString(),
            });

        if (txError) {
            console.error('Failed to insert transaction_log:', txError);
        }

        // 2. Write to audit_logs via the standard logger
        await logActivityServer(supabase, {
            user_id: params.user_id,
            user_email: params.user_email,
            user_role: params.user_role,
            action: params.action,
            action_category: 'finance',
            target_table: 'payments',
            target_id: params.payment_id,
            metadata: {
                ...params.metadata,
                amount: params.amount,
                tx_status: params.status,
            },
            status: params.status === 'completed' || params.status === 'success' ? 'success' : 'failure',
            ip_address: params.ip_address,
            user_agent: params.user_agent,
            // Let auto‑detection set action_type and category, or you can set explicitly
        }, { autoUser: false }); // user already passed explicitly, no need to auto-fetch

    } catch (error) {
        console.error('Payment transaction logging error:', error);
    }
}