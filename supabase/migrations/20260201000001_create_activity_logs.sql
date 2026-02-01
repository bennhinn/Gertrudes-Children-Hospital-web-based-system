-- Add additional columns to existing audit_logs table for enhanced tracking
-- Only adds columns if they don't exist

DO $$ 
BEGIN
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'description') THEN
        ALTER TABLE public.audit_logs ADD COLUMN description TEXT;
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'metadata') THEN
        ALTER TABLE public.audit_logs ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;

    -- Add user_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_email') THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_email TEXT;
    END IF;

    -- Add user_role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_role') THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_role TEXT;
    END IF;
END $$;

-- Create indexes for efficient querying (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_table ON public.audit_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Create generated_reports table to store report history
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL,
    report_name TEXT NOT NULL,
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    generated_by_email TEXT,
    period_start DATE,
    period_end DATE,
    file_path TEXT,
    file_size INTEGER,
    parameters JSONB DEFAULT '{}',
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for generated_reports
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at DESC);

-- Enable RLS on generated_reports
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_reports (using profiles table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generated_reports' AND policyname = 'Admins can view all reports') THEN
        CREATE POLICY "Admins can view all reports" ON generated_reports
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generated_reports' AND policyname = 'Admins can insert reports') THEN
        CREATE POLICY "Admins can insert reports" ON generated_reports
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE generated_reports IS 'Stores history of generated reports';
