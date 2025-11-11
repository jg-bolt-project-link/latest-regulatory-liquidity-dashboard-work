-- Fix liquidity_stress_tests table columns

ALTER TABLE liquidity_stress_tests
  ADD COLUMN IF NOT EXISTS liquidity_shortfall numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS survival_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stress_severity text,
  ADD COLUMN IF NOT EXISTS deposit_runoff_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wholesale_funding_rollover_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_line_drawdown_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asset_liquidation_haircut numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passes_internal_threshold boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_liquidity_buffer_maintained boolean DEFAULT true;

-- Remove columns that don't match
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'liquidity_stress_tests' AND column_name = 'liquidity_gap') THEN
    ALTER TABLE liquidity_stress_tests DROP COLUMN liquidity_gap;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'liquidity_stress_tests' AND column_name = 'survival_horizon_days') THEN
    ALTER TABLE liquidity_stress_tests DROP COLUMN survival_horizon_days;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'liquidity_stress_tests' AND column_name = 'contingent_funding_required') THEN
    ALTER TABLE liquidity_stress_tests DROP COLUMN contingent_funding_required;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'liquidity_stress_tests' AND column_name = 'is_within_risk_appetite') THEN
    ALTER TABLE liquidity_stress_tests DROP COLUMN is_within_risk_appetite;
  END IF;
END $$;
