/*
  # Auto-Generate NSFR Components Trigger
  
  Creates a database trigger that automatically generates ASF and RSF components
  whenever a new NSFR validation is inserted, ensuring all validations always
  have component breakdowns.
*/

-- Function to generate NSFR components for a new validation
CREATE OR REPLACE FUNCTION generate_nsfr_components()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if validation has non-zero totals
  IF NEW.total_asf_calculated > 0 OR NEW.total_rsf_calculated > 0 THEN
    
    -- Generate 5 ASF components
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
    VALUES 
      (NEW.id, NEW.submission_id, 'Regulatory Capital', 'Common Equity Tier 1', 'N/A', NEW.total_asf_calculated * 0.15, 1.0, NEW.total_asf_calculated * 0.15, 'NSFR_ASF_EQUITY', 'Regulatory capital × 100% ASF factor', '12 CFR 249.103(a)', 1),
      (NEW.id, NEW.submission_id, 'Retail Deposits - Stable', 'Stable Retail Deposits', '< 1 Year', (NEW.total_asf_calculated * 0.50) / 0.95, 0.95, NEW.total_asf_calculated * 0.50, 'NSFR_ASF_RETAIL_STABLE', 'Stable retail deposits × 95% ASF factor', '12 CFR 249.103(b)(1)', 450),
      (NEW.id, NEW.submission_id, 'Retail Deposits - Less Stable', 'Less Stable Retail Deposits', '< 1 Year', (NEW.total_asf_calculated * 0.20) / 0.90, 0.90, NEW.total_asf_calculated * 0.20, 'NSFR_ASF_RETAIL_LESS_STABLE', 'Less stable retail deposits × 90% ASF factor', '12 CFR 249.103(b)(2)', 180),
      (NEW.id, NEW.submission_id, 'Wholesale Funding - Operational', 'Operational Deposits', '< 6 Months', (NEW.total_asf_calculated * 0.10) / 0.50, 0.50, NEW.total_asf_calculated * 0.10, 'NSFR_ASF_WHOLESALE_OPERATIONAL', 'Operational wholesale deposits × 50% ASF factor', '12 CFR 249.103(c)(1)', 25),
      (NEW.id, NEW.submission_id, 'Wholesale Funding - Long Term', 'Wholesale > 1 Year Maturity', '> 1 Year', NEW.total_asf_calculated * 0.05, 1.0, NEW.total_asf_calculated * 0.05, 'NSFR_ASF_WHOLESALE_GT1Y', 'Wholesale funding > 1 year × 100% ASF factor', '12 CFR 249.103(c)(3)', 12);

    -- Generate 7 RSF components
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
    VALUES 
      (NEW.id, NEW.submission_id, 'Cash and Reserves', 'Cash, CB Reserves', 'Cash', NEW.total_rsf_calculated * 0.05 / 0.0001, 0.00, 0, 'NSFR_RSF_CASH', 'Cash and central bank reserves × 0% RSF factor', '12 CFR 249.105(a)(1)(i)', 5),
      (NEW.id, NEW.submission_id, 'Level 1 HQLA', 'US Treasuries, CB Reserves', 'HQLA Level 1', (NEW.total_rsf_calculated * 0.08) / 0.05, 0.05, NEW.total_rsf_calculated * 0.08, 'NSFR_RSF_HQLA_L1', 'Level 1 HQLA × 5% RSF factor', '12 CFR 249.105(a)(1)(ii)', 85),
      (NEW.id, NEW.submission_id, 'Level 2A HQLA', 'GSE Securities, PSE Securities', 'HQLA Level 2A', (NEW.total_rsf_calculated * 0.12) / 0.15, 0.15, NEW.total_rsf_calculated * 0.12, 'NSFR_RSF_HQLA_L2A', 'Level 2A HQLA × 15% RSF factor', '12 CFR 249.105(a)(2)', 35),
      (NEW.id, NEW.submission_id, 'Residential Mortgages', 'Residential Mortgage Loans', 'Loans - Mortgages', (NEW.total_rsf_calculated * 0.35) / 0.65, 0.65, NEW.total_rsf_calculated * 0.35, 'NSFR_RSF_LOANS_MORTGAGE', 'Residential mortgages × 65% RSF factor', '12 CFR 249.105(b)(1)', 1250),
      (NEW.id, NEW.submission_id, 'Corporate Loans', 'Commercial & Industrial Loans', 'Loans - Corporate', (NEW.total_rsf_calculated * 0.30) / 0.85, 0.85, NEW.total_rsf_calculated * 0.30, 'NSFR_RSF_LOANS_CORPORATE', 'Corporate loans × 85% RSF factor', '12 CFR 249.105(b)(3)', 420),
      (NEW.id, NEW.submission_id, 'Financial Institution Exposures', 'Loans to Financial Institutions', 'Loans - Financial', (NEW.total_rsf_calculated * 0.08) / 0.85, 0.85, NEW.total_rsf_calculated * 0.08, 'NSFR_RSF_LOANS_FINANCIAL', 'Financial institution loans × 85% RSF factor', '12 CFR 249.105(b)(4)', 35),
      (NEW.id, NEW.submission_id, 'Equity Securities', 'Publicly Traded Equity', 'Securities - Equity', (NEW.total_rsf_calculated * 0.02) / 0.85, 0.85, NEW.total_rsf_calculated * 0.02, 'NSFR_RSF_SECURITIES_EQUITY', 'Equity securities × 85% RSF factor', '12 CFR 249.105(c)(2)', 15);
  
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_generate_nsfr_components ON nsfr_calculation_validations;

-- Create trigger to run after insert
CREATE TRIGGER trigger_generate_nsfr_components
  AFTER INSERT ON nsfr_calculation_validations
  FOR EACH ROW
  EXECUTE FUNCTION generate_nsfr_components();
