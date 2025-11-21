/*
  # Fix RLS Policies for LCR Calculation Rules

  1. Issue
    - Table has RLS enabled but no INSERT policy
    - Users cannot seed calculation rules

  2. Changes
    - Add INSERT policy for authenticated users to seed rules
    - Add UPDATE policy for authenticated users to maintain rules
    - Keep existing SELECT policy

  3. Security
    - Only authenticated users can insert/update rules
    - All authenticated users can read rules
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert LCR rules" ON lcr_calculation_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update LCR rules" ON lcr_calculation_rules;

-- Add INSERT policy for authenticated users
CREATE POLICY "Allow authenticated users to insert LCR rules"
  ON lcr_calculation_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for authenticated users
CREATE POLICY "Allow authenticated users to update LCR rules"
  ON lcr_calculation_rules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
