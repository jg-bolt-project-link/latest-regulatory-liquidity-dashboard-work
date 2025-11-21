/*
  # Add rule_code Column to Component Tables

  1. Issue
    - Component tables don't store the LCR calculation rule code
    - UI tries to derive rule code from product_category but it doesn't match
    - "View Rule" button fails because rule lookup fails

  2. Solution
    - Add rule_code column to all three component tables
    - This links components to lcr_calculation_rules for drill-down

  3. Tables Modified
    - lcr_hqla_components
    - lcr_outflow_components
    - lcr_inflow_components

  4. Example Values
    - HQLA_L1_SOVEREIGN (U.S. Treasury Securities)
    - HQLA_L1_CASH (Cash and Central Bank Reserves)
    - OUTFLOW_RETAIL_STABLE (Stable Retail Deposits)
*/

-- Add rule_code column to lcr_hqla_components
ALTER TABLE lcr_hqla_components
ADD COLUMN IF NOT EXISTS rule_code text;

-- Add rule_code column to lcr_outflow_components
ALTER TABLE lcr_outflow_components
ADD COLUMN IF NOT EXISTS rule_code text;

-- Add rule_code column to lcr_inflow_components
ALTER TABLE lcr_inflow_components
ADD COLUMN IF NOT EXISTS rule_code text;

-- Add index for faster rule lookups
CREATE INDEX IF NOT EXISTS idx_hqla_components_rule_code ON lcr_hqla_components(rule_code);
CREATE INDEX IF NOT EXISTS idx_outflow_components_rule_code ON lcr_outflow_components(rule_code);
CREATE INDEX IF NOT EXISTS idx_inflow_components_rule_code ON lcr_inflow_components(rule_code);

-- Add comments
COMMENT ON COLUMN lcr_hqla_components.rule_code IS 'Reference to lcr_calculation_rules.rule_code for drill-down';
COMMENT ON COLUMN lcr_outflow_components.rule_code IS 'Reference to lcr_calculation_rules.rule_code for drill-down';
COMMENT ON COLUMN lcr_inflow_components.rule_code IS 'Reference to lcr_calculation_rules.rule_code for drill-down';
