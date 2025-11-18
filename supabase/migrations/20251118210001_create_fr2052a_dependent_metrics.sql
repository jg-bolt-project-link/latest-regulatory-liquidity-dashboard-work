/*
  # Create FR 2052a-Dependent Metrics Tables

  ## Overview
  Creates separate tables for LCR and NSFR metrics that are calculated directly
  from FR 2052a line-item data, distinct from manually refreshed regulatory metrics.

  ## New Tables
  - `fr2052a_lcr_metrics` - LCR calculations derived from FR 2052a data
  - `fr2052a_nsfr_metrics` - NSFR calculations derived from FR 2052a data

  ## Purpose
  - Maintain separation between FR 2052a-sourced calculations and regulatory reports
  - Enable comparison between bottom-up (FR 2052a) and top-down (regulatory) approaches
  - Provide full traceability from line items to regulatory ratios

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Create FR 2052a-dependent LCR metrics table
CREATE TABLE IF NOT EXISTS fr2052a_lcr_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,

  -- HQLA Components
  level1_assets numeric DEFAULT 0,
  level2a_assets numeric DEFAULT 0,
  level2b_assets numeric DEFAULT 0,
  total_hqla numeric DEFAULT 0,

  -- Cash Flow Components
  total_cash_outflows numeric DEFAULT 0,
  total_cash_inflows numeric DEFAULT 0,
  total_net_cash_outflows numeric DEFAULT 0,

  -- LCR Calculation
  lcr_ratio numeric,
  hqla_excess_shortfall numeric DEFAULT 0,
  is_compliant boolean DEFAULT false,

  -- Detailed Outflow Breakdown
  retail_deposit_outflows numeric DEFAULT 0,
  wholesale_funding_outflows numeric DEFAULT 0,
  secured_funding_outflows numeric DEFAULT 0,
  derivatives_outflows numeric DEFAULT 0,
  other_contractual_outflows numeric DEFAULT 0,
  other_contingent_outflows numeric DEFAULT 0,

  -- Detailed Inflow Breakdown
  capped_inflows numeric DEFAULT 0,

  -- Source tracking
  source_system text DEFAULT 'FR2052a',
  calculation_timestamp timestamptz DEFAULT now(),
  fr2052a_record_count integer DEFAULT 0,

  notes text,
  created_at timestamptz DEFAULT now(),

  UNIQUE(user_id, legal_entity_id, report_date)
);

-- Create FR 2052a-dependent NSFR metrics table
CREATE TABLE IF NOT EXISTS fr2052a_nsfr_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,

  -- NSFR Components
  available_stable_funding numeric DEFAULT 0,
  required_stable_funding numeric DEFAULT 0,
  nsfr_ratio numeric,
  asf_surplus_deficit numeric DEFAULT 0,
  is_compliant boolean DEFAULT false,

  -- ASF Breakdown
  asf_capital numeric DEFAULT 0,
  asf_retail_deposits numeric DEFAULT 0,
  asf_wholesale_funding numeric DEFAULT 0,
  asf_other_liabilities numeric DEFAULT 0,

  -- RSF Breakdown
  rsf_level1_assets numeric DEFAULT 0,
  rsf_level2a_assets numeric DEFAULT 0,
  rsf_level2b_assets numeric DEFAULT 0,
  rsf_loans numeric DEFAULT 0,
  rsf_other_assets numeric DEFAULT 0,

  -- Source tracking
  source_system text DEFAULT 'FR2052a',
  calculation_timestamp timestamptz DEFAULT now(),
  fr2052a_record_count integer DEFAULT 0,

  notes text,
  created_at timestamptz DEFAULT now(),

  UNIQUE(user_id, legal_entity_id, report_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fr2052a_lcr_user_id ON fr2052a_lcr_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_lcr_entity_id ON fr2052a_lcr_metrics(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_lcr_report_date ON fr2052a_lcr_metrics(report_date);
CREATE INDEX IF NOT EXISTS idx_fr2052a_lcr_user_entity_date ON fr2052a_lcr_metrics(user_id, legal_entity_id, report_date);

CREATE INDEX IF NOT EXISTS idx_fr2052a_nsfr_user_id ON fr2052a_nsfr_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_nsfr_entity_id ON fr2052a_nsfr_metrics(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_nsfr_report_date ON fr2052a_nsfr_metrics(report_date);
CREATE INDEX IF NOT EXISTS idx_fr2052a_nsfr_user_entity_date ON fr2052a_nsfr_metrics(user_id, legal_entity_id, report_date);

-- Enable RLS
ALTER TABLE fr2052a_lcr_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_nsfr_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fr2052a_lcr_metrics
CREATE POLICY "Users can view own FR2052a LCR metrics"
  ON fr2052a_lcr_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own FR2052a LCR metrics"
  ON fr2052a_lcr_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FR2052a LCR metrics"
  ON fr2052a_lcr_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own FR2052a LCR metrics"
  ON fr2052a_lcr_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for fr2052a_nsfr_metrics
CREATE POLICY "Users can view own FR2052a NSFR metrics"
  ON fr2052a_nsfr_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own FR2052a NSFR metrics"
  ON fr2052a_nsfr_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FR2052a NSFR metrics"
  ON fr2052a_nsfr_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own FR2052a NSFR metrics"
  ON fr2052a_nsfr_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
