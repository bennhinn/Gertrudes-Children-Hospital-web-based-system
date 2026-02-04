-- Fix RLS policies for receptionist to access appointments and related tables
-- This migration ensures receptionists can search for and view appointments

-- Add policy for receptionists to view appointments
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'appointments'
        AND policyname = 'Receptionists can view appointments'
    ) THEN
        CREATE POLICY "Receptionists can view appointments"
        ON appointments
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('receptionist', 'admin', 'doctor')
            )
        );
    END IF;

    -- Allow receptionists to update appointment status (for check-in)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'appointments'
        AND policyname = 'Receptionists can update appointments'
    ) THEN
        CREATE POLICY "Receptionists can update appointments"
        ON appointments
        FOR UPDATE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('receptionist', 'admin')
            )
        );
    END IF;
END $$;

-- Ensure receptionists can view children (for search functionality)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'children'
        AND policyname = 'Staff can view all children'
    ) THEN
        CREATE POLICY "Staff can view all children"
        ON children
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('receptionist', 'doctor', 'admin', 'lab_tech', 'pharmacist')
            )
        );
    END IF;
END $$;

-- Ensure receptionists can view caregivers (for search functionality)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'caregivers'
        AND policyname = 'Staff can view all caregivers'
    ) THEN
        CREATE POLICY "Staff can view all caregivers"
        ON caregivers
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('receptionist', 'doctor', 'admin', 'lab_tech', 'pharmacist')
            )
        );
    END IF;
END $$;

-- Ensure profiles can be viewed for join operations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Staff can view all profiles'
    ) THEN
        CREATE POLICY "Staff can view all profiles"
        ON profiles
        FOR SELECT
        TO authenticated
        USING (
            id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = auth.uid()
                AND p.role IN ('receptionist', 'doctor', 'admin', 'lab_tech', 'pharmacist')
            )
        );
    END IF;
END $$;

-- Comment for documentation
COMMENT ON POLICY "Receptionists can view appointments" ON appointments IS 'Allows receptionists to search and view appointments for check-in';
