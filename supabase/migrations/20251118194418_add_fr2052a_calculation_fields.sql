/*
  # Add FR 2052a Calculation Fields

  ## Overview
  Enhances fr2052a_data_rows table to support LCR and NSFR calculations.

  ## New Columns
  - `asset_class` - Asset classification for regulatory calculations
  - `is_hqla` - Indicates if asset qualifies as High-Quality Liquid Asset
  - `hqla_level` - HQLA tier (1, 2, or 3)
  - `haircut_rate` - Haircut percentage applied to asset value
  - `runoff_rate` - Expected runoff rate for deposits/funding
  - `rsf_factor` - Required Stable Funding factor for NSFR
  - `asf_factor` - Available Stable Funding factor for NSFR
  - `projected_inflow` - Expected cash inflow within 30 days
  - `projected_outflow` - Expected cash outflow within 30 days
  - `encumbered_amount` - Portion of asset that is encumbered
  - `user_id` - Links to authenticated user
  - `legal_entity_id` - Links to legal entity
  - `report_date` - Reporting date for time series

  ## Security
  - RLS policies added for user data isolation
*/

-- Add user_id for RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add legal_entity_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN legal_entity_id uuid;
  END IF;
END $$;

-- Add report_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'report_date'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN report_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Add asset_class
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'asset_class'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN asset_class text;
  END IF;
END $$;

-- Add is_hqla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'is_hqla'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN is_hqla boolean DEFAULT false;
  END IF;
END $$;

-- Add hqla_level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'hqla_level'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN hqla_level integer;
  END IF;
END $$;

-- Add haircut_rate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'haircut_rate'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN haircut_rate numeric DEFAULT 0;
  END IF;
END $$;

-- Add runoff_rate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'runoff_rate'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN runoff_rate numeric;
  END IF;
END $$;

-- Add rsf_factor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'rsf_factor'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN rsf_factor numeric;
  END IF;
END $$;

-- Add asf_factor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'asf_factor'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN asf_factor numeric;
  END IF;
END $$;

-- Add projected_inflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'projected_inflow'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN projected_inflow numeric DEFAULT 0;
  END IF;
END $$;

-- Add projected_outflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'projected_outflow'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN projected_outflow numeric DEFAULT 0;
  END IF;
END $$;

-- Add encumbered_amount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'encumbered_amount'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN encumbered_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Add internal_rating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fr2052a_data_rows' AND column_name = 'internal_rating'
  ) THEN
    ALTER TABLE fr2052a_data_rows ADD COLUMN internal_rating text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fr2052a_rows_user_id ON fr2052a_data_rows(user_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_rows_entity_id ON fr2052a_data_rows(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_rows_report_date ON fr2052a_data_rows(report_date);
CREATE INDEX IF NOT EXISTS idx_fr2052a_rows_product ON fr2052a_data_rows(product);
CREATE INDEX IF NOT EXISTS idx_fr2052a_rows_user_date ON fr2052a_data_rows(user_id, report_date);

-- Enable RLS
ALTER TABLE fr2052a_data_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Users can view own FR2052a data'
  ) THEN
    CREATE POLICY "Users can view own FR2052a data"
      ON fr2052a_data_rows FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Users can insert own FR2052a data'
  ) THEN
    CREATE POLICY "Users can insert own FR2052a data"
      ON fr2052a_data_rows FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Users can update own FR2052a data'
  ) THEN
    CREATE POLICY "Users can update own FR2052a data"
      ON fr2052a_data_rows FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Users can delete own FR2052a data'
  ) THEN
    CREATE POLICY "Users can delete own FR2052a data"
      ON fr2052a_data_rows FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
