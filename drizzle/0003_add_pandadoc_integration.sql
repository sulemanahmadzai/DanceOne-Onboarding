-- Migration: Add PandaDoc integration fields and new status values
-- This migration adds pandadocDocumentId field and supports new status values

-- Add pandadoc_document_id column
ALTER TABLE "onboarding_requests" ADD COLUMN IF NOT EXISTS "pandadoc_document_id" varchar(100);

-- Note: The new status values (offer_letter_sent, adp_completed) are already supported
-- by the varchar status column, so no schema change is needed for those.
-- They will be used by the application code.

