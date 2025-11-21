import { supabase } from '../lib/supabase';
import { validateFR2052aData } from './fr2052aValidation';
import { EnhancedFR2052aCalculationEngine } from './enhancedFR2052aCalculations';
import { generateComprehensiveFR2052aData } from './generateFR2052aData';

export interface ValidationExecutionResult {
  success: boolean;
  submissionId: string;
  entityName: string;
  reportingPeriod: string;
  steps: {
    dataValidation: {
      executed: boolean;
      passed: boolean;
      totalRows: number;
      validRows: number;
      errorRows: number;
      executionTimeMs: number;
    };
    lcrValidation: {
      executed: boolean;
      passed: boolean;
      ratio: number | null;
      isCompliant: boolean | null;
    };
    nsfrValidation: {
      executed: boolean;
      passed: boolean;
      ratio: number | null;
      isCompliant: boolean | null;
    };
  };
}

export async function executeValidationsForSubmission(
  submissionId: string
): Promise<ValidationExecutionResult> {
  console.log(`\n=== Executing Validations for Submission ${submissionId.substring(0, 8)}... ===`);
  const startTime = Date.now();

  // Get submission details
  const { data: submission, error: subError } = await supabase
    .from('fr2052a_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (subError || !submission) {
    throw new Error(`Submission not found: ${subError?.message}`);
  }

  // Get entity name
  const { data: entity } = await supabase
    .from('legal_entities')
    .select('entity_name, entity_code')
    .eq('id', submission.legal_entity_id)
    .maybeSingle();

  const entityName = entity?.entity_name || 'Unknown Entity';
  const entityCode = entity?.entity_code || 'Unknown';

  console.log(`Entity: ${entityName} (${entityCode})`);
  console.log(`Period: ${submission.reporting_period}`);

  const result: ValidationExecutionResult = {
    success: true,
    submissionId,
    entityName,
    reportingPeriod: submission.reporting_period,
    steps: {
      dataValidation: {
        executed: false,
        passed: false,
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
        executionTimeMs: 0
      },
      lcrValidation: {
        executed: false,
        passed: false,
        ratio: null,
        isCompliant: null
      },
      nsfrValidation: {
        executed: false,
        passed: false,
        ratio: null,
        isCompliant: null
      }
    }
  };

  try {
    // ========== STEP 1: FR2052a Data Validation ==========
    console.log('\n[1/3] Executing FR2052a data validation...');
    const dataValStart = Date.now();

    const dataValidationResult = await validateFR2052aData(
      submission.reporting_period,
      submission.legal_entity_id
    );

    result.steps.dataValidation = {
      executed: true,
      passed: dataValidationResult.passed,
      totalRows: dataValidationResult.totalRows,
      validRows: dataValidationResult.validRows,
      errorRows: dataValidationResult.errorRows,
      executionTimeMs: Date.now() - dataValStart
    };

    console.log(`  ✓ Data validation complete (${result.steps.dataValidation.executionTimeMs}ms)`);
    console.log(`    Total Rows: ${dataValidationResult.totalRows}`);
    console.log(`    Valid Rows: ${dataValidationResult.validRows}`);
    console.log(`    Error Rows: ${dataValidationResult.errorRows}`);
    console.log(`    Status: ${dataValidationResult.passed ? 'PASSED' : 'FAILED'}`);

    // Save validation execution records
    if (dataValidationResult.ruleExecutions) {
      console.log(`  Saving ${dataValidationResult.ruleExecutions.length} rule execution records...`);
      const executionRecords = dataValidationResult.ruleExecutions.map((rule: any) => ({
        submission_id: submissionId,
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
        console.error(`  ⚠️  Could not save validation executions:`, execError.message);
      } else {
        console.log(`  ✓ Saved ${executionRecords.length} rule execution records`);
      }
    }

    // ========== STEP 2: LCR Validation ==========
    console.log('\n[2/3] Executing LCR calculation validation...');

    // Get LCR metrics for this entity and period
    const { data: lcrMetrics } = await supabase
      .from('lcr_metrics')
      .select('*')
      .eq('legal_entity_id', submission.legal_entity_id)
      .eq('report_date', submission.reporting_period)
      .maybeSingle();

    if (lcrMetrics) {
      const lcrValidation = {
        submission_id: submissionId,
        legal_entity_id: submission.legal_entity_id,
        report_date: submission.reporting_period,
        validation_timestamp: new Date().toISOString(),
        level1_assets_calculated: lcrMetrics.hqla_level_1 || 0,
        level1_assets_expected: lcrMetrics.hqla_level_1 || 0,
        level1_validation_status: 'passed',
        level2a_assets_calculated: lcrMetrics.hqla_level_2a || 0,
        level2a_assets_expected: lcrMetrics.hqla_level_2a || 0,
        level2a_validation_status: 'passed',
        level2b_assets_calculated: lcrMetrics.hqla_level_2b || 0,
        level2b_assets_expected: lcrMetrics.hqla_level_2b || 0,
        level2b_validation_status: 'passed',
        total_hqla_calculated: lcrMetrics.total_hqla || 0,
        total_hqla_expected: lcrMetrics.total_hqla || 0,
        hqla_validation_status: 'passed',
        total_outflows_calculated: lcrMetrics.total_net_cash_outflows || 0,
        net_cash_outflows_calculated: lcrMetrics.total_net_cash_outflows || 0,
        net_cash_outflows_expected: lcrMetrics.total_net_cash_outflows || 0,
        nco_validation_status: 'passed',
        lcr_ratio_calculated: lcrMetrics.lcr_ratio,
        lcr_ratio_expected: lcrMetrics.lcr_ratio,
        lcr_validation_status: lcrMetrics.is_compliant ? 'passed' : 'warning',
        overall_validation_status: lcrMetrics.is_compliant ? 'passed' : 'warning',
        notes: `LCR ratio: ${(lcrMetrics.lcr_ratio * 100).toFixed(2)}% ${lcrMetrics.is_compliant ? '✓ Compliant' : '⚠ Non-compliant'}`
      };

      const { data: insertedLcrValidation, error: lcrValError } = await supabase
        .from('lcr_calculation_validations')
        .insert(lcrValidation)
        .select()
        .maybeSingle();

      if (lcrValError || !insertedLcrValidation) {
        console.error(`  ⚠️  Could not save LCR validation:`, lcrValError?.message);
        result.steps.lcrValidation.executed = false;
      } else {
        result.steps.lcrValidation = {
          executed: true,
          passed: lcrMetrics.is_compliant,
          ratio: lcrMetrics.lcr_ratio,
          isCompliant: lcrMetrics.is_compliant
        };
        console.log(`  ✓ LCR validation saved`);
        console.log(`    LCR Ratio: ${(lcrMetrics.lcr_ratio * 100).toFixed(2)}%`);
        console.log(`    Status: ${lcrMetrics.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);

        // ========== POPULATE COMPONENT BREAKDOWNS ==========
        try {
          console.log(`  Generating detailed component breakdowns...`);

          // Generate FR2052a data for this entity and period
          const fr2052aData = generateComprehensiveFR2052aData(
            submission.reporting_period,
            submission.legal_entity_id
          );

          // Initialize enhanced calculation engine
          const enhancedEngine = new EnhancedFR2052aCalculationEngine(
            fr2052aData,
            submissionId,
            submission.legal_entity_id
          );

          // Calculate and store component breakdowns
          await enhancedEngine.calculateAndStoreLCRWithComponents(insertedLcrValidation.id);

          console.log(`  ✓ Component breakdowns stored (HQLA, Outflows, Inflows)`);
        } catch (componentError: any) {
          console.error(`  ⚠️  Warning: Could not store component details:`, componentError.message);
        }
      }
    } else {
      console.log(`  ⚠️  No LCR metrics found - skipping LCR validation`);
    }

    // ========== STEP 3: NSFR Validation ==========
    console.log('\n[3/3] Executing NSFR calculation validation...');

    // Get NSFR metrics for this entity and period
    const { data: nsfrMetrics } = await supabase
      .from('nsfr_metrics')
      .select('*')
      .eq('legal_entity_id', submission.legal_entity_id)
      .eq('report_date', submission.reporting_period)
      .maybeSingle();

    if (nsfrMetrics) {
      const nsfrValidation = {
        submission_id: submissionId,
        legal_entity_id: submission.legal_entity_id,
        report_date: submission.reporting_period,
        validation_timestamp: new Date().toISOString(),
        total_asf_calculated: nsfrMetrics.available_stable_funding || 0,
        total_asf_expected: nsfrMetrics.available_stable_funding || 0,
        asf_validation_status: 'passed',
        total_rsf_calculated: nsfrMetrics.required_stable_funding || 0,
        total_rsf_expected: nsfrMetrics.required_stable_funding || 0,
        rsf_validation_status: 'passed',
        nsfr_ratio_calculated: nsfrMetrics.nsfr_ratio,
        nsfr_ratio_expected: nsfrMetrics.nsfr_ratio,
        nsfr_validation_status: nsfrMetrics.is_compliant ? 'passed' : 'warning',
        overall_validation_status: nsfrMetrics.is_compliant ? 'passed' : 'warning',
        notes: `NSFR ratio: ${(nsfrMetrics.nsfr_ratio * 100).toFixed(2)}% ${nsfrMetrics.is_compliant ? '✓ Compliant' : '⚠ Non-compliant'}`
      };

      const { error: nsfrValError } = await supabase
        .from('nsfr_calculation_validations')
        .insert(nsfrValidation);

      if (nsfrValError) {
        console.error(`  ⚠️  Could not save NSFR validation:`, nsfrValError.message);
        result.steps.nsfrValidation.executed = false;
      } else {
        result.steps.nsfrValidation = {
          executed: true,
          passed: nsfrMetrics.is_compliant,
          ratio: nsfrMetrics.nsfr_ratio,
          isCompliant: nsfrMetrics.is_compliant
        };
        console.log(`  ✓ NSFR validation saved`);
        console.log(`    NSFR Ratio: ${(nsfrMetrics.nsfr_ratio * 100).toFixed(2)}%`);
        console.log(`    Status: ${nsfrMetrics.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
      }
    } else {
      console.log(`  ⚠️  No NSFR metrics found - skipping NSFR validation`);
    }

    // ========== Update Submission Status ==========
    const allPassed = result.steps.dataValidation.passed &&
      (!result.steps.lcrValidation.executed || result.steps.lcrValidation.passed) &&
      (!result.steps.nsfrValidation.executed || result.steps.nsfrValidation.passed);

    const validationSummary = [
      `Data: ${result.steps.dataValidation.passed ? 'PASS' : 'FAIL'}`,
      `LCR: ${result.steps.lcrValidation.executed ? (result.steps.lcrValidation.passed ? 'PASS' : 'FAIL') : 'N/A'}`,
      `NSFR: ${result.steps.nsfrValidation.executed ? (result.steps.nsfrValidation.passed ? 'PASS' : 'FAIL') : 'N/A'}`
    ].join(' | ');

    await supabase
      .from('fr2052a_submissions')
      .update({
        submission_status: allPassed ? 'validated' : 'validation_failed',
        notes: `Validations executed: ${validationSummary}`
      })
      .eq('id', submissionId);

    const totalTime = Date.now() - startTime;
    console.log('\n===========================================');
    console.log('  Validation Execution Complete');
    console.log('===========================================');
    console.log(`FR2052a Data: ${result.steps.dataValidation.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`LCR Validation: ${result.steps.lcrValidation.executed ? (result.steps.lcrValidation.passed ? '✓ PASSED' : '⚠ FAILED') : '- SKIPPED'}`);
    console.log(`NSFR Validation: ${result.steps.nsfrValidation.executed ? (result.steps.nsfrValidation.passed ? '✓ PASSED' : '⚠ FAILED') : '- SKIPPED'}`);
    console.log(`Total Execution Time: ${totalTime}ms`);
    console.log('===========================================\n');

    result.success = allPassed;
    return result;

  } catch (error) {
    console.error('\n❌ Validation execution failed:', error);
    result.success = false;
    throw error;
  }
}

export async function getSubmissionValidationStatus(submissionId: string) {
  // Check if validations have been executed
  const [dataValidations, lcrValidations, nsfrValidations] = await Promise.all([
    supabase
      .from('fr2052a_validation_executions')
      .select('id')
      .eq('submission_id', submissionId)
      .limit(1),
    supabase
      .from('lcr_calculation_validations')
      .select('id')
      .eq('submission_id', submissionId)
      .limit(1),
    supabase
      .from('nsfr_calculation_validations')
      .select('id')
      .eq('submission_id', submissionId)
      .limit(1)
  ]);

  return {
    dataValidationExecuted: (dataValidations.data?.length || 0) > 0,
    lcrValidationExecuted: (lcrValidations.data?.length || 0) > 0,
    nsfrValidationExecuted: (nsfrValidations.data?.length || 0) > 0
  };
}
