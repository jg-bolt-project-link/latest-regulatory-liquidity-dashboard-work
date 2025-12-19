/*
  # Add Granular Regulatory Citation Structure
  
  Creates detailed structure for tracking regulations at section, subsection, and paragraph level.
  
  ## New Tables
  - regulation_sections: Major sections of regulations
  - regulation_subsections: Detailed requirements within sections
  - regulation_paragraphs: Individual paragraph-level requirements
  - section_implementations: Track implementation at granular level
*/

-- regulation_sections table
CREATE TABLE IF NOT EXISTS regulation_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  section_number text NOT NULL,
  section_title text NOT NULL,
  section_text text NOT NULL,
  effective_date date,
  cfr_citation text,
  federal_register_citation text,
  parent_section_id uuid REFERENCES regulation_sections(id),
  hierarchy_level integer DEFAULT 1,
  display_order integer,
  is_mandatory boolean DEFAULT true,
  applicability_criteria text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(framework_id, section_number)
);

-- regulation_subsections table
CREATE TABLE IF NOT EXISTS regulation_subsections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES regulation_sections(id) ON DELETE CASCADE,
  subsection_number text NOT NULL,
  subsection_title text,
  subsection_text text NOT NULL,
  requirement_type text CHECK (requirement_type IN ('calculation', 'reporting', 'policy', 'governance', 'system', 'documentation', 'validation')),
  is_mandatory boolean DEFAULT true,
  frequency text,
  deadline_type text,
  related_subsections uuid[],
  keywords text[],
  display_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(section_id, subsection_number)
);

-- regulation_paragraphs table
CREATE TABLE IF NOT EXISTS regulation_paragraphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subsection_id uuid REFERENCES regulation_subsections(id) ON DELETE CASCADE,
  paragraph_number text NOT NULL,
  paragraph_text text NOT NULL,
  requirement_detail text,
  compliance_criteria text,
  validation_method text,
  example_text text,
  common_pitfalls text,
  display_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subsection_id, paragraph_number)
);

-- section_implementations table
CREATE TABLE IF NOT EXISTS section_implementations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES regulation_sections(id),
  subsection_id uuid REFERENCES regulation_subsections(id),
  paragraph_id uuid REFERENCES regulation_paragraphs(id),
  implementation_status text NOT NULL CHECK (implementation_status IN ('fully_implemented', 'partially_implemented', 'not_implemented', 'not_applicable')),
  coverage_percentage numeric(5,2) DEFAULT 0,
  implementation_approach text,
  screen_location text,
  database_table text,
  calculation_logic text,
  validation_controls text,
  evidence_location text,
  last_review_date date,
  reviewer_notes text,
  gap_description text,
  remediation_plan text,
  target_completion_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regulation_sections_framework ON regulation_sections(framework_id);
CREATE INDEX IF NOT EXISTS idx_regulation_sections_parent ON regulation_sections(parent_section_id);
CREATE INDEX IF NOT EXISTS idx_regulation_subsections_section ON regulation_subsections(section_id);
CREATE INDEX IF NOT EXISTS idx_regulation_paragraphs_subsection ON regulation_paragraphs(subsection_id);
CREATE INDEX IF NOT EXISTS idx_section_implementations_section ON section_implementations(section_id);
CREATE INDEX IF NOT EXISTS idx_section_implementations_status ON section_implementations(implementation_status);

-- RLS Policies
ALTER TABLE regulation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_implementations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to regulation_sections" ON regulation_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to regulation_subsections" ON regulation_subsections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to regulation_paragraphs" ON regulation_paragraphs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to section_implementations" ON section_implementations FOR ALL USING (true) WITH CHECK (true);
