-- Migration: Replace salary_event_rate with event_rate and day_rate
-- This migration adds two new rate fields and removes the old combined field

-- Add new columns
ALTER TABLE "onboarding_requests" ADD COLUMN "event_rate" numeric(10, 2);
ALTER TABLE "onboarding_requests" ADD COLUMN "day_rate" numeric(10, 2);

-- Copy existing data from salary_event_rate to event_rate (if any exists)
UPDATE "onboarding_requests" SET "event_rate" = "salary_event_rate" WHERE "salary_event_rate" IS NOT NULL;

-- Drop the old column
ALTER TABLE "onboarding_requests" DROP COLUMN "salary_event_rate";
