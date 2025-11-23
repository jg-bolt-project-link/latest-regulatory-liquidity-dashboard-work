/*
  # Fix NSFR Component RLS Policies
  
  Adds proper INSERT policies for NSFR component tables so the trigger can
  insert data, and ensures public read access for authenticated users.
*/

-- Add INSERT policy for ASF components (needed for trigger)
DROP POLICY IF EXISTS "Allow system to insert NSFR ASF components" ON nsfr_asf_components;
CREATE POLICY "Allow system to insert NSFR ASF components"
  ON nsfr_asf_components
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add INSERT policy for RSF components (needed for trigger)
DROP POLICY IF EXISTS "Allow system to insert NSFR RSF components" ON nsfr_rsf_components;
CREATE POLICY "Allow system to insert NSFR RSF components"
  ON nsfr_rsf_components
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure SELECT policies exist and are correct
DROP POLICY IF EXISTS "Allow authenticated users to read NSFR ASF components" ON nsfr_asf_components;
CREATE POLICY "Allow authenticated users to read NSFR ASF components"
  ON nsfr_asf_components
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read NSFR RSF components" ON nsfr_rsf_components;
CREATE POLICY "Allow authenticated users to read NSFR RSF components"
  ON nsfr_rsf_components
  FOR SELECT
  TO authenticated
  USING (true);
