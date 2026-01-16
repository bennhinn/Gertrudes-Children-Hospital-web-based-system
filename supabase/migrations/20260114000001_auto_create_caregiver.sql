-- Auto-create profile and role-specific entries when user registers
-- This trigger ensures data consistency between auth.users and application tables

-- Function to create profile and role-specific entries
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Get values with fallbacks
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown');
  user_role := COALESCE(NEW.raw_app_meta_data->>'role', 'caregiver');
  
  -- Create profile entry (with ON CONFLICT to handle duplicates)
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, user_name, user_role)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create role-specific entry based on role (with ON CONFLICT to handle duplicates)
  CASE user_role
    WHEN 'caregiver' THEN
      INSERT INTO caregivers (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    WHEN 'doctor' THEN
      INSERT INTO doctors (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    WHEN 'lab_tech' THEN
      INSERT INTO lab_technicians (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    WHEN 'pharmacist' THEN
      INSERT INTO pharmacists (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    WHEN 'supplier' THEN
      INSERT INTO suppliers (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    WHEN 'receptionist' THEN
      INSERT INTO receptionists (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    -- admin doesn't need a separate table
    ELSE
      NULL;
  END CASE;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the user creation
  RAISE WARNING 'create_user_profile failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (to avoid errors on re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Backfill existing users (run only once)
-- This will create missing profile entries for existing test users
INSERT INTO profiles (id, full_name, role)
SELECT 
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.raw_app_meta_data->>'role'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Backfill role-specific tables for existing users
INSERT INTO caregivers (id)
SELECT u.id FROM auth.users u
WHERE (u.raw_app_meta_data->>'role') = 'caregiver'
  AND NOT EXISTS (SELECT 1 FROM caregivers WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id)
SELECT u.id FROM auth.users u
WHERE (u.raw_app_meta_data->>'role') = 'doctor'
  AND NOT EXISTS (SELECT 1 FROM doctors WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_technicians (id)
SELECT u.id FROM auth.users u
WHERE (u.raw_app_meta_data->>'role') = 'lab_tech'
  AND NOT EXISTS (SELECT 1 FROM lab_technicians WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pharmacists (id)
SELECT u.id FROM auth.users u
WHERE (u.raw_app_meta_data->>'role') = 'pharmacist'
  AND NOT EXISTS (SELECT 1 FROM pharmacists WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id)
SELECT u.id FROM auth.users u
WHERE (u.raw_app_meta_data->>'role') = 'supplier'
  AND NOT EXISTS (SELECT 1 FROM suppliers WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO receptionists (id)
SELECT u.id FROM auth.users u
WHERE (u.raw_app_meta_data->>'role') = 'receptionist'
  AND NOT EXISTS (SELECT 1 FROM receptionists WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;
