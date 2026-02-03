-- Add RLS policies for caregivers to view their children's health records

-- Lab Results: Caregivers can view their children's lab results
CREATE POLICY "Caregivers can view own children lab results" ON lab_results
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE caregiver_id = auth.uid()
    )
  );

-- Prescriptions: Caregivers can view their children's prescriptions
CREATE POLICY "Caregivers can view own children prescriptions" ON prescriptions
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE caregiver_id = auth.uid()
    )
  );

-- Lab Orders: Caregivers can view their children's lab orders
CREATE POLICY "Caregivers can view own children lab orders" ON lab_orders
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE caregiver_id = auth.uid()
    )
  );
