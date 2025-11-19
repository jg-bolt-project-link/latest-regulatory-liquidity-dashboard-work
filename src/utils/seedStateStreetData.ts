import { supabase } from '../lib/supabase';

export async function seedLegalEntities() {
  const legalEntitiesData = [
    {
      user_id: null,
      entity_code: 'SSC',
      entity_name: 'State Street Corporation',
      entity_type: 'parent',
      jurisdiction: 'United States (MA)',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Parent Holding Company'],
      description: 'Top-tier bank holding company'
    },
    {
      user_id: null,
      entity_code: 'SSBT',
      entity_name: 'State Street Bank and Trust Company',
      entity_type: 'subsidiary',
      jurisdiction: 'United States (MA)',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Global Custody', 'Investment Servicing', 'Investment Management'],
      description: 'Principal banking subsidiary providing custody and investment servicing'
    },
    {
      user_id: null,
      entity_code: 'SSIF',
      entity_name: 'State Street Intermediate Funding LLC',
      entity_type: 'funding_entity',
      jurisdiction: 'United States (DE)',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Internal Funding'],
      description: 'Intermediate funding entity for capital and liquidity distribution'
    },
    {
      user_id: null,
      entity_code: 'SSIH',
      entity_name: 'State Street International Holdings',
      entity_type: 'material_entity',
      jurisdiction: 'United States (MA)',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Global Custody'],
      description: 'Edge corporation holding international subsidiaries'
    },
    {
      user_id: null,
      entity_code: 'SSTCC',
      entity_name: 'State Street Trust Company Canada',
      entity_type: 'material_entity',
      jurisdiction: 'Canada',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Global Custody'],
      description: 'Canadian trust company for custody services'
    },
    {
      user_id: null,
      entity_code: 'SSGA',
      entity_name: 'State Street Global Advisors',
      entity_type: 'material_entity',
      jurisdiction: 'United States (MA)',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Investment Management'],
      description: 'Investment management division'
    },
    {
      user_id: null,
      entity_code: 'SSBEL',
      entity_name: 'State Street Bank Europe Limited',
      entity_type: 'material_entity',
      jurisdiction: 'Ireland',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Global Custody', 'Investment Servicing'],
      description: 'European banking operations'
    },
    {
      user_id: null,
      entity_code: 'SSLUX',
      entity_name: 'State Street Bank International GmbH',
      entity_type: 'material_entity',
      jurisdiction: 'Germany',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Global Custody'],
      description: 'German banking subsidiary'
    },
    {
      user_id: null,
      entity_code: 'SSAPAC',
      entity_name: 'State Street Australia Limited',
      entity_type: 'material_entity',
      jurisdiction: 'Australia',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Global Custody'],
      description: 'Asia-Pacific custody operations'
    },
    {
      user_id: null,
      entity_code: 'SSTZ',
      entity_name: 'State Street Technology (Zhejiang) Co. Ltd',
      entity_type: 'material_entity',
      jurisdiction: 'China',
      is_material_entity: true,
      parent_entity_id: null,
      core_business_lines: ['Technology Services'],
      description: 'IT development and technology services'
    }
  ];

  const { data: insertedEntities, error: entitiesError } = await supabase
    .from('legal_entities')
    .insert(legalEntitiesData)
    .select();

  if (entitiesError) {
    console.error('Error seeding legal entities:', entitiesError);
    console.error('Error details:', {
      code: entitiesError.code,
      message: entitiesError.message,
      details: entitiesError.details,
      hint: entitiesError.hint
    });
    throw new Error(`Failed to insert legal entities: ${entitiesError.message}`);
  }

  if (!insertedEntities || insertedEntities.length === 0) {
    throw new Error('No legal entities were inserted');
  }

  const entityMap: Record<string, string> = {};
  insertedEntities.forEach(entity => {
    entityMap[entity.entity_code] = entity.id;
  });

  console.log(`✓ Successfully inserted ${insertedEntities.length} legal entities`);
  return { entities: insertedEntities, entityMap };
}

export async function seedDataQualityData() {
  const dataFeedsData = [
    {
      user_id: null,
      feed_name: 'Core Banking System',
      feed_type: 'core_banking',
      source_system: 'State Street Core',
      status: 'active',
      last_successful_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      records_loaded: 2547891,
      error_count: 0,
      freshness_threshold_hours: 4,
      is_stale: false,
      connection_status: 'connected',
      notes: 'Primary source for account balances and transactions'
    },
    {
      user_id: null,
      feed_name: 'Treasury Management System',
      feed_type: 'treasury',
      source_system: 'TMS Pro',
      status: 'active',
      last_successful_run: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      last_run_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      records_loaded: 156432,
      error_count: 0,
      freshness_threshold_hours: 2,
      is_stale: false,
      connection_status: 'connected',
      notes: 'Cash positions and liquidity forecasts'
    },
    {
      user_id: null,
      feed_name: 'Market Data Feed',
      feed_type: 'market_data',
      source_system: 'Bloomberg',
      status: 'active',
      last_successful_run: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      last_run_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      records_loaded: 89234,
      error_count: 0,
      freshness_threshold_hours: 1,
      is_stale: false,
      connection_status: 'connected',
      notes: 'Real-time pricing and FX rates'
    },
    {
      user_id: null,
      feed_name: 'Regulatory Reporting',
      feed_type: 'regulatory',
      source_system: 'Federal Reserve',
      status: 'active',
      last_successful_run: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      last_run_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      records_loaded: 45678,
      error_count: 0,
      freshness_threshold_hours: 24,
      is_stale: false,
      connection_status: 'connected',
      notes: 'FR 2052a and other regulatory submissions'
    },
    {
      user_id: null,
      feed_name: 'Securities Reference Data',
      feed_type: 'market_data',
      source_system: 'DTCC',
      status: 'active',
      last_successful_run: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      last_run_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      records_loaded: 342109,
      error_count: 2,
      freshness_threshold_hours: 12,
      is_stale: false,
      connection_status: 'connected',
      notes: 'Securities master data and corporate actions'
    },
    {
      user_id: null,
      feed_name: 'Payment Systems',
      feed_type: 'core_banking',
      source_system: 'Fedwire/CHIPS',
      status: 'active',
      last_successful_run: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      last_run_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      records_loaded: 12456,
      error_count: 0,
      freshness_threshold_hours: 1,
      is_stale: false,
      connection_status: 'connected',
      notes: 'Intraday payment flows and settlement data'
    }
  ];

  const qualityChecksData = [
    {
      user_id: null,
      check_name: 'Balance Sheet Reconciliation',
      check_type: 'reconciliation',
      data_source: 'balance_sheet_metrics',
      status: 'passed',
      total_records: 12,
      passed_records: 12,
      failed_records: 0,
      execution_time_ms: 245,
      last_run_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: null,
      check_name: 'LCR HQLA Validation',
      check_type: 'input',
      data_source: 'lcr_metrics',
      status: 'passed',
      total_records: 8,
      passed_records: 8,
      failed_records: 0,
      execution_time_ms: 189,
      last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: null,
      check_name: 'NSFR Component Check',
      check_type: 'transformation',
      data_source: 'nsfr_metrics',
      status: 'passed',
      total_records: 8,
      passed_records: 8,
      failed_records: 0,
      execution_time_ms: 312,
      last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: null,
      check_name: 'Interest Rate Risk Data Quality',
      check_type: 'input',
      data_source: 'interest_rate_risk_metrics',
      status: 'passed',
      total_records: 48,
      passed_records: 48,
      failed_records: 0,
      execution_time_ms: 523,
      last_run_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: null,
      check_name: 'Resolution Liquidity Completeness',
      check_type: 'output',
      data_source: 'resolution_liquidity_metrics',
      status: 'passed',
      total_records: 8,
      passed_records: 8,
      failed_records: 0,
      execution_time_ms: 198,
      last_run_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: null,
      check_name: 'Stress Test Scenario Validation',
      check_type: 'transformation',
      data_source: 'liquidity_stress_tests',
      status: 'warning',
      total_records: 30,
      passed_records: 28,
      failed_records: 2,
      error_message: '2 scenarios missing severity classification',
      execution_time_ms: 445,
      last_run_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: null,
      check_name: 'Legal Entity Hierarchy',
      check_type: 'reconciliation',
      data_source: 'legal_entities',
      status: 'passed',
      total_records: 10,
      passed_records: 10,
      failed_records: 0,
      execution_time_ms: 134,
      last_run_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: null,
      check_name: 'Account Balance Cross-Check',
      check_type: 'reconciliation',
      data_source: 'accounts',
      status: 'passed',
      total_records: 4,
      passed_records: 4,
      failed_records: 0,
      execution_time_ms: 87,
      last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: null,
      check_name: 'Transaction Category Mapping',
      check_type: 'transformation',
      data_source: 'transactions',
      status: 'passed',
      total_records: 450,
      passed_records: 450,
      failed_records: 0,
      execution_time_ms: 678,
      last_run_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];

  const lineageData = [
    {
      user_id: null,
      source_system: 'Core Banking',
      source_table: 'accounts',
      source_column: 'current_balance',
      target_system: 'Analytics',
      target_table: 'balance_sheet_metrics',
      target_column: 'cash_and_due_from_banks',
      transformation_rule: 'SUM(current_balance) WHERE account_type IN (\'checking\', \'savings\')',
      transformation_type: 'aggregated',
      dependency_level: 1,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Core Banking',
      source_table: 'accounts',
      source_column: 'current_balance',
      target_system: 'Analytics',
      target_table: 'balance_sheet_metrics',
      target_column: 'total_assets',
      transformation_rule: 'SUM(current_balance) WHERE current_balance > 0',
      transformation_type: 'aggregated',
      dependency_level: 1,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Treasury Management',
      source_table: 'securities_holdings',
      source_column: 'market_value',
      target_system: 'Analytics',
      target_table: 'lcr_metrics',
      target_column: 'hqla_level_1',
      transformation_rule: 'SUM(market_value) WHERE security_type = \'US Treasury\' AND maturity <= 90',
      transformation_type: 'calculated',
      dependency_level: 1,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Analytics',
      source_table: 'lcr_metrics',
      source_column: 'total_hqla',
      target_system: 'Reporting',
      target_table: 'fr2052a_data',
      target_column: 'hqla_amount',
      transformation_rule: 'Direct mapping with date alignment',
      transformation_type: 'direct',
      dependency_level: 2,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Analytics',
      source_table: 'balance_sheet_metrics',
      source_column: 'tier1_capital',
      target_system: 'Analytics',
      target_table: 'resolution_liquidity_metrics',
      target_column: 'rcap_amount',
      transformation_rule: 'tier1_capital * stress_factor WHERE scenario = \'resolution\'',
      transformation_type: 'derived',
      dependency_level: 2,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Market Data',
      source_table: 'yield_curves',
      source_column: 'rate',
      target_system: 'Analytics',
      target_table: 'interest_rate_risk_metrics',
      target_column: 'eve_change_amount',
      transformation_rule: 'Apply shock scenarios to rate curve and revalue portfolio',
      transformation_type: 'calculated',
      dependency_level: 1,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Core Banking',
      source_table: 'deposits',
      source_column: 'balance',
      target_system: 'Analytics',
      target_table: 'nsfr_metrics',
      target_column: 'required_stable_funding',
      transformation_rule: 'Apply RSF factors based on deposit type and maturity',
      transformation_type: 'calculated',
      dependency_level: 1,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Payment Systems',
      source_table: 'fedwire_transactions',
      source_column: 'amount',
      target_system: 'Analytics',
      target_table: 'intraday_liquidity',
      target_column: 'peak_usage',
      transformation_rule: 'MAX(cumulative_debit_position) GROUP BY business_day',
      transformation_type: 'aggregated',
      dependency_level: 1,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Legal Entity Master',
      source_table: 'entity_structure',
      source_column: 'entity_id',
      target_system: 'Analytics',
      target_table: 'legal_entities',
      target_column: 'id',
      transformation_rule: 'Direct synchronization with enrichment',
      transformation_type: 'direct',
      dependency_level: 1,
      is_critical: true
    },
    {
      user_id: null,
      source_system: 'Analytics',
      source_table: 'lcr_metrics',
      source_column: 'lcr_ratio',
      target_system: 'Analytics',
      target_table: 'liquidity_stress_tests',
      target_column: 'baseline_liquidity',
      transformation_rule: 'Use current LCR as baseline for stress scenarios',
      transformation_type: 'derived',
      dependency_level: 2,
      is_critical: false
    }
  ];

  const { error: feedsError } = await supabase.from('data_feeds').insert(dataFeedsData);
  if (feedsError) console.error('Error seeding data feeds:', feedsError);

  const { error: checksError } = await supabase.from('data_quality_checks').insert(qualityChecksData);
  if (checksError) console.error('Error seeding quality checks:', checksError);

  const { error: lineageError } = await supabase.from('data_lineage').insert(lineageData);
  if (lineageError) console.error('Error seeding data lineage:', lineageError);

  console.log('Data quality data seeded:', dataFeedsData.length, 'feeds,', qualityChecksData.length, 'checks,', lineageData.length, 'lineage mappings');
}

export async function seedDashboardData() {
  const accountsData = [
    {
      user_id: null,
      name: 'Operating Account',
      account_type: 'checking',
      currency: 'USD',
      current_balance: 2450000,
      institution: 'State Street Bank',
      is_active: true
    },
    {
      user_id: null,
      name: 'Money Market Fund',
      account_type: 'savings',
      currency: 'USD',
      current_balance: 5800000,
      institution: 'State Street Global Advisors',
      is_active: true
    },
    {
      user_id: null,
      name: 'Investment Portfolio',
      account_type: 'investment',
      currency: 'USD',
      current_balance: 12500000,
      institution: 'State Street Investments',
      is_active: true
    },
    {
      user_id: null,
      name: 'Credit Facility',
      account_type: 'credit',
      currency: 'USD',
      current_balance: -1200000,
      institution: 'State Street Bank',
      is_active: true
    }
  ];

  const today = new Date();
  const transactionsData = [];

  for (let i = 0; i < 90; i++) {
    const txnDate = new Date(today);
    txnDate.setDate(txnDate.getDate() - i);
    const dateStr = txnDate.toISOString().split('T')[0];

    if (i % 3 === 0) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Client Service Fees',
        amount: 750000 + Math.random() * 200000,
        transaction_type: 'credit',
        category: 'Revenue'
      });
    }

    if (i % 2 === 0) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Operational Expenses',
        amount: -(80000 + Math.random() * 60000),
        transaction_type: 'debit',
        category: 'Operations'
      });
    }

    if (i % 4 === 0) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Securities Trading Revenue',
        amount: 300000 + Math.random() * 250000,
        transaction_type: 'credit',
        category: 'Trading'
      });
    }

    if (i % 5 === 0) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Custody Fees',
        amount: 600000 + Math.random() * 150000,
        transaction_type: 'credit',
        category: 'Revenue'
      });
    }

    if (i % 7 === 1) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Technology Infrastructure',
        amount: -(70000 + Math.random() * 40000),
        transaction_type: 'debit',
        category: 'Technology'
      });
    }

    if (i % 6 === 0) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Management Fees',
        amount: 450000 + Math.random() * 180000,
        transaction_type: 'credit',
        category: 'Revenue'
      });
    }

    if (i % 14 === 0) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Compensation & Benefits',
        amount: -(280000 + Math.random() * 80000),
        transaction_type: 'debit',
        category: 'Personnel'
      });
    }

    if (i % 5 === 2) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'FX Trading Revenue',
        amount: 200000 + Math.random() * 150000,
        transaction_type: 'credit',
        category: 'Trading'
      });
    }

    if (i % 10 === 0) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Regulatory Compliance',
        amount: -(50000 + Math.random() * 30000),
        transaction_type: 'debit',
        category: 'Compliance'
      });
    }

    if (i % 4 === 1) {
      transactionsData.push({
        user_id: null,
        transaction_date: dateStr,
        description: 'Investment Advisory Fees',
        amount: 650000 + Math.random() * 180000,
        transaction_type: 'credit',
        category: 'Revenue'
      });
    }
  }

  try {
    await supabase.from('transactions').delete().is('user_id', null);
    await supabase.from('accounts').delete().is('user_id', null);

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

    console.log('Inserting', transactionsWithAccounts.length, 'transactions');
    const transactionsInsert = await supabase.from('transactions').insert(transactionsWithAccounts);

    if (transactionsInsert.error) {
      console.error('Error inserting transactions:', transactionsInsert.error);
      return { success: false, error: transactionsInsert.error };
    }

    console.log('Successfully seeded', accountIds.length, 'accounts and', transactionsWithAccounts.length, 'transactions');
    return { success: true, message: 'Dashboard data seeded successfully' };
  } catch (error) {
    console.error('Error seeding dashboard data:', error);
    return { success: false, error };
  }
}

export async function seedStateStreetData() {
  try {
    console.log('Clearing existing data from tables...');
    // Use raw SQL for faster deletion with TRUNCATE on large tables
    const tablesToClear = [
      'fr2052a_data_rows',
      'lcr_metrics',
      'nsfr_metrics',
      'balance_sheet_metrics',
      'interest_rate_risk_metrics',
      'resolution_metrics',
      'reg_k_metrics',
      'resolution_liquidity_metrics',
      'liquidity_stress_tests',
      'data_lineage',
      'data_quality_checks',
      'data_feeds',
      'legal_entities'
    ];

    // Delete only system records (user_id is null)
    for (const table of tablesToClear) {
      try {
        await supabase.from(table).delete().is('user_id', null);
      } catch (err) {
        console.log(`Note: Could not clear ${table}, may not exist or be empty`);
      }
    }
    console.log('✓ Existing data cleared');
  } catch (error) {
    console.log('Note: Some tables may not exist yet or have no data to delete');
  }

  let entities, entityMap;
  try {
    const result = await seedLegalEntities();
    entities = result.entities;
    entityMap = result.entityMap;
    console.log('✓ Seeded legal entities:', entities.length);
  } catch (error) {
    console.error('❌ Failed to seed legal entities:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed legal entities'
    };
  }

  try {
    await seedDataQualityData();
    console.log('✓ Seeded data quality data');
  } catch (error) {
    console.error('❌ Failed to seed data quality data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed data quality data'
    };
  }

  const lcrData = [
    {
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
      report_date: '2024-12-31',
      total_assets: 310500000000,
      total_liabilities: 281700000000,
      total_equity: 28800000000,
      cash_and_due_from_banks: 46800000000,
      securities_available_for_sale: 101200000000,
      securities_held_to_maturity: 12700000000,
      loans_gross: 42900000000,
      allowance_for_loan_losses: -370000000,
      deposits_total: 258400000000,
      deposits_noninterest_bearing: 100100000000,
      deposits_interest_bearing: 158300000000,
      short_term_borrowings: 7900000000,
      long_term_debt: 15300000000,
      tier1_capital: 23200000000,
      total_risk_weighted_assets: 164500000000,
      tier1_capital_ratio: 0.141,
      leverage_ratio: 0.075,
      notes: 'Q4 2024 - State Street Corporation Balance Sheet'
    },
    {
      user_id: null,
      report_date: '2024-11-30',
      total_assets: 308200000000,
      total_liabilities: 280100000000,
      total_equity: 28100000000,
      cash_and_due_from_banks: 46200000000,
      securities_available_for_sale: 100100000000,
      securities_held_to_maturity: 12500000000,
      loans_gross: 42600000000,
      allowance_for_loan_losses: -360000000,
      deposits_total: 256900000000,
      deposits_noninterest_bearing: 99400000000,
      deposits_interest_bearing: 157500000000,
      short_term_borrowings: 8000000000,
      long_term_debt: 15200000000,
      tier1_capital: 22800000000,
      total_risk_weighted_assets: 163600000000,
      tier1_capital_ratio: 0.139,
      leverage_ratio: 0.074,
      notes: 'Nov 2024 - State Street Corporation Balance Sheet'
    },
    {
      user_id: null,
      report_date: '2024-10-31',
      total_assets: 307100000000,
      total_liabilities: 279200000000,
      total_equity: 27900000000,
      cash_and_due_from_banks: 45800000000,
      securities_available_for_sale: 99600000000,
      securities_held_to_maturity: 12400000000,
      loans_gross: 42400000000,
      allowance_for_loan_losses: -355000000,
      deposits_total: 255800000000,
      deposits_noninterest_bearing: 99000000000,
      deposits_interest_bearing: 156800000000,
      short_term_borrowings: 8100000000,
      long_term_debt: 15300000000,
      tier1_capital: 22600000000,
      total_risk_weighted_assets: 163100000000,
      tier1_capital_ratio: 0.139,
      leverage_ratio: 0.074,
      notes: 'Oct 2024 - State Street Corporation Balance Sheet'
    },
    {
      user_id: null,
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
      user_id: null,
      report_date: '2024-08-31',
      total_assets: 304200000000,
      total_liabilities: 276800000000,
      total_equity: 27400000000,
      cash_and_due_from_banks: 44800000000,
      securities_available_for_sale: 97900000000,
      securities_held_to_maturity: 12200000000,
      loans_gross: 41800000000,
      allowance_for_loan_losses: -345000000,
      deposits_total: 253400000000,
      deposits_noninterest_bearing: 97600000000,
      deposits_interest_bearing: 155800000000,
      short_term_borrowings: 8300000000,
      long_term_debt: 15100000000,
      tier1_capital: 22200000000,
      total_risk_weighted_assets: 161700000000,
      tier1_capital_ratio: 0.137,
      leverage_ratio: 0.073,
      notes: 'Aug 2024 - State Street Corporation Balance Sheet'
    },
    {
      user_id: null,
      report_date: '2024-07-31',
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
      notes: 'Jul 2024 - State Street Corporation Balance Sheet'
    }
  ];

  const interestRateRiskData = [
    {
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
      user_id: null,
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
