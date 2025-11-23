/*
  # Fix LCR Calculation Rules RLS for Public Access
  
  Add public read access to lcr_calculation_rules table to allow
  unauthenticated users to view calculation rules.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read LCR rules" ON lcr_calculation_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert LCR rules" ON lcr_calculation_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update LCR rules" ON lcr_calculation_rules;

-- Add public read access policy
CREATE POLICY "Allow all users to read LCR calculation rules"
  ON lcr_calculation_rules
  FOR SELECT
  TO public
  USING (true);

-- Add authenticated insert/update policies (for future admin functions)
CREATE POLICY "Allow authenticated users to insert LCR rules"
  ON lcr_calculation_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update LCR rules"
  ON lcr_calculation_rules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
