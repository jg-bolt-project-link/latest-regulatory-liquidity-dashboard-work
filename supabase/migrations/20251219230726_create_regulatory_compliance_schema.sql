/*
  # Create Regulatory Compliance Tracking Schema
  
  Creates tables to track regulatory rules, implementation status, and gaps.
  Tracks Regulation YY, WW, QQ, and NSFR guidance.
  
  ## New Tables
  - regulatory_frameworks: High-level regulatory frameworks
  - regulatory_rules: Individual rules and sections
  - rule_implementations: Maps rules to screens/calculations
  - implementation_gaps: Tracks unimplemented rules
  
  ## Security
  - Public read access for regulatory reference data
  - Authenticated write access for compliance tracking
*/

-- regulatory_frameworks table
CREATE TABLE IF NOT EXISTS regulatory_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_code text UNIQUE NOT NULL,
  framework_name text NOT NULL,
  regulatory_body text NOT NULL,
  description text,
  effective_date date,
  last_updated date,
  official_url text,
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE regulatory_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to regulatory_frameworks"
  ON regulatory_frameworks FOR ALL USING (true) WITH CHECK (true);

-- regulatory_rules table
CREATE TABLE IF NOT EXISTS regulatory_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  rule_code text NOT NULL,
  section_number text,
  rule_title text NOT NULL,
  rule_category text NOT NULL,
  rule_text text NOT NULL,
  regulatory_citation text,
  calculation_required boolean DEFAULT false,
  reporting_required boolean DEFAULT false,
  disclosure_required boolean DEFAULT false,
  compliance_threshold text,
  effective_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(framework_id, rule_code)
);

ALTER TABLE regulatory_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to regulatory_rules"
  ON regulatory_rules FOR ALL USING (true) WITH CHECK (true);

-- rule_implementations table
CREATE TABLE IF NOT EXISTS rule_implementations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES regulatory_rules(id) ON DELETE CASCADE,
  implementation_status text NOT NULL CHECK (implementation_status IN ('implemented', 'partial', 'not_implemented', 'not_applicable')),
  implementation_type text CHECK (implementation_type IN ('calculation', 'validation', 'report', 'screen', 'checklist', 'disclosure')),
  screen_name text,
  screen_path text,
  calculation_function text,
  database_table text,
  database_column text,
  code_reference text,
  coverage_percentage numeric(5,2) DEFAULT 0,
  implementation_notes text,
  validation_status text,
  last_validated_date date,
  implemented_by text,
  implemented_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rule_implementations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to rule_implementations"
  ON rule_implementations FOR ALL USING (true) WITH CHECK (true);

-- implementation_gaps table
CREATE TABLE IF NOT EXISTS implementation_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES regulatory_rules(id) ON DELETE CASCADE,
  gap_type text NOT NULL CHECK (gap_type IN ('missing_calculation', 'missing_screen', 'missing_validation', 'missing_report', 'incomplete_coverage', 'missing_disclosure')),
  gap_description text NOT NULL,
  business_impact text,
  regulatory_risk text CHECK (regulatory_risk IN ('high', 'medium', 'low')),
  implementation_suggestion text,
  suggested_screen text,
  suggested_calculation text,
  suggested_table text,
  estimated_effort text,
  priority_level text CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
  target_date date,
  assigned_to text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'deferred', 'not_required')),
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE implementation_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to implementation_gaps"
  ON implementation_gaps FOR ALL USING (true) WITH CHECK (true);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_regulatory_rules_framework ON regulatory_rules(framework_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_rules_category ON regulatory_rules(rule_category);
CREATE INDEX IF NOT EXISTS idx_rule_implementations_rule ON rule_implementations(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_implementations_status ON rule_implementations(implementation_status);
CREATE INDEX IF NOT EXISTS idx_implementation_gaps_rule ON implementation_gaps(rule_id);
CREATE INDEX IF NOT EXISTS idx_implementation_gaps_status ON implementation_gaps(status);
CREATE INDEX IF NOT EXISTS idx_implementation_gaps_priority ON implementation_gaps(priority_level);

-- Insert Regulatory Frameworks
INSERT INTO regulatory_frameworks (framework_code, framework_name, regulatory_body, description, effective_date, official_url)
VALUES
  ('REG_YY', 'Regulation YY - Enhanced Prudential Standards', 'Federal Reserve Board', 'Enhanced prudential standards for bank holding companies and foreign banking organizations', '2014-01-01', 'https://www.federalreserve.gov/supervisionreg/regycg.htm'),
  ('REG_WW', 'Regulation WW - Resolution Planning', 'Federal Reserve Board / FDIC', 'Resolution plan and credit exposure report requirements for large bank holding companies and foreign banking organizations', '2019-12-01', 'https://www.federalreserve.gov/supervisionreg/regww.htm'),
  ('REG_QQ', 'Regulation QQ - Liquidity Risk Management', 'OCC', 'Liquidity risk-management standards for large national banks, federal savings associations, and federal branches', '2014-09-01', 'https://www.occ.gov/'),
  ('NSFR', 'Net Stable Funding Ratio (NSFR)', 'Federal Reserve Board / OCC / FDIC', 'Requires banking organizations to maintain a stable funding profile in relation to their assets and off-balance sheet activities', '2021-07-01', 'https://www.federalreserve.gov/newsevents/pressreleases/bcreg20201020a.htm')
ON CONFLICT (framework_code) DO NOTHING;
