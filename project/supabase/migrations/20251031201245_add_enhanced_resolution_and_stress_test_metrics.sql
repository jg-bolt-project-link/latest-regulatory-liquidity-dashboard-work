/*
  # Add Enhanced Resolution and Stress Test Metrics

  1. New Tables
    - `resolution_liquidity_metrics`
      - Stores RCAP, RCEN, RLAP, RLEN per regulatory requirements
      - Tracks resolution capital and liquidity adequacy positions
      - Links to user and includes report dates
    
    - `liquidity_stress_tests`
      - Stores internal liquidity stress test results
      - Includes 30-day short-term and 1-year scenarios
      - Tracks stressed cash flows and liquidity positions
      - Links to user with report dates

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their own data
    - Add policies for authenticated users to insert their own data
*/

-- Resolution Liquidity Metrics Table
CREATE TABLE IF NOT EXISTS resolution_liquidity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  report_date date NOT NULL,
  
  -- Resolution Capital Metrics
  rcap_amount numeric NOT NULL DEFAULT 0,
  rcap_ratio numeric NOT NULL DEFAULT 0,
  rcap_requirement numeric NOT NULL DEFAULT 0,
  rcap_surplus_deficit numeric NOT NULL DEFAULT 0,
  
  -- Resolution Capital Execution Need
  rcen_amount numeric NOT NULL DEFAULT 0,
  rcen_ratio numeric NOT NULL DEFAULT 0,
  rcen_requirement numeric NOT NULL DEFAULT 0,
  
  -- Resolution Liquidity Adequacy Position
  rlap_amount numeric NOT NULL DEFAULT 0,
  rlap_ratio numeric NOT NULL DEFAULT 0,
  rlap_requirement numeric NOT NULL DEFAULT 0,
  rlap_surplus_deficit numeric NOT NULL DEFAULT 0,
  
  -- Resolution Liquidity Execution Need
  rlen_amount numeric NOT NULL DEFAULT 0,
  rlen_ratio numeric NOT NULL DEFAULT 0,
  rlen_requirement numeric NOT NULL DEFAULT 0,
  
  -- Additional Context
  resolution_strategy text,
  material_entities_count integer DEFAULT 0,
  is_compliant boolean DEFAULT true,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, report_date)
);

-- Liquidity Stress Tests Table
CREATE TABLE IF NOT EXISTS liquidity_stress_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  report_date date NOT NULL,
  scenario_name text NOT NULL,
  scenario_type text NOT NULL, -- '30_day_short_term' or '1_year_extended'
  
  -- Baseline Metrics
  baseline_liquidity numeric NOT NULL DEFAULT 0,
  baseline_hqla numeric NOT NULL DEFAULT 0,
  baseline_deposits numeric NOT NULL DEFAULT 0,
  
  -- Stressed Metrics
  stressed_liquidity numeric NOT NULL DEFAULT 0,
  stressed_cash_inflows numeric NOT NULL DEFAULT 0,
  stressed_cash_outflows numeric NOT NULL DEFAULT 0,
  stressed_net_cash_flow numeric NOT NULL DEFAULT 0,
  
  -- Impact Analysis
  liquidity_shortfall numeric NOT NULL DEFAULT 0,
  survival_days integer DEFAULT 0,
  stress_severity text DEFAULT 'Moderate', -- Mild, Moderate, Severe, Extreme
  
  -- Stress Assumptions
  deposit_runoff_rate numeric DEFAULT 0,
  wholesale_funding_rollover_rate numeric DEFAULT 0,
  credit_line_drawdown_rate numeric DEFAULT 0,
  asset_liquidation_haircut numeric DEFAULT 0,
  
  -- Test Results
  passes_internal_threshold boolean DEFAULT true,
  min_liquidity_buffer_maintained boolean DEFAULT true,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, report_date, scenario_name)
);

-- Enable RLS
ALTER TABLE resolution_liquidity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_stress_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resolution_liquidity_metrics
CREATE POLICY "Users can view own resolution liquidity metrics"
  ON resolution_liquidity_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resolution liquidity metrics"
  ON resolution_liquidity_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resolution liquidity metrics"
  ON resolution_liquidity_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resolution liquidity metrics"
  ON resolution_liquidity_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for liquidity_stress_tests
CREATE POLICY "Users can view own stress tests"
  ON liquidity_stress_tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stress tests"
  ON liquidity_stress_tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stress tests"
  ON liquidity_stress_tests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stress tests"
  ON liquidity_stress_tests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resolution_liquidity_metrics_user_date 
  ON resolution_liquidity_metrics(user_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_liquidity_stress_tests_user_date 
  ON liquidity_stress_tests(user_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_liquidity_stress_tests_scenario 
  ON liquidity_stress_tests(user_id, scenario_type, report_date DESC);
