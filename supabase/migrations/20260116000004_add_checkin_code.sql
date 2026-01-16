-- Add check-in code to appointments for manual entry alternative to QR scanning
-- This creates a short, human-readable code tied to each appointment

-- Add check_in_code column to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS check_in_code TEXT UNIQUE;

-- Create index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_appointments_check_in_code ON appointments(check_in_code);

-- Function to generate a unique 8-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_check_in_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding 0,O,1,I to avoid confusion
  code TEXT := 'GCH-';
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate check_in_code on insert
CREATE OR REPLACE FUNCTION set_appointment_check_in_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Only generate if code is not provided
  IF NEW.check_in_code IS NULL THEN
    LOOP
      new_code := generate_check_in_code();
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM appointments WHERE check_in_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.check_in_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_appointment_check_in_code ON appointments;
CREATE TRIGGER trigger_set_appointment_check_in_code
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_check_in_code();

-- Backfill existing appointments with codes
DO $$
DECLARE
  apt RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR apt IN SELECT id FROM appointments WHERE check_in_code IS NULL LOOP
    LOOP
      new_code := generate_check_in_code();
      SELECT EXISTS(SELECT 1 FROM appointments WHERE check_in_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE appointments SET check_in_code = new_code WHERE id = apt.id;
  END LOOP;
END $$;

-- Add comment
COMMENT ON COLUMN appointments.check_in_code IS 'Short human-readable code for manual check-in (alternative to QR scanning)';
