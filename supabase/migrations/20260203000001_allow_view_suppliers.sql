-- Allow pharmacists and other staff to view suppliers
-- This enables the pharmacy to see supplier options when ordering medications

-- Enable RLS on suppliers table if not already enabled
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view suppliers
CREATE POLICY "Allow authenticated users to view suppliers"
ON suppliers
FOR SELECT
TO authenticated
USING (true);

-- Also ensure profiles can be read for the supplier join
-- (profiles table should already have this, but adding just in case)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Allow authenticated users to view profiles'
    ) THEN
        CREATE POLICY "Allow authenticated users to view profiles"
        ON profiles
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;
