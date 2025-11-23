/*
  # Add rule_code to NSFR Component Tables
  
  Adds rule_code column to nsfr_asf_components and nsfr_rsf_components
  to enable drill-down to calculation rules similar to LCR components.
*/

-- Add rule_code to nsfr_asf_components
ALTER TABLE nsfr_asf_components
ADD COLUMN IF NOT EXISTS rule_code text;

COMMENT ON COLUMN nsfr_asf_components.rule_code IS 'Reference to lcr_calculation_rules.rule_code for drill-down (NSFR rules stored in same table)';

-- Add rule_code to nsfr_rsf_components  
ALTER TABLE nsfr_rsf_components
ADD COLUMN IF NOT EXISTS rule_code text;

COMMENT ON COLUMN nsfr_rsf_components.rule_code IS 'Reference to lcr_calculation_rules.rule_code for drill-down (NSFR rules stored in same table)';
