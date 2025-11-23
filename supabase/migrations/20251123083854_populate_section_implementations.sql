/*
  # Populate Section Implementations

  ## Overview
  Populates the section_implementations table to map granular regulatory requirements
  to actual screens and features in the application.
  
  This creates implementation tracking entries for each subsection so the UI can
  display which requirements are met and which have gaps.
*/

DO $$
DECLARE
  v_section_252_10 uuid;
  v_section_252_12 uuid;
  v_section_252_30 uuid;
  v_section_252_100 uuid;
  v_section_252_150 uuid;
BEGIN
  -- Get section IDs
  SELECT id INTO v_section_252_10 FROM regulation_sections WHERE section_number = '252.10';
  SELECT id INTO v_section_252_12 FROM regulation_sections WHERE section_number = '252.12';
  SELECT id INTO v_section_252_30 FROM regulation_sections WHERE section_number = '252.30';
  SELECT id INTO v_section_252_100 FROM regulation_sections WHERE section_number = '252.100';
  SELECT id INTO v_section_252_150 FROM regulation_sections WHERE section_number = '252.150';

  -- =====================================================
  -- § 252.10 - MINIMUM CAPITAL REQUIREMENTS
  -- =====================================================
  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT 
    id,
    'fully_implemented',
    100,
    '/regulatory-dashboard → Capital Metrics',
    'Capital ratios calculated daily from balance sheet data'
  FROM regulation_subsections
  WHERE section_id = v_section_252_10;

  -- =====================================================
  -- § 252.12 - CAPITAL STRESS TESTING
  -- =====================================================
  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach)
  SELECT 
    id,
    'fully_implemented',
    100,
    '/stress-testing → CCAR/DFAST Dashboard',
    'Scenario-based stress testing with macroeconomic assumptions and pro forma capital projections'
  FROM regulation_subsections
  WHERE section_id = v_section_252_12;

  -- =====================================================
  -- § 252.30 - LIQUIDITY COVERAGE RATIO (LCR)
  -- =====================================================
  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, database_table, implementation_approach)
  SELECT 
    id,
    'fully_implemented',
    100,
    '/regulatory-dashboard → LCR',
    'lcr_metrics, lcr_calculation_rules, lcr_hqla_components, lcr_inflow_components, lcr_outflow_components',
    'Daily LCR calculation with HQLA, inflows, outflows tracked at granular level per regulatory requirements'
  FROM regulation_subsections
  WHERE section_id = v_section_252_30;

  -- =====================================================
  -- § 252.100 - NET STABLE FUNDING RATIO (NSFR)
  -- =====================================================
  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, database_table, implementation_approach)
  SELECT 
    id,
    'fully_implemented',
    100,
    '/regulatory-dashboard → NSFR',
    'nsfr_metrics, nsfr_calculation_rules, nsfr_asf_components, nsfr_rsf_components',
    'Monthly NSFR calculation with ASF and RSF factors applied per regulatory guidance'
  FROM regulation_subsections
  WHERE section_id = v_section_252_100;

  -- =====================================================
  -- § 252.150 - LIQUIDITY RISK MANAGEMENT
  -- =====================================================
  -- 252.153 - Risk management framework
  INSERT INTO section_implementations (subsection_id, implementation_status, coverage_percentage, screen_location, implementation_approach, gap_description)
  SELECT 
    id,
    CASE 
      WHEN subsection_number = '252.153' THEN 'partially_implemented'
      WHEN subsection_number = '252.155' THEN 'fully_implemented'
      WHEN subsection_number = '252.157' THEN 'fully_implemented'
      WHEN subsection_number = '252.159' THEN 'fully_implemented'
      ELSE 'fully_implemented'
    END,
    CASE 
      WHEN subsection_number = '252.153' THEN 75
      ELSE 100
    END,
    CASE 
      WHEN subsection_number = '252.153' THEN 'Multiple locations'
      WHEN subsection_number = '252.155' THEN '/stress-testing → Liquidity Stress Tests'
      WHEN subsection_number = '252.157' THEN '/regulatory-dashboard → LCR (HQLA buffer)'
      WHEN subsection_number = '252.159' THEN '/contingency-funding → CFP'
      ELSE '/regulatory-dashboard'
    END,
    CASE 
      WHEN subsection_number = '252.153' THEN 'Risk management framework partially implemented across multiple modules'
      WHEN subsection_number = '252.155' THEN 'Monthly stress testing with multiple scenarios'
      WHEN subsection_number = '252.157' THEN 'HQLA buffer maintained and monitored daily'
      WHEN subsection_number = '252.159' THEN 'Comprehensive CFP with funding sources and stress triggers'
      ELSE 'Implemented'
    END,
    CASE 
      WHEN subsection_number = '252.153' THEN 'Need centralized risk management dashboard with consolidated view of all liquidity risk metrics, limits, and escalation procedures'
      ELSE NULL
    END
  FROM regulation_subsections
  WHERE section_id = v_section_252_150;

END $$;
