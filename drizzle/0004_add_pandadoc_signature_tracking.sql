-- Migration: Add PandaDoc signature tracking timestamps
-- This migration adds fields to track when each person completes their part in the signing flow

-- Add timestamp fields for tracking signature completion
ALTER TABLE "onboarding_requests" ADD COLUMN IF NOT EXISTS "nd_initials_completed_at" timestamp;
ALTER TABLE "onboarding_requests" ADD COLUMN IF NOT EXISTS "hr_signature_completed_at" timestamp;
ALTER TABLE "onboarding_requests" ADD COLUMN IF NOT EXISTS "candidate_signature_completed_at" timestamp;



