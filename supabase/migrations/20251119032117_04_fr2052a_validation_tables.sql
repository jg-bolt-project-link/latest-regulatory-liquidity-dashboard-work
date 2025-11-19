-- File Submissions Table
CREATE TABLE IF NOT EXISTS fr2052a_file_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  upload_timestamp timestamptz DEFAULT now(),
  reporting_entity text NOT NULL,
  reporting_period date NOT NULL,
  submission_status text DEFAULT 'pending',
  total_rows integer DEFAULT 0,
  valid_rows integer DEFAULT 0,
  error_rows integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Validation Rules Table
CREATE TABLE IF NOT EXISTS fr2052a_validation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_category text NOT NULL,
  rule_name text NOT NULL,
  field_name text,
  allowed_values jsonb,
  validation_logic text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation Errors Table
CREATE TABLE IF NOT EXISTS fr2052a_validation_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid,
  data_row_id uuid,
  error_type text NOT NULL,
  error_message text NOT NULL,
  field_name text,
  expected_value text,
  actual_value text,
  severity text DEFAULT 'critical',
  created_at timestamptz DEFAULT now()
);

-- Enumerations Table
CREATE TABLE IF NOT EXISTS fr2052a_enumerations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  allowed_value text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(field_name, allowed_value)
);

-- Entity Mapping Table
CREATE TABLE IF NOT EXISTS fr2052a_entity_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL UNIQUE,
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  submission_frequency text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fr2052a_file_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_validation_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_enumerations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr2052a_entity_mapping ENABLE ROW LEVEL SECURITY;

-- Allow all access
CREATE POLICY "Allow all access to file submissions" ON fr2052a_file_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to validation rules" ON fr2052a_validation_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to validation errors" ON fr2052a_validation_errors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to enumerations" ON fr2052a_enumerations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to entity mapping" ON fr2052a_entity_mapping FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_entity ON fr2052a_file_submissions(reporting_entity);
CREATE INDEX IF NOT EXISTS idx_submissions_period ON fr2052a_file_submissions(reporting_period);
CREATE INDEX IF NOT EXISTS idx_errors_submission ON fr2052a_validation_errors(submission_id);
CREATE INDEX IF NOT EXISTS idx_enumerations_field ON fr2052a_enumerations(field_name);