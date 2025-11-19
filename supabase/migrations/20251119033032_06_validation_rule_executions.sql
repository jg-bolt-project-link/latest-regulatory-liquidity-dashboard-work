/*
  # Validation Rule Execution Tracking

  This migration creates tables to track the execution and results of validation rules
  applied to FR2052a submissions, providing full audit trail and transparency.

  ## New Tables

  1. **fr2052a_validation_executions**
     - Tracks each rule execution against a submission
     - Stores pass/fail status, rows checked, rows passed, rows failed
     - Provides detailed breakdown of rule application

  2. **lcr_calculation_validations**
     - Stores detailed LCR calculation validation results
     - Tracks each component calculation and validation status

  3. **nsfr_calculation_validations**
     - Stores detailed NSFR calculation validation results
     - Tracks each component calculation and validation status
*/

-- Validation Rule Execution Tracking
CREATE TABLE IF NOT EXISTS fr2052a_validation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid,
  validation_rule_id uuid,
  rule_name text NOT NULL,
  rule_category text NOT NULL,
  execution_timestamp timestamptz DEFAULT now(),
  total_rows_checked integer DEFAULT 0,
  rows_passed integer DEFAULT 0,
  rows_failed integer DEFAULT 0,
  execution_status text DEFAULT 'completed',
  execution_time_ms integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- LCR Calculation Validations
CREATE TABLE IF NOT EXISTS lcr_calculation_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid,
  legal_entity_id uuid,
  report_date date NOT NULL,
  validation_timestamp timestamptz DEFAULT now(),
  
  -- HQLA Components
  level1_assets_calculated decimal(15,2) DEFAULT 0,
  level1_assets_expected decimal(15,2) DEFAULT 0,
  level1_validation_status text DEFAULT 'passed',
  level1_variance decimal(15,2) DEFAULT 0,
  
  level2a_assets_calculated decimal(15,2) DEFAULT 0,
  level2a_assets_expected decimal(15,2) DEFAULT 0,
  level2a_validation_status text DEFAULT 'passed',
  level2a_variance decimal(15,2) DEFAULT 0,
  level2a_cap_applied boolean DEFAULT false,
  level2a_cap_amount decimal(15,2) DEFAULT 0,
  
  level2b_assets_calculated decimal(15,2) DEFAULT 0,
  level2b_assets_expected decimal(15,2) DEFAULT 0,
  level2b_validation_status text DEFAULT 'passed',
  level2b_variance decimal(15,2) DEFAULT 0,
  level2b_cap_applied boolean DEFAULT false,
  level2b_cap_amount decimal(15,2) DEFAULT 0,
  
  total_hqla_calculated decimal(15,2) DEFAULT 0,
  total_hqla_expected decimal(15,2) DEFAULT 0,
  hqla_validation_status text DEFAULT 'passed',
  hqla_variance decimal(15,2) DEFAULT 0,
  
  -- Cash Outflow Components
  retail_outflows_calculated decimal(15,2) DEFAULT 0,
  wholesale_outflows_calculated decimal(15,2) DEFAULT 0,
  secured_funding_outflows_calculated decimal(15,2) DEFAULT 0,
  derivatives_outflows_calculated decimal(15,2) DEFAULT 0,
  other_outflows_calculated decimal(15,2) DEFAULT 0,
  total_outflows_calculated decimal(15,2) DEFAULT 0,
  outflows_validation_status text DEFAULT 'passed',
  
  -- Cash Inflow Components
  total_inflows_calculated decimal(15,2) DEFAULT 0,
  capped_inflows_calculated decimal(15,2) DEFAULT 0,
  inflow_cap_applied boolean DEFAULT false,
  inflows_validation_status text DEFAULT 'passed',
  
  -- Net Cash Outflows
  net_cash_outflows_calculated decimal(15,2) DEFAULT 0,
  net_cash_outflows_expected decimal(15,2) DEFAULT 0,
  nco_validation_status text DEFAULT 'passed',
  nco_variance decimal(15,2) DEFAULT 0,
  
  -- Final LCR
  lcr_ratio_calculated decimal(10,4),
  lcr_ratio_expected decimal(10,4),
  lcr_validation_status text DEFAULT 'passed',
  lcr_variance decimal(10,4),
  
  overall_validation_status text DEFAULT 'passed',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- NSFR Calculation Validations
CREATE TABLE IF NOT EXISTS nsfr_calculation_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid,
  legal_entity_id uuid,
  report_date date NOT NULL,
  validation_timestamp timestamptz DEFAULT now(),
  
  -- ASF Components
  capital_asf_calculated decimal(15,2) DEFAULT 0,
  capital_asf_expected decimal(15,2) DEFAULT 0,
  capital_asf_validation_status text DEFAULT 'passed',
  capital_asf_variance decimal(15,2) DEFAULT 0,
  
  retail_deposits_asf_calculated decimal(15,2) DEFAULT 0,
  retail_deposits_asf_expected decimal(15,2) DEFAULT 0,
  retail_deposits_asf_validation_status text DEFAULT 'passed',
  retail_deposits_asf_variance decimal(15,2) DEFAULT 0,
  
  wholesale_funding_asf_calculated decimal(15,2) DEFAULT 0,
  wholesale_funding_asf_expected decimal(15,2) DEFAULT 0,
  wholesale_funding_asf_validation_status text DEFAULT 'passed',
  wholesale_funding_asf_variance decimal(15,2) DEFAULT 0,
  
  other_liabilities_asf_calculated decimal(15,2) DEFAULT 0,
  total_asf_calculated decimal(15,2) DEFAULT 0,
  total_asf_expected decimal(15,2) DEFAULT 0,
  asf_validation_status text DEFAULT 'passed',
  asf_variance decimal(15,2) DEFAULT 0,
  
  -- RSF Components
  level1_assets_rsf_calculated decimal(15,2) DEFAULT 0,
  level2a_assets_rsf_calculated decimal(15,2) DEFAULT 0,
  level2b_assets_rsf_calculated decimal(15,2) DEFAULT 0,
  loans_rsf_calculated decimal(15,2) DEFAULT 0,
  other_assets_rsf_calculated decimal(15,2) DEFAULT 0,
  total_rsf_calculated decimal(15,2) DEFAULT 0,
  total_rsf_expected decimal(15,2) DEFAULT 0,
  rsf_validation_status text DEFAULT 'passed',
  rsf_variance decimal(15,2) DEFAULT 0,
  
  -- Final NSFR
  nsfr_ratio_calculated decimal(10,4),
  nsfr_ratio_expected decimal(10,4),
  nsfr_validation_status text DEFAULT 'passed',
  nsfr_variance decimal(10,4),
  
  overall_validation_status text DEFAULT 'passed',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_validation_executions_submission ON fr2052a_validation_executions(submission_id);
CREATE INDEX IF NOT EXISTS idx_validation_executions_rule ON fr2052a_validation_executions(validation_rule_id);
CREATE INDEX IF NOT EXISTS idx_lcr_validations_submission ON lcr_calculation_validations(submission_id);
CREATE INDEX IF NOT EXISTS idx_lcr_validations_entity_date ON lcr_calculation_validations(legal_entity_id, report_date);
CREATE INDEX IF NOT EXISTS idx_nsfr_validations_submission ON nsfr_calculation_validations(submission_id);
CREATE INDEX IF NOT EXISTS idx_nsfr_validations_entity_date ON nsfr_calculation_validations(legal_entity_id, report_date);

-- Enable RLS
ALTER TABLE fr2052a_validation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lcr_calculation_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfr_calculation_validations ENABLE ROW LEVEL SECURITY;

-- Allow all access
CREATE POLICY "Allow all access to validation_executions" ON fr2052a_validation_executions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to lcr_validations" ON lcr_calculation_validations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to nsfr_validations" ON nsfr_calculation_validations FOR ALL USING (true) WITH CHECK (true);