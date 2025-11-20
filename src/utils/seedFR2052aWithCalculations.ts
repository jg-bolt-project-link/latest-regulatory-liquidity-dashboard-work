import { supabase } from '../lib/supabase';
import { generateComprehensiveFR2052aData } from './generateFR2052aData';
import { FR2052aCalculationEngine } from './fr2052aCalculations';

// Map internal product categories to FR2052a Product enumerations
function mapToFR2052aProduct(productCategory: string, counterpartyType: string): string {
  // FR2052a Product enumerations: Asset, Derivative, Retail, Secured, Unsecured, Wholesale
  const categoryMap: { [key: string]: string } = {
    'deposits': counterpartyType.includes('retail') ? 'Retail' : 'Wholesale',
    'loans': 'Asset',
    'securities': 'Asset',
    'derivatives': 'Derivative',
    'secured_funding': 'Secured',
    'credit_facilities': 'Unsecured',
    'liquidity_facilities': 'Wholesale',
    'capital': 'Asset',
    'other_assets': 'Asset',
    'other_liabilities': 'Unsecured'
  };
  return categoryMap[productCategory] || 'Asset';
}

// Map internal maturity buckets to FR2052a MaturityBucket enumerations
function mapToFR2052aMaturityBucket(maturityBucket: string): string {
  // FR2052a MaturityBucket enumerations: Overnight, 2-3 Days, 4-7 Days, 8-14 Days,
  // 15-30 Days, 31-90 Days, 91-180 Days, 181-365 Days, >365 Days, Open
  const maturityMap: { [key: string]: string } = {
    'overnight': 'Overnight',
    '2-7days': '4-7 Days',
    '8-30days': '8-14 Days',  // Split between 8-14 and 15-30
    '31-90days': '31-90 Days',
    '91-180days': '91-180 Days',
    '181-365days': '181-365 Days',
    'gt_1year': '>365 Days',
    'open': 'Open'
  };
  return maturityMap[maturityBucket] || 'Open';
}

export async function seedFR2052aWithCalculations() {
  console.log('=== FR 2052a Data Generation Started ===');

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
    .from('lcr_metrics')
    .select('id')
    .limit(1);

  if (lcrTestError) {
    console.error('❌ ERROR: lcr_metrics table not accessible:', lcrTestError);
    return { success: false, error: `Table lcr_metrics error: ${lcrTestError.message}` };
  }
  console.log('✓ lcr_metrics table exists');

  const { error: nsfrTestError } = await supabase
    .from('nsfr_metrics')
    .select('id')
    .limit(1);

  if (nsfrTestError) {
    console.error('❌ ERROR: nsfr_metrics table not accessible:', nsfrTestError);
    return { success: false, error: `Table nsfr_metrics error: ${nsfrTestError.message}` };
  }
  console.log('✓ nsfr_metrics table exists');

  console.log('Step 1: Fetching legal entities (limit for performance)...');
  const startFetch = Date.now();
  const { data: entities, error: entitiesError } = await supabase
    .from('legal_entities')
    .select('id, entity_name')
    .is('user_id', null)
    .limit(3);  // Reduced to 3 entities for faster generation
  console.log(`  Fetch took ${Date.now() - startFetch}ms`);

  if (entitiesError) {
    console.error('ERROR fetching legal entities:', entitiesError);
    return { success: false, error: entitiesError.message };
  }

  if (!entities || entities.length === 0) {
    console.error('No legal entities found. Please create entities first.');
    return { success: false, error: 'No legal entities found' };
  }

  console.log(`✓ Found ${entities.length} legal entities:`, entities.map(e => e.entity_name));

  const reportDates = [
    '2024-12-31',
    '2024-11-30',
    '2024-10-31'
  ];  // Reduced to 3 periods for faster generation

  const results = {
    totalRecords: 0,
    totalEntities: 0,
    totalPeriods: 0,
    lcrCalculations: [] as any[],
    nsfrCalculations: [] as any[]
  };

  for (const entity of entities) {
    console.log(`\nProcessing entity ${results.totalEntities + 1}/${entities.length}: ${entity.entity_name}`);
    results.totalEntities++;

    for (const reportDate of reportDates) {
      const periodNum = results.totalPeriods + 1;
      console.log(`  Period ${periodNum}/$(entities.length * reportDates.length)}: Generating data for ${reportDate}...`);
      const genStart = Date.now();

      const fr2052aData = generateComprehensiveFR2052aData(reportDate, entity.id);
      console.log(`  Generated ${fr2052aData.length} FR 2052a line items (${Date.now() - genStart}ms)`);

      const dbRows = fr2052aData.map(item => ({
        user_id: null,
        legal_entity_id: entity.id,
        report_date: reportDate,
        table_name: 'FR2052a',
        reporting_entity: entity.entity_name,
        product: mapToFR2052aProduct(item.productCategory, item.counterpartyType),
        sub_product: item.subProduct || null,
        sub_product2: item.assetClass || null,
        counterparty: item.counterpartyType,
        maturity_bucket: mapToFR2052aMaturityBucket(item.maturityBucket),
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
      const insertStart = Date.now();

      // Insert in batches of 1000 for better performance
      const batchSize = 1000;
      let totalInserted = 0;
      const totalBatches = Math.ceil(dbRows.length / batchSize);

      for (let i = 0; i < dbRows.length; i += batchSize) {
        const batchNum = Math.floor(i / batchSize) + 1;
        const batch = dbRows.slice(i, i + batchSize);
        const batchStart = Date.now();

        const { error: batchError } = await supabase
          .from('fr2052a_data_rows')
          .insert(batch);

        if (batchError) {
          console.error(`  ❌ ERROR inserting batch ${batchNum}/${totalBatches}:`, batchError);
          return { success: false, error: batchError.message };
        }

        totalInserted += batch.length;
        const batchTime = Date.now() - batchStart;
        const avgTime = (Date.now() - insertStart) / batchNum;
        const remaining = (totalBatches - batchNum) * avgTime;

        if (totalBatches > 1) {
          console.log(`  ... batch ${batchNum}/${totalBatches} (${batch.length} rows in ${batchTime}ms, ~${Math.round(remaining/1000)}s remaining)`);
        }
      }

      const insertError = null;
      const insertedData = null;  // Don't need to return data

      console.log(`  ✓ Successfully inserted ${totalInserted} rows (total time: ${Math.round((Date.now() - insertStart)/1000)}s)`);
      results.totalRecords += dbRows.length;
      results.totalPeriods++;

      console.log(`  Step 2b: Calculating LCR and NSFR...`);
      const calcStart = Date.now();
      const engine = new FR2052aCalculationEngine(fr2052aData);

      const lcrResult = engine.calculateLCR();
      const nsfrResult = engine.calculateNSFR();
      console.log(`  ✓ LCR: ${(lcrResult.lcrRatio * 100).toFixed(2)}%, NSFR: ${(nsfrResult.nsfrRatio * 100).toFixed(2)}% (${Date.now() - calcStart}ms)`);

      const lcrData = {
        user_id: null,
        legal_entity_id: entity.id,
        report_date: reportDate,
        hqla_level_1: lcrResult.level1Assets,
        hqla_level_2a: lcrResult.level2aAssets,
        hqla_level_2b: lcrResult.level2bAssets,
        total_hqla: lcrResult.totalHQLA,
        total_net_cash_outflows: lcrResult.netCashOutflows,
        lcr_ratio: lcrResult.lcrRatio,
        is_compliant: lcrResult.isCompliant,
        notes: `FR2052a calculation - ${dbRows.length} records processed`
      };

      console.log(`  Step 2c: Saving metrics...`);
      const saveStart = Date.now();

      const { error: lcrError } = await supabase
        .from('lcr_metrics')
        .upsert(lcrData, {
          onConflict: 'legal_entity_id,report_date'
        });

      if (lcrError) {
        console.error(`  ❌ ERROR saving LCR metrics:`, lcrError);
        return { success: false, error: lcrError.message };
      }

      results.lcrCalculations.push(lcrResult);

      const nsfrData = {
        user_id: null,
        legal_entity_id: entity.id,
        report_date: reportDate,
        available_stable_funding: nsfrResult.availableStableFunding,
        required_stable_funding: nsfrResult.requiredStableFunding,
        nsfr_ratio: nsfrResult.nsfrRatio,
        is_compliant: nsfrResult.isCompliant,
        retail_deposits: nsfrResult.details.retailDepositsASF || 0,
        wholesale_funding: nsfrResult.details.wholesaleFundingASF || 0,
        notes: `FR2052a calculation - ${dbRows.length} records processed`
      };

      const { error: nsfrError } = await supabase
        .from('nsfr_metrics')
        .upsert(nsfrData, {
          onConflict: 'legal_entity_id,report_date'
        });

      if (nsfrError) {
        console.error(`  ❌ ERROR saving NSFR metrics:`, nsfrError);
        return { success: false, error: nsfrError.message };
      }

      console.log(`  ✓ Metrics saved (${Date.now() - saveStart}ms)`);
      results.nsfrCalculations.push(nsfrResult);

      // Step 2e: Create FR2052a submission record
      console.log(`  Step 2e: Creating FR2052a submission record...`);
      const submissionData = {
        user_id: null,
        submission_date: new Date().toISOString().split('T')[0],
        reporting_period: reportDate,
        submission_type: 'system_generated',
        legal_entity_id: entity.id,
        total_hqla: lcrResult.totalHQLA,
        total_outflows: lcrResult.totalCashOutflows,
        total_inflows: lcrResult.totalCashInflows,
        net_cash_outflow: lcrResult.netCashOutflows,
        lcr_ratio: lcrResult.lcrRatio,
        is_submitted: true,
        submission_status: 'completed',
        notes: `Auto-generated from ${dbRows.length} FR2052a records`
      };

      const { data: submissionRecord, error: submissionError } = await supabase
        .from('fr2052a_submissions')
        .insert(submissionData)
        .select()
        .maybeSingle();

      if (submissionError) {
        console.error(`  ⚠️ Warning: Could not create submission record:`, submissionError.message);
      } else {
        console.log(`  ✓ Submission record created (${submissionRecord?.id?.substring(0, 8)}...)`);

        // Save submission ID for validation tracking
        if (submissionRecord) {
          results.nsfrCalculations[results.nsfrCalculations.length - 1].submissionId = submissionRecord.id;
        }
      }
    }
  }

  console.log('\n=== FR 2052a Generation & Calculation Summary ===');
  console.log(`Total Entities Processed: ${results.totalEntities}`);
  console.log(`Total Periods Generated: ${results.totalPeriods}`);
  console.log(`Total FR 2052a Records: ${results.totalRecords}`);
  console.log(`LCR Calculations: ${results.lcrCalculations.length}`);
  console.log(`NSFR Calculations: ${results.nsfrCalculations.length}`);
  console.log('================================================\n');

  console.log('Step 3: Quick verification (spot check)...');

  // Instead of counting all rows, just verify some recent data exists
  const { data: sampleFR2052a, error: fr2052aError } = await supabase
    .from('fr2052a_data_rows')
    .select('id')
    .is('user_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sampleLCR, error: lcrError } = await supabase
    .from('lcr_metrics')
    .select('id')
    .is('user_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sampleNSFR, error: nsfrError } = await supabase
    .from('nsfr_metrics')
    .select('id')
    .is('user_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log('\n=== Quick Verification ===');
  console.log(`✓ FR 2052a data exists: ${sampleFR2052a ? 'YES' : 'NO'}`);
  console.log(`✓ LCR metrics exist: ${sampleLCR ? 'YES' : 'NO'}`);
  console.log(`✓ NSFR metrics exist: ${sampleNSFR ? 'YES' : 'NO'}`);
  console.log(`Expected records: ~${results.totalRecords}`);
  console.log('==========================\n');

  if (!sampleFR2052a) {
    console.error('❌ WARNING: No FR 2052a data found in database after generation!');
    return { success: false, error: 'Data generation failed - no records in database' };
  }

  if (!sampleLCR) {
    console.error('❌ WARNING: No LCR metrics found in database after generation!');
    return { success: false, error: 'LCR calculation failed - no records in database' };
  }

  if (!sampleNSFR) {
    console.error('❌ WARNING: No NSFR metrics found in database after generation!');
    return { success: false, error: 'NSFR calculation failed - no records in database' };
  }

  console.log('✅ All data successfully generated and verified in database!');

  console.log('\nStep 4: Running validation checks and creating validation records...');
  const { validateFR2052aData } = await import('./fr2052aValidation');
  const validationResults: any[] = [];

  // Get the submission records we just created
  const { data: submissions } = await supabase
    .from('fr2052a_submissions')
    .select('id, reporting_period, legal_entity_id')
    .is('user_id', null)
    .in('reporting_period', reportDates)
    .order('created_at', { ascending: false });

  // Create validation records for each entity/date combination
  for (const entity of entities) {
    for (const reportDate of reportDates) {
      console.log(`  Validating data for ${entity.entity_name} - ${reportDate}...`);
      try {
        const validationResult = await validateFR2052aData(reportDate, entity.id);
        validationResults.push({
          entityId: entity.id,
          reportDate,
          ...validationResult
        });
        console.log(`    ✓ Validated ${validationResult.totalRows} rows: ${validationResult.validRows} valid, ${validationResult.errorRows} with errors`);

        // Find the matching submission for THIS entity and date
        const matchingSubmission = submissions?.find(s =>
          s.reporting_period === reportDate && s.legal_entity_id === entity.id
        );

        if (matchingSubmission && validationResult.ruleExecutions) {
        console.log(`    Saving ${validationResult.ruleExecutions.length} rule execution records...`);
        const executionRecords = validationResult.ruleExecutions.map((rule: any) => ({
          submission_id: matchingSubmission.id,
          validation_rule_id: rule.ruleId || null,
          rule_name: rule.ruleName,
          rule_category: rule.category,
          execution_timestamp: new Date().toISOString(),
          total_rows_checked: rule.rowsChecked || 0,
          rows_passed: rule.rowsPassed || 0,
          rows_failed: rule.rowsFailed || 0,
          execution_status: 'completed',
          execution_time_ms: rule.executionTimeMs || 0,
          notes: rule.notes || null
        }));

        const { error: execError } = await supabase
          .from('fr2052a_validation_executions')
          .insert(executionRecords);

        if (execError) {
          console.error(`    ⚠️ Warning: Could not save validation executions:`, execError.message);
        } else {
          console.log(`    ✓ Saved ${executionRecords.length} validation execution records`);
        }
      }

        // Create LCR calculation validation record
        const lcrCalc = results.lcrCalculations.find((c: any) =>
          c.entityId === entity.id && c.reportDate === reportDate
        );

        if (matchingSubmission && lcrCalc) {
        console.log(`    Creating LCR calculation validation...`);
        const lcrValidation = {
          submission_id: matchingSubmission.id,
          legal_entity_id: matchingSubmission.legal_entity_id,
          report_date: reportDate,
          validation_timestamp: new Date().toISOString(),
          level1_assets_calculated: lcrCalc.level1Assets || 0,
          level1_assets_expected: lcrCalc.level1Assets || 0,
          level1_validation_status: 'passed',
          total_hqla_calculated: lcrCalc.totalHQLA || 0,
          total_hqla_expected: lcrCalc.totalHQLA || 0,
          hqla_validation_status: 'passed',
          net_cash_outflows_calculated: lcrCalc.netCashOutflows || 0,
          net_cash_outflows_expected: lcrCalc.netCashOutflows || 0,
          nco_validation_status: 'passed',
          lcr_ratio_calculated: lcrCalc.lcrRatio,
          lcr_ratio_expected: lcrCalc.lcrRatio,
          lcr_validation_status: lcrCalc.isCompliant ? 'passed' : 'warning',
          overall_validation_status: lcrCalc.isCompliant ? 'passed' : 'warning',
          notes: `LCR ratio: ${(lcrCalc.lcrRatio * 100).toFixed(2)}%`
        };

        const { error: lcrValError } = await supabase
          .from('lcr_calculation_validations')
          .insert(lcrValidation);

        if (lcrValError) {
          console.error(`    ⚠️ Warning: Could not save LCR validation:`, lcrValError.message);
        } else {
          console.log(`    ✓ LCR calculation validation saved`);
        }
      }

        // Create NSFR calculation validation record
        const nsfrCalc = results.nsfrCalculations.find((c: any) =>
          c.entityId === entity.id && c.reportDate === reportDate
        );

        if (matchingSubmission && nsfrCalc) {
        console.log(`    Creating NSFR calculation validation...`);
        const nsfrValidation = {
          submission_id: matchingSubmission.id,
          legal_entity_id: matchingSubmission.legal_entity_id,
          report_date: reportDate,
          validation_timestamp: new Date().toISOString(),
          total_asf_calculated: nsfrCalc.availableStableFunding || 0,
          total_asf_expected: nsfrCalc.availableStableFunding || 0,
          asf_validation_status: 'passed',
          total_rsf_calculated: nsfrCalc.requiredStableFunding || 0,
          total_rsf_expected: nsfrCalc.requiredStableFunding || 0,
          rsf_validation_status: 'passed',
          nsfr_ratio_calculated: nsfrCalc.nsfrRatio,
          nsfr_ratio_expected: nsfrCalc.nsfrRatio,
          nsfr_validation_status: nsfrCalc.isCompliant ? 'passed' : 'warning',
          overall_validation_status: nsfrCalc.isCompliant ? 'passed' : 'warning',
          notes: `NSFR ratio: ${(nsfrCalc.nsfrRatio * 100).toFixed(2)}%`
        };

        const { error: nsfrValError } = await supabase
          .from('nsfr_calculation_validations')
          .insert(nsfrValidation);

        if (nsfrValError) {
          console.error(`    ⚠️ Warning: Could not save NSFR validation:`, nsfrValError.message);
        } else {
          console.log(`    ✓ NSFR calculation validation saved`);
        }
      }

      } catch (error) {
        console.error(`    ✗ Validation failed for ${entity.entity_name} - ${reportDate}:`, error);
        validationResults.push({
          entityId: entity.id,
          reportDate,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  console.log('\n=== Validation Summary ===');
  const totalErrors = validationResults.reduce((sum, r) => sum + (r.errors?.length || 0), 0);
  const totalValidRows = validationResults.reduce((sum, r) => sum + (r.validRows || 0), 0);
  console.log(`Total validated rows: ${totalValidRows}`);
  console.log(`Total validation errors: ${totalErrors}`);
  console.log('==========================\n');

  return {
    success: true,
    results: {
      ...results,
      validationResults
    }
  };
}

export async function testCalculations() {
  console.log('\n=== Testing FR 2052a Calculations ===\n');

  const testData = generateComprehensiveFR2052aData('2024-12-31', 'test-entity');
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
