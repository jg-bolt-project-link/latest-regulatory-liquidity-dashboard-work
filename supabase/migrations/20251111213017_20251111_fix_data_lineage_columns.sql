-- Fix data_lineage table columns to match seed data expectations

ALTER TABLE data_lineage 
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS source_column text,
  ADD COLUMN IF NOT EXISTS target_system text,
  ADD COLUMN IF NOT EXISTS target_column text,
  ADD COLUMN IF NOT EXISTS transformation_rule text,
  ADD COLUMN IF NOT EXISTS transformation_type text,
  ADD COLUMN IF NOT EXISTS dependency_level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_critical boolean DEFAULT false;

-- Rename columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_lineage' AND column_name = 'source_field') THEN
    ALTER TABLE data_lineage DROP COLUMN source_field;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_lineage' AND column_name = 'target_field') THEN
    ALTER TABLE data_lineage DROP COLUMN target_field;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_lineage' AND column_name = 'transformation_logic') THEN
    ALTER TABLE data_lineage DROP COLUMN transformation_logic;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_lineage' AND column_name = 'data_flow_direction') THEN
    ALTER TABLE data_lineage DROP COLUMN data_flow_direction;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_lineage' AND column_name = 'is_active') THEN
    ALTER TABLE data_lineage DROP COLUMN is_active;
  END IF;
END $$;
