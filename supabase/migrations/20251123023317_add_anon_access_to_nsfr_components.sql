/*
  # Add Anonymous Access to NSFR Components
  
  Allows unauthenticated (anon) users to read NSFR component data,
  matching the access pattern of other validation tables.
*/

-- Add anon role to SELECT policies for ASF components
DROP POLICY IF EXISTS "Allow users to read NSFR ASF components" ON nsfr_asf_components;
CREATE POLICY "Allow users to read NSFR ASF components"
  ON nsfr_asf_components
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Add anon role to SELECT policies for RSF components
DROP POLICY IF EXISTS "Allow users to read NSFR RSF components" ON nsfr_rsf_components;
CREATE POLICY "Allow users to read NSFR RSF components"
  ON nsfr_rsf_components
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ensure validations table is also accessible to anon
DROP POLICY IF EXISTS "Allow all to read nsfr_validations" ON nsfr_calculation_validations;
CREATE POLICY "Allow all to read nsfr_validations"
  ON nsfr_calculation_validations
  FOR SELECT
  TO anon, authenticated
  USING (true);
