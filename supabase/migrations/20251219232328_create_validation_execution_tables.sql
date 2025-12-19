/*
  # Create Validation Execution Tables for FR2052a System

  1. New Tables
    - `fr2052a_validation_executions`
      - Tracks individual validation rule executions for each submission
      - Links to submission_id and validation_rule_id
      - Records rows checked, passed, failed, execution time
    
    - `lcr_calculation_validations`
      - Stores LCR validation results for each submission
      - Tracks HQLA components, outflows, inflows
      - Records calculated vs expected values with validation status
    
    - `nsfr_calculation_validations`
      - Stores NSFR validation results for each submission
      - Tracks ASF and RSF components
      - Records calculated vs expected values with validation status
    
    - `lcr_hqla_components`
      - Detailed breakdown of HQLA components by level and category
      - Links to lcr_calculation_validations
    
    - `lcr_outflow_components`
      - Detailed breakdown of cash outflow components
      - Links to lcr_calculation_validations
    
    - `lcr_inflow_components`
      - Detailed breakdown of cash inflow components
      - Links to lcr_calculation_validations
    
    - `nsfr_asf_components`
      - Detailed breakdown of Available Stable Funding components
      - Links to nsfr_calculation_validations
    
    - `nsfr_rsf_components`
      - Detailed breakdown of Required Stable Funding components
      - Links to nsfr_calculation_validations

  2. Security
    - Enable RLS on all tables
    - Add permissive policies for system data access
*/

-- FR2052a Validation Executions
CREATE TABLE IF NOT EXISTS fr2052a_validation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES fr2052a_submissions(id) ON DELETE CASCADE,
  validation_rule_id uuid REFERENCES fr2052a_validation_rules(id) ON DELETE SET NULL,
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

ALTER TABLE fr2052a_validation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to fr2052a_validation_executions"
  ON fr2052a_validation_executions FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_fr2052a_validation_executions_submission 
  ON fr2052a_validation_executions(submission_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_validation_executions_rule 
  ON fr2052a_validation_executions(validation_rule_id);

-- LCR Calculation Validations
CREATE TABLE IF NOT EXISTS lcr_calculation_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES fr2052a_submissions(id) ON DELETE CASCADE,
  legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  validation_timestamp timestamptz DEFAULT now(),
  
  -- HQLA Components
  level1_assets_calculated numeric(20,2) DEFAULT 0,
  level1_assets_expected numeric(20,2) DEFAULT 0,
  level1_validation_status text DEFAULT 'pending',
  
  level2a_assets_calculated numeric(20,2) DEFAULT 0,
  level2a_assets_expected numeric(20,2) DEFAULT 0,
  level2a_cap_applied boolean DEFAULT false,
  level2a_cap_amount numeric(20,2),
  level2a_validation_status text DEFAULT 'pending',
  
  level2b_assets_calculated numeric(20,2) DEFAULT 0,
  level2b_assets_expected numeric(20,2) DEFAULT 0,
  level2b_cap_applied boolean DEFAULT false,
  level2b_cap_amount numeric(20,2),
  level2b_validation_status text DEFAULT 'pending',
  
  total_hqla_calculated numeric(20,2) DEFAULT 0,
  total_hqla_expected numeric(20,2) DEFAULT 0,
  hqla_validation_status text DEFAULT 'pending',
  
  -- Outflows
  retail_outflows_calculated numeric(20,2) DEFAULT 0,
  wholesale_outflows_calculated numeric(20,2) DEFAULT 0,
  secured_funding_outflows_calculated numeric(20,2) DEFAULT 0,
  derivatives_outflows_calculated numeric(20,2) DEFAULT 0,
  other_outflows_calculated numeric(20,2) DEFAULT 0,
  total_outflows_calculated numeric(20,2) DEFAULT 0,
  outflows_validation_status text DEFAULT 'pending',
  
  -- Inflows
  total_inflows_calculated numeric(20,2) DEFAULT 0,
  capped_inflows_calculated numeric(20,2) DEFAULT 0,
  inflow_cap_applied boolean DEFAULT false,
  inflows_validation_status text DEFAULT 'pending',
  
  -- Net Cash Outflows and LCR
  net_cash_outflows_calculated numeric(20,2) DEFAULT 0,
  net_cash_outflows_expected numeric(20,2) DEFAULT 0,
  nco_validation_status text DEFAULT 'pending',
  
  lcr_ratio_calculated numeric(10,4) DEFAULT 0,
  lcr_ratio_expected numeric(10,4) DEFAULT 0,
  lcr_validation_status text DEFAULT 'pending',
  
  overall_validation_status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lcr_calculation_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lcr_calculation_validations"
  ON lcr_calculation_validations FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lcr_calculation_validations_submission 
  ON lcr_calculation_validations(submission_id);
CREATE INDEX IF NOT EXISTS idx_lcr_calculation_validations_entity_date 
  ON lcr_calculation_validations(legal_entity_id, report_date);

-- NSFR Calculation Validations
CREATE TABLE IF NOT EXISTS nsfr_calculation_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES fr2052a_submissions(id) ON DELETE CASCADE,
  legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  validation_timestamp timestamptz DEFAULT now(),
  
  -- ASF Components
  total_asf_calculated numeric(20,2) DEFAULT 0,
  total_asf_expected numeric(20,2) DEFAULT 0,
  asf_validation_status text DEFAULT 'pending',
  
  -- RSF Components
  total_rsf_calculated numeric(20,2) DEFAULT 0,
  total_rsf_expected numeric(20,2) DEFAULT 0,
  rsf_validation_status text DEFAULT 'pending',
  
  -- NSFR Ratio
  nsfr_ratio_calculated numeric(10,4) DEFAULT 0,
  nsfr_ratio_expected numeric(10,4) DEFAULT 0,
  nsfr_validation_status text DEFAULT 'pending',
  
  overall_validation_status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nsfr_calculation_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to nsfr_calculation_validations"
  ON nsfr_calculation_validations FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_nsfr_calculation_validations_submission 
  ON nsfr_calculation_validations(submission_id);
CREATE INDEX IF NOT EXISTS idx_nsfr_calculation_validations_entity_date 
  ON nsfr_calculation_validations(legal_entity_id, report_date);

-- LCR HQLA Components
CREATE TABLE IF NOT EXISTS lcr_hqla_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lcr_validation_id uuid REFERENCES lcr_calculation_validations(id) ON DELETE CASCADE,
  submission_id uuid,
  legal_entity_id uuid,
  hqla_level integer NOT NULL,
  hqla_category text NOT NULL,
  product_category text NOT NULL,
  total_amount numeric(20,2) DEFAULT 0,
  haircut_rate numeric(10,4) DEFAULT 0,
  amount_after_haircut numeric(20,2) DEFAULT 0,
  liquidity_value_factor numeric(10,4) DEFAULT 1.0,
  liquidity_value numeric(20,2) DEFAULT 0,
  cap_applied boolean DEFAULT false,
  cap_amount numeric(20,2),
  record_count integer DEFAULT 0,
  calculation_notes text,
  fr2052a_line_references text[],
  rule_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lcr_hqla_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lcr_hqla_components"
  ON lcr_hqla_components FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lcr_hqla_components_validation 
  ON lcr_hqla_components(lcr_validation_id);

-- LCR Outflow Components
CREATE TABLE IF NOT EXISTS lcr_outflow_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lcr_validation_id uuid REFERENCES lcr_calculation_validations(id) ON DELETE CASCADE,
  submission_id uuid,
  legal_entity_id uuid,
  outflow_category text NOT NULL,
  product_type text NOT NULL,
  counterparty_type text,
  total_amount numeric(20,2) DEFAULT 0,
  runoff_rate numeric(10,4) DEFAULT 0,
  calculated_outflow numeric(20,2) DEFAULT 0,
  record_count integer DEFAULT 0,
  calculation_methodology text,
  regulatory_reference text,
  fr2052a_line_references text[],
  rule_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lcr_outflow_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lcr_outflow_components"
  ON lcr_outflow_components FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lcr_outflow_components_validation 
  ON lcr_outflow_components(lcr_validation_id);

-- LCR Inflow Components
CREATE TABLE IF NOT EXISTS lcr_inflow_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lcr_validation_id uuid REFERENCES lcr_calculation_validations(id) ON DELETE CASCADE,
  submission_id uuid,
  legal_entity_id uuid,
  inflow_category text NOT NULL,
  product_type text NOT NULL,
  counterparty_type text,
  total_amount numeric(20,2) DEFAULT 0,
  inflow_rate numeric(10,4) DEFAULT 0,
  calculated_inflow numeric(20,2) DEFAULT 0,
  record_count integer DEFAULT 0,
  calculation_methodology text,
  regulatory_reference text,
  fr2052a_line_references text[],
  rule_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lcr_inflow_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lcr_inflow_components"
  ON lcr_inflow_components FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lcr_inflow_components_validation 
  ON lcr_inflow_components(lcr_validation_id);

-- NSFR ASF Components
CREATE TABLE IF NOT EXISTS nsfr_asf_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nsfr_validation_id uuid REFERENCES nsfr_calculation_validations(id) ON DELETE CASCADE,
  submission_id uuid,
  legal_entity_id uuid,
  asf_category text NOT NULL,
  product_type text NOT NULL,
  counterparty_type text,
  total_amount numeric(20,2) DEFAULT 0,
  asf_factor numeric(10,4) DEFAULT 0,
  calculated_asf numeric(20,2) DEFAULT 0,
  record_count integer DEFAULT 0,
  calculation_methodology text,
  regulatory_reference text,
  fr2052a_line_references text[],
  rule_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nsfr_asf_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to nsfr_asf_components"
  ON nsfr_asf_components FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_nsfr_asf_components_validation 
  ON nsfr_asf_components(nsfr_validation_id);

-- NSFR RSF Components
CREATE TABLE IF NOT EXISTS nsfr_rsf_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nsfr_validation_id uuid REFERENCES nsfr_calculation_validations(id) ON DELETE CASCADE,
  submission_id uuid,
  legal_entity_id uuid,
  rsf_category text NOT NULL,
  product_type text NOT NULL,
  counterparty_type text,
  total_amount numeric(20,2) DEFAULT 0,
  rsf_factor numeric(10,4) DEFAULT 0,
  calculated_rsf numeric(20,2) DEFAULT 0,
  record_count integer DEFAULT 0,
  calculation_methodology text,
  regulatory_reference text,
  fr2052a_line_references text[],
  rule_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nsfr_rsf_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to nsfr_rsf_components"
  ON nsfr_rsf_components FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_nsfr_rsf_components_validation 
  ON nsfr_rsf_components(nsfr_validation_id);
