-- Legal entities table
CREATE TABLE IF NOT EXISTS legal_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  entity_code text NOT NULL,
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  jurisdiction text,
  is_material_entity boolean DEFAULT false,
  parent_entity_id uuid,
  core_business_lines text[],
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FR2052a data rows table
CREATE TABLE IF NOT EXISTS fr2052a_data_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  legal_entity_id uuid,
  report_date date NOT NULL,
  table_name text NOT NULL,
  reporting_entity text,
  product text NOT NULL,
  sub_product text,
  sub_product2 text,
  counterparty text,
  maturity_bucket text,
  currency text DEFAULT 'USD',
  amount decimal(15,2) DEFAULT 0.00,
  market_value decimal(15,2),
  fair_value decimal(15,2),
  asset_class text,
  is_hqla boolean DEFAULT false,
  hqla_level text,
  haircut_rate decimal(10,4),
  runoff_rate decimal(10,4),
  rsf_factor decimal(10,4),
  asf_factor decimal(10,4),
  projected_inflow decimal(15,2),
  projected_outflow decimal(15,2),
  encumbered_amount decimal(15,2),
  internal_rating text,
  created_at timestamptz DEFAULT now()
);

-- Resolution liquidity metrics
CREATE TABLE IF NOT EXISTS resolution_liquidity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  report_date date NOT NULL,
  rcap_amount decimal(15,2) DEFAULT 0.00,
  rcap_ratio decimal(10,4),
  rcap_requirement decimal(15,2) DEFAULT 0.00,
  rcap_surplus_deficit decimal(15,2) DEFAULT 0.00,
  rcen_amount decimal(15,2) DEFAULT 0.00,
  rcen_ratio decimal(10,4),
  rcen_requirement decimal(15,2) DEFAULT 0.00,
  rlap_amount decimal(15,2) DEFAULT 0.00,
  rlap_ratio decimal(10,4),
  rlap_requirement decimal(15,2) DEFAULT 0.00,
  rlap_surplus_deficit decimal(15,2) DEFAULT 0.00,
  rlen_amount decimal(15,2) DEFAULT 0.00,
  rlen_ratio decimal(10,4),
  rlen_requirement decimal(15,2) DEFAULT 0.00,
  resolution_strategy text,
  material_entities_count integer DEFAULT 0,
  is_compliant boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Liquidity stress tests table
CREATE TABLE IF NOT EXISTS liquidity_stress_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  report_date date NOT NULL,
  scenario_name text NOT NULL,
  scenario_type text,
  baseline_liquidity decimal(15,2) DEFAULT 0.00,
  baseline_hqla decimal(15,2) DEFAULT 0.00,
  baseline_deposits decimal(15,2) DEFAULT 0.00,
  stressed_liquidity decimal(15,2) DEFAULT 0.00,
  stressed_cash_inflows decimal(15,2) DEFAULT 0.00,
  stressed_cash_outflows decimal(15,2) DEFAULT 0.00,
  stressed_net_cash_flow decimal(15,2) DEFAULT 0.00,
  liquidity_shortfall decimal(15,2) DEFAULT 0.00,
  survival_days integer DEFAULT 0,
  stress_severity text,
  deposit_runoff_rate decimal(10,4),
  wholesale_funding_rollover_rate decimal(10,4),
  credit_line_drawdown_rate decimal(10,4),
  asset_liquidation_haircut decimal(10,4),
  passes_internal_threshold boolean DEFAULT false,
  min_liquidity_buffer_maintained boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Data feeds table
CREATE TABLE IF NOT EXISTS data_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  feed_name text NOT NULL,
  feed_type text NOT NULL,
  source_system text,
  status text DEFAULT 'active',
  last_successful_run timestamptz,
  last_run_at timestamptz,
  records_loaded integer DEFAULT 0,
  error_count integer DEFAULT 0,
  freshness_threshold_hours integer DEFAULT 24,
  is_stale boolean DEFAULT false,
  connection_status text DEFAULT 'connected',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Data quality checks table
CREATE TABLE IF NOT EXISTS data_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  check_name text NOT NULL,
  check_type text NOT NULL,
  data_source text,
  status text DEFAULT 'passed',
  total_records integer DEFAULT 0,
  passed_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  error_message text,
  execution_time_ms integer,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Data lineage table
CREATE TABLE IF NOT EXISTS data_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  source_system text NOT NULL,
  source_table text NOT NULL,
  source_column text,
  target_system text NOT NULL,
  target_table text NOT NULL,
  target_column text,
  transformation_rule text,
  transformation_type text,
  dependency_level integer DEFAULT 1,
  is_critical boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_data_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_liquidity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_stress_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY;

-- Allow all access
CREATE POLICY "Allow all access to legal_entities" ON legal_entities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to fr2052a_data_rows" ON fr2052a_data_rows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to resolution_liquidity_metrics" ON resolution_liquidity_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to liquidity_stress_tests" ON liquidity_stress_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to data_feeds" ON data_feeds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to data_quality_checks" ON data_quality_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to data_lineage" ON data_lineage FOR ALL USING (true) WITH CHECK (true);