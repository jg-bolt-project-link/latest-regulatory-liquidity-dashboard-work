/*
  # Add Legal Entity Structure for Resolution Planning

  ## Overview
  This migration adds legal entity structure based on State Street Corporation's 
  165(d) Resolution Plan, including the 23 material entities and their relationships.

  ## New Tables
  1. `legal_entities`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `entity_code` (text) - Short code (e.g., SSC, SSBT, SSIH)
     - `entity_name` (text) - Full legal name
     - `entity_type` (text) - Type: parent, subsidiary, material_entity, funding_entity
     - `jurisdiction` (text) - Legal jurisdiction
     - `is_material_entity` (boolean)
     - `parent_entity_id` (uuid, self-reference)
     - `core_business_lines` (text[]) - Array of business lines
     - `description` (text)
     - `created_at` (timestamptz)

  ## Modified Tables
  - Add `legal_entity_id` to all existing metric tables to support entity-level filtering

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated user access
*/

-- Create legal entities table
CREATE TABLE IF NOT EXISTS legal_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  entity_code text NOT NULL,
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  jurisdiction text,
  is_material_entity boolean DEFAULT false,
  parent_entity_id uuid REFERENCES legal_entities(id),
  core_business_lines text[],
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own legal entities"
  ON legal_entities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own legal entities"
  ON legal_entities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own legal entities"
  ON legal_entities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own legal entities"
  ON legal_entities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add legal_entity_id to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balance_sheet_metrics' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE balance_sheet_metrics ADD COLUMN legal_entity_id uuid REFERENCES legal_entities(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lcr_metrics' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE lcr_metrics ADD COLUMN legal_entity_id uuid REFERENCES legal_entities(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nsfr_metrics' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE nsfr_metrics ADD COLUMN legal_entity_id uuid REFERENCES legal_entities(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resolution_liquidity_metrics' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE resolution_liquidity_metrics ADD COLUMN legal_entity_id uuid REFERENCES legal_entities(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liquidity_stress_tests' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE liquidity_stress_tests ADD COLUMN legal_entity_id uuid REFERENCES legal_entities(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interest_rate_risk_metrics' AND column_name = 'legal_entity_id'
  ) THEN
    ALTER TABLE interest_rate_risk_metrics ADD COLUMN legal_entity_id uuid REFERENCES legal_entities(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_entities_user_id ON legal_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_entities_entity_code ON legal_entities(entity_code);
CREATE INDEX IF NOT EXISTS idx_legal_entities_is_material ON legal_entities(is_material_entity);
CREATE INDEX IF NOT EXISTS idx_balance_sheet_legal_entity ON balance_sheet_metrics(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_lcr_legal_entity ON lcr_metrics(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_nsfr_legal_entity ON nsfr_metrics(legal_entity_id);
CREATE INDEX IF NOT EXISTS idx_resolution_legal_entity ON resolution_liquidity_metrics(legal_entity_id);
