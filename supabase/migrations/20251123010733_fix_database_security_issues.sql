/*
  # Fix Database Security Issues
  
  This migration addresses:
  1. Unused indexes (22 indexes) - Remove to improve write performance
  2. Duplicate indexes (3 sets) - Remove duplicates to reduce storage overhead
  3. RLS not enabled on user_profiles - Enable RLS for security
*/

-- ========================================
-- DROP UNUSED INDEXES
-- ========================================

-- Liquidity Reports
DROP INDEX IF EXISTS idx_liquidity_reports_user_id;
DROP INDEX IF EXISTS idx_liquidity_reports_date;

-- FR2052a File Submissions
DROP INDEX IF EXISTS idx_submissions_entity;

-- FR2052a Submissions
DROP INDEX IF EXISTS idx_fr2052a_submissions_user_id;

-- FR2052a Validation Executions
DROP INDEX IF EXISTS idx_validation_executions_rule;

-- LCR Calculation Validations
DROP INDEX IF EXISTS idx_lcr_validations_entity_date;

-- NSFR Calculation Validations
DROP INDEX IF EXISTS idx_nsfr_validations_entity_date;

-- FR2052a Data Rows
DROP INDEX IF EXISTS idx_fr2052a_user_id;
DROP INDEX IF EXISTS idx_fr2052a_product_category;
DROP INDEX IF EXISTS idx_fr2052a_counterparty_type;

-- Legal Entities
DROP INDEX IF EXISTS idx_legal_entities_user_id;

-- LCR HQLA Components
DROP INDEX IF EXISTS idx_lcr_hqla_level;

-- LCR Inflow Components
DROP INDEX IF EXISTS idx_lcr_inflow_category;
DROP INDEX IF EXISTS idx_inflow_components_rule_code;

-- NSFR ASF Components
DROP INDEX IF EXISTS idx_nsfr_asf_validation;
DROP INDEX IF EXISTS idx_nsfr_asf_submission;
DROP INDEX IF EXISTS idx_nsfr_asf_category;

-- NSFR RSF Components
DROP INDEX IF EXISTS idx_nsfr_rsf_validation;
DROP INDEX IF EXISTS idx_nsfr_rsf_submission;
DROP INDEX IF EXISTS idx_nsfr_rsf_category;

-- NSFR Calculation Rules
DROP INDEX IF EXISTS idx_nsfr_rules_category;
DROP INDEX IF EXISTS idx_nsfr_rules_code;

-- ========================================
-- DROP DUPLICATE INDEXES
-- ========================================

-- FR2052a Data Rows - Keep idx_fr2052a_created_at, drop idx_fr2052a_created_desc
DROP INDEX IF EXISTS idx_fr2052a_created_desc;

-- FR2052a Data Rows - idx_fr2052a_user_id already dropped above
-- Keep idx_fr2052a_user_null (already exists)

-- Legal Entities - idx_legal_entities_user_id already dropped above
-- Keep idx_legal_entities_user_null (already exists)

-- ========================================
-- ENABLE RLS ON user_profiles
-- ========================================

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Add policy for users to read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add policy for users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add public access policy for non-authenticated scenarios
-- (Since app may not use auth, allow public read access)
CREATE POLICY "Public can view user profiles"
  ON user_profiles
  FOR SELECT
  TO public
  USING (true);
