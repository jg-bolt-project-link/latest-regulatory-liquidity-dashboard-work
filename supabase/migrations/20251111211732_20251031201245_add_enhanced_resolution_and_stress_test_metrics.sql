-- Enhanced Resolution and Stress Test Metrics

CREATE TABLE IF NOT EXISTS resolution_liquidity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  rcap_amount numeric NOT NULL DEFAULT 0,
  rcap_ratio numeric NOT NULL DEFAULT 0,
  rcap_requirement numeric NOT NULL DEFAULT 0,
  rcap_surplus_deficit numeric NOT NULL DEFAULT 0,
  rcen_amount numeric NOT NULL DEFAULT 0,
  rcen_ratio numeric NOT NULL DEFAULT 0,
  rcen_requirement numeric NOT NULL DEFAULT 0,
  rlap_amount numeric NOT NULL DEFAULT 0,
  rlap_ratio numeric NOT NULL DEFAULT 0,
  rlap_requirement numeric NOT NULL DEFAULT 0,
  rlap_surplus_deficit numeric NOT NULL DEFAULT 0,
  rlen_amount numeric NOT NULL DEFAULT 0,
  rlen_ratio numeric NOT NULL DEFAULT 0,
  rlen_requirement numeric NOT NULL DEFAULT 0,
  resolution_strategy text,
  material_entities_count integer DEFAULT 0,
  is_compliant boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS liquidity_stress_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  scenario_name text NOT NULL,
  scenario_type text NOT NULL,
  baseline_liquidity numeric NOT NULL DEFAULT 0,
  baseline_hqla numeric NOT NULL DEFAULT 0,
  baseline_deposits numeric NOT NULL DEFAULT 0,
  stressed_liquidity numeric NOT NULL DEFAULT 0,
  stressed_cash_inflows numeric NOT NULL DEFAULT 0,
  stressed_cash_outflows numeric NOT NULL DEFAULT 0,
  stressed_net_cash_flow numeric NOT NULL DEFAULT 0,
  liquidity_gap numeric NOT NULL DEFAULT 0,
  survival_horizon_days integer DEFAULT 0,
  contingent_funding_required numeric NOT NULL DEFAULT 0,
  is_within_risk_appetite boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resolution_liquidity_metrics_user_id ON resolution_liquidity_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_resolution_liquidity_metrics_report_date ON resolution_liquidity_metrics(report_date);
CREATE INDEX IF NOT EXISTS idx_liquidity_stress_tests_user_id ON liquidity_stress_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_stress_tests_report_date ON liquidity_stress_tests(report_date);

ALTER TABLE resolution_liquidity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_stress_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to resolution_liquidity_metrics" ON resolution_liquidity_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to liquidity_stress_tests" ON liquidity_stress_tests FOR ALL USING (true) WITH CHECK (true);
