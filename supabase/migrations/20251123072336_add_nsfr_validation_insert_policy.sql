/*
  # Add INSERT policy for NSFR calculation validations

  ## Problem
  - NSFR validation records cannot be inserted due to missing RLS INSERT policy
  - Table only has SELECT policy, blocking validation execution
  - LCR validations work because they have "ALL" policy (includes INSERT)

  ## Changes
  - Add INSERT policy to allow authenticated and anonymous users to insert NSFR validation records
  - Matches the LCR validation table policy pattern

  ## Security
  - Policy allows public access for validation system operation
  - Validation records are system-generated, not sensitive user data
  - Consistent with existing LCR validation access pattern
*/

-- Drop existing SELECT-only policy and replace with ALL policy (matching LCR pattern)
DROP POLICY IF EXISTS "Allow all to read nsfr_validations" ON nsfr_calculation_validations;

-- Add comprehensive policy matching LCR pattern
CREATE POLICY "Allow all access to nsfr_validations"
  ON nsfr_calculation_validations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
