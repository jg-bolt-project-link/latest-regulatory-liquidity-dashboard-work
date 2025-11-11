-- Data Quality and FR2052a Schema

CREATE TABLE IF NOT EXISTS data_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feed_name text NOT NULL,
  feed_type text NOT NULL,
  source_system text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_successful_run timestamptz,
  last_run_at timestamptz,
  records_loaded integer DEFAULT 0,
  error_count integer DEFAULT 0,
  freshness_threshold_hours integer DEFAULT 24,
  is_stale boolean DEFAULT false,
  connection_status text DEFAULT 'connected',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  check_name text NOT NULL,
  check_type text NOT NULL,
  data_source text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_records integer DEFAULT 0,
  passed_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  execution_time_ms integer DEFAULT 0,
  last_run_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_table text NOT NULL,
  source_field text NOT NULL,
  target_table text NOT NULL,
  target_field text NOT NULL,
  transformation_logic text,
  data_flow_direction text DEFAULT 'upstream',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fr2052a_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  submission_date date NOT NULL,
  reporting_period date NOT NULL,
  submission_type text NOT NULL,
  legal_entity_id text NOT NULL,
  total_hqla numeric DEFAULT 0,
  total_outflows numeric DEFAULT 0,
  total_inflows numeric DEFAULT 0,
  net_cash_outflow numeric DEFAULT 0,
  lcr_ratio numeric DEFAULT 0,
  is_submitted boolean DEFAULT false,
  submission_status text DEFAULT 'draft',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_feeds_user_id ON data_feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_checks_user_id ON data_quality_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_data_lineage_user_id ON data_lineage(user_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_submissions_user_id ON fr2052a_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_submissions_reporting_period ON fr2052a_submissions(reporting_period);

ALTER TABLE data_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to data_feeds" ON data_feeds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to data_quality_checks" ON data_quality_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to data_lineage" ON data_lineage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to fr2052a_submissions" ON fr2052a_submissions FOR ALL USING (true) WITH CHECK (true);
