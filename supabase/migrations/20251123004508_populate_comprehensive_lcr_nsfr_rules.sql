/*
  # Populate Comprehensive LCR and NSFR Calculation Rules
  
  Populates all calculation rules from FR 2052a Appendix VI covering:
  - HQLA Level 1, 2A, 2B Assets
  - Cash Outflows (Retail, Wholesale, Secured, Derivatives, Commitments)
  - Cash Inflows (Contractual, Cap)
  - NSFR ASF and RSF Factors
*/

-- Clear existing to repopulate
DELETE FROM lcr_calculation_rules;

-- HQLA LEVEL 1
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('HQLA_L1_CASH', 'HQLA_Level_1', 'Level 1 HQLA - Cash', 'Appendix VI, Section A.1', 'Cash Amount × 100% (no haircut)', 1.0, 'Cash on hand and reserves held at Federal Reserve Banks or central banks.', '12 CFR 249.20(a)(1)', 'Physical currency, demand deposits at Federal Reserve Banks'),
('HQLA_L1_SOVEREIGN', 'HQLA_Level_1', 'Level 1 HQLA - U.S. Treasury Securities', 'Appendix VI, Section A.2', 'Market Value × 100% (no haircut)', 1.0, 'Marketable securities representing claims on or guaranteed by U.S. government.', '12 CFR 249.20(a)(1)', 'U.S. Treasury bills, notes, bonds, TIPS'),
('HQLA_L1_CB_RESERVES', 'HQLA_Level_1', 'Level 1 HQLA - Central Bank Reserves', 'Appendix VI, Section A.1', 'Reserve Balance × 100% (no haircut)', 1.0, 'Reserve balances held at Federal Reserve Banks.', '12 CFR 249.20(a)(1)', 'Federal Reserve deposits, Master Account balances'),
('HQLA_L1_SOVEREIGN_FOREIGN', 'HQLA_Level_1', 'Level 1 HQLA - Foreign Sovereign (0% Risk Weight)', 'Appendix VI, Section A.3', 'Market Value × 100% (no haircut)', 1.0, 'Marketable securities issued by sovereigns with 0% risk weight.', '12 CFR 249.20(a)(2)', 'German Bunds, UK Gilts, Canadian Government Bonds');

-- HQLA LEVEL 2A
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('HQLA_L2A_GSE', 'HQLA_Level_2A', 'Level 2A HQLA - GSE Securities', 'Appendix VI, Section B.1', 'Market Value × 85% (15% haircut)', 0.85, 'Securities issued or guaranteed by U.S. GSEs.', '12 CFR 249.20(b)(1)', 'Fannie Mae MBS, Freddie Mac MBS, FHLB securities'),
('HQLA_L2A_SOVEREIGN_20PCT', 'HQLA_Level_2A', 'Level 2A HQLA - Foreign Sovereign (20% Risk)', 'Appendix VI, Section B.2', 'Market Value × 85% (15% haircut)', 0.85, 'Securities issued by sovereigns with 20% risk weight.', '12 CFR 249.20(b)(2)', 'Qualifying foreign sovereigns rated AA- or higher'),
('HQLA_L2A_PSE', 'HQLA_Level_2A', 'Level 2A HQLA - Public Sector Entities', 'Appendix VI, Section B.3', 'Market Value × 85% (15% haircut)', 0.85, 'Securities issued by U.S. or foreign public sector entities.', '12 CFR 249.20(b)(3)', 'U.S. state municipal bonds, Supranational debt');

-- HQLA LEVEL 2B
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('HQLA_L2B_CORPORATE', 'HQLA_Level_2B', 'Level 2B HQLA - Corporate Debt', 'Appendix VI, Section C.1', 'Market Value × 50% (50% haircut)', 0.50, 'Investment grade corporate debt securities rated BBB- to A+.', '12 CFR 249.20(c)(1)', 'Investment grade corporate bonds'),
('HQLA_L2B_EQUITY', 'HQLA_Level_2B', 'Level 2B HQLA - Common Equity', 'Appendix VI, Section C.2', 'Market Value × 50% (50% haircut)', 0.50, 'Publicly traded common equity in major indices.', '12 CFR 249.20(c)(2)', 'S&P 500, Russell 1000 constituents'),
('HQLA_L2B_RMBS', 'HQLA_Level_2B', 'Level 2B HQLA - RMBS', 'Appendix VI, Section C.3', 'Market Value × 50% (50% haircut)', 0.50, 'Agency RMBS rated AA or higher (non-GSE).', '12 CFR 249.20(c)(3)', 'Non-agency RMBS with AA+ rating');

-- CASH OUTFLOWS - RETAIL
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('OUTFLOW_RETAIL_STABLE', 'Cash_Outflows_Retail', 'Retail Deposits - Stable', 'Appendix VI, Section D.1.a', 'Deposit Amount × 3% runoff', 0.03, 'Retail deposits meeting stable deposit criteria.', '12 CFR 249.32(a)(1)', 'FDIC-insured checking/savings, established relationships'),
('OUTFLOW_RETAIL_LESS_STABLE', 'Cash_Outflows_Retail', 'Retail Deposits - Less Stable', 'Appendix VI, Section D.1.b', 'Deposit Amount × 10% runoff', 0.10, 'Retail deposits not meeting stable criteria.', '12 CFR 249.32(a)(2)', 'High-rate savings, brokered deposits');

-- CASH OUTFLOWS - WHOLESALE
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('OUTFLOW_WHOLESALE_OPERATIONAL', 'Cash_Outflows_Wholesale', 'Wholesale - Operational Deposits', 'Appendix VI, Section D.2.a', 'Deposit Amount × 25% runoff', 0.25, 'Deposits from clearing, custody, cash management.', '12 CFR 249.32(b)(1)', 'Customer margin, securities settlement'),
('OUTFLOW_WHOLESALE_NONOPERATIONAL', 'Cash_Outflows_Wholesale', 'Wholesale - Non-Operational', 'Appendix VI, Section D.2.b', 'Deposit Amount × 40% runoff', 0.40, 'Wholesale deposits not operational.', '12 CFR 249.32(b)(2)', 'Corporate treasury deposits, interbank'),
('OUTFLOW_WHOLESALE_FINANCIAL', 'Cash_Outflows_Wholesale', 'Wholesale - Financial Institutions', 'Appendix VI, Section D.2.c', 'Deposit Amount × 100% runoff', 1.00, 'Deposits from financial institutions.', '12 CFR 249.32(b)(3)', 'Bank deposits, broker-dealer, hedge funds');

-- CASH OUTFLOWS - SECURED
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('OUTFLOW_SECURED_REPO_L1', 'Cash_Outflows_Secured', 'Repo - Level 1 HQLA Collateral', 'Appendix VI, Section D.3.a', 'Borrowing × 0% runoff', 0.00, 'Repos backed by Level 1 HQLA.', '12 CFR 249.32(c)(1)', 'Repos backed by U.S. Treasuries'),
('OUTFLOW_SECURED_REPO_L2A', 'Cash_Outflows_Secured', 'Repo - Level 2A HQLA Collateral', 'Appendix VI, Section D.3.b', 'Borrowing × 15% runoff', 0.15, 'Repos backed by Level 2A HQLA.', '12 CFR 249.32(c)(2)', 'Repos backed by GSE securities'),
('OUTFLOW_SECURED_REPO_OTHER', 'Cash_Outflows_Secured', 'Repo - Other Collateral', 'Appendix VI, Section D.3.c', 'Borrowing × 25-100% runoff', 0.25, 'Repos backed by non-HQLA collateral.', '12 CFR 249.32(c)(3)', 'Repos backed by corporate bonds');

-- CASH OUTFLOWS - DERIVATIVES
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('OUTFLOW_DERIVATIVES_COLLATERAL', 'Cash_Outflows_Derivatives', 'Derivative Collateral Outflow', 'Appendix VI, Section D.4.a', 'Market Value Change × Collateral', 1.00, 'Additional collateral for derivatives under stress.', '12 CFR 249.32(d)(1)', 'Variation margin on swaps, FX forwards'),
('OUTFLOW_DERIVATIVES_OPTION', 'Cash_Outflows_Derivatives', 'Derivative Option Exercise', 'Appendix VI, Section D.4.b', 'Notional × Settlement', 1.00, 'Cash from exercised options or terminations.', '12 CFR 249.32(d)(2)', 'Client exercises put options');

-- CASH OUTFLOWS - COMMITMENTS
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('OUTFLOW_COMMITMENT_RETAIL', 'Cash_Outflows_Commitments', 'Credit Facility - Retail', 'Appendix VI, Section D.5.a', 'Commitment × 5% drawdown', 0.05, 'Undrawn credit facilities to retail.', '12 CFR 249.32(e)(1)', 'Credit card lines, HELOCs'),
('OUTFLOW_COMMITMENT_CORPORATE', 'Cash_Outflows_Commitments', 'Credit Facility - Corporate', 'Appendix VI, Section D.5.b', 'Commitment × 10% drawdown', 0.10, 'Undrawn facilities to non-financial corporates.', '12 CFR 249.32(e)(2)', 'Revolving credit, working capital lines'),
('OUTFLOW_COMMITMENT_FINANCIAL', 'Cash_Outflows_Commitments', 'Credit Facility - Financial', 'Appendix VI, Section D.5.c', 'Commitment × 40% drawdown', 0.40, 'Undrawn facilities to financial institutions.', '12 CFR 249.32(e)(3)', 'Bank lines, dealer financing'),
('OUTFLOW_COMMITMENT_LIQUIDITY', 'Cash_Outflows_Commitments', 'Liquidity Facility', 'Appendix VI, Section D.5.d', 'Commitment × 100% drawdown', 1.00, 'Contractual liquidity facilities.', '12 CFR 249.32(e)(4)', 'Standby LOCs, CP backup lines');

-- CASH INFLOWS
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('INFLOW_LOANS_MATURING', 'Cash_Inflows_Contractual', 'Maturing Loans and Securities', 'Appendix VI, Section E.1', 'Maturing Amount × Rate', 0.50, 'Contractual inflows from maturing assets.', '12 CFR 249.33(b)', 'Wholesale loans 50%, performing securities 100%'),
('INFLOW_REVERSE_REPO_CB', 'Cash_Inflows_Contractual', 'Reverse Repos - Central Bank', 'Appendix VI, Section E.2', 'Amount × 100% inflow', 1.00, 'Maturing reverse repos with central banks.', '12 CFR 249.33(c)', 'Reverse repos with Federal Reserve'),
('INFLOW_REVERSE_REPO_OTHER', 'Cash_Inflows_Contractual', 'Reverse Repos - Other', 'Appendix VI, Section E.2', 'Amount × 0-100% inflow', 0.00, 'Maturing reverse repos with non-CB counterparties.', '12 CFR 249.33(c)', '0% for Level 1 HQLA, 15% for Level 2A'),
('INFLOW_CAP_75PCT', 'Cash_Inflows_Cap', 'Inflow Cap at 75%', 'Appendix VI, Section E.3', 'MIN(Inflows, Outflows × 75%)', 0.75, 'Total inflows capped at 75% of outflows.', '12 CFR 249.33(d)', 'Ensures minimum 25% liquidity buffer');

-- NSFR ASF
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('NSFR_ASF_EQUITY', 'NSFR_ASF', 'ASF - Regulatory Capital', 'Appendix VII, Section A.1', 'Capital × 100% ASF', 1.00, 'Total regulatory capital qualifies for full ASF.', '12 CFR 249.103(a)', 'Common equity, preferred stock, Tier 2'),
('NSFR_ASF_RETAIL_STABLE', 'NSFR_ASF', 'ASF - Stable Retail Deposits', 'Appendix VII, Section A.2', 'Deposits × 95% ASF', 0.95, 'Retail deposits meeting stable criteria.', '12 CFR 249.103(b)(1)', 'FDIC-insured established relationships'),
('NSFR_ASF_RETAIL_LESS_STABLE', 'NSFR_ASF', 'ASF - Less Stable Retail', 'Appendix VII, Section A.3', 'Deposits × 90% ASF', 0.90, 'Retail deposits not stable.', '12 CFR 249.103(b)(2)', 'High-rate accounts, brokered'),
('NSFR_ASF_WHOLESALE_OPERATIONAL', 'NSFR_ASF', 'ASF - Wholesale Operational', 'Appendix VII, Section A.4', 'Deposits × 50% ASF', 0.50, 'Operational deposits from wholesale.', '12 CFR 249.103(c)(1)', 'Clearing, custody deposits'),
('NSFR_ASF_WHOLESALE_GT1Y', 'NSFR_ASF', 'ASF - Wholesale > 1 Year', 'Appendix VII, Section A.5', 'Funding × 100% ASF', 1.00, 'Wholesale funding maturing > 1 year.', '12 CFR 249.103(c)(2)', 'Long-term debt, term deposits');

-- NSFR RSF
INSERT INTO lcr_calculation_rules (rule_code, rule_category, rule_name, fr2052a_appendix_reference, calculation_formula, factor_applied, rule_description, regulatory_citation, examples) VALUES
('NSFR_RSF_CASH', 'NSFR_RSF', 'RSF - Cash and CB Reserves', 'Appendix VII, Section B.1', 'Amount × 0% RSF', 0.00, 'Cash and central bank reserves require no RSF.', '12 CFR 249.105(a)(1)', 'Cash, Federal Reserve deposits'),
('NSFR_RSF_HQLA_L1', 'NSFR_RSF', 'RSF - Level 1 HQLA', 'Appendix VII, Section B.2', 'Amount × 5% RSF', 0.05, 'Level 1 assets require minimal RSF.', '12 CFR 249.105(a)(2)', 'U.S. Treasuries, 0% risk weight sovereigns'),
('NSFR_RSF_HQLA_L2A', 'NSFR_RSF', 'RSF - Level 2A HQLA', 'Appendix VII, Section B.3', 'Amount × 15% RSF', 0.15, 'Level 2A assets require low RSF.', '12 CFR 249.105(a)(3)', 'GSE securities, qualifying sovereign'),
('NSFR_RSF_LOANS_MORTGAGE', 'NSFR_RSF', 'RSF - Residential Mortgages', 'Appendix VII, Section B.4', 'Amount × 65% RSF', 0.65, 'Performing residential mortgages.', '12 CFR 249.105(b)(1)', 'Conforming mortgages, home equity'),
('NSFR_RSF_LOANS_CORPORATE', 'NSFR_RSF', 'RSF - Corporate Loans', 'Appendix VII, Section B.5', 'Amount × 85% RSF', 0.85, 'Performing corporate and wholesale loans.', '12 CFR 249.105(b)(2)', 'Commercial loans, CRE, C&I'),
('NSFR_RSF_LOANS_FINANCIAL', 'NSFR_RSF', 'RSF - Financial Institution Loans', 'Appendix VII, Section B.6', 'Amount × 85-100% RSF', 0.85, 'Performing loans to financial institutions.', '12 CFR 249.105(b)(3)', 'Interbank loans, broker-dealer'),
('NSFR_RSF_SECURITIES_EQUITY', 'NSFR_RSF', 'RSF - Equity Securities', 'Appendix VII, Section B.7', 'Amount × 85% RSF', 0.85, 'Listed equities not in HQLA.', '12 CFR 249.105(c)', 'Non-index equity, private equity');

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_lcr_rules_category ON lcr_calculation_rules(rule_category);
CREATE INDEX IF NOT EXISTS idx_lcr_rules_code ON lcr_calculation_rules(rule_code);
