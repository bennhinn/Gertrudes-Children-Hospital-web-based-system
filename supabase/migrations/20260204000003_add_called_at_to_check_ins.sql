-- Add called_at column to check_ins table
-- This tracks when a patient was called from the waiting area

ALTER TABLE check_ins 
ADD COLUMN IF NOT EXISTS called_at TIMESTAMPTZ;

-- Create index for querying by called_at
CREATE INDEX IF NOT EXISTS idx_check_ins_called_at ON check_ins(called_at);
