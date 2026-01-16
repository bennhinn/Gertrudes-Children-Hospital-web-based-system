-- Create check_ins table for receptionist queue management
-- This table tracks patient check-ins at the reception desk

CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled')),
  queue_number INTEGER NOT NULL,
  vitals JSONB DEFAULT NULL,
  reason TEXT DEFAULT 'General checkup',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON check_ins(status);
CREATE INDEX IF NOT EXISTS idx_check_ins_appointment ON check_ins(appointment_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_child ON check_ins(child_id);

-- Composite index for common query pattern (status + date)
CREATE INDEX IF NOT EXISTS idx_check_ins_status_date ON check_ins(status, checked_in_at DESC);

-- Enable Row Level Security
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Policy: Staff (receptionist, doctor, admin) can view all check-ins
CREATE POLICY "Staff can view all check-ins" ON check_ins
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('receptionist', 'doctor', 'admin', 'lab_tech', 'pharmacist')
    )
  );

-- Policy: Receptionist and admin can insert check-ins
CREATE POLICY "Receptionist can insert check-ins" ON check_ins
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('receptionist', 'admin')
    )
  );

-- Policy: Staff can update check-ins
CREATE POLICY "Staff can update check-ins" ON check_ins
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('receptionist', 'doctor', 'admin')
    )
  );

-- Create receptionists table for receptionist-specific data
CREATE TABLE IF NOT EXISTS receptionists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT DEFAULT 'Front Desk',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on receptionists
ALTER TABLE receptionists ENABLE ROW LEVEL SECURITY;

-- Policy for receptionists table
CREATE POLICY "Users can view their own receptionist profile" ON receptionists
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all receptionists" ON receptionists
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Grant permissions
GRANT ALL ON check_ins TO authenticated;
GRANT ALL ON receptionists TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE check_ins IS 'Tracks patient check-ins at the reception desk, including queue management and vitals';
COMMENT ON TABLE receptionists IS 'Stores receptionist-specific profile data';
