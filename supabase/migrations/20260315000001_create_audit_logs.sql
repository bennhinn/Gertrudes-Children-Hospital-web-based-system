-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit_logs table (matches activity-logger.ts payload)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    action_type TEXT,
    action_category TEXT,
    target_table TEXT,
    target_id UUID,
    resource_name TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    status TEXT,
    error_message TEXT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries and reports
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(action_category);
