/*
  # Populate Regulation YY Granular Citations

  ## Overview
  Populates comprehensive section-by-section breakdown of Regulation YY
  (12 CFR Part 252 - Enhanced Prudential Standards)
  
  ## Sections Covered
  - § 252.10: Minimum Capital Requirements
  - § 252.12-15: Capital Stress Testing (CCAR/DFAST)
  - § 252.30-39: Liquidity Coverage Ratio (LCR)
  - § 252.100-109: Net Stable Funding Ratio (NSFR)
  - § 252.150-159: Liquidity Risk Management
*/

DO $$
DECLARE
  v_reg_yy_id uuid;
  v_section_252_10 uuid;
  v_section_252_12 uuid;
  v_section_252_30 uuid;
  v_section_252_100 uuid;
  v_section_252_150 uuid;
BEGIN
  -- Get Regulation YY framework ID
  SELECT id INTO v_reg_yy_id FROM regulatory_frameworks WHERE framework_code = 'REG_YY';

  -- =====================================================
  -- § 252.10 - MINIMUM CAPITAL REQUIREMENTS
  -- =====================================================
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, hierarchy_level, display_order, is_mandatory)
  VALUES (
    v_reg_yy_id,
    '252.10',
    'Minimum Capital Requirements',
    'Establishes minimum capital requirements for bank holding companies and foreign banking organizations, including Common Equity Tier 1 (CET1), Tier 1 capital, and Total capital ratios.',
    '12 CFR § 252.10',
    1,
    10,
    true
  ) RETURNING id INTO v_section_252_10;

  -- Subsections for § 252.10
  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, is_mandatory, display_order)
  VALUES
  (v_section_252_10, '252.10(a)', 'Common Equity Tier 1 Capital Ratio', 'A covered company must maintain a Common Equity Tier 1 capital ratio of at least 4.5 percent. CET1 capital ratio is calculated as CET1 capital divided by total risk-weighted assets.', 'calculation', true, 1),
  (v_section_252_10, '252.10(b)', 'Tier 1 Capital Ratio', 'A covered company must maintain a Tier 1 capital ratio of at least 6.0 percent. Tier 1 capital ratio is calculated as Tier 1 capital divided by total risk-weighted assets.', 'calculation', true, 2),
  (v_section_252_10, '252.10(c)', 'Total Capital Ratio', 'A covered company must maintain a Total capital ratio of at least 8.0 percent. Total capital ratio is calculated as Total capital divided by total risk-weighted assets.', 'calculation', true, 3),
  (v_section_252_10, '252.10(d)', 'Leverage Ratio', 'A covered company must maintain a leverage ratio of at least 4.0 percent. Leverage ratio is calculated as Tier 1 capital divided by average total consolidated assets.', 'calculation', true, 4);

  -- =====================================================
  -- § 252.12 - CAPITAL STRESS TESTING (CCAR)
  -- =====================================================
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, hierarchy_level, display_order, is_mandatory)
  VALUES (
    v_reg_yy_id,
    '252.12',
    'Capital Stress Testing Requirements',
    'Requires covered companies to conduct annual capital stress tests using baseline, adverse, and severely adverse scenarios provided by the Federal Reserve Board.',
    '12 CFR § 252.12',
    1,
    12,
    true
  ) RETURNING id INTO v_section_252_12;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, is_mandatory, frequency, display_order)
  VALUES
  (v_section_252_12, '252.12(a)', 'Annual Stress Testing Requirement', 'A covered company must conduct an annual stress test. The stress test must be based on financial data as of September 30 of the calendar year or such other date determined by the Board.', 'system', true, 'Annual', 1),
  (v_section_252_12, '252.12(b)', 'Scenarios', 'The company must use the baseline, adverse, and severely adverse scenarios provided by the Board. Each scenario includes macroeconomic variables including GDP, unemployment rate, equity prices, real estate prices, and interest rates.', 'system', true, 'Annual', 2),
  (v_section_252_12, '252.12(c)', 'Planning Horizon', 'The planning horizon for the stress test is nine quarters (2.25 years), beginning on the first day of a quarter and ending on the last day of the ninth quarter.', 'policy', true, null, 3),
  (v_section_252_12, '252.13(a)(1)', 'Estimate of Losses', 'Must include estimates of losses, pre-provision net revenue, provision for credit losses, and net income for each quarter of the planning horizon.', 'calculation', true, 'Quarterly', 4),
  (v_section_252_12, '252.13(a)(2)', 'Pro Forma Capital Ratios', 'Must calculate pro forma regulatory capital ratios (CET1, Tier 1, Total capital, and leverage ratio) for each quarter of the planning horizon under each scenario.', 'calculation', true, 'Quarterly', 5),
  (v_section_252_12, '252.14', 'Methodologies and Practices', 'Must have clearly defined methodologies for estimating losses, revenues, expenses, and changes in risk-weighted assets and other factors affecting capital.', 'documentation', true, null, 6),
  (v_section_252_12, '252.15', 'Report to Board', 'Must submit a report to the Board containing: description of stress testing methodologies, estimates of losses and revenues, pro forma capital ratios, explanation of capital actions, and discussion of key risks.', 'reporting', true, 'Annual', 7);

  -- =====================================================
  -- § 252.30 - LIQUIDITY COVERAGE RATIO (LCR)
  -- =====================================================
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, hierarchy_level, display_order, is_mandatory)
  VALUES (
    v_reg_yy_id,
    '252.30',
    'Liquidity Coverage Ratio (LCR) Requirement',
    'A covered company must calculate and maintain a liquidity coverage ratio that is equal to or greater than 1.0 on each business day. LCR = HQLA / Total Net Cash Outflows',
    '12 CFR § 252.30',
    1,
    30,
    true
  ) RETURNING id INTO v_section_252_30;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, is_mandatory, frequency, display_order)
  VALUES
  (v_section_252_30, '252.30(a)', 'LCR Minimum Requirement', 'Must maintain LCR ≥ 1.0 (100%) on each business day. LCR = High-Quality Liquid Assets (HQLA) divided by Total Net Cash Outflows over the next 30 calendar days.', 'calculation', true, 'Daily', 1),
  (v_section_252_30, '252.32(a)', 'HQLA Amount - Level 1', 'Level 1 liquid assets are not subject to a haircut and are not subject to the 40% cap. Includes: reserve balances, U.S. Treasury securities, securities issued by U.S. government agencies.', 'calculation', true, 'Daily', 2),
  (v_section_252_30, '252.32(b)', 'HQLA Amount - Level 2A', 'Level 2A liquid assets are subject to a 15% haircut and count toward the 40% cap on Level 2 assets. Includes: U.S. GSE debt securities, certain marketable securities issued by U.S. GSEs and sovereigns.', 'calculation', true, 'Daily', 3),
  (v_section_252_30, '252.32(c)', 'HQLA Amount - Level 2B', 'Level 2B liquid assets are subject to 50% haircut and count toward the 40% cap, with additional 15% cap on 2B assets. Includes: certain corporate debt and equity securities, residential mortgage-backed securities.', 'calculation', true, 'Daily', 4),
  (v_section_252_30, '252.33(a)', 'Outflow Amounts - Retail Deposits', 'Stable retail deposits: 3% outflow rate for deposits in transaction accounts covered by FDIC insurance. Less stable retail deposits: 10% outflow rate.', 'calculation', true, 'Daily', 5),
  (v_section_252_30, '252.33(b)', 'Outflow Amounts - Wholesale Funding', 'Unsecured wholesale funding provided by small business customers: 5%-40% outflow. Unsecured wholesale funding from non-financial corporates: 20%-40% outflow. Unsecured wholesale funding from financial institutions: 100% outflow.', 'calculation', true, 'Daily', 6),
  (v_section_252_30, '252.33(c)', 'Outflow Amounts - Secured Funding', 'Secured funding transactions backed by Level 1 liquid assets: 0% outflow. Backed by Level 2A: 15% outflow. Backed by Level 2B: 50% outflow. Backed by non-HQLA: 100% outflow.', 'calculation', true, 'Daily', 7),
  (v_section_252_30, '252.33(d)', 'Outflow Amounts - Derivatives', 'Derivative collateral outflows calculated based on collateral posted related to market valuation changes, contractual obligations for collateral, and segregated initial margin.', 'calculation', true, 'Daily', 8),
  (v_section_252_30, '252.33(e)', 'Outflow Amounts - Commitments', 'Undrawn committed credit facilities to retail customers: 5% outflow. To non-financial corporates: 10%-40% outflow. To financial institutions: 40%-100% outflow.', 'calculation', true, 'Daily', 9),
  (v_section_252_30, '252.34(a)', 'Inflow Amounts', 'Inflows from contractually due payments on performing assets: up to 50% can offset outflows. Inflows from deposits at other financial institutions: up to 100% (subject to restrictions). Cannot rely on anticipated inflows from new business.', 'calculation', true, 'Daily', 10),
  (v_section_252_30, '252.35', 'Inflow and Outflow Cap', 'Total inflows cannot exceed 75% of total outflows when calculating net cash outflows. Ensures minimum HQLA holding.', 'calculation', true, 'Daily', 11);

  -- =====================================================
  -- § 252.100 - NET STABLE FUNDING RATIO (NSFR)
  -- =====================================================
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, hierarchy_level, display_order, is_mandatory)
  VALUES (
    v_reg_yy_id,
    '252.100',
    'Net Stable Funding Ratio (NSFR) Requirement',
    'A covered company must maintain a net stable funding ratio of 1.0 or greater on an ongoing basis. NSFR = Available Stable Funding (ASF) / Required Stable Funding (RSF)',
    '12 CFR § 252.100',
    1,
    100,
    true
  ) RETURNING id INTO v_section_252_100;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, is_mandatory, frequency, display_order)
  VALUES
  (v_section_252_100, '252.100(a)', 'NSFR Minimum Requirement', 'Must maintain NSFR ≥ 1.0 (100%) on ongoing basis. NSFR = Available Stable Funding (ASF) divided by Required Stable Funding (RSF).', 'calculation', true, 'Monthly', 1),
  (v_section_252_100, '252.101(a)', 'ASF Amount - Capital', 'Regulatory capital elements (excluding Tier 2 capital instruments with remaining maturity less than one year): 100% ASF factor.', 'calculation', true, 'Monthly', 2),
  (v_section_252_100, '252.101(b)', 'ASF Amount - Retail Deposits', 'Stable retail deposits and brokered deposits: 95% ASF factor. Less stable retail deposits: 90% ASF factor.', 'calculation', true, 'Monthly', 3),
  (v_section_252_100, '252.101(c)', 'ASF Amount - Wholesale Funding', 'Operational deposits: 50% ASF factor. Other wholesale funding with maturity ≥ 1 year: 100% ASF. Wholesale funding with maturity 6 months to 1 year: 50% ASF.', 'calculation', true, 'Monthly', 4),
  (v_section_252_100, '252.102(a)', 'RSF Amount - Cash and Central Bank Reserves', 'Cash and reserves: 0% RSF factor. Unencumbered Level 1 liquid assets: 0% RSF (except currency and coin which is 5%).', 'calculation', true, 'Monthly', 5),
  (v_section_252_100, '252.102(b)', 'RSF Amount - Securities', 'Unencumbered Level 2A liquid assets: 15% RSF. Level 2B liquid assets: 50% RSF. Non-HQLA marketable securities: 50%-85% RSF depending on type.', 'calculation', true, 'Monthly', 6),
  (v_section_252_100, '252.102(c)', 'RSF Amount - Loans', 'Performing loans to financial institutions with maturity < 6 months: 10%-15% RSF. Performing loans to retail and SME customers: 85% RSF. Other performing loans: 85%-100% RSF.', 'calculation', true, 'Monthly', 7),
  (v_section_252_100, '252.102(d)', 'RSF Amount - Other Assets', 'Physical traded commodities: 85% RSF. All other assets (including non-performing loans, defaulted securities): 100% RSF.', 'calculation', true, 'Monthly', 8),
  (v_section_252_100, '252.103', 'Interdependence Between ASF and RSF', 'Secured funding transactions, securities financing transactions, and asset exchanges must assign consistent ASF and RSF treatment to both sides of the transaction.', 'calculation', true, 'Monthly', 9);

  -- =====================================================
  -- § 252.150 - LIQUIDITY RISK MANAGEMENT
  -- =====================================================
  INSERT INTO regulation_sections (framework_id, section_number, section_title, section_text, cfr_citation, hierarchy_level, display_order, is_mandatory)
  VALUES (
    v_reg_yy_id,
    '252.150',
    'Liquidity Risk Management Requirements',
    'Establishes liquidity risk management, liquidity stress testing, and liquidity buffer requirements for large banking organizations.',
    '12 CFR § 252.150-159',
    1,
    150,
    true
  ) RETURNING id INTO v_section_252_150;

  INSERT INTO regulation_subsections (section_id, subsection_number, subsection_title, subsection_text, requirement_type, is_mandatory, display_order)
  VALUES
  (v_section_252_150, '252.153', 'Liquidity Risk Management', 'Must establish and maintain a liquidity risk management framework that includes: identification and measurement of liquidity risk, limits, stress testing, contingency funding plan, cash flow projections, collateral management, intraday liquidity management.', 'governance', true, 1),
  (v_section_252_150, '252.155', 'Liquidity Stress Testing', 'Must conduct liquidity stress tests on at least a monthly basis. Tests must include multiple scenarios including institution-specific, market-wide, and combined stress events. Must evaluate impact on cash flows, liquidity position, profitability, and solvency.', 'system', true, 2),
  (v_section_252_150, '252.157', 'Liquidity Buffer', 'Must maintain a liquidity buffer of unencumbered highly liquid assets sufficient to meet projected net stressed cash-flow needs over 30 days under internal stress scenarios. Buffer must be available for use during times of stress.', 'policy', true, 3),
  (v_section_252_150, '252.159', 'Contingency Funding Plan', 'Must establish and maintain a contingency funding plan that addresses strategies for managing liquidity in stress events. Plan must identify alternative funding sources, maintain relationships with providers, and be tested periodically.', 'documentation', true, 4);

END $$;
