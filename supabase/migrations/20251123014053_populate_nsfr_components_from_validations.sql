/*
  # Populate NSFR ASF and RSF Components
  
  Generates component-level breakdowns for NSFR validations to enable
  drill-down similar to LCR validation with View Rule and View Records capabilities.
*/

-- Populate ASF Components from validation data
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
  regulatory_reference
)
SELECT 
  v.id as nsfr_validation_id,
  v.submission_id,
  'Regulatory Capital' as asf_category,
  'Capital and Equity' as product_type,
  'N/A' as maturity_bucket,
  v.capital_asf_calculated / 1.0 as total_amount,
  1.0 as asf_factor,
  v.capital_asf_calculated as calculated_asf,
  'NSFR_ASF_EQUITY' as rule_code,
  'Capital receives 100% ASF factor' as calculation_methodology,
  '12 CFR 249.103(a)' as regulatory_reference
FROM nsfr_calculation_validations v
WHERE v.capital_asf_calculated > 0
  AND NOT EXISTS (
    SELECT 1 FROM nsfr_asf_components c 
    WHERE c.nsfr_validation_id = v.id AND c.asf_category = 'Regulatory Capital'
  );

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
  regulatory_reference
)
SELECT 
  v.id as nsfr_validation_id,
  v.submission_id,
  'Retail Deposits - Stable' as asf_category,
  'Stable Retail Deposits' as product_type,
  '< 1 Year' as maturity_bucket,
  v.retail_deposits_asf_calculated / 0.95 as total_amount,
  0.95 as asf_factor,
  v.retail_deposits_asf_calculated as calculated_asf,
  'NSFR_ASF_RETAIL_STABLE' as rule_code,
  'Stable retail deposits × 95% ASF factor' as calculation_methodology,
  '12 CFR 249.103(b)(1)' as regulatory_reference
FROM nsfr_calculation_validations v
WHERE v.retail_deposits_asf_calculated > 0
  AND NOT EXISTS (
    SELECT 1 FROM nsfr_asf_components c 
    WHERE c.nsfr_validation_id = v.id AND c.asf_category = 'Retail Deposits - Stable'
  );

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
  regulatory_reference
)
SELECT 
  v.id as nsfr_validation_id,
  v.submission_id,
  'Wholesale Funding - Operational' as asf_category,
  'Operational Deposits' as product_type,
  '< 6 Months' as maturity_bucket,
  v.wholesale_funding_asf_calculated / 0.5 as total_amount,
  0.50 as asf_factor,
  v.wholesale_funding_asf_calculated as calculated_asf,
  'NSFR_ASF_WHOLESALE_OPERATIONAL' as rule_code,
  'Operational wholesale funding × 50% ASF factor' as calculation_methodology,
  '12 CFR 249.103(c)(1)' as regulatory_reference
FROM nsfr_calculation_validations v
WHERE v.wholesale_funding_asf_calculated > 0
  AND NOT EXISTS (
    SELECT 1 FROM nsfr_asf_components c 
    WHERE c.nsfr_validation_id = v.id AND c.asf_category = 'Wholesale Funding - Operational'
  );

-- Populate RSF Components from validation data
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
  regulatory_reference
)
SELECT 
  v.id as nsfr_validation_id,
  v.submission_id,
  'Level 1 HQLA' as rsf_category,
  'Level 1 Assets' as product_type,
  'Cash, Treasuries, CB Reserves' as asset_class,
  v.level1_assets_rsf_calculated / 0.05 as total_amount,
  0.05 as rsf_factor,
  v.level1_assets_rsf_calculated as calculated_rsf,
  'NSFR_RSF_HQLA_L1' as rule_code,
  'Level 1 HQLA × 5% RSF factor' as calculation_methodology,
  '12 CFR 249.105(a)(1)' as regulatory_reference
FROM nsfr_calculation_validations v
WHERE v.level1_assets_rsf_calculated > 0
  AND NOT EXISTS (
    SELECT 1 FROM nsfr_rsf_components c 
    WHERE c.nsfr_validation_id = v.id AND c.rsf_category = 'Level 1 HQLA'
  );

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
  regulatory_reference
)
SELECT 
  v.id as nsfr_validation_id,
  v.submission_id,
  'Level 2A HQLA' as rsf_category,
  'Level 2A Assets' as product_type,
  'GSE Securities, PSE Securities' as asset_class,
  v.level2a_assets_rsf_calculated / 0.15 as total_amount,
  0.15 as rsf_factor,
  v.level2a_assets_rsf_calculated as calculated_rsf,
  'NSFR_RSF_HQLA_L2A' as rule_code,
  'Level 2A HQLA × 15% RSF factor' as calculation_methodology,
  '12 CFR 249.105(a)(2)' as regulatory_reference
FROM nsfr_calculation_validations v
WHERE v.level2a_assets_rsf_calculated > 0
  AND NOT EXISTS (
    SELECT 1 FROM nsfr_rsf_components c 
    WHERE c.nsfr_validation_id = v.id AND c.rsf_category = 'Level 2A HQLA'
  );

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
  regulatory_reference
)
SELECT 
  v.id as nsfr_validation_id,
  v.submission_id,
  'Residential Mortgages' as rsf_category,
  'Mortgage Loans' as product_type,
  'Residential Real Estate' as asset_class,
  v.loans_rsf_calculated / 0.65 as total_amount,
  0.65 as rsf_factor,
  v.loans_rsf_calculated as calculated_rsf,
  'NSFR_RSF_LOANS_MORTGAGE' as rule_code,
  'Residential mortgages × 65% RSF factor' as calculation_methodology,
  '12 CFR 249.105(b)(1)' as regulatory_reference
FROM nsfr_calculation_validations v
WHERE v.loans_rsf_calculated > 0
  AND NOT EXISTS (
    SELECT 1 FROM nsfr_rsf_components c 
    WHERE c.nsfr_validation_id = v.id AND c.rsf_category = 'Residential Mortgages'
  );

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
  regulatory_reference
)
SELECT 
  v.id as nsfr_validation_id,
  v.submission_id,
  'Other Assets' as rsf_category,
  'Other Performing Assets' as product_type,
  'Various' as asset_class,
  v.other_assets_rsf_calculated / 0.85 as total_amount,
  0.85 as rsf_factor,
  v.other_assets_rsf_calculated as calculated_rsf,
  'NSFR_RSF_SECURITIES_EQUITY' as rule_code,
  'Other assets × 85% RSF factor' as calculation_methodology,
  '12 CFR 249.105(c)' as regulatory_reference
FROM nsfr_calculation_validations v
WHERE v.other_assets_rsf_calculated > 0
  AND NOT EXISTS (
    SELECT 1 FROM nsfr_rsf_components c 
    WHERE c.nsfr_validation_id = v.id AND c.rsf_category = 'Other Assets'
  );
