-- Create consultations table for doctor-patient interactions
-- This table records all consultation details

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

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  quantity INTEGER,
  instructions TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'dispensed', 'collected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lab_orders table
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
  reviewed_by UUID REFERENCES doctors(id)
);

-- Create lab_results table
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id UUID REFERENCES lab_orders(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES lab_technicians(id) ON DELETE SET NULL,
  results JSONB NOT NULL,
  abnormal_flags JSONB,
  reference_ranges JSONB,
  technician_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_child ON consultations(child_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(completed_at);

CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_child ON prescriptions(child_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor ON lab_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_child ON lab_orders(child_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);

CREATE INDEX IF NOT EXISTS idx_lab_results_order ON lab_results(lab_order_id);

-- Enable Row Level Security
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

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

-- Policies for prescriptions
CREATE POLICY "Staff can view prescriptions" ON prescriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'pharmacist', 'admin'))
  );

CREATE POLICY "Doctors can insert prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "Pharmacists can update prescriptions" ON prescriptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pharmacist', 'admin'))
  );

-- Policies for lab_orders
CREATE POLICY "Staff can view lab orders" ON lab_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'lab_tech', 'admin'))
  );

CREATE POLICY "Doctors can insert lab orders" ON lab_orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "Lab techs can update lab orders" ON lab_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lab_tech', 'doctor', 'admin'))
  );

-- Policies for lab_results
CREATE POLICY "Staff can view lab results" ON lab_results
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('doctor', 'lab_tech', 'admin')
    )
  );
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'lab_tech', 'admin'))
  );

CREATE POLICY "Lab techs can insert results" ON lab_results
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lab_tech', 'admin')T ALL ON consultations TO authenticated;
GRANT ALL ON prescriptions TO authenticated;
GRANT ALL ON lab_orders TO authenticated;
GRANT ALL ON lab_results TO authenticated;

-- Add comments
COMMENT ON TABLE consultations IS 'Records doctor-patient consultations with diagnosis and treatment plans';
COMMENT ON TABLE prescriptions IS 'Stores medication prescriptions from consultations';
COMMENT ON TABLE lab_orders IS 'Tracks laboratory test orders from doctors';
COMMENT ON TABLE lab_results IS 'Stores laboratory test results entered by technicians';
