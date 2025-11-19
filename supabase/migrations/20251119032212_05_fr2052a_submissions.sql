-- FR2052a submissions table
CREATE TABLE IF NOT EXISTS fr2052a_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fr2052a_submissions_user_id ON fr2052a_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_fr2052a_submissions_reporting_period ON fr2052a_submissions(reporting_period);

-- Enable RLS
ALTER TABLE fr2052a_submissions ENABLE ROW LEVEL SECURITY;

-- Allow all access
CREATE POLICY "Allow all access to fr2052a_submissions" ON fr2052a_submissions FOR ALL USING (true) WITH CHECK (true);