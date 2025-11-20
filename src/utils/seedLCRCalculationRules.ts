import { supabase } from '../lib/supabase';

export async function seedLCRCalculationRules() {
  const rules = [
    {
      rule_code: 'HQLA_L1_CASH',
      rule_category: 'HQLA_Level_1',
      rule_name: 'Level 1 HQLA - Cash and Central Bank Reserves',
      fr2052a_appendix_reference: 'Appendix VI, Section A.1',
      product_categories: ['cash', 'central_bank_reserves'],
      counterparty_types: [],
      maturity_buckets: [],
      calculation_formula: 'Total Amount × 100% (no haircut, 100% liquidity value)',
      factor_applied: 1.0,
      rule_description: 'Cash, central bank reserves, and claims on central banks are Level 1 HQLA with no haircut and 100% liquidity value.',
      regulatory_citation: '12 CFR 249.20(a)',
      examples: 'Cash in vault, reserve balances at Federal Reserve, demand deposits at central banks'
    },
    {
      rule_code: 'HQLA_L1_SOVEREIGN',
      rule_category: 'HQLA_Level_1',
      rule_name: 'Level 1 HQLA - U.S. Treasury Securities',
      fr2052a_appendix_reference: 'Appendix VI, Section A.2',
      product_categories: ['securities'],
      counterparty_types: ['government'],
      maturity_buckets: [],
      calculation_formula: 'Total Amount × 100% (no haircut, 100% liquidity value)',
      factor_applied: 1.0,
      rule_description: 'Marketable securities representing claims on or guaranteed by U.S. government, U.S. government agencies.',
      regulatory_citation: '12 CFR 249.20(a)(1)',
      examples: 'U.S. Treasury bonds, bills, notes; GNMA securities'
    },
    {
      rule_code: 'HQLA_L2A_GSE',
      rule_category: 'HQLA_Level_2A',
      rule_name: 'Level 2A HQLA - GSE Securities',
      fr2052a_appendix_reference: 'Appendix VI, Section B.1',
      product_categories: ['securities'],
      counterparty_types: ['gse', 'government'],
      maturity_buckets: [],
      calculation_formula: 'Total Amount × 85% liquidity value (15% haircut)',
      factor_applied: 0.85,
      rule_description: 'Marketable securities issued or guaranteed by U.S. GSEs (Fannie Mae, Freddie Mac). Subject to 15% haircut, resulting in 85% liquidity value.',
      regulatory_citation: '12 CFR 249.20(b)(1)',
      examples: 'Fannie Mae MBS, Freddie Mac bonds, FHLB obligations'
    },
    {
      rule_code: 'HQLA_L2A_SOVEREIGN',
      rule_category: 'HQLA_Level_2A',
      rule_name: 'Level 2A HQLA - Qualifying Sovereign Securities',
      fr2052a_appendix_reference: 'Appendix VI, Section B.2',
      product_categories: ['securities'],
      counterparty_types: ['foreign_sovereign'],
      maturity_buckets: [],
      calculation_formula: 'Total Amount × 85% liquidity value (15% haircut)',
      factor_applied: 0.85,
      rule_description: 'Marketable securities issued or guaranteed by qualifying sovereigns with 20% risk weight. Subject to 15% haircut.',
      regulatory_citation: '12 CFR 249.20(b)(2)',
      examples: 'Investment-grade foreign government bonds (Canada, UK, Germany)'
    },
    {
      rule_code: 'HQLA_L2B_CORPORATE',
      rule_category: 'HQLA_Level_2B',
      rule_name: 'Level 2B HQLA - Investment Grade Corporate Debt',
      fr2052a_appendix_reference: 'Appendix VI, Section C.1',
      product_categories: ['securities'],
      counterparty_types: ['corporate'],
      maturity_buckets: [],
      calculation_formula: 'Total Amount × 50% liquidity value (50% haircut)',
      factor_applied: 0.50,
      rule_description: 'Investment-grade corporate debt securities with AA- or better rating. Subject to 50% haircut, resulting in 50% liquidity value.',
      regulatory_citation: '12 CFR 249.20(c)(1)',
      examples: 'AA-rated corporate bonds, highly-rated commercial paper'
    },
    {
      rule_code: 'OUTFLOW_RETAIL_STABLE',
      rule_category: 'Cash_Outflows_Retail',
      rule_name: 'Retail Deposit Outflow - Stable Deposits',
      fr2052a_appendix_reference: 'Appendix VI, Section D.1.a',
      product_categories: ['deposits'],
      counterparty_types: ['retail'],
      maturity_buckets: [],
      calculation_formula: 'Outstanding Balance × 3% runoff rate',
      factor_applied: 0.03,
      rule_description: 'Stable retail deposits (insured, established banking relationship) have 3% outflow rate.',
      regulatory_citation: '12 CFR 249.32(a)(1)',
      examples: 'Insured checking accounts, insured savings accounts with established customers'
    },
    {
      rule_code: 'OUTFLOW_RETAIL_LESS_STABLE',
      rule_category: 'Cash_Outflows_Retail',
      rule_name: 'Retail Deposit Outflow - Less Stable Deposits',
      fr2052a_appendix_reference: 'Appendix VI, Section D.1.b',
      product_categories: ['deposits'],
      counterparty_types: ['retail'],
      maturity_buckets: [],
      calculation_formula: 'Outstanding Balance × 10% runoff rate',
      factor_applied: 0.10,
      rule_description: 'Less stable retail deposits (uninsured or brokered) have 10% outflow rate.',
      regulatory_citation: '12 CFR 249.32(a)(2)',
      examples: 'Uninsured deposits, brokered deposits, deposits from new customers'
    },
    {
      rule_code: 'OUTFLOW_WHOLESALE_UNSECURED_OPERATIONAL',
      rule_category: 'Cash_Outflows_Wholesale',
      rule_name: 'Wholesale Funding - Operational Deposits',
      fr2052a_appendix_reference: 'Appendix VI, Section D.2.a',
      product_categories: ['deposits'],
      counterparty_types: ['wholesale', 'financial_institution'],
      maturity_buckets: [],
      calculation_formula: 'Outstanding Balance × 25% runoff rate',
      factor_applied: 0.25,
      rule_description: 'Operational deposits from non-financial wholesale customers have 25% outflow rate.',
      regulatory_citation: '12 CFR 249.32(b)(1)',
      examples: 'Corporate operating accounts, clearing accounts, cash management services'
    },
    {
      rule_code: 'OUTFLOW_WHOLESALE_UNSECURED_NONOPERATIONAL',
      rule_category: 'Cash_Outflows_Wholesale',
      rule_name: 'Wholesale Funding - Non-Operational Deposits',
      fr2052a_appendix_reference: 'Appendix VI, Section D.2.b',
      product_categories: ['deposits'],
      counterparty_types: ['wholesale', 'financial_institution'],
      maturity_buckets: [],
      calculation_formula: 'Outstanding Balance × 40% runoff rate',
      factor_applied: 0.40,
      rule_description: 'Non-operational wholesale deposits have 40% outflow rate.',
      regulatory_citation: '12 CFR 249.32(b)(2)',
      examples: 'Wholesale time deposits, non-operating corporate deposits'
    },
    {
      rule_code: 'OUTFLOW_WHOLESALE_UNSECURED_NONFINANCIAL_100',
      rule_category: 'Cash_Outflows_Wholesale',
      rule_name: 'Wholesale Funding - Unsecured from Financial Institutions',
      fr2052a_appendix_reference: 'Appendix VI, Section D.2.c',
      product_categories: ['deposits'],
      counterparty_types: ['financial_institution'],
      maturity_buckets: [],
      calculation_formula: 'Outstanding Balance × 100% runoff rate',
      factor_applied: 1.00,
      rule_description: 'Unsecured wholesale funding from financial institutions has 100% outflow rate.',
      regulatory_citation: '12 CFR 249.32(b)(3)',
      examples: 'Interbank deposits, funding from other banks, federal funds purchased'
    },
    {
      rule_code: 'OUTFLOW_SECURED_FUNDING',
      rule_category: 'Cash_Outflows_Secured',
      rule_name: 'Secured Funding Transactions',
      fr2052a_appendix_reference: 'Appendix VI, Section D.3',
      product_categories: ['secured_funding', 'repo'],
      counterparty_types: [],
      maturity_buckets: ['overnight', '2-7days', '8-30days'],
      calculation_formula: 'Outstanding Balance - Collateral Value × (1 - HQLA Haircut)',
      factor_applied: null,
      rule_description: 'Secured funding outflows based on maturity and collateral quality. HQLA collateral receives reduced outflow.',
      regulatory_citation: '12 CFR 249.32(c)',
      examples: 'Repos, securities lending with Level 1 or Level 2 HQLA collateral'
    },
    {
      rule_code: 'OUTFLOW_DERIVATIVES',
      rule_category: 'Cash_Outflows_Derivatives',
      rule_name: 'Derivative Collateral Outflows',
      fr2052a_appendix_reference: 'Appendix VI, Section D.4',
      product_categories: ['derivatives'],
      counterparty_types: [],
      maturity_buckets: [],
      calculation_formula: 'Projected collateral outflow based on adverse market movements',
      factor_applied: null,
      rule_description: 'Additional collateral that would be required for derivative positions under adverse market scenarios.',
      regulatory_citation: '12 CFR 249.32(d)',
      examples: 'Variation margin on interest rate swaps, FX forwards, credit derivatives'
    },
    {
      rule_code: 'OUTFLOW_CREDIT_LIQUIDITY_FACILITIES',
      rule_category: 'Cash_Outflows_Contingent',
      rule_name: 'Credit and Liquidity Facility Drawdowns',
      fr2052a_appendix_reference: 'Appendix VI, Section D.5',
      product_categories: ['credit_facilities', 'liquidity_facilities'],
      counterparty_types: [],
      maturity_buckets: [],
      calculation_formula: 'Committed Amount × 5% drawdown rate (or higher for certain facilities)',
      factor_applied: 0.05,
      rule_description: 'Contingent funding obligations from committed credit and liquidity facilities.',
      regulatory_citation: '12 CFR 249.32(e)',
      examples: 'Undrawn credit lines, standby letters of credit, liquidity facilities to SPVs'
    },
    {
      rule_code: 'INFLOW_LOANS_MATURING',
      rule_category: 'Cash_Inflows_Contractual',
      rule_name: 'Maturing Loans and Securities',
      fr2052a_appendix_reference: 'Appendix VI, Section E.1',
      product_categories: ['loans', 'securities'],
      counterparty_types: [],
      maturity_buckets: ['overnight', '2-7days', '8-30days'],
      calculation_formula: 'Contractual Cash Inflow × 50% inflow rate',
      factor_applied: 0.50,
      rule_description: 'Loans and securities maturing within 30 days receive 50% inflow recognition (except reverse repos with central banks).',
      regulatory_citation: '12 CFR 249.33(b)',
      examples: 'Maturing consumer loans, corporate loans, bonds maturing in 30 days'
    },
    {
      rule_code: 'INFLOW_REVERSE_REPO_CENTRAL_BANK',
      rule_category: 'Cash_Inflows_Contractual',
      rule_name: 'Reverse Repos with Central Banks',
      fr2052a_appendix_reference: 'Appendix VI, Section E.2',
      product_categories: ['reverse_repo'],
      counterparty_types: ['central_bank'],
      maturity_buckets: ['overnight', '2-7days', '8-30days'],
      calculation_formula: 'Contractual Cash Inflow × 100% inflow rate',
      factor_applied: 1.00,
      rule_description: 'Reverse repos with central banks receive 100% inflow recognition.',
      regulatory_citation: '12 CFR 249.33(a)',
      examples: 'Reverse repos with Federal Reserve'
    },
    {
      rule_code: 'INFLOW_CAP_75PCT',
      rule_category: 'Cash_Inflows_Cap',
      rule_name: 'Inflow Cap at 75% of Outflows',
      fr2052a_appendix_reference: 'Appendix VI, Section E.3',
      product_categories: [],
      counterparty_types: [],
      maturity_buckets: [],
      calculation_formula: 'Min(Total Inflows, Total Outflows × 75%)',
      factor_applied: 0.75,
      rule_description: 'Total cash inflows are capped at 75% of total cash outflows to ensure minimum net cash outflow.',
      regulatory_citation: '12 CFR 249.30(c)',
      examples: 'If outflows = $100M, inflows capped at $75M'
    }
  ];

  console.log('Seeding LCR calculation rules...');

  for (const rule of rules) {
    const { error } = await supabase
      .from('lcr_calculation_rules')
      .upsert(rule, { onConflict: 'rule_code' });

    if (error) {
      console.error(`Error seeding rule ${rule.rule_code}:`, error);
    } else {
      console.log(`✓ Seeded rule: ${rule.rule_code}`);
    }
  }

  console.log('LCR calculation rules seeding complete!');
}
