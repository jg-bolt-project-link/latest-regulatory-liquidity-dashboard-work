import { supabase } from '../lib/supabase';

interface ValidationRule {
  id: string;
  rule_category: string;
  rule_name: string;
  field_name: string | null;
  validation_logic: string;
  is_active: boolean;
}

interface ValidationError {
  submission_id: string;
  data_row_id: string | null;
  error_type: string;
  error_message: string;
  field_name: string | null;
  expected_value: string | null;
  actual_value: string | null;
  severity: 'error' | 'warning' | 'info';
}

interface RuleExecution {
  ruleId: string;
  ruleName: string;
  category: string;
  rowsChecked: number;
  rowsPassed: number;
  rowsFailed: number;
  executionTimeMs: number;
  notes?: string;
}

interface ValidationResult {
  submissionId: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: ValidationError[];
  ruleExecutions: RuleExecution[];
  passed: boolean;
}

export async function validateFR2052aData(
  reportingPeriod: string,
  legalEntityId?: string
): Promise<ValidationResult> {
  console.log(`Starting FR2052a validation for period ${reportingPeriod}...`);

  // Fetch active validation rules
  const { data: rules, error: rulesError } = await supabase
    .from('fr2052a_validation_rules')
    .select('*')
    .eq('is_active', true);

  if (rulesError) {
    console.warn(`Could not fetch validation rules: ${rulesError.message}. Skipping rule-based validation.`);
  }

  const validationRules = rules || [];
  console.log(`Loaded ${validationRules.length} active validation rules`);

  // Fetch FR2052a data for the reporting period (with reasonable limit)
  let query = supabase
    .from('fr2052a_data_rows')
    .select('*')
    .eq('report_date', reportingPeriod)
    .is('user_id', null)
    .limit(10000);  // Reasonable limit for validation

  if (legalEntityId) {
    query = query.eq('legal_entity_id', legalEntityId);
  }

  const { data: dataRows, error: dataError } = await query;

  if (dataError || !dataRows) {
    throw new Error(`Failed to fetch FR2052a data: ${dataError?.message}`);
  }

  console.log(`Validating ${dataRows.length} data rows...`);

  // Look for existing submission record (created by data generation)
  const { data: existingSubmissions } = await supabase
    .from('fr2052a_submissions')
    .select('*')
    .eq('reporting_period', reportingPeriod)
    .is('user_id', null)
    .order('created_at', { ascending: false })
    .limit(1);

  let submission = existingSubmissions?.[0];

  // Create submission only if it doesn't exist
  if (!submission) {
    const { data: newSubmission, error: submissionError } = await supabase
      .from('fr2052a_submissions')
      .insert({
        user_id: null,
        submission_date: new Date().toISOString().split('T')[0],
        reporting_period: reportingPeriod,
        submission_type: 'automated_validation',
        legal_entity_id: legalEntityId || 'all_entities',
        total_hqla: 0,
        total_outflows: 0,
        total_inflows: 0,
        net_cash_outflow: 0,
        lcr_ratio: 0,
        is_submitted: false,
        submission_status: 'validating',
        notes: `Automated validation run for ${reportingPeriod}`
      })
      .select()
      .maybeSingle();

    if (submissionError || !newSubmission) {
      throw new Error(`Failed to create submission: ${submissionError?.message}`);
    }
    submission = newSubmission;
  }

  const errors: ValidationError[] = [];
  const errorRowIds = new Set<string>();
  const ruleExecutions: RuleExecution[] = [];

  // Execute validation rules
  for (const rule of validationRules) {
    console.log(`  Executing rule: ${rule.rule_name}`);
    const ruleStartTime = Date.now();
    const errorsBefore = errors.length;

    switch (rule.rule_category) {
      case 'enumeration':
        await validateEnumeration(rule, dataRows, submission.id, errors, errorRowIds);
        break;

      case 'data_type':
        await validateDataType(rule, dataRows, submission.id, errors, errorRowIds);
        break;

      case 'cross_field':
        await validateCrossField(rule, dataRows, submission.id, errors, errorRowIds);
        break;

      case 'field_dependency':
        await validateFieldDependency(rule, dataRows, submission.id, errors, errorRowIds);
        break;

      case 'duplicate':
        await validateDuplicates(rule, dataRows, submission.id, errors, errorRowIds);
        break;

      case 'legal_entity':
        await validateLegalEntity(rule, dataRows, submission.id, errors, errorRowIds);
        break;

      default:
        console.log(`    Skipping rule category: ${rule.rule_category} (not implemented)`);
    }

    // Track rule execution
    const executionTime = Date.now() - ruleStartTime;
    const errorsAfter = errors.length;
    const errorCount = errorsAfter - errorsBefore;

    ruleExecutions.push({
      ruleId: rule.id,
      ruleName: rule.rule_name,
      category: rule.rule_category,
      rowsChecked: dataRows.length,
      rowsPassed: dataRows.length - errorCount,
      rowsFailed: errorCount,
      executionTimeMs: executionTime,
      notes: errorCount > 0 ? `Found ${errorCount} validation errors` : 'All rows passed'
    });
  }

  console.log(`Validation complete: ${errors.length} errors found`);

  // Insert validation errors into database
  if (errors.length > 0) {
    const { error: errorsInsertError } = await supabase
      .from('fr2052a_validation_errors')
      .insert(errors);

    if (errorsInsertError) {
      console.error('Failed to insert validation errors:', errorsInsertError);
    }
  }

  // Update submission status
  const validRows = dataRows.length - errorRowIds.size;
  const errorRows = errorRowIds.size;
  const passed = errors.filter(e => e.severity === 'error').length === 0;

  await supabase
    .from('fr2052a_submissions')
    .update({
      submission_status: passed ? 'validated' : 'validation_failed',
      notes: `Validation complete: ${validRows} valid rows, ${errorRows} rows with errors, ${errors.length} total errors`
    })
    .eq('id', submission.id);

  return {
    submissionId: submission.id,
    totalRows: dataRows.length,
    validRows,
    errorRows,
    errors,
    ruleExecutions,
    passed
  };
}

async function validateEnumeration(
  rule: ValidationRule,
  dataRows: any[],
  submissionId: string,
  errors: ValidationError[],
  errorRowIds: Set<string>
) {
  // Fetch allowed values for this field
  const { data: enumerations } = await supabase
    .from('fr2052a_enumerations')
    .select('allowed_value')
    .eq('field_name', rule.field_name);

  if (!enumerations) return;

  const allowedValues = new Set(enumerations.map(e => e.allowed_value));
  const fieldMap: { [key: string]: string } = {
    'MaturityBucket': 'maturity_bucket',
    'Product': 'product',
    'Currency': 'currency',
    'Internal': 'internal_flag'
  };

  const dbFieldName = fieldMap[rule.field_name || ''] || rule.field_name?.toLowerCase();

  for (const row of dataRows) {
    const value = row[dbFieldName || ''];

    if (value && !allowedValues.has(value)) {
      errors.push({
        submission_id: submissionId,
        data_row_id: row.id,
        error_type: 'enumeration_violation',
        error_message: `Invalid ${rule.field_name}: '${value}' is not in allowed values`,
        field_name: rule.field_name,
        expected_value: Array.from(allowedValues).join(', '),
        actual_value: value,
        severity: 'error'
      });
      errorRowIds.add(row.id);
    }
  }
}

async function validateDataType(
  rule: ValidationRule,
  dataRows: any[],
  submissionId: string,
  errors: ValidationError[],
  errorRowIds: Set<string>
) {
  if (rule.field_name === 'Currency') {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

    for (const row of dataRows) {
      const currency = row.currency;

      if (currency && !validCurrencies.includes(currency)) {
        errors.push({
          submission_id: submissionId,
          data_row_id: row.id,
          error_type: 'invalid_currency',
          error_message: `Invalid ISO 4217 currency code: '${currency}'`,
          field_name: 'Currency',
          expected_value: validCurrencies.join(', '),
          actual_value: currency,
          severity: 'error'
        });
        errorRowIds.add(row.id);
      }
    }
  }
}

async function validateCrossField(
  rule: ValidationRule,
  dataRows: any[],
  submissionId: string,
  errors: ValidationError[],
  errorRowIds: Set<string>
) {
  if (rule.rule_name === 'Lendable Value Check') {
    for (const row of dataRows) {
      const lendable = row.lendable_value || 0;
      const market = row.market_value || 0;

      if (lendable > market) {
        errors.push({
          submission_id: submissionId,
          data_row_id: row.id,
          error_type: 'cross_field_violation',
          error_message: `Lendable value (${lendable}) exceeds market value (${market})`,
          field_name: 'LendableValue',
          expected_value: `<= ${market}`,
          actual_value: String(lendable),
          severity: 'error'
        });
        errorRowIds.add(row.id);
      }
    }
  }
}

async function validateFieldDependency(
  rule: ValidationRule,
  dataRows: any[],
  submissionId: string,
  errors: ValidationError[],
  errorRowIds: Set<string>
) {
  if (rule.rule_name === 'Internal Counterparty Required') {
    for (const row of dataRows) {
      const isInternal = row.internal_flag === 'Yes' || row.internal_flag === 'yes';
      const hasCounterparty = row.internal_counterparty && row.internal_counterparty.trim() !== '';

      if (isInternal && !hasCounterparty) {
        errors.push({
          submission_id: submissionId,
          data_row_id: row.id,
          error_type: 'field_dependency_violation',
          error_message: 'Internal counterparty must be specified when Internal=Yes',
          field_name: 'InternalCounterparty',
          expected_value: 'non-empty value',
          actual_value: row.internal_counterparty || 'null',
          severity: 'error'
        });
        errorRowIds.add(row.id);
      }
    }
  }
}

async function validateDuplicates(
  rule: ValidationRule,
  dataRows: any[],
  submissionId: string,
  errors: ValidationError[],
  errorRowIds: Set<string>
) {
  const seen = new Map<string, string>();

  for (const row of dataRows) {
    const key = [
      row.reporting_entity,
      row.product,
      row.sub_product,
      row.counterparty,
      row.maturity_bucket,
      row.currency
    ].join('|');

    if (seen.has(key)) {
      errors.push({
        submission_id: submissionId,
        data_row_id: row.id,
        error_type: 'duplicate_row',
        error_message: 'Duplicate row detected with identical key fields',
        field_name: null,
        expected_value: 'unique combination',
        actual_value: key,
        severity: 'warning'
      });
      errorRowIds.add(row.id);
      errorRowIds.add(seen.get(key)!);
    } else {
      seen.set(key, row.id);
    }
  }
}

async function validateLegalEntity(
  rule: ValidationRule,
  dataRows: any[],
  submissionId: string,
  errors: ValidationError[],
  errorRowIds: Set<string>
) {
  // Fetch valid legal entities
  const { data: entities } = await supabase
    .from('legal_entities')
    .select('id, entity_name')
    .is('user_id', null);

  if (!entities) return;

  const validEntityIds = new Set(entities.map(e => e.id));

  for (const row of dataRows) {
    if (row.legal_entity_id && !validEntityIds.has(row.legal_entity_id)) {
      errors.push({
        submission_id: submissionId,
        data_row_id: row.id,
        error_type: 'invalid_legal_entity',
        error_message: `Legal entity ID '${row.legal_entity_id}' not found in entity registry`,
        field_name: 'ReportingEntity',
        expected_value: 'valid legal entity ID',
        actual_value: row.legal_entity_id,
        severity: 'error'
      });
      errorRowIds.add(row.id);
    }
  }
}
