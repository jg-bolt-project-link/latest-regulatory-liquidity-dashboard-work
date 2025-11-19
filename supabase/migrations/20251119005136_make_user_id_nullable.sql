/*
  # Make user_id columns nullable
  
  Makes user_id columns nullable in tables that currently require them.
  This allows the application to operate without user authentication.
  
  ## Changes
  
  1. Tables Updated
    - legal_entities: user_id nullable
    - data_feeds: user_id nullable
    - data_quality_checks: user_id nullable
    - data_lineage: user_id nullable
    - lcr_metrics: user_id nullable
    - nsfr_metrics: user_id nullable
    - interest_rate_risk_metrics: user_id nullable
    - resolution_metrics: user_id nullable
    - reg_k_metrics: user_id nullable
    - liquidity_stress_tests: user_id nullable
    - resolution_liquidity_metrics: user_id nullable
    - balance_sheet_metrics: user_id nullable
  
  2. Security
    - Existing RLS policies remain in place
    - Data will be globally accessible when user_id is null
*/

-- Make user_id nullable in all relevant tables
ALTER TABLE legal_entities ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE data_feeds ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE data_quality_checks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE data_lineage ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE lcr_metrics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE nsfr_metrics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE interest_rate_risk_metrics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE resolution_metrics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE reg_k_metrics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE liquidity_stress_tests ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE resolution_liquidity_metrics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE balance_sheet_metrics ALTER COLUMN user_id DROP NOT NULL;