/*
  # Liquidity Reporting System Database Schema

  ## Overview
  This migration creates a comprehensive liquidity reporting system with authentication,
  account management, transactions, and reporting capabilities.

  ## New Tables

  ### 1. `accounts`
  Stores financial accounts for tracking liquidity positions.
  - `id` (uuid, primary key) - Unique account identifier
  - `user_id` (uuid, foreign key) - Owner of the account
  - `name` (text) - Account name
  - `account_type` (text) - Type: checking, savings, investment, credit, etc.
  - `currency` (text) - Currency code (USD, EUR, etc.)
  - `current_balance` (decimal) - Current account balance
  - `institution` (text) - Financial institution name
  - `account_number` (text) - Masked account number
  - `is_active` (boolean) - Account status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `transactions`
  Records all financial transactions for liquidity tracking.
  - `id` (uuid, primary key) - Unique transaction identifier
  - `account_id` (uuid, foreign key) - Related account
  - `user_id` (uuid, foreign key) - Transaction owner
  - `transaction_date` (date) - Date of transaction
  - `description` (text) - Transaction description
  - `amount` (decimal) - Transaction amount (positive for credits, negative for debits)
  - `transaction_type` (text) - Type: deposit, withdrawal, transfer, fee, interest
  - `category` (text) - Transaction category
  - `reference_number` (text) - External reference
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `liquidity_reports`
  Stores generated liquidity reports and snapshots.
  - `id` (uuid, primary key) - Unique report identifier
  - `user_id` (uuid, foreign key) - Report owner
  - `report_date` (date) - Report date
  - `report_type` (text) - Type: daily, weekly, monthly, custom
  - `total_assets` (decimal) - Total assets value
  - `total_liabilities` (decimal) - Total liabilities value
  - `net_liquidity` (decimal) - Net liquidity position
  - `cash_ratio` (decimal) - Cash ratio metric
  - `quick_ratio` (decimal) - Quick ratio metric
  - `notes` (text) - Report notes
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. `user_profiles`
  Extended user profile information.
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User full name
  - `company_name` (text) - Company/organization name
  - `role` (text) - User role
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Policies for SELECT, INSERT, UPDATE, and DELETE operations
  - Authenticated users only

  ## Important Notes
  1. All monetary values use DECIMAL(15,2) for precision
  2. Timestamps use timestamptz for timezone awareness
  3. Automatic timestamp updates on record modification
  4. Foreign key constraints ensure data integrity
  5. Indexes on frequently queried columns for performance
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_liquidity_reports_user_id ON liquidity_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_reports_date ON liquidity_reports(report_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for accounts
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for liquidity_reports
CREATE POLICY "Users can view own reports"
  ON liquidity_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON liquidity_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON liquidity_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON liquidity_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);