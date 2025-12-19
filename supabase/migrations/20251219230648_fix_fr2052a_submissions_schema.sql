/*
  # Fix FR2052a Submissions Table Schema
  
  ## Problem
  The fr2052a_submissions table has legal_entity_id as TEXT, but the seeding code
  passes a UUID from legal_entities.id, causing silent insertion failures.
  
  ## Solution
  Change legal_entity_id column from TEXT to UUID and add foreign key constraint.
  
  ## Changes
  1. Alter legal_entity_id column type from TEXT to UUID
  2. Add foreign key constraint to legal_entities table
  3. Add index for performance
*/

-- Change legal_entity_id from TEXT to UUID
ALTER TABLE fr2052a_submissions 
  ALTER COLUMN legal_entity_id TYPE uuid USING legal_entity_id::uuid;

-- Add foreign key constraint
ALTER TABLE fr2052a_submissions
  DROP CONSTRAINT IF EXISTS fr2052a_submissions_legal_entity_id_fkey;

ALTER TABLE fr2052a_submissions
  ADD CONSTRAINT fr2052a_submissions_legal_entity_id_fkey
  FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_fr2052a_submissions_legal_entity 
  ON fr2052a_submissions(legal_entity_id);

-- Also ensure user_id can be NULL for system-generated submissions
ALTER TABLE fr2052a_submissions 
  ALTER COLUMN user_id DROP NOT NULL;
