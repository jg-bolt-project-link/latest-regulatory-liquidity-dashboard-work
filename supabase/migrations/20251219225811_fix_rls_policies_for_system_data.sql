/*
  # Fix RLS Policies for System Data

  ## Problem
  Multiple tables have conflicting RLS policies that prevent insertion of system data (user_id = NULL):
  - "Allow all access" policies exist (USING true, WITH CHECK true)
  - Old restrictive policies still exist (USING auth.uid() = user_id)
  - When user_id is NULL, the restrictive policies fail

  ## Solution
  Drop all restrictive authenticated user policies since we have permissive "Allow all access" policies.

  ## Tables Affected
  - legal_entities
  - lcr_metrics
  - nsfr_metrics
  - balance_sheet_metrics
  - fr2052a_data_rows
  - interest_rate_risk_metrics
  - resolution_liquidity_metrics
  - liquidity_stress_tests
  - data_feeds
  - data_quality_checks
  - data_lineage

  ## Security Note
  The "Allow all access" policies are intentional for this demo/development system.
  In production, these would be replaced with proper role-based access control.
*/

-- Drop restrictive policies from legal_entities
DROP POLICY IF EXISTS "Users can view own legal entities" ON legal_entities;
DROP POLICY IF EXISTS "Users can insert own legal entities" ON legal_entities;
DROP POLICY IF EXISTS "Users can update own legal entities" ON legal_entities;
DROP POLICY IF EXISTS "Users can delete own legal entities" ON legal_entities;

-- Drop restrictive policies from lcr_metrics
DROP POLICY IF EXISTS "Users can view own LCR metrics" ON lcr_metrics;
DROP POLICY IF EXISTS "Users can insert own LCR metrics" ON lcr_metrics;
DROP POLICY IF EXISTS "Users can update own LCR metrics" ON lcr_metrics;
DROP POLICY IF EXISTS "Users can delete own LCR metrics" ON lcr_metrics;

-- Drop restrictive policies from nsfr_metrics
DROP POLICY IF EXISTS "Users can view own NSFR metrics" ON nsfr_metrics;
DROP POLICY IF EXISTS "Users can insert own NSFR metrics" ON nsfr_metrics;
DROP POLICY IF EXISTS "Users can update own NSFR metrics" ON nsfr_metrics;
DROP POLICY IF EXISTS "Users can delete own NSFR metrics" ON nsfr_metrics;

-- Drop restrictive policies from balance_sheet_metrics
DROP POLICY IF EXISTS "Users can view own balance sheet metrics" ON balance_sheet_metrics;
DROP POLICY IF EXISTS "Users can insert own balance sheet metrics" ON balance_sheet_metrics;
DROP POLICY IF EXISTS "Users can update own balance sheet metrics" ON balance_sheet_metrics;
DROP POLICY IF EXISTS "Users can delete own balance sheet metrics" ON balance_sheet_metrics;

-- Drop restrictive policies from fr2052a_data_rows
DROP POLICY IF EXISTS "Users can view own FR2052a data" ON fr2052a_data_rows;
DROP POLICY IF EXISTS "Users can insert own FR2052a data" ON fr2052a_data_rows;
DROP POLICY IF EXISTS "Users can update own FR2052a data" ON fr2052a_data_rows;
DROP POLICY IF EXISTS "Users can delete own FR2052a data" ON fr2052a_data_rows;

-- Drop restrictive policies from interest_rate_risk_metrics
DROP POLICY IF EXISTS "Users can view own interest rate risk metrics" ON interest_rate_risk_metrics;
DROP POLICY IF EXISTS "Users can insert own interest rate risk metrics" ON interest_rate_risk_metrics;
DROP POLICY IF EXISTS "Users can update own interest rate risk metrics" ON interest_rate_risk_metrics;
DROP POLICY IF EXISTS "Users can delete own interest rate risk metrics" ON interest_rate_risk_metrics;

-- Drop restrictive policies from resolution_liquidity_metrics
DROP POLICY IF EXISTS "Users can view own resolution liquidity metrics" ON resolution_liquidity_metrics;
DROP POLICY IF EXISTS "Users can insert own resolution liquidity metrics" ON resolution_liquidity_metrics;
DROP POLICY IF EXISTS "Users can update own resolution liquidity metrics" ON resolution_liquidity_metrics;
DROP POLICY IF EXISTS "Users can delete own resolution liquidity metrics" ON resolution_liquidity_metrics;

-- Drop restrictive policies from liquidity_stress_tests
DROP POLICY IF EXISTS "Users can view own stress tests" ON liquidity_stress_tests;
DROP POLICY IF EXISTS "Users can insert own stress tests" ON liquidity_stress_tests;
DROP POLICY IF EXISTS "Users can update own stress tests" ON liquidity_stress_tests;
DROP POLICY IF EXISTS "Users can delete own stress tests" ON liquidity_stress_tests;

-- Drop restrictive policies from data_feeds
DROP POLICY IF EXISTS "Users can view own data feeds" ON data_feeds;
DROP POLICY IF EXISTS "Users can insert own data feeds" ON data_feeds;
DROP POLICY IF EXISTS "Users can update own data feeds" ON data_feeds;
DROP POLICY IF EXISTS "Users can delete own data feeds" ON data_feeds;

-- Drop restrictive policies from data_quality_checks
DROP POLICY IF EXISTS "Users can view own quality checks" ON data_quality_checks;
DROP POLICY IF EXISTS "Users can insert own quality checks" ON data_quality_checks;
DROP POLICY IF EXISTS "Users can update own quality checks" ON data_quality_checks;
DROP POLICY IF EXISTS "Users can delete own quality checks" ON data_quality_checks;

-- Drop restrictive policies from data_lineage
DROP POLICY IF EXISTS "Users can view own data lineage" ON data_lineage;
DROP POLICY IF EXISTS "Users can insert own data lineage" ON data_lineage;
DROP POLICY IF EXISTS "Users can update own data lineage" ON data_lineage;
DROP POLICY IF EXISTS "Users can delete own data lineage" ON data_lineage;

-- Verify "Allow all access" policies exist, create if missing
DO $$
BEGIN
  -- legal_entities
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'legal_entities' AND policyname = 'Allow all access to legal_entities'
  ) THEN
    CREATE POLICY "Allow all access to legal_entities" ON legal_entities FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- lcr_metrics
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lcr_metrics' AND policyname = 'Allow all access to lcr_metrics'
  ) THEN
    CREATE POLICY "Allow all access to lcr_metrics" ON lcr_metrics FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- nsfr_metrics
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nsfr_metrics' AND policyname = 'Allow all access to nsfr_metrics'
  ) THEN
    CREATE POLICY "Allow all access to nsfr_metrics" ON nsfr_metrics FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- balance_sheet_metrics
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'balance_sheet_metrics' AND policyname = 'Allow all access to balance_sheet_metrics'
  ) THEN
    CREATE POLICY "Allow all access to balance_sheet_metrics" ON balance_sheet_metrics FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- fr2052a_data_rows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Allow all access to fr2052a_data_rows'
  ) THEN
    CREATE POLICY "Allow all access to fr2052a_data_rows" ON fr2052a_data_rows FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- interest_rate_risk_metrics
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'interest_rate_risk_metrics' AND policyname = 'Allow all access to interest_rate_risk_metrics'
  ) THEN
    CREATE POLICY "Allow all access to interest_rate_risk_metrics" ON interest_rate_risk_metrics FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- resolution_liquidity_metrics
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'resolution_liquidity_metrics' AND policyname = 'Allow all access to resolution_liquidity_metrics'
  ) THEN
    CREATE POLICY "Allow all access to resolution_liquidity_metrics" ON resolution_liquidity_metrics FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- liquidity_stress_tests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'liquidity_stress_tests' AND policyname = 'Allow all access to liquidity_stress_tests'
  ) THEN
    CREATE POLICY "Allow all access to liquidity_stress_tests" ON liquidity_stress_tests FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- data_feeds
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'data_feeds' AND policyname = 'Allow all access to data_feeds'
  ) THEN
    CREATE POLICY "Allow all access to data_feeds" ON data_feeds FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- data_quality_checks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'data_quality_checks' AND policyname = 'Allow all access to data_quality_checks'
  ) THEN
    CREATE POLICY "Allow all access to data_quality_checks" ON data_quality_checks FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- data_lineage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'data_lineage' AND policyname = 'Allow all access to data_lineage'
  ) THEN
    CREATE POLICY "Allow all access to data_lineage" ON data_lineage FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
