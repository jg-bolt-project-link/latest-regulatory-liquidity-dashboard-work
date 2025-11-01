/*
  # Regulatory Metrics Schema for Large Bank Holding Companies

  ## Overview
  This migration adds comprehensive regulatory reporting capabilities for institutions
  subject to Regulation YY (Enhanced Prudential Standards), Regulation QQ (Resolution Plans),
  Regulation K (International Banking), and related Federal Reserve, OCC, and FDIC requirements.
  
  State Street Corporation is a Category II institution (assets > $250B but < $700B) and is
  subject to modified enhanced prudential standards.

  ## New Tables

  ### 1. `lcr_metrics` - Liquidity Coverage Ratio (LCR) per Basel III/Reg YY
  Tracks daily LCR compliance (must maintain ≥ 100%)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `report_date` (date) - Reporting date
  - `hqla_level_1` (decimal) - Level 1 High Quality Liquid Assets
  - `hqla_level_2a` (decimal) - Level 2A HQLA
  - `hqla_level_2b` (decimal) - Level 2B HQLA
  - `total_hqla` (decimal) - Total HQLA after haircuts
  - `total_net_cash_outflows` (decimal) - Total net cash outflows over 30 days
  - `lcr_ratio` (decimal) - LCR percentage (HQLA / Net Cash Outflows)
  - `is_compliant` (boolean) - Whether ratio meets 100% threshold
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 2. `nsfr_metrics` - Net Stable Funding Ratio (NSFR) per Basel III/Reg YY
  Tracks NSFR compliance (must maintain ≥ 100%)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `report_date` (date)
  - `available_stable_funding` (decimal) - ASF total
  - `required_stable_funding` (decimal) - RSF total
  - `nsfr_ratio` (decimal) - NSFR percentage (ASF / RSF)
  - `is_compliant` (boolean) - Whether ratio meets 100% threshold
  - `retail_deposits` (decimal) - Retail deposit funding
  - `wholesale_funding` (decimal) - Wholesale funding sources
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 3. `balance_sheet_metrics` - Balance Sheet Composition & Metrics
  Tracks balance sheet structure and key ratios
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `report_date` (date)
  - `total_assets` (decimal)
  - `total_liabilities` (decimal)
  - `total_equity` (decimal)
  - `cash_and_due_from_banks` (decimal)
  - `securities_available_for_sale` (decimal)
  - `securities_held_to_maturity` (decimal)
  - `loans_gross` (decimal)
  - `allowance_for_loan_losses` (decimal)
  - `deposits_total` (decimal)
  - `deposits_noninterest_bearing` (decimal)
  - `deposits_interest_bearing` (decimal)
  - `short_term_borrowings` (decimal)
  - `long_term_debt` (decimal)
  - `tier1_capital` (decimal)
  - `total_risk_weighted_assets` (decimal)
  - `tier1_capital_ratio` (decimal)
  - `leverage_ratio` (decimal)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 4. `interest_rate_risk_metrics` - Interest Rate Risk Management
  Tracks interest rate sensitivity per OCC guidelines
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `report_date` (date)
  - `scenario_type` (text) - Type: base, +100bp, +200bp, -100bp, etc.
  - `nii_current` (decimal) - Net Interest Income - current
  - `nii_scenario` (decimal) - Net Interest Income - scenario
  - `nii_change_amount` (decimal) - Change in NII
  - `nii_change_percent` (decimal) - Percentage change in NII
  - `eve_current` (decimal) - Economic Value of Equity - current
  - `eve_scenario` (decimal) - Economic Value of Equity - scenario
  - `eve_change_amount` (decimal) - Change in EVE
  - `eve_change_percent` (decimal) - Percentage change in EVE
  - `duration_gap` (decimal) - Duration gap measure
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 5. `resolution_metrics` - Resolution & Recovery Planning (165d/QQ)
  Tracks capabilities for orderly resolution
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `report_date` (date)
  - `total_loss_absorbing_capacity` (decimal) - TLAC
  - `tlac_ratio` (decimal) - TLAC as % of RWA
  - `qualified_ltd` (decimal) - Qualified long-term debt
  - `operational_deposit_capacity` (decimal)
  - `resolution_liquidity_requirement` (decimal)
  - `resolution_liquidity_available` (decimal)
  - `critical_operations_count` (integer) - Number of critical operations
  - `material_entities_count` (integer) - Number of material entities
  - `cross_border_exposures` (decimal)
  - `is_resolution_ready` (boolean)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 6. `reg_k_metrics` - International Banking Operations (Reg K)
  Tracks foreign banking operations and exposures
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `report_date` (date)
  - `total_foreign_exposures` (decimal)
  - `country_risk_rating` (text)
  - `cross_currency_funding_gap` (decimal)
  - `foreign_office_assets` (decimal)
  - `foreign_office_liabilities` (decimal)
  - `fx_swap_notional` (decimal)
  - `net_stable_funding_ratio_foreign` (decimal)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 7. `stress_test_results` - CCAR/DFAST Stress Testing
  Stores stress test scenario results
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `test_date` (date)
  - `scenario_name` (text) - Baseline, Adverse, Severely Adverse
  - `stressed_tier1_ratio` (decimal)
  - `stressed_leverage_ratio` (decimal)
  - `stressed_lcr` (decimal)
  - `cumulative_losses` (decimal)
  - `pre_provision_net_revenue` (decimal)
  - `net_income` (decimal)
  - `notes` (text)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own regulatory data
  - Separate policies for SELECT, INSERT, UPDATE, DELETE

  ## Indexes
  - Indexes on user_id and report_date for all tables
  - Additional indexes on compliance indicators

  ## Important Notes
  1. All ratios and percentages stored as decimal values
  2. Category II institutions (like State Street) have modified requirements
  3. LCR and NSFR must be ≥ 100% for compliance
  4. Data supports FR 2052a (LCR), FR 2065 (NSFR), FR Y-14 (CCAR), FR Y-15 (165d)
  5. Interest rate risk follows OCC 2023 guidance on IRR management
*/

-- Create lcr_metrics table
CREATE TABLE IF NOT EXISTS lcr_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  hqla_level_1 decimal(15,2) DEFAULT 0.00,
  hqla_level_2a decimal(15,2) DEFAULT 0.00,
  hqla_level_2b decimal(15,2) DEFAULT 0.00,
  total_hqla decimal(15,2) DEFAULT 0.00,
  total_net_cash_outflows decimal(15,2) DEFAULT 0.00,
  lcr_ratio decimal(10,4),
  is_compliant boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create nsfr_metrics table
CREATE TABLE IF NOT EXISTS nsfr_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  available_stable_funding decimal(15,2) DEFAULT 0.00,
  required_stable_funding decimal(15,2) DEFAULT 0.00,
  nsfr_ratio decimal(10,4),
  is_compliant boolean DEFAULT false,
  retail_deposits decimal(15,2) DEFAULT 0.00,
  wholesale_funding decimal(15,2) DEFAULT 0.00,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create balance_sheet_metrics table
CREATE TABLE IF NOT EXISTS balance_sheet_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  total_assets decimal(15,2) DEFAULT 0.00,
  total_liabilities decimal(15,2) DEFAULT 0.00,
  total_equity decimal(15,2) DEFAULT 0.00,
  cash_and_due_from_banks decimal(15,2) DEFAULT 0.00,
  securities_available_for_sale decimal(15,2) DEFAULT 0.00,
  securities_held_to_maturity decimal(15,2) DEFAULT 0.00,
  loans_gross decimal(15,2) DEFAULT 0.00,
  allowance_for_loan_losses decimal(15,2) DEFAULT 0.00,
  deposits_total decimal(15,2) DEFAULT 0.00,
  deposits_noninterest_bearing decimal(15,2) DEFAULT 0.00,
  deposits_interest_bearing decimal(15,2) DEFAULT 0.00,
  short_term_borrowings decimal(15,2) DEFAULT 0.00,
  long_term_debt decimal(15,2) DEFAULT 0.00,
  tier1_capital decimal(15,2) DEFAULT 0.00,
  total_risk_weighted_assets decimal(15,2) DEFAULT 0.00,
  tier1_capital_ratio decimal(10,4),
  leverage_ratio decimal(10,4),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create interest_rate_risk_metrics table
CREATE TABLE IF NOT EXISTS interest_rate_risk_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  scenario_type text NOT NULL,
  nii_current decimal(15,2) DEFAULT 0.00,
  nii_scenario decimal(15,2) DEFAULT 0.00,
  nii_change_amount decimal(15,2) DEFAULT 0.00,
  nii_change_percent decimal(10,4),
  eve_current decimal(15,2) DEFAULT 0.00,
  eve_scenario decimal(15,2) DEFAULT 0.00,
  eve_change_amount decimal(15,2) DEFAULT 0.00,
  eve_change_percent decimal(10,4),
  duration_gap decimal(10,4),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create resolution_metrics table
CREATE TABLE IF NOT EXISTS resolution_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  total_loss_absorbing_capacity decimal(15,2) DEFAULT 0.00,
  tlac_ratio decimal(10,4),
  qualified_ltd decimal(15,2) DEFAULT 0.00,
  operational_deposit_capacity decimal(15,2) DEFAULT 0.00,
  resolution_liquidity_requirement decimal(15,2) DEFAULT 0.00,
  resolution_liquidity_available decimal(15,2) DEFAULT 0.00,
  critical_operations_count integer DEFAULT 0,
  material_entities_count integer DEFAULT 0,
  cross_border_exposures decimal(15,2) DEFAULT 0.00,
  is_resolution_ready boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create reg_k_metrics table
CREATE TABLE IF NOT EXISTS reg_k_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  total_foreign_exposures decimal(15,2) DEFAULT 0.00,
  country_risk_rating text,
  cross_currency_funding_gap decimal(15,2) DEFAULT 0.00,
  foreign_office_assets decimal(15,2) DEFAULT 0.00,
  foreign_office_liabilities decimal(15,2) DEFAULT 0.00,
  fx_swap_notional decimal(15,2) DEFAULT 0.00,
  net_stable_funding_ratio_foreign decimal(10,4),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create stress_test_results table
CREATE TABLE IF NOT EXISTS stress_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  scenario_name text NOT NULL,
  stressed_tier1_ratio decimal(10,4),
  stressed_leverage_ratio decimal(10,4),
  stressed_lcr decimal(10,4),
  cumulative_losses decimal(15,2) DEFAULT 0.00,
  pre_provision_net_revenue decimal(15,2) DEFAULT 0.00,
  net_income decimal(15,2) DEFAULT 0.00,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lcr_metrics_user_id ON lcr_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_lcr_metrics_report_date ON lcr_metrics(report_date);
CREATE INDEX IF NOT EXISTS idx_lcr_metrics_compliance ON lcr_metrics(is_compliant);

CREATE INDEX IF NOT EXISTS idx_nsfr_metrics_user_id ON nsfr_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfr_metrics_report_date ON nsfr_metrics(report_date);
CREATE INDEX IF NOT EXISTS idx_nsfr_metrics_compliance ON nsfr_metrics(is_compliant);

CREATE INDEX IF NOT EXISTS idx_balance_sheet_metrics_user_id ON balance_sheet_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_sheet_metrics_report_date ON balance_sheet_metrics(report_date);

CREATE INDEX IF NOT EXISTS idx_irr_metrics_user_id ON interest_rate_risk_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_irr_metrics_report_date ON interest_rate_risk_metrics(report_date);

CREATE INDEX IF NOT EXISTS idx_resolution_metrics_user_id ON resolution_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_resolution_metrics_report_date ON resolution_metrics(report_date);

CREATE INDEX IF NOT EXISTS idx_reg_k_metrics_user_id ON reg_k_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_reg_k_metrics_report_date ON reg_k_metrics(report_date);

CREATE INDEX IF NOT EXISTS idx_stress_test_results_user_id ON stress_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_test_results_test_date ON stress_test_results(test_date);

-- Enable Row Level Security
ALTER TABLE lcr_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfr_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheet_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_rate_risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reg_k_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lcr_metrics
CREATE POLICY "Users can view own LCR metrics"
  ON lcr_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LCR metrics"
  ON lcr_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LCR metrics"
  ON lcr_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own LCR metrics"
  ON lcr_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for nsfr_metrics
CREATE POLICY "Users can view own NSFR metrics"
  ON nsfr_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own NSFR metrics"
  ON nsfr_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own NSFR metrics"
  ON nsfr_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own NSFR metrics"
  ON nsfr_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for balance_sheet_metrics
CREATE POLICY "Users can view own balance sheet metrics"
  ON balance_sheet_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance sheet metrics"
  ON balance_sheet_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balance sheet metrics"
  ON balance_sheet_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own balance sheet metrics"
  ON balance_sheet_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for interest_rate_risk_metrics
CREATE POLICY "Users can view own IRR metrics"
  ON interest_rate_risk_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IRR metrics"
  ON interest_rate_risk_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IRR metrics"
  ON interest_rate_risk_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own IRR metrics"
  ON interest_rate_risk_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for resolution_metrics
CREATE POLICY "Users can view own resolution metrics"
  ON resolution_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resolution metrics"
  ON resolution_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resolution metrics"
  ON resolution_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resolution metrics"
  ON resolution_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for reg_k_metrics
CREATE POLICY "Users can view own Reg K metrics"
  ON reg_k_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Reg K metrics"
  ON reg_k_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Reg K metrics"
  ON reg_k_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Reg K metrics"
  ON reg_k_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for stress_test_results
CREATE POLICY "Users can view own stress test results"
  ON stress_test_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stress test results"
  ON stress_test_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stress test results"
  ON stress_test_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stress test results"
  ON stress_test_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);