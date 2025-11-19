-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  company_name text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  account_type text NOT NULL,
  currency text DEFAULT 'USD',
  current_balance decimal(15,2) DEFAULT 0.00,
  institution text,
  account_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  amount decimal(15,2) NOT NULL,
  transaction_type text NOT NULL,
  category text,
  reference_number text,
  created_at timestamptz DEFAULT now()
);

-- Create liquidity_reports table
CREATE TABLE IF NOT EXISTS liquidity_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  report_type text NOT NULL,
  total_assets decimal(15,2) DEFAULT 0.00,
  total_liabilities decimal(15,2) DEFAULT 0.00,
  net_liquidity decimal(15,2) DEFAULT 0.00,
  cash_ratio decimal(10,4),
  quick_ratio decimal(10,4),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_liquidity_reports_user_id ON liquidity_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_reports_date ON liquidity_reports(report_date);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_reports ENABLE ROW LEVEL SECURITY;

-- Allow all access (no auth)
CREATE POLICY "Allow all access to accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to liquidity_reports" ON liquidity_reports FOR ALL USING (true) WITH CHECK (true);