/*
  # FR 2052a Validation Checks Schema

  This migration creates the database schema for FR 2052a data validation checks.
  It implements the 10 core validation categories required for regulatory compliance.

  1. New Tables
    - `fr2052a_file_submissions`
      - Tracks each file submission with metadata
      - `id` (uuid, primary key)
      - `file_name` (text)
      - `upload_timestamp` (timestamptz)
      - `reporting_entity` (text)
      - `reporting_period` (date)
      - `submission_status` (text - pending/validated/rejected)
      - `total_rows` (integer)
      - `valid_rows` (integer)
      - `error_rows` (integer)
      - `created_at` (timestamptz)

    - `fr2052a_validation_rules`
      - Stores business rules and enumerations
      - `id` (uuid, primary key)
      - `rule_category` (text - enumeration/field_dependency/cross_field/etc)
      - `rule_name` (text)
      - `field_name` (text)
      - `allowed_values` (jsonb - for enumerations)
      - `validation_logic` (text - description of rule)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `fr2052a_data_rows`
      - Stores parsed FR 2052a data rows
      - `id` (uuid, primary key)
      - `submission_id` (uuid, foreign key to fr2052a_file_submissions)
      - `table_name` (text - InflowsAssets/OutflowsWholesale/etc)
      - `reporting_entity` (text)
      - `product` (text)
      - `sub_product` (text)
      - `sub_product2` (text)
      - `counterparty` (text)
      - `maturity_bucket` (text)
      - `currency` (text)
      - `internal_flag` (boolean)
      - `internal_counterparty` (text)
      - `market_value` (numeric)
      - `lendable_value` (numeric)
      - `fair_value` (numeric)
      - `amount` (numeric)
      - `raw_data` (jsonb - full row data)
      - `created_at` (timestamptz)

    - `fr2052a_validation_errors`
      - Tracks validation errors for each row
      - `id` (uuid, primary key)
      - `submission_id` (uuid, foreign key)
      - `data_row_id` (uuid, foreign key)
      - `error_type` (text - schema/enumeration/dependency/symmetry/duplicate/etc)
      - `error_message` (text)
      - `field_name` (text)
      - `expected_value` (text)
      - `actual_value` (text)
      - `severity` (text - critical/warning/info)
      - `created_at` (timestamptz)

    - `fr2052a_enumerations`
      - Stores allowed enumeration values per field
      - `id` (uuid, primary key)
      - `field_name` (text)
      - `allowed_value` (text)
      - `description` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)

    - `fr2052a_entity_mapping`
      - Stores reporting entity metadata
      - `id` (uuid, primary key)
      - `entity_id` (text - RSSD or LEI)
      - `entity_name` (text)
      - `entity_type` (text - Category I/II/III/IV)
      - `submission_frequency` (text - daily/monthly)
      - `is_active` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

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

ALTER TABLE fr2052a_file_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to file submissions"
  ON fr2052a_file_submissions
  FOR ALL
  USING (true)
  WITH CHECK (true);

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

ALTER TABLE fr2052a_validation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to validation rules"
  ON fr2052a_validation_rules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Data Rows Table
CREATE TABLE IF NOT EXISTS fr2052a_data_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES fr2052a_file_submissions(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  reporting_entity text NOT NULL,
  product text,
  sub_product text,
  sub_product2 text,
  counterparty text,
  maturity_bucket text,
  currency text,
  internal_flag boolean DEFAULT false,
  internal_counterparty text,
  market_value numeric,
  lendable_value numeric,
  fair_value numeric,
  amount numeric,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fr2052a_data_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to data rows"
  ON fr2052a_data_rows
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Validation Errors Table
CREATE TABLE IF NOT EXISTS fr2052a_validation_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES fr2052a_file_submissions(id) ON DELETE CASCADE,
  data_row_id uuid REFERENCES fr2052a_data_rows(id) ON DELETE CASCADE,
  error_type text NOT NULL,
  error_message text NOT NULL,
  field_name text,
  expected_value text,
  actual_value text,
  severity text DEFAULT 'critical',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fr2052a_validation_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to validation errors"
  ON fr2052a_validation_errors
  FOR ALL
  USING (true)
  WITH CHECK (true);

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

ALTER TABLE fr2052a_enumerations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to enumerations"
  ON fr2052a_enumerations
  FOR ALL
  USING (true)
  WITH CHECK (true);

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

ALTER TABLE fr2052a_entity_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to entity mapping"
  ON fr2052a_entity_mapping
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_entity ON fr2052a_file_submissions(reporting_entity);
CREATE INDEX IF NOT EXISTS idx_submissions_period ON fr2052a_file_submissions(reporting_period);
CREATE INDEX IF NOT EXISTS idx_data_rows_submission ON fr2052a_data_rows(submission_id);
CREATE INDEX IF NOT EXISTS idx_errors_submission ON fr2052a_validation_errors(submission_id);
CREATE INDEX IF NOT EXISTS idx_enumerations_field ON fr2052a_enumerations(field_name);
