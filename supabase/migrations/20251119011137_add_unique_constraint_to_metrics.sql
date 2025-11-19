/*
  # Add unique constraints to metrics tables
  
  Adds unique constraints on (legal_entity_id, report_date) to support upsert operations.
  This ensures only one metric record per entity per reporting date.
  
  ## Changes
  
  1. Tables Updated
    - lcr_metrics: Add unique constraint on (legal_entity_id, report_date)
    - nsfr_metrics: Add unique constraint on (legal_entity_id, report_date)
  
  2. Constraints
    - Both constraints allow NULL values in legal_entity_id
    - Prevents duplicate metrics for same entity and date
*/

-- Add unique constraint to lcr_metrics
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lcr_metrics_legal_entity_report_date_key'
  ) THEN
    ALTER TABLE lcr_metrics 
    ADD CONSTRAINT lcr_metrics_legal_entity_report_date_key 
    UNIQUE (legal_entity_id, report_date);
  END IF;
END $$;

-- Add unique constraint to nsfr_metrics
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'nsfr_metrics_legal_entity_report_date_key'
  ) THEN
    ALTER TABLE nsfr_metrics 
    ADD CONSTRAINT nsfr_metrics_legal_entity_report_date_key 
    UNIQUE (legal_entity_id, report_date);
  END IF;
END $$;