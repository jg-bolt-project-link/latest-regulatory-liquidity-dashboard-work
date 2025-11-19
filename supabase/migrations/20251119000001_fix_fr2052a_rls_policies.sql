/*
  # Fix FR 2052a RLS Policies

  ## Problem
  Conflicting RLS policies on fr2052a_data_rows table:
  - Old policy: "Allow all access to data rows" with USING (true) - too permissive
  - New policies: User-specific policies with auth.uid() = user_id

  ## Solution
  Drop the old permissive policy and ensure only user-specific policies exist

  ## Changes
  - Drop "Allow all access to data rows" policy
  - Ensure user-specific policies are in place
*/

-- Drop the old permissive policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Allow all access to data rows'
  ) THEN
    DROP POLICY "Allow all access to data rows" ON fr2052a_data_rows;
  END IF;
END $$;

-- Ensure the correct user-specific policies exist
-- These should already exist from previous migration, but we'll ensure they're here

-- SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Users can view own FR2052a data'
  ) THEN
    CREATE POLICY "Users can view own FR2052a data"
      ON fr2052a_data_rows FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Users can insert own FR2052a data'
  ) THEN
    CREATE POLICY "Users can insert own FR2052a data"
      ON fr2052a_data_rows FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- UPDATE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Users can update own FR2052a data'
  ) THEN
    CREATE POLICY "Users can update own FR2052a data"
      ON fr2052a_data_rows FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- DELETE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fr2052a_data_rows' AND policyname = 'Users can delete own FR2052a data'
  ) THEN
    CREATE POLICY "Users can delete own FR2052a data"
      ON fr2052a_data_rows FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
