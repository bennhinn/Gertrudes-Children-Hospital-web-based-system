-- Migration: backfill existing check_ins.child_id from appointments

BEGIN;

UPDATE public.check_ins c
SET child_id = a.child_id
FROM public.appointments a
WHERE c.appointment_id = a.id
  AND c.child_id IS NULL;

COMMIT;
