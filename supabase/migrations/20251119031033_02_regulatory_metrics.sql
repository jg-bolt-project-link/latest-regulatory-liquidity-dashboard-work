-- LCR metrics table
CREATE TABLE IF NOT EXISTS lcr_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  legal_entity_id uuid,
  report_date date NOT NULL,
  hqla_level_1 decimal(15,2) DEFAULT 0.00,
  hqla_level_2a decimal(15,2) DEFAULT 0.00,
  hqla_level_2b decimal(15,2) DEFAULT 0.00,
  total_hqla decimal(15,2) DEFAULT 0.00,
  total_net_cash_outflows decimal(15,2) DEFAULT 0.00,
  lcr_ratio decimal(10,4),
  is_compliant boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(legal_entity_id, report_date)
);

-- NSFR metrics table
CREATE TABLE IF NOT EXISTS nsfr_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  legal_entity_id uuid,
  report_date date NOT NULL,
  available_stable_funding decimal(15,2) DEFAULT 0.00,
  required_stable_funding decimal(15,2) DEFAULT 0.00,
  nsfr_ratio decimal(10,4),
  is_compliant boolean DEFAULT false,
  retail_deposits decimal(15,2) DEFAULT 0.00,
  wholesale_funding decimal(15,2) DEFAULT 0.00,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(legal_entity_id, report_date)
);

-- Balance sheet metrics table
CREATE TABLE IF NOT EXISTS balance_sheet_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  legal_entity_id uuid,
  report_date date NOT NULL,
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
  created_at timestamptz DEFAULT now(),
  UNIQUE(legal_entity_id, report_date)
);

-- Interest rate risk metrics
CREATE TABLE IF NOT EXISTS interest_rate_risk_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  report_date date NOT NULL,
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

-- Resolution metrics
CREATE TABLE IF NOT EXISTS resolution_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  report_date date NOT NULL,
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

-- Reg K metrics
CREATE TABLE IF NOT EXISTS reg_k_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  report_date date NOT NULL,
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

-- Enable RLS
ALTER TABLE lcr_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfr_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheet_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_rate_risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reg_k_metrics ENABLE ROW LEVEL SECURITY;

-- Allow all access
CREATE POLICY "Allow all access to lcr_metrics" ON lcr_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to nsfr_metrics" ON nsfr_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to balance_sheet_metrics" ON balance_sheet_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to interest_rate_risk_metrics" ON interest_rate_risk_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to resolution_metrics" ON resolution_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to reg_k_metrics" ON reg_k_metrics FOR ALL USING (true) WITH CHECK (true);