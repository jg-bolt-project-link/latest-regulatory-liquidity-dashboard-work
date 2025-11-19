import { supabase } from '../lib/supabase';
import { generateComprehensiveFR2052aData } from './generateFR2052aData';
import { FR2052aCalculationEngine } from './fr2052aCalculations';

export async function seedFR2052aWithCalculations(userId: string) {
  console.log('=== FR 2052a Data Generation Started ===');
  console.log(`User ID: ${userId}`);

  console.log('Step 0: Verifying tables exist...');

  // Test if tables exist by querying them
  const { error: fr2052aTestError } = await supabase
    .from('fr2052a_data_rows')
    .select('id')
    .limit(1);

  if (fr2052aTestError) {
    console.error('❌ ERROR: fr2052a_data_rows table not accessible:', fr2052aTestError);
    return { success: false, error: `Table fr2052a_data_rows error: ${fr2052aTestError.message}` };
  }
  console.log('✓ fr2052a_data_rows table exists');

  const { error: lcrTestError } = await supabase
    .from('fr2052a_lcr_metrics')
    .select('id')
    .limit(1);

  if (lcrTestError) {
    console.error('❌ ERROR: fr2052a_lcr_metrics table not accessible:', lcrTestError);
    return { success: false, error: `Table fr2052a_lcr_metrics error: ${lcrTestError.message}` };
  }
  console.log('✓ fr2052a_lcr_metrics table exists');

  const { error: nsfrTestError } = await supabase
    .from('fr2052a_nsfr_metrics')
    .select('id')
    .limit(1);

  if (nsfrTestError) {
    console.error('❌ ERROR: fr2052a_nsfr_metrics table not accessible:', nsfrTestError);
    return { success: false, error: `Table fr2052a_nsfr_metrics error: ${nsfrTestError.message}` };
  }
  console.log('✓ fr2052a_nsfr_metrics table exists');

  console.log('Step 1: Fetching legal entities...');
  const entities = await supabase
    .from('legal_entities')
    .select('id, entity_name')
    .eq('user_id', userId);

  if (entities.error) {
    console.error('ERROR fetching legal entities:', entities.error);
    return { success: false, error: entities.error.message };
  }

  if (!entities.data || entities.data.length === 0) {
    console.error('No legal entities found. Please create entities first.');
    return { success: false, error: 'No legal entities found' };
  }

  console.log(`✓ Found ${entities.data.length} legal entities:`, entities.data.map(e => e.entity_name));

  const reportDates = [
    '2024-12-31',
    '2024-11-30',
    '2024-10-31',
    '2024-09-30',
    '2024-08-31',
    '2024-07-31'
  ];

  const results = {
    totalRecords: 0,
    totalEntities: 0,
    totalPeriods: 0,
    lcrCalculations: [] as any[],
    nsfrCalculations: [] as any[]
  };

  for (const entity of entities.data) {
    console.log(`Processing entity: ${entity.entity_name}`);
    results.totalEntities++;

    for (const reportDate of reportDates) {
      console.log(`  Generating data for ${reportDate}...`);

      const fr2052aData = generateComprehensiveFR2052aData(reportDate, userId, entity.id);
      console.log(`  Generated ${fr2052aData.length} FR 2052a line items`);

      const dbRows = fr2052aData.map(item => ({
        user_id: userId,
        legal_entity_id: entity.id,
        report_date: reportDate,
        table_name: 'FR2052a',
        reporting_entity: entity.entity_name,
        product: item.productCategory,
        sub_product: item.subProduct || null,
        sub_product2: item.assetClass || null,
        counterparty: item.counterpartyType,
        maturity_bucket: item.maturityBucket,
        currency: item.currency,
        amount: item.outstandingBalance,
        market_value: item.outstandingBalance,
        fair_value: item.outstandingBalance,
        asset_class: item.assetClass || null,
        is_hqla: item.isHQLA,
        hqla_level: item.hqlaLevel || null,
        haircut_rate: item.haircut,
        runoff_rate: item.runoffRate || null,
        rsf_factor: item.requiredStableFundingFactor || null,
        asf_factor: item.availableStableFundingFactor || null,
        projected_inflow: item.projectedCashInflow,
        projected_outflow: item.projectedCashOutflow,
        encumbered_amount: item.encumberedAmount,
        internal_rating: item.internalRating || null
      }));

      console.log(`  Step 2a: Inserting ${dbRows.length} rows to database...`);
      const { error: insertError, data: insertedData } = await supabase
        .from('fr2052a_data_rows')
        .insert(dbRows)
        .select();

      if (insertError) {
        console.error(`  ❌ ERROR inserting FR 2052a data for ${reportDate}:`, insertError);
        console.error(`  Error code: ${insertError.code}, Details: ${insertError.details}`);
        console.error(`  Sample row being inserted:`, JSON.stringify(dbRows[0], null, 2));
        return { success: false, error: insertError.message };
      }

      console.log(`  ✓ Successfully inserted ${insertedData?.length || dbRows.length} rows`);
      results.totalRecords += dbRows.length;
      results.totalPeriods++;

      console.log(`  Step 2b: Calculating LCR and NSFR...`);
      const engine = new FR2052aCalculationEngine(fr2052aData);

      const lcrResult = engine.calculateLCR();
      console.log(`  ✓ LCR calculated: ${(lcrResult.lcrRatio * 100).toFixed(2)}%`);

      const nsfrResult = engine.calculateNSFR();
      console.log(`  ✓ NSFR calculated: ${(nsfrResult.nsfrRatio * 100).toFixed(2)}%`);

      const lcrData = {
        user_id: userId,
        legal_entity_id: entity.id,
        report_date: reportDate,
        lcr_ratio: lcrResult.lcrRatio,
        total_hqla: lcrResult.totalHQLA,
        level1_assets: lcrResult.level1Assets,
        level2a_assets: lcrResult.level2aAssets,
        level2b_assets: lcrResult.level2bAssets,
        total_cash_outflows: lcrResult.totalCashOutflows,
        total_cash_inflows: lcrResult.totalCashInflows,
        total_net_cash_outflows: lcrResult.netCashOutflows,
        hqla_excess_shortfall: lcrResult.totalHQLA - lcrResult.netCashOutflows,
        is_compliant: lcrResult.isCompliant,
        retail_deposit_outflows: lcrResult.details.retailDepositOutflows,
        wholesale_funding_outflows: lcrResult.details.wholesaleFundingOutflows,
        secured_funding_outflows: lcrResult.details.securedFundingOutflows,
        derivatives_outflows: lcrResult.details.derivativesOutflows,
        other_contractual_outflows: lcrResult.details.otherContractualOutflows,
        other_contingent_outflows: lcrResult.details.otherContingentOutflows,
        capped_inflows: lcrResult.details.cappedInflows,
        source_system: 'FR2052a',
        fr2052a_record_count: dbRows.length
      };

      console.log(`  Step 2c: Saving LCR metrics to fr2052a_lcr_metrics...`);
      const { error: lcrError, data: lcrInserted } = await supabase
        .from('fr2052a_lcr_metrics')
        .upsert(lcrData, {
          onConflict: 'user_id,legal_entity_id,report_date'
        })
        .select();

      if (lcrError) {
        console.error(`  ❌ ERROR saving FR2052a-dependent LCR metrics:`, lcrError);
        console.error(`  Error code: ${lcrError.code}, Details: ${lcrError.details}`);
        console.error(`  LCR Data being inserted:`, JSON.stringify(lcrData, null, 2));
        return { success: false, error: lcrError.message };
      }

      console.log(`  ✓ LCR metrics saved (${lcrInserted?.length || 1} record)`);
      results.lcrCalculations.push(lcrResult);

      const nsfrData = {
        user_id: userId,
        legal_entity_id: entity.id,
        report_date: reportDate,
        nsfr_ratio: nsfrResult.nsfrRatio,
        available_stable_funding: nsfrResult.availableStableFunding,
        required_stable_funding: nsfrResult.requiredStableFunding,
        asf_capital: nsfrResult.details.capitalASF,
        asf_retail_deposits: nsfrResult.details.retailDepositsASF,
        asf_wholesale_funding: nsfrResult.details.wholesaleFundingASF,
        asf_other_liabilities: nsfrResult.details.otherLiabilitiesASF,
        rsf_level1_assets: nsfrResult.details.level1AssetsRSF,
        rsf_level2a_assets: nsfrResult.details.level2aAssetsRSF,
        rsf_level2b_assets: nsfrResult.details.level2bAssetsRSF,
        rsf_loans: nsfrResult.details.loansRSF,
        rsf_other_assets: nsfrResult.details.otherAssetsRSF,
        asf_surplus_deficit: nsfrResult.availableStableFunding - nsfrResult.requiredStableFunding,
        is_compliant: nsfrResult.isCompliant,
        source_system: 'FR2052a',
        fr2052a_record_count: dbRows.length
      };

      console.log(`  Step 2d: Saving NSFR metrics to fr2052a_nsfr_metrics...`);
      const { error: nsfrError, data: nsfrInserted } = await supabase
        .from('fr2052a_nsfr_metrics')
        .upsert(nsfrData, {
          onConflict: 'user_id,legal_entity_id,report_date'
        })
        .select();

      if (nsfrError) {
        console.error(`  ❌ ERROR saving FR2052a-dependent NSFR metrics:`, nsfrError);
        console.error(`  Error code: ${nsfrError.code}, Details: ${nsfrError.details}`);
        console.error(`  NSFR Data being inserted:`, JSON.stringify(nsfrData, null, 2));
        return { success: false, error: nsfrError.message };
      }

      console.log(`  ✓ NSFR metrics saved (${nsfrInserted?.length || 1} record)`);
      results.nsfrCalculations.push(nsfrResult);
    }
  }

  console.log('\n=== FR 2052a Generation & Calculation Summary ===');
  console.log(`Total Entities Processed: ${results.totalEntities}`);
  console.log(`Total Periods Generated: ${results.totalPeriods}`);
  console.log(`Total FR 2052a Records: ${results.totalRecords}`);
  console.log(`LCR Calculations: ${results.lcrCalculations.length}`);
  console.log(`NSFR Calculations: ${results.nsfrCalculations.length}`);
  console.log('================================================\n');

  console.log('Step 3: Verifying data was saved to database...');
  const { count: fr2052aCount } = await supabase
    .from('fr2052a_data_rows')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: lcrCount } = await supabase
    .from('fr2052a_lcr_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: nsfrCount } = await supabase
    .from('fr2052a_nsfr_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log('\n=== Database Verification ===');
  console.log(`✓ FR 2052a rows in database: ${fr2052aCount || 0}`);
  console.log(`✓ LCR metrics in database: ${lcrCount || 0}`);
  console.log(`✓ NSFR metrics in database: ${nsfrCount || 0}`);
  console.log('============================\n');

  if (!fr2052aCount || fr2052aCount === 0) {
    console.error('❌ WARNING: No FR 2052a data found in database after generation!');
    return { success: false, error: 'Data generation failed - no records in database' };
  }

  if (!lcrCount || lcrCount === 0) {
    console.error('❌ WARNING: No LCR metrics found in database after generation!');
    return { success: false, error: 'LCR calculation failed - no records in database' };
  }

  if (!nsfrCount || nsfrCount === 0) {
    console.error('❌ WARNING: No NSFR metrics found in database after generation!');
    return { success: false, error: 'NSFR calculation failed - no records in database' };
  }

  console.log('✅ All data successfully generated and verified in database!');
  return { success: true, results };
}

export async function testCalculations() {
  console.log('\n=== Testing FR 2052a Calculations ===\n');

  const testData = generateComprehensiveFR2052aData('2024-12-31', 'test-user', 'test-entity');
  console.log(`Generated ${testData.length} test records (each $1M)`);

  const engine = new FR2052aCalculationEngine(testData);

  console.log('\n--- LCR Calculation ---');
  const lcr = engine.calculateLCR();
  console.log(`Total HQLA: $${(lcr.totalHQLA / 1e9).toFixed(2)}B`);
  console.log(`  Level 1: $${(lcr.level1Assets / 1e9).toFixed(2)}B`);
  console.log(`  Level 2A: $${(lcr.level2aAssets / 1e9).toFixed(2)}B`);
  console.log(`  Level 2B: $${(lcr.level2bAssets / 1e9).toFixed(2)}B`);
  console.log(`Total Cash Outflows: $${(lcr.totalCashOutflows / 1e9).toFixed(2)}B`);
  console.log(`Total Cash Inflows: $${(lcr.totalCashInflows / 1e9).toFixed(2)}B`);
  console.log(`Net Cash Outflows: $${(lcr.netCashOutflows / 1e9).toFixed(2)}B`);
  console.log(`LCR Ratio: ${(lcr.lcrRatio * 100).toFixed(2)}%`);
  console.log(`Compliant: ${lcr.isCompliant ? 'YES ✓' : 'NO ✗'}`);

  console.log('\n--- NSFR Calculation ---');
  const nsfr = engine.calculateNSFR();
  console.log(`Available Stable Funding: $${(nsfr.availableStableFunding / 1e9).toFixed(2)}B`);
  console.log(`  Capital: $${(nsfr.details.capitalASF / 1e9).toFixed(2)}B`);
  console.log(`  Retail Deposits: $${(nsfr.details.retailDepositsASF / 1e9).toFixed(2)}B`);
  console.log(`  Wholesale Funding: $${(nsfr.details.wholesaleFundingASF / 1e9).toFixed(2)}B`);
  console.log(`Required Stable Funding: $${(nsfr.requiredStableFunding / 1e9).toFixed(2)}B`);
  console.log(`  Level 1 Assets: $${(nsfr.details.level1AssetsRSF / 1e9).toFixed(2)}B`);
  console.log(`  Level 2A Assets: $${(nsfr.details.level2aAssetsRSF / 1e9).toFixed(2)}B`);
  console.log(`  Loans: $${(nsfr.details.loansRSF / 1e9).toFixed(2)}B`);
  console.log(`NSFR Ratio: ${(nsfr.nsfrRatio * 100).toFixed(2)}%`);
  console.log(`Compliant: ${nsfr.isCompliant ? 'YES ✓' : 'NO ✗'}`);

  console.log('\n--- Product Category Breakdown ---');
  const categories = new Set(testData.map(d => d.productCategory));
  categories.forEach(cat => {
    const catData = testData.filter(d => d.productCategory === cat);
    const totalAmount = catData.reduce((sum, d) => sum + d.outstandingBalance, 0);
    console.log(`${cat}: ${catData.length} records, $${(totalAmount / 1e9).toFixed(2)}B`);
  });

  console.log('\n=====================================\n');

  return { lcr, nsfr, testData };
}
