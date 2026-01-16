-- Migration to add tables for staff dashboards (works with existing schema)
-- This adds new tables and columns needed for receptionist, doctor, lab, and pharmacy workflows

-- 1. Add check_ins table for receptionist queue management
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

CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON check_ins(status);
CREATE INDEX IF NOT EXISTS idx_check_ins_appointment ON check_ins(appointment_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_child ON check_ins(child_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_status_date ON check_ins(status, checked_in_at DESC);

-- 2. Add consultations table for doctor workflow
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  diagnosis TEXT,
  notes TEXT,
  treatment_plan TEXT,
  follow_up_instructions TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_child ON consultations(child_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(completed_at);

-- 3. Add prescription_items table (works alongside existing prescriptions table)
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  quantity INTEGER,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);

-- 4. Alter existing prescriptions table to add needed columns
DO $$ 
BEGIN
  -- Add consultation_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='prescriptions' AND column_name='consultation_id') THEN
    ALTER TABLE prescriptions ADD COLUMN consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL;
  END IF;

  -- Add status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='prescriptions' AND column_name='status') THEN
    ALTER TABLE prescriptions ADD COLUMN status TEXT DEFAULT 'pending' 
      CHECK (status IN ('pending', 'preparing', 'dispensed', 'collected', 'cancelled'));
  END IF;

  -- Add urgency if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='prescriptions' AND column_name='urgency') THEN
    ALTER TABLE prescriptions ADD COLUMN urgency TEXT DEFAULT 'routine' 
      CHECK (urgency IN ('stat', 'urgent', 'routine'));
  END IF;

  -- Add prescribed_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='prescriptions' AND column_name='prescribed_at') THEN
    ALTER TABLE prescriptions ADD COLUMN prescribed_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add dispensed_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='prescriptions' AND column_name='dispensed_at') THEN
    ALTER TABLE prescriptions ADD COLUMN dispensed_at TIMESTAMPTZ;
  END IF;

  -- Add notes if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='prescriptions' AND column_name='notes') THEN
    ALTER TABLE prescriptions ADD COLUMN notes TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- 5. Add lab_orders table (separate from existing lab_results)
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  test_type TEXT NOT NULL,
  test_code TEXT,
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('stat', 'urgent', 'routine')),
  special_instructions TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'in_progress', 'completed', 'cancelled')),
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES doctors(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor ON lab_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_child ON lab_orders(child_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_consultation ON lab_orders(consultation_id);

-- 6. Alter existing receptionists table to add department column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='receptionists' AND column_name='department') THEN
    ALTER TABLE receptionists ADD COLUMN department TEXT DEFAULT 'Front Desk';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='receptionists' AND column_name='created_at') THEN
    ALTER TABLE receptionists ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Enable Row Level Security on new tables
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;

-- Policies for check_ins
CREATE POLICY "Staff can view all check-ins" ON check_ins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
            AND role IN ('receptionist', 'doctor', 'admin', 'lab_tech', 'pharmacist'))
  );

CREATE POLICY "Receptionist can insert check-ins" ON check_ins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('receptionist', 'admin'))
  );

CREATE POLICY "Staff can update check-ins" ON check_ins
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
            AND role IN ('receptionist', 'doctor', 'admin'))
  );

-- Policies for consultations
CREATE POLICY "Doctors and admins can view consultations" ON consultations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors can insert consultations" ON consultations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "Doctors and admins can update consultations" ON consultations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

-- Policies for prescription_items
CREATE POLICY "Staff can view prescription items" ON prescription_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
            AND role IN ('doctor', 'pharmacist', 'admin'))
  );

CREATE POLICY "Doctors can insert prescription items" ON prescription_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

-- Policies for lab_orders
CREATE POLICY "Staff can view lab orders" ON lab_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
            AND role IN ('doctor', 'lab_tech', 'admin'))
  );

CREATE POLICY "Doctors can insert lab orders" ON lab_orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "Lab techs can update lab orders" ON lab_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
            AND role IN ('lab_tech', 'doctor', 'admin'))
  );

-- Grant permissions
GRANT ALL ON check_ins TO authenticated;
GRANT ALL ON consultations TO authenticated;
GRANT ALL ON prescription_items TO authenticated;
GRANT ALL ON lab_orders TO authenticated;

-- Add comments
COMMENT ON TABLE check_ins IS 'Tracks patient check-ins at reception with queue management';
COMMENT ON TABLE consultations IS 'Records doctor-patient consultations with diagnosis';
COMMENT ON TABLE prescription_items IS 'Individual medication items in prescriptions';
COMMENT ON TABLE lab_orders IS 'Lab test orders from doctors with urgency tracking';
