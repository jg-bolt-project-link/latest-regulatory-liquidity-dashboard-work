/*
  # Add legal_entity_id to metrics tables
  
  Adds legal_entity_id foreign key to lcr_metrics and nsfr_metrics tables
  to support multi-entity reporting.
  
  ## Changes
  
  1. Tables Updated
    - lcr_metrics: Add legal_entity_id column
    - nsfr_metrics: Add legal_entity_id column
  
  2. Foreign Keys
    - Both columns reference legal_entities(id)
    - Nullable to allow legacy data
*/

-- Add legal_entity_id to lcr_metrics
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lcr_metrics' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN legal_entity_id uuid REFERENCES legal_entities(id);
  END IF;
END $$;

-- Add legal_entity_id to nsfr_metrics
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'nsfr_metrics' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN legal_entity_id uuid REFERENCES legal_entities(id);
  END IF;
END $$;