-- Fix RLS policies for audit_logs table
-- Allow authenticated users to insert their own activity logs

-- Enable RLS if not already enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert audit logs
CREATE POLICY "Allow authenticated users to insert audit logs"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view their own audit logs
CREATE POLICY "Allow users to view their own audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_role = 'admin');

-- Allow admins to view all audit logs
CREATE POLICY "Allow admins to view all audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);
