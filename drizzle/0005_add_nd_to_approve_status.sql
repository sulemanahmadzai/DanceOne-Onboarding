-- Add new status 'nd_to_approve' for bulk imported records
-- This status is used when Admin/HR bulk imports records that need ND approval before sending to candidates

-- No schema changes needed - the status column is a varchar that accepts any string
-- The new status 'nd_to_approve' will be used by the application

-- This migration is a placeholder to document the new status
-- Status flow: nd_to_approve -> waiting_for_candidate -> waiting_for_hr -> offer_letter_sent -> adp_completed -> completed

 