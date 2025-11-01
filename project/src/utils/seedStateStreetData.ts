import { supabase } from '../lib/supabase';

export async function seedDashboardData(userId: string) {
  const accountsData = [
    {
      user_id: userId,
      name: 'Operating Account',
      account_type: 'checking',
      currency: 'USD',
      current_balance: 2450000,
      institution: 'State Street Bank',
      is_active: true
    },
    {
      user_id: userId,
      name: 'Money Market Fund',
      account_type: 'savings',
      currency: 'USD',
      current_balance: 5800000,
      institution: 'State Street Global Advisors',
      is_active: true
    },
    {
      user_id: userId,
      name: 'Investment Portfolio',
      account_type: 'investment',
      currency: 'USD',
      current_balance: 12500000,
      institution: 'State Street Investments',
      is_active: true
    },
    {
      user_id: userId,
      name: 'Credit Facility',
      account_type: 'credit',
      currency: 'USD',
      current_balance: -1200000,
      institution: 'State Street Bank',
      is_active: true
    }
  ];

  const transactionsData = [
    {
      user_id: userId,
      transaction_date: '2024-10-28',
      description: 'Client Service Fees',
      amount: 850000,
      transaction_type: 'credit',
      category: 'Revenue'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-27',
      description: 'Operational Expenses',
      amount: -125000,
      transaction_type: 'debit',
      category: 'Operations'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-26',
      description: 'Securities Trading Revenue',
      amount: 420000,
      transaction_type: 'credit',
      category: 'Trading'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-25',
      description: 'Custody Fees',
      amount: 680000,
      transaction_type: 'credit',
      category: 'Revenue'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-24',
      description: 'Technology Infrastructure',
      amount: -95000,
      transaction_type: 'debit',
      category: 'Technology'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-23',
      description: 'Management Fees',
      amount: 540000,
      transaction_type: 'credit',
      category: 'Revenue'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-22',
      description: 'Compensation & Benefits',
      amount: -320000,
      transaction_type: 'debit',
      category: 'Personnel'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-21',
      description: 'FX Trading Revenue',
      amount: 285000,
      transaction_type: 'credit',
      category: 'Trading'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-20',
      description: 'Regulatory Compliance',
      amount: -68000,
      transaction_type: 'debit',
      category: 'Compliance'
    },
    {
      user_id: userId,
      transaction_date: '2024-10-19',
      description: 'Investment Advisory Fees',
      amount: 735000,
      transaction_type: 'credit',
      category: 'Revenue'
    }
  ];

  try {
    const accountsInsert = await supabase.from('accounts').insert(accountsData).select();

    if (accountsInsert.error) {
      console.error('Error inserting accounts:', accountsInsert.error);
      return { success: false, error: accountsInsert.error };
    }

    const accountIds = accountsInsert.data.map((acc: any) => acc.id);
    const transactionsWithAccounts = transactionsData.map((txn, idx) => ({
      ...txn,
      account_id: accountIds[idx % accountIds.length]
    }));

    const transactionsInsert = await supabase.from('transactions').insert(transactionsWithAccounts);

    if (transactionsInsert.error) {
      console.error('Error inserting transactions:', transactionsInsert.error);
      return { success: false, error: transactionsInsert.error };
    }

    return { success: true, message: 'Dashboard data seeded successfully' };
  } catch (error) {
    console.error('Error seeding dashboard data:', error);
    return { success: false, error };
  }
}

export async function seedStateStreetData(userId: string) {
  const lcrData = [
    {
      user_id: userId,
      report_date: '2024-09-30',
      hqla_level_1: 54800000000,
      hqla_level_2a: 6117647059,
      hqla_level_2b: 0,
      total_hqla: 59000000000,
      total_net_cash_outflows: 52900000000,
      lcr_ratio: 1.115,
      is_compliant: true,
      notes: 'Q3 2024 - State Street Corporation LCR'
    },
    {
      user_id: userId,
      report_date: '2024-06-30',
      hqla_level_1: 53200000000,
      hqla_level_2a: 5882352941,
      hqla_level_2b: 0,
      total_hqla: 58200000000,
      total_net_cash_outflows: 51800000000,
      lcr_ratio: 1.124,
      is_compliant: true,
      notes: 'Q2 2024 - State Street Corporation LCR'
    },
    {
      user_id: userId,
      report_date: '2024-03-31',
      hqla_level_1: 52100000000,
      hqla_level_2a: 5764705882,
      hqla_level_2b: 0,
      total_hqla: 57000000000,
      total_net_cash_outflows: 50500000000,
      lcr_ratio: 1.129,
      is_compliant: true,
      notes: 'Q1 2024 - State Street Corporation LCR'
    }
  ];

  const nsfrData = [
    {
      user_id: userId,
      report_date: '2024-09-30',
      available_stable_funding: 198500000000,
      required_stable_funding: 160100000000,
      nsfr_ratio: 1.240,
      is_compliant: true,
      retail_deposits: 154200000000,
      wholesale_funding: 32800000000,
      notes: 'Q3 2024 - State Street Corporation NSFR'
    },
    {
      user_id: userId,
      report_date: '2024-06-30',
      available_stable_funding: 195800000000,
      required_stable_funding: 158900000000,
      nsfr_ratio: 1.232,
      is_compliant: true,
      retail_deposits: 151600000000,
      wholesale_funding: 32100000000,
      notes: 'Q2 2024 - State Street Corporation NSFR'
    },
    {
      user_id: userId,
      report_date: '2024-03-31',
      available_stable_funding: 193200000000,
      required_stable_funding: 157200000000,
      nsfr_ratio: 1.229,
      is_compliant: true,
      retail_deposits: 149800000000,
      wholesale_funding: 31900000000,
      notes: 'Q1 2024 - State Street Corporation NSFR'
    }
  ];

  const balanceSheetData = [
    {
      user_id: userId,
      report_date: '2024-09-30',
      total_assets: 305800000000,
      total_liabilities: 278200000000,
      total_equity: 27600000000,
      cash_and_due_from_banks: 45200000000,
      securities_available_for_sale: 98500000000,
      securities_held_to_maturity: 12300000000,
      loans_gross: 42100000000,
      allowance_for_loan_losses: -350000000,
      deposits_total: 254800000000,
      deposits_noninterest_bearing: 98200000000,
      deposits_interest_bearing: 156600000000,
      short_term_borrowings: 8200000000,
      long_term_debt: 15200000000,
      tier1_capital: 22400000000,
      total_risk_weighted_assets: 162300000000,
      tier1_capital_ratio: 0.138,
      leverage_ratio: 0.072,
      notes: 'Q3 2024 - State Street Corporation Balance Sheet'
    },
    {
      user_id: userId,
      report_date: '2024-06-30',
      total_assets: 302100000000,
      total_liabilities: 275200000000,
      total_equity: 26900000000,
      cash_and_due_from_banks: 44100000000,
      securities_available_for_sale: 96800000000,
      securities_held_to_maturity: 12100000000,
      loans_gross: 41500000000,
      allowance_for_loan_losses: -340000000,
      deposits_total: 251200000000,
      deposits_noninterest_bearing: 96800000000,
      deposits_interest_bearing: 154400000000,
      short_term_borrowings: 8500000000,
      long_term_debt: 15500000000,
      tier1_capital: 22100000000,
      total_risk_weighted_assets: 160800000000,
      tier1_capital_ratio: 0.137,
      leverage_ratio: 0.073,
      notes: 'Q2 2024 - State Street Corporation Balance Sheet'
    }
  ];

  const interestRateRiskData = [
    {
      user_id: userId,
      report_date: '2024-09-30',
      scenario_type: '+200bp Parallel Shift',
      nii_current: 5200000000,
      nii_scenario: 5626400000,
      nii_change_amount: 426400000,
      nii_change_percent: 0.082,
      eve_current: 27600000000,
      eve_scenario: 26496000000,
      eve_change_amount: -1104000000,
      eve_change_percent: -0.040,
      duration_gap: 0.35,
      notes: 'Q3 2024 - Asset sensitive position'
    },
    {
      user_id: userId,
      report_date: '2024-09-30',
      scenario_type: '+100bp Parallel Shift',
      nii_current: 5200000000,
      nii_scenario: 5408000000,
      nii_change_amount: 208000000,
      nii_change_percent: 0.040,
      eve_current: 27600000000,
      eve_scenario: 27048000000,
      eve_change_amount: -552000000,
      eve_change_percent: -0.020,
      duration_gap: 0.35,
      notes: 'Q3 2024 - Moderate rate increase'
    },
    {
      user_id: userId,
      report_date: '2024-09-30',
      scenario_type: '-100bp Parallel Shift',
      nii_current: 5200000000,
      nii_scenario: 4992000000,
      nii_change_amount: -208000000,
      nii_change_percent: -0.040,
      eve_current: 27600000000,
      eve_scenario: 28152000000,
      eve_change_amount: 552000000,
      eve_change_percent: 0.020,
      duration_gap: 0.35,
      notes: 'Q3 2024 - Rate decrease scenario'
    }
  ];

  const resolutionData = [
    {
      user_id: userId,
      report_date: '2024-09-30',
      total_loss_absorbing_capacity: 35200000000,
      tlac_ratio: 0.217,
      qualified_ltd: 12800000000,
      operational_deposit_capacity: 98200000000,
      resolution_liquidity_requirement: 45000000000,
      resolution_liquidity_available: 59000000000,
      critical_operations_count: 8,
      material_entities_count: 12,
      cross_border_exposures: 156800000000,
      is_resolution_ready: true,
      notes: 'Q3 2024 - Resolution Planning Metrics'
    }
  ];

  const regKData = [
    {
      user_id: userId,
      report_date: '2024-09-30',
      total_foreign_exposures: 156800000000,
      country_risk_rating: 'Investment Grade',
      cross_currency_funding_gap: 12300000000,
      foreign_office_assets: 142500000000,
      foreign_office_liabilities: 130200000000,
      fx_swap_notional: 85600000000,
      net_stable_funding_ratio_foreign: 1.185,
      notes: 'Q3 2024 - Significant operations in UK, Europe, APAC'
    }
  ];

  const resolutionLiquidityData = [
    {
      user_id: userId,
      report_date: '2024-09-30',
      rcap_amount: 28400000000,
      rcap_ratio: 1.175,
      rcap_requirement: 24200000000,
      rcap_surplus_deficit: 4200000000,
      rcen_amount: 18500000000,
      rcen_ratio: 1.085,
      rcen_requirement: 17050000000,
      rlap_amount: 62800000000,
      rlap_ratio: 1.256,
      rlap_requirement: 50000000000,
      rlap_surplus_deficit: 12800000000,
      rlen_amount: 38200000000,
      rlen_ratio: 1.146,
      rlen_requirement: 33350000000,
      resolution_strategy: 'Single Point of Entry (SPE)',
      material_entities_count: 12,
      is_compliant: true,
      notes: 'Q3 2024 - All resolution metrics exceed minimum thresholds'
    },
    {
      user_id: userId,
      report_date: '2024-06-30',
      rcap_amount: 27800000000,
      rcap_ratio: 1.165,
      rcap_requirement: 23850000000,
      rcap_surplus_deficit: 3950000000,
      rcen_amount: 18100000000,
      rcen_ratio: 1.075,
      rcen_requirement: 16840000000,
      rlap_amount: 61500000000,
      rlap_ratio: 1.242,
      rlap_requirement: 49500000000,
      rlap_surplus_deficit: 12000000000,
      rlen_amount: 37600000000,
      rlen_ratio: 1.138,
      rlen_requirement: 33050000000,
      resolution_strategy: 'Single Point of Entry (SPE)',
      material_entities_count: 12,
      is_compliant: true,
      notes: 'Q2 2024 - Resolution readiness maintained'
    }
  ];

  const stressTestData = [
    {
      user_id: userId,
      report_date: '2024-09-30',
      scenario_name: 'Severe Market Stress - 30 Day',
      scenario_type: '30_day_short_term',
      baseline_liquidity: 59000000000,
      baseline_hqla: 59000000000,
      baseline_deposits: 254800000000,
      stressed_liquidity: 42800000000,
      stressed_cash_inflows: 8500000000,
      stressed_cash_outflows: 24700000000,
      stressed_net_cash_flow: -16200000000,
      liquidity_shortfall: 0,
      survival_days: 30,
      stress_severity: 'Severe',
      deposit_runoff_rate: 0.15,
      wholesale_funding_rollover_rate: 0.25,
      credit_line_drawdown_rate: 0.35,
      asset_liquidation_haircut: 0.12,
      passes_internal_threshold: true,
      min_liquidity_buffer_maintained: true,
      notes: '30-day severe stress - passes all internal thresholds with adequate buffer'
    },
    {
      user_id: userId,
      report_date: '2024-09-30',
      scenario_name: 'Baseline Adverse - 30 Day',
      scenario_type: '30_day_short_term',
      baseline_liquidity: 59000000000,
      baseline_hqla: 59000000000,
      baseline_deposits: 254800000000,
      stressed_liquidity: 48200000000,
      stressed_cash_inflows: 12400000000,
      stressed_cash_outflows: 23200000000,
      stressed_net_cash_flow: -10800000000,
      liquidity_shortfall: 0,
      survival_days: 30,
      stress_severity: 'Moderate',
      deposit_runoff_rate: 0.08,
      wholesale_funding_rollover_rate: 0.15,
      credit_line_drawdown_rate: 0.20,
      asset_liquidation_haircut: 0.08,
      passes_internal_threshold: true,
      min_liquidity_buffer_maintained: true,
      notes: '30-day baseline adverse - comfortable liquidity position maintained'
    },
    {
      user_id: userId,
      report_date: '2024-09-30',
      scenario_name: 'Extended Crisis - 1 Year',
      scenario_type: '1_year_extended',
      baseline_liquidity: 59000000000,
      baseline_hqla: 59000000000,
      baseline_deposits: 254800000000,
      stressed_liquidity: 38500000000,
      stressed_cash_inflows: 45200000000,
      stressed_cash_outflows: 65700000000,
      stressed_net_cash_flow: -20500000000,
      liquidity_shortfall: 0,
      survival_days: 365,
      stress_severity: 'Severe',
      deposit_runoff_rate: 0.25,
      wholesale_funding_rollover_rate: 0.50,
      credit_line_drawdown_rate: 0.60,
      asset_liquidation_haircut: 0.20,
      passes_internal_threshold: true,
      min_liquidity_buffer_maintained: true,
      notes: '1-year extended crisis - survives full year with liquidity buffer intact'
    },
    {
      user_id: userId,
      report_date: '2024-09-30',
      scenario_name: 'Idiosyncratic Stress - 1 Year',
      scenario_type: '1_year_extended',
      baseline_liquidity: 59000000000,
      baseline_hqla: 59000000000,
      baseline_deposits: 254800000000,
      stressed_liquidity: 44200000000,
      stressed_cash_inflows: 52800000000,
      stressed_cash_outflows: 67600000000,
      stressed_net_cash_flow: -14800000000,
      liquidity_shortfall: 0,
      survival_days: 365,
      stress_severity: 'Moderate',
      deposit_runoff_rate: 0.18,
      wholesale_funding_rollover_rate: 0.35,
      credit_line_drawdown_rate: 0.45,
      asset_liquidation_haircut: 0.15,
      passes_internal_threshold: true,
      min_liquidity_buffer_maintained: true,
      notes: '1-year idiosyncratic stress - maintains adequate liquidity throughout period'
    }
  ];

  try {
    const results = await Promise.all([
      supabase.from('lcr_metrics').insert(lcrData),
      supabase.from('nsfr_metrics').insert(nsfrData),
      supabase.from('balance_sheet_metrics').insert(balanceSheetData),
      supabase.from('interest_rate_risk_metrics').insert(interestRateRiskData),
      supabase.from('resolution_metrics').insert(resolutionData),
      supabase.from('reg_k_metrics').insert(regKData),
      supabase.from('resolution_liquidity_metrics').insert(resolutionLiquidityData),
      supabase.from('liquidity_stress_tests').insert(stressTestData)
    ]);

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors seeding data:', errors);
      return { success: false, errors };
    }

    return { success: true, message: 'State Street Corporation data seeded successfully' };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error };
  }
}
