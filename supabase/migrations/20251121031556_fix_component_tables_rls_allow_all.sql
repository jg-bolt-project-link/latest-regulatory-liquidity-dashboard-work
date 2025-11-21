/*
  # Fix Component Tables RLS - Use FOR ALL Policy

  1. Issue
    - INSERT policies exist but RLS still blocking inserts
    - May need broader FOR ALL policy like other validation tables

  2. Solution
    - Replace specific INSERT/UPDATE/DELETE policies with single FOR ALL policy
    - Matches pattern used in fr2052a_validation_tables.sql

  3. Tables Modified
    - lcr_hqla_components
    - lcr_outflow_components
    - lcr_inflow_components
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read LCR HQLA components" ON lcr_hqla_components;
DROP POLICY IF EXISTS "Allow authenticated users to insert LCR HQLA components" ON lcr_hqla_components;
DROP POLICY IF EXISTS "Allow authenticated users to update LCR HQLA components" ON lcr_hqla_components;
DROP POLICY IF EXISTS "Allow authenticated users to delete LCR HQLA components" ON lcr_hqla_components;

DROP POLICY IF EXISTS "Allow authenticated users to read LCR outflow components" ON lcr_outflow_components;
DROP POLICY IF EXISTS "Allow authenticated users to insert LCR outflow components" ON lcr_outflow_components;
DROP POLICY IF EXISTS "Allow authenticated users to update LCR outflow components" ON lcr_outflow_components;
DROP POLICY IF EXISTS "Allow authenticated users to delete LCR outflow components" ON lcr_outflow_components;

DROP POLICY IF EXISTS "Allow authenticated users to read LCR inflow components" ON lcr_inflow_components;
DROP POLICY IF EXISTS "Allow authenticated users to insert LCR inflow components" ON lcr_inflow_components;
DROP POLICY IF EXISTS "Allow authenticated users to update LCR inflow components" ON lcr_inflow_components;
DROP POLICY IF EXISTS "Allow authenticated users to delete LCR inflow components" ON lcr_inflow_components;

-- Create single FOR ALL policy for each table (matches validation tables pattern)
CREATE POLICY "Allow all access to LCR HQLA components"
  ON lcr_hqla_components
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to LCR outflow components"
  ON lcr_outflow_components
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to LCR inflow components"
  ON lcr_inflow_components
  FOR ALL
  USING (true)
  WITH CHECK (true);
