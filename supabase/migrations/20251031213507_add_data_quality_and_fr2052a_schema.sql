/*
  # Add Data Quality and FR2052a Schema

  1. New Tables
    - `data_quality_checks`
      - Tracks input/output data validation checks
      - Records check status, error counts, and timestamps
      - Links to user and includes check types
    
    - `data_feeds`
      - Tracks data feed status and health
      - Records last run time, row counts, errors
      - Monitors feed connectivity and freshness
    
    - `data_lineage`
      - Tracks data transformation pipeline
      - Records source to target mappings
      - Includes transformation rules and dependencies
    
    - `fr2052a_data`
      - Stores FR2052a reporting data
      - Product ID details and attributes
      - Maturity buckets and cash flows
      - Links to user with report dates

    - `fr2052a_quality_checks`
      - FR2052a-specific data quality validations
      - Federal Reserve Board validation rules
      - Error tracking and compliance status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Data Quality Checks Table
CREATE TABLE IF NOT EXISTS data_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  check_name text NOT NULL,
  check_type text NOT NULL, -- 'input', 'output', 'transformation', 'reconciliation'
  data_source text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'running', 'passed', 'failed', 'warning'
  total_records bigint DEFAULT 0,
  passed_records bigint DEFAULT 0,
  failed_records bigint DEFAULT 0,
  error_message text,
  execution_time_ms integer,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Data Feeds Table
CREATE TABLE IF NOT EXISTS data_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  feed_name text NOT NULL,
  feed_type text NOT NULL, -- 'core_banking', 'treasury', 'market_data', 'regulatory'
  source_system text NOT NULL,
  status text DEFAULT 'active', -- 'active', 'inactive', 'error', 'stale'
  last_successful_run timestamptz,
  last_run_at timestamptz,
  records_loaded bigint DEFAULT 0,
  error_count integer DEFAULT 0,
  freshness_threshold_hours integer DEFAULT 24,
  is_stale boolean DEFAULT false,
  connection_status text DEFAULT 'connected',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Data Lineage Table
CREATE TABLE IF NOT EXISTS data_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  source_system text NOT NULL,
  source_table text NOT NULL,
  source_column text,
  target_system text NOT NULL,
  target_table text NOT NULL,
  target_column text,
  transformation_rule text,
  transformation_type text, -- 'direct', 'calculated', 'aggregated', 'derived'
  dependency_level integer DEFAULT 1,
  is_critical boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FR2052a Data Table
CREATE TABLE IF NOT EXISTS fr2052a_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  report_date date NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_category text NOT NULL, -- 'deposits', 'loans', 'securities', 'derivatives', 'other'
  maturity_bucket text NOT NULL, -- 'overnight', '2-7days', '8-30days', '31-90days', etc.
  currency text DEFAULT 'USD',
  outstanding_balance numeric NOT NULL DEFAULT 0,
  projected_cash_inflow numeric DEFAULT 0,
  projected_cash_outflow numeric DEFAULT 0,
  net_cash_flow numeric DEFAULT 0,
  haircut_rate numeric DEFAULT 0,
  encumbered_amount numeric DEFAULT 0,
  counterparty_type text,
  internal_rating text,
  is_hqla boolean DEFAULT false,
  location_code text,
  reporting_entity text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FR2052a Quality Checks Table
CREATE TABLE IF NOT EXISTS fr2052a_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  report_date date NOT NULL,
  check_name text NOT NULL,
  check_category text NOT NULL, -- 'completeness', 'accuracy', 'consistency', 'validity'
  validation_rule text NOT NULL,
  frb_rule_reference text,
  status text DEFAULT 'pending',
  total_products_checked integer DEFAULT 0,
  passed_products integer DEFAULT 0,
  failed_products integer DEFAULT 0,
  error_details jsonb,
  severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE data_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_quality_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_quality_checks
CREATE POLICY "Users can view own quality checks"
  ON data_quality_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quality checks"
  ON data_quality_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quality checks"
  ON data_quality_checks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quality checks"
  ON data_quality_checks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for data_feeds
CREATE POLICY "Users can view own feeds"
  ON data_feeds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feeds"
  ON data_feeds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feeds"
  ON data_feeds FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feeds"
  ON data_feeds FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for data_lineage
CREATE POLICY "Users can view own lineage"
  ON data_lineage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lineage"
  ON data_lineage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lineage"
  ON data_lineage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lineage"
  ON data_lineage FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for fr2052a_data
CREATE POLICY "Users can view own FR2052a data"
  ON fr2052a_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own FR2052a data"
  ON fr2052a_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FR2052a data"
  ON fr2052a_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own FR2052a data"
  ON fr2052a_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for fr2052a_quality_checks
CREATE POLICY "Users can view own FR2052a checks"
  ON fr2052a_quality_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own FR2052a checks"
  ON fr2052a_quality_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FR2052a checks"
  ON fr2052a_quality_checks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own FR2052a checks"
  ON fr2052a_quality_checks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_quality_checks_user_type 
  ON data_quality_checks(user_id, check_type, last_run_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_feeds_user_status 
  ON data_feeds(user_id, status, last_run_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_lineage_user_target 
  ON data_lineage(user_id, target_table);

CREATE INDEX IF NOT EXISTS idx_fr2052a_data_user_date_product 
  ON fr2052a_data(user_id, report_date DESC, product_id);

CREATE INDEX IF NOT EXISTS idx_fr2052a_quality_checks_user_date 
  ON fr2052a_quality_checks(user_id, report_date DESC, status);
