/*
  # Create Schemas for Implementation Gap Remediation

  ## Overview
  Creates database tables to support the 4 high-priority missing screens:
  1. Stress Testing Dashboard (CCAR/DFAST)
  2. Resolution Planning Module
  3. Cash Flow Projections
  4. Contingency Funding Plan

  ## Tables Created
  - stress_test_scenarios
  - stress_test_results
  - critical_operations
  - core_business_lines
  - material_entities
  - cash_flow_projections
  - cash_flow_assumptions
  - contingency_funding_sources
  - funding_stress_triggers
  - cfp_test_exercises

  ## Security
  - RLS enabled on all tables
  - Public access (anon + authenticated) for demo purposes
*/

-- =====================================================
-- 1. STRESS TESTING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS stress_test_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name text NOT NULL,
  scenario_type text NOT NULL CHECK (scenario_type IN ('baseline', 'adverse', 'severely_adverse', 'custom')),
  reporting_period text NOT NULL,
  description text,
  macroeconomic_assumptions jsonb,
  key_variables jsonb,
  unemployment_rate numeric(5,2),
  gdp_growth_rate numeric(5,2),
  market_shock_severity numeric(5,2),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stress_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
  test_date date NOT NULL,
  pre_stress_cet1_ratio numeric(10,4),
  post_stress_cet1_ratio numeric(10,4),
  pre_stress_tier1_ratio numeric(10,4),
  post_stress_tier1_ratio numeric(10,4),
  pre_stress_total_capital_ratio numeric(10,4),
  post_stress_total_capital_ratio numeric(10,4),
  stressed_losses numeric(20,2),
  stressed_revenues numeric(20,2),
  stressed_provisions numeric(20,2),
  minimum_ratio_reached numeric(10,4),
  quarter_of_minimum integer,
  passes_stress_test boolean,
  regulatory_minimum_met boolean,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stress_test_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to manage stress_test_scenarios" ON stress_test_scenarios FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage stress_test_results" ON stress_test_results FOR ALL TO public USING (true) WITH CHECK (true);

-- =====================================================
-- 2. RESOLUTION PLANNING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS critical_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name text NOT NULL,
  operation_code text UNIQUE NOT NULL,
  description text,
  business_line text,
  revenue_contribution numeric(20,2),
  customer_impact_level text CHECK (customer_impact_level IN ('critical', 'high', 'medium', 'low')),
  recovery_time_objective_hours integer,
  dependent_systems text[],
  key_personnel text[],
  geographic_scope text[],
  regulatory_classification text,
  continuity_plan_status text CHECK (continuity_plan_status IN ('complete', 'in_progress', 'not_started')),
  last_tested_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'under_review')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core_business_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_line_name text NOT NULL,
  business_line_code text UNIQUE NOT NULL,
  description text,
  annual_revenue numeric(20,2),
  operating_income numeric(20,2),
  assets_under_management numeric(20,2),
  number_of_clients integer,
  geographic_presence text[],
  key_products text[],
  critical_services text[],
  interconnections text[],
  separability_assessment text,
  wind_down_complexity text CHECK (wind_down_complexity IN ('low', 'medium', 'high', 'very_high')),
  estimated_wind_down_time_months integer,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'divested')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS material_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  jurisdiction text NOT NULL,
  regulatory_classification text,
  total_assets numeric(20,2),
  total_liabilities numeric(20,2),
  capital_amount numeric(20,2),
  internal_tlac_requirement numeric(20,2),
  current_tlac_position numeric(20,2),
  critical_operations uuid[] DEFAULT '{}',
  core_business_lines uuid[] DEFAULT '{}',
  parent_entity_id uuid REFERENCES material_entities(id),
  resolution_strategy text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'merged', 'dissolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE critical_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_business_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to manage critical_operations" ON critical_operations FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage core_business_lines" ON core_business_lines FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage material_entities" ON material_entities FOR ALL TO public USING (true) WITH CHECK (true);

-- =====================================================
-- 3. CASH FLOW PROJECTIONS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS cash_flow_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name text NOT NULL,
  scenario_type text NOT NULL CHECK (scenario_type IN ('baseline', 'stressed', 'adverse', 'custom')),
  description text,
  assumptions jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_flow_projections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES cash_flow_scenarios(id) ON DELETE CASCADE,
  projection_date date NOT NULL,
  time_horizon text NOT NULL CHECK (time_horizon IN ('overnight', '1_week', '30_day', '90_day', '1_year')),
  
  -- Inflows
  maturing_assets numeric(20,2) DEFAULT 0,
  deposit_inflows numeric(20,2) DEFAULT 0,
  wholesale_funding_inflows numeric(20,2) DEFAULT 0,
  securities_sales numeric(20,2) DEFAULT 0,
  fee_income numeric(20,2) DEFAULT 0,
  other_inflows numeric(20,2) DEFAULT 0,
  total_inflows numeric(20,2) GENERATED ALWAYS AS (
    COALESCE(maturing_assets, 0) + COALESCE(deposit_inflows, 0) + 
    COALESCE(wholesale_funding_inflows, 0) + COALESCE(securities_sales, 0) + 
    COALESCE(fee_income, 0) + COALESCE(other_inflows, 0)
  ) STORED,
  
  -- Outflows
  maturing_liabilities numeric(20,2) DEFAULT 0,
  deposit_outflows numeric(20,2) DEFAULT 0,
  wholesale_funding_outflows numeric(20,2) DEFAULT 0,
  loan_disbursements numeric(20,2) DEFAULT 0,
  operating_expenses numeric(20,2) DEFAULT 0,
  derivatives_collateral numeric(20,2) DEFAULT 0,
  other_outflows numeric(20,2) DEFAULT 0,
  total_outflows numeric(20,2) GENERATED ALWAYS AS (
    COALESCE(maturing_liabilities, 0) + COALESCE(deposit_outflows, 0) + 
    COALESCE(wholesale_funding_outflows, 0) + COALESCE(loan_disbursements, 0) + 
    COALESCE(operating_expenses, 0) + COALESCE(derivatives_collateral, 0) + 
    COALESCE(other_outflows, 0)
  ) STORED,
  
  net_cash_flow numeric(20,2) GENERATED ALWAYS AS (
    COALESCE(maturing_assets, 0) + COALESCE(deposit_inflows, 0) + 
    COALESCE(wholesale_funding_inflows, 0) + COALESCE(securities_sales, 0) + 
    COALESCE(fee_income, 0) + COALESCE(other_inflows, 0) -
    (COALESCE(maturing_liabilities, 0) + COALESCE(deposit_outflows, 0) + 
    COALESCE(wholesale_funding_outflows, 0) + COALESCE(loan_disbursements, 0) + 
    COALESCE(operating_expenses, 0) + COALESCE(derivatives_collateral, 0) + 
    COALESCE(other_outflows, 0))
  ) STORED,
  
  cumulative_net_cash_flow numeric(20,2),
  available_liquidity numeric(20,2),
  liquidity_buffer numeric(20,2),
  
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cash_flow_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to manage cash_flow_scenarios" ON cash_flow_scenarios FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage cash_flow_projections" ON cash_flow_projections FOR ALL TO public USING (true) WITH CHECK (true);

-- =====================================================
-- 4. CONTINGENCY FUNDING PLAN TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS contingency_funding_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('committed_line', 'repo_capacity', 'discount_window', 'asset_sales', 'deposits', 'wholesale', 'other')),
  counterparty text,
  total_capacity numeric(20,2) NOT NULL,
  available_capacity numeric(20,2) NOT NULL,
  utilized_amount numeric(20,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  maturity_date date,
  pricing_spread numeric(10,4),
  collateral_required boolean DEFAULT false,
  collateral_type text,
  collateral_haircut numeric(5,2),
  activation_time_hours integer,
  restrictions text,
  last_tested_date date,
  status text DEFAULT 'available' CHECK (status IN ('available', 'utilized', 'expired', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_stress_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name text NOT NULL,
  trigger_category text NOT NULL CHECK (trigger_category IN ('market_based', 'firm_specific', 'systemic', 'operational')),
  trigger_type text NOT NULL CHECK (trigger_type IN ('early_warning', 'moderate', 'severe', 'crisis')),
  description text NOT NULL,
  quantitative_threshold text,
  monitoring_frequency text CHECK (monitoring_frequency IN ('real_time', 'daily', 'weekly', 'monthly')),
  responsible_team text,
  escalation_procedure text,
  response_actions text[],
  communication_protocol text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'triggered')),
  last_reviewed_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cfp_test_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name text NOT NULL,
  exercise_date date NOT NULL,
  exercise_type text NOT NULL CHECK (exercise_type IN ('tabletop', 'walkthrough', 'simulation', 'live_drill')),
  scenario_description text,
  participants text[],
  funding_sources_tested uuid[],
  triggers_tested uuid[],
  objectives text[],
  outcomes text,
  lessons_learned text,
  action_items text[],
  effectiveness_rating text CHECK (effectiveness_rating IN ('excellent', 'good', 'fair', 'needs_improvement')),
  next_test_date date,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contingency_funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_stress_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfp_test_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to manage contingency_funding_sources" ON contingency_funding_sources FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage funding_stress_triggers" ON funding_stress_triggers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage cfp_test_exercises" ON cfp_test_exercises FOR ALL TO public USING (true) WITH CHECK (true);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_stress_test_results_scenario ON stress_test_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_scenario ON cash_flow_projections(scenario_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_date ON cash_flow_projections(projection_date);
CREATE INDEX IF NOT EXISTS idx_funding_sources_status ON contingency_funding_sources(status);
CREATE INDEX IF NOT EXISTS idx_stress_triggers_status ON funding_stress_triggers(status);

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE stress_test_scenarios IS 'CCAR/DFAST stress testing scenarios';
COMMENT ON TABLE critical_operations IS 'Critical operations requiring continuity in resolution (Reg WW)';
COMMENT ON TABLE core_business_lines IS 'Core business lines identification for resolution planning';
COMMENT ON TABLE cash_flow_projections IS 'Forward-looking cash flow projections per Reg QQ 39.3';
COMMENT ON TABLE contingency_funding_sources IS 'Available funding sources for contingency funding plan';
COMMENT ON TABLE funding_stress_triggers IS 'Early warning triggers and escalation procedures';
