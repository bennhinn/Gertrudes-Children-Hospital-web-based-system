-- Fix check_ins UPDATE RLS policy for receptionists
-- This ensures receptionists can update check-in status

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Staff can update check-ins" ON check_ins;
DROP POLICY IF EXISTS "Receptionists can update check-ins" ON check_ins;

-- Create new comprehensive update policy
CREATE POLICY "Receptionists can update check-ins" ON check_ins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('receptionist', 'doctor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('receptionist', 'doctor', 'admin')
    )
  );
