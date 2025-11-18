/*
  # Add legal_entity_id to LCR and NSFR metrics

  ## Changes
  - Add legal_entity_id column to lcr_metrics table
  - Add legal_entity_id column to nsfr_metrics table
  - Add additional LCR calculation fields
  - Add additional NSFR calculation fields
  - Update unique constraints to include legal_entity_id

  ## Reason
  - Support per-entity LCR and NSFR calculations from FR 2052a data
  - Enable multi-entity reporting for consolidated institutions
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

-- Add additional LCR fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'total_cash_outflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN total_cash_outflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'total_cash_inflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN total_cash_inflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'level1_assets'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN level1_assets numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'level2a_assets'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN level2a_assets numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'level2b_assets'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN level2b_assets numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'total_net_cash_outflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN total_net_cash_outflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'hqla_excess_shortfall'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN hqla_excess_shortfall numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'retail_deposit_outflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN retail_deposit_outflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'wholesale_funding_outflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN wholesale_funding_outflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'secured_funding_outflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN secured_funding_outflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'derivatives_outflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN derivatives_outflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'other_contractual_outflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN other_contractual_outflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'other_contingent_outflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN other_contingent_outflows numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'capped_inflows'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN capped_inflows numeric DEFAULT 0;
  END IF;
END $$;

-- Add additional NSFR fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'asf_capital'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN asf_capital numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'asf_retail_deposits'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN asf_retail_deposits numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'asf_wholesale_funding'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN asf_wholesale_funding numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'asf_other_liabilities'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN asf_other_liabilities numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'rsf_level1_assets'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN rsf_level1_assets numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'rsf_level2a_assets'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN rsf_level2a_assets numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'rsf_level2b_assets'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN rsf_level2b_assets numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'rsf_loans'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN rsf_loans numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'rsf_other_assets'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN rsf_other_assets numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'asf_surplus_deficit'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN asf_surplus_deficit numeric DEFAULT 0;
  END IF;
END $$;

-- Create indexes on legal_entity_id
CREATE INDEX IF NOT EXISTS idx_lcr_metrics_entity_id ON lcr_metrics(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_nsfr_metrics_entity_id ON nsfr_metrics(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_lcr_metrics_user_entity_date ON lcr_metrics(user_id, legal_entity_id, report_date);
CREATE INDEX IF NOT EXISTS idx_nsfr_metrics_user_entity_date ON nsfr_metrics(user_id, legal_entity_id, report_date);
