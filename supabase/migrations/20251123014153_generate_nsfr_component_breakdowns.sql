/*
  # Generate NSFR Component Breakdowns
  
  Creates realistic component-level breakdowns for NSFR validations
  by distributing total ASF and RSF across categories with appropriate factors.
*/

-- Clear any existing components
DELETE FROM nsfr_asf_components;
DELETE FROM nsfr_rsf_components;

-- Generate ASF components with realistic distribution
-- For each validation, create 5 ASF component types

-- 1. Regulatory Capital (100% ASF factor)
INSERT INTO nsfr_asf_components (
  nsfr_validation_id,
  submission_id,
  asf_category,
  product_type,
  maturity_bucket,
  total_amount,
  asf_factor,
  calculated_asf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Regulatory Capital',
  'Common Equity Tier 1',
  'N/A',
  v.total_asf_calculated * 0.15,  -- 15% from capital
  1.0,
  v.total_asf_calculated * 0.15,
  'NSFR_ASF_EQUITY',
  'Regulatory capital × 100% ASF factor',
  '12 CFR 249.103(a)',
  1
FROM nsfr_calculation_validations v
WHERE v.total_asf_calculated > 0;

-- 2. Stable Retail Deposits (95% ASF factor)
INSERT INTO nsfr_asf_components (
  nsfr_validation_id,
  submission_id,
  asf_category,
  product_type,
  maturity_bucket,
  total_amount,
  asf_factor,
  calculated_asf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Retail Deposits - Stable',
  'Stable Retail Deposits',
  '< 1 Year',
  (v.total_asf_calculated * 0.50) / 0.95,  -- 50% contribution / factor
  0.95,
  v.total_asf_calculated * 0.50,
  'NSFR_ASF_RETAIL_STABLE',
  'Stable retail deposits × 95% ASF factor',
  '12 CFR 249.103(b)(1)',
  450
FROM nsfr_calculation_validations v
WHERE v.total_asf_calculated > 0;

-- 3. Less Stable Retail Deposits (90% ASF factor)
INSERT INTO nsfr_asf_components (
  nsfr_validation_id,
  submission_id,
  asf_category,
  product_type,
  maturity_bucket,
  total_amount,
  asf_factor,
  calculated_asf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Retail Deposits - Less Stable',
  'Less Stable Retail Deposits',
  '< 1 Year',
  (v.total_asf_calculated * 0.20) / 0.90,
  0.90,
  v.total_asf_calculated * 0.20,
  'NSFR_ASF_RETAIL_LESS_STABLE',
  'Less stable retail deposits × 90% ASF factor',
  '12 CFR 249.103(b)(2)',
  180
FROM nsfr_calculation_validations v
WHERE v.total_asf_calculated > 0;

-- 4. Operational Wholesale (50% ASF factor)
INSERT INTO nsfr_asf_components (
  nsfr_validation_id,
  submission_id,
  asf_category,
  product_type,
  maturity_bucket,
  total_amount,
  asf_factor,
  calculated_asf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Wholesale Funding - Operational',
  'Operational Deposits',
  '< 6 Months',
  (v.total_asf_calculated * 0.10) / 0.50,
  0.50,
  v.total_asf_calculated * 0.10,
  'NSFR_ASF_WHOLESALE_OPERATIONAL',
  'Operational wholesale deposits × 50% ASF factor',
  '12 CFR 249.103(c)(1)',
  25
FROM nsfr_calculation_validations v
WHERE v.total_asf_calculated > 0;

-- 5. Wholesale > 1 Year (100% ASF factor)
INSERT INTO nsfr_asf_components (
  nsfr_validation_id,
  submission_id,
  asf_category,
  product_type,
  maturity_bucket,
  total_amount,
  asf_factor,
  calculated_asf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Wholesale Funding - Long Term',
  'Wholesale > 1 Year Maturity',
  '> 1 Year',
  v.total_asf_calculated * 0.05,
  1.0,
  v.total_asf_calculated * 0.05,
  'NSFR_ASF_WHOLESALE_GT1Y',
  'Wholesale funding > 1 year × 100% ASF factor',
  '12 CFR 249.103(c)(3)',
  12
FROM nsfr_calculation_validations v
WHERE v.total_asf_calculated > 0;

-- Generate RSF components with realistic distribution

-- 1. Cash and CB Reserves (0% RSF factor)
INSERT INTO nsfr_rsf_components (
  nsfr_validation_id,
  submission_id,
  rsf_category,
  product_type,
  asset_class,
  total_amount,
  rsf_factor,
  calculated_rsf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Cash and Reserves',
  'Cash, CB Reserves',
  'Cash',
  v.total_rsf_calculated * 0.05 / 0.0001,  -- Small amount (avoid div by 0)
  0.00,
  0,
  'NSFR_RSF_CASH',
  'Cash and central bank reserves × 0% RSF factor',
  '12 CFR 249.105(a)(1)(i)',
  5
FROM nsfr_calculation_validations v
WHERE v.total_rsf_calculated > 0;

-- 2. Level 1 HQLA (5% RSF factor)
INSERT INTO nsfr_rsf_components (
  nsfr_validation_id,
  submission_id,
  rsf_category,
  product_type,
  asset_class,
  total_amount,
  rsf_factor,
  calculated_rsf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Level 1 HQLA',
  'US Treasuries, CB Reserves',
  'HQLA Level 1',
  (v.total_rsf_calculated * 0.08) / 0.05,
  0.05,
  v.total_rsf_calculated * 0.08,
  'NSFR_RSF_HQLA_L1',
  'Level 1 HQLA × 5% RSF factor',
  '12 CFR 249.105(a)(1)(ii)',
  85
FROM nsfr_calculation_validations v
WHERE v.total_rsf_calculated > 0;

-- 3. Level 2A HQLA (15% RSF factor)
INSERT INTO nsfr_rsf_components (
  nsfr_validation_id,
  submission_id,
  rsf_category,
  product_type,
  asset_class,
  total_amount,
  rsf_factor,
  calculated_rsf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Level 2A HQLA',
  'GSE Securities, PSE Securities',
  'HQLA Level 2A',
  (v.total_rsf_calculated * 0.12) / 0.15,
  0.15,
  v.total_rsf_calculated * 0.12,
  'NSFR_RSF_HQLA_L2A',
  'Level 2A HQLA × 15% RSF factor',
  '12 CFR 249.105(a)(2)',
  35
FROM nsfr_calculation_validations v
WHERE v.total_rsf_calculated > 0;

-- 4. Residential Mortgages (65% RSF factor)
INSERT INTO nsfr_rsf_components (
  nsfr_validation_id,
  submission_id,
  rsf_category,
  product_type,
  asset_class,
  total_amount,
  rsf_factor,
  calculated_rsf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Residential Mortgages',
  'Residential Mortgage Loans',
  'Loans - Mortgages',
  (v.total_rsf_calculated * 0.35) / 0.65,
  0.65,
  v.total_rsf_calculated * 0.35,
  'NSFR_RSF_LOANS_MORTGAGE',
  'Residential mortgages × 65% RSF factor',
  '12 CFR 249.105(b)(1)',
  1250
FROM nsfr_calculation_validations v
WHERE v.total_rsf_calculated > 0;

-- 5. Corporate Loans (85% RSF factor)
INSERT INTO nsfr_rsf_components (
  nsfr_validation_id,
  submission_id,
  rsf_category,
  product_type,
  asset_class,
  total_amount,
  rsf_factor,
  calculated_rsf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Corporate Loans',
  'Commercial & Industrial Loans',
  'Loans - Corporate',
  (v.total_rsf_calculated * 0.30) / 0.85,
  0.85,
  v.total_rsf_calculated * 0.30,
  'NSFR_RSF_LOANS_CORPORATE',
  'Corporate loans × 85% RSF factor',
  '12 CFR 249.105(b)(3)',
  420
FROM nsfr_calculation_validations v
WHERE v.total_rsf_calculated > 0;

-- 6. Financial Institution Loans (85% RSF factor)
INSERT INTO nsfr_rsf_components (
  nsfr_validation_id,
  submission_id,
  rsf_category,
  product_type,
  asset_class,
  total_amount,
  rsf_factor,
  calculated_rsf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Financial Institution Exposures',
  'Loans to Financial Institutions',
  'Loans - Financial',
  (v.total_rsf_calculated * 0.08) / 0.85,
  0.85,
  v.total_rsf_calculated * 0.08,
  'NSFR_RSF_LOANS_FINANCIAL',
  'Financial institution loans × 85% RSF factor',
  '12 CFR 249.105(b)(4)',
  35
FROM nsfr_calculation_validations v
WHERE v.total_rsf_calculated > 0;

-- 7. Equity Securities (85% RSF factor)
INSERT INTO nsfr_rsf_components (
  nsfr_validation_id,
  submission_id,
  rsf_category,
  product_type,
  asset_class,
  total_amount,
  rsf_factor,
  calculated_rsf,
  rule_code,
  calculation_methodology,
  regulatory_reference,
  record_count
)
SELECT 
  v.id,
  v.submission_id,
  'Equity Securities',
  'Publicly Traded Equity',
  'Securities - Equity',
  (v.total_rsf_calculated * 0.02) / 0.85,
  0.85,
  v.total_rsf_calculated * 0.02,
  'NSFR_RSF_SECURITIES_EQUITY',
  'Equity securities × 85% RSF factor',
  '12 CFR 249.105(c)(2)',
  15
FROM nsfr_calculation_validations v
WHERE v.total_rsf_calculated > 0;
