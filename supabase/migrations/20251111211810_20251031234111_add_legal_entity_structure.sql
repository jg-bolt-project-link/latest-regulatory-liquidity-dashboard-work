-- Legal Entity Structure

CREATE TABLE IF NOT EXISTS legal_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_code text NOT NULL,
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  jurisdiction text NOT NULL,
  is_material_entity boolean DEFAULT false,
  parent_entity_id uuid REFERENCES legal_entities(id),
  core_business_lines text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_entities_user_id ON legal_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_entities_entity_code ON legal_entities(entity_code);
CREATE INDEX IF NOT EXISTS idx_legal_entities_parent_entity_id ON legal_entities(parent_entity_id);

ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to legal_entities" ON legal_entities FOR ALL USING (true) WITH CHECK (true);
