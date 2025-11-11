import { supabase } from '../lib/supabase';

export async function seedFR2052aEnumerations() {
  const enumerations = [
    // Maturity Bucket enumerations
    { field_name: 'MaturityBucket', allowed_value: 'Open', description: 'Open maturity' },
    { field_name: 'MaturityBucket', allowed_value: 'Overnight', description: 'Overnight maturity' },
    { field_name: 'MaturityBucket', allowed_value: '2-3 Days', description: '2-3 days maturity' },
    { field_name: 'MaturityBucket', allowed_value: '4-7 Days', description: '4-7 days maturity' },
    { field_name: 'MaturityBucket', allowed_value: '8-14 Days', description: '8-14 days maturity' },
    { field_name: 'MaturityBucket', allowed_value: '15-30 Days', description: '15-30 days maturity' },
    { field_name: 'MaturityBucket', allowed_value: '31-90 Days', description: '31-90 days maturity' },
    { field_name: 'MaturityBucket', allowed_value: '91-180 Days', description: '91-180 days maturity' },
    { field_name: 'MaturityBucket', allowed_value: '181-365 Days', description: '181-365 days maturity' },
    { field_name: 'MaturityBucket', allowed_value: '>365 Days', description: 'Greater than 365 days' },

    // Product enumerations
    { field_name: 'Product', allowed_value: 'Asset', description: 'Asset product' },
    { field_name: 'Product', allowed_value: 'Secured', description: 'Secured product' },
    { field_name: 'Product', allowed_value: 'Unsecured', description: 'Unsecured product' },
    { field_name: 'Product', allowed_value: 'Wholesale', description: 'Wholesale product' },
    { field_name: 'Product', allowed_value: 'Retail', description: 'Retail product' },
    { field_name: 'Product', allowed_value: 'Derivative', description: 'Derivative product' },

    // Counterparty Type enumerations
    { field_name: 'CounterpartyType', allowed_value: 'Financial', description: 'Financial institution' },
    { field_name: 'CounterpartyType', allowed_value: 'NonFinancial', description: 'Non-financial entity' },
    { field_name: 'CounterpartyType', allowed_value: 'Sovereign', description: 'Sovereign entity' },
    { field_name: 'CounterpartyType', allowed_value: 'Central Bank', description: 'Central bank' },
    { field_name: 'CounterpartyType', allowed_value: 'Retail', description: 'Retail counterparty' },

    // Currency enumerations (ISO 4217)
    { field_name: 'Currency', allowed_value: 'USD', description: 'US Dollar' },
    { field_name: 'Currency', allowed_value: 'EUR', description: 'Euro' },
    { field_name: 'Currency', allowed_value: 'GBP', description: 'British Pound' },
    { field_name: 'Currency', allowed_value: 'JPY', description: 'Japanese Yen' },
    { field_name: 'Currency', allowed_value: 'CHF', description: 'Swiss Franc' },
    { field_name: 'Currency', allowed_value: 'CAD', description: 'Canadian Dollar' },
    { field_name: 'Currency', allowed_value: 'AUD', description: 'Australian Dollar' },

    // Internal Flag enumerations
    { field_name: 'Internal', allowed_value: 'Yes', description: 'Internal transaction' },
    { field_name: 'Internal', allowed_value: 'No', description: 'External transaction' },

    // Entity Type enumerations
    { field_name: 'EntityType', allowed_value: 'Category I', description: 'Category I institution' },
    { field_name: 'EntityType', allowed_value: 'Category II', description: 'Category II institution' },
    { field_name: 'EntityType', allowed_value: 'Category III', description: 'Category III institution' },
    { field_name: 'EntityType', allowed_value: 'Category IV', description: 'Category IV institution' },

    // Table Name enumerations
    { field_name: 'TableName', allowed_value: 'InflowsAssets', description: 'Inflows Assets table' },
    { field_name: 'TableName', allowed_value: 'InflowsUnsecured', description: 'Inflows Unsecured table' },
    { field_name: 'TableName', allowed_value: 'OutflowsWholesale', description: 'Outflows Wholesale table' },
    { field_name: 'TableName', allowed_value: 'OutflowsRetail', description: 'Outflows Retail table' },
    { field_name: 'TableName', allowed_value: 'SupplementalBalanceSheet', description: 'Supplemental Balance Sheet' },
    { field_name: 'TableName', allowed_value: 'DerivativeCollateral', description: 'Derivative Collateral table' },
  ];

  const { error } = await supabase
    .from('fr2052a_enumerations')
    .upsert(enumerations, { onConflict: 'field_name,allowed_value' });

  if (error) {
    console.error('Error seeding enumerations:', error);
    return { error };
  }

  return { success: true };
}

export async function seedFR2052aValidationRules() {
  const validationRules = [
    {
      rule_category: 'schema_validation',
      rule_name: 'XML Schema Validation',
      field_name: null,
      allowed_values: null,
      validation_logic: 'Validates that uploaded file conforms to published FR 2052a XSD schema. Checks structure, required elements, and data types.',
      is_active: true,
    },
    {
      rule_category: 'enumeration',
      rule_name: 'Maturity Bucket Validation',
      field_name: 'MaturityBucket',
      allowed_values: null,
      validation_logic: 'Validates that MaturityBucket field contains only allowed enumeration values from approved list.',
      is_active: true,
    },
    {
      rule_category: 'enumeration',
      rule_name: 'Product Type Validation',
      field_name: 'Product',
      allowed_values: null,
      validation_logic: 'Validates that Product field contains only allowed enumeration values.',
      is_active: true,
    },
    {
      rule_category: 'legal_entity',
      rule_name: 'Reporting Entity Integrity',
      field_name: 'ReportingEntity',
      allowed_values: null,
      validation_logic: 'Validates that ReportingEntity is valid (RSSD or LEI), matches entity registry, and consolidation level is appropriate.',
      is_active: true,
    },
    {
      rule_category: 'internal_transaction',
      rule_name: 'Internal Counterparty Symmetry',
      field_name: 'InternalCounterparty',
      allowed_values: null,
      validation_logic: 'When Internal=Yes, validates that InternalCounterparty is present and matching offsetting transaction exists with symmetrical flows.',
      is_active: true,
    },
    {
      rule_category: 'field_dependency',
      rule_name: 'Internal Counterparty Required',
      field_name: 'InternalCounterparty',
      allowed_values: null,
      validation_logic: 'When Internal=Yes, InternalCounterparty field must be populated.',
      is_active: true,
    },
    {
      rule_category: 'cross_field',
      rule_name: 'Lendable Value Check',
      field_name: 'LendableValue',
      allowed_values: null,
      validation_logic: 'Validates that LendableValue <= MarketValue for all asset rows.',
      is_active: true,
    },
    {
      rule_category: 'cross_field',
      rule_name: 'Weekend Maturity Check',
      field_name: 'MaturityDate',
      allowed_values: null,
      validation_logic: 'Validates that maturity dates do not fall on weekends.',
      is_active: true,
    },
    {
      rule_category: 'duplicate',
      rule_name: 'Duplicate Row Check',
      field_name: null,
      allowed_values: null,
      validation_logic: 'Validates no two rows have identical combination of non-numeric fields (ReportingEntity, Product, SubProduct, Counterparty, MaturityBucket, etc.)',
      is_active: true,
    },
    {
      rule_category: 'data_type',
      rule_name: 'Currency Code Validation',
      field_name: 'Currency',
      allowed_values: null,
      validation_logic: 'Validates that Currency field uses valid ISO 4217 currency codes.',
      is_active: true,
    },
    {
      rule_category: 'product_hierarchy',
      rule_name: 'Product-SubProduct Applicability',
      field_name: 'SubProduct',
      allowed_values: null,
      validation_logic: 'Validates that SubProduct values are valid for given Product type based on product hierarchy rules.',
      is_active: true,
    },
    {
      rule_category: 'submission_frequency',
      rule_name: 'Entity Type Submission Mapping',
      field_name: 'EntityType',
      allowed_values: null,
      validation_logic: 'Validates that reporting entity type (Category I/II/III/IV) matches expected submission frequency (daily vs monthly) and product coverage.',
      is_active: true,
    },
  ];

  const { error } = await supabase
    .from('fr2052a_validation_rules')
    .insert(validationRules);

  if (error && error.code !== '23505') {
    console.error('Error seeding validation rules:', error);
    return { error };
  }

  return { success: true };
}

export async function seedFR2052aEntities() {
  const entities = [
    {
      entity_id: '1234567',
      entity_name: 'State Street Corporation',
      entity_type: 'Category II',
      submission_frequency: 'monthly',
      is_active: true,
    },
    {
      entity_id: '1234568',
      entity_name: 'State Street Bank and Trust Company',
      entity_type: 'Category II',
      submission_frequency: 'monthly',
      is_active: true,
    },
  ];

  const { error } = await supabase
    .from('fr2052a_entity_mapping')
    .upsert(entities, { onConflict: 'entity_id' });

  if (error) {
    console.error('Error seeding entities:', error);
    return { error };
  }

  return { success: true };
}

export async function seedAllFR2052aData() {
  console.log('Seeding FR 2052a enumerations...');
  await seedFR2052aEnumerations();

  console.log('Seeding FR 2052a validation rules...');
  await seedFR2052aValidationRules();

  console.log('Seeding FR 2052a entities...');
  await seedFR2052aEntities();

  console.log('FR 2052a data seeding complete!');
}
