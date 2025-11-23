/*
  # Add Granular Regulatory Citation Structure

  ## Overview
  Enhances regulatory tracking with comprehensive, drill-down capable regulation structure.
  Adds subsections, paragraphs, and subparagraphs for each regulation.

  ## New Tables
  - regulation_sections: Major sections of each regulation
  - regulation_subsections: Detailed requirements within sections
  - regulation_paragraphs: Individual paragraph-level requirements
  - section_implementations: Track implementation at granular level

  ## Purpose
  Allow users to drill down from regulation → section → subsection → paragraph
  to understand exactly which requirements are met and which have gaps.
*/

-- =====================================================
-- 1. REGULATION SECTIONS
-- =====================================================
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

-- =====================================================
-- 2. REGULATION SUBSECTIONS
-- =====================================================
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

-- =====================================================
-- 3. REGULATION PARAGRAPHS
-- =====================================================
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

-- =====================================================
-- 4. SECTION IMPLEMENTATIONS
-- =====================================================
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

-- =====================================================
-- 5. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_regulation_sections_framework ON regulation_sections(framework_id);
CREATE INDEX IF NOT EXISTS idx_regulation_sections_parent ON regulation_sections(parent_section_id);
CREATE INDEX IF NOT EXISTS idx_regulation_subsections_section ON regulation_subsections(section_id);
CREATE INDEX IF NOT EXISTS idx_regulation_paragraphs_subsection ON regulation_paragraphs(subsection_id);
CREATE INDEX IF NOT EXISTS idx_section_implementations_section ON section_implementations(section_id);
CREATE INDEX IF NOT EXISTS idx_section_implementations_status ON section_implementations(implementation_status);

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================
ALTER TABLE regulation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_implementations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to manage regulation_sections" ON regulation_sections FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage regulation_subsections" ON regulation_subsections FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage regulation_paragraphs" ON regulation_paragraphs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to manage section_implementations" ON section_implementations FOR ALL TO public USING (true) WITH CHECK (true);

-- =====================================================
-- 7. COMMENTS
-- =====================================================
COMMENT ON TABLE regulation_sections IS 'Major sections of regulations (e.g., § 252.30, § 252.100) with full CFR citations';
COMMENT ON TABLE regulation_subsections IS 'Detailed subsections within each section (e.g., § 252.30(a), § 252.30(b))';
COMMENT ON TABLE regulation_paragraphs IS 'Individual paragraph-level requirements (e.g., § 252.30(a)(1), § 252.30(a)(2))';
COMMENT ON TABLE section_implementations IS 'Granular implementation tracking at section/subsection/paragraph level';

COMMENT ON COLUMN regulation_sections.hierarchy_level IS '1=Main section, 2=Subsection, 3=Sub-subsection';
COMMENT ON COLUMN regulation_subsections.requirement_type IS 'Type of requirement for filtering and reporting';
COMMENT ON COLUMN section_implementations.coverage_percentage IS 'Percentage of requirement implemented (0-100)';
