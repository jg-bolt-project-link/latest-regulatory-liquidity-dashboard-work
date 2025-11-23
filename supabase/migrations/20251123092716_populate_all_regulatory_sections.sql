/*
  # Populate All Regulatory Framework Sections

  ## Overview
  Populates detailed sections and subsections for all regulatory frameworks:
  - NSFR (Net Stable Funding Ratio)
  - REG_QQ (Liquidity Risk Management)
  - REG_WW (Resolution Planning)
  
  REG_YY already has sections populated.
*/

DO $$
DECLARE
  v_nsfr_id uuid;
  v_reg_qq_id uuid;
  v_reg_ww_id uuid;
  v_section_id uuid;
BEGIN
  -- Get framework IDs
  SELECT id INTO v_nsfr_id FROM regulatory_frameworks WHERE framework_code = 'NSFR';
  SELECT id INTO v_reg_qq_id FROM regulatory_frameworks WHERE framework_code = 'REG_QQ';
  SELECT id INTO v_reg_ww_id FROM regulatory_frameworks WHERE framework_code = 'REG_WW';

  -- =====================================================
  -- NSFR SECTIONS
  -- =====================================================
  
  -- Section 1: NSFR Calculation
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, display_order, is_mandatory)
  VALUES (
    v_nsfr_id,
    '249.100',
    'NSFR Calculation and Requirement',
    'A covered company must maintain a net stable funding ratio of 1.0 or greater on an ongoing basis. NSFR = ASF / RSF',
    '12 CFR § 249.100',
    100,
    true
  ) RETURNING id INTO v_section_id;

  -- Subsections for NSFR calculation
  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, frequency, display_order, is_mandatory)
  VALUES
    (v_section_id, '249.100(a)', 'NSFR Minimum', 'Maintain NSFR ≥ 100% on ongoing basis', 'calculation', 'Monthly', 1, true),
    (v_section_id, '249.100(b)', 'Consolidated Basis', 'Calculate on consolidated basis', 'calculation', 'Monthly', 2, true);

  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT id, 'fully_implemented', 100, '/regulatory-dashboard → NSFR', 'Monthly NSFR calculation with ASF/RSF tracking'
  FROM regulation_subsections WHERE section_id = v_section_id;

  -- Section 2: Available Stable Funding
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, display_order, is_mandatory)
  VALUES (
    v_nsfr_id,
    '249.103',
    'Available Stable Funding (ASF)',
    'ASF is calculated by multiplying carrying values of assets and liabilities by ASF factors',
    '12 CFR § 249.103',
    103,
    true
  ) RETURNING id INTO v_section_id;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, frequency, display_order, is_mandatory)
  VALUES
    (v_section_id, '249.103(a)', 'Capital (100% ASF)', 'Regulatory capital receives 100% ASF factor', 'calculation', 'Monthly', 1, true),
    (v_section_id, '249.103(b)', 'Retail Deposits', 'Stable retail deposits: 95% ASF, Other retail: 90% ASF', 'calculation', 'Monthly', 2, true),
    (v_section_id, '249.103(c)', 'Wholesale Funding', 'Stable wholesale: 90-95% ASF based on counterparty', 'calculation', 'Monthly', 3, true);

  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT id, 'fully_implemented', 100, '/regulatory-dashboard → NSFR', 'ASF components tracked and calculated monthly'
  FROM regulation_subsections WHERE section_id = v_section_id;

  -- Section 3: Required Stable Funding
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, display_order, is_mandatory)
  VALUES (
    v_nsfr_id,
    '249.105',
    'Required Stable Funding (RSF)',
    'RSF is calculated by multiplying carrying values of assets by RSF factors',
    '12 CFR § 249.105',
    105,
    true
  ) RETURNING id INTO v_section_id;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, frequency, display_order, is_mandatory)
  VALUES
    (v_section_id, '249.105(a)', 'Cash and Central Bank (0% RSF)', 'Cash and central bank reserves: 0% RSF', 'calculation', 'Monthly', 1, true),
    (v_section_id, '249.105(b)', 'Securities (5-85% RSF)', 'HQLA securities based on liquidity: 5-15% RSF, Other: up to 85%', 'calculation', 'Monthly', 2, true),
    (v_section_id, '249.105(c)', 'Loans (50-100% RSF)', 'Performing loans: 65-85% RSF, Non-performing: 100% RSF', 'calculation', 'Monthly', 3, true);

  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT id, 'fully_implemented', 100, '/regulatory-dashboard → NSFR', 'RSF components tracked and calculated monthly'
  FROM regulation_subsections WHERE section_id = v_section_id;

  -- =====================================================
  -- REG_QQ SECTIONS (OCC Liquidity Risk Management)
  -- =====================================================
  
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, display_order, is_mandatory)
  VALUES (
    v_reg_qq_id,
    '249.10',
    'Liquidity Risk Management Framework',
    'Must establish comprehensive liquidity risk management framework with board oversight',
    '12 CFR § 249.10',
    10,
    true
  ) RETURNING id INTO v_section_id;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, frequency, display_order, is_mandatory)
  VALUES
    (v_section_id, '249.10(a)', 'Board Oversight', 'Board must approve liquidity risk tolerance and strategy', 'governance', 'Annual', 1, true),
    (v_section_id, '249.10(b)', 'Senior Management', 'Senior management implements board-approved framework', 'governance', 'Continuous', 2, true),
    (v_section_id, '249.10(c)', 'Independent Review', 'Independent review of liquidity risk management', 'governance', 'Annual', 3, true);

  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT id, 'partially_implemented', 75, 'Multiple locations', 'Governance framework partially implemented'
  FROM regulation_subsections WHERE section_id = v_section_id;

  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, display_order, is_mandatory)
  VALUES (
    v_reg_qq_id,
    '249.20',
    'Cash Flow Projections',
    'Must project cash flows arising from assets, liabilities, and off-balance sheet items over short and long-term horizons',
    '12 CFR § 249.20',
    20,
    true
  ) RETURNING id INTO v_section_id;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, frequency, display_order, is_mandatory)
  VALUES
    (v_section_id, '249.20(a)', 'Multiple Time Horizons', 'Project cash flows over multiple time horizons', 'calculation', 'Daily', 1, true),
    (v_section_id, '249.20(b)', 'Stress Scenarios', 'Include cash flow projections under stress', 'calculation', 'Monthly', 2, true);

  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT id, 'fully_implemented', 100, '/cash-flow-projections', 'Daily cash flow projections with stress scenarios'
  FROM regulation_subsections WHERE section_id = v_section_id;

  -- =====================================================
  -- REG_WW SECTIONS (Resolution Planning)
  -- =====================================================
  
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, display_order, is_mandatory)
  VALUES (
    v_reg_ww_id,
    '243.4',
    'Resolution Plan Requirement',
    'Covered companies must submit resolution plans (living wills) periodically to demonstrate how they could be resolved under bankruptcy',
    '12 CFR § 243.4',
    4,
    true
  ) RETURNING id INTO v_section_id;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, frequency, display_order, is_mandatory)
  VALUES
    (v_section_id, '243.4(a)', 'Plan Content', 'Plan must describe strategy for rapid resolution', 'reporting', 'Annual', 1, true),
    (v_section_id, '243.4(b)', 'Material Entities', 'Identify material entities and core business lines', 'reporting', 'Annual', 2, true),
    (v_section_id, '243.4(c)', 'Financial Information', 'Provide detailed financial information', 'reporting', 'Annual', 3, true);

  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT id, 'fully_implemented', 100, '/resolution-planning', 'Annual resolution plan with required disclosures'
  FROM regulation_subsections WHERE section_id = v_section_id;

  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, display_order, is_mandatory)
  VALUES (
    v_reg_ww_id,
    '243.5',
    'Resolution Liquidity Requirements',
    'Must maintain sufficient liquidity to execute resolution strategy',
    '12 CFR § 243.5',
    5,
    true
  ) RETURNING id INTO v_section_id;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, frequency, display_order, is_mandatory)
  VALUES
    (v_section_id, '243.5(a)', 'Resolution Liquidity Adequacy', 'Maintain adequate liquidity for resolution execution', 'calculation', 'Monthly', 1, true),
    (v_section_id, '243.5(b)', 'Liquidity Sources', 'Identify and maintain access to liquidity sources', 'governance', 'Quarterly', 2, true);

  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT id, 'fully_implemented', 100, '/resolution-planning', 'Resolution liquidity tracked monthly'
  FROM regulation_subsections WHERE section_id = v_section_id;

END $$;
